import { randomBytes, createHash, createSign, createVerify } from 'crypto';
import { ec as EC } from 'elliptic';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface Signature {
  r: string;
  s: string;
  recoveryParam?: number;
}

/**
 * Cryptographic key pair management for biometric wallet
 * Uses secp256k1 elliptic curve for blockchain compatibility
 */
export class BiometricKeyPair {
  private ec: EC;
  private keyPair: EC.KeyPair | null = null;

  constructor() {
    this.ec = new EC('secp256k1');
  }

  /**
   * Generate new key pair from secure random entropy
   */
  generateKeyPair(): KeyPair {
    const entropy = randomBytes(32);
    this.keyPair = this.ec.genKeyPair({ entropy });

    return {
      publicKey: this.keyPair.getPublic('hex'),
      privateKey: this.keyPair.getPrivate('hex')
    };
  }

  /**
   * Generate deterministic key pair from biometric seed
   */
  generateFromBiometric(biometricSeed: Buffer): KeyPair {
    // Hash biometric data to create deterministic seed
    const hash = createHash('sha256').update(biometricSeed).digest();
    this.keyPair = this.ec.keyFromPrivate(hash);

    return {
      publicKey: this.keyPair.getPublic('hex'),
      privateKey: this.keyPair.getPrivate('hex')
    };
  }

  /**
   * Load existing key pair
   */
  loadKeyPair(privateKey: string): KeyPair {
    this.keyPair = this.ec.keyFromPrivate(privateKey, 'hex');

    return {
      publicKey: this.keyPair.getPublic('hex'),
      privateKey: this.keyPair.getPrivate('hex')
    };
  }

  /**
   * Sign data with private key
   */
  sign(data: Buffer): Signature {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    const hash = createHash('sha256').update(data).digest();
    const signature = this.keyPair.sign(hash);

    return {
      r: signature.r.toString('hex'),
      s: signature.s.toString('hex'),
      recoveryParam: signature.recoveryParam
    };
  }

  /**
   * Verify signature with public key
   */
  verify(data: Buffer, signature: Signature, publicKey?: string): boolean {
    try {
      const pubKey = publicKey ? this.ec.keyFromPublic(publicKey, 'hex') : this.keyPair;
      if (!pubKey) {
        throw new Error('Public key not available');
      }

      const hash = createHash('sha256').update(data).digest();
      return pubKey.verify(hash, {
        r: signature.r,
        s: signature.s,
        recoveryParam: signature.recoveryParam
      });
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get blockchain address from public key
   */
  getAddress(): string {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    const publicKey = this.keyPair.getPublic('hex');
    const hash = createHash('sha256').update(Buffer.from(publicKey, 'hex')).digest();
    const ripemd = createHash('ripemd160').update(hash).digest();
    
    return '0x' + ripemd.toString('hex').slice(0, 40);
  }

  /**
   * Export public key in multiple formats
   */
  exportPublicKey(format: 'hex' | 'pem' | 'compressed' = 'hex'): string {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    switch (format) {
      case 'hex':
        return this.keyPair.getPublic('hex');
      case 'compressed':
        return this.keyPair.getPublic(true, 'hex');
      case 'pem':
        // Convert to PEM format for compatibility
        const publicKeyHex = this.keyPair.getPublic('hex');
        return `-----BEGIN PUBLIC KEY-----\n${Buffer.from(publicKeyHex, 'hex').toString('base64')}\n-----END PUBLIC KEY-----`;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Create shared secret for ECDH key exchange
   */
  createSharedSecret(otherPublicKey: string): Buffer {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    const otherKey = this.ec.keyFromPublic(otherPublicKey, 'hex');
    const shared = this.keyPair.derive(otherKey.getPublic());
    
    return Buffer.from(shared.toString(16).padStart(64, '0'), 'hex');
  }

  /**
   * Validate key pair integrity
   */
  validateKeyPair(): boolean {
    if (!this.keyPair) {
      return false;
    }

    try {
      // Test signing and verification
      const testData = Buffer.from('test-validation-data', 'utf8');
      const signature = this.sign(testData);
      return this.verify(testData, signature);
    } catch (error) {
      console.error('Key pair validation failed:', error);
      return false;
    }
  }

  /**
   * Clear sensitive key material from memory
   */
  destroy(): void {
    if (this.keyPair) {
      // Zero out private key in memory (best effort)
      const privKey = this.keyPair.getPrivate();
      if (privKey) {
        // @ts-ignore - Accessing internal structure to clear
        privKey.words?.fill(0);
      }
      this.keyPair = null;
    }
  }
}

export default BiometricKeyPair;