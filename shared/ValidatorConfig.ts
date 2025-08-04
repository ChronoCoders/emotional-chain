/**
 * EmotionalChain Validator Configuration
 * Centralized configuration for slashing thresholds and validator parameters
 */

export interface SlashingConfig {
  emotional: {
    criticalThreshold: number;    // Below this score = critical slashing
    majorThreshold: number;       // Below this score = major slashing
    minorThreshold: number;       // Below this score = minor slashing
    trendThreshold: number;       // Declining trend penalty threshold
  };
  performance: {
    uptimeThreshold: number;      // Minimum uptime percentage
    authenticityThreshold: number; // Minimum authenticity score
    maxOfflineTime: number;       // Max offline time in milliseconds
  };
  penalties: {
    critical: number;             // Critical penalty percentage
    major: number;                // Major penalty percentage  
    minor: number;                // Minor penalty percentage
  };
  byzantine: {
    detectionThreshold: number;   // Byzantine behavior detection threshold
    maxWarnings: number;          // Max warnings before slashing
  };
}

export interface ValidatorThresholds {
  emotionalScore: {
    minimum: number;              // Minimum score for participation
    optimal: number;              // Optimal score for max rewards
    excellent: number;            // Excellent score threshold
  };
  biometric: {
    heartRate: {
      min: number;
      max: number;
      optimal: [number, number];  // [min, max] optimal range
    };
    stressLevel: {
      max: number;                // Maximum stress level
      warning: number;            // Warning threshold
    };
    focusLevel: {
      min: number;                // Minimum focus level
      optimal: number;            // Optimal focus level
    };
    authenticity: {
      min: number;                // Minimum authenticity score
      good: number;               // Good authenticity score
      excellent: number;          // Excellent authenticity score
    };
  };
}

export const VALIDATOR_CONFIG: SlashingConfig = {
  emotional: {
    criticalThreshold: 40.0,      // Below 40% = critical
    majorThreshold: 60.0,         // Below 60% = major
    minorThreshold: 75.0,         // Below 75% = minor
    trendThreshold: -10.0,        // -10% trend = penalty
  },
  performance: {
    uptimeThreshold: 95.0,        // 95% minimum uptime
    authenticityThreshold: 80.0,  // 80% minimum authenticity
    maxOfflineTime: 3600000,      // 1 hour max offline
  },
  penalties: {
    critical: 15.0,               // 15% stake penalty
    major: 8.0,                   // 8% stake penalty
    minor: 3.0,                   // 3% stake penalty
  },
  byzantine: {
    detectionThreshold: 85.0,     // 85% confidence for byzantine detection
    maxWarnings: 3,               // 3 warnings before slashing
  }
};

export const VALIDATOR_THRESHOLDS: ValidatorThresholds = {
  emotionalScore: {
    minimum: 60.0,                // 60% minimum for participation
    optimal: 85.0,                // 85% optimal score
    excellent: 95.0,              // 95% excellent score
  },
  biometric: {
    heartRate: {
      min: 40,
      max: 180,
      optimal: [60, 100],         // 60-100 BPM optimal
    },
    stressLevel: {
      max: 80.0,                  // 80% max stress
      warning: 60.0,              // 60% warning threshold
    },
    focusLevel: {
      min: 50.0,                  // 50% minimum focus
      optimal: 80.0,              // 80% optimal focus
    },
    authenticity: {
      min: 70.0,                  // 70% minimum authenticity
      good: 85.0,                 // 85% good authenticity
      excellent: 95.0,            // 95% excellent authenticity
    },
  },
};

/**
 * Helper functions for validator configuration
 */
export const ValidatorConfigHelpers = {
  /**
   * Determine slashing severity based on emotional score
   */
  getSlashingSeverity(emotionalScore: number): 'none' | 'minor' | 'major' | 'critical' {
    if (emotionalScore < VALIDATOR_CONFIG.emotional.criticalThreshold) return 'critical';
    if (emotionalScore < VALIDATOR_CONFIG.emotional.majorThreshold) return 'major';
    if (emotionalScore < VALIDATOR_CONFIG.emotional.minorThreshold) return 'minor';
    return 'none';
  },

  /**
   * Calculate slashing penalty amount
   */
  calculateSlashingPenalty(severity: 'minor' | 'major' | 'critical', stakeAmount: number): number {
    const penalties = VALIDATOR_CONFIG.penalties;
    const penaltyRate = penalties[severity] / 100;
    return stakeAmount * penaltyRate;
  },

  /**
   * Check if validator meets minimum requirements
   */
  meetsMinimumRequirements(
    emotionalScore: number,
    uptimePercentage: number,
    authenticityScore: number
  ): boolean {
    return (
      emotionalScore >= VALIDATOR_THRESHOLDS.emotionalScore.minimum &&
      uptimePercentage >= VALIDATOR_CONFIG.performance.uptimeThreshold &&
      authenticityScore >= VALIDATOR_CONFIG.performance.authenticityThreshold
    );
  },

  /**
   * Get reward multiplier based on performance
   */
  getRewardMultiplier(emotionalScore: number): number {
    if (emotionalScore >= VALIDATOR_THRESHOLDS.emotionalScore.excellent) return 1.5;
    if (emotionalScore >= VALIDATOR_THRESHOLDS.emotionalScore.optimal) return 1.2;
    if (emotionalScore >= VALIDATOR_THRESHOLDS.emotionalScore.minimum) return 1.0;
    return 0.5; // Reduced rewards for poor performance
  }
};