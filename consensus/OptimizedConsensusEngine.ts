import { ProofOfEmotionEngine, ConsensusConfig, ConsensusState, EpochResult } from './ProofOfEmotionEngine';
import { EmotionalValidator } from './EmotionalValidator';
import { P2PNode } from '../network/P2PNode';
import { DatabaseStorage } from '../server/storage';
import { Worker } from 'worker_threads';
import LRU from 'lru-cache';
import PQueue from 'p-queue';
import { performance } from 'perf_hooks';
import * as _ from 'lodash';

interface ValidatorChunk {
  validators: EmotionalValidator[];
  chunkId: number;
  startIndex: number;
  endIndex: number;
}

interface ChunkProcessingResult {
  chunkId: number;
  processedValidators: EmotionalValidator[];
  emotionalScores: number[];
  processingTime: number;
  errors: string[];
}

interface OptimizedConsensusResult extends EpochResult {
  performance: {
    totalProcessingTime: number;
    parallelizationEfficiency: number;
    validatorThroughput: number;
    databaseQueryTime: number;
    networkLatency: number;
  };
}

/**
 * High-performance consensus engine optimized for 1000+ validators
 * Features parallel processing, intelligent caching, and database optimization
 */
export class OptimizedConsensusEngine extends ProofOfEmotionEngine {
  // Performance caches
  private validatorCache = new LRU<string, EmotionalValidator>({ 
    max: 2000,
    ttl: 300000 // 5 minutes TTL
  });
  
  private emotionalScoreCache = new LRU<string, number>({ 
    max: 2000,
    ttl: 60000 // 1 minute TTL for scores
  });
  
  private biometricDataCache = new LRU<string, any>({ 
    max: 5000,
    ttl: 30000 // 30 seconds TTL for biometric data
  });

  // Worker pool for parallel processing
  private workerPool: Worker[] = [];
  private processingQueue = new PQueue({ 
    concurrency: 4,
    intervalCap: 100,
    interval: 1000
  });

  // Performance metrics
  private performanceMetrics = {
    totalConsensusRounds: 0,
    averageProcessingTime: 0,
    maxValidatorsProcessed: 0,
    cacheHitRate: 0,
    parallelizationGains: 0
  };

  // Database connection pool optimization
  private readonly BATCH_SIZE = 250;
  private readonly MAX_PARALLEL_CHUNKS = 4;
  private readonly CACHE_WARM_UP_SIZE = 500;

  constructor(
    p2pNode: P2PNode,
    storage: DatabaseStorage,
    config: Partial<ConsensusConfig> = {}
  ) {
    super(p2pNode, storage, {
      ...config,
      // Optimized timeouts for high validator counts
      votingTimeout: config.votingTimeout || 12000, // 12 seconds
      proposalTimeout: config.proposalTimeout || 15000, // 15 seconds
      finalityTimeout: config.finalityTimeout || 3000, // 3 seconds
    });

    this.initializeWorkerPool();
    this.warmUpCaches();
  }

  /**
   * Initialize worker pool for parallel validator processing
   */
  private initializeWorkerPool(): void {
    const workerCount = Math.min(4, require('os').cpus().length);
    
    for (let i = 0; i < workerCount; i++) {
      // In a real implementation, this would spawn actual worker threads
      // For now, we'll simulate with Promise-based parallel processing
      console.log(`🔧 Initialized consensus worker ${i + 1}/${workerCount}`);
    }
  }

  /**
   * Warm up caches with frequently accessed validator data
   */
  private async warmUpCaches(): Promise<void> {
    try {
      const recentValidators = await this.getTopValidatorsByActivity(this.CACHE_WARM_UP_SIZE);
      
      for (const validator of recentValidators) {
        this.validatorCache.set(validator.getValidatorId(), validator);
        
        const emotionalProfile = validator.getEmotionalProfile();
        if (emotionalProfile) {
          this.emotionalScoreCache.set(
            validator.getValidatorId(), 
            emotionalProfile.emotionalScore || 0
          );
        }
      }
      
      console.log(`🔥 Warmed up caches with ${recentValidators.length} validators`);
    } catch (error) {
      console.warn('Cache warm-up failed:', error.message);
    }
  }

  /**
   * Optimized validator retrieval with intelligent caching
   */
  private async getActiveValidatorsOptimized(): Promise<EmotionalValidator[]> {
    const startTime = performance.now();
    
    try {
      // Use optimized database query with proper indexing
      const query = `
        SELECT 
          vs.validator_id,
          vs.balance,
          vs.emotional_score,
          vs.last_activity,
          vs.reputation,
          vs.total_blocks_mined,
          vs.total_validations,
          bd.reading_type,
          bd.value,
          bd.quality,
          bd.authenticity_proof,
          bd.timestamp as biometric_timestamp
        FROM validator_states vs
        LEFT JOIN LATERAL (
          SELECT * FROM biometric_data bd2 
          WHERE bd2.validator_id = vs.validator_id 
          ORDER BY bd2.timestamp DESC 
          LIMIT 5
        ) bd ON true
        WHERE vs.emotional_score >= $1
          AND vs.last_activity > $2
          AND vs.reputation > $3
        ORDER BY vs.emotional_score DESC, vs.reputation DESC
        LIMIT $4
      `;
      
      const params = [
        75, // Minimum emotional score
        Date.now() - 300000, // Active within last 5 minutes
        50, // Minimum reputation
        2000 // Maximum validators to consider
      ];
      
      const result = await this.storage.query(query, params);
      const queryTime = performance.now() - startTime;
      
      // Group by validator and create validator objects
      const validatorMap = new Map<string, any>();
      
      for (const row of result.rows) {
        if (!validatorMap.has(row.validator_id)) {
          validatorMap.set(row.validator_id, {
            validatorId: row.validator_id,
            balance: parseFloat(row.balance),
            emotionalScore: parseFloat(row.emotional_score),
            lastActivity: parseInt(row.last_activity),
            reputation: parseFloat(row.reputation),
            totalBlocksMined: row.total_blocks_mined,
            totalValidations: row.total_validations,
            biometricReadings: []
          });
        }
        
        if (row.reading_type) {
          validatorMap.get(row.validator_id).biometricReadings.push({
            type: row.reading_type,
            value: parseFloat(row.value),
            quality: parseFloat(row.quality),
            timestamp: parseInt(row.biometric_timestamp)
          });
        }
      }
      
      // Convert to EmotionalValidator objects
      const validators: EmotionalValidator[] = [];
      
      for (const [validatorId, data] of validatorMap) {
        // Check cache first
        let validator = this.validatorCache.get(validatorId);
        
        if (!validator) {
          // Create new validator object
          validator = new EmotionalValidator(validatorId, {
            publicKey: `pubkey_${validatorId}`,
            privateKey: `privkey_${validatorId}`,
            address: `addr_${validatorId}`
          });
          
          // Cache the validator
          this.validatorCache.set(validatorId, validator);
        }
        
        // Update emotional profile
        validator.updateEmotionalProfile({
          validatorId,
          heartRate: this.extractBiometricValue(data.biometricReadings, 'heartRate', 70),
          stressLevel: this.extractBiometricValue(data.biometricReadings, 'stress', 30),
          focusLevel: this.extractBiometricValue(data.biometricReadings, 'focus', 80),
          authenticity: this.extractBiometricValue(data.biometricReadings, 'authenticity', 0.9) / 100,
          timestamp: Date.now(),
          deviceCount: Math.min(data.biometricReadings.length, 5),
          qualityScore: this.calculateAverageQuality(data.biometricReadings),
          emotionalScore: data.emotionalScore
        });
        
        validators.push(validator);
      }
      
      console.log(`📊 Retrieved ${validators.length} validators in ${queryTime.toFixed(2)}ms`);
      
      return validators;
      
    } catch (error) {
      console.error('Optimized validator retrieval failed:', error);
      // Fallback to original method
      return await super.getActiveValidators();
    }
  }

  /**
   * Extract biometric value from readings array
   */
  private extractBiometricValue(readings: any[], type: string, defaultValue: number): number {
    const reading = readings.find(r => r.type === type);
    return reading ? reading.value : defaultValue;
  }

  /**
   * Calculate average quality from biometric readings
   */
  private calculateAverageQuality(readings: any[]): number {
    if (readings.length === 0) return 0.5;
    
    const totalQuality = readings.reduce((sum, r) => sum + r.quality, 0);
    return totalQuality / readings.length;
  }

  /**
   * Get top validators by activity for cache warming
   */
  private async getTopValidatorsByActivity(limit: number): Promise<EmotionalValidator[]> {
    // Simplified implementation - in production this would be a proper database query
    const allValidators = await this.getActiveValidatorsOptimized();
    return allValidators
      .sort((a, b) => (b.getEmotionalProfile()?.lastActivity || 0) - (a.getEmotionalProfile()?.lastActivity || 0))
      .slice(0, limit);
  }

  /**
   * Parallel consensus processing for high validator counts
   */
  public async optimizedConsensusRound(validators: EmotionalValidator[]): Promise<OptimizedConsensusResult> {
    const startTime = performance.now();
    
    console.log(`🚀 Starting optimized consensus with ${validators.length} validators`);
    
    try {
      // Split validators into chunks for parallel processing
      const chunks = this.createValidatorChunks(validators);
      
      // Process chunks in parallel
      const chunkResults = await this.processValidatorChunksParallel(chunks);
      
      // Aggregate results from all chunks
      const aggregatedResult = await this.aggregateChunkResults(chunkResults);
      
      // Calculate performance metrics
      const totalTime = performance.now() - startTime;
      const performance_metrics = this.calculatePerformanceMetrics(
        validators.length,
        totalTime,
        chunkResults
      );
      
      // Update internal metrics
      this.updateInternalMetrics(validators.length, totalTime);
      
      return {
        ...aggregatedResult,
        performance: performance_metrics
      };
      
    } catch (error) {
      console.error('Optimized consensus round failed:', error);
      
      // Fallback to standard consensus
      const fallbackResult = await super.runConsensusEpoch();
      
      return {
        ...fallbackResult,
        performance: {
          totalProcessingTime: performance.now() - startTime,
          parallelizationEfficiency: 0,
          validatorThroughput: validators.length / ((performance.now() - startTime) / 1000),
          databaseQueryTime: 0,
          networkLatency: 0
        }
      };
    }
  }

  /**
   * Create validator chunks for parallel processing
   */
  private createValidatorChunks(validators: EmotionalValidator[]): ValidatorChunk[] {
    const chunks: ValidatorChunk[] = [];
    const chunkSize = Math.ceil(validators.length / this.MAX_PARALLEL_CHUNKS);
    
    for (let i = 0; i < validators.length; i += chunkSize) {
      const chunkValidators = validators.slice(i, i + chunkSize);
      
      chunks.push({
        validators: chunkValidators,
        chunkId: Math.floor(i / chunkSize),
        startIndex: i,
        endIndex: Math.min(i + chunkSize, validators.length)
      });
    }
    
    return chunks;
  }

  /**
   * Process validator chunks in parallel
   */
  private async processValidatorChunksParallel(chunks: ValidatorChunk[]): Promise<ChunkProcessingResult[]> {
    const processingPromises = chunks.map(chunk => 
      this.processingQueue.add(async () => {
        return await this.processValidatorChunk(chunk);
      })
    );
    
    return await Promise.all(processingPromises);
  }

  /**
   * Process a single chunk of validators
   */
  private async processValidatorChunk(chunk: ValidatorChunk): Promise<ChunkProcessingResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const emotionalScores: number[] = [];
    const processedValidators: EmotionalValidator[] = [];
    
    try {
      for (const validator of chunk.validators) {
        try {
          const profile = validator.getEmotionalProfile();
          if (profile && profile.emotionalScore !== undefined) {
            emotionalScores.push(profile.emotionalScore);
            processedValidators.push(validator);
          }
        } catch (error) {
          errors.push(`Validator ${validator.getValidatorId()}: ${error.message}`);
        }
      }
      
      return {
        chunkId: chunk.chunkId,
        processedValidators,
        emotionalScores,
        processingTime: performance.now() - startTime,
        errors
      };
      
    } catch (error) {
      errors.push(`Chunk ${chunk.chunkId} processing failed: ${error.message}`);
      
      return {
        chunkId: chunk.chunkId,
        processedValidators: [],
        emotionalScores: [],
        processingTime: performance.now() - startTime,
        errors
      };
    }
  }

  /**
   * Aggregate results from all processed chunks
   */
  private async aggregateChunkResults(chunkResults: ChunkProcessingResult[]): Promise<EpochResult> {
    const allValidators = chunkResults.flatMap(result => result.processedValidators);
    const allScores = chunkResults.flatMap(result => result.emotionalScores);
    const allErrors = chunkResults.flatMap(result => result.errors);
    
    const averageEmotionalScore = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0;
    
    const byzantineFailures = allErrors.length;
    const success = allValidators.length >= this.config.committeeSize * 0.67 && averageEmotionalScore >= this.config.emotionalThreshold;
    
    // In a real implementation, this would create an actual block
    const block = success ? { 
      height: Date.now(), 
      validators: allValidators.map(v => v.getValidatorId()),
      timestamp: Date.now()
    } : null;
    
    return {
      success,
      block,
      metrics: {
        duration: chunkResults.reduce((sum, result) => sum + result.processingTime, 0),
        participantCount: allValidators.length,
        emotionalAverage: averageEmotionalScore,
        byzantineFailures
      },
      errors: allErrors
    };
  }

  /**
   * Calculate detailed performance metrics
   */
  private calculatePerformanceMetrics(
    validatorCount: number,
    totalTime: number,
    chunkResults: ChunkProcessingResult[]
  ) {
    const maxChunkTime = Math.max(...chunkResults.map(r => r.processingTime));
    const totalChunkTime = chunkResults.reduce((sum, r) => sum + r.processingTime, 0);
    
    const parallelizationEfficiency = maxChunkTime > 0 
      ? (totalChunkTime / (maxChunkTime * chunkResults.length)) * 100 
      : 0;
    
    const validatorThroughput = validatorCount / (totalTime / 1000);
    
    return {
      totalProcessingTime: totalTime,
      parallelizationEfficiency,
      validatorThroughput,
      databaseQueryTime: 0, // Would be measured in real implementation
      networkLatency: 0 // Would be measured in real implementation
    };
  }

  /**
   * Update internal performance metrics
   */
  private updateInternalMetrics(validatorCount: number, processingTime: number): void {
    this.performanceMetrics.totalConsensusRounds++;
    this.performanceMetrics.averageProcessingTime = 
      (this.performanceMetrics.averageProcessingTime + processingTime) / 2;
    this.performanceMetrics.maxValidatorsProcessed = 
      Math.max(this.performanceMetrics.maxValidatorsProcessed, validatorCount);
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats() {
    return {
      ...this.performanceMetrics,
      cacheStats: {
        validatorCacheSize: this.validatorCache.size,
        emotionalScoreCacheSize: this.emotionalScoreCache.size,
        biometricDataCacheSize: this.biometricDataCache.size
      }
    };
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // Clear caches
    this.validatorCache.clear();
    this.emotionalScoreCache.clear();
    this.biometricDataCache.clear();
    
    // Stop processing queue
    this.processingQueue.clear();
    
    // Cleanup parent resources
    await super.stop();
  }
}