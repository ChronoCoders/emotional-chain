/**
 * EmotionalChain Engine - Core Processing Engine
 * Handles the emotional intelligence processing and validation
 */

import { EnterpriseEmotionalProcessor } from '../biometric/EnterpriseEmotionalMetrics';
import { BiometricDevice } from '../biometric/BiometricDevice';
import { EmotionalValidator } from '../consensus/EmotionalValidator';

export interface EmotionalState {
  stress: number;
  focus: number;
  authenticity: number;
  valence: number;
  arousal: number;
  fatigue: number;
  confidence: number;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  metrics: EmotionalState;
  deviceType: string;
  reason?: string;
}

export class EmotionalEngine {
  private metricsProcessor: EnterpriseEmotionalProcessor;
  private connectedDevices: Map<string, BiometricDevice> = new Map();
  private validationHistory: Map<string, ValidationResult[]> = new Map();

  // Enterprise thresholds for emotional validation
  private readonly THRESHOLDS = {
    CRITICAL_STRESS: 0.85,
    MINIMUM_FOCUS: 0.40,
    MINIMUM_AUTHENTICITY: 0.60,
    MAXIMUM_FATIGUE: 0.80,
    MINIMUM_CONFIDENCE: 0.50
  };

  constructor() {
    this.metricsProcessor = new EnterpriseEmotionalProcessor();
    console.log('EMOTIONAL ENGINE: Initialized enterprise-grade emotional processing');
  }

  /**
   * Process emotional state from biometric data
   */
  public async processEmotionalState(
    deviceId: string, 
    rawBiometricData: any
  ): Promise<EmotionalState> {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not connected`);
      }

      // Process raw biometric data through enterprise metrics
      const processedMetrics = await this.metricsProcessor.processRealTimeData(rawBiometricData);

      const emotionalState: EmotionalState = {
        stress: processedMetrics.primary.stress,
        focus: processedMetrics.primary.focus,
        authenticity: processedMetrics.primary.authenticity,
        valence: processedMetrics.secondary.valence,
        arousal: processedMetrics.secondary.arousal,
        fatigue: processedMetrics.secondary.fatigue,
        confidence: processedMetrics.secondary.confidence,
        timestamp: Date.now()
      };

      console.log(`EMOTIONAL ENGINE: Processed state for ${deviceId}:`, {
        stress: emotionalState.stress.toFixed(3),
        focus: emotionalState.focus.toFixed(3),
        authenticity: emotionalState.authenticity.toFixed(3)
      });

      return emotionalState;
    } catch (error) {
      console.error('EMOTIONAL ENGINE: Processing failed:', error);
      throw error;
    }
  }

  /**
   * Validate emotional fitness for blockchain participation
   */
  public validateEmotionalFitness(
    validatorId: string,
    emotionalState: EmotionalState,
    deviceType: string
  ): ValidationResult {
    try {
      let isValid = true;
      let score = 1.0;
      let reason: string | undefined;

      // Critical stress check
      if (emotionalState.stress > this.THRESHOLDS.CRITICAL_STRESS) {
        isValid = false;
        reason = `Critical stress level: ${emotionalState.stress.toFixed(3)}`;
      }

      // Focus requirement
      if (emotionalState.focus < this.THRESHOLDS.MINIMUM_FOCUS) {
        isValid = false;
        reason = `Insufficient focus: ${emotionalState.focus.toFixed(3)}`;
      }

      // Authenticity requirement
      if (emotionalState.authenticity < this.THRESHOLDS.MINIMUM_AUTHENTICITY) {
        isValid = false;
        reason = `Low authenticity: ${emotionalState.authenticity.toFixed(3)}`;
      }

      // Fatigue check
      if (emotionalState.fatigue > this.THRESHOLDS.MAXIMUM_FATIGUE) {
        isValid = false;
        reason = `Excessive fatigue: ${emotionalState.fatigue.toFixed(3)}`;
      }

      // Confidence requirement
      if (emotionalState.confidence < this.THRESHOLDS.MINIMUM_CONFIDENCE) {
        isValid = false;
        reason = `Low confidence: ${emotionalState.confidence.toFixed(3)}`;
      }

      // Calculate composite emotional score
      if (isValid) {
        score = this.calculateEmotionalScore(emotionalState, deviceType);
      } else {
        score = 0.0;
      }

      const result: ValidationResult = {
        isValid,
        score,
        metrics: emotionalState,
        deviceType,
        reason
      };

      // Store validation history
      if (!this.validationHistory.has(validatorId)) {
        this.validationHistory.set(validatorId, []);
      }
      
      const history = this.validationHistory.get(validatorId)!;
      history.push(result);
      
      // Keep only last 100 validations
      if (history.length > 100) {
        history.shift();
      }

      console.log(`EMOTIONAL ENGINE: Validation for ${validatorId}: ${isValid ? 'PASS' : 'FAIL'} (${score.toFixed(3)})${reason ? ` - ${reason}` : ''}`);

      return result;
    } catch (error) {
      console.error('EMOTIONAL ENGINE: Validation failed:', error);
      return {
        isValid: false,
        score: 0.0,
        metrics: emotionalState,
        deviceType,
        reason: 'Validation error'
      };
    }
  }

  /**
   * Calculate composite emotional score
   */
  private calculateEmotionalScore(state: EmotionalState, deviceType: string): number {
    // Base score from primary metrics
    const primaryScore = (
      (1.0 - state.stress) * 0.3 +  // Lower stress is better
      state.focus * 0.3 +            // Higher focus is better
      state.authenticity * 0.4       // Higher authenticity is better
    );

    // Secondary metrics adjustment
    const secondaryScore = (
      Math.max(0, state.valence) * 0.2 +     // Positive valence bonus
      Math.min(1, state.arousal) * 0.2 +     // Optimal arousal
      (1.0 - state.fatigue) * 0.3 +          // Lower fatigue is better
      state.confidence * 0.3                  // Higher confidence is better
    );

    // Device type adjustment (fairness mechanism)
    let deviceMultiplier = 1.0;
    if (deviceType.includes('consumer')) {
      deviceMultiplier = 1.05; // 5% bonus for consumer devices
    } else if (deviceType.includes('professional')) {
      deviceMultiplier = 1.0;  // Neutral for professional
    } else if (deviceType.includes('medical')) {
      deviceMultiplier = 0.95; // Slight penalty for medical-grade
    }

    const finalScore = Math.min(1.0, (primaryScore * 0.7 + secondaryScore * 0.3) * deviceMultiplier);
    
    return Math.max(0.0, finalScore);
  }

  /**
   * Register biometric device
   */
  public registerDevice(device: BiometricDevice): void {
    this.connectedDevices.set(device.id, device);
    console.log(`EMOTIONAL ENGINE: Registered device ${device.id} (${device.type})`);
  }

  /**
   * Unregister biometric device
   */
  public unregisterDevice(deviceId: string): void {
    if (this.connectedDevices.delete(deviceId)) {
      console.log(`EMOTIONAL ENGINE: Unregistered device ${deviceId}`);
    }
  }

  /**
   * Get validation history for validator
   */
  public getValidationHistory(validatorId: string): ValidationResult[] {
    return this.validationHistory.get(validatorId) || [];
  }

  /**
   * Get current emotional thresholds
   */
  public getThresholds() {
    return { ...this.THRESHOLDS };
  }

  /**
   * Update emotional thresholds (for system tuning)
   */
  public updateThresholds(newThresholds: Partial<typeof this.THRESHOLDS>): void {
    Object.assign(this.THRESHOLDS, newThresholds);
    console.log('EMOTIONAL ENGINE: Updated thresholds:', this.THRESHOLDS);
  }

  /**
   * Get connected devices
   */
  public getConnectedDevices(): BiometricDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Start emotional processing
   */
  public async start(): Promise<void> {
    console.log('EMOTIONAL ENGINE: Starting emotional processing engine');
    await this.metricsProcessor.startProcessing();
  }

  /**
   * Stop emotional processing
   */
  public async stop(): Promise<void> {
    console.log('EMOTIONAL ENGINE: Stopping emotional processing engine');
    this.metricsProcessor.stopProcessing();
  }
}