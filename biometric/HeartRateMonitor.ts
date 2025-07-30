import { BiometricDevice, BiometricReading, DeviceConfig } from './BiometricDevice';

// Bluetooth LE Heart Rate Service UUID
const HR_SERVICE_UUID = '180d';
const HR_MEASUREMENT_UUID = '2a37';
const BATTERY_SERVICE_UUID = '180f';
const BATTERY_LEVEL_UUID = '2a19';

interface HeartRateData {
  heartRate: number;
  rrIntervals?: number[]; // R-R intervals for HRV analysis
  sensorContact: boolean;
  energyExpended?: number;
}

export class HeartRateMonitor extends BiometricDevice {
  private device: any = null; // Bluetooth device reference
  private heartRateService: any = null;
  private measurementCharacteristic: any = null;
  private batteryService: any = null;
  private lastHeartRate: number = 0;
  private rrBuffer: number[] = []; // For HRV calculation
  private readonly maxRRBuffer = 60; // Keep last 60 R-R intervals

  constructor(config: DeviceConfig) {
    super(config);
    
    // Ensure this is configured as a heart rate device
    if (!config.type.includes('heartRate')) {
      config.type = 'heartRate';
    }
  }

  /**
   * Establish Bluetooth LE connection to heart rate monitor
   */
  protected async establishConnection(): Promise<boolean> {
    try {
      // For production: This would use real Bluetooth LE discovery
      // const noble = require('@abandonware/noble');
      
      // Simulate device discovery and connection
      await this.simulateDeviceConnection();
      
      return true;
      
    } catch (error) {
      console.error('Heart rate monitor connection failed:', error);
      return false;
    }
  }

  /**
   * Simulate real device connection for testing
   * In production, this would be replaced with actual Bluetooth LE code
   */
  private async simulateDeviceConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate successful connection to heart rate monitor
        this.device = {
          id: this.config.id,
          name: this.config.name || 'Heart Rate Monitor',
          connected: true,
          address: this.config.address || 'AA:BB:CC:DD:EE:FF'
        };
        
        console.log(`📱 Simulated connection to ${this.device.name}`);
        resolve();
      }, 1000 + Math.random() * 2000); // 1-3 second connection time
    });
  }

  /**
   * Close Bluetooth LE connection
   */
  protected async closeConnection(): Promise<void> {
    if (this.device) {
      // In production: await this.device.disconnect();
      this.device = null;
      this.heartRateService = null;
      this.measurementCharacteristic = null;
      this.batteryService = null;
    }
  }

  /**
   * Read heart rate data from the device
   */
  public async readData(): Promise<BiometricReading | null> {
    if (!this.device) {
      return null;
    }

    try {
      // Simulate real heart rate reading with realistic patterns
      const heartRateData = this.generateRealisticHeartRate();
      
      // Update RR intervals for HRV analysis
      if (heartRateData.rrIntervals) {
        this.updateRRBuffer(heartRateData.rrIntervals);
      }

      // Calculate signal quality based on sensor contact and stability
      const quality = this.calculateSignalQuality(heartRateData);
      
      const reading: BiometricReading = {
        timestamp: Date.now(),
        deviceId: this.config.id,
        type: 'heartRate',
        value: heartRateData.heartRate,
        quality: quality,
        rawData: {
          heartRate: heartRateData.heartRate,
          rrIntervals: heartRateData.rrIntervals,
          sensorContact: heartRateData.sensorContact,
          energyExpended: heartRateData.energyExpended,
          hrv: this.calculateHRV(),
          batteryLevel: this.status.batteryLevel
        }
      };

      this.lastHeartRate = heartRateData.heartRate;
      
      return reading;
      
    } catch (error) {
      console.error('Error reading heart rate data:', error);
      return null;
    }
  }

  /**
   * Generate realistic heart rate data for testing
   * In production, this would parse actual Bluetooth LE data
   */
  private generateRealisticHeartRate(): HeartRateData {
    const baseRate = 70 + Math.sin(Date.now() / 30000) * 15; // Slow variation
    const noise = (Math.random() - 0.5) * 6; // Small random variation
    const heartRate = Math.max(50, Math.min(180, Math.round(baseRate + noise)));
    
    // Generate realistic R-R intervals (time between heartbeats in ms)
    const rrInterval = Math.round(60000 / heartRate); // Base interval
    const rrVariation = (Math.random() - 0.5) * 50; // HRV
    const adjustedRR = Math.max(300, Math.min(1200, rrInterval + rrVariation));
    
    // Simulate sensor contact detection
    const sensorContact = Math.random() > 0.05; // 95% good contact
    
    return {
      heartRate: sensorContact ? heartRate : 0,
      rrIntervals: sensorContact ? [adjustedRR] : [],
      sensorContact,
      energyExpended: Math.floor(heartRate * 0.5) // Rough estimate
    };
  }

  /**
   * Update R-R interval buffer for HRV analysis
   */
  private updateRRBuffer(newIntervals: number[]): void {
    this.rrBuffer.push(...newIntervals);
    
    // Keep only recent intervals
    if (this.rrBuffer.length > this.maxRRBuffer) {
      this.rrBuffer = this.rrBuffer.slice(-this.maxRRBuffer);
    }
  }

  /**
   * Calculate Heart Rate Variability (HRV) metrics
   */
  private calculateHRV(): any {
    if (this.rrBuffer.length < 10) {
      return { rmssd: 0, sdnn: 0, pnn50: 0 };
    }

    // RMSSD: Root Mean Square of Successive Differences
    const differences = [];
    for (let i = 1; i < this.rrBuffer.length; i++) {
      differences.push(Math.pow(this.rrBuffer[i] - this.rrBuffer[i-1], 2));
    }
    const rmssd = Math.sqrt(differences.reduce((a, b) => a + b, 0) / differences.length);

    // SDNN: Standard Deviation of NN intervals
    const mean = this.rrBuffer.reduce((a, b) => a + b, 0) / this.rrBuffer.length;
    const variance = this.rrBuffer.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.rrBuffer.length;
    const sdnn = Math.sqrt(variance);

    // pNN50: Percentage of successive RR intervals that differ by more than 50ms
    let nn50Count = 0;
    for (let i = 1; i < this.rrBuffer.length; i++) {
      if (Math.abs(this.rrBuffer[i] - this.rrBuffer[i-1]) > 50) {
        nn50Count++;
      }
    }
    const pnn50 = (nn50Count / (this.rrBuffer.length - 1)) * 100;

    return { rmssd, sdnn, pnn50 };
  }

  /**
   * Calculate signal quality score
   */
  private calculateSignalQuality(data: HeartRateData): number {
    let quality = 1.0;
    
    // Reduce quality if no sensor contact
    if (!data.sensorContact) {
      quality *= 0.1;
    }
    
    // Reduce quality for unrealistic heart rates
    if (data.heartRate < 40 || data.heartRate > 200) {
      quality *= 0.3;
    }
    
    // Reduce quality for excessive variation from last reading
    if (this.lastHeartRate > 0) {
      const variation = Math.abs(data.heartRate - this.lastHeartRate);
      if (variation > 30) { // More than 30 BPM change
        quality *= 0.5;
      }
    }
    
    // Add some random quality variation to simulate real conditions
    quality *= (0.85 + Math.random() * 0.15); // 85-100% of calculated quality
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Get reading interval (heart rate monitors typically update every 1-2 seconds)
   */
  protected getReadingInterval(): number {
    return 1000; // 1 second
  }

  /**
   * Validate heart rate values
   */
  protected isValidBiometricValue(reading: BiometricReading): boolean {
    const heartRate = reading.value;
    
    // Valid heart rate range: 30-220 BPM
    if (heartRate < 30 || heartRate > 220) {
      return false;
    }
    
    // Check for reasonable change from previous reading
    if (this.lastHeartRate > 0) {
      const change = Math.abs(heartRate - this.lastHeartRate);
      if (change > 50) { // More than 50 BPM change is suspicious
        return false;
      }
    }
    
    return true;
  }

  /**
   * Discover Bluetooth LE heart rate monitors
   */
  public static async discoverDevices(): Promise<DeviceConfig[]> {
    const devices: DeviceConfig[] = [];
    
    try {
      // In production, this would scan for Bluetooth LE devices with HR service
      // const noble = require('@abandonware/noble');
      
      // Simulate discovery of common heart rate monitors
      const simulatedDevices = [
        {
          id: 'polar-h10-001',
          name: 'Polar H10',
          type: 'heartRate',
          connectionType: 'bluetooth' as const,
          address: '00:11:22:33:44:55'
        },
        {
          id: 'garmin-hrm-001',
          name: 'Garmin HRM-Pro',
          type: 'heartRate',
          connectionType: 'bluetooth' as const,
          address: '00:AA:BB:CC:DD:EE'
        }
      ];
      
      devices.push(...simulatedDevices);
      
      console.log(`🔍 Discovered ${devices.length} heart rate monitors`);
      
    } catch (error) {
      console.error('Heart rate monitor discovery failed:', error);
    }
    
    return devices;
  }

  /**
   * Get heart rate specific metrics
   */
  public getHeartRateMetrics(): any {
    const hrv = this.calculateHRV();
    
    return {
      currentHeartRate: this.lastHeartRate,
      averageHeartRate: this.rrBuffer.length > 0 ? 
        Math.round(60000 / (this.rrBuffer.reduce((a, b) => a + b, 0) / this.rrBuffer.length)) : 0,
      heartRateVariability: hrv,
      rrIntervalsCount: this.rrBuffer.length,
      signalQuality: this.status.signalQuality,
      sensorContact: this.lastHeartRate > 0
    };
  }

  /**
   * Calibrate heart rate monitor
   */
  public async calibrate(): Promise<boolean> {
    console.log(`🎯 Calibrating ${this.config.name}...`);
    
    // Clear RR buffer for fresh start
    this.rrBuffer = [];
    this.lastHeartRate = 0;
    
    // In production, this would send calibration commands to the device
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ ${this.config.name} calibration complete`);
    return true;
  }

  /**
   * Set heart rate zones for training/validation
   */
  public setHeartRateZones(restingHR: number, maxHR: number): void {
    const zones = {
      resting: restingHR,
      maximum: maxHR,
      zone1: Math.round(restingHR + (maxHR - restingHR) * 0.5), // 50-60%
      zone2: Math.round(restingHR + (maxHR - restingHR) * 0.6), // 60-70%
      zone3: Math.round(restingHR + (maxHR - restingHR) * 0.7), // 70-80%
      zone4: Math.round(restingHR + (maxHR - restingHR) * 0.8), // 80-90%
      zone5: Math.round(restingHR + (maxHR - restingHR) * 0.9)  // 90-100%
    };
    
    // Store zones in device configuration
    this.config = { ...this.config, heartRateZones: zones };
    
    console.log(`💖 Heart rate zones set for ${this.config.name}:`, zones);
  }
}