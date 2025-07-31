/**
 * Production Configuration Schema with Strict Validation
 * Runtime type safety and bounds checking for all parameters
 */

import { z } from 'zod';

// Network Configuration Schema
const NetworkSchema = z.object({
  ports: z.object({
    http: z.number().int().min(1024).max(65535),
    p2p: z.number().int().min(1024).max(65535),
    websocket: z.number().int().min(1024).max(65535),
  }),
  hosts: z.object({
    http: z.string().min(1),
    p2p: z.string().min(1),
  }),
  protocols: z.object({
    tls: z.object({
      version: z.enum(['1.2', '1.3']),
      required: z.boolean(),
      certificateRotationDays: z.number().int().min(1).max(365),
    }),
    websocket: z.object({
      heartbeatInterval: z.number().int().min(1000).max(300000), // 1s to 5min
      reconnectAttempts: z.number().int().min(1).max(50),
      reconnectDelay: z.number().int().min(100).max(30000), // 100ms to 30s
    }),
  }),
  timeouts: z.object({
    connection: z.number().int().min(1000).max(300000), // 1s to 5min
    request: z.number().int().min(1000).max(120000), // 1s to 2min
    websocket: z.number().int().min(5000).max(300000), // 5s to 5min
    p2pHandshake: z.number().int().min(1000).max(60000), // 1s to 1min
  }),
});

// Consensus Configuration Schema
const ConsensusSchema = z.object({
  algorithm: z.enum(['ProofOfEmotion', 'HybridPoE']),
  quorum: z.object({
    ratio: z.number().min(0.5).max(1.0), // 50% to 100%
    minimumValidators: z.number().int().min(3).max(10000),
    maximumValidators: z.number().int().min(10).max(100000),
  }),
  timing: z.object({
    blockTime: z.number().int().min(5).max(300), // 5s to 5min
    consensusRoundTimeout: z.number().int().min(5000).max(300000), // 5s to 5min
    proposalTimeout: z.number().int().min(1000).max(60000), // 1s to 1min
    voteTimeout: z.number().int().min(1000).max(60000), // 1s to 1min
    commitTimeout: z.number().int().min(1000).max(60000), // 1s to 1min
  }),
  thresholds: z.object({
    emotionalScore: z.number().min(50).max(100),
    authenticityScore: z.number().min(0.5).max(1.0),
    participationRate: z.number().min(0.5).max(1.0),
    networkHealthMinimum: z.number().min(50).max(100),
  }),
  rewards: z.object({
    baseValidatorReward: z.number().min(1).max(10000),
    emotionalBonus: z.object({
      multiplier: z.number().min(0.1).max(5.0),
      maxBonus: z.number().min(1).max(1000),
    }),
    penaltyReduction: z.number().min(0.01).max(1.0),
  }),
  difficulty: z.object({
    initial: z.number().int().min(1).max(10),
    adjustmentBlocks: z.number().int().min(10).max(10000),
    targetTime: z.number().int().min(5).max(300),
  }),
});

// Biometric Configuration Schema
const BiometricSchema = z.object({
  devices: z.object({
    maxConcurrentDevices: z.number().int().min(1).max(20),
    connectionTimeout: z.number().int().min(1000).max(60000),
    dataRetentionDays: z.number().int().min(1).max(365),
    samplingRate: z.number().int().min(1).max(1000), // Hz
  }),
  validation: z.object({
    minimumDevices: z.number().int().min(1).max(10),
    maximumDevices: z.number().int().min(2).max(20),
    authenticityWindow: z.number().int().min(1000).max(300000),
    livenessCheckInterval: z.number().int().min(5000).max(300000),
  }),
  thresholds: z.object({
    heartRate: z.object({
      min: z.number().int().min(30).max(80),
      max: z.number().int().min(100).max(220),
      anomalyDetection: z.number().min(0.1).max(1.0),
    }),
    stressLevel: z.object({
      min: z.number().int().min(0).max(30),
      max: z.number().int().min(70).max(100),
      alertThreshold: z.number().int().min(50).max(95),
    }),
    focusScore: z.object({
      requiredMinimum: z.number().int().min(30).max(70),
      max: z.number().int().min(80).max(100),
    }),
    authenticity: z.object({
      minimumScore: z.number().min(0.5).max(1.0),
      confidenceThreshold: z.number().min(0.7).max(1.0),
    }),
  }),
});

// Security Configuration Schema
const SecuritySchema = z.object({
  authentication: z.object({
    sessionTimeout: z.number().int().min(300000).max(86400000), // 5min to 24h
    apiKeyLength: z.number().int().min(16).max(128),
    apiKeyExpirationDays: z.number().int().min(1).max(365),
    maxFailedAttempts: z.number().int().min(3).max(20),
  }),
  rateLimiting: z.object({
    requestsPerMinute: z.number().int().min(10).max(10000),
    windowSize: z.number().int().min(60000).max(3600000), // 1min to 1h
    blockDuration: z.number().int().min(300000).max(86400000), // 5min to 24h
  }),
  ddosProtection: z.object({
    enabled: z.boolean(),
    threshold: z.number().int().min(100).max(100000),
    blockDuration: z.number().int().min(60000).max(86400000), // 1min to 24h
  }),
  zkpProofs: z.object({
    proofExpirationHours: z.number().int().min(1).max(168), // 1h to 1week
    maxProofsPerValidator: z.number().int().min(10).max(10000),
    verificationTimeout: z.number().int().min(1000).max(30000),
  }),
});

// AI/ML Configuration Schema
const AISchema = z.object({
  models: z.object({
    emotionalPredictor: z.object({
      threshold: z.number().min(0.0).max(1.0),
      retrainInterval: z.number().int().min(3600000).max(604800000), // 1h to 1week
      accuracy: z.number().min(0.5).max(1.0),
    }),
    anomalyDetector: z.object({
      sensitivity: z.number().min(0.1).max(1.0),
      falsePositiveRate: z.number().min(0.001).max(0.1),
      modelUpdateFrequency: z.number().int().min(3600000).max(604800000),
    }),
    consensusOptimizer: z.object({
      learningRate: z.number().min(0.0001).max(0.1),
      batchSize: z.number().int().min(16).max(1024),
      optimizationInterval: z.number().int().min(1800000).max(86400000), // 30min to 24h
    }),
  }),
  processing: z.object({
    maxConcurrentTasks: z.number().int().min(1).max(100),
    memoryLimitMB: z.number().int().min(512).max(16384),
    gpuAcceleration: z.boolean(),
  }),
});

// Infrastructure Configuration Schema
const InfrastructureSchema = z.object({
  kubernetes: z.object({
    minNodes: z.number().int().min(3).max(1000),
    maxNodes: z.number().int().min(5).max(10000),
    nodeType: z.string().min(1),
    autoscaling: z.object({
      enabled: z.boolean(),
      cpuThreshold: z.number().int().min(50).max(95),
      memoryThreshold: z.number().int().min(50).max(95),
    }),
  }),
  monitoring: z.object({
    metricsRetentionDays: z.number().int().min(7).max(365),
    alertingEnabled: z.boolean(),
    healthCheckInterval: z.number().int().min(30000).max(300000), // 30s to 5min
  }),
  storage: z.object({
    persistentVolumeSize: z.string().regex(/^\d+Gi$/), // e.g., "100Gi"
    backupRetentionDays: z.number().int().min(7).max(365),
    replicationFactor: z.number().int().min(1).max(10),
  }),
});

// Storage Configuration Schema
const StorageSchema = z.object({
  database: z.object({
    connectionPoolSize: z.number().int().min(5).max(100),
    queryTimeout: z.number().int().min(5000).max(300000), // 5s to 5min
    backupInterval: z.number().int().min(3600000).max(86400000), // 1h to 24h
  }),
  replication: z.object({
    minimumReplicas: z.number().int().min(2).max(10),
    targetReplicas: z.number().int().min(3).max(50),
    syncTimeout: z.number().int().min(5000).max(300000),
  }),
  caching: z.object({
    ttl: z.number().int().min(60000).max(3600000), // 1min to 1h
    maxSize: z.number().int().min(100).max(10000), // Number of items
    enabled: z.boolean(),
  }),
});

// Performance Configuration Schema
const PerformanceSchema = z.object({
  optimization: z.object({
    backgroundProcessing: z.boolean(),
    parallelValidation: z.boolean(),
    cacheWarmup: z.boolean(),
  }),
  limits: z.object({
    maxTransactionsPerBlock: z.number().int().min(100).max(100000),
    maxBlockSize: z.number().int().min(1048576).max(104857600), // 1MB to 100MB
    maxValidatorsPerEpoch: z.number().int().min(10).max(10000),
  }),
  monitoring: z.object({
    performanceMetrics: z.boolean(),
    resourceUsageTracking: z.boolean(),
    latencyMonitoring: z.boolean(),
  }),
});

// Main Configuration Schema
export const ConfigSchema = z.object({
  network: NetworkSchema,
  consensus: ConsensusSchema,
  biometric: BiometricSchema,
  security: SecuritySchema,
  ai: AISchema,
  infrastructure: InfrastructureSchema,
  storage: StorageSchema,
  performance: PerformanceSchema,
});

export type EmotionalChainConfig = z.infer<typeof ConfigSchema>;

// Schema-based validation function
export function validateConfig(config: unknown): EmotionalChainConfig {
  try {
    return ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('🚨 CONFIGURATION VALIDATION FAILED:');
      error.errors.forEach(err => {
        console.error(`  ❌ ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error(`Invalid configuration: ${error.errors.length} validation error(s)`);
    }
    throw error;
  }
}