// Three-Tier Device Attestation System
// Level 1: Commodity devices (OAuth)
// Level 2: Medical devices (Serial verification)
// Level 3: HSM devices (Cryptographic attestation)

import type { DeviceRegistration } from '../schema';
import * as crypto from 'crypto';

export type DeviceType = 'commodity' | 'medical' | 'hsm';
export type TrustLevel = 1 | 2 | 3;
export type OAuthProvider = 'fitbit' | 'apple' | 'garmin';
export type MedicalDeviceModel = 'polar_h10' | 'muse_s' | 'empatica_e4';

export interface CommodityDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  verified: boolean;
}

export interface DeviceRegistrationParams {
  validatorAddress: string;
  deviceType: DeviceType;
  trustLevel: TrustLevel;
  manufacturer: string;
  serialNumber?: string;
  attestationProof?: string;
  oauthProvider?: OAuthProvider;
  deviceModel?: string;
}

export class DeviceAttestationService {
  /**
   * Level 1: Register commodity device with OAuth verification
   */
  async registerCommodityDevice(
    validatorAddress: string,
    oauthToken: string,
    provider: OAuthProvider
  ): Promise<DeviceRegistration> {
    // Verify OAuth token with provider
    const deviceInfo = await this.verifyWithProvider(provider, oauthToken);
    
    const now = new Date();
    
    return {
      id: 0, // Will be set by database
      deviceId: deviceInfo.id,
      deviceType: 'commodity',
      manufacturer: provider,
      serialNumber: null,
      attestationProof: null,
      trustLevel: 1,
      validatorAddress,
      registeredAt: now,
      lastActivityAt: now,
      isActive: true,
      oauthProvider: provider,
      deviceModel: deviceInfo.name,
      createdAt: now
    };
  }
  
  /**
   * Level 2: Register medical device with serial number verification
   */
  async registerMedicalDevice(
    validatorAddress: string,
    serialNumber: string,
    deviceModel: MedicalDeviceModel
  ): Promise<DeviceRegistration> {
    // Check serial number against manufacturer database
    const isValid = await this.verifySerialNumber(deviceModel, serialNumber);
    
    if (!isValid) {
      throw new Error('Invalid serial number for device model');
    }
    
    const now = new Date();
    
    return {
      id: 0, // Will be set by database
      deviceId: `${deviceModel}_${serialNumber}`,
      deviceType: 'medical',
      manufacturer: this.getManufacturerFromModel(deviceModel),
      serialNumber,
      attestationProof: null,
      trustLevel: 2,
      validatorAddress,
      registeredAt: now,
      lastActivityAt: now,
      isActive: true,
      oauthProvider: null,
      deviceModel,
      createdAt: now
    };
  }
  
  /**
   * Level 3: Register HSM device with cryptographic attestation
   */
  async registerHSMDevice(
    validatorAddress: string,
    attestationProof: string
  ): Promise<DeviceRegistration> {
    // Verify cryptographic signature from TPM/Secure Enclave
    const isValid = await this.verifyAttestationProof(attestationProof);
    
    if (!isValid) {
      throw new Error('Invalid attestation proof');
    }
    
    const deviceId = this.extractDeviceId(attestationProof);
    const now = new Date();
    
    return {
      id: 0, // Will be set by database
      deviceId,
      deviceType: 'hsm',
      manufacturer: 'certified_hsm',
      serialNumber: null,
      attestationProof,
      trustLevel: 3,
      validatorAddress,
      registeredAt: now,
      lastActivityAt: now,
      isActive: true,
      oauthProvider: null,
      deviceModel: 'hsm_tpm',
      createdAt: now
    };
  }

  /**
   * Verify OAuth token with provider API
   */
  private async verifyWithProvider(
    provider: OAuthProvider,
    token: string
  ): Promise<CommodityDeviceInfo> {
    // TODO: Implement actual OAuth verification
    // For now, simulate verification with mock data
    
    switch (provider) {
      case 'fitbit':
        return this.verifyFitbit(token);
      case 'apple':
        return this.verifyAppleHealth(token);
      case 'garmin':
        return this.verifyGarmin(token);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Verify Fitbit OAuth token
   */
  private async verifyFitbit(token: string): Promise<CommodityDeviceInfo> {
    // Placeholder: In production, would call Fitbit API
    // GET https://api.fitbit.com/1/user/-/devices.json
    
    if (!token || token.length < 20) {
      throw new Error('Invalid Fitbit OAuth token');
    }

    // Mock response
    return {
      id: `fitbit_${crypto.randomBytes(8).toString('hex')}`,
      name: 'Fitbit Charge 5',
      manufacturer: 'fitbit',
      verified: true
    };
  }

  /**
   * Verify Apple Health OAuth token
   */
  private async verifyAppleHealth(token: string): Promise<CommodityDeviceInfo> {
    // Placeholder: In production, would verify with Apple HealthKit
    
    if (!token || token.length < 20) {
      throw new Error('Invalid Apple Health OAuth token');
    }

    // Mock response
    return {
      id: `apple_${crypto.randomBytes(8).toString('hex')}`,
      name: 'Apple Watch Series 8',
      manufacturer: 'apple',
      verified: true
    };
  }

  /**
   * Verify Garmin OAuth token
   */
  private async verifyGarmin(token: string): Promise<CommodityDeviceInfo> {
    // Placeholder: In production, would call Garmin Connect API
    
    if (!token || token.length < 20) {
      throw new Error('Invalid Garmin OAuth token');
    }

    // Mock response
    return {
      id: `garmin_${crypto.randomBytes(8).toString('hex')}`,
      name: 'Garmin Vivosmart 5',
      manufacturer: 'garmin',
      verified: true
    };
  }

  /**
   * Verify serial number against manufacturer database
   */
  private async verifySerialNumber(
    deviceModel: MedicalDeviceModel,
    serialNumber: string
  ): Promise<boolean> {
    // Placeholder: In production, would query manufacturer API
    
    // Basic validation: serial number format
    const serialRegex = /^[A-Z0-9]{8,16}$/;
    if (!serialRegex.test(serialNumber)) {
      return false;
    }

    // TODO: Implement actual manufacturer API verification
    // For now, accept any valid format
    return true;
  }

  /**
   * Verify cryptographic attestation proof from HSM
   */
  private async verifyAttestationProof(proof: string): Promise<boolean> {
    // Placeholder: In production, would verify TPM/Secure Enclave signature
    
    try {
      // Basic structure validation
      const decoded = Buffer.from(proof, 'base64');
      
      // TODO: Implement actual cryptographic verification
      // Would need to:
      // 1. Extract signature from proof
      // 2. Extract device public key
      // 3. Verify signature against known TPM/SE certificate chain
      // 4. Check certificate not revoked
      
      // For now, accept if it's valid base64 and sufficient length
      return decoded.length >= 128;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract device ID from attestation proof
   */
  private extractDeviceId(proof: string): string {
    // Placeholder: In production, would extract from cryptographic proof
    
    // Generate deterministic ID from proof hash
    const hash = crypto.createHash('sha256').update(proof).digest('hex');
    return `hsm_${hash.substring(0, 16)}`;
  }

  /**
   * Get manufacturer name from device model
   */
  private getManufacturerFromModel(model: MedicalDeviceModel): string {
    const manufacturers: Record<MedicalDeviceModel, string> = {
      'polar_h10': 'Polar Electro',
      'muse_s': 'Muse',
      'empatica_e4': 'Empatica'
    };
    
    return manufacturers[model];
  }

  /**
   * Update device activity timestamp
   */
  async updateDeviceActivity(deviceId: string): Promise<void> {
    // This would be called by storage layer
    // Implementation in storage.ts
  }

  /**
   * Deactivate device (e.g., for security reasons)
   */
  async deactivateDevice(deviceId: string, reason: string): Promise<void> {
    // This would be called by storage layer
    // Implementation in storage.ts
  }

  /**
   * Validate device trust level matches registration
   */
  validateTrustLevel(device: DeviceRegistration): boolean {
    const expectedTrustLevel = this.getTrustLevelForType(device.deviceType as DeviceType);
    return device.trustLevel === expectedTrustLevel;
  }

  /**
   * Get expected trust level for device type
   */
  private getTrustLevelForType(deviceType: DeviceType): TrustLevel {
    switch (deviceType) {
      case 'commodity': return 1;
      case 'medical': return 2;
      case 'hsm': return 3;
      default: return 1;
    }
  }
}

export const deviceAttestationService = new DeviceAttestationService();
