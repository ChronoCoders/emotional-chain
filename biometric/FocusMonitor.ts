import { BiometricDevice, BiometricReading, DeviceConfig } from './BiometricDevice';
interface EEGData {
  alpha: number;    // 8-12 Hz - relaxed awareness
  beta: number;     // 13-30 Hz - active thinking
  theta: number;    // 4-8 Hz - deep meditation
  gamma: number;    // 30-100 Hz - heightened awareness
  delta: number;    // 0.5-4 Hz - deep sleep
  focusScore: number;    // 0-100 calculated focus level
  meditationScore: number; // 0-100 meditation level
  attention: number;      // 0-100 attention level
}
interface CognitiveLoad {
  workingMemory: number;  // 0-100
  mentalEffort: number;   // 0-100
  concentration: number;  // 0-100
  overallLoad: number;    // 0-100
}
export class FocusMonitor extends BiometricDevice {
  private device: any = null;
  private eegChannels: number = 4; // Number of EEG electrodes
  private samplingRate: number = 256; // Hz
  private bufferSize: number = 1024; // Samples
  private eegBuffer: number[][] = [];
  private lastFocusScore: number = 0;
  private baselineAlpha: number = 0;
  private baselineBeta: number = 0;
  constructor(config: DeviceConfig) {
    super(config);
    if (!config.type.includes('focus')) {
      config.type = 'focus';
    }
    // Initialize EEG buffers for each channel
    for (let i = 0; i < this.eegChannels; i++) {
      this.eegBuffer[i] = [];
    }
  }
  /**
   * Establish connection to EEG/focus monitoring device
   */
  protected async establishConnection(): Promise<boolean> {
    try {
      await this.simulateEEGConnection();
      // Establish baseline brain activity
      await this.calibrateBaseline();
      return true;
    } catch (error) {
      console.error('Focus monitor connection failed:', error);
      return false;
    }
  }
  /**
   * Simulate EEG device connection
   */
  private async simulateEEGConnection(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.device = {
          id: this.config.id,
          name: this.config.name || 'EEG Focus Monitor',
          connected: true,
          type: 'EEG',
          channels: this.eegChannels,
          samplingRate: this.samplingRate,
          electrodes: ['Fp1', 'Fp2', 'F3', 'F4'], // Standard electrode positions
          batteryLevel: 85 + Math.random() * 15 // 85-100%
        };
        console.log(` Connected to ${this.device.name}`);
        console.log(`   🔋 Battery: ${this.device.batteryLevel.toFixed(0)}%`);
        resolve();
      }, 1200 + Math.random() * 1800); // 1.2-3 second connection
    });
  }
  /**
   * Calibrate baseline brain activity
   */
  private async calibrateBaseline(): Promise<void> {
    console.log(' Calibrating baseline brain activity...');
    let totalAlpha = 0;
    let totalBeta = 0;
    const samples = 30; // 30 seconds of baseline
    for (let i = 0; i < samples; i++) {
      const eegData = this.generateEEGData();
      totalAlpha += eegData.alpha;
      totalBeta += eegData.beta;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.baselineAlpha = totalAlpha / samples;
    this.baselineBeta = totalBeta / samples;
  }
  /**
   * Close EEG device connection
   */
  protected async closeConnection(): Promise<void> {
    if (this.device) {
      this.device = null;
      this.eegBuffer = [];
      for (let i = 0; i < this.eegChannels; i++) {
        this.eegBuffer[i] = [];
      }
    }
  }
  /**
   * Read focus and attention data from EEG
   */
  public async readData(): Promise<BiometricReading | null> {
    if (!this.device) {
      return null;
    }
    try {
      const eegData = this.generateEEGData();
      const cognitiveLoad = this.calculateCognitiveLoad(eegData);
      // Main focus score combines attention and concentration
      const focusScore = this.calculateFocusScore(eegData, cognitiveLoad);
      const reading: BiometricReading = {
        timestamp: Date.now(),
        deviceId: this.config.id,
        type: 'focus',
        value: focusScore,
        quality: this.calculateSignalQuality(eegData),
        rawData: {
          eeg: eegData,
          cognitiveLoad: cognitiveLoad,
          focusScore: focusScore,
          electrodeQuality: this.getElectrodeQuality(),
          batteryLevel: this.device.batteryLevel,
          baseline: {
            alpha: this.baselineAlpha,
            beta: this.baselineBeta
          }
        }
      };
      this.lastFocusScore = focusScore;
      return reading;
    } catch (error) {
      console.error('Error reading focus data:', error);
      return null;
    }
  }
  /**
   * Generate realistic EEG brainwave data
   */
  private generateEEGData(): EEGData {
    const time = Date.now() / 1000;
    // Generate realistic brainwave patterns
    const alpha = Math.max(0, 8 + Math.sin(time / 10) * 3 + Math.random() * 2); // 8-13 Hz
    const beta = Math.max(0, 15 + Math.sin(time / 7) * 5 + Math.random() * 3); // 13-30 Hz
    const theta = Math.max(0, 6 + Math.sin(time / 15) * 2 + Math.random() * 1); // 4-8 Hz
    const gamma = Math.max(0, 35 + Math.sin(time / 5) * 10 + Math.random() * 5); // 30-100 Hz
    const delta = Math.max(0, 2 + Math.sin(time / 20) * 1 + Math.random() * 0.5); // 0.5-4 Hz
    // Calculate derived metrics
    const focusScore = this.calculateRawFocusScore(alpha, beta, theta);
    const meditationScore = this.calculateMeditationScore(alpha, theta, delta);
    const attention = this.calculateAttentionScore(beta, gamma, alpha);
    return {
      alpha,
      beta,
      theta,
      gamma,
      delta,
      focusScore,
      meditationScore,
      attention
    };
  }
  /**
   * Calculate raw focus score from brainwaves
   */
  private calculateRawFocusScore(alpha: number, beta: number, theta: number): number {
    // High beta with moderate alpha indicates focus
    const betaFactor = Math.min(100, (beta / 25) * 60); // Beta contribution (0-60%)
    const alphaFactor = Math.min(40, (alpha / 15) * 40); // Alpha contribution (0-40%)
    const thetaPenalty = Math.max(0, (theta - 4) * 5); // Theta distraction penalty
    const rawScore = betaFactor + alphaFactor - thetaPenalty;
    return Math.max(0, Math.min(100, rawScore));
  }
  /**
   * Calculate meditation score from brainwaves
   */
  private calculateMeditationScore(alpha: number, theta: number, delta: number): number {
    // High alpha and theta with low delta indicates meditation
    const alphaFactor = Math.min(50, (alpha / 12) * 50);
    const thetaFactor = Math.min(30, (theta / 8) * 30);
    const deltaFactor = Math.min(20, (delta / 3) * 20);
    return Math.max(0, Math.min(100, alphaFactor + thetaFactor + deltaFactor));
  }
  /**
   * Calculate attention score from brainwaves
   */
  private calculateAttentionScore(beta: number, gamma: number, alpha: number): number {
    // High beta and gamma with controlled alpha indicates attention
    const betaAttention = Math.min(40, (beta / 20) * 40);
    const gammaAttention = Math.min(30, (gamma / 50) * 30);
    const alphaBalance = Math.min(30, (10 - Math.abs(alpha - 10)) * 3);
    return Math.max(0, Math.min(100, betaAttention + gammaAttention + alphaBalance));
  }
  /**
   * Calculate cognitive load metrics
   */
  private calculateCognitiveLoad(eegData: EEGData): CognitiveLoad {
    // Working memory load (high beta, controlled alpha/theta ratio)
    const workingMemory = Math.min(100, (eegData.beta / (eegData.alpha + eegData.theta)) * 25);
    // Mental effort (high gamma with sustained beta)
    const mentalEffort = Math.min(100, (eegData.gamma * eegData.beta) / 500);
    // Concentration (sustained beta with low theta)
    const concentration = Math.min(100, eegData.beta * (1 - eegData.theta / 10) * 5);
    // Overall cognitive load
    const overallLoad = (workingMemory * 0.4 + mentalEffort * 0.3 + concentration * 0.3);
    return {
      workingMemory: Math.round(workingMemory),
      mentalEffort: Math.round(mentalEffort),
      concentration: Math.round(concentration),
      overallLoad: Math.round(overallLoad)
    };
  }
  /**
   * Calculate comprehensive focus score
   */
  private calculateFocusScore(eegData: EEGData, cognitiveLoad: CognitiveLoad): number {
    // Combine raw focus score with cognitive metrics
    const rawFocus = eegData.focusScore * 0.5;
    const attentionFactor = eegData.attention * 0.3;
    const concentrationFactor = cognitiveLoad.concentration * 0.2;
    // Apply baseline correction if available
    let baselineBonus = 0;
    if (this.baselineAlpha > 0 && this.baselineBeta > 0) {
      const alphaImprovement = Math.max(0, (eegData.alpha - this.baselineAlpha) / this.baselineAlpha);
      const betaImprovement = Math.max(0, (eegData.beta - this.baselineBeta) / this.baselineBeta);
      baselineBonus = (alphaImprovement + betaImprovement) * 5; // Up to 10% bonus
    }
    const totalScore = rawFocus + attentionFactor + concentrationFactor + baselineBonus;
    return Math.max(0, Math.min(100, Math.round(totalScore)));
  }
  /**
   * Calculate signal quality from electrode contact
   */
  private calculateSignalQuality(eegData: EEGData): number {
    let quality = 1.0;
    // Reduce quality for unrealistic brainwave values
    if (eegData.alpha < 2 || eegData.alpha > 20) quality *= 0.7;
    if (eegData.beta < 5 || eegData.beta > 40) quality *= 0.7;
    if (eegData.theta < 1 || eegData.theta > 12) quality *= 0.8;
    // Simulate electrode contact quality (random variation)
    const electrodeQuality = 0.85 + Math.random() * 0.15; // 85-100%
    quality *= electrodeQuality;
    // Reduce quality based on movement artifacts
    const movementNoise = Math.random() * 0.1; // 0-10% movement noise
    quality *= (1 - movementNoise);
    return Math.max(0, Math.min(1, quality));
  }
  /**
   * Get electrode contact quality for each channel
   */
  private getElectrodeQuality(): { [electrode: string]: number } {
    const quality: { [electrode: string]: number } = {};
    for (const electrode of this.device.electrodes) {
      // Simulate individual electrode quality
      quality[electrode] = 0.8 + Math.random() * 0.2; // 80-100%
    }
    return quality;
  }
  /**
   * Get reading interval for EEG data
   */
  protected getReadingInterval(): number {
    return 500; // 500ms - 2Hz update rate
  }
  /**
   * Validate focus values
   */
  protected isValidBiometricValue(reading: BiometricReading): boolean {
    const focusScore = reading.value;
    // Valid focus range: 0-100
    if (focusScore < 0 || focusScore > 100) {
      return false;
    }
    // Check for reasonable change from previous reading
    if (this.lastFocusScore > 0) {
      const change = Math.abs(focusScore - this.lastFocusScore);
      if (change > 30) { // More than 30% change is suspicious
        return false;
      }
    }
    return true;
  }
  /**
   * Discover EEG/focus monitoring devices
   */
  public static async discoverDevices(): Promise<DeviceConfig[]> {
    const devices: DeviceConfig[] = [];
    try {
      // Simulate discovery of EEG devices
      const simulatedDevices = [
        {
          id: 'muse-2-001',
          name: 'Muse 2',
          type: 'focus',
          connectionType: 'bluetooth' as const,
          address: '00:11:22:33:44:77'
        },
        {
          id: 'openbci-001',
          name: 'OpenBCI Ganglion',
          type: 'focus',
          connectionType: 'bluetooth' as const,
          address: '00:AA:BB:CC:DD:EE'
        },
        {
          id: 'emotiv-epoc-001',
          name: 'Emotiv EPOC+',
          type: 'focus',
          connectionType: 'usb' as const
        }
      ];
      devices.push(...simulatedDevices);
      console.log(`🔍 Discovered ${devices.length} EEG/focus devices`);
    } catch (error) {
      console.error('Focus monitor discovery failed:', error);
    }
    return devices;
  }
  /**
   * Get comprehensive focus metrics
   */
  public getFocusMetrics(): any {
    return {
      currentFocusScore: this.lastFocusScore,
      batteryLevel: this.device?.batteryLevel || 0,
      electrodeCount: this.eegChannels,
      samplingRate: this.samplingRate,
      signalQuality: this.status.signalQuality,
      baseline: {
        alpha: this.baselineAlpha,
        beta: this.baselineBeta
      }
    };
  }
  /**
   * Recalibrate baseline brain activity
   */
  public async recalibrateBaseline(): Promise<boolean> {
    console.log(' Recalibrating EEG baseline...');
    try {
      await this.calibrateBaseline();
      return true;
    } catch (error) {
      console.error('EEG baseline calibration failed:', error);
      return false;
    }
  }
  /**
   * Set focus level thresholds
   */
  public setFocusThresholds(low: number = 30, medium: number = 60, high: number = 80): void {
    const thresholds = {
      low: Math.max(0, Math.min(100, low)),
      medium: Math.max(0, Math.min(100, medium)),
      high: Math.max(0, Math.min(100, high)),
      peak: 95 // Fixed peak threshold
    };
    this.config = { ...this.config, focusThresholds: thresholds };
    console.log(` Focus thresholds configured:`, thresholds);
  }
  /**
   * Get current focus state classification
   */
  public getFocusState(): 'distracted' | 'low' | 'medium' | 'high' | 'peak' {
    const thresholds = this.config.focusThresholds || { low: 30, medium: 60, high: 80 };
    if (this.lastFocusScore >= 95) return 'peak';
    if (this.lastFocusScore >= thresholds.high) return 'high';
    if (this.lastFocusScore >= thresholds.medium) return 'medium';
    if (this.lastFocusScore >= thresholds.low) return 'low';
    return 'distracted';
  }
  /**
   * Start neurofeedback training session
   */
  public async startNeurofeedbackSession(durationMinutes: number = 10): Promise<boolean> {
    console.log(`🧘 Starting ${durationMinutes}-minute neurofeedback session...`);
    // In production, this would guide the user through focus training
    const sessionData = {
      startTime: Date.now(),
      duration: durationMinutes * 60 * 1000,
      targetFocusScore: 70,
      sessions: []
    };
    // Store session configuration
    this.config = { ...this.config, neurofeedbackSession: sessionData };
    return true;
  }
  /**
   * Get brainwave frequency analysis
   */
  public getBrainwaveAnalysis(): any {
    if (!this.device) {
      return null;
    }
    // Return last EEG analysis
    const eegData = this.generateEEGData();
    return {
      frequencies: {
        delta: { value: eegData.delta, range: '0.5-4 Hz', state: 'Deep Sleep' },
        theta: { value: eegData.theta, range: '4-8 Hz', state: 'Deep Meditation' },
        alpha: { value: eegData.alpha, range: '8-12 Hz', state: 'Relaxed Awareness' },
        beta: { value: eegData.beta, range: '13-30 Hz', state: 'Active Thinking' },
        gamma: { value: eegData.gamma, range: '30-100 Hz', state: 'Heightened Awareness' }
      },
      dominantFrequency: this.getDominantFrequency(eegData),
      brainState: this.classifyBrainState(eegData),
      focusReadiness: eegData.focusScore > 60 ? 'ready' : 'not ready'
    };
  }
  /**
   * Determine dominant brainwave frequency
   */
  private getDominantFrequency(eegData: EEGData): string {
    const frequencies = {
      delta: eegData.delta,
      theta: eegData.theta,
      alpha: eegData.alpha,
      beta: eegData.beta,
      gamma: eegData.gamma
    };
    return Object.keys(frequencies).reduce((a, b) => 
      frequencies[a as keyof typeof frequencies] > frequencies[b as keyof typeof frequencies] ? a : b
    );
  }
  /**
   * Classify overall brain state
   */
  private classifyBrainState(eegData: EEGData): string {
    if (eegData.delta > 8) return 'sleepy';
    if (eegData.theta > 10) return 'meditative';
    if (eegData.alpha > 12) return 'relaxed';
    if (eegData.beta > 20) return 'active';
    if (eegData.gamma > 40) return 'highly focused';
    return 'neutral';
  }
}