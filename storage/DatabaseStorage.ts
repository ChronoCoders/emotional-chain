import { PostgreSQLStorage } from './PostgreSQLStorage';
import { StateManager } from './StateManager';
import { CacheManager } from './CacheManager';
import { ReplicationManager } from './ReplicationManager';
import { Block } from '../server/blockchain/Block';
import { Transaction } from '../crypto/Transaction';
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
import { P2PNode } from '../network/P2PNode';

/**
 * Integrated database storage system for EmotionalChain
 * Replaces all in-memory Maps with persistent distributed storage
 */

export interface DatabaseStorageConfig {
  enableReplication: boolean;
  replicationFactor: number;
  enableCaching: boolean;
  cacheSize: number;
  backupInterval: number; // minutes
}

export class DatabaseStorage {
  private postgresStorage: PostgreSQLStorage;
  private stateManager: StateManager;
  private cacheManager: CacheManager;
  private replicationManager?: ReplicationManager;
  private config: DatabaseStorageConfig;
  private initialized = false;
  
  constructor(p2pNode?: P2PNode, config: Partial<DatabaseStorageConfig> = {}) {
    this.config = {
      enableReplication: true,
      replicationFactor: 3,
      enableCaching: true,
      cacheSize: 10000,
      backupInterval: 60, // 1 hour
      ...config
    };
    
    this.postgresStorage = new PostgreSQLStorage();
    this.stateManager = new StateManager(this.postgresStorage);
    
    if (this.config.enableCaching) {
      this.cacheManager = new CacheManager(this.config.cacheSize);
    }
    
    if (this.config.enableReplication && p2pNode) {
      this.replicationManager = new ReplicationManager(
        this.postgresStorage,
        p2pNode,
        { replicationFactor: this.config.replicationFactor }
      );
    }
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🔄 Initializing EmotionalChain database storage...');
    
    // Initialize core storage
    await this.postgresStorage.performInitialization();
    console.log('✅ PostgreSQL storage initialized');
    
    // Initialize state manager
    await this.stateManager.initialize();
    console.log('✅ State manager initialized');
    
    // Initialize replication if enabled
    if (this.replicationManager) {
      await this.replicationManager.initialize();
      console.log('✅ Replication manager initialized');
    }
    
    // Warm cache if enabled
    if (this.cacheManager) {
      await this.warmCache();
      console.log('✅ Cache warmed with hot data');
    }
    
    this.initialized = true;
    console.log('🎉 Database storage system ready for production!');
  }
  
  // Block operations with caching and replication
  async storeBlock(block: Block): Promise<void> {
    await this.ensureInitialized();
    
    const transaction = await this.postgresStorage.beginTransaction();
    
    try {
      // Store in primary database
      await this.postgresStorage.storeBlock(block, transaction);
      
      // Store all transactions in the block
      for (const tx of block.transactions) {
        await this.postgresStorage.storeTransaction(tx, block.hash, transaction);
      }
      
      // Update validator state if block was mined
      if (block.validatorId) {
        const currentState = await this.stateManager.getValidatorState(block.validatorId);
        if (currentState) {
          const miningReward = this.calculateMiningReward(block);
          await this.stateManager.updateValidatorBalance(
            block.validatorId, 
            currentState.balance + miningReward
          );
          
          await this.stateManager.incrementValidatorStats(block.validatorId, 1, 0);
        }
      }
      
      await transaction.commit();
      
      // Cache the block
      if (this.cacheManager) {
        this.cacheManager.cacheBlock(block.hash, block);
        
        // Cache transactions
        for (const tx of block.transactions) {
          this.cacheManager.cacheTransaction(tx.hash, tx);
        }
      }
      
      // Replicate to other nodes
      if (this.replicationManager) {
        await this.replicationManager.replicateBlock(block);
      }
      
      console.log(`💾 Stored block ${block.height} (${block.hash.substring(0, 12)}...) with ${block.transactions.length} transactions`);
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to store block: ${error.message}`);
    }
  }
  
  async getBlock(hash: string): Promise<Block | null> {
    await this.ensureInitialized();
    
    // Try cache first
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedBlock(hash);
      if (cached) {
        return cached;
      }
    }
    
    // Get from database
    const block = await this.postgresStorage.getBlock(hash);
    
    // Cache for future access
    if (block && this.cacheManager) {
      this.cacheManager.cacheBlock(hash, block);
    }
    
    return block;
  }
  
  async getBlockByHeight(height: number): Promise<Block | null> {
    await this.ensureInitialized();
    
    // Try cache with height-based key
    const cacheKey = `height_${height}`;
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedQueryResult(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const block = await this.postgresStorage.getBlockByHeight(height);
    
    if (block && this.cacheManager) {
      this.cacheManager.cacheQueryResult(cacheKey, block);
      this.cacheManager.cacheBlock(block.hash, block);
    }
    
    return block;
  }
  
  async getLatestBlock(): Promise<Block | null> {
    await this.ensureInitialized();
    
    const cacheKey = 'latest_block';
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedQueryResult(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5000) { // Cache for 5 seconds
        return cached.data;
      }
    }
    
    const block = await this.postgresStorage.getLatestBlock();
    
    if (block && this.cacheManager) {
      this.cacheManager.cacheQueryResult(cacheKey, { data: block, timestamp: Date.now() });
      this.cacheManager.cacheBlock(block.hash, block);
    }
    
    return block;
  }
  
  // Transaction operations
  async storeTransaction(transaction: Transaction, blockHash: string): Promise<void> {
    await this.ensureInitialized();
    
    await this.postgresStorage.storeTransaction(transaction, blockHash);
    
    // Update validator balances
    await this.processTransactionBalanceChanges(transaction);
    
    // Cache transaction
    if (this.cacheManager) {
      this.cacheManager.cacheTransaction(transaction.hash, transaction);
    }
    
    // Replicate
    if (this.replicationManager) {
      await this.replicationManager.replicateTransaction(transaction, blockHash);
    }
  }
  
  async getTransaction(hash: string): Promise<Transaction | null> {
    await this.ensureInitialized();
    
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedTransaction(hash);
      if (cached) {
        return cached;
      }
    }
    
    const transaction = await this.postgresStorage.getTransaction(hash);
    
    if (transaction && this.cacheManager) {
      this.cacheManager.cacheTransaction(hash, transaction);
    }
    
    return transaction;
  }
  
  async getTransactionsByAddress(address: string, limit: number = 100): Promise<Transaction[]> {
    await this.ensureInitialized();
    
    const cacheKey = `tx_address_${address}_${limit}`;
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedQueryResult(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const transactions = await this.postgresStorage.getTransactionsByAddress(address, limit);
    
    if (this.cacheManager) {
      this.cacheManager.cacheQueryResult(cacheKey, transactions);
      
      // Cache individual transactions
      for (const tx of transactions) {
        this.cacheManager.cacheTransaction(tx.hash, tx);
      }
    }
    
    return transactions;
  }
  
  // Validator state operations
  async getValidatorState(validatorId: string): Promise<{ balance: number; emotionalScore: number } | null> {
    await this.ensureInitialized();
    
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedValidatorState(validatorId);
      if (cached) {
        return {
          balance: cached.balance,
          emotionalScore: cached.emotionalScore
        };
      }
    }
    
    const state = await this.stateManager.getValidatorState(validatorId);
    
    if (state && this.cacheManager) {
      this.cacheManager.cacheValidatorState(validatorId, state);
    }
    
    return state ? {
      balance: state.balance,
      emotionalScore: state.emotionalScore
    } : null;
  }
  
  async updateValidatorBalance(validatorId: string, newBalance: number): Promise<void> {
    await this.ensureInitialized();
    
    await this.stateManager.updateValidatorBalance(validatorId, newBalance);
    
    // Invalidate cache
    if (this.cacheManager) {
      this.cacheManager.invalidateValidatorState(validatorId);
    }
    
    // Replicate state change
    if (this.replicationManager) {
      const state = await this.stateManager.getValidatorState(validatorId);
      if (state) {
        await this.replicationManager.replicateValidatorState(
          validatorId, 
          state.balance, 
          state.emotionalScore
        );
      }
    }
  }
  
  async updateValidatorEmotionalScore(
    validatorId: string, 
    emotionalScore: number, 
    biometricData?: BiometricReading, 
    proof?: AuthenticityProof
  ): Promise<void> {
    await this.ensureInitialized();
    
    await this.stateManager.updateValidatorEmotionalScore(
      validatorId, 
      emotionalScore, 
      biometricData, 
      proof
    );
    
    // Invalidate cache
    if (this.cacheManager) {
      this.cacheManager.invalidateValidatorState(validatorId);
    }
    
    // Replicate state change
    if (this.replicationManager) {
      const state = await this.stateManager.getValidatorState(validatorId);
      if (state) {
        await this.replicationManager.replicateValidatorState(
          validatorId, 
          state.balance, 
          state.emotionalScore
        );
      }
    }
  }
  
  async getAllValidatorStates(): Promise<{ validatorId: string; balance: number; emotionalScore: number }[]> {
    await this.ensureInitialized();
    
    const cacheKey = 'all_validator_states';
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedQueryResult(cacheKey);
      if (cached && Date.now() - cached.timestamp < 10000) { // Cache for 10 seconds
        return cached.data;
      }
    }
    
    const states = this.stateManager.getAllValidatorStates();
    const result = states.map(state => ({
      validatorId: state.validatorId,
      balance: state.balance,
      emotionalScore: state.emotionalScore
    }));
    
    if (this.cacheManager) {
      this.cacheManager.cacheQueryResult(cacheKey, { data: result, timestamp: Date.now() });
    }
    
    return result;
  }
  
  // Biometric data operations
  async storeBiometricData(
    validatorId: string, 
    reading: BiometricReading, 
    proof: AuthenticityProof
  ): Promise<void> {
    await this.ensureInitialized();
    
    await this.postgresStorage.storeBiometricData(validatorId, reading, proof);
    
    // Update emotional score based on biometric data
    const emotionalScore = this.calculateEmotionalScore(reading);
    await this.stateManager.updateValidatorEmotionalScore(validatorId, emotionalScore, reading, proof);
    
    // Invalidate related caches
    if (this.cacheManager) {
      this.cacheManager.invalidateValidatorState(validatorId);
      this.cacheManager.invalidateQueryPattern(`biometric_${validatorId}`);
    }
  }
  
  async getBiometricHistory(
    validatorId: string, 
    limit: number = 100
  ): Promise<{ reading: BiometricReading; proof: AuthenticityProof; timestamp: number }[]> {
    await this.ensureInitialized();
    
    const cacheKey = `biometric_${validatorId}_${limit}`;
    if (this.cacheManager) {
      const cached = this.cacheManager.getCachedQueryResult(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const history = await this.postgresStorage.getBiometricHistory(validatorId, limit);
    
    if (this.cacheManager) {
      this.cacheManager.cacheQueryResult(cacheKey, history);
    }
    
    return history;
  }
  
  // Consensus operations
  async storeConsensusRound(
    roundId: number, 
    participants: string[], 
    emotionalScores: { [validatorId: string]: number }
  ): Promise<void> {
    await this.ensureInitialized();
    
    await this.postgresStorage.storeConsensusRound(roundId, participants, emotionalScores);
    await this.stateManager.startConsensusRound(roundId, participants);
    
    // Update participant emotional scores
    for (const [validatorId, score] of Object.entries(emotionalScores)) {
      await this.stateManager.updateConsensusVote(validatorId, score);
    }
    
    await this.stateManager.finalizeConsensusRound();
    
    // Invalidate consensus caches
    if (this.cacheManager) {
      this.cacheManager.invalidateQueryPattern('consensus');
    }
  }
  
  // Storage health and maintenance
  async getStorageHealth(): Promise<{ healthy: boolean; details: any }> {
    await this.ensureInitialized();
    
    const postgresHealth = await this.postgresStorage.healthCheck();
    const stateHealth = await this.stateManager.getStateHealth();
    
    let replicationHealth = { healthy: true, details: {} };
    if (this.replicationManager) {
      replicationHealth = await this.replicationManager.getReplicationHealth();
    }
    
    const cacheStats = this.cacheManager ? this.cacheManager.getStats() : null;
    
    const overallHealthy = postgresHealth.healthy && stateHealth.healthy && replicationHealth.healthy;
    
    return {
      healthy: overallHealthy,
      details: {
        postgres: postgresHealth,
        stateManager: stateHealth,
        replication: replicationHealth,
        cache: cacheStats,
        initialized: this.initialized,
        timestamp: Date.now()
      }
    };
  }
  
  async performMaintenance(): Promise<void> {
    console.log('🧹 Performing database maintenance...');
    
    // Vacuum database
    await this.postgresStorage.vacuum();
    
    // Sync state with storage
    await this.stateManager.syncWithStorage();
    
    // Clean up inactive validators
    await this.stateManager.cleanupInactiveValidators();
    
    // Handle memory pressure if needed
    if (this.cacheManager) {
      const stats = this.cacheManager.getStats();
      if (stats.memoryUsage > 500 * 1024 * 1024) { // 500MB threshold
        this.cacheManager.handleMemoryPressure();
      }
    }
    
    console.log('✅ Database maintenance completed');
  }
  
  // Backup and recovery
  async createBackup(destination: string): Promise<void> {
    await this.postgresStorage.createBackup(destination);
  }
  
  async restoreBackup(source: string): Promise<void> {
    await this.postgresStorage.restoreBackup(source);
    
    // Reinitialize after restore
    this.initialized = false;
    await this.initialize();
  }
  
  // Private helper methods
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  private async warmCache(): Promise<void> {
    if (!this.cacheManager) return;
    
    try {
      // Load recent blocks
      const stats = await this.postgresStorage.getStorageStats();
      const recentBlocks = await this.postgresStorage.getBlockRange(
        Math.max(0, stats.totalBlocks - 100), 
        stats.totalBlocks - 1
      );
      
      // Load active validator states
      const validatorStates = this.stateManager.getAllValidatorStates();
      
      // Load recent transactions (sample)
      const recentTransactions: Transaction[] = [];
      for (const block of recentBlocks.slice(-10)) {
        const txs = await this.postgresStorage.getTransactionsByBlock(block.hash);
        recentTransactions.push(...txs);
      }
      
      this.cacheManager.warmCache(recentBlocks, recentTransactions, validatorStates);
      
    } catch (error) {
      console.warn('⚠️  Cache warming failed:', error.message);
    }
  }
  
  private calculateMiningReward(block: Block): number {
    // Base reward + emotional bonus
    const baseReward = 50;
    const emotionalBonus = Math.floor(block.emotionalScore / 10) * 2;
    return baseReward + emotionalBonus;
  }
  
  private calculateEmotionalScore(reading: BiometricReading): number {
    // Simple emotional score calculation based on biometric data
    switch (reading.type) {
      case 'heartRate':
        const heartRate = reading.value;
        if (heartRate >= 60 && heartRate <= 100) return 85 + (reading.quality * 15);
        if (heartRate >= 50 && heartRate <= 120) return 70 + (reading.quality * 15);
        return 50 + (reading.quality * 10);
        
      case 'stress':
        const stressLevel = reading.value;
        const stressScore = Math.max(0, 100 - (stressLevel * 2));
        return stressScore * reading.quality;
        
      case 'focus':
        const focusLevel = reading.value;
        return focusLevel * reading.quality;
        
      default:
        return 75; // Default score
    }
  }
  
  private async processTransactionBalanceChanges(transaction: Transaction): Promise<void> {
    // Update sender balance (decrease)
    const senderState = await this.stateManager.getValidatorState(transaction.from);
    if (senderState) {
      await this.stateManager.updateValidatorBalance(
        transaction.from, 
        senderState.balance - transaction.amount - (transaction.fee || 0)
      );
    }
    
    // Update receiver balance (increase)
    const receiverState = await this.stateManager.getValidatorState(transaction.to);
    if (receiverState) {
      await this.stateManager.updateValidatorBalance(
        transaction.to, 
        receiverState.balance + transaction.amount
      );
    } else {
      // Create new validator state for new address
      await this.stateManager.updateValidatorBalance(transaction.to, transaction.amount);
    }
  }
  
  // Shutdown cleanup
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down database storage system...');
    
    if (this.cacheManager) {
      this.cacheManager.shutdown();
    }
    
    if (this.replicationManager) {
      await this.replicationManager.shutdown();
    }
    
    // Perform final sync
    await this.stateManager.syncWithStorage();
    
    console.log('✅ Database storage system shutdown complete');
  }
}