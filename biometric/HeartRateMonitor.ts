// Backup of HeartRateMonitor.ts - Will restore core functionality
import { BiometricDevice, BiometricReading, DeviceConfig } from './BiometricDevice';

interface HeartRateData {
  heartRate: number;
  rrIntervals: number[];
  sensorContact: boolean;
  energyExpended: number;
}

export class HeartRateMonitor extends BiometricDevice {
  private lastHeartRate: number = 0;
  private rrBuffer: number[] = [];
  private maxRRBuffer = 100;
  private heartRateService: BluetoothRemoteGATTService | null = null;
  private measurementCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private batteryService: BluetoothRemoteGATTService | null = null;

  constructor(config: DeviceConfig) {
    super(config);
  }

  /**
   * Connect to real Bluetooth LE heart rate monitor
   */
  public async connect(): Promise<boolean> {
    if (this.config.connectionType === 'bluetooth') {
      return this.connectBluetooth();
    } else if (this.config.connectionType === 'usb') {
      return this.connectUSB();
    }
    return false;
  }

  private async connectBluetooth(): Promise<boolean> {
    try {
      // Connect to real Bluetooth LE heart rate service
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      const server = await device.gatt!.connect();
      this.heartRateService = await server.getPrimaryService('heart_rate');
      this.measurementCharacteristic = await this.heartRateService.getCharacteristic('heart_rate_measurement');

      // Set up real-time notifications
      await this.measurementCharacteristic.startNotifications();
      this.measurementCharacteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateChange.bind(this));

      // Connect to battery service
      try {
        this.batteryService = await server.getPrimaryService('battery_service');
        const batteryCharacteristic = await this.batteryService.getCharacteristic('battery_level');
        const batteryValue = await batteryCharacteristic.readValue();
        this.status.batteryLevel = batteryValue.getUint8(0);
      } catch (error) {
        console.warn('Battery service not available');
      }

      this.device = device;
      this.status.connected = true;
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return false;
    }
  }

  private async connectUSB(): Promise<boolean> {
    // USB heart rate monitor connection would be implemented here
    console.log('USB heart rate monitor connection not yet implemented');
    return false;
  }

  private handleHeartRateChange(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value!;
    const heartRateData = this.parseHeartRateData(value);
    this.processRealHeartRateData(heartRateData.heartRate, heartRateData.rrIntervals);
  }

  private processRealHeartRateData(heartRate: number, rrIntervals: number[]): void {
    this.lastHeartRate = heartRate;
    this.updateRRBuffer(rrIntervals);
  }

  /**
   * Parse Bluetooth LE heart rate measurement data
   */
  private parseHeartRateData(dataView: DataView): HeartRateData {
    const flags = dataView.getUint8(0);
    const heartRateFormat = flags & 0x01;
    const sensorContact = !!(flags & 0x06);
    const energyExpendedPresent = !!(flags & 0x08);
    const rrIntervalsPresent = !!(flags & 0x10);

    let offset = 1;
    
    const heartRate = heartRateFormat === 0 
      ? dataView.getUint8(offset++)
      : dataView.getUint16(offset, true) & 0x03FF;
    
    if (heartRateFormat === 1) offset += 2;

    let energyExpended = 0;
    if (energyExpendedPresent && offset + 2 <= dataView.byteLength) {
      energyExpended = dataView.getUint16(offset, true);
      offset += 2;
    }

    const rrIntervals: number[] = [];
    if (rrIntervalsPresent) {
      while (offset + 2 <= dataView.byteLength) {
        const rrInterval = dataView.getUint16(offset, true) * (1000 / 1024);
        rrIntervals.push(rrInterval);
        offset += 2;
      }
    }

    return { heartRate, rrIntervals, sensorContact, energyExpended };
  }

  private updateRRBuffer(newIntervals: number[]): void {
    this.rrBuffer.push(...newIntervals);
    if (this.rrBuffer.length > this.maxRRBuffer) {
      this.rrBuffer = this.rrBuffer.slice(-this.maxRRBuffer);
    }
  }

  private calculateHRV(): any {
    if (this.rrBuffer.length < 10) {
      return { rmssd: 0, sdnn: 0, pnn50: 0 };
    }
    
    const recentRR = this.rrBuffer.slice(-60);
    
    const differences = [];
    for (let i = 1; i < recentRR.length; i++) {
      differences.push(Math.pow(recentRR[i] - recentRR[i-1], 2));
    }
    const rmssd = Math.sqrt(differences.reduce((a, b) => a + b, 0) / differences.length);
    
    const mean = recentRR.reduce((a, b) => a + b, 0) / recentRR.length;
    const variance = recentRR.reduce((sum, rr) => sum + Math.pow(rr - mean, 2), 0) / recentRR.length;
    const sdnn = Math.sqrt(variance);
    
    let nn50Count = 0;
    for (let i = 1; i < recentRR.length; i++) {
      if (Math.abs(recentRR[i] - recentRR[i-1]) > 50) {
        nn50Count++;
      }
    }
    const pnn50 = (nn50Count / (recentRR.length - 1)) * 100;
    
    return { rmssd, sdnn, pnn50 };
  }

  public async readData(): Promise<BiometricReading | null> {
    if (!this.device || !this.status.connected) {
      return null;
    }

    try {
      const quality = this.calculateSignalQuality();

      const reading: BiometricReading = {
        timestamp: Date.now(),
        deviceId: this.config.id,
        type: 'heartRate',
        value: this.lastHeartRate,
        quality: quality,
        rawData: {
          heartRate: this.lastHeartRate,
          rrIntervals: this.rrBuffer.slice(-10),
          hrv: this.calculateHRV(),
          batteryLevel: this.status.batteryLevel
        }
      };

      return reading;
    } catch (error) {
      console.error('Error reading heart rate data:', error);
      return null;
    }
  }

  private calculateSignalQuality(): number {
    let quality = 1.0;
    
    if (this.lastHeartRate < 40 || this.lastHeartRate > 200) {
      quality *= 0.3;
    }
    
    if (this.status.batteryLevel < 20) {
      quality *= 0.8;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  protected getReadingInterval(): number {
    return 1000;
  }

  protected isValidBiometricValue(reading: BiometricReading): boolean {
    const heartRate = reading.value;
    return heartRate >= 30 && heartRate <= 220;
  }

  public async disconnect(): Promise<void> {
    if (this.device && this.device.gatt) {
      await this.device.gatt.disconnect();
    }
    this.status.connected = false;
    this.device = null;
  }
}