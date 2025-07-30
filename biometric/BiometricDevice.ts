import { EventEmitter } from 'events';

export interface BiometricReading {
  timestamp: number;
  deviceId: string;
  type: 'heartRate' | 'stress' | 'focus' | 'authenticity';
  value: number;
  quality: number; // 0-1, signal quality score
  rawData?: any; // For device-specific processing
}

export interface DeviceConfig {
  id: string;
  name: string;
  type: string;
  connectionType: 'bluetooth' | 'usb' | 'serial' | 'webcam';
  address?: string; // Bluetooth address, USB path, etc.
  baudRate?: number; // For serial devices
  timeout?: number;
}

export interface DeviceStatus {
  connected: boolean;
  batteryLevel?: number;
  signalQuality: number;
  lastReading: number;
  errorCount: number;
  deviceHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export abstract class BiometricDevice extends EventEmitter {
  protected config: DeviceConfig;
  protected status: DeviceStatus;
  protected connectionAttempts: number = 0;
  protected maxConnectionAttempts: number = 3;
  protected reconnectDelay: number = 5000; // 5 seconds
  protected reconnectTimer?: NodeJS.Timeout;
  protected isConnecting: boolean = false;

  constructor(config: DeviceConfig) {
    super();
    this.config = config;
    this.status = {
      connected: false,
      signalQuality: 0,
      lastReading: 0,
      errorCount: 0,
      deviceHealth: 'poor'
    };
  }

  /**
   * Connect to the biometric device
   */
  public async connect(): Promise<boolean> {
    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;
    
    try {
      console.log(`🔗 Connecting to ${this.config.name} (${this.config.type})...`);
      
      const success = await this.establishConnection();
      
      if (success) {
        this.status.connected = true;
        this.connectionAttempts = 0;
        this.isConnecting = false;
        
        console.log(`✅ ${this.config.name} connected successfully`);
        this.emit('connected', this.config.id);
        
        // Start data reading
        this.startDataCollection();
        
        return true;
      } else {
        throw new Error('Connection failed');
      }
      
    } catch (error) {
      this.handleConnectionError(error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Disconnect from the biometric device
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }

      await this.closeConnection();
      
      this.status.connected = false;
      this.status.signalQuality = 0;
      
      console.log(`🔌 ${this.config.name} disconnected`);
      this.emit('disconnected', this.config.id);
      
    } catch (error) {
      console.error(`Error disconnecting ${this.config.name}:`, error);
    }
  }

  /**
   * Read data from the device
   */
  public abstract readData(): Promise<BiometricReading | null>;

  /**
   * Check if device is connected
   */
  public isConnected(): boolean {
    return this.status.connected;
  }

  /**
   * Get current device status
   */
  public getStatus(): DeviceStatus {
    return { ...this.status };
  }

  /**
   * Get device configuration
   */
  public getConfig(): DeviceConfig {
    return { ...this.config };
  }

  /**
   * Update device configuration
   */
  public updateConfig(newConfig: Partial<DeviceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Validate biometric reading quality
   */
  protected validateReading(reading: BiometricReading): boolean {
    // Basic validation rules
    if (reading.quality < 0.3) {
      return false; // Too low quality
    }

    if (Date.now() - reading.timestamp > 10000) {
      return false; // Too old (10 seconds)
    }

    return this.isValidBiometricValue(reading);
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  protected handleConnectionError(error: any): void {
    this.connectionAttempts++;
    this.status.errorCount++;
    this.status.connected = false;

    console.error(`❌ ${this.config.name} connection error (attempt ${this.connectionAttempts}):`, error.message);
    this.emit('error', { deviceId: this.config.id, error, attempt: this.connectionAttempts });

    // Update device health based on error frequency
    this.updateDeviceHealth();

    // Attempt reconnection if within limits
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      this.scheduleReconnection();
    } else {
      console.error(`🚫 ${this.config.name} maximum connection attempts exceeded`);
      this.emit('maxAttemptsExceeded', this.config.id);
    }
  }

  /**
   * Schedule automatic reconnection attempt
   */
  protected scheduleReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.reconnectDelay * this.connectionAttempts; // Exponential backoff
    
    console.log(`🔄 Scheduling ${this.config.name} reconnection in ${delay}ms...`);
    
    this.reconnectTimer = setTimeout(async () => {
      if (!this.status.connected) {
        await this.connect();
      }
    }, delay);
  }

  /**
   * Update device health based on performance metrics
   */
  protected updateDeviceHealth(): void {
    const { errorCount, signalQuality, lastReading } = this.status;
    const timeSinceLastReading = Date.now() - lastReading;
    
    let healthScore = 100;
    
    // Reduce score based on errors
    healthScore -= errorCount * 10;
    
    // Reduce score based on signal quality
    healthScore -= (1 - signalQuality) * 30;
    
    // Reduce score if no recent readings
    if (timeSinceLastReading > 30000) { // 30 seconds
      healthScore -= 20;
    }
    
    // Set health category
    if (healthScore >= 90) {
      this.status.deviceHealth = 'excellent';
    } else if (healthScore >= 75) {
      this.status.deviceHealth = 'good';
    } else if (healthScore >= 50) {
      this.status.deviceHealth = 'fair';
    } else if (healthScore >= 25) {
      this.status.deviceHealth = 'poor';
    } else {
      this.status.deviceHealth = 'critical';
    }
  }

  /**
   * Start continuous data collection
   */
  protected startDataCollection(): void {
    const collectData = async () => {
      if (!this.status.connected) {
        return;
      }

      try {
        const reading = await this.readData();
        
        if (reading && this.validateReading(reading)) {
          this.status.lastReading = reading.timestamp;
          this.status.signalQuality = reading.quality;
          this.updateDeviceHealth();
          
          this.emit('data', reading);
        }
        
      } catch (error) {
        console.error(`Error reading from ${this.config.name}:`, error);
        this.status.errorCount++;
        this.updateDeviceHealth();
      }

      // Schedule next reading
      if (this.status.connected) {
        setTimeout(collectData, this.getReadingInterval());
      }
    };

    // Start collection
    setTimeout(collectData, 100); // Small delay to ensure connection is stable
  }

  /**
   * Get the reading interval for this device type
   */
  protected abstract getReadingInterval(): number;

  /**
   * Establish physical connection to device (device-specific implementation)
   */
  protected abstract establishConnection(): Promise<boolean>;

  /**
   * Close physical connection (device-specific implementation)
   */
  protected abstract closeConnection(): Promise<void>;

  /**
   * Validate biometric value ranges (device-specific implementation)
   */
  protected abstract isValidBiometricValue(reading: BiometricReading): boolean;

  /**
   * Device discovery for this type (static method to be implemented by subclasses)
   */
  public static async discoverDevices(): Promise<DeviceConfig[]> {
    // Base implementation returns empty array
    // Subclasses should override this method
    return [];
  }

  /**
   * Test device connection without full initialization
   */
  public async testConnection(): Promise<boolean> {
    try {
      const connected = await this.establishConnection();
      if (connected) {
        await this.closeConnection();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get device diagnostic information
   */
  public getDiagnostics(): any {
    return {
      config: this.config,
      status: this.status,
      connectionAttempts: this.connectionAttempts,
      isConnecting: this.isConnecting,
      uptime: this.status.connected ? Date.now() - this.status.lastReading : 0
    };
  }

  /**
   * Reset device state (useful for recovery)
   */
  public async reset(): Promise<void> {
    await this.disconnect();
    
    this.connectionAttempts = 0;
    this.status.errorCount = 0;
    this.status.deviceHealth = 'poor';
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    console.log(`🔄 ${this.config.name} reset completed`);
  }
}