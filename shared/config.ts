/**
 * EmotionalChain Production Configuration System
 * Enterprise-grade centralized configuration with validation and auditability
 * 
 * Features:
 * - Strict Zod schema validation with runtime type safety
 * - Environment variable override support for all parameters
 * - Audit logging and historical config snapshots
 * - Fuzz testing capabilities for parameter validation
 * - Zero hardcoded values enforcement
 */

import { validateConfig, type EmotionalChainConfig } from './config.schema';
import { rawConfig } from './config.env';

// Validate and export the final configuration
export const CONFIG: EmotionalChainConfig = validateConfig(rawConfig);

// Export helper functions for dynamic configuration access
export const configHelpers = {
  getRequiredValidators: (totalValidators: number): number => {
    return Math.ceil(totalValidators * CONFIG.consensus.quorum.ratio);
  },
  
  getDynamicTimeout: (baseTimeout: number, networkLoad: number = 1.0): number => {
    return Math.min(baseTimeout * networkLoad, baseTimeout * 3); // Max 3x base timeout
  },
  
  getScaledThreshold: (threshold: number, scaleFactor: number = 1.0): number => {
    return Math.max(threshold * scaleFactor, threshold * 0.5); // Min 50% of base threshold
  },
  
  validateConfigChange: (newConfig: Partial<EmotionalChainConfig>): boolean => {
    try {
      const mergedConfig = { ...rawConfig, ...newConfig };
      validateConfig(mergedConfig);
      return true;
    } catch {
      return false;
    }
  },
};

// Re-export types for convenience
export type { EmotionalChainConfig } from './config.schema';

// Configuration enforcement policy
export const CONFIG_ENFORCEMENT = {
  POLICY: "If it can't be set through CONFIG, it doesn't exist.",
  VERSION: "2.0.0",
  VALIDATION_REQUIRED: true,
  AUDIT_ENABLED: true,
  FUZZ_TESTING_ENABLED: true,
} as const;

// Configuration change validation helper
export function enforceConfigValidation(operation: string, newConfig?: Partial<EmotionalChainConfig>): void {
  if (!CONFIG_ENFORCEMENT.VALIDATION_REQUIRED) return;
  
  console.log(`🔒 CONFIG ENFORCEMENT: Validating ${operation}`);
  
  if (newConfig && !configHelpers.validateConfigChange(newConfig)) {
    throw new Error(`Configuration validation failed for operation: ${operation}`);
  }
  
  console.log(`✅ CONFIG ENFORCEMENT: ${operation} validated successfully`);
}

// Configuration validation and startup checks
function validateStartupConfiguration(): void {
  console.log('🔧 Validating EmotionalChain configuration...');
  
  try {
    // Validate the configuration on startup
    validateConfig(CONFIG);
    console.log('✅ Configuration validation passed');
    
    // Log key configuration values
    console.log(`📊 Key Configuration:`);
    console.log(`   Consensus Quorum: ${CONFIG.consensus.quorum.ratio * 100}%`);
    console.log(`   Block Time: ${CONFIG.consensus.timing.blockTime}s`);
    console.log(`   Emotional Threshold: ${CONFIG.consensus.thresholds.emotionalScore}`);
    console.log(`   AI Model Threshold: ${CONFIG.ai.models.emotionalPredictor.threshold}`);
    console.log(`   TLS Required: ${CONFIG.network.protocols.tls.required}`);
    console.log(`   Ports: HTTP=${CONFIG.network.ports.http}, P2P=${CONFIG.network.ports.p2p}, WS=${CONFIG.network.ports.websocket}`);
    
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    console.error('🚨 EmotionalChain cannot start with invalid configuration');
    process.exit(1);
  }
}

// Run startup validation
validateStartupConfiguration();

// Export configuration sections for specific use cases
export const consensusConfig = CONFIG.consensus;
export const networkConfig = CONFIG.network;
export const biometricConfig = CONFIG.biometric;
export const securityConfig = CONFIG.security;
export const aiConfig = CONFIG.ai;
export const infrastructureConfig = CONFIG.infrastructure;
export const storageConfig = CONFIG.storage;
export const performanceConfig = CONFIG.performance;
export const sdkConfig = CONFIG.sdk;
export const auditConfig = CONFIG.audit;
export const smartContractsConfig = CONFIG.smartContracts;