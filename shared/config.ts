/**
 * EmotionalChain Configuration
 * Centralized configuration for biometric validation, consensus, and security
 */

export interface BiometricConfig {
  validation: {
    minimumDevices: number;
    maximumDevices: number;
    requiredAccuracy: number;
    dataRetentionDays: number;
  };
  thresholds: {
    heartRate: {
      min: number;
      max: number;
      optimalMin: number;
      optimalMax: number;
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
      livenessThreshold: number;
    };
  };
  devices: {
    bluetooth: {
      connectionTimeout: number;
      maxRetries: number;
      scanDuration: number;
    };
    usb: {
      pollInterval: number;
      connectionTimeout: number;
    };
  };
}

export interface ConsensusConfig {
  algorithm: 'proof-of-emotion';
  blockTime: number; // seconds
  validators: {
    minimum: number;
    maximum: number;
    rotationInterval: number;
  };
  thresholds: {
    emotionalScore: number;
    participationRate: number;
    consensusQuorum: number;
  };
  rewards: {
    baseReward: number;
    emotionalBonus: number;
    stabilityBonus: number;
  };
}

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  attestation: {
    maxFailedAttempts: number;
    attestationInterval: number;
    requiredSecurityLevel: 'basic' | 'enhanced' | 'hardware_backed';
  };
  rateLimit: {
    maxReadingsPerMinute: number;
    maxAttemptsPerHour: number;
  };
}

export interface NetworkConfig {
  p2p: {
    port: number;
    maxPeers: number;
    bootstrapNodes: string[];
  };
  api: {
    port: number;
    corsOrigins: string[];
    rateLimit: number;
  };
  websocket: {
    port: number;
    heartbeatInterval: number;
    maxConnections: number;
  };
  protocols: {
    websocket: {
      heartbeatInterval: number;
      connectionTimeout: number;
      maxPayloadSize: number;
      reconnectAttempts: number;
      reconnectDelay: number;
      retryLimit: number;
    };
  };
  ports: {
    http: number;
    websocket: number;
  };
}

export interface AIConfig {
  models: {
    anomalyDetector: {
      sensitivity: number;
      threshold: number;
      learningRate: number;
    };
    emotionalAnalyzer: {
      windowSize: number;
      confidence: number;
    };
  };
  tensorflow: {
    backend: 'cpu' | 'webgl' | 'nodejs';
    precision: 'float32' | 'float16';
  };
}

export interface EmotionalChainConfig {
  biometric: BiometricConfig;
  consensus: ConsensusConfig;
  security: SecurityConfig;
  network: NetworkConfig;
  ai: AIConfig;
  environment: 'development' | 'staging' | 'production';
}

export const CONFIG: EmotionalChainConfig = {
  biometric: {
    validation: {
      minimumDevices: 2,
      maximumDevices: 6,
      requiredAccuracy: 0.85,
      dataRetentionDays: 30
    },
    thresholds: {
      heartRate: {
        min: 40,
        max: 200,
        optimalMin: 60,
        optimalMax: 100
      },
      stressLevel: {
        min: 0,
        max: 100,
        alertThreshold: 80
      },
      focusScore: {
        min: 0,
        max: 100,
        requiredMinimum: 40
      },
      authenticity: {
        minimumScore: 0.7,
        livenessThreshold: 0.8
      }
    },
    devices: {
      bluetooth: {
        connectionTimeout: 10000,
        maxRetries: 3,
        scanDuration: 5000
      },
      usb: {
        pollInterval: 1000,
        connectionTimeout: 5000
      }
    }
  },
  consensus: {
    algorithm: 'proof-of-emotion',
    blockTime: 30,
    validators: {
      minimum: 3,
      maximum: 21,
      rotationInterval: 300 // 5 minutes
    },
    thresholds: {
      emotionalScore: 75,          // Minimum emotional score for consensus operations
      basicOperations: 60,         // Minimum emotional score for basic staking
      sensitiveOperations: 75,     // Minimum emotional score for sensitive operations
      participationRate: 0.67,
      consensusQuorum: 0.67
    },
    // UNIFIED AUTHENTICITY-EMOTIONAL SCORE CALCULATION RULES (Enterprise-Grade)
    emotionalScoring: {
      // AUTHENTICITY INTERACTION: How authenticity affects emotional score calculation
      authenticityWeight: 0.25,     // 25% of final emotional score comes from authenticity
      heartRateWeight: 0.30,        // 30% from heart rate optimization  
      stressWeight: 0.25,          // 25% from stress level (inverted)
      focusWeight: 0.20,           // 20% from focus level
      
      // AUTHENTICITY THRESHOLDS (0.0 - 1.0 scale)
      authenticityThresholds: {
        excellent: 0.95,           // >95% authenticity = excellent  
        good: 0.85,               // 85-95% authenticity = good
        acceptable: 0.70,         // 70-85% authenticity = acceptable
        poor: 0.50,              // 50-70% authenticity = poor  
        critical: 0.30           // <30% authenticity = critical failure
      },
      
      // HEART RATE OPTIMIZATION (BPM)
      heartRateOptimal: {
        min: 60,                 // Minimum optimal heart rate
        max: 100,               // Maximum optimal heart rate  
        target: 75              // Target heart rate for maximum score
      },
      
      // EMOTIONAL SCORE CALCULATION METHOD
      calculationMethod: 'weighted_composite', // weighted_composite | simple_average | neural_network
      
      // FINAL SCORE RANGES  
      scoreRanges: {
        excellent: 90,          // 90-100: Excellent emotional state
        good: 75,              // 75-89: Good emotional state
        acceptable: 60,        // 60-74: Acceptable emotional state  
        poor: 40,             // 40-59: Poor emotional state
        critical: 0           // 0-39: Critical emotional failure
      }
    },
    rewards: {
      baseReward: 10,
      emotionalBonus: 5,
      stabilityBonus: 3
    }
  },
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16
    },
    attestation: {
      maxFailedAttempts: 3,
      attestationInterval: 3600000, // 1 hour
      requiredSecurityLevel: 'enhanced'
    },
    rateLimit: {
      maxReadingsPerMinute: 60,
      maxAttemptsPerHour: 100
    }
  },
  network: {
    p2p: {
      port: 8000,
      maxPeers: 50,
      bootstrapNodes: [
        '/ip4/127.0.0.1/tcp/8001/p2p/12D3KooWBootstrap1',
        '/ip4/127.0.0.1/tcp/8002/p2p/12D3KooWBootstrap2'
      ]
    },
    api: {
      port: 5000,
      corsOrigins: [
        'http://localhost:3000', 
        'https://emotionalchain.com',
        'https://www.emotionalchain.com',
        'https://*.replit.app'
      ],
      rateLimit: 100
    },
    websocket: {
      port: 8080,
      heartbeatInterval: 30000,
      maxConnections: 1000
    },
    protocols: {
      websocket: {
        heartbeatInterval: 30000,
        connectionTimeout: 10000,
        maxPayloadSize: 1048576, // 1MB
        reconnectAttempts: 5,
        reconnectDelay: 2000,
        retryLimit: 10
      }
    },
    ports: {
      http: 5000,
      websocket: 5000 // Same port as HTTP server with /ws path
    }
  },
  ai: {
    models: {
      anomalyDetector: {
        sensitivity: 0.75,
        threshold: 0.8,
        learningRate: 0.01
      },
      emotionalAnalyzer: {
        windowSize: 10,
        confidence: 0.85
      }
    },
    tensorflow: {
      backend: 'nodejs',
      precision: 'float32'
    }
  },
  environment: (process.env.NODE_ENV as any) || 'development'
};

export default CONFIG;