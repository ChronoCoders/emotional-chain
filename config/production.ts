// DEPRECATED: This file contains hardcoded values and violates CONFIG policy
// All values should be configured through shared/config.ts system
// This file is kept only for reference and migration purposes
export const productionConfig = {
  // Network configuration
  network: {
    maxPeers: 50,
    bootstrapNodes: [
      '/ip4/34.123.45.67/tcp/8000',
      '/ip4/35.123.45.68/tcp/8000', 
      '/ip4/36.123.45.69/tcp/8000'
    ],
    consensusTimeout: 30000,
    blockTime: 30000,
    networkId: 'emotional-mainnet',
    protocolVersion: '1.0.0'
  },

  // Biometric configuration
  biometric: {
    requiredSensors: ['heartrate', 'stress', 'focus'],
    authenticationThreshold: 0.9,
    emotionalThreshold: 75.0,
    dataRetentionDays: 30,
    samplingRate: 1000, // 1Hz
    qualityThreshold: 0.8,
    antiSpoofingEnabled: true,
    livenessDetection: true,
    multiModalRequired: true
  },

  // Security configuration
  security: {
    rateLimitPerMinute: 100,
    maxConnectionsPerIP: 10,
    tlsVersion: '1.3',
    encryptionLevel: 'AES-256',
    apiKeyRequired: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    bruteForceThreshold: 5,
    ddosProtectionEnabled: true,
    auditLogging: true,
    securityScanInterval: 60 * 60 * 1000 // 1 hour
  },

  // Monitoring configuration
  monitoring: {
    metricsEnabled: true,
    tracingEnabled: true,
    logLevel: 'info',
    alertingEnabled: true,
    prometheusPort: 9090,
    metricsPath: '/metrics',
    healthCheckInterval: 30000,
    performanceSampling: 0.1, // 10% sampling
    retentionDays: 30
  },

  // Database configuration
  database: {
    connectionPoolSize: 20,
    connectionTimeout: 30000,
    idleTimeout: 300000,
    maxRetries: 3,
    backupEnabled: true,
    backupInterval: 6 * 60 * 60 * 1000, // 6 hours
    replicationEnabled: true,
    encryptionAtRest: true
  },

  // Consensus configuration
  consensus: {
    epochDuration: 30000,
    validatorRotationEnabled: true,
    byzantineFaultTolerance: 0.67,
    finalityBlocks: 1,
    maxValidators: 100,
    minValidators: 4,
    slashingEnabled: true,
    rewardDistribution: 'proportional'
  },

  // Performance configuration
  performance: {
    blockSizeLimit: 2 * 1024 * 1024, // 2MB
    transactionPoolSize: 10000,
    cacheSize: 1000,
    compressionEnabled: true,
    keepAliveTimeout: 65000,
    maxConcurrentRequests: 1000,
    workerThreads: 4
  },

  // Logging configuration
  logging: {
    level: 'info',
    format: 'json',
    enableConsole: true,
    enableFile: true,
    maxFileSize: '100MB',
    maxFiles: 10,
    enableSyslog: false,
    enableElastic: true,
    bufferSize: 1000
  },

  // Load balancer configuration
  loadBalancer: {
    strategy: 'emotional_score',
    healthCheckInterval: 30000,
    failureThreshold: 3,
    recoveryThreshold: 2,
    circuitBreakerTimeout: 60000,
    maxRetries: 3,
    sessionStickiness: true,
    timeoutMs: 30000
  },

  // Backup configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 30, // 30 days
    compression: true,
    encryption: true,
    destinations: ['s3', 'local'],
    verification: true,
    crossRegionReplication: true
  },

  // Deployment configuration
  deployment: {
    environment: 'production',
    region: 'multi-region',
    availabilityZones: 3,
    autoScaling: true,
    minReplicas: 3,
    maxReplicas: 10,
    rollingUpdate: true,
    healthCheckGracePeriod: 120000,
    shutdownGracePeriod: 30000
  },

  // Feature flags
  features: {
    biometricValidation: true,
    emotionalConsensus: true,
    forkResolution: true,
    rewardCalculation: true,
    networkPartitionHandling: true,
    crossChainBridges: false,
    smartContracts: false,
    governance: true
  },

  // Compliance configuration
  compliance: {
    gdprCompliant: true,
    dataRetentionPolicy: 'automatic',
    auditTrailEnabled: true,
    privacyByDesign: true,
    dataMinimization: true,
    consentManagement: true,
    dataPortability: true
  },

  // Emergency procedures
  emergency: {
    lockdownEnabled: true,
    emergencyContacts: [
      'admin@emotionalchain.io',
      'security@emotionalchain.io'
    ],
    escalationThresholds: {
      critical: 1, // 1 minute
      high: 5,     // 5 minutes
      medium: 15   // 15 minutes
    },
    automaticRecovery: true,
    manualOverride: true
  }
};