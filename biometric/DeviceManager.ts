import { EventEmitter } from 'events';
import { BiometricDevice, BiometricReading, DeviceConfig, DeviceStatus } from './BiometricDevice';
import { HeartRateMonitor } from './HeartRateMonitor';
import { StressDetector } from './StressDetector';
import { FocusMonitor } from './FocusMonitor';
export interface DeviceGroup {
  validatorId: string;
  devices: BiometricDevice[];
  lastReading: number;
  aggregatedData: BiometricReading[];
  healthScore: number;
  redundancyLevel: 'low' | 'medium' | 'high';
}
export interface DataFusion {
  timestamp: number;
  readings: BiometricReading[];
  qualityScore: number;
  confidence: number;
  anomalies: string[];
}
export class BiometricDeviceManager extends EventEmitter {
  private deviceGroups: Map<string, DeviceGroup> = new Map();
  private discoveryInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly discoveryIntervalMs = 30000; // 30 seconds
  private readonly healthCheckIntervalMs = 10000; // 10 seconds
  private readonly maxDataAge = 60000; // 1 minute
  constructor() {
    super();
    this.startDeviceDiscovery();
    this.startHealthMonitoring();
  }
  /**
   * Initialize biometric devices for a validator
   */
  public async initializeValidator(validatorId: string, deviceConfigs?: DeviceConfig[]): Promise<DeviceGroup> {
    console.log(` Initializing biometric devices for ${validatorId}...`);
    let configs = deviceConfigs;
    if (!configs || configs.length === 0) {
      // Auto-discover devices
      configs = await this.discoverDevices();
    }
    const devices: BiometricDevice[] = [];
    // Create device instances
    for (const config of configs) {
      const device = this.createDevice(config);
      if (device) {
        // Set up event listeners
        this.setupDeviceListeners(device, validatorId);
        devices.push(device);
      }
    }
    // Connect all devices
    const connectionResults = await Promise.allSettled(
      devices.map(device => device.connect())
    );
    const connectedDevices = devices.filter((device, index) => {
      const result = connectionResults[index];
      return result.status === 'fulfilled' && result.value === true;
    });
    const deviceGroup: DeviceGroup = {
      validatorId,
      devices: connectedDevices,
      lastReading: 0,
      aggregatedData: [],
      healthScore: 0,
      redundancyLevel: this.calculateRedundancyLevel(connectedDevices.length)
    };
    this.deviceGroups.set(validatorId, deviceGroup);
    this.updateHealthScore(validatorId);
    this.emit('validatorInitialized', { validatorId, deviceGroup });
    return deviceGroup;
  }
  /**
   * Get real-time biometric data for a validator
   */
  public async getBiometricData(validatorId: string, maxAge: number = 5000): Promise<DataFusion | null> {
    const deviceGroup = this.deviceGroups.get(validatorId);
    if (!deviceGroup || deviceGroup.devices.length === 0) {
      return null;
    }
    // Collect recent readings from all devices
    const recentReadings: BiometricReading[] = [];
    const cutoffTime = Date.now() - maxAge;
    for (const device of deviceGroup.devices) {
      if (device.isConnected()) {
        try {
          const reading = await device.readData();
          if (reading && reading.timestamp > cutoffTime) {
            recentReadings.push(reading);
          }
        } catch (error) {
          console.warn(`Failed to read from device ${device.getConfig().id}:`, error);
        }
      }
    }
    if (recentReadings.length === 0) {
      return null;
    }
    // Perform data fusion
    const fusedData = this.fuseData(recentReadings);
    // Update device group
    deviceGroup.lastReading = Date.now();
    deviceGroup.aggregatedData = recentReadings;
    this.updateHealthScore(validatorId);
    return fusedData;
  }
  /**
   * Fuse data from multiple biometric sensors
   */
  private fuseData(readings: BiometricReading[]): DataFusion {
    // Group readings by type
    const readingsByType = this.groupReadingsByType(readings);
    // Calculate quality score
    const qualityScore = this.calculateOverallQuality(readings);
    // Detect anomalies
    const anomalies = this.detectAnomalies(readings);
    // Calculate confidence based on sensor agreement
    const confidence = this.calculateSensorConfidence(readingsByType);
    return {
      timestamp: Date.now(),
      readings,
      qualityScore,
      confidence,
      anomalies
    };
  }
  /**
   * Group readings by biometric type
   */
  private groupReadingsByType(readings: BiometricReading[]): Map<string, BiometricReading[]> {
    const groups = new Map<string, BiometricReading[]>();
    for (const reading of readings) {
      if (!groups.has(reading.type)) {
        groups.set(reading.type, []);
      }
      groups.get(reading.type)!.push(reading);
    }
    return groups;
  }
  /**
   * Calculate overall quality score from multiple sensors
   */
  private calculateOverallQuality(readings: BiometricReading[]): number {
    if (readings.length === 0) {
      return 0;
    }
    // Weight by device reliability and signal quality
    let totalWeightedQuality = 0;
    let totalWeight = 0;
    for (const reading of readings) {
      const deviceWeight = this.getDeviceReliabilityWeight(reading.deviceId);
      const weight = deviceWeight * reading.quality;
      totalWeightedQuality += reading.quality * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? totalWeightedQuality / totalWeight : 0;
  }
  /**
   * Get device reliability weight based on historical performance
   */
  private getDeviceReliabilityWeight(deviceId: string): number {
    // Find device across all groups
    for (const group of this.deviceGroups.values()) {
      const device = group.devices.find(d => d.getConfig().id === deviceId);
      if (device) {
        const status = device.getStatus();
        // Weight based on device health and error rate
        let weight = 1.0;
        switch (status.deviceHealth) {
          case 'excellent': weight = 1.0; break;
          case 'good': weight = 0.9; break;
          case 'fair': weight = 0.7; break;
          case 'poor': weight = 0.5; break;
          case 'critical': weight = 0.2; break;
        }
        // Reduce weight based on error count
        const errorPenalty = Math.min(0.5, status.errorCount * 0.05);
        weight *= (1 - errorPenalty);
        return Math.max(0.1, weight);
      }
    }
    return 0.5; // Default weight for unknown devices
  }
  /**
   * Detect anomalies in biometric data
   */
  private detectAnomalies(readings: BiometricReading[]): string[] {
    const anomalies: string[] = [];
    // Check for suspicious patterns
    const readingsByType = this.groupReadingsByType(readings);
    for (const [type, typeReadings] of readingsByType) {
      if (typeReadings.length > 1) {
        // Check for excessive variation between sensors of same type
        const values = typeReadings.map(r => r.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const maxDeviation = Math.max(...values.map(v => Math.abs(v - mean)));
        const expectedVariation = this.getExpectedVariation(type);
        if (maxDeviation > expectedVariation) {
          anomalies.push(`High variation in ${type} readings: ${maxDeviation.toFixed(1)} (expected < ${expectedVariation})`);
        }
      }
      // Check for out-of-range values
      for (const reading of typeReadings) {
        const range = this.getNormalRange(type);
        if (reading.value < range.min || reading.value > range.max) {
          anomalies.push(`${type} reading out of normal range: ${reading.value} (expected ${range.min}-${range.max})`);
        }
      }
      // Check for suspiciously low quality
      const lowQualityReadings = typeReadings.filter(r => r.quality < 0.3);
      if (lowQualityReadings.length > 0) {
        anomalies.push(`${lowQualityReadings.length} low quality ${type} readings detected`);
      }
    }
    // Check temporal anomalies
    const timestamps = readings.map(r => r.timestamp).sort();
    const timeSpread = timestamps[timestamps.length - 1] - timestamps[0];
    if (timeSpread > 10000) { // More than 10 seconds spread
      anomalies.push(`Large time spread in readings: ${timeSpread}ms`);
    }
    return anomalies;
  }
  /**
   * Calculate confidence based on sensor agreement
   */
  private calculateSensorConfidence(readingsByType: Map<string, BiometricReading[]>): number {
    let totalConfidence = 0;
    let typeCount = 0;
    for (const [type, readings] of readingsByType) {
      if (readings.length === 1) {
        // Single sensor - moderate confidence
        totalConfidence += 0.7;
      } else {
        // Multiple sensors - calculate agreement
        const values = readings.map(r => r.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const maxDeviation = Math.max(...values.map(v => Math.abs(v - mean)));
        const expectedVariation = this.getExpectedVariation(type);
        const agreementScore = Math.max(0, 1 - (maxDeviation / expectedVariation));
        // Higher confidence with better agreement
        totalConfidence += 0.5 + (agreementScore * 0.5);
      }
      typeCount++;
    }
    const baseConfidence = typeCount > 0 ? totalConfidence / typeCount : 0;
    // Bonus for redundancy
    const redundancyBonus = Math.min(0.2, readingsByType.size * 0.05);
    return Math.min(1, baseConfidence + redundancyBonus);
  }
  /**
   * Get expected variation for biometric type
   */
  private getExpectedVariation(type: string): number {
    switch (type) {
      case 'heartRate': return 10; // ±10 BPM
      case 'stress': return 15; // ±15%
      case 'focus': return 20; // ±20%
      default: return 10;
    }
  }
  /**
   * Get normal range for biometric type
   */
  private getNormalRange(type: string): { min: number; max: number } {
    switch (type) {
      case 'heartRate': return { min: 40, max: 200 };
      case 'stress': return { min: 0, max: 100 };
      case 'focus': return { min: 0, max: 100 };
      default: return { min: 0, max: 100 };
    }
  }
  /**
   * Update health score for a validator
   */
  private updateHealthScore(validatorId: string): void {
    const deviceGroup = this.deviceGroups.get(validatorId);
    if (!deviceGroup) return;
    let totalHealthScore = 0;
    let deviceCount = 0;
    for (const device of deviceGroup.devices) {
      const status = device.getStatus();
      let deviceScore = 0;
      switch (status.deviceHealth) {
        case 'excellent': deviceScore = 100; break;
        case 'good': deviceScore = 80; break;
        case 'fair': deviceScore = 60; break;
        case 'poor': deviceScore = 40; break;
        case 'critical': deviceScore = 20; break;
      }
      // Adjust for connection status
      if (!status.connected) {
        deviceScore *= 0.5;
      }
      totalHealthScore += deviceScore;
      deviceCount++;
    }
    deviceGroup.healthScore = deviceCount > 0 ? totalHealthScore / deviceCount : 0;
  }
  /**
   * Calculate redundancy level based on device count
   */
  private calculateRedundancyLevel(deviceCount: number): 'low' | 'medium' | 'high' {
    if (deviceCount >= 4) return 'high';
    if (deviceCount >= 2) return 'medium';
    return 'low';
  }
  /**
   * Create device instance based on configuration
   */
  private createDevice(config: DeviceConfig): BiometricDevice | null {
    try {
      switch (config.type) {
        case 'heartRate':
          return new HeartRateMonitor(config);
        case 'stress':
          return new StressDetector(config);
        case 'focus':
          return new FocusMonitor(config);
        default:
          console.warn(`Unknown device type: ${config.type}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to create device ${config.id}:`, error);
      return null;
    }
  }
  /**
   * Set up event listeners for a device
   */
  private setupDeviceListeners(device: BiometricDevice, validatorId: string): void {
    device.on('connected', (deviceId) => {
      this.emit('deviceConnected', { validatorId, deviceId });
    });
    device.on('disconnected', (deviceId) => {
      this.emit('deviceDisconnected', { validatorId, deviceId });
      this.updateHealthScore(validatorId);
    });
    device.on('error', ({ deviceId, error, attempt }) => {
      this.emit('deviceError', { validatorId, deviceId, error, attempt });
      this.updateHealthScore(validatorId);
    });
    device.on('data', (reading: BiometricReading) => {
      this.emit('biometricData', { validatorId, reading });
    });
    device.on('maxAttemptsExceeded', (deviceId) => {
      console.error(`🚫 Device ${deviceId} exceeded maximum connection attempts`);
      this.emit('deviceFailed', { validatorId, deviceId });
    });
  }
  /**
   * Discover available biometric devices
   */
  private async discoverDevices(): Promise<DeviceConfig[]> {
    console.log('🔍 Discovering biometric devices...');
    const allDevices: DeviceConfig[] = [];
    try {
      // Discover each device type
      const [heartRateDevices, stressDevices, focusDevices] = await Promise.all([
        HeartRateMonitor.discoverDevices(),
        StressDetector.discoverDevices(),
        FocusMonitor.discoverDevices()
      ]);
      allDevices.push(...heartRateDevices, ...stressDevices, ...focusDevices);
      console.log(`📱 Discovered ${allDevices.length} biometric devices`);
    } catch (error) {
      console.error('Device discovery failed:', error);
    }
    return allDevices;
  }
  /**
   * Start automatic device discovery
   */
  private startDeviceDiscovery(): void {
    this.discoveryInterval = setInterval(async () => {
      const newDevices = await this.discoverDevices();
      if (newDevices.length > 0) {
        this.emit('devicesDiscovered', newDevices);
      }
    }, this.discoveryIntervalMs);
  }
  /**
   * Start health monitoring for all devices
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      for (const [validatorId, deviceGroup] of this.deviceGroups) {
        this.updateHealthScore(validatorId);
        // Check for stale data
        const dataAge = Date.now() - deviceGroup.lastReading;
        if (dataAge > this.maxDataAge) {
          this.emit('staleData', { validatorId, age: dataAge });
        }
        // Check device statuses
        for (const device of deviceGroup.devices) {
          const status = device.getStatus();
          if (!status.connected) {
            this.emit('deviceOffline', { 
              validatorId, 
              deviceId: device.getConfig().id 
            });
          }
          if (status.deviceHealth === 'critical') {
            this.emit('deviceCritical', { 
              validatorId, 
              deviceId: device.getConfig().id,
              status 
            });
          }
        }
      }
    }, this.healthCheckIntervalMs);
  }
  /**
   * Stop device management
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down device manager...');
    // Stop intervals
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    // Disconnect all devices
    const disconnectPromises: Promise<void>[] = [];
    for (const deviceGroup of this.deviceGroups.values()) {
      for (const device of deviceGroup.devices) {
        disconnectPromises.push(device.disconnect());
      }
    }
    await Promise.allSettled(disconnectPromises);
    this.deviceGroups.clear();
  }
  /**
   * Get device group for validator
   */
  public getDeviceGroup(validatorId: string): DeviceGroup | undefined {
    return this.deviceGroups.get(validatorId);
  }
  /**
   * Get all managed validators
   */
  public getManagedValidators(): string[] {
    return Array.from(this.deviceGroups.keys());
  }
  /**
   * Get overall system health
   */
  public getSystemHealth(): any {
    const totalValidators = this.deviceGroups.size;
    const totalDevices = Array.from(this.deviceGroups.values())
      .reduce((sum, group) => sum + group.devices.length, 0);
    const connectedDevices = Array.from(this.deviceGroups.values())
      .reduce((sum, group) => {
        return sum + group.devices.filter(d => d.isConnected()).length;
      }, 0);
    const averageHealthScore = Array.from(this.deviceGroups.values())
      .reduce((sum, group) => sum + group.healthScore, 0) / (totalValidators || 1);
    const redundancyLevels = Array.from(this.deviceGroups.values())
      .reduce((counts, group) => {
        counts[group.redundancyLevel]++;
        return counts;
      }, { low: 0, medium: 0, high: 0 });
    return {
      totalValidators,
      totalDevices,
      connectedDevices,
      connectionRate: totalDevices > 0 ? connectedDevices / totalDevices : 0,
      averageHealthScore,
      redundancyLevels,
      systemStatus: averageHealthScore >= 80 ? 'healthy' : 
                   averageHealthScore >= 60 ? 'warning' : 'critical'
    };
  }
  /**
   * Force reconnection for validator devices
   */
  public async reconnectValidator(validatorId: string): Promise<boolean> {
    const deviceGroup = this.deviceGroups.get(validatorId);
    if (!deviceGroup) {
      return false;
    }
    const reconnectPromises = deviceGroup.devices.map(async (device) => {
      try {
        await device.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return await device.connect();
      } catch (error) {
        console.error(`Failed to reconnect device ${device.getConfig().id}:`, error);
        return false;
      }
    });
    const results = await Promise.allSettled(reconnectPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    this.updateHealthScore(validatorId);
    return successCount > 0;
  }
  /**
   * Add device to existing validator
   */
  public async addDevice(validatorId: string, config: DeviceConfig): Promise<boolean> {
    const deviceGroup = this.deviceGroups.get(validatorId);
    if (!deviceGroup) {
      return false;
    }
    const device = this.createDevice(config);
    if (!device) {
      return false;
    }
    this.setupDeviceListeners(device, validatorId);
    const connected = await device.connect();
    if (connected) {
      deviceGroup.devices.push(device);
      deviceGroup.redundancyLevel = this.calculateRedundancyLevel(deviceGroup.devices.length);
      this.updateHealthScore(validatorId);
      return true;
    }
    return false;
  }
  /**
   * Remove device from validator
   */
  public async removeDevice(validatorId: string, deviceId: string): Promise<boolean> {
    const deviceGroup = this.deviceGroups.get(validatorId);
    if (!deviceGroup) {
      return false;
    }
    const deviceIndex = deviceGroup.devices.findIndex(d => d.getConfig().id === deviceId);
    if (deviceIndex === -1) {
      return false;
    }
    const device = deviceGroup.devices[deviceIndex];
    await device.disconnect();
    deviceGroup.devices.splice(deviceIndex, 1);
    deviceGroup.redundancyLevel = this.calculateRedundancyLevel(deviceGroup.devices.length);
    this.updateHealthScore(validatorId);
    return true;
  }
}