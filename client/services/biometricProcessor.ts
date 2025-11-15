/**
 * Client-Side Biometric Processor
 * GDPR Compliance: All processing happens on-device
 * RAW BIOMETRIC DATA NEVER LEAVES THE CLIENT
 * 
 * Phase 4 Enhancement: Multi-signal validation with gaming prevention
 */

import { createHash, randomBytes } from 'crypto';
import { multiSignalValidator, type AdvancedBiometricData } from '@shared/biometric/multiSignalValidation';

export interface RawBiometricData {
  heartRate: number;
  hrv: number; // Heart rate variability
  stressLevel: number; // 0-100
  focusLevel?: number; // 0-100
  temperature?: number;
  timestamp: number;
}

export interface BiometricScore {
  emotional: number; // 0-100
  coherence: number; // 0-1
  authenticity: number; // 0-1
  overall: number; // 0-100
}

export interface ScoreCommitment {
  commitment: string; // Hash of score + nonce
  zkProof: string; // Zero-knowledge proof
  timestamp: number;
  deviceId: string;
  // NOTE: NO raw data or actual score values
}

/**
 * Biometric Processor - Runs entirely client-side
 * Implements data minimization principle (GDPR Article 5)
 */
export class BiometricProcessor {
  private deviceId: string;
  
  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  /**
   * Process biometric data locally
   * RAW DATA NEVER LEAVES THIS FUNCTION
   * 
   * @param rawData Raw biometric readings from device
   * @returns Commitment and proof only (NO raw data)
   */
  async processLocalBiometricData(rawData: RawBiometricData): Promise<ScoreCommitment> {
    // 1. Compute score locally (stays in memory only)
    const score = this.computeEmotionalScore(rawData);
    
    // 2. Generate cryptographic nonce
    const nonce = randomBytes(32);
    
    // 3. Create commitment (hash of score + nonce)
    const commitment = this.createCommitment(score.overall, nonce);
    
    // 4. Generate ZK proof (score > threshold)
    const zkProof = await this.generateThresholdProof(score.overall, 75, nonce);
    
    // 5. Clear sensitive data from memory
    // (In production, use secure memory wiping)
    
    // 6. Return ONLY commitment and proof
    return {
      commitment: commitment.toString('hex'),
      zkProof: zkProof,
      timestamp: Date.now(),
      deviceId: this.deviceId,
    };
  }

  /**
   * Compute emotional score from raw biometric data
   * PRIVATE: Score never exposed outside this class
   * Phase 4: Uses multi-signal validation with gaming prevention
   */
  private computeEmotionalScore(rawData: RawBiometricData): BiometricScore {
    // Phase 4: Use advanced multi-signal validation
    const advancedData: AdvancedBiometricData = {
      heartRate: rawData.heartRate,
      hrv: rawData.hrv,
      stressLevel: rawData.stressLevel,
      coherence: rawData.focusLevel || 75, // Use focus as coherence proxy
    };
    
    // Compute score with gaming prevention
    const scoreResult = multiSignalValidator.computeEmotionalScore(advancedData);
    
    // Device normalization (if device type is known)
    const deviceType = this.getDeviceType();
    const normalizedResult = deviceType
      ? multiSignalValidator.normalizeForDevice(scoreResult, deviceType)
      : scoreResult;
    
    return {
      emotional: normalizedResult.finalScore,
      coherence: scoreResult.components.coherenceScore / 100,
      authenticity: this.calculateAuthenticity(rawData),
      overall: Math.min(100, Math.max(0, normalizedResult.finalScore)),
    };
  }

  /**
   * Get device type for normalization
   * In production, this would come from device attestation
   */
  private getDeviceType(): string | null {
    // This is a demo - in production, device type comes from attestation
    // For now, assume a default device type
    return 'polar_h10'; // Medical-grade baseline device
  }

  /**
   * Normalize heart rate to 0-100 score
   */
  private normalizeHeartRate(hr: number): number {
    // Optimal range: 60-80 bpm
    const optimal = 70;
    const range = 20;
    
    const deviation = Math.abs(hr - optimal);
    const score = 100 - (deviation / range) * 100;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Normalize HRV to 0-100 score
   */
  private normalizeHRV(hrv: number): number {
    // Higher HRV is better (indicates good autonomic balance)
    // Typical range: 20-200 ms
    const normalized = Math.min(hrv / 200, 1) * 100;
    return Math.min(100, Math.max(0, normalized));
  }

  /**
   * Calculate coherence between metrics
   */
  private calculateCoherence(rawData: RawBiometricData): number {
    // High coherence = metrics are consistent with each other
    // Low coherence = potential spoofing or device malfunction
    
    const hrConsistency = this.checkHRConsistency(rawData.heartRate, rawData.hrv);
    const stressConsistency = this.checkStressConsistency(rawData.heartRate, rawData.stressLevel);
    
    return (hrConsistency + stressConsistency) / 2;
  }

  /**
   * Check heart rate and HRV consistency
   */
  private checkHRConsistency(hr: number, hrv: number): number {
    // Higher HR should correlate with lower HRV
    // This is a simplified check
    
    if (hr > 90 && hrv > 100) return 0.5; // Inconsistent
    if (hr < 70 && hrv < 50) return 0.5; // Inconsistent
    
    return 1.0; // Consistent
  }

  /**
   * Check stress and heart rate consistency
   */
  private checkStressConsistency(hr: number, stress: number): number {
    // High stress should correlate with higher HR
    
    if (stress > 70 && hr < 70) return 0.5; // Inconsistent
    if (stress < 30 && hr > 90) return 0.5; // Inconsistent
    
    return 1.0; // Consistent
  }

  /**
   * Calculate authenticity score (anti-spoofing)
   */
  private calculateAuthenticity(rawData: RawBiometricData): number {
    // Check for unrealistic patterns
    let authenticity = 1.0;
    
    // Heart rate outside human range
    if (rawData.heartRate < 40 || rawData.heartRate > 200) {
      authenticity *= 0.3;
    }
    
    // HRV unrealistic
    if (rawData.hrv < 10 || rawData.hrv > 300) {
      authenticity *= 0.5;
    }
    
    // Perfect values (likely fake)
    if (rawData.heartRate % 10 === 0 && rawData.stressLevel % 10 === 0) {
      authenticity *= 0.7;
    }
    
    return authenticity;
  }

  /**
   * Create cryptographic commitment
   * Commitment = Hash(score || nonce)
   */
  private createCommitment(score: number, nonce: Buffer): Buffer {
    const scoreBuffer = Buffer.from(score.toString());
    const combined = Buffer.concat([scoreBuffer, nonce]);
    
    return createHash('sha256').update(combined).digest();
  }

  /**
   * Generate zero-knowledge threshold proof
   * Proves score > threshold WITHOUT revealing actual score
   * 
   * This is a MOCK implementation for demo
   * Production: Use circomlibjs + SnarkJS
   */
  private async generateThresholdProof(
    score: number,
    threshold: number,
    nonce: Buffer
  ): Promise<string> {
    const proofData = {
      type: 'threshold_proof',
      scoreAboveThreshold: score >= threshold,
      commitment: this.createCommitment(score, nonce).toString('hex'),
      threshold,
      timestamp: Date.now(),
      protocol: 'groth16',
      // Mock proof components
      pi_a: randomBytes(32).toString('hex'),
      pi_b: randomBytes(32).toString('hex'),
      pi_c: randomBytes(32).toString('hex'),
    };
    
    return JSON.stringify(proofData);
  }

  /**
   * Verify a commitment matches a revealed score
   * Used for local verification only
   */
  verifyCommitment(commitment: string, score: number, nonce: Buffer): boolean {
    const computedCommitment = this.createCommitment(score, nonce);
    return computedCommitment.toString('hex') === commitment;
  }

  /**
   * Get device reading (PRIVATE - never exposed)
   * In production, this would connect to actual hardware
   */
  private async getRawBiometricData(): Promise<RawBiometricData> {
    // Mock implementation
    // Production: Connect to Web Bluetooth API or USB device
    
    return {
      heartRate: 70 + Math.random() * 20,
      hrv: 50 + Math.random() * 50,
      stressLevel: Math.random() * 50,
      focusLevel: 60 + Math.random() * 30,
      timestamp: Date.now(),
    };
  }

  /**
   * Continuous monitoring mode
   * Processes data at regular intervals, sends only commitments
   */
  async startMonitoring(
    intervalMs: number = 60000,
    onCommitment: (commitment: ScoreCommitment) => Promise<void>
  ): Promise<() => void> {
    const intervalId = setInterval(async () => {
      try {
        // Get raw data (stays local)
        const rawData = await this.getRawBiometricData();
        
        // Process and create commitment
        const commitment = await this.processLocalBiometricData(rawData);
        
        // Send only commitment to server
        await onCommitment(commitment);
        
      } catch (error) {
        console.error('Biometric monitoring error:', error);
      }
    }, intervalMs);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

/**
 * Factory function for creating processor instance
 */
export function createBiometricProcessor(deviceId: string): BiometricProcessor {
  return new BiometricProcessor(deviceId);
}
