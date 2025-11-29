import { EventEmitter } from 'eventemitter3';
import crypto from 'crypto';

/**
 * Health Data Marketplace
 * Real-world use case: Enable users to monetize their anonymized health data
 * Researchers and companies can purchase de-identified wellness data
 */

export type DataType = 'heart_rate' | 'stress' | 'sleep' | 'activity' | 'combined';
export type AnonymizationLevel = 'high' | 'medium' | 'low';

export interface DataListing {
  listingId: string;
  dataType: DataType;
  duration: number; // days
  frequency: number; // samples per day
  anonymizationLevel: AnonymizationLevel;
  priceInEMO: bigint;
  sellerAddress: string;
  dataCommitment: string; // ZK proof of data quality
  isActive: boolean;
  createdAt: number;
  purchaseCount: number;
}

export interface Purchase {
  purchaseId: string;
  listingId: string;
  buyerAddress: string;
  sellerAddress: string;
  priceInEMO: bigint;
  platformFee: bigint;
  sellerAmount: bigint;
  timestamp: number;
  encryptedDataHash: string;
}

export interface DataQualityProof {
  commitment: string;
  completeness: number; // 0-100%
  accuracy: number; // 0-100%
  timeliness: number; // 0-100%
  verified: boolean;
}

/**
 * Health Data Marketplace Manager
 */
export class HealthDataMarketplace extends EventEmitter {
  private listings: Map<string, DataListing> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private qualityProofs: Map<string, DataQualityProof> = new Map();
  private userReputation: Map<string, { sellCount: number; avgRating: number }> = new Map();
  
  // Platform statistics
  private statistics = {
    totalListings: 0,
    totalPurchases: 0,
    totalVolumeEMO: BigInt(0),
    platformFeesCollected: BigInt(0),
    averageQualityScore: 0,
  };

  private readonly PLATFORM_FEE_PERCENTAGE = 5; // 5% fee

  /**
   * List health data for sale
   */
  async listData(
    dataType: DataType,
    duration: number,
    frequency: number,
    anonymizationLevel: AnonymizationLevel,
    priceInEMO: bigint,
    sellerAddress: string,
    dataCommitment: string
  ): Promise<string> {
    if (priceInEMO <= BigInt(0)) {
      throw new Error('Price must be greater than 0');
    }

    // Verify data quality with ZK proof
    const qualityProof = await this.verifyDataQuality(dataCommitment);
    if (!qualityProof.verified) {
      throw new Error('Data quality verification failed');
    }

    // Create listing
    const listingId = this.generateListingId();
    const listing: DataListing = {
      listingId,
      dataType,
      duration,
      frequency,
      anonymizationLevel,
      priceInEMO,
      sellerAddress,
      dataCommitment,
      isActive: true,
      createdAt: Date.now(),
      purchaseCount: 0,
    };

    this.listings.set(listingId, listing);
    this.statistics.totalListings++;

    // Initialize seller reputation if new
    if (!this.userReputation.has(sellerAddress)) {
      this.userReputation.set(sellerAddress, { sellCount: 0, avgRating: 5.0 });
    }

    this.emit('dataListed', {
      listingId,
      dataType,
      price: priceInEMO.toString(),
      seller: sellerAddress,
      anonymizationLevel,
      qualityScore: qualityProof.completeness,
    });

    return listingId;
  }

  /**
   * Purchase health data
   */
  async purchaseData(
    listingId: string,
    buyerAddress: string
  ): Promise<{ encryptedDataHash: string; decryptionKeyHash: string }> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (!listing.isActive) {
      throw new Error('Listing is not active');
    }

    // Calculate fees
    const { seller: sellerAmount, platform: platformFee } = this.calculateFees(listing.priceInEMO);

    // Create purchase record
    const purchaseId = this.generatePurchaseId();
    const purchase: Purchase = {
      purchaseId,
      listingId,
      buyerAddress,
      sellerAddress: listing.sellerAddress,
      priceInEMO: listing.priceInEMO,
      platformFee,
      sellerAmount,
      timestamp: Date.now(),
      encryptedDataHash: this.generateDataHash(),
    };

    this.purchases.set(purchaseId, purchase);
    listing.purchaseCount++;
    this.statistics.totalPurchases++;
    this.statistics.totalVolumeEMO += listing.priceInEMO;
    this.statistics.platformFeesCollected += platformFee;

    // Update seller reputation
    const reputation = this.userReputation.get(listing.sellerAddress)!;
    reputation.sellCount++;

    this.emit('dataPurchased', {
      purchaseId,
      listingId,
      buyer: buyerAddress,
      seller: listing.sellerAddress,
      price: listing.priceInEMO.toString(),
      platformFee: platformFee.toString(),
      sellerAmount: sellerAmount.toString(),
    });

    return {
      encryptedDataHash: purchase.encryptedDataHash,
      decryptionKeyHash: this.generateDecryptionKeyHash(),
    };
  }

  /**
   * Get seller reputation
   */
  getSellerReputation(sellerAddress: string) {
    return (
      this.userReputation.get(sellerAddress) || { sellCount: 0, avgRating: 0 }
    );
  }

  /**
   * Get listing details
   */
  getListing(listingId: string): DataListing | undefined {
    return this.listings.get(listingId);
  }

  /**
   * Get marketplace statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      totalVolumeEMO: this.statistics.totalVolumeEMO.toString(),
      platformFeesCollected: this.statistics.platformFeesCollected.toString(),
      activeListing: Array.from(this.listings.values()).filter(l => l.isActive).length,
    };
  }

  /**
   * Get all active listings
   */
  getActiveListings(): DataListing[] {
    return Array.from(this.listings.values()).filter(l => l.isActive);
  }

  /**
   * Filter listings by criteria
   */
  searchListings(filters: {
    dataType?: DataType;
    maxPrice?: bigint;
    anonymizationLevel?: AnonymizationLevel;
    minQuality?: number;
  }): DataListing[] {
    return this.getActiveListings().filter(listing => {
      if (filters.dataType && listing.dataType !== filters.dataType) return false;
      if (filters.maxPrice && listing.priceInEMO > filters.maxPrice) return false;
      if (filters.anonymizationLevel && listing.anonymizationLevel !== filters.anonymizationLevel) {
        return false;
      }
      if (filters.minQuality) {
        const proof = this.qualityProofs.get(listing.dataCommitment);
        if (!proof || proof.completeness < filters.minQuality) return false;
      }
      return true;
    });
  }

  // Private helper methods

  private calculateFees(
    price: bigint
  ): { seller: bigint; platform: bigint } {
    const platformFee = (price * BigInt(this.PLATFORM_FEE_PERCENTAGE)) / BigInt(100);
    const sellerAmount = price - platformFee;
    return { seller: sellerAmount, platform: platformFee };
  }

  private async verifyDataQuality(commitment: string): Promise<DataQualityProof> {
    // Simplified: In production, would verify zero-knowledge proof
    const proof: DataQualityProof = {
      commitment,
      completeness: 85 + Math.random() * 15, // 85-100%
      accuracy: 80 + Math.random() * 20, // 80-100%
      timeliness: 90 + Math.random() * 10, // 90-100%
      verified: true,
    };

    this.qualityProofs.set(commitment, proof);
    return proof;
  }

  private generateListingId(): string {
    return `listing_${crypto.randomBytes(16).toString('hex')}`;
  }

  private generatePurchaseId(): string {
    return `purchase_${crypto.randomBytes(16).toString('hex')}`;
  }

  private generateDataHash(): string {
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }

  private generateDecryptionKeyHash(): string {
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }
}

export default HealthDataMarketplace;
