// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CorporateWellnessContract
 * @dev Corporate wellness programs with team-based rewards
 */
contract CorporateWellnessContract is Ownable, ReentrancyGuard, Pausable {
    IERC20 public emoToken;
    
    struct CorporateProgram {
        string companyName;
        address programManager;
        uint256 targetAvgFitness;
        uint256 targetParticipationRate;
        uint256 individualRewardEMO;
        uint256 teamBonusEMO;
        bool isActive;
        uint256 createdAt;
    }
    
    struct TeamMetrics {
        uint256 month;
        uint256 avgFitness;
        uint256 participationRate;
        uint256 employeesTracked;
        bool goalsMetFitness;
        bool goalsMetParticipation;
        uint256 timestamp;
    }
    
    struct RewardDistribution {
        uint256 month;
        uint256 totalIndividualRewards;
        uint256 totalTeamBonus;
        uint256 employeesRewarded;
        bool teamGoalsMet;
        uint256 timestamp;
    }
    
    mapping(uint256 => CorporateProgram) public programs;
    mapping(uint256 => address[]) public programEmployees;
    mapping(uint256 => TeamMetrics[]) public teamMetricsHistory;
    mapping(uint256 => RewardDistribution[]) public rewardHistory;
    mapping(uint256 => mapping(address => uint256)) public employeeRewardsEarned;
    
    uint256 public nextProgramId;
    uint256 public totalRewardsDistributed;
    uint256 public totalProgramsCreated;
    
    event ProgramCreated(
        uint256 indexed programId,
        string companyName,
        address indexed manager,
        uint256 employeeCount
    );
    
    event EmployeesRegistered(uint256 indexed programId, uint256 count);
    
    event MetricsRecorded(
        uint256 indexed programId,
        uint256 month,
        uint256 avgFitness,
        uint256 participationRate
    );
    
    event RewardsDistributed(
        uint256 indexed programId,
        uint256 month,
        uint256 totalRewards,
        uint256 employeesRewarded
    );
    
    constructor(address _emoToken) Ownable(msg.sender) {
        emoToken = IERC20(_emoToken);
    }
    
    /**
     * @dev Create corporate wellness program
     */
    function createProgram(
        string memory companyName,
        uint256 employeeCount,
        uint256 targetAvgFitness,
        uint256 targetParticipationRate,
        uint256 individualRewardEMO,
        uint256 teamBonusEMO
    ) external returns (uint256) {
        uint256 programId = nextProgramId++;
        
        programs[programId] = CorporateProgram({
            companyName: companyName,
            programManager: msg.sender,
            targetAvgFitness: targetAvgFitness,
            targetParticipationRate: targetParticipationRate,
            individualRewardEMO: individualRewardEMO,
            teamBonusEMO: teamBonusEMO,
            isActive: true,
            createdAt: block.timestamp
        });
        
        totalProgramsCreated++;
        
        emit ProgramCreated(programId, companyName, msg.sender, employeeCount);
        return programId;
    }
    
    /**
     * @dev Register employees
     */
    function registerEmployees(
        uint256 programId,
        address[] calldata employees
    ) external {
        require(programs[programId].programManager == msg.sender, "Only manager");
        require(programs[programId].isActive, "Program not active");
        
        for (uint256 i = 0; i < employees.length; i++) {
            programEmployees[programId].push(employees[i]);
        }
        
        emit EmployeesRegistered(programId, employees.length);
    }
    
    /**
     * @dev Record team metrics
     */
    function recordTeamMetrics(
        uint256 programId,
        uint256 month,
        uint256 avgFitness,
        uint256 participationRate
    ) external onlyOwner {
        CorporateProgram storage program = programs[programId];
        require(program.isActive, "Program not active");
        
        TeamMetrics memory metrics = TeamMetrics({
            month: month,
            avgFitness: avgFitness,
            participationRate: participationRate,
            employeesTracked: programEmployees[programId].length,
            goalsMetFitness: avgFitness >= program.targetAvgFitness,
            goalsMetParticipation: participationRate >= program.targetParticipationRate,
            timestamp: block.timestamp
        });
        
        teamMetricsHistory[programId].push(metrics);
        
        emit MetricsRecorded(programId, month, avgFitness, participationRate);
    }
    
    /**
     * @dev Distribute monthly rewards
     */
    function distributeMonthlyRewards(
        uint256 programId,
        uint256 month,
        address[] calldata qualifiedEmployees
    ) external onlyOwner nonReentrant {
        CorporateProgram storage program = programs[programId];
        require(program.isActive, "Program not active");
        
        uint256 totalRewards = 0;
        
        // Individual rewards
        for (uint256 i = 0; i < qualifiedEmployees.length; i++) {
            uint256 reward = program.individualRewardEMO;
            require(emoToken.transfer(qualifiedEmployees[i], reward), "Transfer failed");
            employeeRewardsEarned[programId][qualifiedEmployees[i]] += reward;
            totalRewards += reward;
        }
        
        // Check if team goals met for team bonus
        TeamMetrics[] storage metrics = teamMetricsHistory[programId];
        if (metrics.length > 0) {
            TeamMetrics storage latestMetrics = metrics[metrics.length - 1];
            if (latestMetrics.goalsMetFitness && latestMetrics.goalsMetParticipation) {
                uint256 bonusPerEmployee = program.teamBonusEMO / programEmployees[programId].length;
                for (uint256 i = 0; i < programEmployees[programId].length; i++) {
                    require(
                        emoToken.transfer(programEmployees[programId][i], bonusPerEmployee),
                        "Bonus transfer failed"
                    );
                    totalRewards += bonusPerEmployee;
                }
            }
        }
        
        RewardDistribution memory distribution = RewardDistribution({
            month: month,
            totalIndividualRewards: program.individualRewardEMO * qualifiedEmployees.length,
            totalTeamBonus: 0,
            employeesRewarded: qualifiedEmployees.length,
            teamGoalsMet: metrics.length > 0 && metrics[metrics.length - 1].goalsMetFitness,
            timestamp: block.timestamp
        });
        
        rewardHistory[programId].push(distribution);
        totalRewardsDistributed += totalRewards;
        
        emit RewardsDistributed(programId, month, totalRewards, qualifiedEmployees.length);
    }
    
    /**
     * @dev Get program details
     */
    function getProgram(uint256 programId) external view returns (CorporateProgram memory) {
        return programs[programId];
    }
    
    /**
     * @dev Get employee count
     */
    function getEmployeeCount(uint256 programId) external view returns (uint256) {
        return programEmployees[programId].length;
    }
}
