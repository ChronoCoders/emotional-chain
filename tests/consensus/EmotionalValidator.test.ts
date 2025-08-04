import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmotionalValidator } from '../../consensus/EmotionalValidator';
import { BiometricReading } from '../../biometric/BiometricDevice';
import { VALIDATOR_CONFIG, VALIDATOR_THRESHOLDS, ValidatorConfigHelpers } from '../../shared/ValidatorConfig';

/**
 * Comprehensive unit tests for EmotionalValidator
 * Tests emotional score calculation, slashing logic, and boundary conditions
 */

describe('EmotionalValidator', () => {
  let validator: EmotionalValidator;
  let mockKeyPair: { publicKey: string; privateKey: string };

  beforeEach(() => {
    mockKeyPair = {
      publicKey: 'mock-public-key-12345',
      privateKey: 'mock-private-key-12345'
    };
    
    validator = new EmotionalValidator(
      'test-validator-001',
      10000, // 10K EMO stake
      1000,  // 1K EMO balance
      mockKeyPair
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Emotional Score Calculation', () => {
    it('should calculate correct emotional score for optimal biometric data', () => {
      const optimalReadings: BiometricReading[] = [
        {
          deviceId: 'hr-001',
          deviceType: 'heart_rate',
          value: 75,        // Optimal heart rate
          quality: 0.95,
          timestamp: Date.now(),
          authenticity: 0.98
        },
        {
          deviceId: 'stress-001', 
          deviceType: 'stress',
          value: 15,        // Low stress (good)
          quality: 0.92,
          timestamp: Date.now(),
          authenticity: 0.96
        },
        {
          deviceId: 'focus-001',
          deviceType: 'focus',
          value: 90,        // High focus (excellent)
          quality: 0.94,
          timestamp: Date.now(),
          authenticity: 0.97
        }
      ];

      const score = validator.calculateEmotionalScore(optimalReadings);
      
      expect(score).toBeGreaterThanOrEqual(85); // Should be in excellent range
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle boundary biometric data correctly', () => {
      const boundaryReadings: BiometricReading[] = [
        {
          deviceId: 'hr-002',
          deviceType: 'heart_rate',
          value: 40,        // Minimum heart rate
          quality: 0.8,
          timestamp: Date.now(),
          authenticity: 0.7
        },
        {
          deviceId: 'stress-002',
          deviceType: 'stress', 
          value: 80,        // High stress (poor)
          quality: 0.75,
          timestamp: Date.now(),
          authenticity: 0.72
        },
        {
          deviceId: 'focus-002',
          deviceType: 'focus',
          value: 50,        // Minimum focus
          quality: 0.8,
          timestamp: Date.now(),
          authenticity: 0.75
        }
      ];

      const score = validator.calculateEmotionalScore(boundaryReadings);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeLessThan(VALIDATOR_THRESHOLDS.emotionalScore.minimum); // Should be below minimum
    });

    it('should maintain consistency with same input data', () => {
      const consistentReadings: BiometricReading[] = [
        {
          deviceId: 'hr-003',
          deviceType: 'heart_rate',
          value: 80,
          quality: 0.9,
          timestamp: Date.now(),
          authenticity: 0.9
        }
      ];

      const score1 = validator.calculateEmotionalScore(consistentReadings);
      const score2 = validator.calculateEmotionalScore(consistentReadings);
      
      // Scores should be very similar (allowing for small entropy differences)
      expect(Math.abs(score1 - score2)).toBeLessThan(5);
    });

    it('should stay within 0-100 range for extreme inputs', () => {
      const extremeReadings: BiometricReading[] = [
        {
          deviceId: 'hr-extreme',
          deviceType: 'heart_rate',
          value: 250,       // Extremely high
          quality: 0.1,     // Very poor quality
          timestamp: Date.now(),
          authenticity: 0.1 // Very low authenticity
        },
        {
          deviceId: 'stress-extreme',
          deviceType: 'stress',
          value: 100,       // Maximum stress
          quality: 0.1,
          timestamp: Date.now(),
          authenticity: 0.1
        }
      ];

      const score = validator.calculateEmotionalScore(extremeReadings);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Slashing Logic Thresholds', () => {
    it('should correctly identify critical slashing conditions', () => {
      const criticalScore = VALIDATOR_CONFIG.emotional.criticalThreshold - 5; // Below critical
      const severity = ValidatorConfigHelpers.getSlashingSeverity(criticalScore);
      
      expect(severity).toBe('critical');
      
      const penalty = ValidatorConfigHelpers.calculateSlashingPenalty('critical', 10000);
      expect(penalty).toBe(1500); // 15% of 10K stake
    });

    it('should correctly identify major slashing conditions', () => {
      const majorScore = VALIDATOR_CONFIG.emotional.majorThreshold - 5; // Below major
      const severity = ValidatorConfigHelpers.getSlashingSeverity(majorScore);
      
      expect(severity).toBe('major');
      
      const penalty = ValidatorConfigHelpers.calculateSlashingPenalty('major', 10000);
      expect(penalty).toBe(800); // 8% of 10K stake
    });

    it('should correctly identify minor slashing conditions', () => {
      const minorScore = VALIDATOR_CONFIG.emotional.minorThreshold - 5; // Below minor
      const severity = ValidatorConfigHelpers.getSlashingSeverity(minorScore);
      
      expect(severity).toBe('minor');
      
      const penalty = ValidatorConfigHelpers.calculateSlashingPenalty('minor', 10000);
      expect(penalty).toBe(300); // 3% of 10K stake
    });

    it('should not slash for good performance', () => {
      const goodScore = VALIDATOR_CONFIG.emotional.minorThreshold + 10; // Above minor
      const severity = ValidatorConfigHelpers.getSlashingSeverity(goodScore);
      
      expect(severity).toBe('none');
    });
  });

  describe('Validator Requirements', () => {
    it('should validate minimum requirements correctly', () => {
      const meetsRequirements = ValidatorConfigHelpers.meetsMinimumRequirements(
        70, // Above minimum emotional score
        96, // Above minimum uptime
        85  // Above minimum authenticity
      );
      
      expect(meetsRequirements).toBe(true);
    });

    it('should reject validators below minimum requirements', () => {
      const failsRequirements = ValidatorConfigHelpers.meetsMinimumRequirements(
        50, // Below minimum emotional score
        90, // Below minimum uptime  
        75  // Below minimum authenticity
      );
      
      expect(failsRequirements).toBe(false);
    });
  });

  describe('Reward Multipliers', () => {
    it('should apply excellent performance multiplier', () => {
      const excellentScore = VALIDATOR_THRESHOLDS.emotionalScore.excellent;
      const multiplier = ValidatorConfigHelpers.getRewardMultiplier(excellentScore);
      
      expect(multiplier).toBe(1.5); // 50% bonus
    });

    it('should apply optimal performance multiplier', () => {
      const optimalScore = VALIDATOR_THRESHOLDS.emotionalScore.optimal;
      const multiplier = ValidatorConfigHelpers.getRewardMultiplier(optimalScore);
      
      expect(multiplier).toBe(1.2); // 20% bonus
    });

    it('should apply standard multiplier for minimum performance', () => {
      const minimumScore = VALIDATOR_THRESHOLDS.emotionalScore.minimum;
      const multiplier = ValidatorConfigHelpers.getRewardMultiplier(minimumScore);
      
      expect(multiplier).toBe(1.0); // No bonus
    });

    it('should apply penalty for poor performance', () => {
      const poorScore = VALIDATOR_THRESHOLDS.emotionalScore.minimum - 10;
      const multiplier = ValidatorConfigHelpers.getRewardMultiplier(poorScore);
      
      expect(multiplier).toBe(0.5); // 50% penalty
    });
  });

  describe('Biometric Data Validation', () => {
    it('should accept high-quality biometric data', () => {
      const highQualityReadings: BiometricReading[] = [
        {
          deviceId: 'premium-hr-001',
          deviceType: 'heart_rate',
          value: 72,
          quality: 0.98,
          timestamp: Date.now(),
          authenticity: 0.99
        }
      ];

      const score = validator.calculateEmotionalScore(highQualityReadings);
      expect(score).toBeGreaterThan(VALIDATOR_THRESHOLDS.emotionalScore.minimum);
    });

    it('should handle low-quality biometric data appropriately', () => {
      const lowQualityReadings: BiometricReading[] = [
        {
          deviceId: 'basic-hr-001',
          deviceType: 'heart_rate',
          value: 75,
          quality: 0.5,     // Low quality
          timestamp: Date.now(),
          authenticity: 0.6 // Low authenticity
        }
      ];

      const score = validator.calculateEmotionalScore(lowQualityReadings);
      expect(score).toBeLessThan(VALIDATOR_THRESHOLDS.emotionalScore.optimal);
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent threshold hierarchy', () => {
      expect(VALIDATOR_CONFIG.emotional.criticalThreshold)
        .toBeLessThan(VALIDATOR_CONFIG.emotional.majorThreshold);
      
      expect(VALIDATOR_CONFIG.emotional.majorThreshold)
        .toBeLessThan(VALIDATOR_CONFIG.emotional.minorThreshold);
    });

    it('should have reasonable penalty amounts', () => {
      expect(VALIDATOR_CONFIG.penalties.critical).toBeGreaterThan(VALIDATOR_CONFIG.penalties.major);
      expect(VALIDATOR_CONFIG.penalties.major).toBeGreaterThan(VALIDATOR_CONFIG.penalties.minor);
      expect(VALIDATOR_CONFIG.penalties.critical).toBeLessThan(50); // Not too harsh
    });

    it('should have realistic biometric thresholds', () => {
      expect(VALIDATOR_THRESHOLDS.biometric.heartRate.min).toBeGreaterThan(30);
      expect(VALIDATOR_THRESHOLDS.biometric.heartRate.max).toBeLessThan(200);
      expect(VALIDATOR_THRESHOLDS.biometric.stressLevel.max).toBeLessThanOrEqual(100);
      expect(VALIDATOR_THRESHOLDS.biometric.focusLevel.min).toBeGreaterThanOrEqual(0);
    });
  });
});