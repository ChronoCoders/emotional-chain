/**
 * ZK Proof Integration for EmotionalChain Server
 * Manages ZK proof operations in the blockchain context
 */

import { ZKProofService } from '../../crypto/zkproofs/ZKProofService';
import { EmotionalZKProof } from '../../crypto/zkproofs/EmotionalValidationCircuit';
import { EmotionalValidator } from '../../crypto/EmotionalValidator';

export class ZKProofIntegration {
  private zkProofService: ZKProofService;
  
  constructor() {
    this.zkProofService = ZKProofService.getInstance();
    console.log('🔐 ZK Proof Integration initialized');
  }

  /**
   * Process validators for consensus using ZK proofs
   */
  async processValidatorsForConsensus(validators: EmotionalValidator[]): Promise<{
    eligibleValidators: string[];
    zkProofs: Map<string, EmotionalZKProof>;
    consensusProof: EmotionalZKProof;
  }> {
    console.log(`🔄 Processing ${validators.length} validators with ZK proofs...`);
    
    try {
      // Generate ZK proofs for all validators
      const zkProofs = await this.zkProofService.processValidatorBatch(validators);
      
      // Create consensus proof
      const consensusProof = await this.zkProofService.createConsensusProof(zkProofs);
      
      // Get eligible validators
      const eligibleValidators = Array.from(zkProofs.keys()).filter(validatorId => 
        this.zkProofService.isValidatorEligible(validatorId)
      );
      
      console.log(`✅ ZK consensus processing complete: ${eligibleValidators.length}/${validators.length} validators eligible`);
      
      return {
        eligibleValidators,
        zkProofs,
        consensusProof
      };
      
    } catch (error) {
      console.error('❌ ZK consensus processing failed:', error);
      throw error;
    }
  }

  /**
   * Get network ZK state for monitoring
   */
  getNetworkZKState() {
    return this.zkProofService.getNetworkZKState();
  }

  /**
   * Get ZK proof metrics for analytics
   */
  getZKMetrics() {
    return this.zkProofService.getMetrics();
  }

  /**
   * Verify ZK proof for external validation
   */
  async verifyZKProof(validatorId: string, zkProof: EmotionalZKProof): Promise<boolean> {
    return await this.zkProofService.verifyValidatorProof(validatorId, zkProof);
  }

  /**
   * Clean up old ZK proofs
   */
  performCleanup(maxAge?: number) {
    this.zkProofService.cleanup(maxAge);
  }

  /**
   * Reset ZK metrics
   */
  resetMetrics() {
    this.zkProofService.resetMetrics();
  }
}