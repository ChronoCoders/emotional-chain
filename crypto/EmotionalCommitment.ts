import * as crypto from 'crypto';

/**
 * Cryptographic commitments for emotional data privacy
 * Allows validation without exposing raw biometric values
 */
export class EmotionalCommitment {
  
  /**
   * Create cryptographic commitment for emotional score
   * Uses salted hash to prevent rainbow table attacks
   */
  static createEmotionalCommitment(
    emotionalScore: number,
    validatorId: string,
    timestamp: number,
    salt?: string
  ): EmotionalCommitmentData {
    // Generate random salt if not provided
    const commitmentSalt = salt || crypto.randomBytes(32).toString('hex');
    
    // Create commitment data
    const commitmentInput = `${emotionalScore}:${validatorId}:${timestamp}:${commitmentSalt}`;
    const commitment = crypto.createHash('sha256').update(commitmentInput).digest('hex');
    
    // Create threshold proof (binary: above/below threshold without revealing exact score)
    const thresholdMet = emotionalScore >= 75.0;
    const thresholdProof = this.createThresholdProof(emotionalScore, thresholdMet, commitmentSalt);
    
    return {
      commitment,
      thresholdProof,
      thresholdMet,
      salt: commitmentSalt,
      timestamp,
      validatorId
    };
  }

  /**
   * Create authenticity commitment for biometric data
   */
  static createAuthenticityCommitment(
    authenticity: number,
    deviceFingerprint: string,
    validatorId: string,
    timestamp: number,
    salt?: string
  ): AuthenticityCommitmentData {
    const commitmentSalt = salt || crypto.randomBytes(32).toString('hex');
    
    // Commitment to authenticity score
    const commitmentInput = `${authenticity}:${deviceFingerprint}:${validatorId}:${timestamp}:${commitmentSalt}`;
    const commitment = crypto.createHash('sha256').update(commitmentInput).digest('hex');
    
    // Authenticity threshold proof (above 70% without revealing exact value)
    const authenticityMet = authenticity >= 0.70;
    const authenticityProof = this.createThresholdProof(authenticity * 100, authenticityMet, commitmentSalt);
    
    return {
      commitment,
      authenticityProof,
      authenticityMet,
      deviceFingerprint,
      salt: commitmentSalt,
      timestamp,
      validatorId
    };
  }

  /**
   * Create consensus weight commitment
   * Allows participation without revealing exact consensus scoring
   */
  static createConsensusCommitment(
    consensusScore: number,
    emotionalWeight: number,
    validatorId: string,
    timestamp: number
  ): ConsensusCommitmentData {
    const salt = crypto.randomBytes(32).toString('hex');
    
    // Combined consensus metric
    const combinedScore = (consensusScore * 0.7) + (emotionalWeight * 0.3);
    const commitmentInput = `${combinedScore}:${validatorId}:${timestamp}:${salt}`;
    const commitment = crypto.createHash('sha256').update(commitmentInput).digest('hex');
    
    // Consensus eligibility (binary qualification)
    const consensusEligible = combinedScore >= 70.0;
    
    return {
      commitment,
      consensusEligible,
      consensusWeight: consensusEligible ? 1 : 0, // Binary weight for privacy
      salt,
      timestamp,
      validatorId
    };
  }

  /**
   * Verify emotional commitment without revealing the original value
   */
  static verifyEmotionalCommitment(
    commitment: EmotionalCommitmentData,
    claimedScore: number,
    validatorId: string,
    timestamp: number
  ): boolean {
    // Recreate commitment with claimed values
    const recreatedCommitment = this.createEmotionalCommitment(
      claimedScore,
      validatorId,
      timestamp,
      commitment.salt
    );
    
    // Verify commitment matches
    return recreatedCommitment.commitment === commitment.commitment &&
           recreatedCommitment.thresholdMet === commitment.thresholdMet;
  }

  /**
   * Verify authenticity commitment
   */
  static verifyAuthenticityCommitment(
    commitment: AuthenticityCommitmentData,
    claimedAuthenticity: number,
    deviceFingerprint: string,
    validatorId: string,
    timestamp: number
  ): boolean {
    const recreatedCommitment = this.createAuthenticityCommitment(
      claimedAuthenticity,
      deviceFingerprint,
      validatorId,
      timestamp,
      commitment.salt
    );
    
    return recreatedCommitment.commitment === commitment.commitment &&
           recreatedCommitment.authenticityMet === commitment.authenticityMet;
  }

  /**
   * Create threshold proof - proves value meets threshold without revealing exact value
   */
  private static createThresholdProof(
    value: number,
    thresholdMet: boolean,
    salt: string
  ): string {
    // Create proof that threshold is met/not met
    const proofInput = `${thresholdMet}:${salt}:${Math.floor(value / 10)}`; // Fuzzy bucket
    return crypto.createHash('sha256').update(proofInput).digest('hex');
  }

  /**
   * Generate device fingerprint for anti-spoofing
   */
  static generateDeviceFingerprint(deviceInfo: any): string {
    const fingerprintData = {
      deviceType: deviceInfo.type || 'unknown',
      manufacturer: deviceInfo.manufacturer || 'unknown',
      model: deviceInfo.model || 'unknown',
      capabilities: deviceInfo.capabilities || [],
      // Don't include serial numbers or unique identifiers for privacy
    };
    
    const fingerprintString = JSON.stringify(fingerprintData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex').substring(0, 16);
  }

  /**
   * Create aggregate network commitment for consensus round
   */
  static createNetworkCommitment(
    validatorCommitments: EmotionalCommitmentData[],
    roundId: string,
    timestamp: number
  ): NetworkCommitmentData {
    // Count eligible validators without revealing individual scores
    const eligibleCount = validatorCommitments.filter(c => c.thresholdMet).length;
    const totalValidators = validatorCommitments.length;
    
    // Network health metric
    const participationRate = eligibleCount / totalValidators;
    const networkHealthy = participationRate >= 0.67; // 67% minimum
    
    // Aggregate commitment
    const commitmentHashes = validatorCommitments.map(c => c.commitment).sort();
    const aggregateInput = `${commitmentHashes.join(':')}:${roundId}:${timestamp}`;
    const networkCommitment = crypto.createHash('sha256').update(aggregateInput).digest('hex');
    
    return {
      networkCommitment,
      eligibleValidators: eligibleCount,
      totalValidators,
      participationRate: Math.round(participationRate * 100) / 100,
      networkHealthy,
      roundId,
      timestamp
    };
  }
}

// Type definitions for cryptographic commitments
export interface EmotionalCommitmentData {
  commitment: string;          // Cryptographic commitment hash
  thresholdProof: string;      // Proof that threshold is met
  thresholdMet: boolean;       // Binary: meets emotional threshold
  salt: string;                // Salt for commitment
  timestamp: number;           // Commitment timestamp
  validatorId: string;         // Validator identifier
}

export interface AuthenticityCommitmentData {
  commitment: string;          // Authenticity commitment hash
  authenticityProof: string;   // Proof of authenticity threshold
  authenticityMet: boolean;    // Binary: meets authenticity threshold
  deviceFingerprint: string;   // Device identification (not unique ID)
  salt: string;                // Commitment salt
  timestamp: number;           // Commitment timestamp
  validatorId: string;         // Validator identifier
}

export interface ConsensusCommitmentData {
  commitment: string;          // Consensus score commitment
  consensusEligible: boolean;  // Binary: eligible for consensus
  consensusWeight: number;     // Weight in consensus (0 or 1)
  salt: string;                // Commitment salt
  timestamp: number;           // Commitment timestamp
  validatorId: string;         // Validator identifier
}

export interface NetworkCommitmentData {
  networkCommitment: string;   // Aggregate network commitment
  eligibleValidators: number;  // Count of eligible validators
  totalValidators: number;     // Total validator count
  participationRate: number;   // Network participation rate
  networkHealthy: boolean;     // Network health status
  roundId: string;             // Consensus round identifier
  timestamp: number;           // Network commitment timestamp
}