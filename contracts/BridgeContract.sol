// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title EmotionalChainFederatedBridge
 * @dev Federated 5-of-7 multisig bridge for cross-chain EMO token transfers
 * 
 * Validator Composition:
 * - 3 team members (decision makers)
 * - 2 independent auditors (security oversight)
 * - 2 community elected (decentralization)
 * 
 * Bridge is honest about its centralized nature while maintaining security through:
 * - Multiple independent parties
 * - Public validator disclosures
 * - Transparent signing requirements
 * - Clear disclaimer to users
 */
contract EmotionalChainFederatedBridge is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // Validator roles for transparency
    enum ValidatorRole {
        TEAM,
        AUDITOR,
        COMMUNITY
    }
    
    // Bridge state
    struct BridgeValidator {
        address validatorAddress;
        string name;
        ValidatorRole role;
        bool active;
        uint256 signedCount;
        uint256 missedCount;
    }
    
    struct BridgeRequest {
        bytes32 requestId;
        address sender;
        address recipient;
        uint256 amount;
        string sourceChain;
        string destinationChain;
        uint256 timestamp;
        bytes32 lockTxHash;
        BridgeRequestStatus status;
        uint256 signatureCount;
    }
    
    enum BridgeRequestStatus {
        PENDING,
        SIGNED,
        MINTED,
        FAILED,
        CANCELLED
    }
    
    // State variables
    IERC20 public emoToken;
    
    BridgeValidator[] public validators;
    mapping(address => uint256) public validatorIndex;
    mapping(address => bool) public isValidator;
    
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(bytes32 => mapping(address => bool)) public hasValidatorSigned;
    
    uint256 public constant REQUIRED_SIGNATURES = 5;
    uint256 public constant TOTAL_VALIDATORS = 7;
    
    // Fee structure
    uint256 public bridgeFeePercentage = 25; // 0.25% = 25 basis points
    uint256 public feesCollected;
    
    // Supported chains
    mapping(string => bool) public supportedChains;
    mapping(string => uint256) public chainMinAmount;
    mapping(string => uint256) public chainMaxAmount;
    
    // Events
    event ValidatorAdded(address indexed validator, string name, ValidatorRole role);
    event ValidatorRemoved(address indexed validator);
    event BridgeRequestCreated(
        bytes32 indexed requestId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string sourceChain,
        string destinationChain
    );
    event ValidatorSigned(
        bytes32 indexed requestId,
        address indexed validator,
        uint256 signatureCount
    );
    event BridgeRequestMinted(
        bytes32 indexed requestId,
        address indexed recipient,
        uint256 amount,
        string destinationChain
    );
    event BridgeRequestFailed(bytes32 indexed requestId, string reason);
    event FeeCollected(uint256 amount);
    event BridgeDisclaimerShown(string disclaimer);
    
    // Modifiers
    modifier onlyValidator() {
        require(isValidator[msg.sender], "FederatedBridge: Not a validator");
        _;
    }
    
    modifier validChain(string memory chain) {
        require(supportedChains[chain], "FederatedBridge: Chain not supported");
        _;
    }
    
    constructor(
        address _emoToken,
        address[] memory _initialValidators,
        string[] memory _validatorNames,
        ValidatorRole[] memory _validatorRoles
    ) Ownable(msg.sender) {
        require(_initialValidators.length == TOTAL_VALIDATORS, "FederatedBridge: Must have exactly 7 validators");
        require(_validatorNames.length == TOTAL_VALIDATORS, "FederatedBridge: Name count mismatch");
        require(_validatorRoles.length == TOTAL_VALIDATORS, "FederatedBridge: Role count mismatch");
        
        emoToken = IERC20(_emoToken);
        
        // Initialize validators with role-based structure
        uint256 teamCount = 0;
        uint256 auditorCount = 0;
        uint256 communityCount = 0;
        
        for (uint256 i = 0; i < TOTAL_VALIDATORS; i++) {
            require(_initialValidators[i] != address(0), "FederatedBridge: Invalid validator address");
            
            // Enforce validator composition: 3 team, 2 auditors, 2 community
            if (_validatorRoles[i] == ValidatorRole.TEAM) {
                require(teamCount < 3, "FederatedBridge: Too many team validators");
                teamCount++;
            } else if (_validatorRoles[i] == ValidatorRole.AUDITOR) {
                require(auditorCount < 2, "FederatedBridge: Too many auditor validators");
                auditorCount++;
            } else {
                require(communityCount < 2, "FederatedBridge: Too many community validators");
                communityCount++;
            }
            
            BridgeValidator memory validator = BridgeValidator({
                validatorAddress: _initialValidators[i],
                name: _validatorNames[i],
                role: _validatorRoles[i],
                active: true,
                signedCount: 0,
                missedCount: 0
            });
            
            validators.push(validator);
            validatorIndex[_initialValidators[i]] = i;
            isValidator[_initialValidators[i]] = true;
            
            emit ValidatorAdded(_initialValidators[i], _validatorNames[i], _validatorRoles[i]);
        }
        
        // Initialize supported chains
        _initializeChains();
        
        // Show disclaimer on construction
        emit BridgeDisclaimerShown(
            "FEDERATED BRIDGE DISCLAIMER: This bridge uses a 5-of-7 multisig validator set (3 team, 2 auditors, 2 community). "
            "This is a TRUSTED bridge requiring validator coordination. Bridge transfers may experience delays and are subject to rollback."
        );
    }
    
    /**
     * @dev Bridge EMO tokens to another chain
     */
    function bridgeTokens(
        address recipient,
        uint256 amount,
        string memory destinationChain,
        bytes32 lockTxHash
    ) external validChain(destinationChain) whenNotPaused nonReentrant returns (bytes32) {
        require(recipient != address(0), "FederatedBridge: Invalid recipient");
        require(amount > 0, "FederatedBridge: Amount must be positive");
        require(amount >= chainMinAmount[destinationChain], "FederatedBridge: Amount below minimum");
        require(amount <= chainMaxAmount[destinationChain], "FederatedBridge: Amount exceeds maximum");
        
        // Calculate fee
        uint256 fee = (amount * bridgeFeePercentage) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        // Transfer tokens from sender to bridge (including fee)
        require(
            emoToken.transferFrom(msg.sender, address(this), amount),
            "FederatedBridge: Token transfer failed"
        );
        
        // Record fee
        feesCollected += fee;
        emit FeeCollected(fee);
        
        // Create bridge request
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amountAfterFee,
            destinationChain,
            block.timestamp,
            lockTxHash
        ));
        
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.sender == address(0), "FederatedBridge: Request already exists");
        
        request.requestId = requestId;
        request.sender = msg.sender;
        request.recipient = recipient;
        request.amount = amountAfterFee;
        request.sourceChain = "emotionalchain";
        request.destinationChain = destinationChain;
        request.timestamp = block.timestamp;
        request.lockTxHash = lockTxHash;
        request.status = BridgeRequestStatus.PENDING;
        request.signatureCount = 0;
        
        emit BridgeRequestCreated(
            requestId,
            msg.sender,
            recipient,
            amountAfterFee,
            "emotionalchain",
            destinationChain
        );
        
        return requestId;
    }
    
    /**
     * @dev Validator signs a bridge request
     */
    function signBridgeRequest(bytes32 requestId) external onlyValidator whenNotPaused {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.sender != address(0), "FederatedBridge: Request not found");
        require(request.status == BridgeRequestStatus.PENDING, "FederatedBridge: Request not pending");
        require(!hasValidatorSigned[requestId][msg.sender], "FederatedBridge: Already signed");
        
        hasValidatorSigned[requestId][msg.sender] = true;
        request.signatureCount++;
        
        // Update validator stats
        uint256 idx = validatorIndex[msg.sender];
        validators[idx].signedCount++;
        
        emit ValidatorSigned(requestId, msg.sender, request.signatureCount);
        
        // Check if we have enough signatures
        if (request.signatureCount >= REQUIRED_SIGNATURES) {
            request.status = BridgeRequestStatus.SIGNED;
        }
    }
    
    /**
     * @dev Complete bridge request after minting on destination chain
     */
    function completeBridgeRequest(
        bytes32 requestId,
        bytes32 mintTxHash
    ) external onlyValidator whenNotPaused nonReentrant {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.sender != address(0), "FederatedBridge: Request not found");
        require(request.status == BridgeRequestStatus.SIGNED, "FederatedBridge: Request not signed");
        require(request.signatureCount >= REQUIRED_SIGNATURES, "FederatedBridge: Insufficient signatures");
        
        request.status = BridgeRequestStatus.MINTED;
        
        emit BridgeRequestMinted(
            requestId,
            request.recipient,
            request.amount,
            request.destinationChain
        );
    }
    
    /**
     * @dev Fail a bridge request (emergency function)
     */
    function failBridgeRequest(
        bytes32 requestId,
        string memory reason
    ) external onlyValidator whenNotPaused nonReentrant {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.sender != address(0), "FederatedBridge: Request not found");
        require(request.status != BridgeRequestStatus.MINTED, "FederatedBridge: Already minted");
        
        request.status = BridgeRequestStatus.FAILED;
        
        // Return tokens to sender (without fee)
        require(
            emoToken.transfer(request.sender, request.amount),
            "FederatedBridge: Refund failed"
        );
        
        emit BridgeRequestFailed(requestId, reason);
    }
    
    /**
     * @dev Get bridge request status
     */
    function getBridgeRequest(bytes32 requestId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        string memory destinationChain,
        uint256 signatureCount,
        BridgeRequestStatus status
    ) {
        BridgeRequest storage request = bridgeRequests[requestId];
        return (
            request.sender,
            request.recipient,
            request.amount,
            request.destinationChain,
            request.signatureCount,
            request.status
        );
    }
    
    /**
     * @dev Get validator information
     */
    function getValidator(uint256 index) external view returns (
        address validatorAddress,
        string memory name,
        ValidatorRole role,
        bool active,
        uint256 signedCount
    ) {
        require(index < validators.length, "FederatedBridge: Invalid index");
        BridgeValidator storage validator = validators[index];
        return (
            validator.validatorAddress,
            validator.name,
            validator.role,
            validator.active,
            validator.signedCount
        );
    }
    
    /**
     * @dev Get all validators count
     */
    function getValidatorCount() external view returns (uint256) {
        return validators.length;
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(amount <= feesCollected, "FederatedBridge: Insufficient fees");
        feesCollected -= amount;
        require(emoToken.transfer(owner(), amount), "FederatedBridge: Withdrawal failed");
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
     * @dev Initialize supported chains
     */
    function _initializeChains() internal {
        supportedChains["ethereum"] = true;
        chainMinAmount["ethereum"] = 1 ether; // 1 EMO
        chainMaxAmount["ethereum"] = 1000000 ether; // 1M EMO
        
        supportedChains["polygon"] = true;
        chainMinAmount["polygon"] = 1 ether; // 1 EMO
        chainMaxAmount["polygon"] = 1000000 ether; // 1M EMO
        
        supportedChains["bsc"] = true;
        chainMinAmount["bsc"] = 1 ether; // 1 EMO
        chainMaxAmount["bsc"] = 1000000 ether; // 1M EMO
    }
}
