# Biometric Device Integration Guide

## Overview

EmotionalChain supports a wide range of biometric devices for real-time monitoring of heart rate, stress levels, focus metrics, and authenticity verification. This guide covers device setup, integration, and best practices for optimal emotional consensus participation.

## Supported Devices

### Heart Rate Monitors

#### Polar H10 (Recommended)
- **Connection**: Bluetooth LE
- **Metrics**: Heart rate, RR intervals, HRV
- **Battery**: 400+ hours
- **Accuracy**: ±1 BPM
- **Price**: ~$90

```typescript
const polarH10Config = {
  deviceType: 'heartRate',
  manufacturer: 'Polar',
  model: 'H10',
  connectionType: 'bluetooth',
  services: ['180D'], // Heart Rate Service UUID
  characteristics: ['2A37'], // Heart Rate Measurement
  sampleRate: 1000, // 1 Hz
  dataFormat: 'raw'
};
```

#### Wahoo TICKR FIT
- **Connection**: Bluetooth LE
- **Metrics**: Heart rate, calorie tracking
- **Battery**: 500+ hours  
- **Accuracy**: ±1 BPM
- **Price**: ~$80

#### Apple Watch Series 8+
- **Connection**: WebRTC via iPhone
- **Metrics**: Heart rate, HRV, activity
- **Battery**: 18 hours
- **Accuracy**: ±2 BPM
- **Price**: ~$400+

### Multi-Sensor Devices

#### Empatica E4 (Professional)
- **Connection**: USB/Bluetooth
- **Metrics**: Heart rate, EDA, temperature, motion
- **Battery**: 24+ hours
- **Research Grade**: FDA approved
- **Price**: ~$1,700

```typescript
const empaticaE4Config = {
  deviceType: 'multi_sensor',
  manufacturer: 'Empatica',
  model: 'E4',
  connectionType: 'usb',
  capabilities: ['heartRate', 'stress', 'temperature', 'motion'],
  sampleRates: {
    heartRate: 64, // Hz
    eda: 4, // Hz (stress indicator)
    temperature: 4, // Hz
    acceleration: 32 // Hz
  }
};
```

#### Biovotion Everion
- **Connection**: Bluetooth LE
- **Metrics**: 20+ physiological parameters
- **Battery**: 4+ days
- **Medical Grade**: CE certified
- **Price**: ~$800

### Focus/EEG Devices

#### Muse S Headband
- **Connection**: Bluetooth LE
- **Metrics**: Brain activity, meditation states
- **Battery**: 10+ hours
- **Focus Detection**: Yes
- **Price**: ~$400

#### NeuroSky MindWave
- **Connection**: Bluetooth
- **Metrics**: Attention, meditation levels
- **Battery**: 8+ hours
- **Budget Option**: Good for testing
- **Price**: ~$100

## Device Setup

### 1. Hardware Prerequisites

#### Bluetooth LE Support
Ensure your device supports Bluetooth Low Energy:

```bash
# Linux - Check Bluetooth capability
hciconfig
bluetoothctl

# macOS - System Preferences > Bluetooth
system_profiler SPBluetoothDataType

# Windows - Device Manager > Bluetooth
```

#### USB Device Support
For USB-connected devices, install appropriate drivers:

```bash
# Linux - Install libusb
sudo apt-get install libusb-1.0-0-dev

# macOS - Usually works out of box
# Windows - Install device-specific drivers
```

### 2. Software Installation

#### Web Bluetooth Setup
EmotionalChain uses Web Bluetooth for browser-based connections:

```html
<!-- Enable Web Bluetooth in browser -->
<script>
// Check for Web Bluetooth support
if ('bluetooth' in navigator) {
  console.log('Web Bluetooth is supported');
} else {
  console.log('Web Bluetooth is not supported');
}
</script>
```

#### Native Bluetooth Setup
For native applications, install required libraries:

```bash
# Node.js - Install noble for Bluetooth LE
npm install @abandonware/noble

# Python - Install bleak for async Bluetooth
pip install bleak

# Rust - Add btleplug to Cargo.toml
btleplug = "0.10"
```

### 3. Device Pairing

#### Bluetooth Pairing Process

1. **Put device in pairing mode**
   ```typescript
   // Scan for devices
   const devices = await navigator.bluetooth.requestDevice({
     filters: [
       { services: ['heart_rate'] },
       { namePrefix: 'Polar H10' },
       { namePrefix: 'Empatica' }
     ]
   });
   ```

2. **Connect to device**
   ```typescript
   const server = await device.gatt.connect();
   const service = await server.getPrimaryService('heart_rate');
   const characteristic = await service.getCharacteristic('heart_rate_measurement');
   ```

3. **Start data streaming**
   ```typescript
   await characteristic.startNotifications();
   characteristic.addEventListener('characteristicvaluechanged', handleHeartRateData);
   ```

## Integration Examples

### Basic Heart Rate Integration

```typescript
class HeartRateMonitor {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  async connect(): Promise<void> {
    try {
      // Request device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });

      // Connect to GATT server
      const server = await this.device.gatt!.connect();
      const service = await server.getPrimaryService('heart_rate');
      this.characteristic = await service.getCharacteristic('heart_rate_measurement');

      // Start notifications
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleData.bind(this));

      console.log('Heart rate monitor connected');
    } catch (error) {
      console.error('Failed to connect to heart rate monitor:', error);
    }
  }

  private handleData(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value!;
    
    // Parse heart rate data (standard format)
    const heartRate = this.parseHeartRate(value);
    
    // Send to EmotionalChain API
    this.sendBiometricData({
      deviceId: this.device!.id,
      type: 'heartRate',
      value: heartRate,
      timestamp: Date.now()
    });
  }

  private parseHeartRate(data: DataView): number {
    const flags = data.getUint8(0);
    const is16Bit = flags & 0x01;
    
    if (is16Bit) {
      return data.getUint16(1, true); // Little endian
    } else {
      return data.getUint8(1);
    }
  }

  private async sendBiometricData(data: BiometricReading): Promise<void> {
    await fetch('/api/biometric/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}
```

### Multi-Sensor Integration

```typescript
class MultiSensorDevice {
  private sensors: Map<string, SensorConfig> = new Map();

  async initialize(): Promise<void> {
    // Initialize heart rate sensor
    this.sensors.set('heartRate', {
      service: 'heart_rate',
      characteristic: 'heart_rate_measurement',
      parser: this.parseHeartRate,
      sampleRate: 1000
    });

    // Initialize stress sensor (EDA)
    this.sensors.set('stress', {
      service: 'eda_service',
      characteristic: 'eda_measurement',
      parser: this.parseStressLevel,
      sampleRate: 4000
    });

    // Initialize focus sensor (EEG)
    this.sensors.set('focus', {
      service: 'eeg_service', 
      characteristic: 'attention_measurement',
      parser: this.parseFocusLevel,
      sampleRate: 256
    });
  }

  async connectAll(): Promise<void> {
    for (const [name, config] of this.sensors) {
      await this.connectSensor(name, config);
    }
  }

  private async connectSensor(name: string, config: SensorConfig): Promise<void> {
    // Implementation for each sensor type
    const characteristic = await this.getCharacteristic(config.service, config.characteristic);
    
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const data = config.parser(event.target.value);
      this.handleSensorData(name, data);
    });
  }

  private handleSensorData(sensorType: string, data: any): void {
    // Aggregate data from multiple sensors
    this.aggregateData(sensorType, data);
    
    // Calculate emotional score
    if (this.hasAllRequiredData()) {
      const emotionalScore = this.calculateEmotionalScore();
      this.submitToNetwork(emotionalScore);
    }
  }
}
```

## Data Processing

### Signal Quality Assessment

```typescript
class SignalProcessor {
  assessQuality(rawData: number[]): QualityMetrics {
    return {
      signalStrength: this.calculateSignalStrength(rawData),
      noiseLevel: this.calculateNoiseLevel(rawData),
      consistency: this.calculateConsistency(rawData),
      artifactCount: this.detectArtifacts(rawData)
    };
  }

  private calculateSignalStrength(data: number[]): number {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.min(100, Math.max(0, 100 - (variance / mean) * 100));
  }

  private detectArtifacts(data: number[]): number {
    let artifacts = 0;
    for (let i = 1; i < data.length; i++) {
      const change = Math.abs(data[i] - data[i-1]);
      if (change > this.getThreshold(data)) {
        artifacts++;
      }
    }
    return artifacts;
  }
}
```

### Real-Time Filtering

```typescript
class BiometricFilter {
  private buffer: CircularBuffer<number>;
  private filter: DigitalFilter;

  constructor(bufferSize: number = 100) {
    this.buffer = new CircularBuffer(bufferSize);
    this.filter = new ButterworthFilter({
      order: 4,
      characteristic: 'lowpass',
      Fs: 1000, // Sample rate
      Fc: 50    // Cutoff frequency
    });
  }

  process(rawValue: number): number {
    // Add to buffer
    this.buffer.push(rawValue);
    
    // Apply digital filter
    const filtered = this.filter.filter(rawValue);
    
    // Remove baseline drift
    const baseline = this.calculateBaseline();
    const corrected = filtered - baseline;
    
    // Validate range
    return this.validateRange(corrected);
  }

  private calculateBaseline(): number {
    if (this.buffer.length < 10) return 0;
    
    const recent = this.buffer.getRecent(10);
    return recent.reduce((a, b) => a + b) / recent.length;
  }
}
```

## Authentication and Security

### Device Authentication

```typescript
class DeviceAuthenticator {
  async authenticateDevice(deviceId: string): Promise<AuthResult> {
    // 1. Verify device certificate
    const certificate = await this.getDeviceCertificate(deviceId);
    const isValidCert = await this.verifyCertificate(certificate);
    
    // 2. Check device fingerprint
    const fingerprint = await this.generateFingerprint(deviceId);
    const isKnownDevice = await this.verifyFingerprint(fingerprint);
    
    // 3. Perform challenge-response
    const challenge = this.generateChallenge();
    const response = await this.sendChallenge(deviceId, challenge);
    const isValidResponse = this.verifyResponse(challenge, response);
    
    return {
      authenticated: isValidCert && isKnownDevice && isValidResponse,
      trustLevel: this.calculateTrustLevel(isValidCert, isKnownDevice, isValidResponse)
    };
  }

  private async generateFingerprint(deviceId: string): Promise<string> {
    // Create unique device fingerprint based on:
    // - Hardware characteristics
    // - Signal patterns
    // - Environmental factors
    const hardware = await this.getHardwareInfo(deviceId);
    const patterns = await this.analyzeSignalPatterns(deviceId);
    
    return this.hash([hardware, patterns].join(''));
  }
}
```

### Anti-Spoofing Measures

```typescript
class AntiSpoofingDetector {
  async detectSpoofing(biometricData: BiometricStream): Promise<SpoofingResult> {
    const checks = await Promise.all([
      this.checkLiveness(biometricData),
      this.checkTemporal(biometricData),
      this.checkEnvironmental(biometricData),
      this.checkDeviceConsistency(biometricData)
    ]);

    const spoofingScore = this.calculateSpoofingScore(checks);
    
    return {
      isSpoofed: spoofingScore > 0.7,
      confidence: spoofingScore,
      flags: checks.filter(check => !check.passed),
      recommendation: spoofingScore > 0.9 ? 'reject' : 'accept'
    };
  }

  private async checkLiveness(data: BiometricStream): Promise<CheckResult> {
    // Verify natural human variability
    const variability = this.calculateVariability(data.heartRate);
    const isNatural = variability > 0.02 && variability < 0.15;
    
    return {
      name: 'liveness',
      passed: isNatural,
      score: this.scoreVariability(variability),
      details: { variability, expected: '0.02-0.15' }
    };
  }

  private async checkTemporal(data: BiometricStream): Promise<CheckResult> {
    // Analyze temporal patterns for artificial generation
    const patterns = this.extractTemporalPatterns(data);
    const entropy = this.calculateEntropy(patterns);
    const isNatural = entropy > 0.8;
    
    return {
      name: 'temporal',
      passed: isNatural,
      score: entropy,
      details: { entropy, threshold: 0.8 }
    };
  }
}
```

## Calibration and Optimization

### Device Calibration

```typescript
class DeviceCalibrator {
  async calibrateDevice(deviceId: string, userId: string): Promise<CalibrationResult> {
    console.log(`Starting calibration for ${deviceId}`);
    
    // 1. Baseline measurement (5 minutes rest)
    const baseline = await this.measureBaseline(deviceId, 300);
    
    // 2. Stress test (controlled stressor)
    const stressResponse = await this.measureStressResponse(deviceId);
    
    // 3. Recovery measurement (5 minutes)
    const recovery = await this.measureRecovery(deviceId, 300);
    
    // 4. Calculate personalized parameters
    const params = this.calculatePersonalizedParams(baseline, stressResponse, recovery);
    
    // 5. Store calibration data
    await this.storeCalibration(userId, deviceId, params);
    
    return {
      success: true,
      baseline: baseline,
      stressResponse: stressResponse,
      recovery: recovery,
      personalizedParams: params,
      validUntil: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
    };
  }

  private calculatePersonalizedParams(baseline: Reading, stress: Reading, recovery: Reading): PersonalizedParams {
    return {
      restingHeartRate: baseline.averageHeartRate,
      maxHeartRate: Math.max(stress.maxHeartRate, baseline.maxHeartRate * 1.8),
      stressThreshold: baseline.averageHeartRate + (stress.averageHeartRate - baseline.averageHeartRate) * 0.6,
      recoveryRate: (stress.averageHeartRate - recovery.averageHeartRate) / 300, // per second
      hrvBaseline: baseline.averageHRV,
      personalityFactor: this.calculatePersonalityFactor(baseline, stress, recovery)
    };
  }
}
```

### Performance Optimization

```typescript
class PerformanceOptimizer {
  optimizeForValidator(validatorId: string, deviceConfigs: DeviceConfig[]): OptimizationResult {
    const recommendations = [];
    
    for (const config of deviceConfigs) {
      // Analyze current performance
      const metrics = this.analyzeDevicePerformance(config);
      
      // Generate optimization recommendations
      if (metrics.signalQuality < 0.9) {
        recommendations.push({
          device: config.deviceId,
          issue: 'low_signal_quality',
          solution: 'Adjust device placement or clean sensors',
          priority: 'high'
        });
      }
      
      if (metrics.batteryLevel < 0.2) {
        recommendations.push({
          device: config.deviceId,
          issue: 'low_battery',
          solution: 'Charge device or replace battery',
          priority: 'critical'
        });
      }
      
      if (metrics.connectionStability < 0.95) {
        recommendations.push({
          device: config.deviceId,
          issue: 'unstable_connection',
          solution: 'Move closer to receiver or check interference',
          priority: 'medium'
        });
      }
    }
    
    return {
      currentScore: this.calculateOverallScore(deviceConfigs),
      potentialScore: this.calculatePotentialScore(deviceConfigs, recommendations),
      recommendations: recommendations,
      estimatedImprovement: this.estimateImprovement(recommendations)
    };
  }
}
```

## Troubleshooting

### Common Issues

#### Connection Problems

1. **Device Not Found**
   ```typescript
   // Check device availability
   const isAvailable = await this.checkDeviceAvailability(deviceId);
   if (!isAvailable) {
     // Try different connection method
     await this.tryAlternativeConnection(deviceId);
   }
   ```

2. **Intermittent Disconnections**
   ```typescript
   // Implement reconnection logic
   class ReconnectionManager {
     private reconnectAttempts = 0;
     private maxAttempts = 5;
     
     async handleDisconnection(deviceId: string): Promise<void> {
       if (this.reconnectAttempts < this.maxAttempts) {
         await this.exponentialBackoff(this.reconnectAttempts);
         await this.attemptReconnection(deviceId);
         this.reconnectAttempts++;
       } else {
         // Fall back to manual reconnection
         this.notifyUser('Manual reconnection required');
       }
     }
   }
   ```

#### Data Quality Issues

1. **Noisy Signals**
   ```typescript
   // Apply advanced filtering
   const filteredData = this.applyKalmanFilter(rawData);
   const cleanedData = this.removeOutliers(filteredData);
   ```

2. **Artifacts and Outliers**
   ```typescript
   // Detect and handle artifacts
   if (this.isArtifact(dataPoint)) {
     // Use interpolation or discard
     return this.interpolateValue(previousValues);
   }
   ```

### Support Resources

#### Debug Mode
Enable debug logging for troubleshooting:

```typescript
const debugConfig = {
  enableLogging: true,
  logLevel: 'verbose',
  logBiometricData: true,
  logConnectionEvents: true
};
```

#### Health Checks
Regular device health monitoring:

```typescript
class DeviceHealthMonitor {
  async performHealthCheck(deviceId: string): Promise<HealthReport> {
    return {
      connectivity: await this.checkConnectivity(deviceId),
      signalQuality: await this.assessSignalQuality(deviceId),
      batteryStatus: await this.checkBattery(deviceId),
      calibrationStatus: await this.checkCalibration(deviceId),
      lastActivity: await this.getLastActivity(deviceId)
    };
  }
}
```

This biometric integration guide provides the foundation for connecting and managing biometric devices with EmotionalChain's Proof of Emotion consensus mechanism.