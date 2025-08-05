// Enterprise-Grade 7-Metric Emotional Intelligence System
// Real-time biometric data processing for Proof of Emotion consensus

export interface EmotionalMetrics {
  // Primary metrics (traditional PoE)
  stress: number;        // 0-1 scale
  focus: number;         // 0-1 scale  
  authenticity: number;  // 0-1 scale
  
  // Secondary metrics (enterprise enhancement)
  valence: number;       // 0-1 scale (negative to positive emotion)
  arousal: number;       // 0-1 scale (calm to excited)
  fatigue: number;       // 0-1 scale (alert to exhausted)
  confidence: number;    // 0-1 scale (uncertain to confident)
  
  // Metadata
  deviceType: 'consumer' | 'professional' | 'medical';
  timestamp: number;
  quality: number;       // Data quality score
}

export interface BiometricReading {
  // Standard physiological data
  heartRate?: number;
  heartRateVariability?: number;
  galvanicSkinResponse?: number;
  
  // Advanced measurements
  blinkRate?: number;
  reactionTime?: number;
  accelerometer?: { x: number; y: number; z: number; magnitude: number };
  
  // EEG data (when available)
  alpha?: number;        // 8-12 Hz - relaxation
  beta?: number;         // 13-30 Hz - active thinking  
  theta?: number;        // 4-7 Hz - creativity/fatigue
  gamma?: number;        // 30-100 Hz - concentration
  
  // Context data
  sessionDuration?: number; // Hours active
  responseConsistency?: number; // Decision consistency
  facialExpression?: number; // Future: computer vision
  
  // Device metadata
  deviceId: string;
  deviceType: string;
  batteryLevel?: number;
  signalQuality?: number;
}

export class EnterpriseEmotionalProcessor {
  
  static processRealTimeMetrics(reading: BiometricReading): EmotionalMetrics {
    const deviceType = this.classifyDeviceType(reading);
    
    return {
      // Primary metrics
      stress: this.calculateStressLevel(reading, deviceType),
      focus: this.calculateFocusLevel(reading, deviceType),
      authenticity: this.calculateAuthenticity(reading, deviceType),
      
      // Secondary metrics
      valence: this.calculateValence(reading, deviceType),
      arousal: this.calculateArousal(reading, deviceType),
      fatigue: this.calculateFatigue(reading, deviceType),
      confidence: this.calculateConfidence(reading, deviceType),
      
      // Metadata
      deviceType,
      timestamp: Date.now(),
      quality: this.calculateDataQuality(reading)
    };
  }
  
  // REAL-TIME STRESS CALCULATION
  private static calculateStressLevel(reading: BiometricReading, deviceType: string): number {
    const hr = reading.heartRate || 70;
    const hrv = reading.heartRateVariability || 0.5;
    const gsr = reading.galvanicSkinResponse || 0.3;
    
    if (deviceType === 'professional' || deviceType === 'medical') {
      // Multi-modal stress analysis
      const hrStress = Math.max(0, Math.min(1, (hr - 60) / 40));
      const hrvStress = 1 - hrv; // Lower HRV = higher stress
      const gsrStress = gsr; // Higher GSR = higher stress
      
      return (hrStress * 0.4 + hrvStress * 0.4 + gsrStress * 0.2);
    } else {
      // Consumer device: Heart rate based estimation
      return Math.max(0, Math.min(1, (hr - 65) / 35));
    }
  }
  
  // REAL-TIME FOCUS CALCULATION
  private static calculateFocusLevel(reading: BiometricReading, deviceType: string): number {
    if (reading.beta && reading.alpha) {
      // EEG-based focus (professional/medical devices)
      const focusRatio = reading.beta / (reading.alpha + (reading.theta || 0.1));
      return Math.max(0, Math.min(1, focusRatio / 3));
    } else {
      // Consumer estimation via HRV and consistency
      const hrv = reading.heartRateVariability || 0.7;
      const consistency = reading.responseConsistency || 0.8;
      return (hrv * 0.6 + consistency * 0.4);
    }
  }
  
  // REAL-TIME VALENCE CALCULATION  
  private static calculateValence(reading: BiometricReading, deviceType: string): number {
    if (reading.alpha && reading.gamma) {
      // EEG-based emotional valence
      const positiveActivity = reading.alpha + reading.gamma;
      const negativeActivity = reading.theta || 0.3;
      return positiveActivity / (positiveActivity + negativeActivity);
    } else {
      // Consumer estimation via HRV patterns
      const hrv = reading.heartRateVariability || 0.5;
      const gsr = reading.galvanicSkinResponse || 0.4;
      return (hrv * 0.7 + (1 - gsr) * 0.3);
    }
  }
  
  // REAL-TIME AROUSAL CALCULATION
  private static calculateArousal(reading: BiometricReading, deviceType: string): number {
    const hr = reading.heartRate || 70;
    const gsr = reading.galvanicSkinResponse || 0.4;
    const movement = reading.accelerometer?.magnitude || 0.2;
    
    const hrArousal = Math.max(0, Math.min(1, (hr - 60) / 40));
    return (hrArousal * 0.5 + gsr * 0.3 + movement * 0.2);
  }
  
  // REAL-TIME FATIGUE CALCULATION
  private static calculateFatigue(reading: BiometricReading, deviceType: string): number {
    const hrv = reading.heartRateVariability || 0.5;
    const reactionTime = reading.reactionTime || 0.4;
    const blinkRate = reading.blinkRate || 0.3;
    const sessionDuration = reading.sessionDuration || 0;
    
    // Physiological fatigue indicators
    const physicalFatigue = (1 - hrv) * 0.5 + blinkRate * 0.2;
    const cognitiveFatigue = reactionTime * 0.3;
    
    // Session duration impact (fatigue increases over time)
    const durationFactor = Math.min(0.3, sessionDuration / 8);
    
    return Math.min(0.95, physicalFatigue + cognitiveFatigue + durationFactor);
  }
  
  // REAL-TIME CONFIDENCE CALCULATION
  private static calculateConfidence(reading: BiometricReading, deviceType: string): number {
    const hrv = reading.heartRateVariability || 0.6;
    const consistency = reading.responseConsistency || 0.7;
    const stressLevel = this.calculateStressLevel(reading, deviceType);
    
    // Confidence correlates with stability and consistency
    const physiologicalStability = hrv;
    const behavioralConsistency = consistency;
    const emotionalStability = 1 - stressLevel;
    
    return (physiologicalStability * 0.4 + behavioralConsistency * 0.4 + emotionalStability * 0.2);
  }
  
  // DEVICE CLASSIFICATION
  private static classifyDeviceType(reading: BiometricReading): 'consumer' | 'professional' | 'medical' {
    const signalQuality = reading.signalQuality || 0.8;
    const hasAdvancedMetrics = !!(reading.alpha || reading.galvanicSkinResponse);
    
    if (signalQuality > 0.98 && hasAdvancedMetrics) return 'medical';
    if (signalQuality > 0.90 && hasAdvancedMetrics) return 'professional';
    return 'consumer';
  }
  
  // AUTHENTICITY CALCULATION
  private static calculateAuthenticity(reading: BiometricReading, deviceType: string): number {
    const signalQuality = reading.signalQuality || 0.8;
    const batteryLevel = reading.batteryLevel || 80;
    const consistencyCheck = this.checkPhysiologicalConsistency(reading);
    
    // Battery level affects authenticity (low battery = questionable readings)
    const batteryFactor = Math.max(0.7, batteryLevel / 100);
    
    return (signalQuality * 0.6 + consistencyCheck * 0.3 + batteryFactor * 0.1);
  }
  
  // DATA QUALITY ASSESSMENT
  private static calculateDataQuality(reading: BiometricReading): number {
    const signalQuality = reading.signalQuality || 0.8;
    const batteryLevel = reading.batteryLevel || 80;
    const dataCompleteness = this.assessDataCompleteness(reading);
    
    return (signalQuality * 0.5 + (batteryLevel / 100) * 0.2 + dataCompleteness * 0.3);
  }
  
  // PHYSIOLOGICAL CONSISTENCY CHECK (Anti-spoofing)
  private static checkPhysiologicalConsistency(reading: BiometricReading): number {
    const hr = reading.heartRate || 70;
    const hrv = reading.heartRateVariability || 0.5;
    
    // Heart rate and HRV should be physiologically consistent
    const expectedHRV = this.getExpectedHRV(hr);
    const consistency = 1 - Math.abs(hrv - expectedHRV) / expectedHRV;
    
    return Math.max(0.3, Math.min(1.0, consistency));
  }
  
  private static getExpectedHRV(heartRate: number): number {
    // Approximate physiological relationship between HR and HRV
    if (heartRate < 60) return 0.8; // Athletes
    if (heartRate < 70) return 0.6; // Healthy
    if (heartRate < 80) return 0.4; // Average
    return 0.2; // Stressed/unhealthy
  }
  
  private static assessDataCompleteness(reading: BiometricReading): number {
    const fields = [
      reading.heartRate,
      reading.heartRateVariability,
      reading.galvanicSkinResponse,
      reading.blinkRate,
      reading.reactionTime
    ];
    
    const presentFields = fields.filter(field => field !== undefined).length;
    return presentFields / fields.length;
  }
}

// Export for use in EmotionalChain consensus
export default EnterpriseEmotionalProcessor;