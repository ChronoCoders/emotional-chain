// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title WellnessInsuranceContract
 * @dev Insurance policies with dynamic premiums based on emotional fitness
 */
contract WellnessInsuranceContract is Ownable, ReentrancyGuard, Pausable {
    IERC20 public stablecoin; // USD stablecoin
    
    struct InsurancePolicy {
        address policyHolder;
        uint256 baseMonthlyPremiumUSD;
        bool isActive;
        uint256 createdAt;
        uint256 lastPremiumCharged;
    }
    
    struct PremiumAdjustment {
        uint256 policyId;
        uint256 month;
        uint256 averageFitness;
        uint256 discountPercentage;
        uint256 baseAmount;
        uint256 finalPremium;
        uint256 timestamp;
    }
    
    struct InsuranceClaim {
        uint256 claimId;
        uint256 policyId;
        string claimType;
        uint256 amount;
        string status; // pending, approved, rejected, paid
        uint256 timestamp;
    }
    
    mapping(uint256 => InsurancePolicy) public policies;
    mapping(uint256 => PremiumAdjustment[]) public premiumHistory;
    mapping(uint256 => InsuranceClaim[]) public claims;
    
    uint256 public nextPolicyId;
    uint256 public nextClaimId;
    uint256 public totalPremiumsCollected;
    uint256 public totalDiscountsGiven;
    uint256 public totalClaimsPaid;
    
    event PolicyCreated(uint256 indexed policyId, address indexed policyHolder, uint256 basePremium);
    event PremiumCharged(uint256 indexed policyId, uint256 month, uint256 finalPremium, uint256 discount);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, uint256 amount);
    event ClaimApproved(uint256 indexed claimId, uint256 amount);
    event PolicyCancelled(uint256 indexed policyId);
    
    constructor(address _stablecoin) Ownable(msg.sender) {
        stablecoin = IERC20(_stablecoin);
    }
    
    /**
     * @dev Create insurance policy
     */
    function createPolicy(
        uint256 baseMonthlyPremiumUSD
    ) external returns (uint256) {
        require(baseMonthlyPremiumUSD > 0, "Premium must be greater than 0");
        
        uint256 policyId = nextPolicyId++;
        
        policies[policyId] = InsurancePolicy({
            policyHolder: msg.sender,
            baseMonthlyPremiumUSD: baseMonthlyPremiumUSD,
            isActive: true,
            createdAt: block.timestamp,
            lastPremiumCharged: 0
        });
        
        emit PolicyCreated(policyId, msg.sender, baseMonthlyPremiumUSD);
        return policyId;
    }
    
    /**
     * @dev Charge premium with fitness-based discount
     * averageFitness: 0-100 scale
     */
    function chargePremium(
        uint256 policyId,
        uint256 month,
        uint256 averageFitness
    ) external onlyOwner nonReentrant returns (uint256) {
        InsurancePolicy storage policy = policies[policyId];
        require(policy.isActive, "Policy not active");
        
        // Calculate discount tier
        uint256 discountPercentage = 0;
        if (averageFitness >= 90) {
            discountPercentage = 15; // Gold tier
        } else if (averageFitness >= 80) {
            discountPercentage = 10; // Silver tier
        } else if (averageFitness >= 70) {
            discountPercentage = 5; // Bronze tier
        }
        
        // Calculate final premium
        uint256 discountAmount = (policy.baseMonthlyPremiumUSD * discountPercentage) / 100;
        uint256 finalPremium = policy.baseMonthlyPremiumUSD - discountAmount;
        
        // Record adjustment
        PremiumAdjustment memory adjustment = PremiumAdjustment({
            policyId: policyId,
            month: month,
            averageFitness: averageFitness,
            discountPercentage: discountPercentage,
            baseAmount: policy.baseMonthlyPremiumUSD,
            finalPremium: finalPremium,
            timestamp: block.timestamp
        });
        
        premiumHistory[policyId].push(adjustment);
        
        // Update statistics
        totalPremiumsCollected += finalPremium;
        totalDiscountsGiven += discountAmount;
        policy.lastPremiumCharged = block.timestamp;
        
        emit PremiumCharged(policyId, month, finalPremium, discountPercentage);
        return finalPremium;
    }
    
    /**
     * @dev Submit insurance claim
     */
    function submitClaim(
        uint256 policyId,
        string memory claimType,
        uint256 amount
    ) external returns (uint256) {
        require(policies[policyId].policyHolder == msg.sender, "Not policy holder");
        require(policies[policyId].isActive, "Policy not active");
        
        uint256 claimId = nextClaimId++;
        
        InsuranceClaim memory claim = InsuranceClaim({
            claimId: claimId,
            policyId: policyId,
            claimType: claimType,
            amount: amount,
            status: "pending",
            timestamp: block.timestamp
        });
        
        claims[policyId].push(claim);
        
        emit ClaimSubmitted(claimId, policyId, amount);
        return claimId;
    }
    
    /**
     * @dev Approve and pay claim
     */
    function approveClaim(uint256 policyId, uint256 claimIndex) external onlyOwner nonReentrant {
        require(claimIndex < claims[policyId].length, "Invalid claim");
        
        InsuranceClaim storage claim = claims[policyId][claimIndex];
        require(
            keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("pending")),
            "Claim not pending"
        );
        
        claim.status = "approved";
        
        // Transfer to policy holder
        require(
            stablecoin.transfer(policies[policyId].policyHolder, claim.amount),
            "Payment failed"
        );
        
        totalClaimsPaid += claim.amount;
        emit ClaimApproved(claim.claimId, claim.amount);
    }
    
    /**
     * @dev Cancel policy
     */
    function cancelPolicy(uint256 policyId) external {
        require(policies[policyId].policyHolder == msg.sender, "Only holder can cancel");
        policies[policyId].isActive = false;
        emit PolicyCancelled(policyId);
    }
    
    /**
     * @dev Get policy details
     */
    function getPolicy(uint256 policyId) external view returns (InsurancePolicy memory) {
        return policies[policyId];
    }
    
    /**
     * @dev Get premium history
     */
    function getPremiumHistory(uint256 policyId) external view returns (PremiumAdjustment[] memory) {
        return premiumHistory[policyId];
    }
}
