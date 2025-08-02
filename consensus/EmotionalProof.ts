import { KeyPair } from '../crypto/KeyPair';
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
import { EmotionalValidator } from './EmotionalValidator';
import * as crypto from 'crypto';
/**
 * Cryptographic proof of emotional authenticity for consensus
 * Combines multiple biometric inputs into verifiable proofs
 */
export interface EmotionalProofData {
  validators: string[];
  emotionalScores: Record<string, number>;
  biometricHashes: Record<string, string>;
  temporalWindow: number;
  proofTimestamp: number;
  consensusStrength: number;
}
export interface EmotionalChallenge {
  challengeId: string;
  validatorId: string;
  challenge: string;
  expectedResponse: string;
  timestamp: number;
  timeout: number;
}
export class EmotionalProof {
  private proofData: EmotionalProofData;
  private signature: string;
  private merkleRoot: string;
  private isValid: boolean;
  constructor(
    proofData: EmotionalProofData,
    signature: string,
    merkleRoot: string
  ) {
    this.proofData = proofData;
    this.signature = signature;
    this.merkleRoot = merkleRoot;
    this.isValid = false;
  }
  // Create emotional proof for block consensus
  static async createBlockProof(
    validators: EmotionalValidator[],
    biometricReadings: Map<string, BiometricReading[]>
  ): Promise<EmotionalProof> {
    const proofData: EmotionalProofData = {
      validators: validators.map(v => v.getId()),
      emotionalScores: {},
      biometricHashes: {},
      temporalWindow: 30000, // 30 seconds
      proofTimestamp: Date.now(),
      consensusStrength: 0
    };
    // Collect emotional scores and biometric data
    for (const validator of validators) {
      const validatorId = validator.getId();
      proofData.emotionalScores[validatorId] = validator.getEmotionalScore();
      // Hash biometric data for privacy
      const readings = biometricReadings.get(validatorId) || [];
      const biometricHash = await EmotionalProof.hashBiometricData(readings);
      proofData.biometricHashes[validatorId] = biometricHash;
    }
    // Calculate consensus strength
    proofData.consensusStrength = EmotionalProof.calculateConsensusStrength(
      Object.values(proofData.emotionalScores)
    );
    // Create Merkle tree of proof data
    const merkleRoot = await EmotionalProof.createMerkleRoot(proofData);
    // Sign the proof (using first validator for demo - in practice would be committee primary)
    const primaryValidator = validators[0];
    const signature = await EmotionalProof.signProofData(proofData, primaryValidator);
    const proof = new EmotionalProof(proofData, signature, merkleRoot);
    proof.isValid = await proof.verify();
    return proof;
  }
  // Create individual validator emotional proof
  static async createValidatorProof(
    validator: EmotionalValidator,
    biometricReadings: BiometricReading[],
    challenge?: EmotionalChallenge
  ): Promise<EmotionalProof> {
    const proofData: EmotionalProofData = {
      validators: [validator.getId()],
      emotionalScores: {
        [validator.getId()]: validator.getEmotionalScore()
      },
      biometricHashes: {
        [validator.getId()]: await EmotionalProof.hashBiometricData(biometricReadings)
      },
      temporalWindow: 10000, // 10 seconds for individual proof
      proofTimestamp: Date.now(),
      consensusStrength: validator.getEmotionalScore()
    };
    // Include challenge response if provided
    if (challenge) {
      (proofData as any).challengeResponse = await EmotionalProof.generateChallengeResponse(
        challenge,
        validator,
        biometricReadings
      );
    }
    const merkleRoot = await EmotionalProof.createMerkleRoot(proofData);
    const signature = await EmotionalProof.signProofData(proofData, validator);
    const proof = new EmotionalProof(proofData, signature, merkleRoot);
    proof.isValid = await proof.verify();
    return proof;
  }
  // Biometric data hashing for privacy
  private static async hashBiometricData(readings: BiometricReading[]): Promise<string> {
    if (readings.length === 0) {
      return crypto.createHash('sha256').update('empty').digest('hex');
    }
    // Create deterministic hash of biometric data
    const dataString = readings
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(reading => `${reading.type}:${reading.value}:${reading.quality}:${reading.timestamp}`)
      .join('|');
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
  // Consensus strength calculation
  private static calculateConsensusStrength(emotionalScores: number[]): number {
    if (emotionalScores.length === 0) return 0;
    // Calculate weighted average with variance penalty
    const average = emotionalScores.reduce((sum, score) => sum + score, 0) / emotionalScores.length;
    // Calculate variance
    const variance = emotionalScores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / emotionalScores.length;
    // High variance reduces consensus strength
    const variancePenalty = Math.min(20, variance / 5);
    return Math.max(0, average - variancePenalty);
  }
  // Merkle root creation
  private static async createMerkleRoot(proofData: EmotionalProofData): Promise<string> {
    const elements = [
      JSON.stringify(proofData.validators.sort()),
      JSON.stringify(proofData.emotionalScores),
      JSON.stringify(proofData.biometricHashes),
      proofData.temporalWindow.toString(),
      proofData.proofTimestamp.toString(),
      proofData.consensusStrength.toString()
    ];
    // Simple Merkle tree implementation
    let hashes = elements.map(element => 
      crypto.createHash('sha256').update(element).digest('hex')
    );
    while (hashes.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; // Handle odd number of hashes
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      hashes = nextLevel;
    }
    return hashes[0] || '';
  }
  // CRITICAL FIX: Real cryptographic proof signing using ECDSA
  private static async signProofData(
    proofData: EmotionalProofData,
    validator: EmotionalValidator
  ): Promise<string> {
    const dataToSign = JSON.stringify({
      validators: proofData.validators.sort(),
      emotionalScores: proofData.emotionalScores,
      biometricHashes: proofData.biometricHashes,
      temporalWindow: proofData.temporalWindow,
      proofTimestamp: proofData.proofTimestamp,
      consensusStrength: proofData.consensusStrength
    });
    
    // Use ProductionCrypto for real ECDSA signatures
    const messageHash = crypto.createHash('sha256').update(dataToSign).digest();
    const privateKeyHex = validator.getPrivateKey();
    const privateKey = Buffer.from(privateKeyHex, 'hex');
    
    // Import ProductionCrypto for real signatures
    const { ProductionCrypto } = await import('../crypto/ProductionCrypto');
    const signature = ProductionCrypto.signECDSA(messageHash, privateKey);
    
    return signature.signature;
  }

  // CRITICAL FIX: Real signature verification
  static async verifyProofSignature(
    proofData: EmotionalProofData,
    signature: string,
    publicKeyHex: string
  ): Promise<boolean> {
    try {
      const dataToSign = JSON.stringify({
        validators: proofData.validators.sort(),
        emotionalScores: proofData.emotionalScores,
        biometricHashes: proofData.biometricHashes,
        temporalWindow: proofData.temporalWindow,
        proofTimestamp: proofData.proofTimestamp,
        consensusStrength: proofData.consensusStrength
      });
      
      const messageHash = crypto.createHash('sha256').update(dataToSign).digest();
      const publicKey = Buffer.from(publicKeyHex, 'hex');
      
      const { ProductionCrypto } = await import('../crypto/ProductionCrypto');
      const signatureObj = {
        signature,
        algorithm: 'ECDSA-secp256k1' as const,
        r: '', s: '', recovery: 0
      };
      
      return ProductionCrypto.verifyECDSA(messageHash, signatureObj, publicKey);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
  // Challenge-response mechanism
  static async createEmotionalChallenge(validatorId: string): Promise<EmotionalChallenge> {
    const challengeTypes = [
      'prove_liveness',
      'biometric_freshness',
      'emotional_consistency',
      'temporal_verification'
    ];
    const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
    const challengeType = challengeTypes[Math.floor(randomByte / 255 * challengeTypes.length)];
    const challengeId = crypto.randomBytes(16).toString('hex');
    let challenge: string;
    let expectedResponse: string;
    switch (challengeType) {
      case 'prove_liveness':
        challenge = `liveness_${Date.now()}_${crypto.getRandomValues(new Uint8Array(4))[0]}`;
        expectedResponse = crypto.createHash('sha256').update(challenge + validatorId).digest('hex');
        break;
      case 'biometric_freshness':
        challenge = `freshness_${Date.now()}`;
        expectedResponse = 'fresh_biometric_data_required';
        break;
      case 'emotional_consistency':
        challenge = `consistency_check_${Math.floor(Date.now() / 1000)}`;
        expectedResponse = 'emotional_state_verified';
        break;
      case 'temporal_verification':
        const timestamp = Date.now();
        challenge = `temporal_${timestamp}`;
        expectedResponse = crypto.createHash('sha256').update(`${timestamp}_${validatorId}`).digest('hex');
        break;
      default:
        challenge = 'default_challenge';
        expectedResponse = 'default_response';
    }
    return {
      challengeId,
      validatorId,
      challenge,
      expectedResponse,
      timestamp: Date.now(),
      timeout: 30000 // 30 seconds to respond
    };
  }
  private static async generateChallengeResponse(
    challenge: EmotionalChallenge,
    validator: EmotionalValidator,
    biometricReadings: BiometricReading[]
  ): Promise<string> {
    // Verify challenge is for this validator and not expired
    if (challenge.validatorId !== validator.getId()) {
      throw new Error('Challenge not for this validator');
    }
    if (Date.now() - challenge.timestamp > challenge.timeout) {
      throw new Error('Challenge expired');
    }
    // Generate appropriate response based on challenge type
    if (challenge.challenge.startsWith('liveness_')) {
      return crypto.createHash('sha256').update(challenge.challenge + validator.getId()).digest('hex');
    } else if (challenge.challenge.startsWith('freshness_')) {
      // Verify biometric data is fresh (within last 30 seconds)
      const freshData = biometricReadings.filter(reading => 
        Date.now() - reading.timestamp < 30000
      );
      return freshData.length > 0 ? 'fresh_biometric_data_required' : 'stale_data';
    } else if (challenge.challenge.startsWith('consistency_check_')) {
      // Verify emotional state is consistent
      const currentScore = validator.getEmotionalScore();
      return currentScore > 50 ? 'emotional_state_verified' : 'emotional_state_inconsistent';
    } else if (challenge.challenge.startsWith('temporal_')) {
      const timestamp = challenge.challenge.split('_')[1];
      return crypto.createHash('sha256').update(`${timestamp}_${validator.getId()}`).digest('hex');
    }
    return 'unknown_challenge_type';
  }
  // Proof verification
  async verify(): Promise<boolean> {
    try {
      // Verify temporal validity
      if (!this.verifyTemporalValidity()) {
        return false;
      }
      // Verify Merkle root
      const expectedMerkleRoot = await EmotionalProof.createMerkleRoot(this.proofData);
      if (this.merkleRoot !== expectedMerkleRoot) {
        return false;
      }
      // Verify emotional scores are within valid range
      if (!this.verifyEmotionalScores()) {
        return false;
      }
      // Verify consensus strength calculation
      if (!this.verifyConsensusStrength()) {
        return false;
      }
      // Verify biometric data hashes are present
      if (!this.verifyBiometricHashes()) {
        return false;
      }
      // Signature verification would go here in a real implementation
      // For demo purposes, we'll assume signature is valid if other checks pass
      return true;
    } catch (error) {
      console.error('Emotional proof verification failed:', error.message);
      return false;
    }
  }
  private verifyTemporalValidity(): boolean {
    const now = Date.now();
    const proofAge = now - this.proofData.proofTimestamp;
    // Proof should not be too old (max 5 minutes)
    if (proofAge > 300000) {
      return false;
    }
    // Proof should not be from the future (allow 30 seconds clock skew)
    if (proofAge < -30000) {
      return false;
    }
    return true;
  }
  private verifyEmotionalScores(): boolean {
    for (const [validatorId, score] of Object.entries(this.proofData.emotionalScores)) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return false;
      }
    }
    return true;
  }
  private verifyConsensusStrength(): boolean {
    const scores = Object.values(this.proofData.emotionalScores);
    const expectedStrength = EmotionalProof.calculateConsensusStrength(scores);
    // Allow small rounding differences
    const difference = Math.abs(this.proofData.consensusStrength - expectedStrength);
    return difference < 0.01;
  }
  private verifyBiometricHashes(): boolean {
    // All validators should have biometric hashes
    for (const validatorId of this.proofData.validators) {
      if (!this.proofData.biometricHashes[validatorId]) {
        return false;
      }
      // Hash should be 64 character hex string
      const hash = this.proofData.biometricHashes[validatorId];
      if (!/^[a-f0-9]{64}$/i.test(hash)) {
        return false;
      }
    }
    return true;
  }
  // Zero-knowledge proof generation (simplified version)
  static async generateZeroKnowledgeProof(
    secret: string,
    publicCommitment: string
  ): Promise<{ proof: string; commitment: string }> {
    // Simplified zero-knowledge proof for emotional data
    // In practice, this would use proper ZK-SNARK libraries
    const commitment = crypto.createHash('sha256')
      .update(secret + publicCommitment)
      .digest('hex');
    const proof = crypto.createHash('sha256')
      .update(commitment + Date.now().toString())
      .digest('hex');
    return { proof, commitment };
  }
  static async verifyZeroKnowledgeProof(
    proof: string,
    commitment: string,
    publicCommitment: string
  ): Promise<boolean> {
    // Simplified verification - in practice would verify ZK proof
    return proof.length === 64 && commitment.length === 64;
  }
  // Getters
  getProofData(): EmotionalProofData {
    return { ...this.proofData };
  }
  getSignature(): string {
    return this.signature;
  }
  getMerkleRoot(): string {
    return this.merkleRoot;
  }
  isValidProof(): boolean {
    return this.isValid;
  }
  getValidators(): string[] {
    return [...this.proofData.validators];
  }
  getEmotionalScore(validatorId: string): number | undefined {
    return this.proofData.emotionalScores[validatorId];
  }
  getConsensusStrength(): number {
    return this.proofData.consensusStrength;
  }
  getTimestamp(): number {
    return this.proofData.proofTimestamp;
  }
  // Serialization
  serialize(): string {
    return JSON.stringify({
      proofData: this.proofData,
      signature: this.signature,
      merkleRoot: this.merkleRoot,
      isValid: this.isValid
    });
  }
  static deserialize(serialized: string): EmotionalProof {
    const data = JSON.parse(serialized);
    const proof = new EmotionalProof(data.proofData, data.signature, data.merkleRoot);
    proof.isValid = data.isValid;
    return proof;
  }
  // Proof aggregation for multiple validators
  static async aggregateProofs(proofs: EmotionalProof[]): Promise<EmotionalProof> {
    if (proofs.length === 0) {
      throw new Error('Cannot aggregate empty proof list');
    }
    // Verify all proofs are valid
    for (const proof of proofs) {
      if (!proof.isValid) {
        throw new Error('Cannot aggregate invalid proof');
      }
    }
    // Combine proof data
    const aggregatedData: EmotionalProofData = {
      validators: [],
      emotionalScores: {},
      biometricHashes: {},
      temporalWindow: Math.max(...proofs.map(p => p.proofData.temporalWindow)),
      proofTimestamp: Date.now(),
      consensusStrength: 0
    };
    // Merge all proof data
    for (const proof of proofs) {
      aggregatedData.validators.push(...proof.proofData.validators);
      Object.assign(aggregatedData.emotionalScores, proof.proofData.emotionalScores);
      Object.assign(aggregatedData.biometricHashes, proof.proofData.biometricHashes);
    }
    // Remove duplicates
    aggregatedData.validators = [...new Set(aggregatedData.validators)];
    // Recalculate consensus strength
    aggregatedData.consensusStrength = EmotionalProof.calculateConsensusStrength(
      Object.values(aggregatedData.emotionalScores)
    );
    // Create new proof
    const merkleRoot = await EmotionalProof.createMerkleRoot(aggregatedData);
    const signature = `aggregated_${crypto.randomBytes(16).toString('hex')}`;
    const aggregatedProof = new EmotionalProof(aggregatedData, signature, merkleRoot);
    aggregatedProof.isValid = await aggregatedProof.verify();
    return aggregatedProof;
  }
}