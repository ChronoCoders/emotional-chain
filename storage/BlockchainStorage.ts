import { Block } from '../server/blockchain/Block';
import { Transaction } from '../crypto/Transaction';
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
/**
 * Abstract storage interface for blockchain data
 * Provides ACID transaction support and data consistency guarantees
 */
export interface StorageTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}
export interface BlockchainStorageInterface {
  // Block storage operations
  storeBlock(block: Block, transaction?: StorageTransaction): Promise<void>;
  getBlock(hash: string): Promise<Block | null>;
  getBlockByHeight(height: number): Promise<Block | null>;
  getLatestBlock(): Promise<Block | null>;
  getBlockRange(startHeight: number, endHeight: number): Promise<Block[]>;
  // Transaction storage operations
  storeTransaction(tx: Transaction, blockHash: string, transaction?: StorageTransaction): Promise<void>;
  getTransaction(hash: string): Promise<Transaction | null>;
  getTransactionsByAddress(address: string, limit?: number): Promise<Transaction[]>;
  getTransactionsByBlock(blockHash: string): Promise<Transaction[]>;
  // Validator and biometric data storage
  storeValidatorState(validatorId: string, balance: number, emotionalScore: number, transaction?: StorageTransaction): Promise<void>;
  getValidatorState(validatorId: string): Promise<{ balance: number; emotionalScore: number } | null>;
  getAllValidatorStates(): Promise<{ validatorId: string; balance: number; emotionalScore: number }[]>;
  storeBiometricData(validatorId: string, reading: BiometricReading, proof: AuthenticityProof, transaction?: StorageTransaction): Promise<void>;
  getBiometricHistory(validatorId: string, limit?: number): Promise<{ reading: BiometricReading; proof: AuthenticityProof; timestamp: number }[]>;
  // Consensus and network state
  storeConsensusRound(roundId: number, participants: string[], emotionalScores: { [validatorId: string]: number }, transaction?: StorageTransaction): Promise<void>;
  getConsensusRound(roundId: number): Promise<{ participants: string[]; emotionalScores: { [validatorId: string]: number } } | null>;
  getLatestConsensusRound(): Promise<{ roundId: number; participants: string[]; emotionalScores: { [validatorId: string]: number } } | null>;
  // Network peer storage
  storePeerReputation(peerId: string, reputation: number, metadata: any, transaction?: StorageTransaction): Promise<void>;
  getPeerReputation(peerId: string): Promise<{ reputation: number; metadata: any; lastUpdated: number } | null>;
  getAllPeerReputations(): Promise<{ peerId: string; reputation: number; metadata: any; lastUpdated: number }[]>;
  // Batch operations for efficiency
  batchStore(operations: BatchOperation[], transaction?: StorageTransaction): Promise<void>;
  // Transaction management
  beginTransaction(): Promise<StorageTransaction>;
  // Storage maintenance
  vacuum(): Promise<void>;
  getStorageStats(): Promise<StorageStats>;
  // Backup and recovery
  createBackup(destination: string): Promise<void>;
  restoreBackup(source: string): Promise<void>;
  // Health checks
  healthCheck(): Promise<{ healthy: boolean; details: any }>;
}
export interface BatchOperation {
  type: 'STORE_BLOCK' | 'STORE_TRANSACTION' | 'STORE_VALIDATOR_STATE' | 'STORE_BIOMETRIC_DATA' | 'STORE_CONSENSUS_ROUND' | 'STORE_PEER_REPUTATION';
  data: any;
}
export interface StorageStats {
  totalBlocks: number;
  totalTransactions: number;
  totalValidators: number;
  databaseSize: number;
  lastBackup: number;
  indexSize: number;
  diskUsage: number;
  memoryUsage: number;
}
/**
 * Base implementation with common functionality
 */
export abstract class BaseBlockchainStorage implements BlockchainStorageInterface {
  protected initialized = false;
  abstract storeBlock(block: Block, transaction?: StorageTransaction): Promise<void>;
  abstract getBlock(hash: string): Promise<Block | null>;
  abstract getBlockByHeight(height: number): Promise<Block | null>;
  abstract getLatestBlock(): Promise<Block | null>;
  abstract getBlockRange(startHeight: number, endHeight: number): Promise<Block[]>;
  abstract storeTransaction(tx: Transaction, blockHash: string, transaction?: StorageTransaction): Promise<void>;
  abstract getTransaction(hash: string): Promise<Transaction | null>;
  abstract getTransactionsByAddress(address: string, limit?: number): Promise<Transaction[]>;
  abstract getTransactionsByBlock(blockHash: string): Promise<Transaction[]>;
  abstract storeValidatorState(validatorId: string, balance: number, emotionalScore: number, transaction?: StorageTransaction): Promise<void>;
  abstract getValidatorState(validatorId: string): Promise<{ balance: number; emotionalScore: number } | null>;
  abstract getAllValidatorStates(): Promise<{ validatorId: string; balance: number; emotionalScore: number }[]>;
  abstract storeBiometricData(validatorId: string, reading: BiometricReading, proof: AuthenticityProof, transaction?: StorageTransaction): Promise<void>;
  abstract getBiometricHistory(validatorId: string, limit?: number): Promise<{ reading: BiometricReading; proof: AuthenticityProof; timestamp: number }[]>;
  abstract storeConsensusRound(roundId: number, participants: string[], emotionalScores: { [validatorId: string]: number }, transaction?: StorageTransaction): Promise<void>;
  abstract getConsensusRound(roundId: number): Promise<{ participants: string[]; emotionalScores: { [validatorId: string]: number } } | null>;
  abstract getLatestConsensusRound(): Promise<{ roundId: number; participants: string[]; emotionalScores: { [validatorId: string]: number } } | null>;
  abstract storePeerReputation(peerId: string, reputation: number, metadata: any, transaction?: StorageTransaction): Promise<void>;
  abstract getPeerReputation(peerId: string): Promise<{ reputation: number; metadata: any; lastUpdated: number } | null>;
  abstract getAllPeerReputations(): Promise<{ peerId: string; reputation: number; metadata: any; lastUpdated: number }[]>;
  abstract batchStore(operations: BatchOperation[], transaction?: StorageTransaction): Promise<void>;
  abstract beginTransaction(): Promise<StorageTransaction>;
  abstract vacuum(): Promise<void>;
  abstract getStorageStats(): Promise<StorageStats>;
  abstract createBackup(destination: string): Promise<void>;
  abstract restoreBackup(source: string): Promise<void>;
  abstract healthCheck(): Promise<{ healthy: boolean; details: any }>;
  protected async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.performInitialization();
    this.initialized = true;
  }
  protected abstract performInitialization(): Promise<void>;
  protected validateBlock(block: Block): void {
    if (!block.hash || !block.previousHash || block.height < 0) {
      throw new Error('Invalid block data');
    }
  }
  protected validateTransaction(tx: Transaction): void {
    if (!tx.hash || !tx.from || !tx.to || tx.amount < 0) {
      throw new Error('Invalid transaction data');
    }
  }
  protected validateValidatorId(validatorId: string): void {
    if (!validatorId || validatorId.trim().length === 0) {
      throw new Error('Invalid validator ID');
    }
  }
}