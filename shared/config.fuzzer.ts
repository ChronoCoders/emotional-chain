/**
 * Configuration Fuzz Testing System
 * Generates randomized but valid configurations for testing edge cases
 */

import { z } from 'zod';
import { ConfigSchema, type EmotionalChainConfig } from './config.schema';

// Fuzz testing result interface
export interface FuzzTestResult {
  config: EmotionalChainConfig;
  success: boolean;
  error?: string;
  testSuite: string;
  timestamp: number;
  performance?: {
    validationTime: number;
    consensusTime?: number;
    throughput?: number;
  };
}

export class ConfigurationFuzzer {
  private testResults: FuzzTestResult[] = [];
  private failureLog: Array<{ config: unknown; error: string; timestamp: number }> = [];

  /**
   * Generate a random but valid configuration within schema bounds
   */
  generateRandomConfig(): EmotionalChainConfig {
    return {
      network: {
        ports: {
          http: this.randomInt(3000, 8000),
          p2p: this.randomInt(8000, 9000),
          websocket: this.randomInt(9000, 10000),
        },
        hosts: {
          http: this.randomChoice(['0.0.0.0', '127.0.0.1', 'localhost']),
          p2p: this.randomChoice(['0.0.0.0', '127.0.0.1']),
        },
        protocols: {
          tls: {
            version: this.randomChoice(['1.2', '1.3'] as const),
            required: this.randomBoolean(),
            certificateRotationDays: this.randomInt(30, 365),
          },
          websocket: {
            heartbeatInterval: this.randomInt(10000, 120000),
            reconnectAttempts: this.randomInt(3, 20),
            reconnectDelay: this.randomInt(1000, 10000),
          },
        },
        timeouts: {
          connection: this.randomInt(5000, 60000),
          request: this.randomInt(5000, 60000),
          websocket: this.randomInt(30000, 180000),
          p2pHandshake: this.randomInt(5000, 30000),
        },
      },

      consensus: {
        algorithm: this.randomChoice(['ProofOfEmotion', 'HybridPoE'] as const),
        quorum: {
          ratio: this.randomFloat(0.51, 0.99, 2),
          minimumValidators: this.randomInt(3, 50),
          maximumValidators: this.randomInt(100, 5000),
        },
        timing: {
          blockTime: this.randomInt(10, 120),
          consensusRoundTimeout: this.randomInt(10000, 120000),
          proposalTimeout: this.randomInt(5000, 30000),
          voteTimeout: this.randomInt(5000, 30000),
          commitTimeout: this.randomInt(5000, 30000),
        },
        thresholds: {
          emotionalScore: this.randomFloat(60, 95, 1),
          authenticityScore: this.randomFloat(0.6, 0.95, 2),
          participationRate: this.randomFloat(0.6, 0.95, 2),
          networkHealthMinimum: this.randomFloat(70, 95, 1),
        },
        rewards: {
          baseValidatorReward: this.randomFloat(10, 100, 2),
          emotionalBonus: {
            multiplier: this.randomFloat(1.0, 3.0, 2),
            maxBonus: this.randomFloat(5, 50, 2),
          },
          penaltyReduction: this.randomFloat(0.05, 0.5, 2),
        },
        difficulty: {
          initial: this.randomInt(1, 5),
          adjustmentBlocks: this.randomInt(50, 500),
          targetTime: this.randomInt(15, 180),
        },
      },

      biometric: {
        devices: {
          maxConcurrentDevices: this.randomInt(3, 15),
          connectionTimeout: this.randomInt(5000, 30000),
          dataRetentionDays: this.randomInt(7, 180),
          samplingRate: this.randomInt(50, 500),
        },
        validation: {
          minimumDevices: this.randomInt(1, 5),
          maximumDevices: this.randomInt(5, 15),
          authenticityWindow: this.randomInt(15000, 120000),
          livenessCheckInterval: this.randomInt(30000, 300000),
        },
        thresholds: {
          heartRate: {
            min: this.randomInt(50, 70),
            max: this.randomInt(160, 200),
            anomalyDetection: this.randomFloat(0.1, 0.5, 2),
          },
          stressLevel: {
            min: this.randomInt(5, 20),
            max: this.randomInt(80, 95),
            alertThreshold: this.randomInt(70, 90),
          },
          focusScore: {
            requiredMinimum: this.randomInt(40, 70),
            max: this.randomInt(90, 100),
          },
          authenticity: {
            minimumScore: this.randomFloat(0.6, 0.9, 2),
            confidenceThreshold: this.randomFloat(0.8, 0.99, 2),
          },
        },
      },

      security: {
        authentication: {
          sessionTimeout: this.randomInt(600000, 14400000), // 10min to 4h
          apiKeyLength: this.randomInt(24, 64),
          apiKeyExpirationDays: this.randomInt(30, 180),
          maxFailedAttempts: this.randomInt(3, 10),
        },
        rateLimiting: {
          requestsPerMinute: this.randomInt(100, 5000),
          windowSize: this.randomInt(60000, 900000), // 1min to 15min
          blockDuration: this.randomInt(300000, 3600000), // 5min to 1h
        },
        ddosProtection: {
          enabled: this.randomBoolean(),
          threshold: this.randomInt(1000, 50000),
          blockDuration: this.randomInt(600000, 7200000), // 10min to 2h
        },
        zkpProofs: {
          proofExpirationHours: this.randomInt(6, 72),
          maxProofsPerValidator: this.randomInt(500, 5000),
          verificationTimeout: this.randomInt(3000, 15000),
        },
      },

      ai: {
        models: {
          emotionalPredictor: {
            threshold: this.randomFloat(0.7, 0.95, 2),
            retrainInterval: this.randomInt(3600000, 259200000), // 1h to 3d
            accuracy: this.randomFloat(0.8, 0.98, 2),
          },
          anomalyDetector: {
            sensitivity: this.randomFloat(0.3, 0.9, 2),
            falsePositiveRate: this.randomFloat(0.01, 0.08, 3),
            modelUpdateFrequency: this.randomInt(1800000, 172800000), // 30min to 2d
          },
          consensusOptimizer: {
            learningRate: this.randomFloat(0.0005, 0.05, 4),
            batchSize: this.randomInt(32, 256),
            optimizationInterval: this.randomInt(1800000, 43200000), // 30min to 12h
          },
        },
        processing: {
          maxConcurrentTasks: this.randomInt(5, 50),
          memoryLimitMB: this.randomInt(2048, 8192),
          gpuAcceleration: this.randomBoolean(),
        },
      },

      infrastructure: {
        kubernetes: {
          minNodes: this.randomInt(3, 20),
          maxNodes: this.randomInt(50, 500),
          nodeType: this.randomChoice(['n1-standard-2', 'n1-standard-4', 'n1-standard-8']),
          autoscaling: {
            enabled: this.randomBoolean(),
            cpuThreshold: this.randomInt(60, 90),
            memoryThreshold: this.randomInt(60, 90),
          },
        },
        monitoring: {
          metricsRetentionDays: this.randomInt(14, 90),
          alertingEnabled: this.randomBoolean(),
          healthCheckInterval: this.randomInt(30000, 180000), // 30s to 3min
        },
        storage: {
          persistentVolumeSize: this.randomChoice(['50Gi', '100Gi', '200Gi', '500Gi']),
          backupRetentionDays: this.randomInt(14, 90),
          replicationFactor: this.randomInt(2, 7),
        },
      },

      storage: {
        database: {
          connectionPoolSize: this.randomInt(10, 50),
          queryTimeout: this.randomInt(10000, 120000), // 10s to 2min
          backupInterval: this.randomInt(10800000, 43200000), // 3h to 12h
        },
        replication: {
          minimumReplicas: this.randomInt(2, 5),
          targetReplicas: this.randomInt(5, 20),
          syncTimeout: this.randomInt(10000, 120000),
        },
        caching: {
          ttl: this.randomInt(60000, 1800000), // 1min to 30min
          maxSize: this.randomInt(1000, 50000),
          enabled: this.randomBoolean(),
        },
      },

      performance: {
        optimization: {
          backgroundProcessing: this.randomBoolean(),
          parallelValidation: this.randomBoolean(),
          cacheWarmup: this.randomBoolean(),
        },
        limits: {
          maxTransactionsPerBlock: this.randomInt(1000, 50000),
          maxBlockSize: this.randomInt(5242880, 52428800), // 5MB to 50MB
          maxValidatorsPerEpoch: this.randomInt(100, 5000),
        },
        monitoring: {
          performanceMetrics: this.randomBoolean(),
          resourceUsageTracking: this.randomBoolean(),
          latencyMonitoring: this.randomBoolean(),
        },
      },
    };
  }

  /**
   * Run fuzz testing with specified number of iterations
   */
  async runFuzzTest(iterations: number = 100, testSuite: string = 'default'): Promise<FuzzTestResult[]> {
    console.log(`🧪 Starting configuration fuzz testing: ${iterations} iterations`);
    
    const results: FuzzTestResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const config = this.generateRandomConfig();
        
        // Validate the generated config
        ConfigSchema.parse(config);
        
        const validationTime = performance.now() - startTime;
        
        const result: FuzzTestResult = {
          config,
          success: true,
          testSuite,
          timestamp: Date.now(),
          performance: {
            validationTime,
          },
        };
        
        results.push(result);
        this.testResults.push(result);
        successCount++;
        
        if (i % 10 === 0) {
          console.log(`  📊 Progress: ${i}/${iterations} (${successCount} success, ${failureCount} failures)`);
        }
        
      } catch (error) {
        failureCount++;
        const config = this.generateRandomConfig();
        
        const result: FuzzTestResult = {
          config,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          testSuite,
          timestamp: Date.now(),
        };
        
        results.push(result);
        this.testResults.push(result);
        
        this.failureLog.push({
          config,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        });
      }
    }
    
    console.log(`✅ Fuzz testing completed: ${successCount}/${iterations} successful configurations`);
    
    if (failureCount > 0) {
      console.warn(`⚠️ ${failureCount} configurations failed validation`);
    }
    
    return results;
  }

  /**
   * Get summary statistics from fuzz testing
   */
  getTestStatistics(): {
    totalTests: number;
    successRate: number;
    avgValidationTime: number;
    failureReasons: Record<string, number>;
  } {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success);
    const successRate = totalTests > 0 ? successfulTests.length / totalTests : 0;
    
    const avgValidationTime = successfulTests.length > 0
      ? successfulTests.reduce((sum, r) => sum + (r.performance?.validationTime || 0), 0) / successfulTests.length
      : 0;
    
    const failureReasons: Record<string, number> = {};
    this.failureLog.forEach(failure => {
      const reason = failure.error.split(':')[0]; // Get first part of error message
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });
    
    return {
      totalTests,
      successRate,
      avgValidationTime,
      failureReasons,
    };
  }

  /**
   * Clear test results and failure log
   */
  clearResults(): void {
    this.testResults = [];
    this.failureLog = [];
  }

  // Helper methods for random generation
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  private randomChoice<T>(choices: readonly T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }
}

// Export singleton instance
export const configFuzzer = new ConfigurationFuzzer();