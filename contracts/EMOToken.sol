// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EMOToken - Native EmotionalChain Token
 * @dev ERC20 token with biometric validation and emotional consensus features
 * 
 * Key Features:
 * - ERC20 compliant with OpenZeppelin extensions
 * - Emotional score-based transfer restrictions
 * - Biometric authentication requirements
 * - Cross-chain bridge compatibility
 * - Wellness reward pools
 * - Staking mechanisms with emotional multipliers
 */
contract EMOToken is ERC20, ERC20Burnable, ERC20Permit, Ownable, Pausable, ReentrancyGuard {
    
    // Token Economics Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion EMO
    uint256 public constant STAKING_POOL = 400_000_000 * 10**18;
    uint256 public constant WELLNESS_POOL = 200_000_000 * 10**18;
    uint256 public constant ECOSYSTEM_POOL = 250_000_000 * 10**18;
    uint256 public constant TEAM_ALLOCATION = 150_000_000 * 10**18;
    
    // Emotional Validation Thresholds
    uint256 public emotionalThreshold = 75; // Minimum emotional score for sensitive operations
    uint256 public authenticityThreshold = 90; // Minimum authenticity for high-value transfers
    
    // Biometric Authentication
    struct BiometricProof {
        uint256 heartRate;
        uint256 stressLevel;
        uint256 focusLevel;
        uint256 emotionalScore;
        uint256 authenticity;
        uint256 timestamp;
        bytes32 proofHash;
        bool verified;
    }
    
    // Validator Information
    struct ValidatorInfo {
        bool isActive;
        uint256 stakedAmount;
        uint256 emotionalScore;
        uint256 lastActivity;
        address rewardRecipient;
    }
    
    // Staking Information
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 emotionalMultiplier;
        uint256 wellnessMultiplier;
        uint256 rewardsClaimed;
    }
    
    // State Variables
    mapping(address => BiometricProof) public biometricProofs;
    mapping(address => ValidatorInfo) public validators;
    mapping(address => StakeInfo) public stakes;
    mapping(address => bool) public bridgeContracts;
    mapping(address => uint256) public emotionalScores;
    
    // Pool Tracking
    uint256 public stakingPoolRemaining = STAKING_POOL;
    uint256 public wellnessPoolRemaining = WELLNESS_POOL;
    uint256 public ecosystemPoolRemaining = ECOSYSTEM_POOL;
    uint256 public teamAllocationRemaining = TEAM_ALLOCATION;
    
    // Reward Rates (basis points - 10000 = 100%)
    uint256 public baseStakingRate = 500; // 5% APY
    uint256 public maxWellnessMultiplier = 150; // 1.5x
    uint256 public maxAuthenticityMultiplier = 200; // 2.0x
    
    // Cross-chain Bridge Support
    bool public bridgeEnabled = true;
    uint256 public bridgeFee = 1 * 10**16; // 0.01 EMO bridge fee
    
    // Events
    event BiometricProofSubmitted(address indexed user, uint256 emotionalScore, bytes32 proofHash);
    event ValidatorRegistered(address indexed validator, uint256 stakedAmount);
    event ValidatorSlashed(address indexed validator, uint256 slashedAmount, string reason);
    event StakeDeposited(address indexed staker, uint256 amount);
    event StakeWithdrawn(address indexed staker, uint256 amount, uint256 rewards);
    event WellnessRewardDistributed(address indexed recipient, uint256 amount, uint256 emotionalScore);
    event BridgeTransfer(address indexed from, address indexed to, uint256 amount, string targetChain);
    event EmergencyPause(string reason);
    
    // Modifiers
    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "EMO: Not an active validator");
        _;
    }
    
    modifier requireEmotionalAuth(uint256 minScore) {
        require(emotionalScores[msg.sender] >= minScore, "EMO: Insufficient emotional score");
        require(
            biometricProofs[msg.sender].verified && 
            biometricProofs[msg.sender].timestamp > block.timestamp - 3600,
            "EMO: Recent biometric proof required"
        );
        _;
    }
    
    modifier onlyBridge() {
        require(bridgeContracts[msg.sender], "EMO: Unauthorized bridge contract");
        _;
    }
    
    constructor(
        address initialOwner,
        address[] memory initialValidators,
        uint256[] memory initialStakes
    ) 
        ERC20("EmotionalChain Token", "EMO") 
        ERC20Permit("EmotionalChain Token")
        Ownable(initialOwner)
    {
        require(initialValidators.length == initialStakes.length, "EMO: Mismatched validator arrays");
        
        // Mint initial supply to contract for controlled distribution
        _mint(address(this), MAX_SUPPLY);
        
        // Initialize validators
        for (uint256 i = 0; i < initialValidators.length; i++) {
            _registerValidator(initialValidators[i], initialStakes[i]);
        }
    }
    
    /**
     * @dev Submit biometric proof for emotional validation
     * @param heartRate Heart rate in BPM
     * @param stressLevel Stress level (0-100)
     * @param focusLevel Focus level (0-100)
     * @param authenticity Authenticity score (0-100)
     * @param proofHash Zero-knowledge proof hash
     */
    function submitBiometricProof(
        uint256 heartRate,
        uint256 stressLevel,
        uint256 focusLevel,
        uint256 authenticity,
        bytes32 proofHash
    ) external nonReentrant {
        require(heartRate >= 40 && heartRate <= 200, "EMO: Invalid heart rate");
        require(stressLevel <= 100, "EMO: Invalid stress level");
        require(focusLevel <= 100, "EMO: Invalid focus level");
        require(authenticity <= 100, "EMO: Invalid authenticity");
        
        // Calculate emotional score using EmotionalChain algorithm
        uint256 emotionalScore = _calculateEmotionalScore(heartRate, stressLevel, focusLevel, authenticity);
        
        biometricProofs[msg.sender] = BiometricProof({
            heartRate: heartRate,
            stressLevel: stressLevel,
            focusLevel: focusLevel,
            emotionalScore: emotionalScore,
            authenticity: authenticity,
            timestamp: block.timestamp,
            proofHash: proofHash,
            verified: true
        });
        
        emotionalScores[msg.sender] = emotionalScore;
        
        emit BiometricProofSubmitted(msg.sender, emotionalScore, proofHash);
        
        // Distribute wellness reward if eligible
        if (emotionalScore >= 80 && wellnessPoolRemaining > 0) {
            uint256 reward = _calculateWellnessReward(emotionalScore);
            if (reward <= wellnessPoolRemaining) {
                wellnessPoolRemaining -= reward;
                _transfer(address(this), msg.sender, reward);
                emit WellnessRewardDistributed(msg.sender, reward, emotionalScore);
            }
        }
    }
    
    /**
     * @dev Transfer with emotional authentication requirement
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferWithEmotionalAuth(
        address to, 
        uint256 amount
    ) external requireEmotionalAuth(emotionalThreshold) nonReentrant returns (bool) {
        // High-value transfers require higher authentication
        if (amount > 10000 * 10**18) { // > 10,000 EMO
            require(
                biometricProofs[msg.sender].authenticity >= authenticityThreshold,
                "EMO: High-value transfer requires higher authenticity"
            );
        }
        
        return transfer(to, amount);
    }
    
    /**
     * @dev Register as validator with stake
     * @param stakeAmount Amount to stake (minimum 10,000 EMO)
     */
    function registerValidator(uint256 stakeAmount) external requireEmotionalAuth(75) {
        require(stakeAmount >= 10000 * 10**18, "EMO: Minimum stake is 10,000 EMO");
        require(!validators[msg.sender].isActive, "EMO: Already a validator");
        
        // Transfer stake to contract
        _transfer(msg.sender, address(this), stakeAmount);
        
        _registerValidator(msg.sender, stakeAmount);
    }
    
    /**
     * @dev Stake EMO tokens for rewards
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external requireEmotionalAuth(60) nonReentrant {
        require(amount > 0, "EMO: Cannot stake zero amount");
        require(stakingPoolRemaining > 0, "EMO: Staking pool exhausted");
        
        // Calculate multipliers based on current emotional state
        uint256 emotionalMultiplier = _calculateEmotionalMultiplier(emotionalScores[msg.sender]);
        uint256 wellnessMultiplier = _calculateWellnessMultiplier(emotionalScores[msg.sender]);
        
        // Transfer tokens to staking
        _transfer(msg.sender, address(this), amount);
        
        // Update stake info
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Claim pending rewards before updating stake
        if (userStake.amount > 0) {
            uint256 pendingRewards = calculateStakingRewards(msg.sender);
            if (pendingRewards > 0 && stakingPoolRemaining >= pendingRewards) {
                stakingPoolRemaining -= pendingRewards;
                userStake.rewardsClaimed += pendingRewards;
                _transfer(address(this), msg.sender, pendingRewards);
            }
        }
        
        userStake.amount += amount;
        userStake.timestamp = block.timestamp;
        userStake.emotionalMultiplier = emotionalMultiplier;
        userStake.wellnessMultiplier = wellnessMultiplier;
        
        emit StakeDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Unstake EMO tokens and claim rewards
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "EMO: Insufficient staked amount");
        require(block.timestamp >= userStake.timestamp + 7 days, "EMO: Minimum staking period not met");
        
        // Calculate and distribute rewards
        uint256 rewards = calculateStakingRewards(msg.sender);
        if (rewards > 0 && stakingPoolRemaining >= rewards) {
            stakingPoolRemaining -= rewards;
            userStake.rewardsClaimed += rewards;
        }
        
        // Update stake
        userStake.amount -= amount;
        
        // Transfer principal + rewards
        uint256 totalWithdrawal = amount + rewards;
        _transfer(address(this), msg.sender, totalWithdrawal);
        
        emit StakeWithdrawn(msg.sender, amount, rewards);
    }
    
    /**
     * @dev Bridge EMO tokens to another chain
     * @param amount Amount to bridge
     * @param targetChain Target blockchain identifier
     * @param targetAddress Recipient address on target chain
     */
    function bridgeToChain(
        uint256 amount,
        string calldata targetChain,
        address targetAddress
    ) external requireEmotionalAuth(emotionalThreshold) nonReentrant {
        require(bridgeEnabled, "EMO: Bridge is disabled");
        require(amount > bridgeFee, "EMO: Amount must exceed bridge fee");
        require(targetAddress != address(0), "EMO: Invalid target address");
        
        uint256 netAmount = amount - bridgeFee;
        
        // Burn tokens (they will be minted on target chain)
        _burn(msg.sender, amount);
        
        // Bridge fee goes to ecosystem pool
        ecosystemPoolRemaining += bridgeFee;
        
        emit BridgeTransfer(msg.sender, targetAddress, netAmount, targetChain);
    }
    
    /**
     * @dev Mint tokens for bridge operations (only authorized bridges)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function bridgeMint(address to, uint256 amount) external onlyBridge {
        require(totalSupply() + amount <= MAX_SUPPLY, "EMO: Would exceed max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Calculate staking rewards for a user
     * @param staker Staker address
     * @return Pending rewards amount
     */
    function calculateStakingRewards(address staker) public view returns (uint256) {
        StakeInfo memory userStake = stakes[staker];
        if (userStake.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - userStake.timestamp;
        uint256 baseReward = (userStake.amount * baseStakingRate * stakingDuration) / (365 days * 10000);
        
        // Apply multipliers
        uint256 totalMultiplier = (userStake.emotionalMultiplier * userStake.wellnessMultiplier) / 100;
        uint256 boostedReward = (baseReward * totalMultiplier) / 100;
        
        return boostedReward;
    }
    
    /**
     * @dev Calculate emotional score from biometric data
     */
    function _calculateEmotionalScore(
        uint256 heartRate,
        uint256 stressLevel,
        uint256 focusLevel,
        uint256 authenticity
    ) internal pure returns (uint256) {
        // Normalize heart rate (60-100 BPM optimal range)
        uint256 normalizedHR = heartRate >= 60 && heartRate <= 100 ? 100 : 
                              (heartRate < 60 ? (heartRate * 100) / 60 : (200 - heartRate) * 100 / 100);
        
        // Calculate composite emotional score
        uint256 emotionalScore = (
            (100 - stressLevel) * 30 +  // 30% weight for low stress
            focusLevel * 30 +           // 30% weight for focus
            authenticity * 40           // 40% weight for authenticity
        ) / 100;
        
        return emotionalScore;
    }
    
    /**
     * @dev Calculate wellness reward based on emotional score
     */
    function _calculateWellnessReward(uint256 emotionalScore) internal pure returns (uint256) {
        if (emotionalScore >= 95) return 100 * 10**18; // 100 EMO for exceptional wellness
        if (emotionalScore >= 90) return 50 * 10**18;  // 50 EMO for excellent wellness
        if (emotionalScore >= 85) return 25 * 10**18;  // 25 EMO for good wellness
        if (emotionalScore >= 80) return 10 * 10**18;  // 10 EMO for basic wellness
        return 0;
    }
    
    /**
     * @dev Calculate emotional multiplier for staking rewards
     */
    function _calculateEmotionalMultiplier(uint256 emotionalScore) internal pure returns (uint256) {
        if (emotionalScore >= 90) return 150; // 1.5x multiplier
        if (emotionalScore >= 80) return 120; // 1.2x multiplier
        if (emotionalScore >= 70) return 110; // 1.1x multiplier
        return 100; // 1.0x (no multiplier)
    }
    
    /**
     * @dev Calculate wellness multiplier for staking rewards
     */
    function _calculateWellnessMultiplier(uint256 emotionalScore) internal pure returns (uint256) {
        if (emotionalScore >= 95) return 200; // 2.0x multiplier for exceptional wellness
        if (emotionalScore >= 85) return 150; // 1.5x multiplier for high wellness
        if (emotionalScore >= 75) return 125; // 1.25x multiplier for good wellness
        return 100; // 1.0x (no multiplier)
    }
    
    /**
     * @dev Internal validator registration
     */
    function _registerValidator(address validator, uint256 stakeAmount) internal {
        validators[validator] = ValidatorInfo({
            isActive: true,
            stakedAmount: stakeAmount,
            emotionalScore: 75, // Default starting score
            lastActivity: block.timestamp,
            rewardRecipient: validator
        });
        
        emit ValidatorRegistered(validator, stakeAmount);
    }
    
    // Admin Functions
    function setBridgeContract(address bridge, bool enabled) external onlyOwner {
        bridgeContracts[bridge] = enabled;
    }
    
    function setEmotionalThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "EMO: Invalid threshold");
        emotionalThreshold = threshold;
    }
    
    function setAuthenticityThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "EMO: Invalid threshold");
        authenticityThreshold = threshold;
    }
    
    function setBridgeFee(uint256 fee) external onlyOwner {
        bridgeFee = fee;
    }
    
    function toggleBridge() external onlyOwner {
        bridgeEnabled = !bridgeEnabled;
    }
    
    function emergencyPause(string calldata reason) external onlyOwner {
        _pause();
        emit EmergencyPause(reason);
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override transfer functions to include pause functionality
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}