/**
 * BiometricConsent Smart Contract
 * 
 * Manages GDPR consent on-chain for validator registration
 * Implements consent versioning and withdrawal functionality
 * 
 * NOTE: This is a TypeScript simulation for demonstration
 * Production would deploy actual Solidity contracts to EVM
 */

export interface ConsentRecord {
  validatorAddress: string;
  consentVersion: string;
  consentHash: string; // Hash of consent text
  timestamp: number;
  isActive: boolean;
  dataProcessingPurpose: string;
}

export interface ConsentEvent {
  eventType: 'consent_given' | 'consent_revoked' | 'consent_updated';
  validatorAddress: string;
  timestamp: number;
  consentVersion: string;
}

/**
 * BiometricConsent Contract
 * Manages GDPR consent for biometric data processing
 */
export class BiometricConsentContract {
  private consents: Map<string, ConsentRecord> = new Map();
  private eventLog: ConsentEvent[] = [];
  
  // Contract owner (for admin operations)
  private owner: string;
  
  // Current consent version
  private currentConsentVersion = 'v1.0';
  private consentTextHash = '0x' + 'a'.repeat(64); // SHA-256 hash of consent text

  constructor(owner: string) {
    this.owner = owner;
  }

  /**
   * Give consent for biometric data processing
   * Required before validator registration
   */
  giveConsent(
    validatorAddress: string,
    dataProcessingPurpose: string,
    consentVersion?: string
  ): ConsentRecord {
    const version = consentVersion || this.currentConsentVersion;
    
    const consent: ConsentRecord = {
      validatorAddress,
      consentVersion: version,
      consentHash: this.consentTextHash,
      timestamp: Date.now(),
      isActive: true,
      dataProcessingPurpose,
    };

    this.consents.set(validatorAddress, consent);

    // Emit event
    this.eventLog.push({
      eventType: 'consent_given',
      validatorAddress,
      timestamp: consent.timestamp,
      consentVersion: version,
    });

    return consent;
  }

  /**
   * Revoke consent
   * Triggers automatic unstaking in validator system
   */
  revokeConsent(validatorAddress: string): boolean {
    const consent = this.consents.get(validatorAddress);
    
    if (!consent) {
      throw new Error('No consent record found');
    }

    consent.isActive = false;
    this.consents.set(validatorAddress, consent);

    // Emit event
    this.eventLog.push({
      eventType: 'consent_revoked',
      validatorAddress,
      timestamp: Date.now(),
      consentVersion: consent.consentVersion,
    });

    return true;
  }

  /**
   * Update consent to new version
   * Used when privacy policy changes
   */
  updateConsent(
    validatorAddress: string,
    newDataProcessingPurpose?: string
  ): ConsentRecord {
    const existingConsent = this.consents.get(validatorAddress);
    
    if (!existingConsent) {
      throw new Error('No existing consent to update');
    }

    const updatedConsent: ConsentRecord = {
      ...existingConsent,
      consentVersion: this.currentConsentVersion,
      consentHash: this.consentTextHash,
      timestamp: Date.now(),
      dataProcessingPurpose: newDataProcessingPurpose || existingConsent.dataProcessingPurpose,
    };

    this.consents.set(validatorAddress, updatedConsent);

    // Emit event
    this.eventLog.push({
      eventType: 'consent_updated',
      validatorAddress,
      timestamp: updatedConsent.timestamp,
      consentVersion: this.currentConsentVersion,
    });

    return updatedConsent;
  }

  /**
   * Check if validator has valid consent
   */
  hasValidConsent(validatorAddress: string): boolean {
    const consent = this.consents.get(validatorAddress);
    
    if (!consent) {
      return false;
    }

    return consent.isActive === true;
  }

  /**
   * Get consent record
   */
  getConsent(validatorAddress: string): ConsentRecord | null {
    return this.consents.get(validatorAddress) || null;
  }

  /**
   * Get all active consents (admin only)
   */
  getAllActiveConsents(): ConsentRecord[] {
    return Array.from(this.consents.values()).filter(c => c.isActive);
  }

  /**
   * Update consent version (admin only)
   * When privacy policy changes
   */
  updateConsentVersion(newVersion: string, newConsentHash: string) {
    // Only owner can update
    this.currentConsentVersion = newVersion;
    this.consentTextHash = newConsentHash;
  }

  /**
   * Get consent event log (audit trail)
   */
  getEventLog(): ConsentEvent[] {
    return [...this.eventLog];
  }

  /**
   * Get events for specific validator
   */
  getValidatorEvents(validatorAddress: string): ConsentEvent[] {
    return this.eventLog.filter(e => e.validatorAddress === validatorAddress);
  }

  /**
   * Export contract state (for backup/migration)
   */
  exportState() {
    return {
      consents: Array.from(this.consents.entries()),
      eventLog: this.eventLog,
      currentConsentVersion: this.currentConsentVersion,
      consentTextHash: this.consentTextHash,
    };
  }

  /**
   * Import contract state (for restore/migration)
   */
  importState(state: {
    consents: [string, ConsentRecord][];
    eventLog: ConsentEvent[];
    currentConsentVersion: string;
    consentTextHash: string;
  }) {
    this.consents = new Map(state.consents);
    this.eventLog = state.eventLog;
    this.currentConsentVersion = state.currentConsentVersion;
    this.consentTextHash = state.consentTextHash;
  }
}

// Singleton instance
export const biometricConsentContract = new BiometricConsentContract('system');

/**
 * Helper: Generate consent text hash
 * Used to verify consent text hasn't changed
 */
export function generateConsentHash(consentText: string): string {
  const crypto = require('crypto');
  return '0x' + crypto.createHash('sha256').update(consentText).digest('hex');
}

/**
 * Standard GDPR consent text for biometric processing
 */
export const GDPR_CONSENT_TEXT_V1 = `
EmotionalChain Biometric Data Processing Consent (v1.0)

By accepting this consent, you authorize EmotionalChain to:

1. COLLECT: Process biometric data from your registered devices (heart rate, stress levels, EEG, etc.)
2. PROCESS: Compute emotional fitness scores locally on your device
3. STORE: Store only cryptographic commitments (hashes) of your scores, NOT raw biometric data
4. USE: Use commitment proofs for consensus participation and network validation

Data Minimization:
- Raw biometric data NEVER leaves your device
- Only cryptographic hashes stored on-chain
- Personal information stored separately and can be deleted

Your Rights (GDPR):
- Right to Access: Export all your data at any time
- Right to Erasure: Request deletion of personal data
- Right to Portability: Receive your data in machine-readable format
- Right to Revoke: Withdraw consent at any time (triggers unstaking)

Data Processing Purpose:
- Network consensus validation
- Emotional fitness verification
- Anti-spoofing and fraud prevention

Data Retention:
- Personal data: Deleted upon request
- Blockchain commitments: Retained (pseudonymous, cannot reveal personal data)

Contact Data Protection Officer: dpo@emotionalchain.io

By clicking "I Accept", you confirm that you:
1. Understand how your biometric data will be processed
2. Consent to the processing described above
3. Can withdraw consent at any time
`;

// Generate hash for v1.0 consent
export const GDPR_CONSENT_HASH_V1 = generateConsentHash(GDPR_CONSENT_TEXT_V1);
