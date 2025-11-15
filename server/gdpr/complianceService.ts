/**
 * GDPR Compliance Service
 * Implements Right to Erasure (GDPR Article 17) and Data Portability (Article 20)
 * 
 * RESEARCH/DEMONSTRATION PROJECT NOTICE:
 * This implementation is for research and demonstration purposes.
 * 
 * Known Limitations:
 * 1. Public keys are stored in validatorStates database table (not immutable blockchain)
 *    - Production systems should use on-chain public key registry
 *    - Storage tampering could enable key substitution attacks
 *    - Mitigation: Use blockchain-based key registry with cryptographic proofs
 * 
 * 2. Signature verification uses database-stored keys without cross-validation
 *    - Production should verify against signed certificates or on-chain attestations
 *    - Current implementation assumes trusted database layer
 * 
 * 3. No distributed key management
 *    - Production should implement HSM-backed key storage
 *    - Multi-sig or threshold signatures for critical operations
 * 
 * For production deployment, upgrade to:
 * - On-chain public key registry (immutable)
 * - Hardware security modules (HSM) for key storage
 * - Multi-party computation (MPC) for sensitive operations
 * - Formal security audit and penetration testing
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
      // 1. Check timestamp is recent (within 5 minutes) - prevents replay attacks
      const now = Date.now();
      const age = now - request.timestamp;
      if (age > 5 * 60 * 1000 || age < 0) {
        console.log('Signature timestamp invalid:', age / 1000, 'seconds');
        return false;
      }
      
      // 2. Check signature format
      if (!request.signature || request.signature.length < 64) {
        console.log('Invalid signature format');
        return false;
      }

      // 3. Get validator's public key from storage
      const validators = await db.query.validatorStates?.findMany({
        where: (states: any, { eq }: any) => eq(states.validatorId, request.validatorAddress),
      }) || [];

      if (validators.length === 0) {
        console.log('Validator not found:', request.validatorAddress);
        return false;
      }

      const validator = validators[0];
      const publicKey = validator.publicKey;

      if (!publicKey) {
        console.log('No public key found for validator');
        return false;
      }

      // 4. Verify ECDSA signature using @noble/curves
      const { secp256k1 } = await import('@noble/curves/secp256k1');
      const { sha256 } = await import('@noble/hashes/sha256');

      // Construct message to verify
      const message = `${request.validatorAddress}:${request.requestType}:${request.timestamp}`;
      const messageHash = sha256(new TextEncoder().encode(message));

      // Parse signature and public key (remove '0x' prefix if present)
      const sigHex = request.signature.startsWith('0x') ? request.signature.slice(2) : request.signature;
      const pubHex = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
      
      // Validate signature length (exactly 64 bytes = 128 hex chars)
      if (sigHex.length !== 128) {
        console.log('Invalid signature length:', sigHex.length, 'expected 128 hex chars');
        return false;
      }

      // Validate signature is valid hex
      if (!/^[0-9a-fA-F]+$/.test(sigHex)) {
        console.log('Invalid signature format: not valid hex');
        return false;
      }
      
      // Validate key length (33 bytes compressed or 65 bytes uncompressed)
      if (pubHex.length !== 66 && pubHex.length !== 130) {
        console.log('Invalid public key length:', pubHex.length, 'expected 66 or 130 hex chars');
        return false;
      }

      // Validate public key is valid hex
      if (!/^[0-9a-fA-F]+$/.test(pubHex)) {
        console.log('Invalid public key format: not valid hex');
        return false;
      }
      
      // Verify signature - wrapped in try-catch to prevent crashes from malformed inputs
      try {
        const isValid = secp256k1.verify(sigHex, messageHash, pubHex);
        
        if (!isValid) {
          console.log('ECDSA signature verification failed');
          return false;
        }
        
        console.log('✓ Signature verified for validator:', request.validatorAddress);
        return true;
      } catch (verifyError) {
        console.error('Signature verification error:', verifyError);
        return false;
      }
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
