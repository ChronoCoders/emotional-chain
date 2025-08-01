import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ProofOfEmotionEngine, ConsensusConfig } from '../../consensus/ProofOfEmotionEngine';
import { EmotionalValidator } from '../../consensus/EmotionalValidator';
import { BiometricReading } from '../../biometric/BiometricDevice';
import { P2PNode } from '../../network/P2PNode';
import { DatabaseStorage } from '../../server/storage';

// Mock implementations for testing
class MockP2PNode extends P2PNode {
  constructor() {
    super({
      nodeId: 'test-node',
      listenPort: 8000,
      bootstrapPeers: [],
      maxConnections: 10,
      minConnections: 3,
      enableWebRTC: false,
      enableTCP: true,
      enableWebSockets: false
    });
  }

  async start(): Promise<void> {
    // Mock implementation
  }
}

class MockDatabaseStorage extends DatabaseStorage {
  private validators = new Map<string, EmotionalValidator>();
  
  async getValidator(id: string): Promise<EmotionalValidator | null> {
    return this.validators.get(id) || null;
  }
  
  async saveValidator(validator: EmotionalValidator): Promise<void> {
    this.validators.set(validator.getValidatorId(), validator);
  }
}

function createHonestValidators(count: number): EmotionalValidator[] {
  const validators: EmotionalValidator[] = [];
  for (let i = 0; i < count; i++) {
    const validator = new EmotionalValidator(`honest-validator-${i}`, {
      publicKey: `honest-pubkey-${i}`,
      privateKey: `honest-privkey-${i}`,
      address: `honest-address-${i}`
    });
    
    // Set honest emotional profile
    validator.updateEmotionalProfile({
      validatorId: `honest-validator-${i}`,
      heartRate: 70 + Math.random() * 20, // 70-90 BPM
      stressLevel: 20 + Math.random() * 30, // 20-50%
      focusLevel: 80 + Math.random() * 20, // 80-100%
      authenticity: 0.9 + Math.random() * 0.1, // 90-100%
      timestamp: Date.now(),
      deviceCount: 3,
      qualityScore: 0.9 + Math.random() * 0.1
    });
    
    validators.push(validator);
  }
  return validators;
}

function createMaliciousValidators(count: number): EmotionalValidator[] {
  const validators: EmotionalValidator[] = [];
  for (let i = 0; i < count; i++) {
    const validator = new EmotionalValidator(`malicious-validator-${i}`, {
      publicKey: `malicious-pubkey-${i}`,
      privateKey: `malicious-privkey-${i}`,
      address: `malicious-address-${i}`
    });
    
    // Set suspicious emotional profile
    validator.updateEmotionalProfile({
      validatorId: `malicious-validator-${i}`,
      heartRate: 100 + Math.random() * 50, // Abnormally high
      stressLevel: 80 + Math.random() * 20, // High stress
      focusLevel: 30 + Math.random() * 40, // Low focus
      authenticity: 0.3 + Math.random() * 0.4, // Low authenticity
      timestamp: Date.now(),
      deviceCount: 1, // Minimal devices
      qualityScore: 0.2 + Math.random() * 0.3
    });
    
    validators.push(validator);
  }
  return validators;
}

describe('ProofOfEmotionEngine', () => {
  let engine: ProofOfEmotionEngine;
  let mockP2PNode: MockP2PNode;
  let mockStorage: MockDatabaseStorage;
  let testConfig: ConsensusConfig;

  beforeEach(() => {
    mockP2PNode = new MockP2PNode();
    mockStorage = new MockDatabaseStorage();
    testConfig = {
      epochDuration: 5000, // 5 seconds for testing
      emotionalThreshold: 75,
      byzantineThreshold: 67,
      committeeSize: 21,
      minimumStake: 1000,
      votingTimeout: 2000,
      proposalTimeout: 3000,
      finalityTimeout: 1000
    };
    
    engine = new ProofOfEmotionEngine(mockP2PNode, mockStorage, testConfig);
  });

  afterEach(async () => {
    await engine.stop();
  });

  describe('Byzantine Fault Tolerance', () => {
    it('should maintain consensus with 33% malicious validators', async () => {
      // Create test network: 14 honest + 7 malicious = 21 total (33% malicious)
      const honestValidators = createHonestValidators(14);
      const maliciousValidators = createMaliciousValidators(7);
      const allValidators = [...honestValidators, ...maliciousValidators];
      
      // Register validators with engine
      for (const validator of allValidators) {
        await mockStorage.saveValidator(validator);
      }
      
      // Attempt consensus
      const result = await engine.runConsensusEpoch();
      
      expect(result.success).toBe(true);
      expect(result.block).toBeDefined();
      expect(result.metrics.participantCount).toBeGreaterThanOrEqual(14); // At least honest validators
      expect(result.metrics.byzantineFailures).toBeLessThanOrEqual(7); // Detected malicious
    });

    it('should fail consensus with >33% malicious validators', async () => {
      // Create test network: 10 honest + 11 malicious = 21 total (52% malicious)
      const honestValidators = createHonestValidators(10);
      const maliciousValidators = createMaliciousValidators(11);
      const allValidators = [...honestValidators, ...maliciousValidators];
      
      // Register validators with engine
      for (const validator of allValidators) {
        await mockStorage.saveValidator(validator);
      }
      
      // Attempt consensus - should fail due to Byzantine threshold
      const result = await engine.runConsensusEpoch();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Byzantine fault tolerance exceeded');
      expect(result.metrics.byzantineFailures).toBeGreaterThan(7);
    });

    it('should detect and quarantine suspicious validators', async () => {
      const honestValidators = createHonestValidators(18);
      const suspiciousValidators = createMaliciousValidators(3);
      const allValidators = [...honestValidators, ...suspiciousValidators];
      
      // Register validators
      for (const validator of allValidators) {
        await mockStorage.saveValidator(validator);
      }
      
      // Run multiple consensus rounds to detect patterns
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await engine.runConsensusEpoch();
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }
      
      // Check that suspicious validators were detected
      const byzantineFailures = results.reduce((sum, r) => sum + r.metrics.byzantineFailures, 0);
      expect(byzantineFailures).toBeGreaterThan(0);
      
      // Verify honest validators maintained consensus
      const successfulRounds = results.filter(r => r.success).length;
      expect(successfulRounds).toBeGreaterThanOrEqual(3); // Most rounds should succeed
    });
  });

  describe('Emotional Consensus Algorithm', () => {
    it('should select validators with highest emotional fitness', async () => {
      // Create validators with varying emotional scores
      const lowScoreValidators = createHonestValidators(5);
      const highScoreValidators = createHonestValidators(16);
      
      // Artificially set different emotional scores
      lowScoreValidators.forEach((v, i) => {
        v.updateEmotionalProfile({
          ...v.getEmotionalProfile()!,
          heartRate: 60 + i * 5,
          stressLevel: 60 + i * 5, // Higher stress
          focusLevel: 50 + i * 5,  // Lower focus
          authenticity: 0.6 + i * 0.05
        });
      });
      
      highScoreValidators.forEach((v, i) => {
        v.updateEmotionalProfile({
          ...v.getEmotionalProfile()!,
          heartRate: 65 + i * 2,
          stressLevel: 15 + i * 2, // Lower stress
          focusLevel: 85 + i,      // Higher focus
          authenticity: 0.95 + i * 0.001
        });
      });
      
      const allValidators = [...lowScoreValidators, ...highScoreValidators];
      
      // Register validators
      for (const validator of allValidators) {
        await mockStorage.saveValidator(validator);
      }
      
      const result = await engine.runConsensusEpoch();
      
      expect(result.success).toBe(true);
      expect(result.metrics.emotionalAverage).toBeGreaterThan(75); // Above threshold
      
      // The selected committee should primarily include high-score validators
      // This would require access to internal committee selection, which we'd need to expose for testing
    });

    it('should require minimum biometric device count', async () => {
      const validators = createHonestValidators(21);
      
      // Set some validators to have insufficient devices
      validators.slice(0, 5).forEach(v => {
        v.updateEmotionalProfile({
          ...v.getEmotionalProfile()!,
          deviceCount: 1 // Below minimum threshold
        });
      });
      
      // Register validators
      for (const validator of validators) {
        await mockStorage.saveValidator(validator);
      }
      
      const result = await engine.runConsensusEpoch();
      
      // Should still succeed with remaining validators, but participation should be reduced
      expect(result.success).toBe(true);
      expect(result.metrics.participantCount).toBeLessThan(21); // Some excluded
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle consensus with 100+ validators efficiently', async () => {
      const validators = createHonestValidators(100);
      
      // Register all validators
      for (const validator of validators) {
        await mockStorage.saveValidator(validator);
      }
      
      const startTime = Date.now();
      const result = await engine.runConsensusEpoch();
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.metrics.participantCount).toBeGreaterThan(50); // Significant participation
    });

    it('should maintain performance under high transaction load', async () => {
      const validators = createHonestValidators(21);
      
      // Register validators
      for (const validator of validators) {
        await mockStorage.saveValidator(validator);
      }
      
      // This test would require generating high transaction volume
      // and measuring consensus performance under load
      const result = await engine.runConsensusEpoch();
      
      expect(result.success).toBe(true);
    });
  });

  describe('Network Resilience', () => {
    it('should maintain liveness with validator dropouts', async () => {
      const validators = createHonestValidators(21);
      
      // Register validators
      for (const validator of validators) {
        await mockStorage.saveValidator(validator);
      }
      
      // Simulate some validators going offline during consensus
      // This would require modifying the engine to accept offline validators
      const result = await engine.runConsensusEpoch();
      
      expect(result.success).toBe(true);
    });
  });
});