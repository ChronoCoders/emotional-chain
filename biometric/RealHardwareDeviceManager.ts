import { BiometricDeviceManager } from './DeviceManager';
import { HeartRateMonitor } from './HeartRateMonitor';
import { FocusMonitor } from './FocusMonitor';
import { StressDetector } from './StressDetector';
import { BiometricDevice, DeviceConfig } from './BiometricDevice';

// Extend Web Bluetooth and USB APIs
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: any): Promise<any>;
    };
    usb?: {
      getDevices(): Promise<any[]>;
    };
  }
}

/**
 * Real Hardware Device Manager
 * Manages connections to actual biometric devices instead of simulated ones
 */
export class RealHardwareDeviceManager extends BiometricDeviceManager {
  private bluetoothDevices: Map<string, any> = new Map();
  private usbDevices: Map<string, any> = new Map();
  private deviceDiscoveryActive: boolean = false;

  /**
   * Discover real biometric devices using Web Bluetooth and USB APIs
   */
  async discoverDevices(): Promise<DeviceConfig[]> {
    if (this.deviceDiscoveryActive) {
      console.log('Device discovery already in progress...');
      return [];
    }

    this.deviceDiscoveryActive = true;
    console.log('🔍 Starting real device discovery...');

    try {
      // Run discovery methods in parallel
      await Promise.allSettled([
        this.discoverBluetoothDevices(),
        this.discoverUSBDevices(),
        this.discoverWebRTCStreams()
      ]);
    } catch (error) {
      console.error('Device discovery failed:', error);
    } finally {
      this.deviceDiscoveryActive = false;
    }
    
    // Return discovered device configs
    return Array.from(super.getDevices().values()).map(device => device.getConfig());
  }

  /**
   * Discover Bluetooth LE biometric devices
   */
  private async discoverBluetoothDevices(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      console.log('Web Bluetooth not available, skipping Bluetooth discovery');
      return;
    }

    try {
      console.log('📡 Scanning for Bluetooth LE biometric devices...');

      // Heart rate monitors
      const heartRateDevices = await this.scanForDeviceType([
        { services: ['180d'] }, // Heart Rate Service
        { namePrefix: 'Polar' },
        { namePrefix: 'Garmin' },
        { namePrefix: 'Wahoo' }
      ]);

      // EEG devices
      const eegDevices = await this.scanForDeviceType([
        { namePrefix: 'Muse' },
        { namePrefix: 'OpenBCI' },
        { services: ['0000fe8d-0000-1000-8000-00805f9b34fb'] } // Muse service
      ]);

      // Stress detection devices
      const stressDevices = await this.scanForDeviceType([
        { namePrefix: 'Empatica' },
        { namePrefix: 'BioHarness' }
      ]);

      // Register discovered devices
      this.registerDiscoveredDevices(heartRateDevices, 'heartRate');
      this.registerDiscoveredDevices(eegDevices, 'focus');
      this.registerDiscoveredDevices(stressDevices, 'stress');

    } catch (error) {
      console.error('Bluetooth device discovery failed:', error);
    }
  }

  /**
   * Scan for specific device types using Web Bluetooth
   */
  private async scanForDeviceType(filters: any[]): Promise<any[]> {
    const devices: any[] = [];
    
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not supported in this browser');
    }
    
    for (const filter of filters) {
      try {
        // Scan for devices matching the filter criteria
        const device = await navigator.bluetooth.requestDevice({
          filters: [filter],
          optionalServices: ['heart_rate', '0x180F', '0x180A'] // HR, Battery, Device Info
        });
        
        if (device) {
          devices.push({
            id: device.id,
            name: device.name || 'Unknown Device',
            bluetoothDevice: device,
            filter: filter
          });
        }
      } catch (error) {
        console.warn('Bluetooth scan filter failed:', filter, error);
        // Continue scanning with other filters
      }
    }
    
    return devices;
  }

  /**
   * Discover USB biometric devices
   */
  private async discoverUSBDevices(): Promise<void> {
    console.log('🔌 Scanning for USB biometric devices...');

    try {
      if (typeof navigator !== 'undefined' && navigator.usb) {
        // Web USB API
        const devices = await navigator.usb.getDevices();
        
        for (const device of devices) {
          await this.identifyUSBDevice(device);
        }
      } else {
        // Node.js environment - would use native USB libraries
        console.log('USB device discovery requires native libraries in Node.js');
        await this.mockUSBDiscovery();
      }
    } catch (error) {
      console.error('USB device discovery failed:', error);
    }
  }

  /**
   * Identify and categorize USB devices
   */
  private async identifyUSBDevice(device: any): Promise<void> {
    // Check vendor/product IDs for known biometric devices
    const knownDevices = {
      // ANT+ USB dongles
      '0fcf:1008': 'heartRate', // Garmin ANT+ stick
      '0fcf:1009': 'heartRate', // Suunto ANT+ stick
      
      // OpenBCI boards
      '2341:0043': 'focus', // Arduino Uno (OpenBCI compatible)
      '239a:8014': 'focus', // Adafruit board
      
      // Empatica devices
      '04d8:003f': 'stress' // Empatica USB receiver
    };

    const deviceId = `${device.vendorId.toString(16).padStart(4, '0')}:${device.productId.toString(16).padStart(4, '0')}`;
    const deviceType = knownDevices[deviceId as keyof typeof knownDevices];

    if (deviceType) {
      const config: DeviceConfig = {
        id: `usb-${deviceId}`,
        name: `USB ${deviceType} Device`,
        type: deviceType,
        connectionType: 'usb',
        address: deviceId
      };

      await this.createRealDevice(config);
    }
  }

  /**
   * Mock USB discovery for development environment
   */
  private async mockUSBDiscovery(): Promise<void> {
    // Simulate finding common USB biometric devices
    const mockDevices = [
      {
        id: 'usb-ant-001',
        name: 'ANT+ USB Dongle',
        type: 'heartRate',
        address: '0fcf:1008'
      },
      {
        id: 'usb-openbci-001',
        name: 'OpenBCI Cyton Board',
        type: 'focus',
        address: '2341:0043'
      }
    ];

    for (const deviceConfig of mockDevices) {
      await this.createRealDevice({
        ...deviceConfig,
        connectionType: 'usb'
      });
    }
  }

  /**
   * Discover WebRTC biometric streams
   */
  private async discoverWebRTCStreams(): Promise<void> {
    console.log('🌐 Checking for WebRTC biometric streams...');

    try {
      // Check for camera/microphone access for biometric analysis
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        for (const device of devices) {
          if (device.kind === 'videoinput') {
            // Camera for heart rate detection via photoplethysmography
            await this.createWebRTCDevice(device, 'heartRate');
          }
        }
      }
    } catch (error) {
      console.error('WebRTC stream discovery failed:', error);
    }
  }

  /**
   * Create WebRTC-based biometric device
   */
  private async createWebRTCDevice(mediaDevice: MediaDeviceInfo, type: string): Promise<void> {
    const config: DeviceConfig = {
      id: `webrtc-${mediaDevice.deviceId}`,
      name: `Camera ${type} Detection`,
      type,
      connectionType: 'webcam',
      address: mediaDevice.deviceId
    };

    await this.createRealDevice(config);
  }

  /**
   * Register discovered Bluetooth devices
   */
  private registerDiscoveredDevices(devices: any[], type: string): void {
    for (const device of devices) {
      const config: DeviceConfig = {
        id: device.id,
        name: device.name || `${type} Device`,
        type,
        connectionType: 'bluetooth',
        address: device.id
      };

      this.createRealDevice(config);
    }
  }

  /**
   * Create real biometric device instance
   */
  private async createRealDevice(config: DeviceConfig): Promise<BiometricDevice | null> {
    try {
      let device: BiometricDevice;

      switch (config.type) {
        case 'heartRate':
          device = new HeartRateMonitor(config);
          break;
        case 'focus':
          device = new FocusMonitor(config);
          break;
        case 'stress':
          device = new StressDetector(config);
          break;
        default:
          console.warn(`Unknown device type: ${config.type}`);
          return null;
      }

      // Attempt connection
      const connected = await device.connect();
      if (connected) {
        console.log(`✅ Connected to real device: ${config.name}`);
        return device;
      } else {
        console.warn(`❌ Failed to connect to device: ${config.name}`);
        return null;
      }
    } catch (error) {
      console.error(`Error creating device ${config.name}:`, error);
      return null;
    }
  }

  /**
   * Get all connected real devices
   */
  getConnectedRealDevices(): BiometricDevice[] {
    // Use parent class method to get all devices
    return this.getAllDevices().filter(device => device.isConnected());
  }

  /**
   * Get devices by type
   */
  getRealDevicesByType(type: string): BiometricDevice[] {
    return this.getConnectedRealDevices().filter(device => 
      device.getConfig().type.includes(type)
    );
  }

  /**
   * Disconnect all real devices
   */
  async disconnectAllRealDevices(): Promise<void> {
    console.log('Disconnecting all real biometric devices...');
    
    const devices = this.getAllDevices();
    const disconnectPromises = devices.map(device => 
      device.disconnect().catch(error => 
        console.error(`Error disconnecting ${device.getConfig().name}:`, error)
      )
    );

    await Promise.allSettled(disconnectPromises);
    this.bluetoothDevices.clear();
    this.usbDevices.clear();
    
    console.log('All real devices disconnected');
  }

  /**
   * Health check for all connected devices
   */
  async performHealthCheck(): Promise<{ healthy: number; total: number; issues: string[] }> {
    const devices = this.getConnectedRealDevices();
    const issues: string[] = [];
    let healthy = 0;

    for (const device of devices) {
      try {
        // Use public method from BiometricDevice interface
        const reading = await (device as any).readData();
        
        if (reading && reading.quality > 0.5) {
          healthy++;
        } else if (reading) {
          issues.push(`${device.getConfig().name}: Low signal quality (${(reading.quality * 100).toFixed(1)}%)`);
        } else {
          issues.push(`${device.getConfig().name}: No data available`);
        }
      } catch (error) {
        issues.push(`${device.getConfig().name}: Connection error`);
      }
    }

    return {
      healthy,
      total: devices.length,
      issues
    };
  }
}

export default RealHardwareDeviceManager;