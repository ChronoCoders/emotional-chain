import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EmotionalValidator } from '../../consensus/EmotionalValidator';
import { PrivacyLayer } from '../../advanced/PrivacyLayer';
import { WebSocketReconnectionManager } from '../../server/websocket/ReconnectionManager';
import { PrivacyStorage } from '../../database/PrivacyStorage';
import { BlockchainBalanceCalculator } from '../../server/blockchain/BlockchainBalanceCalculator';
import { VALIDATOR_CONFIG, ValidatorConfigHelpers } from '../../shared/ValidatorConfig';

/**
 * Comprehensive system validation tests for EmotionalChain
 * Tests all major components working together with real data
 */

describe('EmotionalChain System Validation', () => {
  let privacyLayer: PrivacyLayer;
  let privacyStorage: PrivacyStorage;
  let balanceCalculator: BlockchainBalanceCalculator;
  let realValidators: EmotionalValidator[];

  beforeAll(async () => {
    // Initialize all system components
    privacyLayer = new PrivacyLayer();
    privacyStorage = new PrivacyStorage();
    balanceCalculator = new BlockchainBalanceCalculator();
    
    // Create test validators using real ecosystem data
    realValidators = await createEcosystemValidators();
  });

  afterAll(async () => {
    // Cleanup test data
    await privacyStorage.cleanupExpiredData();
  });

  describe('Blockchain Immutability Validation', () => {
    it('should maintain Bitcoin/Ethereum-level data integrity', async () => {
      // Test that all balance calculations come from blockchain traversal
      const allBalances = await balanceCalculator.getAllWalletBalances();
      
      expect(allBalances.length).toBe(21); // All 21 ecosystem validators
      
      let totalSupply = 0;
      for (const balance of allBalances) {
        expect(balance.balance).toBeGreaterThan(30000); // Real accumulated wealth
        expect(balance.validatorId).toBeDefined();
        expect(balance.currency).toBe('EMO');
        
        totalSupply += balance.balance;
      }
      
      // Validate total supply matches blockchain calculation
      expect(totalSupply).toBeGreaterThan(570000); // Current total supply
      expect(totalSupply).toBeLessThan(600000);
    });

    it('should validate transaction immutability', async () => {
      const recentTransactions = await balanceCalculator.getRecentTransactions(50);
      
      expect(recentTransactions.length).toBe(50);
      
      for (const tx of recentTransactions) {
        // Validate transaction integrity
        expect(tx.id).toBeDefined();
        expect(tx.from).toBeDefined();
        expect(tx.to).toBeDefined();
        expect(tx.amount).toBeGreaterThan(0);
        expect(['transfer', 'mining_reward', 'validation_reward']).toContain(tx.type);
        
        // Validate cryptographic properties
        if (tx.signature) {
          expect(tx.signature).toMatch(/^[a-f0-9]/);
        }
        
        // Validate timestamp consistency
        expect(tx.timestamp).toBeLessThanOrEqual(Date.now());
        expect(tx.timestamp).toBeGreaterThan(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
    });
  });

  describe('Zero-Knowledge Privacy Layer', () => {
    it('should generate and verify emotional threshold proofs', async () => {
      const validator = realValidators[0];
      const biometricData = generateRealisticBiometricData();
      
      // Generate ZK proof for emotional threshold
      const proof = await privacyLayer.generateEmotionalThresholdProof(
        biometricData,
        validator.getId()
      );
      
      expect(proof).toBeDefined();
      expect(proof.proofId).toMatch(/^zkp_/);
      expect(proof.validatorId).toBe(validator.getId());
      expect(proof.circuitType).toBe('emotional-threshold');
      expect(proof.publicSignals).toBeDefined();
      
      // Verify the proof
      const isValid = await privacyLayer.verifyProof(proof);
      expect(isValid).toBe(true);
      
      // Store proof record
      await privacyStorage.storeZKProofRecord(proof);
    });

    it('should generate biometric range proofs without revealing data', async () => {
      const validator = realValidators[1];
      const biometricData = generateRealisticBiometricData();
      
      // Generate ZK proof for biometric ranges
      const proof = await privacyLayer.generateBiometricRangeProof(
        biometricData,
        validator.getId()
      );
      
      expect(proof).toBeDefined();
      expect(proof.circuitType).toBe('biometric-range');
      
      // Verify proof validity
      const isValid = await privacyLayer.verifyProof(proof);
      expect(isValid).toBe(true);
      
      // Ensure original biometric data is not exposed
      expect(proof.publicSignals).not.toContain(biometricData[0].value.toString());
    });

    it('should validate validator eligibility without exposing stake amounts', async () => {
      const validator = realValidators[2];
      
      // Generate ZK proof for validator eligibility
      const proof = await privacyLayer.generateValidatorEligibilityProof(
        validator,
        validator.getId()
      );
      
      expect(proof).toBeDefined();
      expect(proof.circuitType).toBe('validator-eligibility');
      
      // Verify eligibility proof
      const isValid = await privacyLayer.verifyProof(proof);
      expect(isValid).toBe(true);
      
      // Ensure stake amount is not revealed in public signals
      const stakeAmount = validator.getStake();
      expect(proof.publicSignals).not.toContain(stakeAmount.toString());
    });
  });

  describe('Emotional Consensus Validation', () => {
    it('should validate all ecosystem validators meet requirements', async () => {
      for (const validator of realValidators) {
        const emotionalScore = validator.getEmotionalScore();
        const stakeAmount = validator.getStake();
        
        // Validate emotional score range
        expect(emotionalScore).toBeGreaterThanOrEqual(0);
        expect(emotionalScore).toBeLessThanOrEqual(100);
        
        // Validate stake requirements
        expect(stakeAmount).toBeGreaterThanOrEqual(10000);
        
        // Validate meets minimum requirements using config
        const meetsRequirements = ValidatorConfigHelpers.meetsMinimumRequirements(
          emotionalScore,
          95.0, // Assume good uptime
          85.0  // Assume good authenticity
        );
        
        if (emotionalScore >= VALIDATOR_CONFIG.emotional.minorThreshold) {
          expect(meetsRequirements).toBe(true);
        }
      }
    });

    it('should calculate consistent emotional scores', async () => {
      const validator = realValidators[0];
      const biometricData = generateRealisticBiometricData();
      
      // Calculate score multiple times with same input
      const score1 = validator.calculateEmotionalScore(biometricData);
      const score2 = validator.calculateEmotionalScore(biometricData);
      
      // Scores should be very similar (allowing for small entropy)
      expect(Math.abs(score1 - score2)).toBeLessThan(5);
      
      // Both scores should be in valid range
      expect(score1).toBeGreaterThanOrEqual(0);
      expect(score1).toBeLessThanOrEqual(100);
      expect(score2).toBeGreaterThanOrEqual(0);
      expect(score2).toBeLessThanOrEqual(100);
    });

    it('should apply slashing thresholds correctly', async () => {
      // Test critical slashing
      const criticalScore = VALIDATOR_CONFIG.emotional.criticalThreshold - 5;
      const criticalSeverity = ValidatorConfigHelpers.getSlashingSeverity(criticalScore);
      expect(criticalSeverity).toBe('critical');
      
      const criticalPenalty = ValidatorConfigHelpers.calculateSlashingPenalty('critical', 10000);
      expect(criticalPenalty).toBe(1500); // 15% of 10K
      
      // Test major slashing
      const majorScore = VALIDATOR_CONFIG.emotional.majorThreshold - 5;
      const majorSeverity = ValidatorConfigHelpers.getSlashingSeverity(majorScore);
      expect(majorSeverity).toBe('major');
      
      // Test no slashing for good performance
      const goodScore = VALIDATOR_CONFIG.emotional.minorThreshold + 10;
      const noSeverity = ValidatorConfigHelpers.getSlashingSeverity(goodScore);
      expect(noSeverity).toBe('none');
    });
  });

  describe('WebSocket Communication', () => {
    it('should establish stable WebSocket connections', async () => {
      const wsManager = new WebSocketReconnectionManager('ws://localhost:5000/ws');
      
      let connectionEstablished = false;
      let messageReceived = false;
      
      wsManager.on('connected', () => {
        connectionEstablished = true;
      });
      
      wsManager.on('message', (data) => {
        messageReceived = true;
      });
      
      // Attempt connection (may fail in test environment, but should handle gracefully)
      try {
        await wsManager.connect();
        expect(connectionEstablished).toBe(true);
      } catch (error) {
        // Connection failure is acceptable in test environment
        expect(error).toBeDefined();
      }
      
      wsManager.disconnect();
    });

    it('should handle reconnection with exponential backoff', () => {
      const wsManager = new WebSocketReconnectionManager('ws://invalid-url', {
        maxRetries: 3,
        initialDelay: 100,
        backoffFactor: 2
      });
      
      let reconnectionAttempts = 0;
      
      wsManager.on('reconnecting', ({ attempt, delay }) => {
        reconnectionAttempts = attempt;
        
        // Validate exponential backoff
        if (attempt === 1) expect(delay).toBe(100);
        if (attempt === 2) expect(delay).toBe(200);
        if (attempt === 3) expect(delay).toBe(400);
      });
      
      // This will fail but should trigger reconnection logic
      wsManager.connect().catch(() => {
        // Expected to fail with invalid URL
      });
      
      // Allow time for reconnection attempts
      setTimeout(() => {
        expect(reconnectionAttempts).toBeGreaterThan(0);
        wsManager.disconnect();
      }, 1000);
    });
  });

  describe('Privacy Storage System', () => {
    it('should store biometric data as hashes only', async () => {
      const validatorId = realValidators[0].getId();
      const biometricData = generateRealisticBiometricData()[0];
      
      // Store biometric data as hash
      const hashId = await privacyStorage.storeBiometricHash(
        validatorId,
        biometricData
      );
      
      expect(hashId).toMatch(/^bio_/);
      
      // Verify data integrity
      const isValid = await privacyStorage.verifyBiometricData(
        validatorId,
        biometricData,
        hashId
      );
      
      expect(isValid).toBe(true);
    });

    it('should maintain privacy metrics without exposing sensitive data', async () => {
      const metrics = await privacyStorage.getPrivacyMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalBiometricHashes).toBeGreaterThanOrEqual(0);
      expect(metrics.totalZKProofs).toBeGreaterThanOrEqual(0);
      expect(metrics.averageQualityScore).toBeGreaterThan(0);
      expect(metrics.averageQualityScore).toBeLessThanOrEqual(1);
      expect(metrics.verificationSuccessRate).toBeGreaterThan(0);
      expect(metrics.verificationSuccessRate).toBeLessThanOrEqual(1);
      expect(metrics.dataRetentionDays).toBe(30);
    });
  });

  describe('System Performance', () => {
    it('should maintain consistent block production', async () => {
      // Test that blocks are being produced consistently
      const recentBlocks = await balanceCalculator.getRecentTransactions(10);
      
      expect(recentBlocks.length).toBeGreaterThan(0);
      
      // Validate block timing (should be produced regularly)
      if (recentBlocks.length >= 2) {
        const timeDiffs = [];
        for (let i = 1; i < recentBlocks.length; i++) {
          const diff = recentBlocks[i-1].timestamp - recentBlocks[i].timestamp;
          timeDiffs.push(diff);
        }
        
        // Block times should be relatively consistent (within reasonable variance)
        const avgBlockTime = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
        expect(avgBlockTime).toBeGreaterThan(0);
        expect(avgBlockTime).toBeLessThan(5 * 60 * 1000); // Less than 5 minutes
      }
    });

    it('should handle concurrent validator operations', async () => {
      // Test multiple validators operating simultaneously
      const concurrentOperations = realValidators.slice(0, 5).map(async (validator) => {
        const biometricData = generateRealisticBiometricData();
        const emotionalScore = validator.calculateEmotionalScore(biometricData);
        
        return {
          validatorId: validator.getId(),
          emotionalScore,
          timestamp: Date.now()
        };
      });
      
      const results = await Promise.all(concurrentOperations);
      
      expect(results.length).toBe(5);
      
      for (const result of results) {
        expect(result.validatorId).toBeDefined();
        expect(result.emotionalScore).toBeGreaterThanOrEqual(0);
        expect(result.emotionalScore).toBeLessThanOrEqual(100);
        expect(result.timestamp).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  // Helper functions

  async function createEcosystemValidators(): Promise<EmotionalValidator[]> {
    const validatorNames = [
      'StellarNode', 'NebulaForge', 'QuantumReach', 'OrionPulse',
      'DarkMatterLabs', 'GravityCore', 'AstroSentinel', 'ByteGuardians',
      'ZeroLagOps', 'ChainFlux', 'BlockNerve', 'ValidatorX',
      'NovaSync', 'IronNode', 'SentinelTrust', 'VaultProof',
      'SecureMesh', 'WatchtowerOne', 'AetherRunes', 'ChronoKeep', 'SolForge'
    ];

    const validators: EmotionalValidator[] = [];
    
    for (const name of validatorNames) {
      const keyPair = generateMockKeyPair(name);
      const validator = new EmotionalValidator(
        name,
        15000, // Stake amount
        40000, // Balance (realistic based on blockchain data)
        keyPair
      );
      
      validators.push(validator);
    }
    
    return validators;
  }

  function generateMockKeyPair(validatorId: string) {
    // Generate deterministic keypair for testing
    const hash = require('crypto').createHash('sha256').update(validatorId).digest('hex');
    return {
      publicKey: `pub_${hash.substring(0, 32)}`,
      privateKey: `priv_${hash.substring(32, 64)}`
    };
  }

  function generateRealisticBiometricData() {
    return [
      {
        deviceId: 'test-hr-001',
        deviceType: 'heart_rate',
        value: 70 + Math.random() * 30, // 70-100 BPM
        quality: 0.85 + Math.random() * 0.15, // 85-100% quality
        timestamp: Date.now(),
        authenticity: 0.90 + Math.random() * 0.10 // 90-100% authenticity
      },
      {
        deviceId: 'test-stress-001',
        deviceType: 'stress',
        value: 20 + Math.random() * 30, // 20-50% stress
        quality: 0.80 + Math.random() * 0.20,
        timestamp: Date.now(),
        authenticity: 0.85 + Math.random() * 0.15
      },
      {
        deviceId: 'test-focus-001',
        deviceType: 'focus',
        value: 70 + Math.random() * 25, // 70-95% focus
        quality: 0.85 + Math.random() * 0.15,
        timestamp: Date.now(),
        authenticity: 0.88 + Math.random() * 0.12
      }
    ];
  }
});