// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "../EMOToken.sol";

/**
 * @title EMOBridge - Cross-chain bridge for EMO tokens
 * @dev Supports bridging to Ethereum, Polygon, and other EVM-compatible chains
 * 
 * Supported Protocols:
 * - LayerZero for omnichain functionality
 * - Axelar for cross-chain messaging
 * - Wormhole for multi-chain bridging
 * - Custom relayer network with validator consensus
 */
contract EMOBridge is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // Supported chains
    enum Chain {
        ETHEREUM,
        POLYGON,
        BSC,
        AVALANCHE,
        ARBITRUM,
        OPTIMISM
    }
    
    // Bridge protocols
    enum Protocol {
        LAYERZERO,
        AXELAR,
        WORMHOLE,
        CUSTOM_RELAYER
    }
    
    struct BridgeRequest {
        address sender;
        address recipient;
        uint256 amount;
        Chain targetChain;
        Protocol protocol;
        uint256 nonce;
        uint256 timestamp;
        bytes32 txHash;
        bool processed;
        bool completed;
    }
    
    struct ChainConfig {
        bool enabled;
        address bridgeAddress;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee;
        Protocol[] supportedProtocols;
    }
    
    struct ValidatorSignature {
        address validator;
        bytes signature;
        uint256 timestamp;
    }
    
    // State variables
    EMOToken public immutable emoToken;
    
    mapping(Chain => ChainConfig) public chainConfigs;
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(address => bool) public validators;
    mapping(bytes32 => mapping(address => bool)) public validatorVotes;
    mapping(bytes32 => uint256) public validatorVoteCount;
    mapping(address => uint256) public nonces;
    
    uint256 public validatorCount;
    uint256 public requiredValidatorSignatures = 3;
    uint256 public bridgeFee = 1 * 10**16; // 0.01 EMO
    
    // LayerZero integration
    address public layerZeroEndpoint;
    mapping(Chain => uint16) public layerZeroChainIds;
    
    // Axelar integration
    address public axelarGateway;
    mapping(Chain => string) public axelarChainNames;
    
    // Wormhole integration
    address public wormholeCore;
    mapping(Chain => uint16) public wormholeChainIds;
    
    // Events
    event BridgeRequestCreated(
        bytes32 indexed requestId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        Chain targetChain,
        Protocol protocol
    );
    
    event BridgeRequestSigned(
        bytes32 indexed requestId,
        address indexed validator,
        uint256 voteCount
    );
    
    event BridgeRequestCompleted(
        bytes32 indexed requestId,
        bytes32 indexed targetTxHash
    );
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    
    event ChainConfigUpdated(
        Chain indexed chain,
        bool enabled,
        address bridgeAddress,
        uint256 fee
    );
    
    // Modifiers
    modifier onlyValidator() {
        require(validators[msg.sender], "EMOBridge: Not a validator");
        _;
    }
    
    modifier validChain(Chain chain) {
        require(chainConfigs[chain].enabled, "EMOBridge: Chain not supported");
        _;
    }
    
    constructor(
        address _emoToken,
        address _layerZeroEndpoint,
        address _axelarGateway,
        address _wormholeCore,
        address[] memory _initialValidators
    ) Ownable(msg.sender) {
        emoToken = EMOToken(_emoToken);
        layerZeroEndpoint = _layerZeroEndpoint;
        axelarGateway = _axelarGateway;
        wormholeCore = _wormholeCore;
        
        // Add initial validators
        for (uint256 i = 0; i < _initialValidators.length; i++) {
            _addValidator(_initialValidators[i]);
        }
        
        // Initialize chain configurations
        _initializeChainConfigs();
    }
    
    /**
     * @dev Bridge EMO tokens to another chain
     * @param recipient Recipient address on target chain
     * @param amount Amount to bridge
     * @param targetChain Target chain
     * @param protocol Bridge protocol to use
     */
    function bridgeTokens(
        address recipient,
        uint256 amount,
        Chain targetChain,
        Protocol protocol
    ) external payable validChain(targetChain) whenNotPaused nonReentrant {
        require(recipient != address(0), "EMOBridge: Invalid recipient");
        require(amount > 0, "EMOBridge: Amount must be greater than 0");
        
        ChainConfig memory config = chainConfigs[targetChain];
        require(amount >= config.minAmount, "EMOBridge: Amount below minimum");
        require(amount <= config.maxAmount, "EMOBridge: Amount exceeds maximum");
        require(msg.value >= config.fee, "EMOBridge: Insufficient bridge fee");
        
        // Check if protocol is supported for target chain
        bool protocolSupported = false;
        for (uint256 i = 0; i < config.supportedProtocols.length; i++) {
            if (config.supportedProtocols[i] == protocol) {
                protocolSupported = true;
                break;
            }
        }
        require(protocolSupported, "EMOBridge: Protocol not supported for target chain");
        
        // Lock tokens in bridge contract
        emoToken.transferFrom(msg.sender, address(this), amount);
        
        // Create bridge request
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            targetChain,
            protocol,
            nonces[msg.sender]++,
            block.timestamp
        ));
        
        bridgeRequests[requestId] = BridgeRequest({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            targetChain: targetChain,
            protocol: protocol,
            nonce: nonces[msg.sender] - 1,
            timestamp: block.timestamp,
            txHash: bytes32(0),
            processed: false,
            completed: false
        });
        
        emit BridgeRequestCreated(requestId, msg.sender, recipient, amount, targetChain, protocol);
        
        // Execute bridge based on protocol
        if (protocol == Protocol.LAYERZERO) {
            _bridgeViaLayerZero(requestId, recipient, amount, targetChain);
        } else if (protocol == Protocol.AXELAR) {
            _bridgeViaAxelar(requestId, recipient, amount, targetChain);
        } else if (protocol == Protocol.WORMHOLE) {
            _bridgeViaWormhole(requestId, recipient, amount, targetChain);
        } else {
            // Custom relayer requires validator signatures
            bridgeRequests[requestId].processed = true;
        }
    }
    
    /**
     * @dev Validator signs a bridge request
     * @param requestId Bridge request ID
     */
    function signBridgeRequest(bytes32 requestId) external onlyValidator {
        require(bridgeRequests[requestId].sender != address(0), "EMOBridge: Request not found");
        require(!bridgeRequests[requestId].completed, "EMOBridge: Request already completed");
        require(!validatorVotes[requestId][msg.sender], "EMOBridge: Already voted");
        
        validatorVotes[requestId][msg.sender] = true;
        validatorVoteCount[requestId]++;
        
        emit BridgeRequestSigned(requestId, msg.sender, validatorVoteCount[requestId]);
        
        // If enough signatures, execute the bridge
        if (validatorVoteCount[requestId] >= requiredValidatorSignatures) {
            _completeBridgeRequest(requestId);
        }
    }
    
    /**
     * @dev Complete bridge request after receiving tokens on target chain
     * @param requestId Bridge request ID
     * @param targetTxHash Transaction hash on target chain
     */
    function completeBridgeRequest(
        bytes32 requestId,
        bytes32 targetTxHash
    ) external onlyValidator {
        require(bridgeRequests[requestId].processed, "EMOBridge: Request not processed");
        require(!bridgeRequests[requestId].completed, "EMOBridge: Request already completed");
        
        bridgeRequests[requestId].completed = true;
        bridgeRequests[requestId].txHash = targetTxHash;
        
        emit BridgeRequestCompleted(requestId, targetTxHash);
    }
    
    /**
     * @dev Mint tokens when receiving from another chain
     * @param recipient Recipient address
     * @param amount Amount to mint
     * @param sourceChain Source chain
     * @param sourceTxHash Source transaction hash
     */
    function mintFromBridge(
        address recipient,
        uint256 amount,
        Chain sourceChain,
        bytes32 sourceTxHash,
        bytes[] calldata validatorSignatures
    ) external whenNotPaused nonReentrant {
        require(recipient != address(0), "EMOBridge: Invalid recipient");
        require(amount > 0, "EMOBridge: Amount must be greater than 0");
        require(validatorSignatures.length >= requiredValidatorSignatures, "EMOBridge: Insufficient signatures");
        
        // Verify validator signatures
        bytes32 messageHash = keccak256(abi.encodePacked(
            recipient,
            amount,
            sourceChain,
            sourceTxHash
        )).toEthSignedMessageHash();
        
        uint256 validSignatures = 0;
        mapping(address => bool) storage usedValidators;
        
        for (uint256 i = 0; i < validatorSignatures.length; i++) {
            address validator = messageHash.recover(validatorSignatures[i]);
            if (validators[validator] && !usedValidators[validator]) {
                usedValidators[validator] = true;
                validSignatures++;
            }
        }
        
        require(validSignatures >= requiredValidatorSignatures, "EMOBridge: Invalid signatures");
        
        // Mint tokens to recipient
        emoToken.bridgeMint(recipient, amount);
    }
    
    /**
     * @dev Bridge via LayerZero
     */
    function _bridgeViaLayerZero(
        bytes32 requestId,
        address recipient,
        uint256 amount,
        Chain targetChain
    ) internal {
        // LayerZero implementation would go here
        // This is a placeholder for the actual LayerZero integration
        bridgeRequests[requestId].processed = true;
    }
    
    /**
     * @dev Bridge via Axelar
     */
    function _bridgeViaAxelar(
        bytes32 requestId,
        address recipient,
        uint256 amount,
        Chain targetChain
    ) internal {
        // Axelar implementation would go here
        // This is a placeholder for the actual Axelar integration
        bridgeRequests[requestId].processed = true;
    }
    
    /**
     * @dev Bridge via Wormhole
     */
    function _bridgeViaWormhole(
        bytes32 requestId,
        address recipient,
        uint256 amount,
        Chain targetChain
    ) internal {
        // Wormhole implementation would go here
        // This is a placeholder for the actual Wormhole integration
        bridgeRequests[requestId].processed = true;
    }
    
    /**
     * @dev Complete bridge request
     */
    function _completeBridgeRequest(bytes32 requestId) internal {
        BridgeRequest storage request = bridgeRequests[requestId];
        
        if (request.protocol == Protocol.CUSTOM_RELAYER) {
            // For custom relayer, burn tokens and emit event for off-chain processing
            emoToken.burn(request.amount);
        }
        
        request.completed = true;
        emit BridgeRequestCompleted(requestId, bytes32(0));
    }
    
    /**
     * @dev Initialize chain configurations
     */
    function _initializeChainConfigs() internal {
        // Ethereum
        chainConfigs[Chain.ETHEREUM] = ChainConfig({
            enabled: true,
            bridgeAddress: address(0), // To be set
            minAmount: 1 * 10**18, // 1 EMO
            maxAmount: 1000000 * 10**18, // 1M EMO
            fee: 0.001 ether,
            supportedProtocols: new Protocol[](0)
        });
        chainConfigs[Chain.ETHEREUM].supportedProtocols.push(Protocol.LAYERZERO);
        chainConfigs[Chain.ETHEREUM].supportedProtocols.push(Protocol.WORMHOLE);
        
        // Polygon
        chainConfigs[Chain.POLYGON] = ChainConfig({
            enabled: true,
            bridgeAddress: address(0), // To be set
            minAmount: 1 * 10**18, // 1 EMO
            maxAmount: 1000000 * 10**18, // 1M EMO
            fee: 0.001 ether,
            supportedProtocols: new Protocol[](0)
        });
        chainConfigs[Chain.POLYGON].supportedProtocols.push(Protocol.LAYERZERO);
        chainConfigs[Chain.POLYGON].supportedProtocols.push(Protocol.AXELAR);
    }
    
    /**
     * @dev Add validator
     */
    function _addValidator(address validator) internal {
        require(!validators[validator], "EMOBridge: Already a validator");
        validators[validator] = true;
        validatorCount++;
        emit ValidatorAdded(validator);
    }
    
    // Admin functions
    function addValidator(address validator) external onlyOwner {
        _addValidator(validator);
    }
    
    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "EMOBridge: Not a validator");
        validators[validator] = false;
        validatorCount--;
        emit ValidatorRemoved(validator);
    }
    
    function setRequiredSignatures(uint256 required) external onlyOwner {
        require(required > 0 && required <= validatorCount, "EMOBridge: Invalid signature count");
        requiredValidatorSignatures = required;
    }
    
    function updateChainConfig(
        Chain chain,
        bool enabled,
        address bridgeAddress,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee
    ) external onlyOwner {
        chainConfigs[chain].enabled = enabled;
        chainConfigs[chain].bridgeAddress = bridgeAddress;
        chainConfigs[chain].minAmount = minAmount;
        chainConfigs[chain].maxAmount = maxAmount;
        chainConfigs[chain].fee = fee;
        
        emit ChainConfigUpdated(chain, enabled, bridgeAddress, fee);
    }
    
    function setBridgeFee(uint256 fee) external onlyOwner {
        bridgeFee = fee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Emergency functions
    function emergencyWithdrawTokens(uint256 amount) external onlyOwner {
        emoToken.transfer(owner(), amount);
    }
}