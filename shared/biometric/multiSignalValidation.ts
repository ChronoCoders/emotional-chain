/**
 * Multi-Signal Biometric Validation
 * Advanced scoring system using multiple correlated signals to prevent manipulation
 * 
 * Key Features:
 * - Multi-metric scoring (heart rate, HRV, stress, coherence)
 * - Cross-correlation detection for fake data patterns
 * - Device normalization for hardware fairness
 * - Historical pattern analysis
 */

export interface AdvancedBiometricData {
  heartRate: number;
  hrv: number; // Heart Rate Variability (ms)
  stressLevel: number; // 0-100
  coherence: number; // Heart-brain coherence (0-100)
  respirationRate?: number; // breaths per minute
  skinConductance?: number; // microsiemens (stress indicator)
}

export interface DeviceNormalization {
  deviceType: string;
  multiplier: number;
  accuracy: number;
}

export interface EmotionalScoreResult {
  finalScore: number;
  components: {
    hrScore: number;
    hrvScore: number;
    stressScore: number;
    coherenceScore: number;
  };
  penalties: {
    correlationPenalty: number;
    anomalyPenalty: number;
  };
  deviceAdjustment: number;
}

export class MultiSignalValidator {
  // Device normalization factors (prevent hardware advantage)
  private static readonly DEVICE_FACTORS: Record<string, DeviceNormalization> = {
    'fitbit': { deviceType: 'fitbit', multiplier: 0.9, accuracy: 85 },
    'apple_watch': { deviceType: 'apple_watch', multiplier: 0.95, accuracy: 90 },
    'polar_h10': { deviceType: 'polar_h10', multiplier: 1.0, accuracy: 98 },
    'muse_s': { deviceType: 'muse_s', multiplier: 1.0, accuracy: 95 },
    'empatica_e4': { deviceType: 'empatica_e4', multiplier: 1.1, accuracy: 99 },
    'hexoskin': { deviceType: 'hexoskin', multiplier: 1.05, accuracy: 97 },
  };

  /**
   * Compute emotional score from multiple biometric signals
   * Harder to manipulate than single-metric scoring
   */
  computeEmotionalScore(data: AdvancedBiometricData): EmotionalScoreResult {
    // 1. Heart Rate Score (normalized)
    const hrScore = this.normalizeHeartRate(data.heartRate);
    
    // 2. HRV Score (high HRV = good stress management)
    const hrvScore = this.normalizeHRV(data.hrv);
    
    // 3. Stress Score (inverted - low stress = high score)
    const stressScore = 100 - data.stressLevel;
    
    // 4. Coherence Score (heart-brain synchronization)
    const coherenceScore = data.coherence;
    
    // 5. Cross-correlation check (detect artificial manipulation)
    const correlationPenalty = this.detectAnomalousCorrelation({
      hr: data.heartRate,
      hrv: data.hrv,
      stress: data.stressLevel,
    });
    
    // 6. Pattern anomaly detection
    const anomalyPenalty = this.detectPatternAnomalies(data);
    
    // Weighted average (equal weights for simplicity)
    const rawScore = (
      hrScore * 0.25 +
      hrvScore * 0.25 +
      stressScore * 0.25 +
      coherenceScore * 0.25
    );
    
    // Apply penalties
    const penalizedScore = Math.max(0, rawScore - correlationPenalty - anomalyPenalty);
    
    return {
      finalScore: penalizedScore,
      components: {
        hrScore,
        hrvScore,
        stressScore,
        coherenceScore,
      },
      penalties: {
        correlationPenalty,
        anomalyPenalty,
      },
      deviceAdjustment: 0, // Set by normalizeForDevice
    };
  }

  /**
   * Normalize heart rate to 0-100 score
   * Optimal zone: 60-80 bpm for calm focus
   */
  private normalizeHeartRate(hr: number): number {
    if (hr < 40 || hr > 180) return 0; // Outside physiological range
    
    // Optimal heart rate: 60-80 bpm = score 100
    // Score decreases linearly outside this range
    if (hr >= 60 && hr <= 80) {
      return 100;
    } else if (hr < 60) {
      return Math.max(0, (hr - 40) / 20 * 100); // 40-60 bpm
    } else {
      return Math.max(0, (180 - hr) / 100 * 100); // 80-180 bpm
    }
  }

  /**
   * Normalize HRV to 0-100 score
   * Higher HRV = better stress management
   * Typical range: 20-200ms (varies by age/fitness)
   */
  private normalizeHRV(hrv: number): number {
    if (hrv < 0) return 0;
    
    // Optimal HRV: 50+ ms
    // Score increases logarithmically
    const normalizedHRV = Math.min(200, hrv);
    return (normalizedHRV / 200) * 100;
  }

  /**
   * Detect if metrics are too perfect (likely fake)
   * Real biometric data has natural variability
   */
  private detectAnomalousCorrelation(data: {
    hr: number;
    hrv: number;
    stress: number;
  }): number {
    let penalty = 0;
    
    // Check HRV-HR correlation
    // Real data: High HR = Low HRV (stress response)
    const expectedHRVForHR = this.expectedHRV(data.hr);
    const hrvDeviation = Math.abs(data.hrv - expectedHRVForHR);
    
    // If HRV is too perfect for the HR, penalize
    if (hrvDeviation < 5) {
      penalty += 20; // Suspicious - too perfect
    }
    
    // Check stress-HR correlation
    // Real data: High HR = High stress
    const expectedStressForHR = this.expectedStress(data.hr);
    const stressDeviation = Math.abs(data.stress - expectedStressForHR);
    
    if (stressDeviation < 5) {
      penalty += 15; // Also suspicious
    }
    
    // Check stress-HRV correlation
    // Real data: High stress = Low HRV
    const expectedHRVForStress = this.expectedHRVForStress(data.stress);
    const hrvStressDeviation = Math.abs(data.hrv - expectedHRVForStress);
    
    if (hrvStressDeviation < 5) {
      penalty += 10; // Triple correlation = very suspicious
    }
    
    return Math.min(penalty, 30); // Cap at 30 point penalty
  }

  /**
   * Expected HRV for a given heart rate
   * Inverse relationship: Higher HR = Lower HRV
   */
  private expectedHRV(hr: number): number {
    // Simplified model: HRV decreases as HR increases
    // Resting HR (60 bpm) → HRV ~100ms
    // Elevated HR (120 bpm) → HRV ~30ms
    if (hr <= 60) return 100;
    if (hr >= 120) return 30;
    return 100 - ((hr - 60) / 60) * 70;
  }

  /**
   * Expected stress level for a given heart rate
   * Positive correlation: Higher HR = Higher stress
   */
  private expectedStress(hr: number): number {
    // Simplified model
    // Resting HR (60 bpm) → Stress ~20%
    // Elevated HR (120 bpm) → Stress ~80%
    if (hr <= 60) return 20;
    if (hr >= 120) return 80;
    return 20 + ((hr - 60) / 60) * 60;
  }

  /**
   * Expected HRV for a given stress level
   * Inverse relationship: Higher stress = Lower HRV
   */
  private expectedHRVForStress(stress: number): number {
    // Simplified model
    // Low stress (20%) → HRV ~100ms
    // High stress (80%) → HRV ~30ms
    if (stress <= 20) return 100;
    if (stress >= 80) return 30;
    return 100 - ((stress - 20) / 60) * 70;
  }

  /**
   * Detect unnatural patterns in biometric data
   * Real data has noise and variability
   */
  private detectPatternAnomalies(data: AdvancedBiometricData): number {
    let penalty = 0;
    
    // Check if values are suspiciously round numbers
    if (data.heartRate % 10 === 0 && data.stressLevel % 10 === 0) {
      penalty += 10; // Too clean
    }
    
    // Check if coherence is unnaturally high with high stress
    if (data.coherence > 90 && data.stressLevel > 70) {
      penalty += 15; // Impossible combination
    }
    
    // Check if HRV is too high for high HR
    if (data.heartRate > 100 && data.hrv > 80) {
      penalty += 10; // Physiologically unlikely
    }
    
    return Math.min(penalty, 25); // Cap penalty
  }

  /**
   * Normalize score for device type (prevent hardware advantage)
   */
  normalizeForDevice(scoreResult: EmotionalScoreResult, deviceType: string): EmotionalScoreResult {
    const deviceFactor = MultiSignalValidator.DEVICE_FACTORS[deviceType];
    
    if (!deviceFactor) {
      // Unknown device - use conservative factor
      return {
        ...scoreResult,
        finalScore: scoreResult.finalScore * 0.8,
        deviceAdjustment: 0.8,
      };
    }
    
    return {
      ...scoreResult,
      finalScore: scoreResult.finalScore * deviceFactor.multiplier,
      deviceAdjustment: deviceFactor.multiplier,
    };
  }

  /**
   * Calculate HRV from heart rate time series
   * HRV = standard deviation of R-R intervals
   */
  calculateHRV(heartRateSamples: number[]): number {
    if (heartRateSamples.length < 2) return 0;
    
    // Convert HR to R-R intervals (ms between beats)
    const rrIntervals = heartRateSamples.map(hr => (60 / hr) * 1000);
    
    // Calculate SDNN (standard deviation of R-R intervals)
    const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const variance = rrIntervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rrIntervals.length;
    const sdnn = Math.sqrt(variance);
    
    return sdnn;
  }

  /**
   * Calculate coherence score from heart rate and respiration
   * Coherence = synchronization between heart and breath
   */
  calculateCoherence(
    heartRateSamples: number[],
    respirationSamples: number[]
  ): number {
    if (heartRateSamples.length === 0 || respirationSamples.length === 0) {
      return 0;
    }
    
    // Simplified coherence: inverse of HR-RR phase difference
    // Real implementation would use cross-correlation
    const avgHR = heartRateSamples.reduce((a, b) => a + b, 0) / heartRateSamples.length;
    const avgResp = respirationSamples.reduce((a, b) => a + b, 0) / respirationSamples.length;
    
    // Optimal ratio: HR ≈ 4-5x respiration rate
    const ratio = avgHR / avgResp;
    const optimalRatio = 4.5;
    const deviation = Math.abs(ratio - optimalRatio);
    
    // Score decreases with deviation
    return Math.max(0, 100 - (deviation * 20));
  }

  /**
   * Historical pattern analysis
   * Detect sudden "perfect" behavior (gaming attempt)
   */
  analyzeHistoricalPattern(
    currentScore: number,
    historicalScores: number[]
  ): { isAnomalous: boolean; penalty: number } {
    if (historicalScores.length < 5) {
      return { isAnomalous: false, penalty: 0 };
    }
    
    // Calculate baseline average
    const baseline = historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length;
    
    // Calculate standard deviation
    const variance = historicalScores.reduce((a, b) => a + Math.pow(b - baseline, 2), 0) / historicalScores.length;
    const stdDev = Math.sqrt(variance);
    
    // Check if current score is suspiciously high
    const zScore = (currentScore - baseline) / stdDev;
    
    if (zScore > 3) {
      // Current score is >3 standard deviations above baseline
      // Likely gaming attempt
      return {
        isAnomalous: true,
        penalty: Math.min(30, zScore * 10), // Penalty increases with z-score
      };
    }
    
    return { isAnomalous: false, penalty: 0 };
  }
}

// Singleton instance
export const multiSignalValidator = new MultiSignalValidator();
