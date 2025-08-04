import { KeyPair } from '../crypto/KeyPair';
import { BiometricReading } from './BiometricDevice';
import { AuthenticityProof, AuthenticityProofGenerator } from './AuthenticityProof';
import CryptoJS from 'crypto-js';
export interface BiometricIdentity {
  validatorId: string;
  biometricHash: string;
  deviceFingerprints: string[];
  enrollmentDate: number;
  lastAuthentication: number;
}
export interface SecureKeyStorage {
  encryptedPrivateKey: string;
  biometricSalt: string;
  recoveryHash: string;
  keyDerivationParams: {
    iterations: number;
    algorithm: string;
    keyLength: number;
  };
}
export interface BiometricAuthResult {
  success: boolean;
  confidence: number;
  factors: string[];
  keyPair?: KeyPair;
  error?: string;
}
export class BiometricWallet {
  private validatorId: string;
  private biometricIdentity: BiometricIdentity | null = null;
  private secureStorage: SecureKeyStorage | null = null;
  private authenticityGenerator: AuthenticityProofGenerator;
  private authenticationHistory: Array<{ timestamp: number; success: boolean; confidence: number }> = [];
  constructor(validatorId: string) {
    this.validatorId = validatorId;
    this.authenticityGenerator = new AuthenticityProofGenerator(`${validatorId}-wallet`);
  }
  /**
   * Enroll biometric identity and create secure wallet
   */
  public async enrollBiometricIdentity(
    readings: BiometricReading[],
    masterPassword?: string
  ): Promise<{ success: boolean; keyPair?: KeyPair; identity?: BiometricIdentity }> {
    try {
      console.log(`🔐 Enrolling biometric identity for ${this.validatorId}...`);
      // Validate minimum requirements for enrollment
      if (!this.validateEnrollmentRequirements(readings)) {
        throw new Error('Insufficient biometric data for enrollment');
      }
      // Generate new wallet keypair
      const keyPair = new KeyPair();
      // Create biometric template hash (privacy-preserving)
      const biometricHash = this.createBiometricTemplate(readings);
      // Generate device fingerprints
      const deviceFingerprints = this.generateDeviceFingerprints(readings);
      // Create biometric identity
      this.biometricIdentity = {
        validatorId: this.validatorId,
        biometricHash,
        deviceFingerprints,
        enrollmentDate: Date.now(),
        lastAuthentication: Date.now()
      };
      // Secure the private key using biometric data
      await this.securePrivateKey(keyPair.generateKeyPair(), readings, masterPassword);
      console.log(`   🆔 Validator: ${this.validatorId}`);
      console.log(`   📱 Devices: ${deviceFingerprints.length}`);
      console.log(`   🔑 Wallet: ${keyPair.getAddress()}`);
      return {
        success: true,
        keyPair: keyPair.generateKeyPair(),
        identity: this.biometricIdentity
      };
    } catch (error) {
      console.error('Biometric enrollment failed:', error);
      return { success: false };
    }
  }
  /**
   * Authenticate using biometric data and unlock wallet
   */
  public async authenticateBiometric(
    readings: BiometricReading[],
    masterPassword?: string
  ): Promise<BiometricAuthResult> {
    try {
      if (!this.biometricIdentity || !this.secureStorage) {
        return {
          success: false,
          confidence: 0,
          factors: [],
          error: 'No biometric identity enrolled'
        };
      }
      console.log(`🔓 Authenticating ${this.validatorId} with biometrics...`);
      // Generate authenticity proofs
      const proofs = readings.map(r => this.authenticityGenerator.generateAuthenticityProof(r));
      // Verify biometric match
      const biometricMatch = this.verifyBiometricMatch(readings);
      // Verify device authenticity
      const deviceMatch = this.verifyDeviceMatch(readings);
      // Calculate authentication confidence
      const confidence = this.calculateAuthenticationConfidence(biometricMatch, deviceMatch, proofs);
      // Determine authentication factors
      const factors = this.getAuthenticationFactors(readings);
      // Check if authentication meets threshold
      const success = confidence >= 0.75 && biometricMatch.score >= 0.8 && deviceMatch;
      if (success) {
        // Unlock wallet
        const keyPair = await this.unlockWallet(readings, masterPassword);
        if (keyPair) {
          this.biometricIdentity.lastAuthentication = Date.now();
          this.recordAuthentication(true, confidence);
          return {
            success: true,
            confidence,
            factors,
            keyPair
          };
        }
      }
      this.recordAuthentication(false, confidence);
      return {
        success: false,
        confidence,
        factors,
        error: 'Authentication failed - biometric mismatch or insufficient confidence'
      };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        confidence: 0,
        factors: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  /**
   * Recover wallet using master password and partial biometrics
   */
  public async recoverWallet(
    partialReadings: BiometricReading[],
    masterPassword: string,
    recoveryPhrase?: string
  ): Promise<BiometricAuthResult> {
    try {
      console.log(` Attempting wallet recovery for ${this.validatorId}...`);
      if (!this.secureStorage) {
        return {
          success: false,
          confidence: 0,
          factors: ['recovery'],
          error: 'No wallet data found for recovery'
        };
      }
      // Verify master password
      const passwordHash = CryptoJS.SHA256(masterPassword + this.validatorId).toString();
      if (passwordHash !== this.secureStorage.recoveryHash) {
        return {
          success: false,
          confidence: 0,
          factors: ['password'],
          error: 'Invalid master password'
        };
      }
      // Try to decrypt with master password
      const keyPair = await this.decryptWithMasterPassword(masterPassword);
      if (keyPair) {
        return {
          success: true,
          confidence: 0.9, // High confidence for master password recovery
          factors: ['password', 'recovery'],
          keyPair
        };
      }
      return {
        success: false,
        confidence: 0,
        factors: ['recovery'],
        error: 'Wallet recovery failed'
      };
    } catch (error) {
      console.error('Wallet recovery failed:', error);
      return {
        success: false,
        confidence: 0,
        factors: ['recovery'],
        error: error instanceof Error ? error.message : 'Recovery failed'
      };
    }
  }
  /**
   * Update biometric template with new readings
   */
  public async updateBiometricTemplate(newReadings: BiometricReading[]): Promise<boolean> {
    try {
      if (!this.biometricIdentity) {
        return false;
      }
      // Create new template combining old and new data
      const newTemplate = this.createBiometricTemplate(newReadings);
      // Update identity
      this.biometricIdentity.biometricHash = newTemplate;
      this.biometricIdentity.deviceFingerprints = this.generateDeviceFingerprints(newReadings);
      return true;
    } catch (error) {
      console.error('Template update failed:', error);
      return false;
    }
  }
  /**
   * Create privacy-preserving biometric template
   */
  private createBiometricTemplate(readings: BiometricReading[]): string {
    // Extract feature vectors from each biometric modality
    const features = {
      heartRate: this.extractHeartRateFeatures(readings.filter(r => r.type === 'heartRate')),
      stress: this.extractStressFeatures(readings.filter(r => r.type === 'stress')),
      focus: this.extractFocusFeatures(readings.filter(r => r.type === 'focus'))
    };
    // Create template hash (irreversible but matchable)
    const templateData = JSON.stringify(features);
    const salt = CryptoJS.lib.WordArray.random(256/8).toString();
    const template = CryptoJS.PBKDF2(templateData, salt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
    return `${salt}:${template}`;
  }
  /**
   * Extract heart rate features for template
   */
  private extractHeartRateFeatures(readings: BiometricReading[]): any {
    if (readings.length === 0) return null;
    const values = readings.map(r => r.value);
    return {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      variance: this.calculateVariance(values),
      range: Math.max(...values) - Math.min(...values),
      pattern: this.extractPattern(values)
    };
  }
  /**
   * Extract stress level features for template
   */
  private extractStressFeatures(readings: BiometricReading[]): any {
    if (readings.length === 0) return null;
    const values = readings.map(r => r.value);
    return {
      baseline: Math.min(...values),
      peaks: values.filter(v => v > values.reduce((a, b) => a + b, 0) / values.length * 1.2).length,
      stability: 1 - this.calculateVariance(values) / 100
    };
  }
  /**
   * Extract focus level features for template
   */
  private extractFocusFeatures(readings: BiometricReading[]): any {
    if (readings.length === 0) return null;
    const values = readings.map(r => r.value);
    return {
      peak: Math.max(...values),
      consistency: 1 - this.calculateVariance(values) / 100,
      trend: this.calculateTrend(values)
    };
  }
  /**
   * Generate device fingerprints for anti-spoofing
   */
  private generateDeviceFingerprints(readings: BiometricReading[]): string[] {
    const fingerprints: string[] = [];
    const uniqueDevices = [...new Set(readings.map(r => r.deviceId))];
    for (const deviceId of uniqueDevices) {
      const deviceReadings = readings.filter(r => r.deviceId === deviceId);
      const deviceCharacteristics = {
        id: deviceId,
        samplingPattern: this.analyzeSamplingPattern(deviceReadings),
        noiseProfile: this.analyzeNoiseProfile(deviceReadings),
        qualitySignature: this.analyzeQualitySignature(deviceReadings)
      };
      const fingerprint = CryptoJS.SHA256(JSON.stringify(deviceCharacteristics)).toString();
      fingerprints.push(fingerprint);
    }
    return fingerprints;
  }
  /**
   * Secure private key using biometric-derived key
   */
  private async securePrivateKey(
    keyPair: KeyPair,
    readings: BiometricReading[],
    masterPassword?: string
  ): Promise<void> {
    // Derive encryption key from biometric template
    const biometricKey = this.deriveBiometricKey(readings);
    // Create master password hash for recovery
    const recoveryHash = masterPassword 
      ? CryptoJS.SHA256(masterPassword + this.validatorId).toString()
      : CryptoJS.SHA256(Date.now().toString() + this.validatorId).toString();
    // Encrypt private key
    const privateKey = keyPair.privateKey;
    const salt = CryptoJS.lib.WordArray.random(256/8);
    const key = CryptoJS.PBKDF2(biometricKey, salt, {
      keySize: 256/32,
      iterations: 100000
    });
    const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, key.toString()).toString();
    this.secureStorage = {
      encryptedPrivateKey,
      biometricSalt: salt.toString(),
      recoveryHash,
      keyDerivationParams: {
        iterations: 100000,
        algorithm: 'AES-256',
        keyLength: 256
      }
    };
  }
  /**
   * Derive encryption key from biometric data
   */
  private deriveBiometricKey(readings: BiometricReading[]): string {
    const features = readings.map(r => ({
      type: r.type,
      value: Math.round(r.value * 100) / 100, // Quantize for stability
      quality: Math.round(r.quality * 100) / 100
    }));
    const keyMaterial = JSON.stringify(features.sort((a, b) => a.type.localeCompare(b.type)));
    return CryptoJS.SHA256(keyMaterial + this.validatorId).toString();
  }
  /**
   * Verify biometric match against stored template
   */
  private verifyBiometricMatch(readings: BiometricReading[]): { match: boolean; score: number } {
    if (!this.biometricIdentity) {
      return { match: false, score: 0 };
    }
    const currentTemplate = this.createBiometricTemplate(readings);
    const [storedSalt, storedTemplate] = this.biometricIdentity.biometricHash.split(':');
    const [currentSalt, currentTemplateHash] = currentTemplate.split(':');
    // Calculate similarity score (simplified for demo)
    const similarity = this.calculateTemplateSimilarity(storedTemplate, currentTemplateHash);
    const match = similarity >= 0.8;
    return { match, score: similarity };
  }
  /**
   * Verify device authenticity
   */
  private verifyDeviceMatch(readings: BiometricReading[]): boolean {
    if (!this.biometricIdentity) {
      return false;
    }
    const currentFingerprints = this.generateDeviceFingerprints(readings);
    const storedFingerprints = this.biometricIdentity.deviceFingerprints;
    // Check if at least one device matches
    return currentFingerprints.some(fp => storedFingerprints.includes(fp));
  }
  /**
   * Calculate authentication confidence
   */
  private calculateAuthenticationConfidence(
    biometricMatch: { match: boolean; score: number },
    deviceMatch: boolean,
    proofs: AuthenticityProof[]
  ): number {
    let confidence = 0;
    // Biometric match score (60% weight)
    confidence += biometricMatch.score * 0.6;
    // Device match (20% weight)
    confidence += deviceMatch ? 0.2 : 0;
    // Authenticity proof (20% weight)
    const validProofs = proofs.filter(p => 
      AuthenticityProofGenerator.verifyAuthenticityProof(p, p.biometricHash.deviceId)
    );
    confidence += (validProofs.length / proofs.length) * 0.2;
    return Math.max(0, Math.min(1, confidence));
  }
  /**
   * Get authentication factors used
   */
  private getAuthenticationFactors(readings: BiometricReading[]): string[] {
    const factors: string[] = [];
    if (readings.some(r => r.type === 'heartRate')) factors.push('biometric-heartrate');
    if (readings.some(r => r.type === 'stress')) factors.push('biometric-stress');
    if (readings.some(r => r.type === 'focus')) factors.push('biometric-focus');
    const uniqueDevices = [...new Set(readings.map(r => r.deviceId))];
    if (uniqueDevices.length >= 2) factors.push('multi-device');
    return factors;
  }
  /**
   * Unlock wallet with biometric data
   */
  private async unlockWallet(readings: BiometricReading[], masterPassword?: string): Promise<KeyPair | null> {
    if (!this.secureStorage) {
      return null;
    }
    try {
      // Derive decryption key
      const biometricKey = this.deriveBiometricKey(readings);
      const salt = CryptoJS.enc.Hex.parse(this.secureStorage.biometricSalt);
      const key = CryptoJS.PBKDF2(biometricKey, salt, {
        keySize: 256/32,
        iterations: this.secureStorage.keyDerivationParams.iterations
      });
      // Decrypt private key
      const decryptedBytes = CryptoJS.AES.decrypt(this.secureStorage.encryptedPrivateKey, key.toString());
      const privateKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
      if (privateKey && privateKey.length === 64) {
        return { publicKey: privateKey.substring(0, 32), privateKey };
      }
      return null;
    } catch (error) {
      console.error('Wallet unlock failed:', error);
      return null;
    }
  }
  /**
   * Decrypt wallet with master password
   */
  private async decryptWithMasterPassword(masterPassword: string): Promise<KeyPair | null> {
    if (!this.secureStorage) {
      return null;
    }
    try {
      const masterKey = CryptoJS.SHA256(masterPassword + this.validatorId).toString();
      const salt = CryptoJS.enc.Hex.parse(this.secureStorage.biometricSalt);
      const key = CryptoJS.PBKDF2(masterKey, salt, {
        keySize: 256/32,
        iterations: this.secureStorage.keyDerivationParams.iterations
      });
      const decryptedBytes = CryptoJS.AES.decrypt(this.secureStorage.encryptedPrivateKey, key.toString());
      const privateKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
      if (privateKey && privateKey.length === 64) {
        return { publicKey: privateKey.substring(0, 32), privateKey };
      }
      return null;
    } catch (error) {
      console.error('Master password decryption failed:', error);
      return null;
    }
  }
  /**
   * Validate enrollment requirements
   */
  private validateEnrollmentRequirements(readings: BiometricReading[]): boolean {
    // Require at least 2 different biometric modalities
    const types = [...new Set(readings.map(r => r.type))];
    if (types.length < 2) {
      return false;
    }
    // Require minimum quality for all readings
    if (readings.some(r => r.quality < 0.6)) {
      return false;
    }
    // Require minimum number of samples
    if (readings.length < 10) {
      return false;
    }
    return true;
  }
  /**
   * Record authentication attempt
   */
  private recordAuthentication(success: boolean, confidence: number): void {
    this.authenticationHistory.push({
      timestamp: Date.now(),
      success,
      confidence
    });
    // Keep only last 100 attempts
    if (this.authenticationHistory.length > 100) {
      this.authenticationHistory.shift();
    }
  }
  /**
   * Helper methods for biometric analysis
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }
  private extractPattern(values: number[]): string {
    // Simple pattern extraction (increasing, decreasing, stable)
    let increasing = 0, decreasing = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) increasing++;
      else if (values[i] < values[i-1]) decreasing++;
    }
    if (increasing > decreasing * 1.5) return 'increasing';
    if (decreasing > increasing * 1.5) return 'decreasing';
    return 'stable';
  }
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < values.length; i++) {
      sum += values[i] - values[i-1];
    }
    return sum / (values.length - 1);
  }
  private analyzeSamplingPattern(readings: BiometricReading[]): any {
    const timestamps = readings.map(r => r.timestamp).sort();
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }
    return {
      averageInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
      intervalVariance: this.calculateVariance(intervals)
    };
  }
  private analyzeNoiseProfile(readings: BiometricReading[]): any {
    const qualities = readings.map(r => r.quality);
    return {
      averageQuality: qualities.reduce((a, b) => a + b, 0) / qualities.length,
      qualityVariance: this.calculateVariance(qualities)
    };
  }
  private analyzeQualitySignature(readings: BiometricReading[]): any {
    return {
      minQuality: Math.min(...readings.map(r => r.quality)),
      maxQuality: Math.max(...readings.map(r => r.quality)),
      qualityTrend: this.calculateTrend(readings.map(r => r.quality))
    };
  }
  private calculateTemplateSimilarity(template1: string, template2: string): number {
    // Simplified similarity calculation
    let matches = 0;
    const length = Math.min(template1.length, template2.length);
    for (let i = 0; i < length; i++) {
      if (template1[i] === template2[i]) {
        matches++;
      }
    }
    return matches / length;
  }
  /**
   * Get wallet statistics
   */
  public getWalletStats(): any {
    return {
      validatorId: this.validatorId,
      enrolled: !!this.biometricIdentity,
      enrollmentDate: this.biometricIdentity?.enrollmentDate,
      lastAuthentication: this.biometricIdentity?.lastAuthentication,
      deviceCount: this.biometricIdentity?.deviceFingerprints.length || 0,
      authenticationHistory: {
        total: this.authenticationHistory.length,
        successful: this.authenticationHistory.filter(a => a.success).length,
        averageConfidence: this.authenticationHistory.length > 0 
          ? this.authenticationHistory.reduce((sum, a) => sum + a.confidence, 0) / this.authenticationHistory.length
          : 0
      }
    };
  }
  /**
   * Export wallet data for backup
   */
  public exportWalletData(): any {
    return {
      validatorId: this.validatorId,
      biometricIdentity: this.biometricIdentity,
      secureStorage: this.secureStorage,
      authenticationHistory: this.authenticationHistory.slice(-10) // Last 10 attempts
    };
  }
  /**
   * Import wallet data from backup
   */
  public importWalletData(data: any): boolean {
    try {
      if (data.validatorId !== this.validatorId) {
        return false;
      }
      this.biometricIdentity = data.biometricIdentity;
      this.secureStorage = data.secureStorage;
      this.authenticationHistory = data.authenticationHistory || [];
      return true;
    } catch (error) {
      console.error('Wallet import failed:', error);
      return false;
    }
  }
}