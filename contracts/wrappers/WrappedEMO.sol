// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WrappedEMO - Wrapped EMO token for Ethereum and Polygon
 * @dev ERC20 wrapper for EMO tokens on non-native chains
 * 
 * Features:
 * - Standard ERC20 functionality
 * - Minting/burning for bridge operations
 * - Pausable for emergency situations
 * - Compatible with all DeFi protocols
 */
contract WrappedEMO is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // Bridge contract that can mint/burn
    mapping(address => bool) public bridges;
    
    // Maximum supply matches native EMO
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Metadata for bridge tracking
    mapping(bytes32 => bool) public processedBridgeTransactions;
    
    // Events
    event BridgeAdded(address indexed bridge);
    event BridgeRemoved(address indexed bridge);
    event BridgeMint(address indexed to, uint256 amount, bytes32 indexed bridgeTxHash);
    event BridgeBurn(address indexed from, uint256 amount, string targetChain, address targetAddress);
    
    // Modifiers
    modifier onlyBridge() {
        require(bridges[msg.sender], "WrappedEMO: Only bridge can call this function");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        // Constructor only sets up the contract, no initial minting
    }
    
    /**
     * @dev Mint wrapped EMO tokens when bridging from native chain
     * @param to Recipient address
     * @param amount Amount to mint
     * @param bridgeTxHash Hash of the bridge transaction on source chain
     */
    function bridgeMint(
        address to,
        uint256 amount,
        bytes32 bridgeTxHash
    ) external onlyBridge whenNotPaused {
        require(to != address(0), "WrappedEMO: Cannot mint to zero address");
        require(amount > 0, "WrappedEMO: Amount must be greater than 0");
        require(!processedBridgeTransactions[bridgeTxHash], "WrappedEMO: Transaction already processed");
        require(totalSupply() + amount <= MAX_SUPPLY, "WrappedEMO: Would exceed max supply");
        
        processedBridgeTransactions[bridgeTxHash] = true;
        _mint(to, amount);
        
        emit BridgeMint(to, amount, bridgeTxHash);
    }
    
    /**
     * @dev Burn wrapped EMO tokens when bridging to native chain
     * @param from Address to burn from
     * @param amount Amount to burn
     * @param targetChain Target chain identifier
     * @param targetAddress Recipient address on target chain
     */
    function bridgeBurn(
        address from,
        uint256 amount,
        string calldata targetChain,
        address targetAddress
    ) external onlyBridge whenNotPaused {
        require(from != address(0), "WrappedEMO: Cannot burn from zero address");
        require(amount > 0, "WrappedEMO: Amount must be greater than 0");
        require(targetAddress != address(0), "WrappedEMO: Invalid target address");
        require(balanceOf(from) >= amount, "WrappedEMO: Insufficient balance");
        
        _burn(from, amount);
        
        emit BridgeBurn(from, amount, targetChain, targetAddress);
    }
    
    /**
     * @dev Burn tokens from sender's balance (for bridging back to native chain)
     * @param amount Amount to burn
     * @param targetChain Target chain identifier
     * @param targetAddress Recipient address on target chain
     */
    function burnForBridge(
        uint256 amount,
        string calldata targetChain,
        address targetAddress
    ) external whenNotPaused {
        require(amount > 0, "WrappedEMO: Amount must be greater than 0");
        require(targetAddress != address(0), "WrappedEMO: Invalid target address");
        require(balanceOf(msg.sender) >= amount, "WrappedEMO: Insufficient balance");
        
        _burn(msg.sender, amount);
        
        emit BridgeBurn(msg.sender, amount, targetChain, targetAddress);
    }
    
    /**
     * @dev Add authorized bridge contract
     * @param bridge Bridge contract address
     */
    function addBridge(address bridge) external onlyOwner {
        require(bridge != address(0), "WrappedEMO: Invalid bridge address");
        require(!bridges[bridge], "WrappedEMO: Bridge already added");
        
        bridges[bridge] = true;
        emit BridgeAdded(bridge);
    }
    
    /**
     * @dev Remove authorized bridge contract
     * @param bridge Bridge contract address
     */
    function removeBridge(address bridge) external onlyOwner {
        require(bridges[bridge], "WrappedEMO: Bridge not found");
        
        bridges[bridge] = false;
        emit BridgeRemoved(bridge);
    }
    
    /**
     * @dev Pause contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer functions to include pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Check if a bridge transaction has been processed
     * @param bridgeTxHash Bridge transaction hash
     * @return true if processed, false otherwise
     */
    function isBridgeTransactionProcessed(bytes32 bridgeTxHash) external view returns (bool) {
        return processedBridgeTransactions[bridgeTxHash];
    }
}