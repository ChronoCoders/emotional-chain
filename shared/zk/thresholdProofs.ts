import { createHash, randomBytes } from 'crypto';
import type { BiometricData } from '../schema';

/**
 * ⚠️ DEMONSTRATION/MOCK IMPLEMENTATION ⚠️
 * 
 * This is a functional demonstration of threshold proof concepts.
 * For production use, replace mock Poseidon with circomlibjs and
 * integrate actual SnarkJS proof generation/verification.
 * 
 * See shared/zk/README.md for production deployment checklist.
 */

/**
 * Privacy-Preserving Threshold Proof
 * Proves emotional score > threshold WITHOUT revealing actual score
 */
export interface EmotionalThresholdProof {
  validatorAddress: string;
  timestamp: number;
  proofData: string; // ZK proof that score > threshold
  commitment: string; // Hash commitment to hide actual score
  isValid: boolean;
  scoreAboveThreshold: boolean; // Only reveals boolean, not value
  nonce?: string; // Optional: for debugging/verification
}

/**
 * Threshold-based ZK Proof System
 * Replaces continuous biometric streaming with periodic threshold proofs
 * 
 * Privacy Features:
 * - Only reveals if score > threshold (boolean)
 * - Never exposes actual emotional score
 * - Uses cryptographic commitments
 * - Periodic submission (10 min) instead of real-time
 * - Random jitter prevents timing analysis
 */
export class ThresholdProofSystem {
  private validatorAddress: string;
  private threshold: number;
  private proofInterval: number; // milliseconds
  private intervalId?: NodeJS.Timeout;

  constructor(
    validatorAddress: string,
    threshold: number = 75,
    proofIntervalMinutes: number = 10
  ) {
    this.validatorAddress = validatorAddress;
    this.threshold = threshold;
    this.proofInterval = proofIntervalMinutes * 60 * 1000; // Convert to ms
  }

  /**
   * Hash function for commitments (Poseidon-compatible mock)
   * 
   * NOTE: This is a simplified mock that mimics Poseidon output format.
   * In production, use actual circomlib Poseidon implementation:
   * import { buildPoseidon } from "circomlibjs";
   * const poseidon = await buildPoseidon();
   * 
   * Poseidon outputs field elements, not hex strings.
   * This mock uses BigInt to simulate field arithmetic.
   */
  private hash(data: string): string {
    // Mock Poseidon: Convert to BigInt, apply simple field operation
    // Real Poseidon would use proper field arithmetic over BN128 curve
    const bytes = Buffer.from(data, 'utf-8');
    let hash = BigInt(0);
    
    // Simple mock: sum bytes with position weights (not cryptographically secure)
    for (let i = 0; i < bytes.length; i++) {
      hash = (hash + BigInt(bytes[i]) * BigInt(i + 1)) % BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'); // BN128 field modulus
    }
    
    // Return as hex string (Poseidon output would be field element)
    // Format: 64 hex chars to match verification expectation
    return hash.toString(16).padStart(64, '0');
  }

  /**
   * Compute emotional score from biometric data
   * Normalized to 0-100 scale
   */
  private computeEmotionalScore(biometricData: BiometricData): number {
    // Simple scoring based on reading type and value
    const { readingType, value, quality } = biometricData;
    
    let score = 50; // Base score
    
    // Adjust based on reading type
    switch (readingType) {
      case 'heart_rate':
        // Optimal HR: 60-100 bpm
        if (value >= 60 && value <= 100) score = 80;
        else if (value < 60) score = 60; // Too low
        else score = 50; // Too high (stressed)
        break;
      case 'hrv':
        // Higher HRV = better
        score = Math.min(100, 50 + (value / 2));
        break;
      case 'stress':
        // Lower stress = better (inverse)
        score = Math.max(0, 100 - value);
        break;
      case 'focus':
        // Higher focus = better
        score = Math.min(100, value);
        break;
      default:
        score = 50;
    }
    
    // Quality adjustment
    score = score * (quality / 100);
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Generate ZK proof that score > threshold
   * Client-side computation (runs on validator's machine)
   */
  async generateThresholdProof(
    biometricData: BiometricData,
    threshold?: number
  ): Promise<EmotionalThresholdProof> {
    const actualThreshold = threshold ?? this.threshold;
    
    // Calculate score locally (private)
    const score = this.computeEmotionalScore(biometricData);
    
    // Generate random nonce for privacy
    const nonce = randomBytes(32);
    const nonceHex = nonce.toString('hex');
    
    // Create commitment: hash(score || nonce)
    const commitment = this.hash(score.toString() + nonceHex);
    
    // Generate ZK proof (simplified version)
    // In production, this would use Circom/SnarkJS
    const proofData = await this.generateProof({
      privateInputs: { score, nonce: nonceHex },
      publicInputs: { threshold: actualThreshold, commitment },
      statement: 'score > threshold',
    });
    
    return {
      validatorAddress: this.validatorAddress,
      timestamp: Date.now(),
      proofData,
      commitment,
      isValid: true,
      scoreAboveThreshold: score > actualThreshold,
      // Note: In production, nonce should NEVER be included
      // Only here for demo/testing purposes
    };
  }

  /**
   * Generate ZK proof (simplified mock implementation)
   * 
   * TODO: Replace with actual Circom/SnarkJS integration:
   * 
   * import { groth16 } from "snarkjs";
   * 
   * // 1. Compile circuit: circom emotionalThreshold.circom --r1cs --wasm
   * // 2. Generate proving key: snarkjs groth16 setup ...
   * // 3. Generate witness from inputs
   * const witness = await generateWitness(circuit, {
   *   score: privateInputs.score,
   *   nonce: privateInputs.nonce,
   *   threshold: publicInputs.threshold,
   *   commitment: publicInputs.commitment
   * });
   * // 4. Generate proof
   * const { proof, publicSignals } = await groth16.prove(provingKey, witness);
   */
  private async generateProof(params: {
    privateInputs: { score: number; nonce: string };
    publicInputs: { threshold: number; commitment: string };
    statement: string;
  }): Promise<string> {
    const { privateInputs, publicInputs } = params;
    
    // Mock proof generation using Poseidon-compatible hashing
    // In production, this would use actual Groth16 proof from SnarkJS
    
    const proofObject = {
      pi_a: this.hash(`${privateInputs.score}_${privateInputs.nonce}_a`),
      pi_b: this.hash(`${privateInputs.score}_${privateInputs.nonce}_b`),
      pi_c: this.hash(`${privateInputs.score}_${privateInputs.nonce}_c`),
      protocol: 'groth16',
      curve: 'bn128',
      hashFunction: 'poseidon', // Document that we use Poseidon
      publicInputs: publicInputs,
      timestamp: Date.now(),
    };
    
    return JSON.stringify(proofObject);
  }

  /**
   * Verify ZK proof without learning actual score
   * Network-side verification (runs on other validators)
   */
  async verifyThresholdProof(
    proof: EmotionalThresholdProof,
    expectedThreshold?: number
  ): Promise<boolean> {
    const threshold = expectedThreshold ?? this.threshold;
    
    // 1. Check timing (prevent replay attacks)
    const currentTime = Date.now();
    const proofAge = currentTime - proof.timestamp;
    
    // Proof must be recent (within 15 minutes)
    if (proofAge > 15 * 60 * 1000) {
      console.log('Proof too old:', proofAge / 1000, 'seconds');
      return false;
    }
    
    // Proof can't be from the future (clock drift tolerance: 30 seconds)
    if (proofAge < -30 * 1000) {
      console.log('Proof from future');
      return false;
    }
    
    // 2. Verify ZK proof without learning actual score
    const isProofValid = await this.verifyProof(proof.proofData, {
      publicInputs: { threshold, commitment: proof.commitment },
    });
    
    if (!isProofValid) {
      console.log('Invalid ZK proof');
      return false;
    }
    
    // 3. Verify commitment structure (should be valid hex)
    if (!/^[0-9a-f]{64}$/i.test(proof.commitment)) {
      console.log('Invalid commitment format');
      return false;
    }
    
    return true;
  }

  /**
   * Verify ZK proof cryptographically
   * 
   * TODO: Replace with actual SnarkJS verification:
   * 
   * import { groth16 } from "snarkjs";
   * const vKey = await loadVerificationKey();
   * const isValid = await groth16.verify(
   *   vKey,
   *   [publicInputs.threshold, publicInputs.commitment],
   *   proof
   * );
   */
  private async verifyProof(
    proofData: string,
    params: {
      publicInputs: { threshold: number; commitment: string };
    }
  ): Promise<boolean> {
    try {
      // Mock verification using Poseidon-compatible logic
      // In production, this would use actual Groth16 verification from SnarkJS
      
      const proof = JSON.parse(proofData);
      
      // Basic structure validation
      if (!proof.pi_a || !proof.pi_b || !proof.pi_c) {
        return false;
      }
      
      // Verify protocol
      if (proof.protocol !== 'groth16') {
        return false;
      }
      
      // Verify hash function matches circuit
      if (proof.hashFunction && proof.hashFunction !== 'poseidon') {
        console.log('Hash function mismatch: expected poseidon, got', proof.hashFunction);
        return false;
      }
      
      // Verify public inputs match
      if (proof.publicInputs.threshold !== params.publicInputs.threshold) {
        return false;
      }
      
      if (proof.publicInputs.commitment !== params.publicInputs.commitment) {
        return false;
      }
      
      // In production, would verify actual ZK proof here using SnarkJS
      // const isValid = await groth16.verify(vKey, publicSignals, proof);
      return true;
    } catch (error) {
      console.error('Proof verification error:', error);
      return false;
    }
  }

  /**
   * Submit proof every 10 minutes instead of continuous stream
   * Includes random jitter to prevent timing analysis
   */
  async startPeriodicProofSubmission(
    getBiometricData: () => Promise<BiometricData>,
    onProofGenerated: (proof: EmotionalThresholdProof) => Promise<void>
  ): Promise<void> {
    const submitProof = async () => {
      try {
        // Collect biometric data
        const biometricData = await getBiometricData();
        
        // Generate threshold proof
        const proof = await this.generateThresholdProof(biometricData);
        
        // Add random jitter (0-60 seconds) to prevent timing analysis
        const jitter = Math.random() * 60 * 1000;
        await new Promise(resolve => setTimeout(resolve, jitter));
        
        // Submit/broadcast proof
        await onProofGenerated(proof);
        
        console.log(`Threshold proof submitted for ${this.validatorAddress} (jitter: ${Math.round(jitter/1000)}s)`);
      } catch (error) {
        console.error('Failed to submit periodic proof:', error);
      }
    };
    
    // Submit first proof immediately
    await submitProof();
    
    // Then submit every interval
    this.intervalId = setInterval(submitProof, this.proofInterval);
  }

  /**
   * Stop periodic proof submission
   */
  stopPeriodicProofSubmission(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log(`Stopped periodic proof submission for ${this.validatorAddress}`);
    }
  }

  /**
   * Batch verify multiple proofs efficiently
   */
  async batchVerifyProofs(
    proofs: EmotionalThresholdProof[]
  ): Promise<{ valid: EmotionalThresholdProof[]; invalid: EmotionalThresholdProof[] }> {
    const results = await Promise.all(
      proofs.map(async (proof) => ({
        proof,
        isValid: await this.verifyThresholdProof(proof),
      }))
    );
    
    return {
      valid: results.filter(r => r.isValid).map(r => r.proof),
      invalid: results.filter(r => !r.isValid).map(r => r.proof),
    };
  }
}

/**
 * Factory function to create threshold proof system
 */
export function createThresholdProofSystem(
  validatorAddress: string,
  threshold: number = 75,
  proofIntervalMinutes: number = 10
): ThresholdProofSystem {
  return new ThresholdProofSystem(validatorAddress, threshold, proofIntervalMinutes);
}

/**
 * Singleton instance for global use
 */
export const thresholdProofSystem = {
  create: createThresholdProofSystem,
  ThresholdProofSystem,
};
