/**
 * GDPR Compliance Service
 * Implements Right to Erasure (GDPR Article 17) and Data Portability (Article 20)
 */

import { db } from '../db';
import { eq } from 'drizzle-orm';
import { offChainProfiles, deviceRegistrations } from '@shared/schema';
import { createHash } from 'crypto';

export interface GDPRErasureRequest {
  validatorAddress: string;
  requestType: 'full' | 'personal_only';
  signature: string; // Cryptographic signature proving ownership
  timestamp: number;
}

export interface GDPRDataExport {
  validatorAddress: string;
  personalData: {
    email?: string;
    name?: string;
    country?: string;
    consentVersion: string;
    consentTimestamp: Date;
  };
  deviceData: Array<{
    deviceId: string;
    deviceType: string;
    lastActivity?: Date;
  }>;
  blockchainData: {
    note: string;
    commitmentCount: number;
    // Commitments are cryptographic hashes - meaningless without nonce
    // Cannot be used to reveal personal information
  };
}

export interface GDPRConsentRecord {
  validatorAddress: string;
  consentVersion: string;
  consentTimestamp: Date;
  dataProcessingPurpose: string;
  isActive: boolean;
}

/**
 * GDPR Compliance Service
 * Handles data subject rights (erasure, portability, access)
 */
export class GDPRComplianceService {
  
  /**
   * Verify cryptographic signature for erasure request
   * Prevents unauthorized deletion
   */
  async verifySignature(request: GDPRErasureRequest): Promise<boolean> {
    try {
      // Extract message that was signed
      const message = `${request.validatorAddress}:${request.requestType}:${request.timestamp}`;
      const messageHash = createHash('sha256').update(message).digest('hex');
      
      // In production, verify ECDSA signature against validator's public key
      // For demo, we do basic validation
      
      // Check timestamp is recent (within 5 minutes)
      const now = Date.now();
      const age = now - request.timestamp;
      if (age > 5 * 60 * 1000 || age < 0) {
        console.log('Signature timestamp invalid:', age / 1000, 'seconds');
        return false;
      }
      
      // Check signature format
      if (!request.signature || request.signature.length < 64) {
        console.log('Invalid signature format');
        return false;
      }
      
      // TODO: Production - verify actual ECDSA signature
      // const isValid = verifyECDSA(messageHash, request.signature, publicKey);
      
      return true;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Handle GDPR erasure request (Right to be Forgotten)
   * GDPR Article 17
   */
  async handleErasureRequest(request: GDPRErasureRequest): Promise<{
    success: boolean;
    deletedData: string[];
    retainedData: string[];
    reason: string;
  }> {
    // 1. Verify signature
    const isValid = await this.verifySignature(request);
    if (!isValid) {
      throw new Error('Invalid signature - cannot verify identity');
    }

    const deletedData: string[] = [];
    const retainedData: string[] = [];

    try {
      // 2. Delete OFF-CHAIN personal data
      
      // Delete off-chain profile
      const deletedProfiles = await db.delete(offChainProfiles)
        .where(eq(offChainProfiles.validatorAddress, request.validatorAddress))
        .returning();
      
      if (deletedProfiles.length > 0) {
        deletedData.push('off_chain_profile');
      }

      // Delete device registrations
      const deletedDevices = await db.delete(deviceRegistrations)
        .where(eq(deviceRegistrations.validatorAddress, request.validatorAddress))
        .returning();
      
      if (deletedDevices.length > 0) {
        deletedData.push(`device_registrations (${deletedDevices.length} devices)`);
      }

      // 3. What CANNOT be deleted (blockchain integrity)
      // These remain but contain NO personal information
      
      retainedData.push('blockchain_commitments (cryptographic hashes only)');
      retainedData.push('validator_address (pseudonymous identifier)');
      retainedData.push('block_history (immutable ledger)');
      
      // Note: Commitments are SHA-256 hashes that are computationally 
      // infeasible to reverse. Without the nonce, they reveal nothing
      // about the original biometric data.

      return {
        success: true,
        deletedData,
        retainedData,
        reason: 'Blockchain data retained for network integrity (GDPR Article 17(3)(b) - archiving in public interest)',
      };
    } catch (error) {
      console.error('Erasure request failed:', error);
      throw new Error(`Erasure failed: ${(error as Error).message}`);
    }
  }

  /**
   * Anonymize validator data
   * Alternative to full deletion when blockchain data must be preserved
   */
  async anonymizeValidator(validatorAddress: string): Promise<void> {
    await db.update(offChainProfiles)
      .set({
        email: '[REDACTED]',
        name: '[REDACTED]',
        country: '[REDACTED]',
        consentActive: false,
        dataProcessingPurpose: 'Anonymized per GDPR request',
      })
      .where(eq(offChainProfiles.validatorAddress, validatorAddress));
  }

  /**
   * Export all personal data (Data Portability)
   * GDPR Article 20
   */
  async exportPersonalData(validatorAddress: string): Promise<GDPRDataExport> {
    // Get off-chain personal data
    const profiles = await db.select()
      .from(offChainProfiles)
      .where(eq(offChainProfiles.validatorAddress, validatorAddress));
    
    const profile = profiles[0];

    // Get device data
    const devices = await db.select()
      .from(deviceRegistrations)
      .where(eq(deviceRegistrations.validatorAddress, validatorAddress));

    // Count commitments (but don't export them - they're meaningless hashes)
    const commitments = await db.query.biometricCommitments?.findMany({
      where: (commitments: any, { eq }: any) => eq(commitments.validatorAddress, validatorAddress),
    }) || [];

    return {
      validatorAddress,
      personalData: profile ? {
        email: profile.email || undefined,
        name: profile.name || undefined,
        country: profile.country || undefined,
        consentVersion: profile.consentVersion,
        consentTimestamp: profile.consentTimestamp,
      } : {
        consentVersion: 'unknown',
        consentTimestamp: new Date(),
      },
      deviceData: devices.map(device => ({
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        lastActivity: device.lastActivity || undefined,
      })),
      blockchainData: {
        note: 'Commitments are cryptographic hashes that cannot reveal personal information without the nonce',
        commitmentCount: commitments.length,
      },
    };
  }

  /**
   * Check if validator has valid consent
   * Required before processing any biometric data
   */
  async hasValidConsent(validatorAddress: string): Promise<boolean> {
    const profiles = await db.select()
      .from(offChainProfiles)
      .where(eq(offChainProfiles.validatorAddress, validatorAddress));
    
    if (profiles.length === 0) {
      return false; // No consent record
    }

    return profiles[0].consentActive === true;
  }

  /**
   * Record new consent
   * Must be called before allowing validator registration
   */
  async recordConsent(
    validatorAddress: string,
    consentVersion: string,
    dataProcessingPurpose: string,
    personalData?: {
      email?: string;
      name?: string;
      country?: string;
    }
  ): Promise<void> {
    const consentRecord = {
      validatorAddress,
      email: personalData?.email,
      name: personalData?.name,
      country: personalData?.country,
      consentTimestamp: new Date(),
      consentVersion,
      consentActive: true,
      dataProcessingPurpose,
    };

    // Upsert consent record
    await db.insert(offChainProfiles)
      .values(consentRecord)
      .onConflictDoUpdate({
        target: offChainProfiles.validatorAddress,
        set: {
          ...consentRecord,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Revoke consent
   * Should trigger automatic unstaking and data deletion
   */
  async revokeConsent(validatorAddress: string): Promise<void> {
    await db.update(offChainProfiles)
      .set({
        consentActive: false,
        updatedAt: new Date(),
      })
      .where(eq(offChainProfiles.validatorAddress, validatorAddress));
    
    // TODO: Trigger unstaking process
    // TODO: Schedule data deletion after grace period
  }

  /**
   * Get consent status
   */
  async getConsentStatus(validatorAddress: string): Promise<GDPRConsentRecord | null> {
    const profiles = await db.select()
      .from(offChainProfiles)
      .where(eq(offChainProfiles.validatorAddress, validatorAddress));
    
    if (profiles.length === 0) {
      return null;
    }

    const profile = profiles[0];
    return {
      validatorAddress: profile.validatorAddress,
      consentVersion: profile.consentVersion,
      consentTimestamp: profile.consentTimestamp,
      dataProcessingPurpose: profile.dataProcessingPurpose || 'Not specified',
      isActive: profile.consentActive || false,
    };
  }
}

// Singleton instance
export const gdprService = new GDPRComplianceService();
