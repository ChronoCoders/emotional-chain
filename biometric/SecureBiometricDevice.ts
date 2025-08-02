import { BiometricDevice, BiometricReading, DeviceConfig } from './BiometricDevice';
import { createCipherGCM, createDecipherGCM, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface EncryptedBiometric {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
  timestamp: number;
  deviceFingerprint: string;
}

export interface DeviceAttestation {
  deviceId: string;
  hardwareSignature: Buffer;
  firmwareVersion: string;
  securityLevel: 'basic' | 'enhanced' | 'hardware_backed';
  attestationTimestamp: number;
  isValid: boolean;
}

/**
 * Security-hardened biometric device with authenticated encryption,
 * device attestation, and anti-tampering measures
 */
export class SecureBiometricDevice extends BiometricDevice {
  private encryptionKey: Buffer | null = null;
  private deviceFingerprint: string;
  private attestation: DeviceAttestation | null = null;
  private rateLimiter: Map<string, number[]> = new Map();
  
  // Security configuration
  private readonly MAX_READINGS_PER_MINUTE = 60;
  private readonly MAX_FAILED_ATTESTATIONS = 3;
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly KEY_DERIVATION_ITERATIONS = 100000;
  
  private failedAttestations = 0;
  private lastAttestationTime = 0;
  private isCompromised = false;

  constructor(config: DeviceConfig) {
    super(config);
    this.deviceFingerprint = this.generateDeviceFingerprint();
    this.initializeSecurityFeatures();
  }

  /**
   * Initialize security features and derive encryption keys
   */
  private async initializeSecurityFeatures(): Promise<void> {
    try {
      // Derive device-specific encryption key
      await this.deriveEncryptionKey();
      
      // Perform initial device attestation
      await this.performDeviceAttestation();
      
      // Initialize rate limiting
      this.rateLimiter.set(this.config.id, []);
      
      console.log(`🔒 Secure biometric device initialized: ${this.config.name}`);
    } catch (error) {
      console.error('Failed to initialize security features:', error);
      this.isCompromised = true;
    }
  }

  /**
   * Derive encryption key from master key and device-specific data
   */
  private async deriveEncryptionKey(): Promise<void> {
    if (!process.env.DEVICE_MASTER_KEY) {
      throw new Error('DEVICE_MASTER_KEY environment variable not set');
    }

    const salt = Buffer.from(this.deviceFingerprint + this.config.id, 'utf8');
    
    this.encryptionKey = await scryptAsync(
      process.env.DEVICE_MASTER_KEY,
      salt,
      32 // 256-bit key
    ) as Buffer;
  }

  /**
   * Generate unique device fingerprint based on hardware characteristics
   */
  private generateDeviceFingerprint(): string {
    // In production, this would use actual hardware identifiers
    const components = [
      this.config.id,
      this.config.type,
      this.config.connectionType,
      this.config.address || 'unknown',
      process.platform,
      Date.now().toString(36)
    ];
    
    return Buffer.from(components.join('|'), 'utf8').toString('base64');
  }

  /**
   * Perform device attestation to verify hardware integrity
   */
  private async performDeviceAttestation(): Promise<DeviceAttestation> {
    try {
      // Simulate hardware attestation process
      // In production, this would involve TPM/HSM verification
      
      const hardwareSignature = randomBytes(32);
      const firmwareVersion = '1.2.3'; // Would be read from device
      
      // Determine security level based on device capabilities
      let securityLevel: 'basic' | 'enhanced' | 'hardware_backed' = 'basic';
      
      if (this.config.type.includes('medical') || this.config.type.includes('professional')) {
        securityLevel = 'enhanced';
      }
      
      if (process.env.NODE_ENV === 'production' && this.config.connectionType === 'usb') {
        securityLevel = 'hardware_backed';
      }

      this.attestation = {
        deviceId: this.config.id,
        hardwareSignature,
        firmwareVersion,
        securityLevel,
        attestationTimestamp: Date.now(),
        isValid: true
      };

      this.failedAttestations = 0;
      this.lastAttestationTime = Date.now();
      
      return this.attestation;
    } catch (error) {
      this.failedAttestations++;
      
      if (this.failedAttestations >= this.MAX_FAILED_ATTESTATIONS) {
        this.isCompromised = true;
        this.emit('device-compromised', {
          deviceId: this.config.id,
          reason: 'Too many failed attestations',
          timestamp: Date.now()
        });
      }
      
      throw new Error(`Device attestation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt biometric data with authenticated encryption
   */
  private async encryptBiometricData(data: BiometricReading): Promise<EncryptedBiometric> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    if (this.isCompromised) {
      throw new Error('Device is compromised - refusing to encrypt data');
    }

    const iv = randomBytes(16);
    const cipher = createCipherGCM(this.ENCRYPTION_ALGORITHM, this.encryptionKey, iv);
    cipher.setAAD(Buffer.from(this.deviceFingerprint)); // Additional authenticated data
    
    const dataString = JSON.stringify({
      ...data,
      deviceFingerprint: this.deviceFingerprint,
      attestationTimestamp: this.attestation?.attestationTimestamp
    });
    
    const encrypted = Buffer.concat([
      cipher.update(dataString, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv,
      authTag,
      timestamp: Date.now(),
      deviceFingerprint: this.deviceFingerprint
    };
  }

  /**
   * Decrypt biometric data with authentication verification
   */
  private async decryptBiometricData(encryptedData: EncryptedBiometric): Promise<BiometricReading> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    // Verify device fingerprint
    if (encryptedData.deviceFingerprint !== this.deviceFingerprint) {
      throw new Error('Device fingerprint mismatch - potential tampering detected');
    }

    const decipher = createDecipherGCM(this.ENCRYPTION_ALGORITHM, this.encryptionKey, encryptedData.iv);
    decipher.setAAD(Buffer.from(this.deviceFingerprint));
    decipher.setAuthTag(encryptedData.authTag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(encryptedData.encrypted),
        decipher.final()
      ]);

      const decryptedData = JSON.parse(decrypted.toString('utf8'));
      
      // Verify data integrity
      if (decryptedData.deviceFingerprint !== this.deviceFingerprint) {
        throw new Error('Data integrity check failed');
      }

      return decryptedData as BiometricReading;
    } catch (error) {
      this.emit('decryption-failed', {
        deviceId: this.config.id,
        error: error.message,
        timestamp: Date.now()
      });
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Rate limiting to prevent biometric data farming
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const readings = this.rateLimiter.get(this.config.id) || [];
    
    // Remove readings older than 1 minute
    const recentReadings = readings.filter(timestamp => now - timestamp < 60000);
    
    if (recentReadings.length >= this.MAX_READINGS_PER_MINUTE) {
      this.emit('rate-limit-exceeded', {
        deviceId: this.config.id,
        currentRate: recentReadings.length,
        maxRate: this.MAX_READINGS_PER_MINUTE,
        timestamp: now
      });
      return false;
    }
    
    // Add current reading timestamp
    recentReadings.push(now);
    this.rateLimiter.set(this.config.id, recentReadings);
    
    return true;
  }

  /**
   * Override readData with security enhancements
   */
  public async readData(): Promise<BiometricReading | null> {
    // Check if device is compromised
    if (this.isCompromised) {
      throw new Error('Device is compromised - data reading disabled');
    }

    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded - too many readings requested');
    }

    // Re-attest device periodically (every 10 minutes)
    const timeSinceAttestation = Date.now() - this.lastAttestationTime;
    if (timeSinceAttestation > 600000) { // 10 minutes
      try {
        await this.performDeviceAttestation();
      } catch (error) {
        console.warn('Device re-attestation failed:', error.message);
      }
    }

    // Get raw biometric data
    const rawData = await super.readData();
    if (!rawData) {
      return null;
    }

    // Enhance reading with security metadata
    const secureReading: BiometricReading = {
      ...rawData,
      rawData: {
        ...rawData.rawData,
        securityLevel: this.attestation?.securityLevel,
        attestationValid: this.attestation?.isValid,
        deviceFingerprint: this.deviceFingerprint
      }
    };

    return secureReading;
  }

  /**
   * Get device security status
   */
  public getSecurityStatus(): {
    isCompromised: boolean;
    attestationValid: boolean;
    securityLevel: string;
    failedAttestations: number;
    lastAttestationTime: number;
  } {
    return {
      isCompromised: this.isCompromised,
      attestationValid: this.attestation?.isValid || false,
      securityLevel: this.attestation?.securityLevel || 'unknown',
      failedAttestations: this.failedAttestations,
      lastAttestationTime: this.lastAttestationTime
    };
  }

  /**
   * Force device re-attestation
   */
  public async reAttest(): Promise<DeviceAttestation> {
    return await this.performDeviceAttestation();
  }

  /**
   * Secure device shutdown with key erasure
   */
  public async secureShutdown(): Promise<void> {
    // Overwrite encryption key
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }

    // Clear rate limiting data
    this.rateLimiter.clear();

    // Mark as compromised to prevent further use
    this.isCompromised = true;

    await super.disconnect();
    
    this.emit('secure-shutdown', {
      deviceId: this.config.id,
      timestamp: Date.now()
    });
  }
}