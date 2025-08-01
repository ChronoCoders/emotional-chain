import { BiometricDevice, BiometricReading, DeviceConfig } from './BiometricDevice';
interface StressData {
  stressLevel: number; // 0-100%
  hrvScore: number; // Heart Rate Variability stress indicator
  gsrValue?: number; // Galvanic Skin Response (if available)
  respiratoryRate?: number; // Breaths per minute
  skinTemperature?: number; // Celsius
  confidence: number; // 0-1, confidence in stress measurement
}
interface HRVAnalysis {
  rmssd: number; // Root Mean Square of Successive Differences
  sdnn: number; // Standard Deviation of NN intervals
  pnn50: number; // Percentage of successive RR intervals > 50ms
  stressIndex: number; // Calculated stress index (0-100)
}
export class StressDetector extends BiometricDevice {
  private device: any = null;
  private rrIntervals: number[] = [];
  private gsrSensor: any = null;
  private temperatureSensor: any = null;
  private lastStressLevel: number = 0;
  private baselineHRV: HRVAnalysis | null = null;
  private readonly maxRRBuffer = 120; // 2 minutes of data
  constructor(config: DeviceConfig) {
    super(config);
    if (!config.type.includes('stress')) {
      config.type = 'stress';
    }
  }
  /**
   * Establish connection to stress detection devices
   */
  protected async establishConnection(): Promise<boolean> {
    try {
      // In production: Connect to GSR sensor, temperature sensor, etc.
      await this.simulateDeviceConnection();
      // Initialize baseline stress measurement
      await this.establishBaseline();
      return true;
    } catch (error) {
      console.error('Stress detector connection failed:', error);
      return false;
    }
  }
  /**
   * Simulate connection to stress detection hardware
   */
  private async simulateDeviceConnection(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.device = {
          id: this.config.id,
          name: this.config.name || 'Multi-Modal Stress Detector',
          connected: true,
          sensors: {
            gsr: Math.random() > 0.3, // 70% chance GSR available
            temperature: Math.random() > 0.2, // 80% chance temperature available
            hrv: true // HRV always available from heart rate
          }
        };
        console.log(`🧘 Connected to ${this.device.name}`);
        resolve();
      }, 800 + Math.random() * 1200);
    });
  }
  /**
   * Establish stress baseline for personalized measurements
   */
  private async establishBaseline(): Promise<void> {
    console.log('📏 Establishing stress baseline...');
    // Collect baseline data for 30 seconds
    const baselineData: number[] = [];
    for (let i = 0; i < 30; i++) {
      const mockRR = 800 + Math.random() * 200; // Relaxed state RR intervals
      baselineData.push(mockRR);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.baselineHRV = this.calculateHRVFromIntervals(baselineData);
  }
  /**
   * Close connection to stress detection devices
   */
  protected async closeConnection(): Promise<void> {
    if (this.device) {
      this.device = null;
      this.gsrSensor = null;
      this.temperatureSensor = null;
    }
  }
  /**
   * Read comprehensive stress data
   */
  public async readData(): Promise<BiometricReading | null> {
    if (!this.device) {
      return null;
    }
    try {
      const stressData = await this.measureStress();
      const reading: BiometricReading = {
        timestamp: Date.now(),
        deviceId: this.config.id,
        type: 'stress',
        value: stressData.stressLevel,
        quality: stressData.confidence,
        rawData: {
          stressLevel: stressData.stressLevel,
          hrvScore: stressData.hrvScore,
          gsrValue: stressData.gsrValue,
          respiratoryRate: stressData.respiratoryRate,
          skinTemperature: stressData.skinTemperature,
          confidence: stressData.confidence,
          sensorStatus: this.device.sensors,
          baseline: this.baselineHRV
        }
      };
      this.lastStressLevel = stressData.stressLevel;
      return reading;
    } catch (error) {
      console.error('Error reading stress data:', error);
      return null;
    }
  }
  /**
   * Comprehensive stress measurement using multiple modalities
   */
  private async measureStress(): Promise<StressData> {
    // Generate realistic HRV data for stress analysis
    const currentHRV = this.generateCurrentHRV();
    // Calculate HRV-based stress score
    const hrvStressScore = this.calculateHRVStress(currentHRV);
    // Galvanic Skin Response (if available)
    const gsrStress = this.device.sensors.gsr ? this.measureGSRStress() : null;
    // Skin temperature (if available)
    const tempStress = this.device.sensors.temperature ? this.measureTemperatureStress() : null;
    // Respiratory rate estimation
    const respStress = this.estimateRespiratoryStress();
    // Combine multiple stress indicators
    const combinedStress = this.combineStressIndicators({
      hrv: hrvStressScore,
      gsr: gsrStress,
      temperature: tempStress,
      respiratory: respStress
    });
    return {
      stressLevel: combinedStress.stressLevel,
      hrvScore: hrvStressScore,
      gsrValue: gsrStress,
      respiratoryRate: respStress,
      skinTemperature: tempStress,
      confidence: combinedStress.confidence
    };
  }
  /**
   * Generate realistic HRV data based on current stress state
   */
  private generateCurrentHRV(): HRVAnalysis {
    // Simulate realistic HRV patterns
    const baseRR = 850 + Math.sin(Date.now() / 60000) * 100; // Slow breathing cycle
    const stressInfluence = Math.random() * 0.3; // 0-30% stress influence
    const intervals: number[] = [];
    for (let i = 0; i < 60; i++) {
      const variation = (Math.random() - 0.5) * (100 - stressInfluence * 80); // Less variation = more stress
      const interval = Math.max(400, Math.min(1200, baseRR + variation));
      intervals.push(interval);
    }
    return this.calculateHRVFromIntervals(intervals);
  }
  /**
   * Calculate HRV metrics from R-R intervals
   */
  private calculateHRVFromIntervals(intervals: number[]): HRVAnalysis {
    if (intervals.length < 10) {
      return { rmssd: 0, sdnn: 0, pnn50: 0, stressIndex: 50 };
    }
    // RMSSD calculation
    const differences = [];
    for (let i = 1; i < intervals.length; i++) {
      differences.push(Math.pow(intervals[i] - intervals[i-1], 2));
    }
    const rmssd = Math.sqrt(differences.reduce((a, b) => a + b, 0) / differences.length);
    // SDNN calculation
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const sdnn = Math.sqrt(variance);
    // pNN50 calculation
    let nn50Count = 0;
    for (let i = 1; i < intervals.length; i++) {
      if (Math.abs(intervals[i] - intervals[i-1]) > 50) {
        nn50Count++;
      }
    }
    const pnn50 = (nn50Count / (intervals.length - 1)) * 100;
    // Calculate stress index (lower HRV = higher stress)
    const stressIndex = Math.max(0, Math.min(100, 100 - (rmssd / 100 * 100)));
    return { rmssd, sdnn, pnn50, stressIndex };
  }
  /**
   * Calculate stress level from HRV analysis
   */
  private calculateHRVStress(currentHRV: HRVAnalysis): number {
    if (!this.baselineHRV) {
      return currentHRV.stressIndex;
    }
    // Compare to personal baseline
    const rmssdRatio = this.baselineHRV.rmssd > 0 ? currentHRV.rmssd / this.baselineHRV.rmssd : 1;
    const sdnnRatio = this.baselineHRV.sdnn > 0 ? currentHRV.sdnn / this.baselineHRV.sdnn : 1;
    // Lower ratios indicate higher stress
    const stressFromRMSSD = Math.max(0, (1 - rmssdRatio) * 100);
    const stressFromSDNN = Math.max(0, (1 - sdnnRatio) * 100);
    // Weighted combination
    const hrvStress = (stressFromRMSSD * 0.6 + stressFromSDNN * 0.4);
    return Math.min(100, Math.max(0, hrvStress));
  }
  /**
   * Measure stress from Galvanic Skin Response
   */
  private measureGSRStress(): number {
    // Simulate GSR reading (micro-siemens)
    const baseGSR = 2.0 + Math.random() * 3.0; // 2-5 μS typical range
    const stressMultiplier = 1 + Math.random() * 0.5; // Stress increases GSR
    const gsrValue = baseGSR * stressMultiplier;
    // Convert GSR to stress level (higher GSR = higher stress)
    const stressLevel = Math.min(100, Math.max(0, (gsrValue - 2) / 4 * 100));
    return Math.round(stressLevel);
  }
  /**
   * Measure stress from skin temperature
   */
  private measureTemperatureStress(): number {
    // Normal skin temperature: 32-36°C
    const baseTemp = 34 + Math.random() * 2; // 34-36°C
    const stressEffect = (Math.random() - 0.5) * 1.5; // Stress can raise or lower temp
    const skinTemp = baseTemp + stressEffect;
    // Deviation from normal range indicates stress
    const normalRange = [33, 35];
    let tempStress = 0;
    if (skinTemp < normalRange[0]) {
      tempStress = (normalRange[0] - skinTemp) / 2 * 100; // Cold stress
    } else if (skinTemp > normalRange[1]) {
      tempStress = (skinTemp - normalRange[1]) / 2 * 100; // Heat stress
    }
    return Math.min(100, Math.max(0, Math.round(tempStress)));
  }
  /**
   * Estimate respiratory stress from HRV patterns
   */
  private estimateRespiratoryStress(): number {
    // Normal respiratory rate: 12-20 breaths per minute
    const baseRate = 16 + Math.random() * 4; // 16-20 BPM
    const stressInfluence = Math.random() * 0.3; // Stress increases breathing rate
    const respiratoryRate = baseRate * (1 + stressInfluence * 0.5);
    // Calculate stress from deviation from normal
    let respStress = 0;
    if (respiratoryRate > 20) {
      respStress = (respiratoryRate - 20) / 10 * 100; // Fast breathing = stress
    } else if (respiratoryRate < 12) {
      respStress = (12 - respiratoryRate) / 4 * 100; // Very slow can also indicate stress
    }
    return Math.min(100, Math.max(0, Math.round(respStress)));
  }
  /**
   * Combine multiple stress indicators into final score
   */
  private combineStressIndicators(indicators: {
    hrv: number;
    gsr: number | null;
    temperature: number | null;
    respiratory: number | null;
  }): { stressLevel: number; confidence: number } {
    const weights = {
      hrv: 0.5,      // HRV is most reliable
      gsr: 0.3,      // GSR is good secondary indicator
      temperature: 0.1, // Temperature is less reliable
      respiratory: 0.1  // Respiratory estimation is least reliable
    };
    let totalWeight = weights.hrv; // HRV always available
    let weightedStress = indicators.hrv * weights.hrv;
    if (indicators.gsr !== null) {
      weightedStress += indicators.gsr * weights.gsr;
      totalWeight += weights.gsr;
    }
    if (indicators.temperature !== null) {
      weightedStress += indicators.temperature * weights.temperature;
      totalWeight += weights.temperature;
    }
    if (indicators.respiratory !== null) {
      weightedStress += indicators.respiratory * weights.respiratory;
      totalWeight += weights.respiratory;
    }
    const finalStress = weightedStress / totalWeight;
    // Confidence based on number of available sensors
    const sensorCount = 1 + (indicators.gsr !== null ? 1 : 0) + 
                           (indicators.temperature !== null ? 1 : 0) + 
                           (indicators.respiratory !== null ? 1 : 0);
    const confidence = Math.min(1, 0.4 + (sensorCount - 1) * 0.2); // 40-100% based on sensors
    return {
      stressLevel: Math.round(finalStress),
      confidence
    };
  }
  /**
   * Get reading interval for stress detection
   */
  protected getReadingInterval(): number {
    return 3000; // 3 seconds - slower than heart rate
  }
  /**
   * Validate stress level values
   */
  protected isValidBiometricValue(reading: BiometricReading): boolean {
    const stressLevel = reading.value;
    // Valid stress range: 0-100%
    if (stressLevel < 0 || stressLevel > 100) {
      return false;
    }
    // Check for reasonable change from previous reading
    if (this.lastStressLevel > 0) {
      const change = Math.abs(stressLevel - this.lastStressLevel);
      if (change > 40) { // More than 40% change is suspicious
        return false;
      }
    }
    return true;
  }
  /**
   * Discover stress detection devices
   */
  public static async discoverDevices(): Promise<DeviceConfig[]> {
    const devices: DeviceConfig[] = [];
    try {
      // Simulate discovery of stress detection hardware
      const simulatedDevices = [
        {
          id: 'empatica-e4-001',
          name: 'Empatica E4',
          type: 'stress',
          connectionType: 'bluetooth' as const,
          address: '00:11:22:33:44:66'
        },
        {
          id: 'bioharness-001',
          name: 'BioHarness 3.0',
          type: 'stress',
          connectionType: 'bluetooth' as const,
          address: '00:AA:BB:CC:DD:FF'
        }
      ];
      devices.push(...simulatedDevices);
      console.log(`🔍 Discovered ${devices.length} stress detection devices`);
    } catch (error) {
      console.error('Stress detector discovery failed:', error);
    }
    return devices;
  }
  /**
   * Get comprehensive stress metrics
   */
  public getStressMetrics(): any {
    return {
      currentStressLevel: this.lastStressLevel,
      baselineHRV: this.baselineHRV,
      availableSensors: this.device?.sensors || {},
      signalQuality: this.status.signalQuality,
      measurementConfidence: this.status.signalQuality * 100
    };
  }
  /**
   * Calibrate stress detector with personal baseline
   */
  public async recalibrateBaseline(): Promise<boolean> {
    console.log(' Recalibrating stress baseline...');
    try {
      await this.establishBaseline();
      return true;
    } catch (error) {
      console.error('Baseline calibration failed:', error);
      return false;
    }
  }
  /**
   * Set stress level thresholds for different states
   */
  public setStressThresholds(relaxed: number = 25, moderate: number = 50, high: number = 75): void {
    const thresholds = {
      relaxed: Math.max(0, Math.min(100, relaxed)),
      moderate: Math.max(0, Math.min(100, moderate)),
      high: Math.max(0, Math.min(100, high)),
      critical: 90 // Fixed critical threshold
    };
    this.config = { ...this.config, stressThresholds: thresholds };
    console.log(` Stress thresholds configured:`, thresholds);
  }
  /**
   * Get current stress state classification
   */
  public getStressState(): 'relaxed' | 'moderate' | 'high' | 'critical' {
    const thresholds = this.config.stressThresholds || { relaxed: 25, moderate: 50, high: 75 };
    if (this.lastStressLevel >= 90) return 'critical';
    if (this.lastStressLevel >= thresholds.high) return 'high';
    if (this.lastStressLevel >= thresholds.moderate) return 'moderate';
    return 'relaxed';
  }
}