/**
 * Centralized Configuration System for EmotionalChain
 * All system parameters, thresholds, and constants defined here
 * NO hardcoded values in application logic - everything configurable
 */

export interface EmotionalChainConfig {
  // Network Configuration
  network: {
    ports: {
      http: number;
      p2p: number;
      websocket: number;
    };
    hosts: {
      http: string;
      p2p: string;
    };
    protocols: {
      tls: {
        version: string;
        required: boolean;
        certificateRotationDays: number;
      };
      websocket: {
        heartbeatInterval: number;
        reconnectAttempts: number;
        reconnectDelay: number;
      };
    };
    timeouts: {
      connection: number;
      request: number;
      websocket: number;
      p2pHandshake: number;
    };
  };

  // Consensus Configuration
  consensus: {
    algorithm: string;
    quorum: {
      ratio: number; // Percentage of validators needed for consensus
      minimumValidators: number;
      maximumValidators: number;
    };
    timing: {
      blockTime: number; // seconds
      consensusRoundTimeout: number;
      proposalTimeout: number;
      voteTimeout: number;
      commitTimeout: number;
    };
    thresholds: {
      emotionalScore: number;
      authenticityScore: number;
      participationRate: number;
      networkHealthMinimum: number;
    };
    rewards: {
      baseValidatorReward: number;
      emotionalBonus: {
        multiplier: number;
        maxBonus: number;
      };
      penaltyReduction: number;
    };
    difficulty: {
      initial: number;
      adjustmentBlocks: number;
      targetTime: number;
    };
  };

  // Security Configuration
  security: {
    authentication: {
      apiKeyLength: number;
      apiKeyExpirationDays: number;
      sessionTimeout: number;
      maxLoginAttempts: number;
      lockoutDuration: number;
    };
    rateLimiting: {
      requestsPerMinute: number;
      requestsPerHour: number;
      burstLimit: number;
      windowSize: number;
    };
    encryption: {
      algorithm: string;
      keyLength: number;
      saltRounds: number;
    };
    ddosProtection: {
      enabled: boolean;
      threshold: number;
      banDuration: number;
      whitelist: string[];
    };
    bruteForceProtection: {
      enabled: boolean;
      maxAttempts: number;
      lockoutTime: number;
    };
  };

  // Biometric Configuration
  biometric: {
    devices: {
      maxDevicesPerValidator: number;
      calibrationInterval: number;
      dataRetentionDays: number;
      syncInterval: number;
    };
    thresholds: {
      heartRate: {
        min: number;
        max: number;
        restingMax: number;
      };
      stressLevel: {
        min: number;
        max: number;
        alertThreshold: number;
      };
      focusScore: {
        min: number;
        max: number;
        requiredMinimum: number;
      };
      authenticity: {
        minimumScore: number;
        deviceVariationThreshold: number;
        spoofingDetectionSensitivity: number;
      };
    };
    validation: {
      minimumDevices: number;
      maximumDevices: number;
      redundancyRequired: boolean;
      crossValidationThreshold: number;
    };
  };

  // Database Configuration
  database: {
    connectionPool: {
      min: number;
      max: number;
      idleTimeout: number;
      acquireTimeout: number;
    };
    performance: {
      queryTimeout: number;
      batchSize: number;
      cacheSize: number;
      indexingEnabled: boolean;
    };
    backup: {
      interval: number;
      retention: number;
      compression: boolean;
    };
    replication: {
      enabled: boolean;
      nodes: number;
      syncDelay: number;
    };
  };

  // Smart Contract Configuration
  smartContracts: {
    execution: {
      gasLimit: number;
      executionTimeout: number;
      maxRecursionDepth: number;
    };
    deployment: {
      maxContractSize: number;
      deploymentFee: number;
      verificationRequired: boolean;
    };
    wellness: {
      rewardThresholds: number[];
      penaltyMultipliers: number[];
      maxGoalDuration: number;
    };
  };

  // Cross-Chain Configuration
  crossChain: {
    bridges: {
      ethereum: {
        enabled: boolean;
        confirmations: number;
        gasLimit: number;
        bridgeFeePercentage: number;
      };
      bitcoin: {
        enabled: boolean;
        confirmations: number;
        feeRate: number;
      };
      polkadot: {
        enabled: boolean;
        confirmations: number;
        xcmVersion: string;
      };
    };
    timeouts: {
      bridgeTimeout: number;
      confirmationTimeout: number;
      liquidityCheckInterval: number;
    };
  };

  // AI/ML Configuration
  ai: {
    models: {
      emotionalPredictor: {
        accuracy: number;
        retrainingInterval: number;
        dataRequirements: number;
      };
      consensusOptimizer: {
        accuracy: number;
        updateFrequency: number;
        predictionWindow: number;
      };
      anomalyDetector: {
        sensitivity: number;
        learningRate: number;
        alertThreshold: number;
      };
    };
    training: {
      batchSize: number;
      maxEpochs: number;
      validationSplit: number;
      earlyStoppingPatience: number;
    };
  };

  // Privacy Configuration
  privacy: {
    zeroKnowledge: {
      circuitComplexity: number;
      proofSize: number;
      verificationTimeout: number;
    };
    homomorphicEncryption: {
      keySize: number;
      scheme: string;
      operationTimeout: number;
    };
    ringSignatures: {
      anonymitySetSize: number;
      keyImageValidation: boolean;
    };
  };

  // Infrastructure Configuration
  infrastructure: {
    kubernetes: {
      minNodes: number;
      maxNodes: number;
      nodeType: string;
      autoscaling: {
        enabled: boolean;
        cpuThreshold: number;
        memoryThreshold: number;
        scaleUpCooldown: number;
        scaleDownCooldown: number;
      };
    };
    monitoring: {
      metricsInterval: number;
      alertingEnabled: boolean;
      retentionDays: number;
      dashboardRefresh: number;
    };
    loadBalancing: {
      algorithm: string;
      healthCheckInterval: number;
      maxConnections: number;
      stickySessionTimeout: number;
    };
  };

  // Performance Configuration
  performance: {
    caching: {
      ttl: number;
      maxSize: number;
      evictionPolicy: string;
    };
    compression: {
      enabled: boolean;
      algorithm: string;
      level: number;
    };
    optimization: {
      queryOptimization: boolean;
      indexOptimization: boolean;
      backgroundProcessing: boolean;
    };
  };
}

// Environment-specific configurations
export const DEVELOPMENT_CONFIG: EmotionalChainConfig = {
  network: {
    ports: {
      http: 5000,
      p2p: 8000,
      websocket: 8001,
    },
    hosts: {
      http: '0.0.0.0',
      p2p: '0.0.0.0',
    },
    protocols: {
      tls: {
        version: '1.2',
        required: false,
        certificateRotationDays: 90,
      },
      websocket: {
        heartbeatInterval: 30000,
        reconnectAttempts: 5,
        reconnectDelay: 2000,
      },
    },
    timeouts: {
      connection: 10000,
      request: 30000,
      websocket: 30000,
      p2pHandshake: 5000,
    },
  },
  consensus: {
    algorithm: 'ProofOfEmotion',
    quorum: {
      ratio: 0.67,
      minimumValidators: 3,
      maximumValidators: 21,
    },
    timing: {
      blockTime: 30,
      consensusRoundTimeout: 60000,
      proposalTimeout: 15000,
      voteTimeout: 10000,
      commitTimeout: 5000,
    },
    thresholds: {
      emotionalScore: 75.0,
      authenticityScore: 0.85,
      participationRate: 0.80,
      networkHealthMinimum: 70.0,
    },
    rewards: {
      baseValidatorReward: 50,
      emotionalBonus: {
        multiplier: 1.5,
        maxBonus: 25,
      },
      penaltyReduction: 0.1,
    },
    difficulty: {
      initial: 2,
      adjustmentBlocks: 100,
      targetTime: 30,
    },
  },
  security: {
    authentication: {
      apiKeyLength: 32,
      apiKeyExpirationDays: 90,
      sessionTimeout: 3600000,
      maxLoginAttempts: 5,
      lockoutDuration: 900000,
    },
    rateLimiting: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      burstLimit: 20,
      windowSize: 60000,
    },
    encryption: {
      algorithm: 'AES-256-GCM',
      keyLength: 256,
      saltRounds: 12,
    },
    ddosProtection: {
      enabled: false,
      threshold: 1000,
      banDuration: 3600000,
      whitelist: ['127.0.0.1', 'localhost'],
    },
    bruteForceProtection: {
      enabled: true,
      maxAttempts: 5,
      lockoutTime: 900000,
    },
  },
  biometric: {
    devices: {
      maxDevicesPerValidator: 3,
      calibrationInterval: 86400000,
      dataRetentionDays: 30,
      syncInterval: 5000,
    },
    thresholds: {
      heartRate: {
        min: 40,
        max: 220,
        restingMax: 100,
      },
      stressLevel: {
        min: 0,
        max: 100,
        alertThreshold: 80,
      },
      focusScore: {
        min: 0,
        max: 100,
        requiredMinimum: 60,
      },
      authenticity: {
        minimumScore: 0.80,
        deviceVariationThreshold: 0.15,
        spoofingDetectionSensitivity: 0.90,
      },
    },
    validation: {
      minimumDevices: 1,
      maximumDevices: 5,
      redundancyRequired: false,
      crossValidationThreshold: 0.85,
    },
  },
  database: {
    connectionPool: {
      min: 2,
      max: 10,
      idleTimeout: 30000,
      acquireTimeout: 60000,
    },
    performance: {
      queryTimeout: 30000,
      batchSize: 100,
      cacheSize: 1000,
      indexingEnabled: true,
    },
    backup: {
      interval: 86400000,
      retention: 604800000,
      compression: true,
    },
    replication: {
      enabled: false,
      nodes: 1,
      syncDelay: 1000,
    },
  },
  smartContracts: {
    execution: {
      gasLimit: 10000000,
      executionTimeout: 30000,
      maxRecursionDepth: 100,
    },
    deployment: {
      maxContractSize: 1048576,
      deploymentFee: 10,
      verificationRequired: false,
    },
    wellness: {
      rewardThresholds: [60, 75, 85, 95],
      penaltyMultipliers: [0.5, 0.25, 0.1],
      maxGoalDuration: 2592000000,
    },
  },
  crossChain: {
    bridges: {
      ethereum: {
        enabled: true,
        confirmations: 12,
        gasLimit: 300000,
        bridgeFeePercentage: 0.01,
      },
      bitcoin: {
        enabled: true,
        confirmations: 6,
        feeRate: 20,
      },
      polkadot: {
        enabled: false,
        confirmations: 12,
        xcmVersion: 'v3',
      },
    },
    timeouts: {
      bridgeTimeout: 3600000,
      confirmationTimeout: 1800000,
      liquidityCheckInterval: 300000,
    },
  },
  ai: {
    models: {
      emotionalPredictor: {
        accuracy: 0.85,
        retrainingInterval: 604800000,
        dataRequirements: 10000,
      },
      consensusOptimizer: {
        accuracy: 0.90,
        updateFrequency: 3600000,
        predictionWindow: 1800000,
      },
      anomalyDetector: {
        sensitivity: 0.80,
        learningRate: 0.001,
        alertThreshold: 0.95,
      },
    },
    training: {
      batchSize: 32,
      maxEpochs: 100,
      validationSplit: 0.2,
      earlyStoppingPatience: 10,
    },
  },
  privacy: {
    zeroKnowledge: {
      circuitComplexity: 1024,
      proofSize: 256,
      verificationTimeout: 10000,
    },
    homomorphicEncryption: {
      keySize: 2048,
      scheme: 'BFV',
      operationTimeout: 5000,
    },
    ringSignatures: {
      anonymitySetSize: 16,
      keyImageValidation: true,
    },
  },
  infrastructure: {
    kubernetes: {
      minNodes: 1,
      maxNodes: 5,
      nodeType: 't3.medium',
      autoscaling: {
        enabled: false,
        cpuThreshold: 70,
        memoryThreshold: 80,
        scaleUpCooldown: 300,
        scaleDownCooldown: 300,
      },
    },
    monitoring: {
      metricsInterval: 30000,
      alertingEnabled: true,
      retentionDays: 7,
      dashboardRefresh: 5000,
    },
    loadBalancing: {
      algorithm: 'round_robin',
      healthCheckInterval: 10000,
      maxConnections: 1000,
      stickySessionTimeout: 3600000,
    },
  },
  performance: {
    caching: {
      ttl: 300000,
      maxSize: 1000,
      evictionPolicy: 'LRU',
    },
    compression: {
      enabled: true,
      algorithm: 'gzip',
      level: 6,
    },
    optimization: {
      queryOptimization: true,
      indexOptimization: true,
      backgroundProcessing: true,
    },
  },
};

export const PRODUCTION_CONFIG: EmotionalChainConfig = {
  ...DEVELOPMENT_CONFIG,
  network: {
    ...DEVELOPMENT_CONFIG.network,
    protocols: {
      ...DEVELOPMENT_CONFIG.network.protocols,
      tls: {
        version: '1.3',
        required: true,
        certificateRotationDays: 30,
      },
    },
    timeouts: {
      ...DEVELOPMENT_CONFIG.network.timeouts,
      connection: 5000,
      request: 10000,
    },
  },
  consensus: {
    ...DEVELOPMENT_CONFIG.consensus,
    quorum: {
      ratio: 0.67,
      minimumValidators: 14,
      maximumValidators: 101,
    },
    thresholds: {
      ...DEVELOPMENT_CONFIG.consensus.thresholds,
      emotionalScore: 80.0,
      authenticityScore: 0.90,
      participationRate: 0.85,
      networkHealthMinimum: 85.0,
    },
  },
  security: {
    ...DEVELOPMENT_CONFIG.security,
    rateLimiting: {
      requestsPerMinute: 1000,
      requestsPerHour: 10000,
      burstLimit: 100,
      windowSize: 60000,
    },
    ddosProtection: {
      enabled: true,
      threshold: 500,
      banDuration: 3600000,
      whitelist: [],
    },
    authentication: {
      ...DEVELOPMENT_CONFIG.security.authentication,
      apiKeyExpirationDays: 30,
      sessionTimeout: 1800000,
    },
  },
  biometric: {
    ...DEVELOPMENT_CONFIG.biometric,
    validation: {
      ...DEVELOPMENT_CONFIG.biometric.validation,
      minimumDevices: 2,
      redundancyRequired: true,
      crossValidationThreshold: 0.90,
    },
    thresholds: {
      ...DEVELOPMENT_CONFIG.biometric.thresholds,
      authenticity: {
        minimumScore: 0.90,
        deviceVariationThreshold: 0.10,
        spoofingDetectionSensitivity: 0.95,
      },
    },
  },
  database: {
    ...DEVELOPMENT_CONFIG.database,
    connectionPool: {
      min: 10,
      max: 50,
      idleTimeout: 60000,
      acquireTimeout: 30000,
    },
    replication: {
      enabled: true,
      nodes: 3,
      syncDelay: 100,
    },
  },
  infrastructure: {
    ...DEVELOPMENT_CONFIG.infrastructure,
    kubernetes: {
      minNodes: 5,
      maxNodes: 50,
      nodeType: 'c5.2xlarge',
      autoscaling: {
        enabled: true,
        cpuThreshold: 60,
        memoryThreshold: 70,
        scaleUpCooldown: 180,
        scaleDownCooldown: 300,
      },
    },
    monitoring: {
      ...DEVELOPMENT_CONFIG.infrastructure.monitoring,
      retentionDays: 30,
      metricsInterval: 10000,
    },
    loadBalancing: {
      ...DEVELOPMENT_CONFIG.infrastructure.loadBalancing,
      maxConnections: 10000,
      algorithm: 'least_connections',
    },
  },
};

// Get configuration based on environment
export function getConfig(): EmotionalChainConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_CONFIG;
  }
}

// Helper functions for computed values
export class ConfigHelpers {
  private config: EmotionalChainConfig;

  constructor(config: EmotionalChainConfig) {
    this.config = config;
  }

  // Calculate required validators based on quorum ratio
  getRequiredValidators(totalValidators: number): number {
    return Math.ceil(totalValidators * this.config.consensus.quorum.ratio);
  }

  // Get minimum validators needed for network operation
  getMinimumValidators(): number {
    return this.config.consensus.quorum.minimumValidators;
  }

  // Get maximum allowed validators
  getMaximumValidators(): number {
    return this.config.consensus.quorum.maximumValidators;
  }

  // Calculate emotional bonus based on score
  calculateEmotionalBonus(emotionalScore: number): number {
    const baseReward = this.config.consensus.rewards.baseValidatorReward;
    const multiplier = this.config.consensus.rewards.emotionalBonus.multiplier;
    const maxBonus = this.config.consensus.rewards.emotionalBonus.maxBonus;
    
    const normalizedScore = Math.max(0, (emotionalScore - this.config.consensus.thresholds.emotionalScore) / (100 - this.config.consensus.thresholds.emotionalScore));
    const bonus = baseReward * multiplier * normalizedScore;
    
    return Math.min(bonus, maxBonus);
  }

  // Check if heart rate is within normal range
  isHeartRateNormal(heartRate: number): boolean {
    return heartRate >= this.config.biometric.thresholds.heartRate.min && 
           heartRate <= this.config.biometric.thresholds.heartRate.max;
  }

  // Check if stress level is acceptable
  isStressLevelAcceptable(stressLevel: number): boolean {
    return stressLevel <= this.config.biometric.thresholds.stressLevel.alertThreshold;
  }

  // Check if focus score meets requirements
  meetsFocusRequirements(focusScore: number): boolean {
    return focusScore >= this.config.biometric.thresholds.focusScore.requiredMinimum;
  }

  // Get TLS configuration string
  getTLSConfig(): string {
    const tls = this.config.network.protocols.tls;
    return `TLS ${tls.version}${tls.required ? ' (Required)' : ' (Optional)'}`;
  }

  // Get complete network configuration
  getNetworkConfig() {
    return {
      httpPort: this.config.network.ports.http,
      p2pPort: this.config.network.ports.p2p,
      websocketPort: this.config.network.ports.websocket,
      tlsConfig: this.getTLSConfig(),
      timeouts: this.config.network.timeouts,
    };
  }
}

// Global configuration instance
export const CONFIG = getConfig();
export const configHelpers = new ConfigHelpers(CONFIG);