import { EventEmitter } from 'eventemitter3';
import { AxiosInstance } from 'axios';
import { createHash, randomBytes } from 'crypto';

/**
 * BiometricSDK - Biometric device integration and emotional authentication
 * 
 * @example
 * ```typescript
 * const biometric = new BiometricAuth({
 *   devices: ['heartrate', 'stress', 'focus'],
 *   threshold: 75.0
 * });
 * 
 * await biometric.authenticate();
 * const score = await biometric.getCurrentEmotionalScore();
 * ```
 */

export interface BiometricDevice {
  id: string;
  name: string;
  type: 'heartrate' | 'stress' | 'focus' | 'temperature' | 'gsr' | 'eeg';
  status: 'connected' | 'disconnected' | 'error';
  lastReading: number;
  batteryLevel?: number;
  signalQuality: number;
  manufacturer?: string;
  model?: string;
}

export interface BiometricReading {
  deviceId: string;
  type: string;
  value: number;
  unit: string;
  timestamp: number;
  quality: number;
  processed: boolean;
}

export interface EmotionalState {
  overall: number;
  stress: number;
  focus: number;
  authenticity: number;
  timestamp: number;
  confidence: number;
  biometricProof?: string;
}

export interface BiometricProof {
  hash: string;
  timestamp: number;
  deviceIds: string[];
  emotionalScore: number;
  authenticity: number;
  liveness: boolean;
  antiSpoofing: boolean;
  signature: string;
}

export interface BiometricConfig {
  devices: string[];
  threshold: number;
  samplingRate?: number;
  qualityThreshold?: number;
  enableAntiSpoofing?: boolean;
  enableLivenessDetection?: boolean;
  mockMode?: boolean;
}

export class BiometricSDK extends EventEmitter {
  private httpClient: AxiosInstance;
  private config: BiometricConfig;
  private devices = new Map<string, BiometricDevice>();
  private readings: BiometricReading[] = [];
  private currentState?: EmotionalState;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  constructor(httpClient: AxiosInstance, config: BiometricConfig = { devices: [], threshold: 75 }) {
    super();
    this.httpClient = httpClient;
    this.config = {
      samplingRate: 1000, // 1Hz
      qualityThreshold: 0.8,
      enableAntiSpoofing: true,
      enableLivenessDetection: true,
      mockMode: false,
      ...config
    };
  }
  
  // Device management
  async scanForDevices(): Promise<BiometricDevice[]> {
    try {
      if (this.config.mockMode) {
        return this.generateMockDevices();
      }
      
      const response = await this.httpClient.get('/api/v1/biometric/devices/scan');
      const devices = response.data.devices;
      
      // Update local device registry
      for (const device of devices) {
        this.devices.set(device.id, device);
      }
      
      this.emit('devicesScanned', devices);
      return devices;
    } catch (error) {
      this.emit('scanError', error);
      throw error;
    }
  }
  
  async connectDevice(deviceId: string): Promise<BiometricDevice> {
    try {
      if (this.config.mockMode) {
        const mockDevice = this.generateMockDevice(deviceId);
        this.devices.set(deviceId, mockDevice);
        this.emit('deviceConnected', mockDevice);
        return mockDevice;
      }
      
      const response = await this.httpClient.post(`/api/v1/biometric/devices/${deviceId}/connect`);
      const device = response.data;
      
      this.devices.set(deviceId, device);
      this.emit('deviceConnected', device);
      return device;
    } catch (error) {
      this.emit('deviceError', { deviceId, error });
      throw error;
    }
  }
  
  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      if (!this.config.mockMode) {
        await this.httpClient.post(`/api/v1/biometric/devices/${deviceId}/disconnect`);
      }
      
      const device = this.devices.get(deviceId);
      if (device) {
        device.status = 'disconnected';
        this.emit('deviceDisconnected', device);
      }
    } catch (error) {
      this.emit('deviceError', { deviceId, error });
      throw error;
    }
  }
  
  async getDeviceStatus(): Promise<BiometricDevice[]> {
    const devices = Array.from(this.devices.values());
    
    if (!this.config.mockMode) {
      // Update device status from API
      try {
        const response = await this.httpClient.get('/api/v1/biometric/devices/status');
        const statusUpdates = response.data.devices;
        
        for (const update of statusUpdates) {
          const device = this.devices.get(update.id);
          if (device) {
            Object.assign(device, update);
          }
        }
      } catch (error) {
        // Continue with cached status
      }
    }
    
    return devices;
  }
  
  // Biometric data collection
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }
    
    const activeDevices = Array.from(this.devices.values()).filter(d => d.status === 'connected');
    if (activeDevices.length === 0) {
      throw new Error('No connected biometric devices available');
    }
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectReadings();
    }, this.config.samplingRate);
    
    this.emit('monitoringStarted', { devices: activeDevices.length });
  }
  
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.emit('monitoringStopped');
  }
  
  private async collectReadings(): Promise<void> {
    const activeDevices = Array.from(this.devices.values()).filter(d => d.status === 'connected');
    
    for (const device of activeDevices) {
      try {
        let reading: BiometricReading;
        
        if (this.config.mockMode) {
          reading = this.generateMockReading(device);
        } else {
          const response = await this.httpClient.get(`/api/v1/biometric/devices/${device.id}/read`);
          reading = response.data;
        }
        
        // Quality check
        if (reading.quality >= (this.config.qualityThreshold || 0.8)) {
          this.readings.push(reading);
          this.updateEmotionalState();
          this.emit('readingCollected', reading);
        } else {
          this.emit('lowQualityReading', { deviceId: device.id, quality: reading.quality });
        }
        
      } catch (error) {
        this.emit('readingError', { deviceId: device.id, error });
      }
    }
    
    // Keep only recent readings (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.readings = this.readings.filter(r => r.timestamp > fiveMinutesAgo);
  }
  
  // Emotional state calculation
  private updateEmotionalState(): void {
    const now = Date.now();
    const recentReadings = this.readings.filter(r => now - r.timestamp < 30000); // Last 30 seconds
    
    if (recentReadings.length === 0) {
      return;
    }
    
    // Calculate emotional metrics
    const heartRateReadings = recentReadings.filter(r => r.type === 'heartrate');
    const stressReadings = recentReadings.filter(r => r.type === 'stress');
    const focusReadings = recentReadings.filter(r => r.type === 'focus');
    
    const stress = this.calculateStressLevel(heartRateReadings, stressReadings);
    const focus = this.calculateFocusLevel(focusReadings);
    const authenticity = this.calculateAuthenticity(recentReadings);
    const overall = this.calculateOverallScore(stress, focus, authenticity);
    
    const newState: EmotionalState = {
      overall,
      stress,
      focus,
      authenticity,
      timestamp: now,
      confidence: this.calculateConfidence(recentReadings)
    };
    
    this.currentState = newState;
    this.emit('emotionalScoreUpdate', newState);
  }
  
  private calculateStressLevel(heartRateReadings: BiometricReading[], stressReadings: BiometricReading[]): number {
    if (stressReadings.length > 0) {
      const avgStress = stressReadings.reduce((sum, r) => sum + r.value, 0) / stressReadings.length;
      return Math.max(0, Math.min(100, 100 - avgStress)); // Invert so higher is better
    }
    
    if (heartRateReadings.length > 0) {
      const avgHR = heartRateReadings.reduce((sum, r) => sum + r.value, 0) / heartRateReadings.length;
      // Normal resting HR is 60-100, optimal for emotional state is 65-75
      const stressFromHR = Math.abs(avgHR - 70) / 30 * 100;
      return Math.max(0, Math.min(100, 100 - stressFromHR));
    }
    
    return 50; // Default neutral
  }
  
  private calculateFocusLevel(focusReadings: BiometricReading[]): number {
    if (focusReadings.length === 0) {
      return 50; // Default neutral
    }
    
    const avgFocus = focusReadings.reduce((sum, r) => sum + r.value, 0) / focusReadings.length;
    return Math.max(0, Math.min(100, avgFocus));
  }
  
  private calculateAuthenticity(readings: BiometricReading[]): number {
    // Check for anti-spoofing and liveness indicators
    const qualitySum = readings.reduce((sum, r) => sum + r.quality, 0);
    const avgQuality = qualitySum / readings.length;
    
    // Higher quality readings indicate more authentic biometric data
    return Math.max(0, Math.min(100, avgQuality * 100));
  }
  
  private calculateOverallScore(stress: number, focus: number, authenticity: number): number {
    // Weighted average: authenticity is most important, then stress and focus
    return (authenticity * 0.5) + (stress * 0.25) + (focus * 0.25);
  }
  
  private calculateConfidence(readings: BiometricReading[]): number {
    if (readings.length === 0) return 0;
    
    const deviceTypes = new Set(readings.map(r => r.type));
    const deviceCount = deviceTypes.size;
    const readingCount = readings.length;
    
    // More devices and readings = higher confidence
    const deviceScore = Math.min(1, deviceCount / 3); // Up to 3 device types
    const readingScore = Math.min(1, readingCount / 10); // Up to 10 readings
    
    return (deviceScore + readingScore) / 2;
  }
  
  // Authentication methods
  async authenticate(): Promise<EmotionalState> {
    if (!this.isMonitoring) {
      await this.startMonitoring();
    }
    
    // Wait for sufficient data
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second sampling
    
    if (!this.currentState) {
      throw new Error('Unable to obtain biometric readings for authentication');
    }
    
    if (this.currentState.overall < this.config.threshold) {
      throw new Error(`Emotional score ${this.currentState.overall.toFixed(1)}% below threshold ${this.config.threshold}%`);
    }
    
    if (this.config.enableAntiSpoofing && !await this.performAntiSpoofingCheck()) {
      throw new Error('Anti-spoofing check failed');
    }
    
    if (this.config.enableLivenessDetection && !await this.performLivenessCheck()) {
      throw new Error('Liveness detection failed');
    }
    
    this.emit('authenticationSuccess', this.currentState);
    return this.currentState;
  }
  
  async generateProof(emotionalScore: number): Promise<BiometricProof> {
    const deviceIds = Array.from(this.devices.keys());
    const timestamp = Date.now();
    
    // Create proof data
    const proofData = {
      deviceIds,
      emotionalScore,
      timestamp,
      authenticity: this.currentState?.authenticity || 0,
      liveness: this.config.enableLivenessDetection || false,
      antiSpoofing: this.config.enableAntiSpoofing || false
    };
    
    // Generate hash
    const hash = createHash('sha256').update(JSON.stringify(proofData)).digest('hex');
    
    // Generate signature (simplified - in production use proper cryptographic signing)
    const signature = createHash('sha256').update(hash + 'biometric_key').digest('hex');
    
    const proof: BiometricProof = {
      hash,
      timestamp,
      deviceIds,
      emotionalScore,
      authenticity: proofData.authenticity,
      liveness: proofData.liveness,
      antiSpoofing: proofData.antiSpoofing,
      signature
    };
    
    this.emit('proofGenerated', proof);
    return proof;
  }
  
  async verifyProof(proof: BiometricProof): Promise<boolean> {
    try {
      // Verify signature
      const proofData = {
        deviceIds: proof.deviceIds,
        emotionalScore: proof.emotionalScore,
        timestamp: proof.timestamp,
        authenticity: proof.authenticity,
        liveness: proof.liveness,
        antiSpoofing: proof.antiSpoofing
      };
      
      const expectedHash = createHash('sha256').update(JSON.stringify(proofData)).digest('hex');
      const expectedSignature = createHash('sha256').update(expectedHash + 'biometric_key').digest('hex');
      
      if (proof.hash !== expectedHash || proof.signature !== expectedSignature) {
        return false;
      }
      
      // Check timestamp freshness (within 5 minutes)
      const age = Date.now() - proof.timestamp;
      if (age > 5 * 60 * 1000) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Security checks
  private async performAntiSpoofingCheck(): Promise<boolean> {
    if (this.config.mockMode) {
      return true; // Mock mode always passes
    }
    
    try {
      const response = await this.httpClient.post('/api/v1/biometric/anti-spoofing', {
        readings: this.readings.slice(-10) // Last 10 readings
      });
      
      return response.data.authentic;
    } catch (error) {
      return false;
    }
  }
  
  private async performLivenessCheck(): Promise<boolean> {
    if (this.config.mockMode) {
      return true; // Mock mode always passes
    }
    
    try {
      const response = await this.httpClient.post('/api/v1/biometric/liveness', {
        readings: this.readings.slice(-10) // Last 10 readings
      });
      
      return response.data.alive;
    } catch (error) {
      return false;
    }
  }
  
  // Data access methods
  async getCurrentEmotionalScore(): Promise<number> {
    if (!this.currentState) {
      if (!this.isMonitoring) {
        await this.startMonitoring();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for data
      }
    }
    
    return this.currentState?.overall || 0;
  }
  
  getCurrentState(): EmotionalState | undefined {
    return this.currentState;
  }
  
  getRecentReadings(count = 50): BiometricReading[] {
    return this.readings.slice(-count);
  }
  
  getConnectedDevices(): BiometricDevice[] {
    return Array.from(this.devices.values()).filter(d => d.status === 'connected');
  }
  
  // Analytics and insights
  async getEmotionalTrends(timeframe: '1h' | '6h' | '24h' | '7d'): Promise<any[]> {
    const response = await this.httpClient.get('/api/v1/biometric/trends', {
      params: { timeframe }
    });
    
    return response.data.trends;
  }
  
  async getPersonalInsights(): Promise<any> {
    const response = await this.httpClient.get('/api/v1/biometric/insights');
    return response.data;
  }
  
  // Mock data generation for testing
  async generateMockData(): Promise<{
    devices: BiometricDevice[];
    readings: BiometricReading[];
    state: EmotionalState;
  }> {
    const devices = this.generateMockDevices();
    const readings = devices.map(device => this.generateMockReading(device));
    const state = this.generateMockEmotionalState();
    
    return { devices, readings, state };
  }
  
  private generateMockDevices(): BiometricDevice[] {
    return [
      {
        id: 'polar-h10-001',
        name: 'Polar H10 Heart Rate',
        type: 'heartrate',
        status: 'connected',
        lastReading: Date.now(),
        batteryLevel: 85,
        signalQuality: 0.95,
        manufacturer: 'Polar',
        model: 'H10'
      },
      {
        id: 'empatica-e4-001',
        name: 'Empatica E4 Stress',
        type: 'stress',
        status: 'connected',
        lastReading: Date.now(),
        batteryLevel: 72,
        signalQuality: 0.88,
        manufacturer: 'Empatica',
        model: 'E4'
      },
      {
        id: 'muse-2-001',
        name: 'Muse 2 Focus',
        type: 'focus',
        status: 'connected',
        lastReading: Date.now(),
        batteryLevel: 60,
        signalQuality: 0.82,
        manufacturer: 'Muse',
        model: '2'
      }
    ];
  }
  
  private generateMockDevice(deviceId: string): BiometricDevice {
    return {
      id: deviceId,
      name: `Mock Device ${deviceId}`,
      type: 'heartrate',
      status: 'connected',
      lastReading: Date.now(),
      batteryLevel: Math.floor(Math.random() * 100),
      signalQuality: 0.8 + Math.random() * 0.2,
      manufacturer: 'Mock Corp',
      model: 'Test Device'
    };
  }
  
  private generateMockReading(device: BiometricDevice): BiometricReading {
    let value: number;
    let unit: string;
    
    switch (device.type) {
      case 'heartrate':
        value = 65 + Math.random() * 20; // 65-85 BPM
        unit = 'BPM';
        break;
      case 'stress':
        value = 20 + Math.random() * 30; // 20-50 stress units
        unit = 'stress_units';
        break;
      case 'focus':
        value = 70 + Math.random() * 25; // 70-95 focus score
        unit = 'focus_score';
        break;
      default:
        value = Math.random() * 100;
        unit = 'units';
    }
    
    return {
      deviceId: device.id,
      type: device.type,
      value,
      unit,
      timestamp: Date.now(),
      quality: 0.8 + Math.random() * 0.2,
      processed: false
    };
  }
  
  private generateMockEmotionalState(): EmotionalState {
    return {
      overall: 75 + Math.random() * 20,
      stress: 70 + Math.random() * 25,
      focus: 80 + Math.random() * 15,
      authenticity: 85 + Math.random() * 10,
      timestamp: Date.now(),
      confidence: 0.8 + Math.random() * 0.2
    };
  }
  
  // Configuration
  updateConfig(updates: Partial<BiometricConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
  }
  
  getConfig(): BiometricConfig {
    return { ...this.config };
  }
  
  // Cleanup
  async destroy(): Promise<void> {
    await this.stopMonitoring();
    
    // Disconnect all devices
    for (const deviceId of this.devices.keys()) {
      try {
        await this.disconnectDevice(deviceId);
      } catch (error) {
        // Continue cleanup
      }
    }
    
    this.devices.clear();
    this.readings = [];
    this.currentState = undefined;
    this.removeAllListeners();
  }
}