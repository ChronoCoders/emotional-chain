/**
 * Environment Variable Override System
 * Supports all configuration parameters via environment variables
 */
// Helper functions for environment variable parsing
function parseFloat(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
function parseInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
function parseString(value: string | undefined, defaultValue: string): string {
  return value || defaultValue;
}
// Raw configuration with environment variable overrides
export const rawConfig = {
  network: {
    ports: {
      http: parseInt(process.env.HTTP_PORT, 5000),
      p2p: parseInt(process.env.P2P_PORT, 8000),
      websocket: parseInt(process.env.WEBSOCKET_PORT, 8080),
    },
    hosts: {
      http: parseString(process.env.HTTP_HOST, '0.0.0.0'),
      p2p: parseString(process.env.P2P_HOST, '0.0.0.0'),
    },
    protocols: {
      tls: {
        version: parseString(process.env.TLS_VERSION, '1.3') as '1.2' | '1.3',
        required: parseBoolean(process.env.TLS_REQUIRED, true),
        certificateRotationDays: parseInt(process.env.TLS_CERT_ROTATION_DAYS, 90),
      },
      websocket: {
        heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL, 30000),
        reconnectAttempts: parseInt(process.env.WS_RECONNECT_ATTEMPTS, 5),
        reconnectDelay: parseInt(process.env.WS_RECONNECT_DELAY, 2000),
        fallbackHost: parseString(process.env.WS_FALLBACK_HOST, 'localhost'),
        fallbackPort: parseInt(process.env.WS_FALLBACK_PORT, 8080),
        retryLimit: parseInt(process.env.WS_RETRY_LIMIT, 10),
        exponentialBackoffEnabled: parseBoolean(process.env.WS_EXPONENTIAL_BACKOFF, true),
        maxBackoffDelay: parseInt(process.env.WS_MAX_BACKOFF_DELAY, 30000),
      },
    },
    timeouts: {
      connection: parseInt(process.env.CONNECTION_TIMEOUT, 30000),
      request: parseInt(process.env.REQUEST_TIMEOUT, 30000),
      websocket: parseInt(process.env.WEBSOCKET_TIMEOUT, 60000),
      p2pHandshake: parseInt(process.env.P2P_HANDSHAKE_TIMEOUT, 10000),
    },
  },
  consensus: {
    algorithm: parseString(process.env.CONSENSUS_ALGORITHM, 'ProofOfEmotion') as 'ProofOfEmotion' | 'HybridPoE',
    quorum: {
      ratio: parseFloat(process.env.CONSENSUS_QUORUM_RATIO, 0.67),
      minimumValidators: parseInt(process.env.CONSENSUS_MIN_VALIDATORS, 3),
      maximumValidators: parseInt(process.env.CONSENSUS_MAX_VALIDATORS, 1000),
    },
    timing: {
      blockTime: parseInt(process.env.BLOCK_TIME, 30),
      consensusRoundTimeout: parseInt(process.env.CONSENSUS_ROUND_TIMEOUT, 30000),
      proposalTimeout: parseInt(process.env.PROPOSAL_TIMEOUT, 10000),
      voteTimeout: parseInt(process.env.VOTE_TIMEOUT, 10000),
      commitTimeout: parseInt(process.env.COMMIT_TIMEOUT, 10000),
    },
    thresholds: {
      emotionalScore: parseFloat(process.env.EMOTIONAL_SCORE_THRESHOLD, 75),
      authenticityScore: parseFloat(process.env.AUTHENTICITY_SCORE_THRESHOLD, 0.8),
      participationRate: parseFloat(process.env.PARTICIPATION_RATE_THRESHOLD, 0.8),
      networkHealthMinimum: parseFloat(process.env.NETWORK_HEALTH_MINIMUM, 85),
    },
    rewards: {
      baseValidatorReward: parseFloat(process.env.BASE_VALIDATOR_REWARD, 50),
      emotionalBonus: {
        multiplier: parseFloat(process.env.EMOTIONAL_BONUS_MULTIPLIER, 1.5),
        maxBonus: parseFloat(process.env.EMOTIONAL_MAX_BONUS, 25),
      },
      penaltyReduction: parseFloat(process.env.PENALTY_REDUCTION, 0.1),
    },
    difficulty: {
      initial: parseInt(process.env.INITIAL_DIFFICULTY, 2),
      adjustmentBlocks: parseInt(process.env.DIFFICULTY_ADJUSTMENT_BLOCKS, 100),
      targetTime: parseInt(process.env.DIFFICULTY_TARGET_TIME, 30),
    },
  },
  biometric: {
    devices: {
      maxConcurrentDevices: parseInt(process.env.MAX_CONCURRENT_DEVICES, 5),
      connectionTimeout: parseInt(process.env.DEVICE_CONNECTION_TIMEOUT, 10000),
      dataRetentionDays: parseInt(process.env.BIOMETRIC_DATA_RETENTION_DAYS, 30),
      samplingRate: parseInt(process.env.BIOMETRIC_SAMPLING_RATE, 100),
    },
    validation: {
      minimumDevices: parseInt(process.env.MIN_BIOMETRIC_DEVICES, 2),
      maximumDevices: parseInt(process.env.MAX_BIOMETRIC_DEVICES, 10),
      authenticityWindow: parseInt(process.env.AUTHENTICITY_WINDOW, 30000),
      livenessCheckInterval: parseInt(process.env.LIVENESS_CHECK_INTERVAL, 60000),
    },
    thresholds: {
      heartRate: {
        min: parseInt(process.env.HEART_RATE_MIN, 60),
        max: parseInt(process.env.HEART_RATE_MAX, 180),
        anomalyDetection: parseFloat(process.env.HEART_RATE_ANOMALY_THRESHOLD, 0.2),
      },
      stressLevel: {
        min: parseInt(process.env.STRESS_LEVEL_MIN, 10),
        max: parseInt(process.env.STRESS_LEVEL_MAX, 90),
        alertThreshold: parseInt(process.env.STRESS_ALERT_THRESHOLD, 80),
      },
      focusScore: {
        requiredMinimum: parseInt(process.env.FOCUS_SCORE_MIN, 60),
        max: parseInt(process.env.FOCUS_SCORE_MAX, 100),
      },
      authenticity: {
        minimumScore: parseFloat(process.env.AUTHENTICITY_MIN_SCORE, 0.8),
        confidenceThreshold: parseFloat(process.env.AUTHENTICITY_CONFIDENCE, 0.9),
      },
    },
  },
  security: {
    authentication: {
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 3600000), // 1 hour
      apiKeyLength: parseInt(process.env.API_KEY_LENGTH, 32),
      apiKeyExpirationDays: parseInt(process.env.API_KEY_EXPIRATION_DAYS, 90),
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS, 5),
    },
    rateLimiting: {
      requestsPerMinute: parseInt(process.env.RATE_LIMIT_RPM, 1000),
      windowSize: parseInt(process.env.RATE_LIMIT_WINDOW, 60000), // 1 minute
      blockDuration: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION, 900000), // 15 minutes
    },
    ddosProtection: {
      enabled: parseBoolean(process.env.DDOS_PROTECTION_ENABLED, true),
      threshold: parseInt(process.env.DDOS_THRESHOLD, 10000),
      blockDuration: parseInt(process.env.DDOS_BLOCK_DURATION, 3600000), // 1 hour
    },
    zkpProofs: {
      proofExpirationHours: parseInt(process.env.ZKP_PROOF_EXPIRATION_HOURS, 24),
      maxProofsPerValidator: parseInt(process.env.MAX_PROOFS_PER_VALIDATOR, 1000),
      verificationTimeout: parseInt(process.env.ZKP_VERIFICATION_TIMEOUT, 5000),
    },
  },
  ai: {
    models: {
      emotionalPredictor: {
        threshold: parseFloat(process.env.AI_EMOTIONAL_THRESHOLD, 0.85),
        retrainInterval: parseInt(process.env.AI_RETRAIN_INTERVAL, 86400000), // 24 hours
        accuracy: parseFloat(process.env.AI_MODEL_ACCURACY, 0.92),
      },
      anomalyDetector: {
        sensitivity: parseFloat(process.env.AI_ANOMALY_SENSITIVITY, 0.8),
        falsePositiveRate: parseFloat(process.env.AI_FALSE_POSITIVE_RATE, 0.05),
        modelUpdateFrequency: parseInt(process.env.AI_MODEL_UPDATE_FREQ, 43200000), // 12 hours
      },
      consensusOptimizer: {
        learningRate: parseFloat(process.env.AI_LEARNING_RATE, 0.001),
        batchSize: parseInt(process.env.AI_BATCH_SIZE, 64),
        optimizationInterval: parseInt(process.env.AI_OPTIMIZATION_INTERVAL, 3600000), // 1 hour
      },
    },
    processing: {
      maxConcurrentTasks: parseInt(process.env.AI_MAX_CONCURRENT_TASKS, 10),
      memoryLimitMB: parseInt(process.env.AI_MEMORY_LIMIT_MB, 4096),
      gpuAcceleration: parseBoolean(process.env.AI_GPU_ACCELERATION, false),
    },
  },
  infrastructure: {
    kubernetes: {
      minNodes: parseInt(process.env.K8S_MIN_NODES, 3),
      maxNodes: parseInt(process.env.K8S_MAX_NODES, 100),
      nodeType: parseString(process.env.K8S_NODE_TYPE, 'n1-standard-4'),
      autoscaling: {
        enabled: parseBoolean(process.env.K8S_AUTOSCALING_ENABLED, true),
        cpuThreshold: parseInt(process.env.K8S_CPU_THRESHOLD, 80),
        memoryThreshold: parseInt(process.env.K8S_MEMORY_THRESHOLD, 80),
      },
    },
    monitoring: {
      metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS, 30),
      alertingEnabled: parseBoolean(process.env.ALERTING_ENABLED, true),
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 60000), // 1 minute
    },
    storage: {
      persistentVolumeSize: parseString(process.env.PV_SIZE, '100Gi'),
      backupRetentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS, 30),
      replicationFactor: parseInt(process.env.REPLICATION_FACTOR, 3),
    },
  },
  storage: {
    database: {
      connectionPoolSize: parseInt(process.env.DB_POOL_SIZE, 20),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT, 30000),
      backupInterval: parseInt(process.env.DB_BACKUP_INTERVAL, 21600000), // 6 hours
    },
    replication: {
      minimumReplicas: parseInt(process.env.STORAGE_MIN_REPLICAS, 3),
      targetReplicas: parseInt(process.env.STORAGE_TARGET_REPLICAS, 5),
      syncTimeout: parseInt(process.env.STORAGE_SYNC_TIMEOUT, 30000),
    },
    caching: {
      ttl: parseInt(process.env.CACHE_TTL, 300000), // 5 minutes
      maxSize: parseInt(process.env.CACHE_MAX_SIZE, 10000),
      enabled: parseBoolean(process.env.CACHE_ENABLED, true),
    },
  },
  performance: {
    optimization: {
      backgroundProcessing: parseBoolean(process.env.BACKGROUND_PROCESSING, true),
      parallelValidation: parseBoolean(process.env.PARALLEL_VALIDATION, true),
      cacheWarmup: parseBoolean(process.env.CACHE_WARMUP, true),
    },
    limits: {
      maxTransactionsPerBlock: parseInt(process.env.MAX_TXS_PER_BLOCK, 10000),
      maxBlockSize: parseInt(process.env.MAX_BLOCK_SIZE, 10485760), // 10MB
      maxValidatorsPerEpoch: parseInt(process.env.MAX_VALIDATORS_PER_EPOCH, 1000),
    },
    monitoring: {
      performanceMetrics: parseBoolean(process.env.PERFORMANCE_METRICS, true),
      resourceUsageTracking: parseBoolean(process.env.RESOURCE_USAGE_TRACKING, true),
      latencyMonitoring: parseBoolean(process.env.LATENCY_MONITORING, true),
    },
  },
  // SDK Configuration
  sdk: {
    timeout: parseInt(process.env.SDK_TIMEOUT, 60000),
    retryAttempts: parseInt(process.env.SDK_RETRY_ATTEMPTS, 3),
    retryDelay: parseInt(process.env.SDK_RETRY_DELAY, 1000),
    pollInterval: parseInt(process.env.SDK_POLL_INTERVAL, 2000),
    transactionTimeout: parseInt(process.env.SDK_TRANSACTION_TIMEOUT, 60000),
    emotionalThresholdDefault: parseFloat(process.env.SDK_EMOTIONAL_THRESHOLD_DEFAULT, 75),
    websocketHeartbeatInterval: parseInt(process.env.SDK_WEBSOCKET_HEARTBEAT_INTERVAL, 30000),
  },
  // Audit Configuration
  audit: {
    enabled: parseBoolean(process.env.AUDIT_ENABLED, true),
    sampleSizes: {
      blocks: parseInt(process.env.AUDIT_SAMPLE_BLOCKS, 5),
      transactions: parseInt(process.env.AUDIT_SAMPLE_TRANSACTIONS, 10),
      validators: parseInt(process.env.AUDIT_SAMPLE_VALIDATORS, 3),
      smartContracts: parseInt(process.env.AUDIT_SAMPLE_SMART_CONTRACTS, 2),
    },
    intervalMs: parseInt(process.env.AUDIT_INTERVAL_MS, 3600000), // 1 hour
    maxRetries: parseInt(process.env.AUDIT_MAX_RETRIES, 3),
  },
  // Smart Contract Configuration
  smartContracts: {
    execution: {
      gasLimit: parseInt(process.env.SMART_CONTRACT_GAS_LIMIT, 10000000),
      executionTimeout: parseInt(process.env.SMART_CONTRACT_EXECUTION_TIMEOUT, 30000),
      maxRecursionDepth: parseInt(process.env.SMART_CONTRACT_MAX_RECURSION_DEPTH, 100),
    },
    deployment: {
      maxContractSize: parseInt(process.env.SMART_CONTRACT_MAX_SIZE, 1048576), // 1MB
      deploymentFee: parseFloat(process.env.SMART_CONTRACT_DEPLOYMENT_FEE, 10),
      verificationRequired: parseBoolean(process.env.SMART_CONTRACT_VERIFICATION_REQUIRED, false),
    },
    wellness: {
      rewardThresholds: process.env.SMART_CONTRACT_REWARD_THRESHOLDS?.split(',').map(Number) || [60, 75, 85, 95],
      penaltyMultipliers: process.env.SMART_CONTRACT_PENALTY_MULTIPLIERS?.split(',').map(Number) || [0.5, 0.25, 0.1],
      maxGoalDuration: parseInt(process.env.SMART_CONTRACT_MAX_GOAL_DURATION, 2592000000), // 30 days
    },
  },
};