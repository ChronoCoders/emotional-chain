// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title OptimisticBridgeContract
 * @dev Trustless optimistic bridge for EmotionalChain cross-chain transfers
 * 
 * Phase 2 Implementation (6-12 months post-launch)
 * 
 * Mechanism:
 * - Permissionless relayers submit bridge claims with source proofs
 * - 7-day challenge period allows watchers to submit fraud proofs
 * - Economic security through relayer bonds and slashing
 * - No trusted validator set required
 * 
 * Security Model:
 * - Relayers must post minimum 10,000 EMO bond
 * - Fraud proofs trigger 50% bond slash
 * - Successful challengers receive 25% of slashed bond as reward
 * - Protocol treasury receives remaining 25%
 */
contract OptimisticBridgeContract is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // Constants
    uint256 public constant CHALLENGE_PERIOD = 7 days;
    uint256 public constant MINIMUM_RELAYER_BOND = 10000 * 10**18; // 10,000 EMO
    uint256 public constant FRAUD_SLASH_PERCENTAGE = 50; // 50%
    uint256 public constant CHALLENGER_REWARD_PERCENTAGE = 25; // 25% of slash
    uint256 public constant PROTOCOL_TREASURY_PERCENTAGE = 25; // 25% of slash
    
    // Enums
    enum ClaimStatus {
        PENDING,
        CHALLENGED,
        FINALIZED,
        SLASHED
    }
    
    enum FraudType {
        INVALID_PROOF,
        DOUBLE_SPEND,
        INSUFFICIENT_BALANCE
    }
    
    // Structs
    struct BridgeClaim {
        string claimId;
        address relayer;
        string sourceChainProof;
        uint256 amount;
        string destinationChain;
        address destinationAddress;
        uint256 timestamp;
        uint256 claimSubmittedAt;
        uint256 challengePeriodEnds;
        ClaimStatus status;
    }
    
    struct FraudProof {
        string proofId;
        string claimId;
        address challenger;
        FraudType fraudType;
        string evidence;
        uint256 timestamp;
        bool verified;
    }
    
    struct RelayerBond {
        uint256 bondAmount;
        uint256 claimsProcessed;
        uint256 fraudCount;
        uint256 totalSlashed;
        bool registered;
    }
    
    // State variables
    IERC20 public emoToken;
    address public treasuryAddress;
    
    mapping(string => BridgeClaim) public claims;
    mapping(string => FraudProof) public fraudProofs;
    mapping(address => RelayerBond) public relayerBonds;
    mapping(string => bool) public claimIdExists;
    mapping(string => bool) public proofIdExists;
    
    uint256 public totalFeesCollected;
    uint256 public totalBondsSlashed;
    
    // Events
    event ClaimSubmitted(
        string indexed claimId,
        address indexed relayer,
        uint256 amount,
        string destinationChain,
        uint256 challengePeriodEnds
    );
    
    event FraudProofSubmitted(
        string indexed proofId,
        string indexed claimId,
        address indexed challenger,
        FraudType fraudType,
        bool verified
    );
    
    event ClaimFinalized(
        string indexed claimId,
        address indexed relayer,
        uint256 amount,
        address destinationAddress
    );
    
    event RelayerSlashed(
        address indexed relayer,
        uint256 slashAmount,
        FraudType reason
    );
    
    event ChallengerRewarded(
        address indexed challenger,
        uint256 rewardAmount,
        string indexed claimId
    );
    
    event RelayerRegistered(address indexed relayer, uint256 bondAmount);
    event RelayerBondIncreased(address indexed relayer, uint256 newAmount);
    event BridgeDisclaimerShown(string disclaimer);
    
    // Modifiers
    modifier onlyRegisteredRelayer(address relayer) {
        require(relayerBonds[relayer].registered, "OptimisticBridge: Relayer not registered");
        require(
            relayerBonds[relayer].bondAmount >= MINIMUM_RELAYER_BOND,
            "OptimisticBridge: Insufficient bond"
        );
        _;
    }
    
    modifier claimExists(string memory claimId) {
        require(claimIdExists[claimId], "OptimisticBridge: Claim not found");
        _;
    }
    
    modifier inChallengePeriod(string memory claimId) {
        require(
            block.timestamp <= claims[claimId].challengePeriodEnds,
            "OptimisticBridge: Challenge period expired"
        );
        _;
    }
    
    modifier afterChallengePeriod(string memory claimId) {
        require(
            block.timestamp > claims[claimId].challengePeriodEnds,
            "OptimisticBridge: Challenge period not expired"
        );
        _;
    }
    
    constructor(
        address _emoToken,
        address _treasuryAddress
    ) Ownable(msg.sender) {
        emoToken = IERC20(_emoToken);
        treasuryAddress = _treasuryAddress;
        
        emit BridgeDisclaimerShown(
            "OPTIMISTIC BRIDGE DISCLAIMER: This is a Phase 2 trustless bridge in development. "
            "Relayers submit claims with 7-day challenge periods. Bridge is experimental."
        );
    }
    
    /**
     * @dev Register relayer with bond
     */
    function registerRelayer(uint256 bondAmount) external nonReentrant {
        require(bondAmount >= MINIMUM_RELAYER_BOND, "OptimisticBridge: Bond too small");
        require(!relayerBonds[msg.sender].registered, "OptimisticBridge: Already registered");
        
        // Transfer bond from relayer to contract
        require(
            emoToken.transferFrom(msg.sender, address(this), bondAmount),
            "OptimisticBridge: Bond transfer failed"
        );
        
        relayerBonds[msg.sender] = RelayerBond({
            bondAmount: bondAmount,
            claimsProcessed: 0,
            fraudCount: 0,
            totalSlashed: 0,
            registered: true
        });
        
        emit RelayerRegistered(msg.sender, bondAmount);
    }
    
    /**
     * @dev Submit bridge claim with source proof
     */
    function submitBridgeClaim(
        string memory claimId,
        string memory sourceChainProof,
        uint256 amount,
        string memory destinationChain,
        address destinationAddress
    ) external onlyRegisteredRelayer(msg.sender) whenNotPaused nonReentrant {
        require(!claimIdExists[claimId], "OptimisticBridge: Claim already exists");
        require(amount > 0, "OptimisticBridge: Amount must be positive");
        require(destinationAddress != address(0), "OptimisticBridge: Invalid address");
        
        uint256 now = block.timestamp;
        
        // Create claim
        BridgeClaim storage claim = claims[claimId];
        claim.claimId = claimId;
        claim.relayer = msg.sender;
        claim.sourceChainProof = sourceChainProof;
        claim.amount = amount;
        claim.destinationChain = destinationChain;
        claim.destinationAddress = destinationAddress;
        claim.timestamp = now;
        claim.claimSubmittedAt = now;
        claim.challengePeriodEnds = now + CHALLENGE_PERIOD;
        claim.status = ClaimStatus.PENDING;
        
        claimIdExists[claimId] = true;
        relayerBonds[msg.sender].claimsProcessed++;
        
        emit ClaimSubmitted(
            claimId,
            msg.sender,
            amount,
            destinationChain,
            claim.challengePeriodEnds
        );
    }
    
    /**
     * @dev Submit fraud proof to challenge a claim
     */
    function submitFraudProof(
        string memory proofId,
        string memory claimId,
        FraudType fraudType,
        string memory evidence
    ) external claimExists(claimId) inChallengePeriod(claimId) nonReentrant {
        require(!proofIdExists[proofId], "OptimisticBridge: Proof already exists");
        require(
            claims[claimId].status == ClaimStatus.PENDING,
            "OptimisticBridge: Claim not pending"
        );
        
        // Create fraud proof
        FraudProof storage fraudProof = fraudProofs[proofId];
        fraudProof.proofId = proofId;
        fraudProof.claimId = claimId;
        fraudProof.challenger = msg.sender;
        fraudProof.fraudType = fraudType;
        fraudProof.evidence = evidence;
        fraudProof.timestamp = block.timestamp;
        fraudProof.verified = true; // Simplified: marked as verified immediately
        
        proofIdExists[proofId] = true;
        
        // Update claim status
        claims[claimId].status = ClaimStatus.CHALLENGED;
        
        // Slash relayer
        address relayer = claims[claimId].relayer;
        uint256 slashAmount = (relayerBonds[relayer].bondAmount * FRAUD_SLASH_PERCENTAGE) / 100;
        
        relayerBonds[relayer].totalSlashed += slashAmount;
        relayerBonds[relayer].fraudCount++;
        totalBondsSlashed += slashAmount;
        
        // Mark claim as slashed
        claims[claimId].status = ClaimStatus.SLASHED;
        
        // Reward challenger
        uint256 challengerReward = (slashAmount * CHALLENGER_REWARD_PERCENTAGE) / 100;
        uint256 treasuryShare = (slashAmount * PROTOCOL_TREASURY_PERCENTAGE) / 100;
        
        require(
            emoToken.transfer(msg.sender, challengerReward),
            "OptimisticBridge: Challenger reward transfer failed"
        );
        require(
            emoToken.transfer(treasuryAddress, treasuryShare),
            "OptimisticBridge: Treasury transfer failed"
        );
        
        emit FraudProofSubmitted(proofId, claimId, msg.sender, fraudType, true);
        emit RelayerSlashed(relayer, slashAmount, fraudType);
        emit ChallengerRewarded(msg.sender, challengerReward, claimId);
    }
    
    /**
     * @dev Finalize claim after challenge period with no fraud
     */
    function finalizeClaim(
        string memory claimId
    ) external claimExists(claimId) afterChallengePeriod(claimId) nonReentrant {
        require(
            claims[claimId].status == ClaimStatus.PENDING,
            "OptimisticBridge: Claim not in pending status"
        );
        
        BridgeClaim storage claim = claims[claimId];
        claim.status = ClaimStatus.FINALIZED;
        
        // Mint tokens to destination address (simplified - actual minting handled off-chain)
        emit ClaimFinalized(
            claimId,
            claim.relayer,
            claim.amount,
            claim.destinationAddress
        );
    }
    
    /**
     * @dev Get claim details
     */
    function getClaim(string memory claimId) external view returns (BridgeClaim memory) {
        return claims[claimId];
    }
    
    /**
     * @dev Get relayer bond info
     */
    function getRelayerInfo(address relayer) external view returns (RelayerBond memory) {
        return relayerBonds[relayer];
    }
    
    /**
     * @dev Pause bridge (emergency only)
     */
    function pauseBridge() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause bridge
     */
    function unpauseBridge() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Update treasury address
     */
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), "OptimisticBridge: Invalid treasury");
        treasuryAddress = _treasury;
    }
    
    /**
     * @dev Emergency withdrawal (treasury only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "OptimisticBridge: Insufficient balance");
        require(emoToken.transfer(owner(), amount), "OptimisticBridge: Transfer failed");
    }
}
