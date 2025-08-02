import { BiometricData } from './Transaction';
export interface EmotionalValidator {
  id: string;
  address: string;
  biometricData: BiometricData;
  emotionalScore: number;
  lastActive: number;
  blocksValidated: number;
  authenticity: number;
}
export class EmotionalValidatorUtils {
  /**
   * Calculate emotional score from biometric data
   * This is the core of the Proof of Emotion consensus
   */
  public static calculateEmotionalScore(biometricData: BiometricData): number {
    const { heartRate, stressLevel, focusLevel, authenticity } = biometricData;
    // Optimal heart rate zone (60-100 BPM gets higher score)
    const heartRateScore = EmotionalValidatorUtils.calculateHeartRateScore(heartRate);
    // Lower stress is better for validation
    const stressScore = (100 - stressLevel) / 100;
    // Higher focus is better for validation
    const focusScore = focusLevel / 100;
    // Authenticity is crucial for preventing gaming
    const authenticityScore = authenticity;
    // Weighted combination of all factors
    const rawScore = (
      heartRateScore * 0.25 +      // 25% heart rate
      stressScore * 0.30 +         // 30% stress (inverted)
      focusScore * 0.25 +          // 25% focus
      authenticityScore * 0.20     // 20% authenticity
    );
    // Scale to 0-100 and add some secure randomness for fairness
    const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
    const emotionalScore = rawScore * 85 + (randomByte / 255) * 15;
    return Math.round(emotionalScore * 100) / 100; // Round to 2 decimal places
  }
  /**
   * Calculate heart rate score with optimal zones
   */
  private static calculateHeartRateScore(heartRate: number): number {
    // Optimal range: 60-100 BPM
    if (heartRate >= 60 && heartRate <= 100) {
      return 1.0; // Perfect score
    } else if (heartRate >= 50 && heartRate <= 120) {
      return 0.8; // Good score
    } else if (heartRate >= 40 && heartRate <= 140) {
      return 0.6; // Acceptable score
    } else {
      return 0.3; // Low score for extreme values
    }
  }
  /**
   * Verify biometric authenticity (anti-gaming measures)
   */
  public static verifyAuthenticity(biometricData: BiometricData): boolean {
    // Check for realistic biometric patterns
    const { heartRate, stressLevel, focusLevel, authenticity, timestamp } = biometricData;
    // Timestamp must be recent (within 10 minutes)
    const tenMinutes = 10 * 60 * 1000;
    if (Math.abs(Date.now() - timestamp) > tenMinutes) {
      return false;
    }
    // Physiological consistency checks
    if (heartRate > 180 && stressLevel < 20) {
      // Very high heart rate with very low stress is suspicious
      return false;
    }
    if (heartRate < 50 && focusLevel > 90) {
      // Very low heart rate with very high focus is suspicious
      return false;
    }
    // Authenticity threshold (minimum 70%)
    if (authenticity < 0.7) {
      return false;
    }
    return true;
  }
  /**
   * Check if validator has valid emotional proof for consensus
   */
  public static isValidEmotionalProof(emotionalScore: number): boolean {
    // Minimum emotional score threshold for participation
    const MINIMUM_EMOTIONAL_SCORE = 60.0;
    return emotionalScore >= MINIMUM_EMOTIONAL_SCORE;
  }
  /**
   * Select validator based on emotional consensus
   * This implements fair rotation with emotional weighting
   */
  public static selectValidatorByEmotion(
    validators: EmotionalValidator[], 
    blockHeight: number
  ): EmotionalValidator | null {
    // Filter validators with valid emotional proof
    const validValidators = validators.filter(v => 
      EmotionalValidatorUtils.isValidEmotionalProof(v.emotionalScore) &&
      EmotionalValidatorUtils.verifyAuthenticity(v.biometricData)
    );
    if (validValidators.length === 0) {
      return null;
    }
    // Fair rotation based on block height (ensures all validators get turns)
    const validatorIndex = blockHeight % validValidators.length;
    return validValidators[validatorIndex];
  }
  /**
   * Calculate consensus bonus based on emotional score
   */
  public static calculateConsensusBonus(emotionalScore: number, baseReward: number): number {
    // Bonus percentage based on emotional score (0-20% bonus)
    const bonusPercentage = Math.max(0, (emotionalScore - 80) / 100); // Above 80 score gets bonus
    return baseReward * bonusPercentage;
  }
  /**
   * Generate realistic biometric data for testing
   */
  public static generateTestBiometricData(validatorId: string): BiometricData {
    // Generate deterministic but varied data based on validator ID
    const seed = EmotionalValidatorUtils.hashString(validatorId);
    const random = () => (seed * 9301 + 49297) % 233280 / 233280;
    return {
      heartRate: 60 + Math.floor(random() * 40), // 60-100 BPM
      stressLevel: Math.floor(random() * 50), // 0-50% stress
      focusLevel: 70 + Math.floor(random() * 30), // 70-100% focus
      authenticity: 0.8 + random() * 0.2, // 80-100% authenticity
      timestamp: Date.now()
    };
  }
  /**
   * Simple hash function for deterministic randomness
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  /**
   * Create a new emotional validator
   */
  public static createValidator(
    id: string, 
    address: string, 
    biometricData?: BiometricData
  ): EmotionalValidator {
    const biometrics = biometricData || EmotionalValidatorUtils.generateTestBiometricData(id);
    return {
      id,
      address,
      biometricData: biometrics,
      emotionalScore: EmotionalValidatorUtils.calculateEmotionalScore(biometrics),
      lastActive: Date.now(),
      blocksValidated: 0,
      authenticity: biometrics.authenticity
    };
  }
  /**
   * Update validator's biometric data and recalculate emotional score
   */
  public static updateValidatorBiometrics(
    validator: EmotionalValidator, 
    newBiometricData: BiometricData
  ): EmotionalValidator {
    return {
      ...validator,
      biometricData: newBiometricData,
      emotionalScore: EmotionalValidatorUtils.calculateEmotionalScore(newBiometricData),
      lastActive: Date.now(),
      authenticity: newBiometricData.authenticity
    };
  }
  /**
   * Get validator performance metrics
   */
  public static getValidatorMetrics(validator: EmotionalValidator): {
    emotionalScore: number;
    uptime: number;
    blocksValidated: number;
    lastActiveAgo: number;
    isActive: boolean;
  } {
    const now = Date.now();
    const lastActiveAgo = now - validator.lastActive;
    const isActive = lastActiveAgo < 60000; // Active if seen within 1 minute
    // Calculate uptime based on activity pattern
    const dayInMs = 24 * 60 * 60 * 1000;
    const uptime = Math.max(0, 100 - (lastActiveAgo / dayInMs) * 100);
    return {
      emotionalScore: validator.emotionalScore,
      uptime: Math.round(uptime * 100) / 100,
      blocksValidated: validator.blocksValidated,
      lastActiveAgo,
      isActive
    };
  }
}