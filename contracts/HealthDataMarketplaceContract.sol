// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HealthDataMarketplaceContract
 * @dev Marketplace for monetizing anonymized health data
 * Enables users to sell health data, researchers to purchase it
 */
contract HealthDataMarketplaceContract is Ownable, ReentrancyGuard, Pausable {
    IERC20 public emoToken;
    
    struct DataListing {
        address seller;
        uint256 priceInEMO;
        string dataType; // heart_rate, stress, sleep, activity, combined
        uint256 duration; // days
        uint256 frequency; // samples per day
        string anonymizationLevel; // high, medium, low
        string dataCommitment; // ZK proof hash
        bool isActive;
    }
    
    struct Purchase {
        address buyer;
        address seller;
        uint256 listingId;
        uint256 priceInEMO;
        uint256 platformFee;
        uint256 timestamp;
    }
    
    mapping(uint256 => DataListing) public listings;
    mapping(uint256 => Purchase[]) public listingPurchases;
    mapping(address => uint256) public sellerReputation; // buy count
    mapping(address => uint256) public platformBalance;
    
    uint256 public nextListingId;
    uint256 public totalFeesCollected;
    uint256 public platformFeePercentage = 5; // 5%
    
    event DataListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 priceInEMO,
        string dataType
    );
    
    event DataPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 priceInEMO
    );
    
    event ListingDeactivated(uint256 indexed listingId);
    
    constructor(address _emoToken) Ownable(msg.sender) {
        emoToken = IERC20(_emoToken);
    }
    
    /**
     * @dev List health data for sale
     */
    function listData(
        uint256 priceInEMO,
        string memory dataType,
        uint256 duration,
        uint256 frequency,
        string memory anonymizationLevel,
        string memory dataCommitment
    ) external whenNotPaused returns (uint256) {
        require(priceInEMO > 0, "Price must be greater than 0");
        
        uint256 listingId = nextListingId++;
        
        listings[listingId] = DataListing({
            seller: msg.sender,
            priceInEMO: priceInEMO,
            dataType: dataType,
            duration: duration,
            frequency: frequency,
            anonymizationLevel: anonymizationLevel,
            dataCommitment: dataCommitment,
            isActive: true
        });
        
        emit DataListed(listingId, msg.sender, priceInEMO, dataType);
        return listingId;
    }
    
    /**
     * @dev Purchase health data
     */
    function purchaseData(
        uint256 listingId
    ) external nonReentrant whenNotPaused returns (bool) {
        DataListing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy own data");
        
        // Transfer EMO from buyer to contract
        require(
            emoToken.transferFrom(msg.sender, address(this), listing.priceInEMO),
            "Payment transfer failed"
        );
        
        // Calculate fees
        uint256 platformFee = (listing.priceInEMO * platformFeePercentage) / 100;
        uint256 sellerAmount = listing.priceInEMO - platformFee;
        
        // Transfer to seller
        require(
            emoToken.transfer(listing.seller, sellerAmount),
            "Seller payment failed"
        );
        
        // Record platform balance
        platformBalance[owner()] += platformFee;
        totalFeesCollected += platformFee;
        
        // Update seller reputation
        sellerReputation[listing.seller]++;
        
        // Record purchase
        Purchase memory purchase = Purchase({
            buyer: msg.sender,
            seller: listing.seller,
            listingId: listingId,
            priceInEMO: listing.priceInEMO,
            platformFee: platformFee,
            timestamp: block.timestamp
        });
        
        listingPurchases[listingId].push(purchase);
        
        emit DataPurchased(listingId, msg.sender, listing.seller, listing.priceInEMO);
        return true;
    }
    
    /**
     * @dev Deactivate listing
     */
    function deactivateListing(uint256 listingId) external {
        require(listings[listingId].seller == msg.sender, "Only seller can deactivate");
        listings[listingId].isActive = false;
        emit ListingDeactivated(listingId);
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (DataListing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev Get purchase history for listing
     */
    function getPurchaseHistory(uint256 listingId) external view returns (Purchase[] memory) {
        return listingPurchases[listingId];
    }
    
    /**
     * @dev Withdraw platform fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = platformBalance[owner()];
        require(amount > 0, "No fees to withdraw");
        
        platformBalance[owner()] = 0;
        require(emoToken.transfer(owner(), amount), "Withdrawal failed");
    }
    
    /**
     * @dev Update platform fee percentage
     */
    function setPlatformFeePercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= 10, "Fee too high");
        platformFeePercentage = newPercentage;
    }
    
    /**
     * @dev Pause marketplace
     */
    function pauseMarketplace() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause marketplace
     */
    function unpauseMarketplace() external onlyOwner {
        _unpause();
    }
}
