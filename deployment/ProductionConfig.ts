/**
 * Production Configuration for EmotionalChain Distributed Network
 * Environment-based configuration for different deployment scenarios
 */

export interface ProductionEnvironmentConfig {
  NODE_ENV: 'production' | 'staging' | 'development';
  NETWORK_ID: string;
  
  // Database Configuration
  DATABASE_URL: string;
  DATABASE_POOL_MIN: number;
  DATABASE_POOL_MAX: number;
  
  // Network Configuration
  BOOTSTRAP_NODES: string[];
  LISTEN_PORT: number;
  MAX_CONNECTIONS: number;
  
  // Consensus Configuration
  MIN_VALIDATORS: number;
  TARGET_VALIDATORS: number;
  CONSENSUS_TIMEOUT: number;
  ROUND_TIMEOUT: number;
  
  // Economic Parameters
  MINIMUM_STAKE: number;
  BLOCK_REWARD: number;
  SLASHING_ENABLED: boolean;
  
  // Security Configuration
  BYZANTINE_FAULT_TOLERANCE: boolean;
  MAX_BYZANTINE_RATIO: number;
  PARTITION_RECOVERY: boolean;
  
  // Monitoring Configuration
  METRICS_ENABLED: boolean;
  METRICS_PORT: number;
  ALERT_WEBHOOK_URL?: string;
  
  // Logging Configuration
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  LOG_FILE_PATH?: string;
  
  // API Configuration
  API_PORT: number;
  CORS_ORIGINS: string[];
  RATE_LIMIT_ENABLED: boolean;
  
  // Biometric Configuration
  BIOMETRIC_ENABLED: boolean;
  MIN_EMOTIONAL_SCORE: number;
  MIN_AUTHENTICITY: number;
  DEVICE_TIMEOUT: number;
}

/**
 * Production configuration manager
 */
export class ProductionConfig {
  private static instance: ProductionConfig;
  private config: ProductionEnvironmentConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): ProductionConfig {
    if (!ProductionConfig.instance) {
      ProductionConfig.instance = new ProductionConfig();
    }
    return ProductionConfig.instance;
  }

  /**
   * Load configuration from environment variables with defaults
   */
  private loadConfiguration(): ProductionEnvironmentConfig {
    return {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NETWORK_ID: process.env.NETWORK_ID || 'emotionalchain-mainnet',
      
      // Database
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/emotionalchain',
      DATABASE_POOL_MIN: parseInt(process.env.DATABASE_POOL_MIN || '5'),
      DATABASE_POOL_MAX: parseInt(process.env.DATABASE_POOL_MAX || '20'),
      
      // Network
      BOOTSTRAP_NODES: process.env.BOOTSTRAP_NODES?.split(',') || [
        '/ip4/127.0.0.1/tcp/4001',
        '/dns4/bootstrap1.emotionalchain.io/tcp/4001',
        '/dns4/bootstrap2.emotionalchain.io/tcp/4001'
      ],
      LISTEN_PORT: parseInt(process.env.LISTEN_PORT || '4001'),
      MAX_CONNECTIONS: parseInt(process.env.MAX_CONNECTIONS || '100'),
      
      // Consensus
      MIN_VALIDATORS: parseInt(process.env.MIN_VALIDATORS || '4'),
      TARGET_VALIDATORS: parseInt(process.env.TARGET_VALIDATORS || '21'),
      CONSENSUS_TIMEOUT: parseInt(process.env.CONSENSUS_TIMEOUT || '30000'),
      ROUND_TIMEOUT: parseInt(process.env.ROUND_TIMEOUT || '30000'),
      
      // Economics
      MINIMUM_STAKE: parseInt(process.env.MINIMUM_STAKE || '1000'),
      BLOCK_REWARD: parseInt(process.env.BLOCK_REWARD || '10'),
      SLASHING_ENABLED: process.env.SLASHING_ENABLED === 'true',
      
      // Security
      BYZANTINE_FAULT_TOLERANCE: process.env.BYZANTINE_FAULT_TOLERANCE !== 'false',
      MAX_BYZANTINE_RATIO: parseFloat(process.env.MAX_BYZANTINE_RATIO || '0.33'),
      PARTITION_RECOVERY: process.env.PARTITION_RECOVERY !== 'false',
      
      // Monitoring
      METRICS_ENABLED: process.env.METRICS_ENABLED !== 'false',
      METRICS_PORT: parseInt(process.env.METRICS_PORT || '9090'),
      ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
      
      // Logging
      LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
      LOG_FILE_PATH: process.env.LOG_FILE_PATH,
      
      // API
      API_PORT: parseInt(process.env.PORT || '5000'),
      CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['*'],
      RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
      
      // Biometrics
      BIOMETRIC_ENABLED: process.env.BIOMETRIC_ENABLED !== 'false',
      MIN_EMOTIONAL_SCORE: parseInt(process.env.MIN_EMOTIONAL_SCORE || '70'),
      MIN_AUTHENTICITY: parseFloat(process.env.MIN_AUTHENTICITY || '0.7'),
      DEVICE_TIMEOUT: parseInt(process.env.DEVICE_TIMEOUT || '30000')
    };
  }

  /**
   * Validate configuration values
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Network validation
    if (this.config.MIN_VALIDATORS < 1) {
      errors.push('MIN_VALIDATORS must be at least 1');
    }

    if (this.config.TARGET_VALIDATORS < this.config.MIN_VALIDATORS) {
      errors.push('TARGET_VALIDATORS must be >= MIN_VALIDATORS');
    }

    if (this.config.MAX_BYZANTINE_RATIO <= 0 || this.config.MAX_BYZANTINE_RATIO >= 0.5) {
      errors.push('MAX_BYZANTINE_RATIO must be between 0 and 0.5');
    }

    // Economic validation
    if (this.config.MINIMUM_STAKE <= 0) {
      errors.push('MINIMUM_STAKE must be positive');
    }

    if (this.config.BLOCK_REWARD < 0) {
      errors.push('BLOCK_REWARD must be non-negative');
    }

    // Port validation
    if (this.config.LISTEN_PORT < 1024 || this.config.LISTEN_PORT > 65535) {
      errors.push('LISTEN_PORT must be between 1024 and 65535');
    }

    if (this.config.API_PORT < 1024 || this.config.API_PORT > 65535) {
      errors.push('API_PORT must be between 1024 and 65535');
    }

    // Biometric validation
    if (this.config.MIN_EMOTIONAL_SCORE < 0 || this.config.MIN_EMOTIONAL_SCORE > 100) {
      errors.push('MIN_EMOTIONAL_SCORE must be between 0 and 100');
    }

    if (this.config.MIN_AUTHENTICITY < 0 || this.config.MIN_AUTHENTICITY > 1) {
      errors.push('MIN_AUTHENTICITY must be between 0 and 1');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    console.log('✅ Production configuration validated successfully');
  }

  /**
   * Get configuration value
   */
  get<K extends keyof ProductionEnvironmentConfig>(key: K): ProductionEnvironmentConfig[K] {
    return this.config[key];
  }

  /**
   * Get all configuration
   */
  getAll(): ProductionEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  /**
   * Generate configuration for validator deployment
   */
  getValidatorConfig(): any {
    return {
      networkId: this.config.NETWORK_ID,
      bootstrapNodes: this.config.BOOTSTRAP_NODES,
      listenPort: this.config.LISTEN_PORT,
      consensusTimeout: this.config.CONSENSUS_TIMEOUT,
      minimumStake: this.config.MINIMUM_STAKE,
      biometricConfig: {
        enabled: this.config.BIOMETRIC_ENABLED,
        minEmotionalScore: this.config.MIN_EMOTIONAL_SCORE,
        minAuthenticity: this.config.MIN_AUTHENTICITY,
        deviceTimeout: this.config.DEVICE_TIMEOUT
      }
    };
  }

  /**
   * Generate network deployment configuration
   */
  getNetworkConfig(): any {
    return {
      networkId: this.config.NETWORK_ID,
      bootstrapNodes: this.config.BOOTSTRAP_NODES,
      minValidators: this.config.MIN_VALIDATORS,
      targetValidators: this.config.TARGET_VALIDATORS,
      economicParameters: {
        minimumStake: this.config.MINIMUM_STAKE,
        blockReward: this.config.BLOCK_REWARD,
        slashingEnabled: this.config.SLASHING_ENABLED
      },
      byzantineFaultTolerance: {
        enabled: this.config.BYZANTINE_FAULT_TOLERANCE,
        maxByzantineRatio: this.config.MAX_BYZANTINE_RATIO
      },
      partitionRecovery: {
        enabled: this.config.PARTITION_RECOVERY,
        autoHeal: true
      }
    };
  }

  /**
   * Export configuration to environment file
   */
  exportToEnvFile(): string {
    const envLines = [
      '# EmotionalChain Production Configuration',
      '# Generated automatically - customize as needed',
      '',
      `NODE_ENV=${this.config.NODE_ENV}`,
      `NETWORK_ID=${this.config.NETWORK_ID}`,
      '',
      '# Database Configuration',
      `DATABASE_URL=${this.config.DATABASE_URL}`,
      `DATABASE_POOL_MIN=${this.config.DATABASE_POOL_MIN}`,
      `DATABASE_POOL_MAX=${this.config.DATABASE_POOL_MAX}`,
      '',
      '# Network Configuration',
      `BOOTSTRAP_NODES=${this.config.BOOTSTRAP_NODES.join(',')}`,
      `LISTEN_PORT=${this.config.LISTEN_PORT}`,
      `MAX_CONNECTIONS=${this.config.MAX_CONNECTIONS}`,
      '',
      '# Consensus Configuration',
      `MIN_VALIDATORS=${this.config.MIN_VALIDATORS}`,
      `TARGET_VALIDATORS=${this.config.TARGET_VALIDATORS}`,
      `CONSENSUS_TIMEOUT=${this.config.CONSENSUS_TIMEOUT}`,
      `ROUND_TIMEOUT=${this.config.ROUND_TIMEOUT}`,
      '',
      '# Economic Parameters',
      `MINIMUM_STAKE=${this.config.MINIMUM_STAKE}`,
      `BLOCK_REWARD=${this.config.BLOCK_REWARD}`,
      `SLASHING_ENABLED=${this.config.SLASHING_ENABLED}`,
      '',
      '# Security Configuration',
      `BYZANTINE_FAULT_TOLERANCE=${this.config.BYZANTINE_FAULT_TOLERANCE}`,
      `MAX_BYZANTINE_RATIO=${this.config.MAX_BYZANTINE_RATIO}`,
      `PARTITION_RECOVERY=${this.config.PARTITION_RECOVERY}`,
      '',
      '# Monitoring Configuration',
      `METRICS_ENABLED=${this.config.METRICS_ENABLED}`,
      `METRICS_PORT=${this.config.METRICS_PORT}`,
      this.config.ALERT_WEBHOOK_URL ? `ALERT_WEBHOOK_URL=${this.config.ALERT_WEBHOOK_URL}` : '# ALERT_WEBHOOK_URL=',
      '',
      '# Logging Configuration',
      `LOG_LEVEL=${this.config.LOG_LEVEL}`,
      this.config.LOG_FILE_PATH ? `LOG_FILE_PATH=${this.config.LOG_FILE_PATH}` : '# LOG_FILE_PATH=',
      '',
      '# API Configuration',
      `PORT=${this.config.API_PORT}`,
      `CORS_ORIGINS=${this.config.CORS_ORIGINS.join(',')}`,
      `RATE_LIMIT_ENABLED=${this.config.RATE_LIMIT_ENABLED}`,
      '',
      '# Biometric Configuration',
      `BIOMETRIC_ENABLED=${this.config.BIOMETRIC_ENABLED}`,
      `MIN_EMOTIONAL_SCORE=${this.config.MIN_EMOTIONAL_SCORE}`,
      `MIN_AUTHENTICITY=${this.config.MIN_AUTHENTICITY}`,
      `DEVICE_TIMEOUT=${this.config.DEVICE_TIMEOUT}`
    ];

    return envLines.join('\n');
  }
}