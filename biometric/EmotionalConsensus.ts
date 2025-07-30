import { BiometricReading } from './BiometricDevice';
import { AuthenticityProof, AuthenticityProofGenerator } from './AuthenticityProof';

export interface EmotionalProfile {
  validatorId: string;
  heartRate: number;
  stressLevel: number;
  focusLevel: number;
  authenticity: number;
  timestamp: number;
  deviceCount: number;
  qualityScore: number;
}

export interface ConsensusScore {
  validatorId: string;
  emotionalScore: number;
  authenticityScore: number;
  stabilityScore: number;
  diversityScore: number;
  finalScore: number;
  eligible: boolean;
  rank: number;
}

export interface ConsensusResult {
  selectedValidator: string;
  scores: ConsensusScore[];
  totalEligible: number;
  consensusStrength: number;
  antiGamingScore: number;
  timestamp: number;
}

export class EmotionalConsensusEngine {
  private readonly MIN_CONSENSUS_SCORE = 75.0;
  private readonly MIN_AUTHENTICITY = 0.80;
  private readonly MIN_DEVICES = 2; // Require multiple biometric modalities
  private readonly MAX_STRESS_LEVEL = 70; // Max stress for consensus participation
  private readonly MIN_FOCUS_LEVEL = 60; // Min focus for consensus participation

  /**
   * Calculate comprehensive emotional score from multiple biometric readings
   */
  public calculateEmotionalScore(
    readings: BiometricReading[],
    authenticityProofs: AuthenticityProof[]
  ): EmotionalProfile {
    if (readings.length === 0) {
      throw new Error('No biometric readings provided');
    }

    const validatorId = readings[0].deviceId.split('-')[0]; // Extract validator ID
    
    // Group readings by type
    const heartRateReadings = readings.filter(r => r.type === 'heartRate');
    const stressReadings = readings.filter(r => r.type === 'stress');
    const focusReadings = readings.filter(r => r.type === 'focus');
    
    // Calculate weighted averages
    const heartRate = this.calculateWeightedAverage(heartRateReadings);
    const stressLevel = this.calculateWeightedAverage(stressReadings);
    const focusLevel = this.calculateWeightedAverage(focusReadings);
    
    // Calculate authenticity from proofs
    const authenticity = this.calculateAuthenticityScore(authenticityProofs);
    
    // Calculate overall quality score
    const qualityScore = this.calculateQualityScore(readings);
    
    return {
      validatorId,
      heartRate: Math.round(heartRate * 100) / 100,
      stressLevel: Math.round(stressLevel * 100) / 100,
      focusLevel: Math.round(focusLevel * 100) / 100,
      authenticity: Math.round(authenticity * 10000) / 10000,
      timestamp: Date.now(),
      deviceCount: this.getUniqueDeviceCount(readings),
      qualityScore: Math.round(qualityScore * 100) / 100
    };
  }

  /**
   * Calculate consensus scores for all validators
   */
  public calculateConsensusScores(profiles: EmotionalProfile[]): ConsensusResult {
    const scores: ConsensusScore[] = [];
    
    for (const profile of profiles) {
      const score = this.calculateValidatorConsensusScore(profile, profiles);
      scores.push(score);
    }
    
    // Sort by final score (descending)
    scores.sort((a, b) => b.finalScore - a.finalScore);
    
    // Assign ranks
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });
    
    // Select validator using fair rotation with emotional weighting
    const eligibleValidators = scores.filter(s => s.eligible);
    const selectedValidator = this.selectValidatorWithFairRotation(eligibleValidators);
    
    // Calculate consensus strength
    const consensusStrength = this.calculateConsensusStrength(scores);
    const antiGamingScore = this.calculateAntiGamingScore(profiles);
    
    return {
      selectedValidator: selectedValidator?.validatorId || '',
      scores,
      totalEligible: eligibleValidators.length,
      consensusStrength,
      antiGamingScore,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate individual validator consensus score
   */
  private calculateValidatorConsensusScore(
    profile: EmotionalProfile,
    allProfiles: EmotionalProfile[]
  ): ConsensusScore {
    // Base emotional score (weighted combination)
    const emotionalScore = this.calculateBaseEmotionalScore(profile);
    
    // Authenticity score (critical for consensus)
    const authenticityScore = profile.authenticity * 100;
    
    // Stability score (consistency over time)
    const stabilityScore = this.calculateStabilityScore(profile, allProfiles);
    
    // Diversity score (multiple sensor modalities)
    const diversityScore = this.calculateDiversityScore(profile);
    
    // Combine scores with weights
    const weights = {
      emotional: 0.40,     // 40% - Core emotional fitness
      authenticity: 0.30,  // 30% - Anti-spoofing protection
      stability: 0.20,     // 20% - Consistency over time
      diversity: 0.10      // 10% - Multiple sensor bonus
    };
    
    const finalScore = 
      emotionalScore * weights.emotional +
      authenticityScore * weights.authenticity +
      stabilityScore * weights.stability +
      diversityScore * weights.diversity;
    
    // Determine eligibility
    const eligible = this.isEligibleForConsensus(profile, finalScore);
    
    return {
      validatorId: profile.validatorId,
      emotionalScore: Math.round(emotionalScore * 100) / 100,
      authenticityScore: Math.round(authenticityScore * 100) / 100,
      stabilityScore: Math.round(stabilityScore * 100) / 100,
      diversityScore: Math.round(diversityScore * 100) / 100,
      finalScore: Math.round(finalScore * 100) / 100,
      eligible,
      rank: 0 // Will be set later
    };
  }

  /**
   * Calculate base emotional score from biometric data
   */
  private calculateBaseEmotionalScore(profile: EmotionalProfile): number {
    // Heart rate optimization (60-100 BPM is optimal)
    const heartRateScore = this.calculateHeartRateScore(profile.heartRate);
    
    // Stress level (lower is better, max 70%)
    const stressScore = Math.max(0, (100 - profile.stressLevel) / 100 * 100);
    
    // Focus level (higher is better, min 60%)
    const focusScore = Math.min(100, profile.focusLevel);
    
    // Quality bonus
    const qualityBonus = profile.qualityScore * 10; // Up to 10% bonus
    
    // Weighted combination
    const baseScore = (
      heartRateScore * 0.30 +
      stressScore * 0.35 +
      focusScore * 0.35
    ) + qualityBonus;
    
    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * Calculate heart rate fitness score
   */
  private calculateHeartRateScore(heartRate: number): number {
    if (heartRate >= 60 && heartRate <= 100) {
      return 100; // Optimal range
    } else if (heartRate >= 50 && heartRate <= 120) {
      return 80; // Good range
    } else if (heartRate >= 40 && heartRate <= 140) {
      return 60; // Acceptable range
    } else {
      return 30; // Poor range
    }
  }

  /**
   * Calculate stability score (consistency over time)
   */
  private calculateStabilityScore(
    profile: EmotionalProfile,
    allProfiles: EmotionalProfile[]
  ): number {
    const validatorProfiles = allProfiles.filter(p => p.validatorId === profile.validatorId);
    
    if (validatorProfiles.length < 3) {
      return 70; // Default for new validators
    }
    
    // Calculate coefficient of variation for each metric
    const heartRates = validatorProfiles.map(p => p.heartRate);
    const stressLevels = validatorProfiles.map(p => p.stressLevel);
    const focusLevels = validatorProfiles.map(p => p.focusLevel);
    
    const heartRateCV = this.calculateCoefficientOfVariation(heartRates);
    const stressCV = this.calculateCoefficientOfVariation(stressLevels);
    const focusCV = this.calculateCoefficientOfVariation(focusLevels);
    
    // Lower CV = higher stability = higher score
    const stabilityScore = 100 - (heartRateCV + stressCV + focusCV) / 3;
    
    return Math.max(30, Math.min(100, stabilityScore));
  }

  /**
   * Calculate diversity score based on number of sensor modalities
   */
  private calculateDiversityScore(profile: EmotionalProfile): number {
    const deviceCount = profile.deviceCount;
    
    if (deviceCount >= 4) return 100; // All modalities
    if (deviceCount >= 3) return 85;  // Most modalities
    if (deviceCount >= 2) return 70;  // Minimum required
    return 30; // Single device (low security)
  }

  /**
   * Check if validator is eligible for consensus participation
   */
  private isEligibleForConsensus(profile: EmotionalProfile, finalScore: number): boolean {
    // Minimum score threshold
    if (finalScore < this.MIN_CONSENSUS_SCORE) {
      return false;
    }
    
    // Authenticity threshold
    if (profile.authenticity < this.MIN_AUTHENTICITY) {
      return false;
    }
    
    // Minimum device count
    if (profile.deviceCount < this.MIN_DEVICES) {
      return false;
    }
    
    // Maximum stress level
    if (profile.stressLevel > this.MAX_STRESS_LEVEL) {
      return false;
    }
    
    // Minimum focus level
    if (profile.focusLevel < this.MIN_FOCUS_LEVEL) {
      return false;
    }
    
    // Quality threshold
    if (profile.qualityScore < 0.5) {
      return false;
    }
    
    return true;
  }

  /**
   * Select validator using fair rotation with emotional weighting
   */
  private selectValidatorWithFairRotation(eligibleValidators: ConsensusScore[]): ConsensusScore | null {
    if (eligibleValidators.length === 0) {
      return null;
    }
    
    // Use block height for rotation (simulated)
    const blockHeight = Math.floor(Date.now() / 10000); // New block every 10 seconds for demo
    
    // Fair rotation: give each validator equal chances over time
    const rotationIndex = blockHeight % eligibleValidators.length;
    
    return eligibleValidators[rotationIndex];
  }

  /**
   * Calculate overall consensus strength
   */
  private calculateConsensusStrength(scores: ConsensusScore[]): number {
    const eligibleScores = scores.filter(s => s.eligible).map(s => s.finalScore);
    
    if (eligibleScores.length === 0) {
      return 0;
    }
    
    const averageScore = eligibleScores.reduce((a, b) => a + b, 0) / eligibleScores.length;
    const participationRate = eligibleScores.length / scores.length;
    
    // Strength combines average quality and participation
    return (averageScore * 0.7 + participationRate * 100 * 0.3);
  }

  /**
   * Calculate anti-gaming score (resistance to manipulation)
   */
  private calculateAntiGamingScore(profiles: EmotionalProfile[]): number {
    let score = 100;
    
    // Check for suspicious patterns
    const authenticityLevels = profiles.map(p => p.authenticity);
    const avgAuthenticity = authenticityLevels.reduce((a, b) => a + b, 0) / authenticityLevels.length;
    
    // Penalize if too many validators have suspiciously high authenticity
    if (avgAuthenticity > 0.95) {
      score -= 10;
    }
    
    // Check for device diversity
    const avgDeviceCount = profiles.reduce((sum, p) => sum + p.deviceCount, 0) / profiles.length;
    if (avgDeviceCount < 2.5) {
      score -= 15; // Penalize low device diversity
    }
    
    // Check for temporal clustering (all readings too close in time)
    const timestamps = profiles.map(p => p.timestamp);
    const timeSpread = Math.max(...timestamps) - Math.min(...timestamps);
    if (timeSpread < 30000) { // Less than 30 seconds spread
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate weighted average of biometric readings
   */
  private calculateWeightedAverage(readings: BiometricReading[]): number {
    if (readings.length === 0) {
      return 0;
    }
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const reading of readings) {
      const weight = reading.quality;
      weightedSum += reading.value * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate authenticity score from proofs
   */
  private calculateAuthenticityScore(proofs: AuthenticityProof[]): number {
    if (proofs.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let validProofs = 0;
    
    for (const proof of proofs) {
      if (AuthenticityProofGenerator.verifyAuthenticityProof(proof, proof.biometricHash.deviceId)) {
        // Extract liveness score from proof
        const livenessScore = proof.livenessProof ? parseFloat(proof.livenessProof.split(':')[0]) : 0.7;
        totalScore += livenessScore;
        validProofs++;
      }
    }
    
    return validProofs > 0 ? totalScore / validProofs : 0;
  }

  /**
   * Calculate quality score from readings
   */
  private calculateQualityScore(readings: BiometricReading[]): number {
    if (readings.length === 0) {
      return 0;
    }
    
    const totalQuality = readings.reduce((sum, reading) => sum + reading.quality, 0);
    return totalQuality / readings.length;
  }

  /**
   * Get count of unique devices in readings
   */
  private getUniqueDeviceCount(readings: BiometricReading[]): number {
    const uniqueDevices = new Set(readings.map(r => r.deviceId));
    return uniqueDevices.size;
  }

  /**
   * Calculate coefficient of variation
   */
  private calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) {
      return 0;
    }
    
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return (standardDeviation / mean) * 100;
  }

  /**
   * Get consensus thresholds for configuration
   */
  public getConsensusThresholds(): any {
    return {
      minConsensusScore: this.MIN_CONSENSUS_SCORE,
      minAuthenticity: this.MIN_AUTHENTICITY,
      minDevices: this.MIN_DEVICES,
      maxStressLevel: this.MAX_STRESS_LEVEL,
      minFocusLevel: this.MIN_FOCUS_LEVEL
    };
  }

  /**
   * Update consensus thresholds (for network governance)
   */
  public updateConsensusThresholds(thresholds: any): void {
    if (thresholds.minConsensusScore !== undefined) {
      (this as any).MIN_CONSENSUS_SCORE = Math.max(50, Math.min(95, thresholds.minConsensusScore));
    }
    
    if (thresholds.minAuthenticity !== undefined) {
      (this as any).MIN_AUTHENTICITY = Math.max(0.5, Math.min(1.0, thresholds.minAuthenticity));
    }
    
    if (thresholds.minDevices !== undefined) {
      (this as any).MIN_DEVICES = Math.max(1, Math.min(5, thresholds.minDevices));
    }
    
    if (thresholds.maxStressLevel !== undefined) {
      (this as any).MAX_STRESS_LEVEL = Math.max(30, Math.min(90, thresholds.maxStressLevel));
    }
    
    if (thresholds.minFocusLevel !== undefined) {
      (this as any).MIN_FOCUS_LEVEL = Math.max(30, Math.min(90, thresholds.minFocusLevel));
    }
    
    console.log('🎯 Consensus thresholds updated:', this.getConsensusThresholds());
  }

  /**
   * Simulate network consensus with multiple validators
   */
  public simulateNetworkConsensus(validatorCount: number = 10): ConsensusResult {
    const profiles: EmotionalProfile[] = [];
    
    // Generate simulated validator profiles
    for (let i = 0; i < validatorCount; i++) {
      const validatorId = `Validator${i + 1}`;
      
      profiles.push({
        validatorId,
        heartRate: 60 + Math.random() * 40, // 60-100 BPM
        stressLevel: Math.random() * 80, // 0-80%
        focusLevel: 40 + Math.random() * 60, // 40-100%
        authenticity: 0.7 + Math.random() * 0.3, // 70-100%
        timestamp: Date.now() - Math.random() * 60000, // Last minute
        deviceCount: Math.floor(Math.random() * 4) + 1, // 1-4 devices
        qualityScore: 0.6 + Math.random() * 0.4 // 60-100%
      });
    }
    
    return this.calculateConsensusScores(profiles);
  }
}