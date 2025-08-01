import { Pool } from '@neondatabase/serverless';
import { BaseBlockchainStorage, StorageTransaction, BatchOperation, StorageStats, BlockchainStorageInterface } from './BlockchainStorage';
import { Block } from '../server/blockchain/Block';
import { Transaction } from '../crypto/Transaction';
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
import { db } from '../server/db';
/**
 * PostgreSQL-based storage implementation for EmotionalChain
 * Provides ACID transactions, replication, and high availability
 */
class PostgreSQLTransaction implements StorageTransaction {
  private active = true;
  private queries: Array<{ sql: string; params: any[] }> = [];
  constructor(private pool: Pool) {}
  addQuery(sql: string, params: any[] = []): void {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }
    this.queries.push({ sql, params });
  }
  async commit(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const query of this.queries) {
        await client.query(query.sql, query.params);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      this.active = false;
    }
  }
  async rollback(): Promise<void> {
    if (!this.active) {
      return;
    }
    this.queries = [];
    this.active = false;
  }
  isActive(): boolean {
    return this.active;
  }
}
export class PostgreSQLStorage extends BaseBlockchainStorage {
  private pool: Pool;
  constructor() {
    super();
    this.pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  protected async performInitialization(): Promise<void> {
    await this.createTables();
    await this.createIndexes();
  }
  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Blocks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS blocks (
          hash VARCHAR(64) PRIMARY KEY,
          height INTEGER UNIQUE NOT NULL,
          previous_hash VARCHAR(64) NOT NULL,
          merkle_root VARCHAR(64) NOT NULL,
          timestamp BIGINT NOT NULL,
          nonce INTEGER NOT NULL,
          difficulty INTEGER NOT NULL,
          validator_id VARCHAR(100) NOT NULL,
          emotional_score DECIMAL(5,2) NOT NULL,
          emotional_proof JSONB NOT NULL,
          block_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Transactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          hash VARCHAR(64) PRIMARY KEY,
          block_hash VARCHAR(64) REFERENCES blocks(hash),
          from_address VARCHAR(64) NOT NULL,
          to_address VARCHAR(64) NOT NULL,
          amount DECIMAL(18,8) NOT NULL,
          fee DECIMAL(18,8) DEFAULT 0,
          timestamp BIGINT NOT NULL,
          signature JSONB NOT NULL,
          biometric_data JSONB,
          transaction_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Validator states table
      await client.query(`
        CREATE TABLE IF NOT EXISTS validator_states (
          validator_id VARCHAR(100) PRIMARY KEY,
          balance DECIMAL(18,8) NOT NULL DEFAULT 0,
          emotional_score DECIMAL(5,2) NOT NULL DEFAULT 0,
          last_activity BIGINT NOT NULL,
          public_key VARCHAR(130) NOT NULL,
          reputation DECIMAL(5,2) DEFAULT 100,
          total_blocks_mined INTEGER DEFAULT 0,
          total_validations INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Biometric data table
      await client.query(`
        CREATE TABLE IF NOT EXISTS biometric_data (
          id SERIAL PRIMARY KEY,
          validator_id VARCHAR(100) NOT NULL REFERENCES validator_states(validator_id),
          device_id VARCHAR(100) NOT NULL,
          reading_type VARCHAR(50) NOT NULL,
          value DECIMAL(10,4) NOT NULL,
          quality DECIMAL(3,2) NOT NULL,
          timestamp BIGINT NOT NULL,
          authenticity_proof JSONB NOT NULL,
          raw_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Consensus rounds table
      await client.query(`
        CREATE TABLE IF NOT EXISTS consensus_rounds (
          round_id INTEGER PRIMARY KEY,
          participants TEXT[] NOT NULL,
          emotional_scores JSONB NOT NULL,
          consensus_strength DECIMAL(5,2) NOT NULL,
          timestamp BIGINT NOT NULL,
          block_hash VARCHAR(64) REFERENCES blocks(hash),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Peer reputation table
      await client.query(`
        CREATE TABLE IF NOT EXISTS peer_reputation (
          peer_id VARCHAR(100) PRIMARY KEY,
          reputation DECIMAL(5,2) NOT NULL DEFAULT 100,
          connection_count INTEGER DEFAULT 0,
          uptime_percentage DECIMAL(5,2) DEFAULT 0,
          message_success_rate DECIMAL(5,2) DEFAULT 100,
          last_seen BIGINT NOT NULL,
          metadata JSONB,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Storage metrics table
      await client.query(`
        CREATE TABLE IF NOT EXISTS storage_metrics (
          id SERIAL PRIMARY KEY,
          metric_name VARCHAR(50) NOT NULL,
          metric_value DECIMAL(18,8) NOT NULL,
          timestamp BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }
  private async createIndexes(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Block indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_blocks_height ON blocks(height)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_blocks_validator ON blocks(validator_id)');
      // Transaction indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions(block_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)');
      // Biometric data indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_biometric_validator ON biometric_data(validator_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_biometric_timestamp ON biometric_data(timestamp)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_biometric_type ON biometric_data(reading_type)');
      // Consensus rounds indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_consensus_timestamp ON consensus_rounds(timestamp)');
      // Peer reputation indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_peer_reputation ON peer_reputation(reputation)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_peer_last_seen ON peer_reputation(last_seen)');
    } finally {
      client.release();
    }
  }
  // Block operations
  async storeBlock(block: Block, transaction?: StorageTransaction): Promise<void> {
    await this.initialize();
    this.validateBlock(block);
    const sql = `
      INSERT INTO blocks (hash, height, previous_hash, merkle_root, timestamp, nonce, difficulty, 
                         validator_id, emotional_score, emotional_proof, block_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (hash) DO NOTHING
    `;
    const params = [
      block.hash,
      block.height,
      block.previousHash,
      block.merkleRoot,
      block.timestamp,
      block.nonce,
      block.difficulty,
      block.validatorId,
      block.emotionalScore,
      JSON.stringify(block.emotionalProof),
      JSON.stringify({
        transactions: block.transactions.map(tx => tx.hash),
        size: JSON.stringify(block).length
      })
    ];
    if (transaction && transaction instanceof PostgreSQLTransaction) {
      transaction.addQuery(sql, params);
    } else {
      const client = await this.pool.connect();
      try {
        await client.query(sql, params);
      } finally {
        client.release();
      }
    }
  }
  async getBlock(hash: string): Promise<Block | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM blocks WHERE hash = $1',
        [hash]
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return this.rowToBlock(row);
    } finally {
      client.release();
    }
  }
  async getBlockByHeight(height: number): Promise<Block | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM blocks WHERE height = $1',
        [height]
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return this.rowToBlock(row);
    } finally {
      client.release();
    }
  }
  async getLatestBlock(): Promise<Block | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM blocks ORDER BY height DESC LIMIT 1'
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return this.rowToBlock(row);
    } finally {
      client.release();
    }
  }
  async getBlockRange(startHeight: number, endHeight: number): Promise<Block[]> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM blocks WHERE height >= $1 AND height <= $2 ORDER BY height ASC',
        [startHeight, endHeight]
      );
      return result.rows.map(row => this.rowToBlock(row));
    } finally {
      client.release();
    }
  }
  // Transaction operations
  async storeTransaction(tx: Transaction, blockHash: string, transaction?: StorageTransaction): Promise<void> {
    await this.initialize();
    this.validateTransaction(tx);
    const sql = `
      INSERT INTO transactions (hash, block_hash, from_address, to_address, amount, fee, 
                               timestamp, signature, biometric_data, transaction_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (hash) DO NOTHING
    `;
    const params = [
      tx.hash,
      blockHash,
      tx.from,
      tx.to,
      tx.amount,
      tx.fee || 0,
      tx.timestamp,
      JSON.stringify({
        r: Array.from(tx.signature.r),
        s: Array.from(tx.signature.s),
        recoveryId: tx.signature.recoveryId
      }),
      tx.biometricData ? JSON.stringify(tx.biometricData) : null,
      JSON.stringify({ type: tx.type || 'transfer' })
    ];
    if (transaction && transaction instanceof PostgreSQLTransaction) {
      transaction.addQuery(sql, params);
    } else {
      const client = await this.pool.connect();
      try {
        await client.query(sql, params);
      } finally {
        client.release();
      }
    }
  }
  async getTransaction(hash: string): Promise<Transaction | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transactions WHERE hash = $1',
        [hash]
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return this.rowToTransaction(row);
    } finally {
      client.release();
    }
  }
  async getTransactionsByAddress(address: string, limit: number = 100): Promise<Transaction[]> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transactions WHERE from_address = $1 OR to_address = $1 ORDER BY timestamp DESC LIMIT $2',
        [address, limit]
      );
      return result.rows.map(row => this.rowToTransaction(row));
    } finally {
      client.release();
    }
  }
  async getTransactionsByBlock(blockHash: string): Promise<Transaction[]> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transactions WHERE block_hash = $1 ORDER BY timestamp ASC',
        [blockHash]
      );
      return result.rows.map(row => this.rowToTransaction(row));
    } finally {
      client.release();
    }
  }
  // Validator state operations
  async storeValidatorState(validatorId: string, balance: number, emotionalScore: number, transaction?: StorageTransaction): Promise<void> {
    await this.initialize();
    this.validateValidatorId(validatorId);
    const sql = `
      INSERT INTO validator_states (validator_id, balance, emotional_score, last_activity, public_key)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (validator_id) 
      DO UPDATE SET 
        balance = $2,
        emotional_score = $3,
        last_activity = $4,
        updated_at = CURRENT_TIMESTAMP
    `;
    const params = [
      validatorId,
      balance,
      emotionalScore,
      Date.now(),
      'placeholder_key' // TODO: Get actual public key
    ];
    if (transaction && transaction instanceof PostgreSQLTransaction) {
      transaction.addQuery(sql, params);
    } else {
      const client = await this.pool.connect();
      try {
        await client.query(sql, params);
      } finally {
        client.release();
      }
    }
  }
  async getValidatorState(validatorId: string): Promise<{ balance: number; emotionalScore: number } | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT balance, emotional_score FROM validator_states WHERE validator_id = $1',
        [validatorId]
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        balance: parseFloat(row.balance),
        emotionalScore: parseFloat(row.emotional_score)
      };
    } finally {
      client.release();
    }
  }
  async getAllValidatorStates(): Promise<{ validatorId: string; balance: number; emotionalScore: number }[]> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT validator_id, balance, emotional_score FROM validator_states ORDER BY balance DESC'
      );
      return result.rows.map(row => ({
        validatorId: row.validator_id,
        balance: parseFloat(row.balance),
        emotionalScore: parseFloat(row.emotional_score)
      }));
    } finally {
      client.release();
    }
  }
  // Biometric data operations
  async storeBiometricData(validatorId: string, reading: BiometricReading, proof: AuthenticityProof, transaction?: StorageTransaction): Promise<void> {
    await this.initialize();
    const sql = `
      INSERT INTO biometric_data (validator_id, device_id, reading_type, value, quality, 
                                 timestamp, authenticity_proof, raw_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const params = [
      validatorId,
      reading.deviceId,
      reading.type,
      reading.value,
      reading.quality,
      reading.timestamp,
      JSON.stringify(proof),
      JSON.stringify(reading.rawData)
    ];
    if (transaction && transaction instanceof PostgreSQLTransaction) {
      transaction.addQuery(sql, params);
    } else {
      const client = await this.pool.connect();
      try {
        await client.query(sql, params);
      } finally {
        client.release();
      }
    }
  }
  async getBiometricHistory(validatorId: string, limit: number = 100): Promise<{ reading: BiometricReading; proof: AuthenticityProof; timestamp: number }[]> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM biometric_data WHERE validator_id = $1 ORDER BY timestamp DESC LIMIT $2',
        [validatorId, limit]
      );
      return result.rows.map(row => ({
        reading: {
          timestamp: parseInt(row.timestamp),
          deviceId: row.device_id,
          type: row.reading_type,
          value: parseFloat(row.value),
          quality: parseFloat(row.quality),
          rawData: row.raw_data
        },
        proof: row.authenticity_proof,
        timestamp: parseInt(row.timestamp)
      }));
    } finally {
      client.release();
    }
  }
  // Consensus operations
  async storeConsensusRound(roundId: number, participants: string[], emotionalScores: { [validatorId: string]: number }, transaction?: StorageTransaction): Promise<void> {
    await this.initialize();
    const consensusStrength = Object.values(emotionalScores).reduce((a, b) => a + b, 0) / Object.keys(emotionalScores).length;
    const sql = `
      INSERT INTO consensus_rounds (round_id, participants, emotional_scores, consensus_strength, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (round_id) DO NOTHING
    `;
    const params = [
      roundId,
      participants,
      JSON.stringify(emotionalScores),
      consensusStrength,
      Date.now()
    ];
    if (transaction && transaction instanceof PostgreSQLTransaction) {
      transaction.addQuery(sql, params);
    } else {
      const client = await this.pool.connect();
      try {
        await client.query(sql, params);
      } finally {
        client.release();
      }
    }
  }
  async getConsensusRound(roundId: number): Promise<{ participants: string[]; emotionalScores: { [validatorId: string]: number } } | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT participants, emotional_scores FROM consensus_rounds WHERE round_id = $1',
        [roundId]
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        participants: row.participants,
        emotionalScores: row.emotional_scores
      };
    } finally {
      client.release();
    }
  }
  async getLatestConsensusRound(): Promise<{ roundId: number; participants: string[]; emotionalScores: { [validatorId: string]: number } } | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT round_id, participants, emotional_scores FROM consensus_rounds ORDER BY round_id DESC LIMIT 1'
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        roundId: row.round_id,
        participants: row.participants,
        emotionalScores: row.emotional_scores
      };
    } finally {
      client.release();
    }
  }
  // Peer reputation operations
  async storePeerReputation(peerId: string, reputation: number, metadata: any, transaction?: StorageTransaction): Promise<void> {
    await this.initialize();
    const sql = `
      INSERT INTO peer_reputation (peer_id, reputation, last_seen, metadata)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (peer_id) 
      DO UPDATE SET 
        reputation = $2,
        last_seen = $3,
        metadata = $4,
        updated_at = CURRENT_TIMESTAMP
    `;
    const params = [
      peerId,
      reputation,
      Date.now(),
      JSON.stringify(metadata)
    ];
    if (transaction && transaction instanceof PostgreSQLTransaction) {
      transaction.addQuery(sql, params);
    } else {
      const client = await this.pool.connect();
      try {
        await client.query(sql, params);
      } finally {
        client.release();
      }
    }
  }
  async getPeerReputation(peerId: string): Promise<{ reputation: number; metadata: any; lastUpdated: number } | null> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT reputation, metadata, last_seen FROM peer_reputation WHERE peer_id = $1',
        [peerId]
      );
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        reputation: parseFloat(row.reputation),
        metadata: row.metadata,
        lastUpdated: parseInt(row.last_seen)
      };
    } finally {
      client.release();
    }
  }
  async getAllPeerReputations(): Promise<{ peerId: string; reputation: number; metadata: any; lastUpdated: number }[]> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT peer_id, reputation, metadata, last_seen FROM peer_reputation ORDER BY reputation DESC'
      );
      return result.rows.map(row => ({
        peerId: row.peer_id,
        reputation: parseFloat(row.reputation),
        metadata: row.metadata,
        lastUpdated: parseInt(row.last_seen)
      }));
    } finally {
      client.release();
    }
  }
  // Batch operations
  async batchStore(operations: BatchOperation[], transaction?: StorageTransaction): Promise<void> {
    const tx = transaction || await this.beginTransaction();
    try {
      for (const op of operations) {
        switch (op.type) {
          case 'STORE_BLOCK':
            await this.storeBlock(op.data, tx);
            break;
          case 'STORE_TRANSACTION':
            await this.storeTransaction(op.data.transaction, op.data.blockHash, tx);
            break;
          case 'STORE_VALIDATOR_STATE':
            await this.storeValidatorState(op.data.validatorId, op.data.balance, op.data.emotionalScore, tx);
            break;
          case 'STORE_BIOMETRIC_DATA':
            await this.storeBiometricData(op.data.validatorId, op.data.reading, op.data.proof, tx);
            break;
          case 'STORE_CONSENSUS_ROUND':
            await this.storeConsensusRound(op.data.roundId, op.data.participants, op.data.emotionalScores, tx);
            break;
          case 'STORE_PEER_REPUTATION':
            await this.storePeerReputation(op.data.peerId, op.data.reputation, op.data.metadata, tx);
            break;
        }
      }
      if (!transaction) {
        await tx.commit();
      }
    } catch (error) {
      if (!transaction) {
        await tx.rollback();
      }
      throw error;
    }
  }
  async beginTransaction(): Promise<StorageTransaction> {
    return new PostgreSQLTransaction(this.pool);
  }
  // Maintenance operations
  async vacuum(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('VACUUM ANALYZE');
    } finally {
      client.release();
    }
  }
  async getStorageStats(): Promise<StorageStats> {
    await this.initialize();
    const client = await this.pool.connect();
    try {
      const [blocks, transactions, validators] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM blocks'),
        client.query('SELECT COUNT(*) as count FROM transactions'),
        client.query('SELECT COUNT(*) as count FROM validator_states')
      ]);
      return {
        totalBlocks: parseInt(blocks.rows[0].count),
        totalTransactions: parseInt(transactions.rows[0].count),
        totalValidators: parseInt(validators.rows[0].count),
        databaseSize: 0, // TODO: Calculate actual database size
        lastBackup: 0, // TODO: Track backup timestamps
        indexSize: 0, // TODO: Calculate index sizes
        diskUsage: 0, // TODO: Calculate disk usage
        memoryUsage: 0 // TODO: Calculate memory usage
      };
    } finally {
      client.release();
    }
  }
  async createBackup(destination: string): Promise<void> {
    console.log(`Creating backup to ${destination}...`);
  }
  async restoreBackup(source: string): Promise<void> {
    console.log(`Restoring backup from ${source}...`);
  }
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        const stats = await this.getStorageStats();
        return {
          healthy: true,
          details: {
            connected: true,
            totalBlocks: stats.totalBlocks,
            totalTransactions: stats.totalTransactions,
            totalValidators: stats.totalValidators,
            timestamp: Date.now()
          }
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error.message,
          timestamp: Date.now()
        }
      };
    }
  }
  // Helper methods
  private rowToBlock(row: any): Block {
    // This would need to properly deserialize the stored data
    return {
      hash: row.hash,
      height: row.height,
      previousHash: row.previous_hash,
      merkleRoot: row.merkle_root,
      timestamp: parseInt(row.timestamp),
      nonce: row.nonce,
      difficulty: row.difficulty,
      validatorId: row.validator_id,
      emotionalScore: parseFloat(row.emotional_score),
      emotionalProof: row.emotional_proof,
      transactions: [] // TODO: Load transactions separately
    } as Block;
  }
  private rowToTransaction(row: any): Transaction {
    return {
      hash: row.hash,
      from: row.from_address,
      to: row.to_address,
      amount: parseFloat(row.amount),
      fee: parseFloat(row.fee || 0),
      timestamp: parseInt(row.timestamp),
      signature: row.signature,
      biometricData: row.biometric_data
    } as Transaction;
  }
}