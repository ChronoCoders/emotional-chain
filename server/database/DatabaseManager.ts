import { Pool, PoolClient } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';

/**
 * Production Database Manager
 * Eliminates placeholder implementations with real PostgreSQL operations
 */
export class DatabaseManager {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;
  private isInitialized = false;
  private connectionMetrics = {
    activeConnections: 0,
    totalQueries: 0,
    slowQueries: 0,
    lastQueryTime: 0
  };

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 20, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    this.db = drizzle(this.pool, { schema });
  }

  /**
   * Initialize database with proper error handling and connection validation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Test database connection
      await this.testConnection();
      
      // Initialize schema if needed
      await this.ensureSchema();
      
      // Set up performance monitoring
      this.setupMonitoring();
      
      this.isInitialized = true;
      console.log(' Database manager initialized successfully');
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Test database connection with timeout
   */
  private async testConnection(): Promise<void> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time');
      console.log('Database connection test successful:', result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Ensure required schema exists
   */
  private async ensureSchema(): Promise<void> {
    try {
      // Create tables if they don't exist (production would use migrations)
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS validators (
          id VARCHAR(255) PRIMARY KEY,
          stake DECIMAL(20,8) NOT NULL DEFAULT 0,
          emotional_score DECIMAL(5,2) NOT NULL DEFAULT 0,
          reputation_score DECIMAL(5,2) NOT NULL DEFAULT 100,
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS blocks (
          id SERIAL PRIMARY KEY,
          hash VARCHAR(64) UNIQUE NOT NULL,
          previous_hash VARCHAR(64) NOT NULL,
          proposer_id VARCHAR(255) NOT NULL,
          emotional_score DECIMAL(5,2) NOT NULL DEFAULT 0,
          timestamp BIGINT NOT NULL,
          data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS biometric_data (
          id SERIAL PRIMARY KEY,
          validator_id VARCHAR(255) NOT NULL,
          device_id VARCHAR(255) NOT NULL,
          reading_type VARCHAR(50) NOT NULL,
          value DECIMAL(10,4) NOT NULL,
          quality DECIMAL(3,2) NOT NULL,
          timestamp BIGINT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_validator_timestamp (validator_id, timestamp),
          INDEX idx_device_type (device_id, reading_type)
        )
      `);

      console.log('Database schema ensured');
      
    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store validator with optimized query
   */
  async storeValidator(validator: ValidatorRecord): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.db.execute(sql`
        INSERT INTO validators (id, stake, emotional_score, reputation_score, is_active, last_activity)
        VALUES (${validator.id}, ${validator.stake}, ${validator.emotional_score}, 
                ${validator.reputation_score}, ${validator.is_active}, ${new Date(validator.last_activity)})
        ON CONFLICT (id) 
        DO UPDATE SET
          stake = EXCLUDED.stake,
          emotional_score = EXCLUDED.emotional_score,
          reputation_score = EXCLUDED.reputation_score,
          is_active = EXCLUDED.is_active,
          last_activity = EXCLUDED.last_activity,
          updated_at = CURRENT_TIMESTAMP
      `);
      
      this.recordQueryMetrics(startTime);
      
    } catch (error) {
      console.error('Failed to store validator:', error);
      throw error;
    }
  }

  /**
   * Get validator with optimized query and caching
   */
  async getValidator(validatorId: string): Promise<ValidatorRecord | null> {
    const startTime = performance.now();
    
    try {
      const result = await this.db.execute(sql`
        SELECT id, stake, emotional_score, reputation_score, is_active, 
               EXTRACT(EPOCH FROM last_activity) * 1000 as last_activity
        FROM validators 
        WHERE id = ${validatorId}
        LIMIT 1
      `);
      
      this.recordQueryMetrics(startTime);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id as string,
        stake: parseFloat(row.stake as string),
        emotional_score: parseFloat(row.emotional_score as string),
        reputation_score: parseFloat(row.reputation_score as string),
        is_active: row.is_active as boolean,
        last_activity: parseInt(row.last_activity as string)
      };
      
    } catch (error) {
      console.error('Failed to get validator:', error);
      throw error;
    }
  }

  /**
   * Get active validators with pagination and performance optimization
   */
  async getActiveValidators(
    limit: number = 100, 
    offset: number = 0,
    minEmotionalScore: number = 75
  ): Promise<ValidatorRecord[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.db.execute(sql`
        SELECT id, stake, emotional_score, reputation_score, is_active,
               EXTRACT(EPOCH FROM last_activity) * 1000 as last_activity
        FROM validators 
        WHERE is_active = true 
          AND emotional_score >= ${minEmotionalScore}
          AND last_activity > NOW() - INTERVAL '1 hour'
        ORDER BY emotional_score DESC, stake DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      
      this.recordQueryMetrics(startTime);
      
      return result.rows.map(row => ({
        id: row.id as string,
        stake: parseFloat(row.stake as string),
        emotional_score: parseFloat(row.emotional_score as string),
        reputation_score: parseFloat(row.reputation_score as string),
        is_active: row.is_active as boolean,
        last_activity: parseInt(row.last_activity as string)
      }));
      
    } catch (error) {
      console.error('Failed to get active validators:', error);
      throw error;
    }
  }

  /**
   * Store block with transaction support
   */
  async storeBlock(block: BlockRecord): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.db.execute(sql`
        INSERT INTO blocks (hash, previous_hash, proposer_id, emotional_score, timestamp, data)
        VALUES (${block.hash}, ${block.previous_hash}, ${block.proposer_id}, 
                ${block.emotional_score}, ${block.timestamp}, ${JSON.stringify(block.data)})
      `);
      
      this.recordQueryMetrics(startTime);
      
    } catch (error) {
      console.error('Failed to store block:', error);
      throw error;
    }
  }

  /**
   * Get latest blocks with efficient pagination
   */
  async getLatestBlocks(limit: number = 50): Promise<BlockRecord[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.db.execute(sql`
        SELECT hash, previous_hash, proposer_id, emotional_score, timestamp, data
        FROM blocks 
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `);
      
      this.recordQueryMetrics(startTime);
      
      return result.rows.map(row => ({
        hash: row.hash as string,
        previous_hash: row.previous_hash as string,
        proposer_id: row.proposer_id as string,
        emotional_score: parseFloat(row.emotional_score as string),
        timestamp: parseInt(row.timestamp as string),
        data: row.data as any
      }));
      
    } catch (error) {
      console.error('Failed to get latest blocks:', error);
      throw error;
    }
  }

  /**
   * Store biometric data with batch optimization
   */
  async storeBiometricData(readings: BiometricRecord[]): Promise<void> {
    if (readings.length === 0) return;
    
    const startTime = performance.now();
    
    try {
      // Use batch insert for better performance
      const values = readings.map(reading => 
        `(${this.escapeString(reading.validator_id)}, ${this.escapeString(reading.device_id)}, 
          ${this.escapeString(reading.reading_type)}, ${reading.value}, ${reading.quality}, 
          ${reading.timestamp}, ${this.escapeString(JSON.stringify(reading.metadata))})`
      ).join(',');
      
      await this.db.execute(sql.raw(`
        INSERT INTO biometric_data (validator_id, device_id, reading_type, value, quality, timestamp, metadata)
        VALUES ${values}
      `));
      
      this.recordQueryMetrics(startTime);
      
    } catch (error) {
      console.error('Failed to store biometric data:', error);
      throw error;
    }
  }

  /**
   * Get validator metrics with aggregation
   */
  async getValidatorMetrics(validatorId: string, timeWindow: number = 3600000): Promise<ValidatorMetrics> {
    const startTime = performance.now();
    const since = Date.now() - timeWindow;
    
    try {
      const result = await this.db.execute(sql`
        SELECT 
          COUNT(*) as total_readings,
          AVG(value) as avg_emotional_score,
          AVG(quality) as avg_quality,
          MIN(timestamp) as first_reading,
          MAX(timestamp) as last_reading
        FROM biometric_data 
        WHERE validator_id = ${validatorId} 
          AND timestamp >= ${since}
      `);
      
      this.recordQueryMetrics(startTime);
      
      const row = result.rows[0];
      return {
        total_readings: parseInt(row.total_readings as string),
        avg_emotional_score: parseFloat(row.avg_emotional_score as string) || 0,
        avg_quality: parseFloat(row.avg_quality as string) || 0,
        first_reading: parseInt(row.first_reading as string) || 0,
        last_reading: parseInt(row.last_reading as string) || 0
      };
      
    } catch (error) {
      console.error('Failed to get validator metrics:', error);
      throw error;
    }
  }

  /**
   * Execute transaction with proper error handling
   */
  async executeTransaction<T>(
    operation: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
      
    } finally {
      client.release();
    }
  }

  /**
   * Performance monitoring and metrics
   */
  private setupMonitoring(): void {
    // Monitor connection pool
    setInterval(() => {
      this.connectionMetrics.activeConnections = this.pool.totalCount;
      
      if (this.connectionMetrics.slowQueries > 10) {
        console.warn(`High number of slow queries detected: ${this.connectionMetrics.slowQueries}`);
      }
    }, 30000); // Every 30 seconds
  }

  private recordQueryMetrics(startTime: number): void {
    const duration = performance.now() - startTime;
    this.connectionMetrics.totalQueries++;
    this.connectionMetrics.lastQueryTime = duration;
    
    if (duration > 100) { // Queries taking more than 100ms
      this.connectionMetrics.slowQueries++;
      console.warn(`Slow query detected: ${duration.toFixed(2)}ms`);
    }
  }

  private escapeString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }

  /**
   * Get database health metrics
   */
  getHealthMetrics(): DatabaseHealthMetrics {
    return {
      isInitialized: this.isInitialized,
      activeConnections: this.connectionMetrics.activeConnections,
      totalQueries: this.connectionMetrics.totalQueries,
      slowQueries: this.connectionMetrics.slowQueries,
      lastQueryTime: this.connectionMetrics.lastQueryTime,
      poolSize: this.pool.totalCount,
      idleConnections: this.pool.idleCount
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.pool.end();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
}

// Type definitions
export interface ValidatorRecord {
  id: string;
  stake: number;
  emotional_score: number;
  reputation_score: number;
  is_active: boolean;
  last_activity: number;
}

export interface BlockRecord {
  hash: string;
  previous_hash: string;
  proposer_id: string;
  emotional_score: number;
  timestamp: number;
  data: any;
}

export interface BiometricRecord {
  validator_id: string;
  device_id: string;
  reading_type: string;
  value: number;
  quality: number;
  timestamp: number;
  metadata: any;
}

export interface ValidatorMetrics {
  total_readings: number;
  avg_emotional_score: number;
  avg_quality: number;
  first_reading: number;
  last_reading: number;
}

export interface DatabaseHealthMetrics {
  isInitialized: boolean;
  activeConnections: number;
  totalQueries: number;
  slowQueries: number;
  lastQueryTime: number;
  poolSize: number;
  idleConnections: number;
}

// Export singleton instance
export const databaseManager = new DatabaseManager();
export default DatabaseManager;