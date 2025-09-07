/**
 * Zero-Knowledge Proof Service for EmotionalChain
 * Manages ZK proof generation, verification, and aggregation
 */

import { EmotionalValidationCircuit, EmotionalZKProof } from './EmotionalValidationCircuit';

// Re-export for external use
export { EmotionalZKProof } from './EmotionalValidationCircuit';
import { EmotionalValidator } from '../EmotionalValidator';
import * as crypto from 'crypto';

export interface ZKProofMetrics {
  totalProofsGenerated: number;
  totalProofsVerified: number;
  averageGenerationTime: number;
  averageVerificationTime: number;
  successRate: number;
  lastReset: number;
}

export interface NetworkZKState {
  activeProofs: Map<string, EmotionalZKProof>;
  validatorProofs: Map<string, EmotionalZKProof[]>;
  aggregatedProof?: EmotionalZKProof;
  consensusEligible: Set<string>;
  lastUpdate: number;
}

/**
 * Core ZK Proof Service for EmotionalChain
 */
export class ZKProofService {
  private static instance: ZKProofService;
  private metrics: ZKProofMetrics;
  private networkState: NetworkZKState;
  private proofCache: Map<string, EmotionalZKProof>;
  
  constructor() {
    this.metrics = {
      totalProofsGenerated: 0,
      totalProofsVerified: 0,
      averageGenerationTime: 0,
      averageVerificationTime: 0,
      successRate: 1.0,
      lastReset: Date.now()
    };
    
    this.networkState = {
      activeProofs: new Map(),
      validatorProofs: new Map(),
      consensusEligible: new Set(),
      lastUpdate: Date.now()
    };
    
    this.proofCache = new Map();
    console.log('🔐 ZK Proof Service initialized');
  }

  static getInstance(): ZKProofService {
    if (!ZKProofService.instance) {
      ZKProofService.instance = new ZKProofService();
    }
    return ZKProofService.instance;
  }

  /**
   * Generate ZK proof for validator emotional state
   */
  async generateValidatorProof(validator: EmotionalValidator): Promise<EmotionalZKProof> {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 Generating ZK proof for validator ${validator.id}...`);
      
      // Generate the ZK proof
      const zkProof = await EmotionalValidationCircuit.generateProof(
        validator.emotionalScore,
        validator.authenticity,
        validator.id
      );
      
      // Cache the proof
      const proofId = this.generateProofId(validator.id, zkProof.timestamp);
      this.proofCache.set(proofId, zkProof);
      
      // Update network state
      this.updateNetworkState(validator.id, zkProof);
      
      // Update metrics
      const generationTime = Date.now() - startTime;
      this.updateGenerationMetrics(generationTime);
      
      console.log(`✅ ZK proof generated for ${validator.id} in ${generationTime}ms`);
      
      return zkProof;
      
    } catch (error) {
      console.error(`❌ ZK proof generation failed for ${validator.id}:`, error);
      this.updateFailureMetrics();
      throw error;
    }
  }

  /**
   * Verify ZK proof for validator
   */
  async verifyValidatorProof(
    validatorId: string, 
    zkProof: EmotionalZKProof
  ): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Verifying ZK proof for validator ${validatorId}...`);
      
      // Verify the proof
      const isValid = await EmotionalValidationCircuit.verifyProof(zkProof);
      
      // Update metrics
      const verificationTime = Date.now() - startTime;
      this.updateVerificationMetrics(verificationTime, isValid);
      
      console.log(`${isValid ? '✅' : '❌'} ZK proof verification for ${validatorId}: ${isValid ? 'VALID' : 'INVALID'} (${verificationTime}ms)`);
      
      return isValid;
      
    } catch (error) {
      console.error(`❌ ZK proof verification failed for ${validatorId}:`, error);
      this.updateFailureMetrics();
      return false;
    }
  }

  /**
   * Generate and verify proofs for multiple validators
   */
  async processValidatorBatch(validators: EmotionalValidator[]): Promise<Map<string, EmotionalZKProof>> {
    console.log(`🔄 Processing ZK proofs for ${validators.length} validators...`);
    
    const proofMap = new Map<string, EmotionalZKProof>();
    
    // Generate proofs in parallel for efficiency
    const proofPromises = validators.map(async (validator) => {
      try {
        const zkProof = await this.generateValidatorProof(validator);
        return { validatorId: validator.id, zkProof };
      } catch (error) {
        console.error(`Failed to generate proof for ${validator.id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(proofPromises);
    
    // Collect valid proofs
    results.forEach(result => {
      if (result) {
        proofMap.set(result.validatorId, result.zkProof);
      }
    });
    
    console.log(`📊 Generated ${proofMap.size}/${validators.length} ZK proofs successfully`);
    
    return proofMap;
  }

  /**
   * Create aggregated proof for consensus round
   */
  async createConsensusProof(validatorProofs: Map<string, EmotionalZKProof>): Promise<EmotionalZKProof> {
    console.log(`🔗 Creating consensus ZK proof from ${validatorProofs.size} validator proofs...`);
    
    try {
      const proofs = Array.from(validatorProofs.values());
      const aggregatedProof = await EmotionalValidationCircuit.aggregateProofs(proofs);
      
      // Update network state
      this.networkState.aggregatedProof = aggregatedProof;
      this.networkState.lastUpdate = Date.now();
      
      // Update consensus eligibility
      this.updateConsensusEligibility(validatorProofs);
      
      console.log(`✅ Consensus ZK proof created with ${this.networkState.consensusEligible.size} eligible validators`);
      
      return aggregatedProof;
      
    } catch (error) {
      console.error('❌ Consensus proof creation failed:', error);
      throw error;
    }
  }

  /**
   * Get network ZK state for consensus
   */
  getNetworkZKState(): NetworkZKState {
    return {
      ...this.networkState,
      // Create defensive copies
      activeProofs: new Map(this.networkState.activeProofs),
      validatorProofs: new Map(this.networkState.validatorProofs),
      consensusEligible: new Set(this.networkState.consensusEligible)
    };
  }

  /**
   * Check if validator is eligible for consensus
   */
  isValidatorEligible(validatorId: string): boolean {
    return this.networkState.consensusEligible.has(validatorId);
  }

  /**
   * Get eligible validator count
   */
  getEligibleValidatorCount(): number {
    return this.networkState.consensusEligible.size;
  }

  /**
   * Get ZK proof metrics
   */
  getMetrics(): ZKProofMetrics {
    return { ...this.metrics };
  }

  /**
   * Clean up old proofs and reset cache
   */
  cleanup(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    const cutoff = now - maxAge;
    
    // Clean proof cache
    let removedCount = 0;
    for (const [proofId, proof] of this.proofCache.entries()) {
      if (proof.timestamp < cutoff) {
        this.proofCache.delete(proofId);
        removedCount++;
      }
    }
    
    // Clean network state
    for (const [validatorId, proofs] of this.networkState.validatorProofs.entries()) {
      const validProofs = proofs.filter(p => p.timestamp >= cutoff);
      if (validProofs.length > 0) {
        this.networkState.validatorProofs.set(validatorId, validProofs);
      } else {
        this.networkState.validatorProofs.delete(validatorId);
      }
    }
    
    console.log(`🧹 Cleaned up ${removedCount} old ZK proofs`);
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalProofsGenerated: 0,
      totalProofsVerified: 0,
      averageGenerationTime: 0,
      averageVerificationTime: 0,
      successRate: 1.0,
      lastReset: Date.now()
    };
    console.log('📊 ZK proof metrics reset');
  }

  // Private helper methods

  private generateProofId(validatorId: string, timestamp: number): string {
    return crypto.createHash('sha256')
      .update(`${validatorId}:${timestamp}`)
      .digest('hex')
      .substring(0, 16);
  }

  private updateNetworkState(validatorId: string, zkProof: EmotionalZKProof): void {
    // Add to active proofs
    const proofId = this.generateProofId(validatorId, zkProof.timestamp);
    this.networkState.activeProofs.set(proofId, zkProof);
    
    // Add to validator proofs history
    const existingProofs = this.networkState.validatorProofs.get(validatorId) || [];
    existingProofs.push(zkProof);
    this.networkState.validatorProofs.set(validatorId, existingProofs);
    
    // Update eligibility based on proof
    const thresholdMet = zkProof.publicSignals[0] === '1';
    const authenticityValid = zkProof.publicSignals[1] === '1';
    
    if (thresholdMet && authenticityValid) {
      this.networkState.consensusEligible.add(validatorId);
    } else {
      this.networkState.consensusEligible.delete(validatorId);
    }
    
    this.networkState.lastUpdate = Date.now();
  }

  private updateConsensusEligibility(validatorProofs: Map<string, EmotionalZKProof>): void {
    this.networkState.consensusEligible.clear();
    
    for (const [validatorId, proof] of validatorProofs.entries()) {
      const thresholdMet = proof.publicSignals[0] === '1';
      const authenticityValid = proof.publicSignals[1] === '1';
      
      if (thresholdMet && authenticityValid) {
        this.networkState.consensusEligible.add(validatorId);
      }
    }
  }

  private updateGenerationMetrics(generationTime: number): void {
    this.metrics.totalProofsGenerated++;
    this.metrics.averageGenerationTime = 
      (this.metrics.averageGenerationTime + generationTime) / 2;
  }

  private updateVerificationMetrics(verificationTime: number, success: boolean): void {
    this.metrics.totalProofsVerified++;
    this.metrics.averageVerificationTime = 
      (this.metrics.averageVerificationTime + verificationTime) / 2;
    
    if (success) {
      this.metrics.successRate = 
        (this.metrics.successRate + 1.0) / 2;
    } else {
      this.metrics.successRate = 
        (this.metrics.successRate + 0.0) / 2;
    }
  }

  private updateFailureMetrics(): void {
    this.metrics.successRate = (this.metrics.successRate + 0.0) / 2;
  }
}