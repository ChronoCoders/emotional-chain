import { randomBytes, createHash } from 'crypto';
import type { EmotionalThresholdProof } from './thresholdProofs';

/**
 * ⚠️ DEMONSTRATION/MOCK IMPLEMENTATION ⚠️
 * 
 * Batch proof system to prevent inference attacks by hiding individual
 * validator timing patterns. Aggregates 10 validator proofs into one batch.
 * 
 * For production, integrate with actual proof aggregation schemes like:
 * - Recursive SNARKs (Halo2, Nova)
 * - Proof batching with Plonk/Groth16
 * - BLS signature aggregation
 */

/**
 * Batch Proof Structure
 * Aggregates multiple validator proofs to hide individual patterns
 */
export interface BatchProof {
  batchId: string;
  validatorCommitments: string[]; // 10 validators submit together
  aggregatedProof: string; // Single proof for entire batch
  timestamp: number;
  validatorCount: number;
  thresholdsPassed: number; // How many validators passed threshold
  isValid: boolean;
}

export interface InsertBatchProof {
  batchId: string;
  validatorCommitments: string[];
  aggregatedProof: string;
  timestamp: number;
  validatorCount: number;
  thresholdsPassed: number;
  isValid: boolean;
}

/**
 * Dummy Transaction for Pattern Obfuscation
 * Adds noise to prevent timing analysis
 */
export interface DummyTransaction {
  id: string;
  type: 'dummy';
  timestamp: number;
  size: number; // Random size to mimic real transactions
  isDummy: boolean; // For internal tracking only, not broadcast
}

/**
 * Batch Proof Coordinator
 * Aggregates individual threshold proofs into batches to prevent inference attacks
 * 
 * Privacy Features:
 * - Batches 10 proofs together (hides individual submission timing)
 * - Dummy transactions fill gaps (prevents batch size analysis)
 * - Random batch release timing (0-30s jitter)
 * - Only reveals aggregate statistics, not individual results
 */
export class BatchProofCoordinator {
  private proofQueue: Map<string, EmotionalThresholdProof> = new Map();
  private batchSize: number;
  private maxWaitTime: number; // Max time to wait for batch to fill (ms)
  private lastBatchTime: number = 0;
  private batchInterval?: NodeJS.Timeout;

  constructor(
    batchSize: number = 10,
    maxWaitTimeMinutes: number = 5
  ) {
    this.batchSize = batchSize;
    this.maxWaitTime = maxWaitTimeMinutes * 60 * 1000;
  }

  /**
   * Queue a proof for batch submission
   * When queue reaches batchSize, automatically creates batch
   */
  async queueProof(proof: EmotionalThresholdProof): Promise<void> {
    this.proofQueue.set(proof.validatorAddress, proof);
    
    console.log(`Proof queued for ${proof.validatorAddress}. Queue size: ${this.proofQueue.size}/${this.batchSize}`);
    
    // When we have enough proofs, create batch
    if (this.proofQueue.size >= this.batchSize) {
      await this.createBatchProof();
    }
  }

  /**
   * Force create batch even if not full (after timeout)
   * Fills with dummy proofs to maintain constant batch size
   */
  async forceCreateBatch(): Promise<BatchProof | null> {
    if (this.proofQueue.size === 0) {
      return null;
    }

    // Fill remaining slots with dummy proofs
    const dummyCount = this.batchSize - this.proofQueue.size;
    if (dummyCount > 0) {
      console.log(`Adding ${dummyCount} dummy proofs to maintain batch size`);
      for (let i = 0; i < dummyCount; i++) {
        const dummyProof = this.createDummyProof();
        this.proofQueue.set(`dummy_${i}_${Date.now()}`, dummyProof);
      }
    }

    return await this.createBatchProof();
  }

  /**
   * Create dummy proof for padding
   * Indistinguishable from real proofs to prevent size-based inference
   */
  private createDummyProof(): EmotionalThresholdProof {
    const nonce = randomBytes(32).toString('hex');
    const fakeCommitment = createHash('sha256').update(nonce).digest('hex');
    
    return {
      validatorAddress: `dummy_${randomBytes(8).toString('hex')}`,
      timestamp: Date.now(),
      proofData: JSON.stringify({
        pi_a: randomBytes(32).toString('hex'),
        pi_b: randomBytes(32).toString('hex'),
        pi_c: randomBytes(32).toString('hex'),
        protocol: 'groth16',
        curve: 'bn128',
        hashFunction: 'poseidon',
        isDummy: true, // Internal flag, not revealed
      }),
      commitment: fakeCommitment,
      isValid: true,
      scoreAboveThreshold: Math.random() > 0.3, // Random to mimic real distribution
    };
  }

  /**
   * Aggregate individual proofs into batch
   * Hides individual validator patterns and timing
   */
  async createBatchProof(): Promise<BatchProof> {
    const proofs = Array.from(this.proofQueue.values()).slice(0, this.batchSize);
    
    if (proofs.length === 0) {
      throw new Error('Cannot create batch proof from empty queue');
    }

    // Extract commitments (order randomized to prevent correlation)
    const shuffledProofs = this.shuffleArray([...proofs]);
    const commitments = shuffledProofs.map(p => p.commitment);
    
    // Count how many passed threshold (aggregate statistic)
    const thresholdsPassed = proofs.filter(p => p.scoreAboveThreshold).length;
    
    // Create aggregated proof
    const aggregatedProof = await this.aggregateProofs(shuffledProofs);
    
    // Generate batch ID
    const batchId = randomBytes(16).toString('hex');
    
    // Add random jitter before release (0-30 seconds)
    const jitter = Math.random() * 30 * 1000;
    await new Promise(resolve => setTimeout(resolve, jitter));
    
    // Clear processed proofs
    proofs.forEach(p => this.proofQueue.delete(p.validatorAddress));
    
    const batch: BatchProof = {
      batchId,
      validatorCommitments: commitments,
      aggregatedProof,
      timestamp: Date.now(),
      validatorCount: proofs.length,
      thresholdsPassed,
      isValid: true,
    };

    this.lastBatchTime = Date.now();
    
    console.log(`Batch proof created: ${batchId} (${thresholdsPassed}/${proofs.length} passed threshold, jitter: ${Math.round(jitter/1000)}s)`);
    
    return batch;
  }

  /**
   * Aggregate multiple ZK proofs into one
   * 
   * TODO: Production implementation:
   * - Use recursive SNARKs (Halo2/Nova)
   * - Or proof batching with Plonk
   * - Or BLS signature aggregation
   */
  private async aggregateProofs(proofs: EmotionalThresholdProof[]): Promise<string> {
    // Mock aggregation: combine proof data with Merkle tree
    const proofHashes = proofs.map(p => {
      return createHash('sha256').update(p.proofData).digest('hex');
    });
    
    // Build Merkle root of all proofs
    const merkleRoot = this.buildMerkleRoot(proofHashes);
    
    const aggregated = {
      type: 'batch_proof',
      merkleRoot,
      proofCount: proofs.length,
      individualProofs: proofHashes, // In production, this would be proof aggregation
      protocol: 'groth16_batch',
      timestamp: Date.now(),
    };
    
    return JSON.stringify(aggregated);
  }

  /**
   * Build Merkle root from proof hashes
   */
  private buildMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];
    
    const newLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left;
      const combined = createHash('sha256').update(left + right).digest('hex');
      newLevel.push(combined);
    }
    
    return this.buildMerkleRoot(newLevel);
  }

  /**
   * Verify batch proof
   * Ensures all individual proofs are valid
   */
  async verifyBatchProof(batch: BatchProof): Promise<boolean> {
    try {
      // Parse aggregated proof
      const aggregated = JSON.parse(batch.aggregatedProof);
      
      // Verify proof count matches
      if (aggregated.proofCount !== batch.validatorCount) {
        console.log('Proof count mismatch');
        return false;
      }
      
      // Verify batch isn't too old (prevent replay)
      const batchAge = Date.now() - batch.timestamp;
      if (batchAge > 15 * 60 * 1000) { // 15 minutes
        console.log('Batch too old:', batchAge / 1000, 'seconds');
        return false;
      }
      
      // Verify commitment count
      if (batch.validatorCommitments.length !== batch.validatorCount) {
        console.log('Commitment count mismatch');
        return false;
      }
      
      // In production, would verify actual aggregated ZK proof
      return true;
    } catch (error) {
      console.error('Batch verification error:', error);
      return false;
    }
  }

  /**
   * Shuffle array for randomization (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Start automatic batch creation timer
   * Creates batches periodically even if not full
   */
  startAutoBatching(onBatchCreated: (batch: BatchProof) => Promise<void>): void {
    this.batchInterval = setInterval(async () => {
      const timeSinceLastBatch = Date.now() - this.lastBatchTime;
      
      // If enough time passed and we have proofs, force batch
      if (timeSinceLastBatch >= this.maxWaitTime && this.proofQueue.size > 0) {
        const batch = await this.forceCreateBatch();
        if (batch) {
          await onBatchCreated(batch);
        }
      }
    }, 30 * 1000); // Check every 30 seconds
  }

  /**
   * Stop automatic batching
   */
  stopAutoBatching(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = undefined;
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.proofQueue.size;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    size: number;
    batchSize: number;
    percentFull: number;
    timeSinceLastBatch: number;
  } {
    return {
      size: this.proofQueue.size,
      batchSize: this.batchSize,
      percentFull: (this.proofQueue.size / this.batchSize) * 100,
      timeSinceLastBatch: Date.now() - this.lastBatchTime,
    };
  }
}

/**
 * Dummy Transaction Generator
 * Creates fake transactions to obfuscate validator patterns
 */
export class DummyTransactionGenerator {
  private intervalId?: NodeJS.Timeout;

  /**
   * Generate dummy transaction
   */
  generateDummyTransaction(): DummyTransaction {
    return {
      id: `dummy_${randomBytes(16).toString('hex')}`,
      type: 'dummy',
      timestamp: Date.now(),
      size: Math.floor(Math.random() * 1000) + 100, // 100-1100 bytes
      isDummy: true,
    };
  }

  /**
   * Start generating dummy transactions at random intervals
   * Mixes with real transactions to prevent pattern analysis
   */
  startGenerating(
    minIntervalSeconds: number = 30,
    maxIntervalSeconds: number = 120,
    onGenerate: (tx: DummyTransaction) => void
  ): void {
    const schedule = () => {
      // Generate dummy transaction
      const dummyTx = this.generateDummyTransaction();
      onGenerate(dummyTx);
      
      // Schedule next one at random interval
      const nextInterval = (minIntervalSeconds + Math.random() * (maxIntervalSeconds - minIntervalSeconds)) * 1000;
      this.intervalId = setTimeout(schedule, nextInterval);
    };
    
    schedule();
  }

  /**
   * Stop generating dummy transactions
   */
  stopGenerating(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = undefined;
    }
  }
}

/**
 * Factory functions
 */
export function createBatchProofCoordinator(
  batchSize: number = 10,
  maxWaitTimeMinutes: number = 5
): BatchProofCoordinator {
  return new BatchProofCoordinator(batchSize, maxWaitTimeMinutes);
}

export function createDummyTransactionGenerator(): DummyTransactionGenerator {
  return new DummyTransactionGenerator();
}

/**
 * Singleton instances for global use
 */
export const batchProofSystem = {
  createCoordinator: createBatchProofCoordinator,
  createDummyGenerator: createDummyTransactionGenerator,
  BatchProofCoordinator,
  DummyTransactionGenerator,
};
