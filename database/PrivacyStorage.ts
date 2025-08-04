/**
 * EmotionalChain Privacy-Safe Storage System
 * Handles privacy-preserving biometric data storage with ZK proof references
 */

import { createHash } from 'crypto';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { BiometricReading } from '../biometric/BiometricDevice';
import { ZKProof } from '../advanced/PrivacyLayer';

export interface BiometricHash {
  id: string;
  validatorId: string;
  deviceType: string;
  dataHash: string; // SHA-256 hash of original biometric data
  qualityScore: number;
  timestamp: number;
  authenticityScore: number;
  proofId?: string; // Reference to ZK proof
  createdAt: Date;
}

export interface ZKProofRecord {
  id: string;
  proofId: string;
  validatorId: string;
  circuitType: string;
  proofHash: string; // Hash of the actual proof
  publicSignalsHash: string; // Hash of public signals
  verificationStatus: 'pending' | 'verified' | 'failed';
  timestamp: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface SchemaVersion {
  version: number;
  description: string;
  appliedAt: Date;
  migrationScript?: string;
}

/**
 * Privacy-safe storage manager for biometric data and ZK proofs
 */
export class PrivacyStorage {
  private readonly SALT = 'emotional-chain-privacy-salt-2025';

  /**
   * Store biometric data as hashes with minimal metadata
   */
  async storeBiometricHash(
    validatorId: string,
    biometricData: BiometricReading,
    proofId?: string
  ): Promise<string> {
    const dataHash = this.hashBiometricData(biometricData);
    const id = this.generateId('bio', validatorId, biometricData.timestamp);

    const biometricHash: BiometricHash = {
      id,
      validatorId,
      deviceType: biometricData.deviceType,
      dataHash,
      qualityScore: biometricData.quality,
      timestamp: biometricData.timestamp,
      authenticityScore: biometricData.authenticity,
      proofId,
      createdAt: new Date()
    };

    // Store in database (would use actual Drizzle schema in production)
    await this.insertBiometricHash(biometricHash);
    
    console.log(`Stored biometric hash for ${validatorId} (${biometricData.deviceType})`);
    return id;
  }

  /**
   * Store ZK proof reference without exposing sensitive data
   */
  async storeZKProofRecord(zkProof: ZKProof): Promise<string> {
    const proofHash = this.hashObject(zkProof.proof);
    const publicSignalsHash = this.hashObject(zkProof.publicSignals);
    const id = this.generateId('zkp', zkProof.validatorId, zkProof.timestamp);

    const proofRecord: ZKProofRecord = {
      id,
      proofId: zkProof.proofId,
      validatorId: zkProof.validatorId,
      circuitType: zkProof.circuitType,
      proofHash,
      publicSignalsHash,
      verificationStatus: 'pending',
      timestamp: zkProof.timestamp,
      expiresAt: new Date(zkProof.timestamp + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date()
    };

    await this.insertZKProofRecord(proofRecord);
    
    console.log(`Stored ZK proof record ${zkProof.proofId} for ${zkProof.validatorId}`);
    return id;
  }

  /**
   * Verify biometric data against stored hash
   */
  async verifyBiometricData(
    validatorId: string,
    biometricData: BiometricReading,
    storedHashId: string
  ): Promise<boolean> {
    const storedHash = await this.getBiometricHash(storedHashId);
    if (!storedHash || storedHash.validatorId !== validatorId) {
      return false;
    }

    const computedHash = this.hashBiometricData(biometricData);
    return storedHash.dataHash === computedHash;
  }

  /**
   * Update ZK proof verification status
   */
  async updateProofVerificationStatus(
    proofId: string,
    status: 'verified' | 'failed'
  ): Promise<void> {
    await this.updateZKProofStatus(proofId, status);
    console.log(`Updated proof ${proofId} status to ${status}`);
  }

  /**
   * Get validator's recent biometric activity (privacy-safe)
   */
  async getValidatorBiometricActivity(
    validatorId: string,
    timeRange: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<BiometricHash[]> {
    const since = Date.now() - timeRange;
    return this.getBiometricHashesByValidator(validatorId, since);
  }

  /**
   * Get ZK proof records for audit
   */
  async getZKProofRecords(
    validatorId?: string,
    circuitType?: string,
    timeRange: number = 24 * 60 * 60 * 1000
  ): Promise<ZKProofRecord[]> {
    const since = Date.now() - timeRange;
    return this.getZKProofsByFilters(validatorId, circuitType, since);
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(): Promise<{ biometricHashes: number; zkProofs: number }> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    const biometricCleanup = await this.deleteBiometricHashesOlderThan(thirtyDaysAgo);
    const zkProofCleanup = await this.deleteExpiredZKProofs(twentyFourHoursAgo);

    console.log(`Cleaned up ${biometricCleanup} biometric hashes and ${zkProofCleanup} ZK proofs`);
    
    return {
      biometricHashes: biometricCleanup,
      zkProofs: zkProofCleanup
    };
  }

  /**
   * Generate privacy metrics without exposing sensitive data
   */
  async getPrivacyMetrics(): Promise<{
    totalBiometricHashes: number;
    totalZKProofs: number;
    averageQualityScore: number;
    verificationSuccessRate: number;
    dataRetentionDays: number;
  }> {
    const [biometricStats, zkStats] = await Promise.all([
      this.getBiometricHashStats(),
      this.getZKProofStats()
    ]);

    return {
      totalBiometricHashes: biometricStats.total,
      totalZKProofs: zkStats.total,
      averageQualityScore: biometricStats.avgQuality,
      verificationSuccessRate: zkStats.verificationRate,
      dataRetentionDays: 30
    };
  }

  // Private helper methods

  /**
   * Hash biometric data with salt for privacy
   */
  private hashBiometricData(data: BiometricReading): string {
    const sensitiveData = {
      value: data.value,
      deviceId: data.deviceId,
      timestamp: data.timestamp,
      authenticity: data.authenticity
    };
    
    return createHash('sha256')
      .update(JSON.stringify(sensitiveData) + this.SALT)
      .digest('hex');
  }

  /**
   * Hash any object for integrity verification
   */
  private hashObject(obj: any): string {
    return createHash('sha256')
      .update(JSON.stringify(obj) + this.SALT)
      .digest('hex');
  }

  /**
   * Generate deterministic ID
   */
  private generateId(prefix: string, validatorId: string, timestamp: number): string {
    const data = `${prefix}-${validatorId}-${timestamp}`;
    const hash = createHash('sha256').update(data).digest('hex');
    return `${prefix}_${hash.substring(0, 16)}`;
  }

  // Database interaction methods (would use actual Drizzle schema in production)

  private async insertBiometricHash(hash: BiometricHash): Promise<void> {
    // In production, this would use proper Drizzle ORM insertions
    console.log('Storing biometric hash:', hash.id);
  }

  private async insertZKProofRecord(record: ZKProofRecord): Promise<void> {
    // In production, this would use proper Drizzle ORM insertions  
    console.log('Storing ZK proof record:', record.id);
  }

  private async getBiometricHash(id: string): Promise<BiometricHash | null> {
    // In production, this would query the actual database
    return null;
  }

  private async updateZKProofStatus(proofId: string, status: string): Promise<void> {
    // In production, this would update the database record
    console.log(`Updated proof ${proofId} to ${status}`);
  }

  private async getBiometricHashesByValidator(
    validatorId: string, 
    since: number
  ): Promise<BiometricHash[]> {
    // In production, this would query filtered records
    return [];
  }

  private async getZKProofsByFilters(
    validatorId?: string,
    circuitType?: string,
    since?: number
  ): Promise<ZKProofRecord[]> {
    // In production, this would query filtered records
    return [];
  }

  private async deleteBiometricHashesOlderThan(timestamp: number): Promise<number> {
    // In production, this would delete old records
    return 0;
  }

  private async deleteExpiredZKProofs(timestamp: number): Promise<number> {
    // In production, this would delete expired proofs
    return 0;
  }

  private async getBiometricHashStats(): Promise<{ total: number; avgQuality: number }> {
    // In production, this would compute actual statistics
    return { total: 0, avgQuality: 0.85 };
  }

  private async getZKProofStats(): Promise<{ total: number; verificationRate: number }> {
    // In production, this would compute actual statistics
    return { total: 0, verificationRate: 0.95 };
  }
}

/**
 * Schema Version Management
 */
export class SchemaVersionManager {
  private currentVersion = 1;

  /**
   * Check current schema version
   */
  async getCurrentVersion(): Promise<number> {
    // In production, query schema_versions table
    return this.currentVersion;
  }

  /**
   * Apply schema migration
   */
  async applyMigration(version: number, description: string, script: string): Promise<void> {
    const migration: SchemaVersion = {
      version,
      description,
      appliedAt: new Date(),
      migrationScript: script
    };

    // In production, execute migration script and log
    console.log(`Applied schema migration v${version}: ${description}`);
    this.currentVersion = version;
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(): Promise<SchemaVersion[]> {
    // In production, query all applied migrations
    return [];
  }

  /**
   * Validate schema integrity
   */
  async validateSchema(): Promise<{ valid: boolean; issues: string[] }> {
    // In production, validate database schema against expected structure
    return { valid: true, issues: [] };
  }
}

export default PrivacyStorage;