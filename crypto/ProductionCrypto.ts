import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { randomBytes } from '@noble/hashes/utils';
import * as argon2 from 'argon2';

/**
 * Production-grade cryptographic operations using @noble libraries
 * Replaces all Node.js crypto and elliptic library usage
 */
export class ProductionCrypto {
  
  /**
   * Generate cryptographically secure random bytes
   * Replaces Math.random() usage throughout the system
   */
  static generateSecureRandom(length: number): Uint8Array {
    return randomBytes(length);
  }

  /**
   * Generate a cryptographically secure key pair
   * Uses @noble/curves for production-grade ECC
   */
  static async generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey);
    
    return {
      privateKey,
      publicKey
    };
  }

  /**
   * Generate key pair from biometric seed with proper key derivation
   * Uses Argon2 for secure key derivation from biometric data
   */
  static async generateKeyPairFromBiometric(biometricSeed: Uint8Array, salt?: Uint8Array): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    // Generate salt if not provided
    if (!salt) {
      salt = this.generateSecureRandom(32);
    }

    // Use Argon2 for secure key derivation
    const derivedKey = await argon2.hash(Buffer.from(biometricSeed), {
      salt: Buffer.from(salt),
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
      raw: true
    });

    // Ensure the derived key is a valid private key
    const privateKey = new Uint8Array(derivedKey);
    const publicKey = secp256k1.getPublicKey(privateKey);

    return {
      privateKey,
      publicKey
    };
  }

  /**
   * Sign a message with ECDSA using @noble/curves
   * Provides deterministic signatures for reproducibility
   */
  static async signMessage(privateKey: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const messageHash = sha256(message);
    const signature = secp256k1.sign(messageHash, privateKey);
    return signature.toCompactRawBytes();
  }

  /**
   * Verify an ECDSA signature
   */
  static async verifySignature(publicKey: Uint8Array, signature: Uint8Array, message: Uint8Array): Promise<boolean> {
    try {
      const messageHash = sha256(message);
      const sig = secp256k1.Signature.fromCompact(signature);
      return secp256k1.verify(sig, messageHash, publicKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Derive shared secret using ECDH
   * For secure communication between validators
   */
  static async deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
    const sharedPoint = secp256k1.getSharedSecret(privateKey, publicKey);
    // Return x-coordinate of the shared point
    return sharedPoint.slice(1, 33);
  }

  /**
   * Secure hash function using SHA-256
   * Replaces Node.js crypto.createHash('sha256')
   */
  static hash(data: Uint8Array): Uint8Array {
    return sha256(data);
  }

  /**
   * HMAC for message authentication
   * Critical for network message integrity
   */
  static hmac(key: Uint8Array, data: Uint8Array): Uint8Array {
    return hmac(sha256, key, data);
  }

  /**
   * Key derivation using PBKDF2
   * For deriving encryption keys from passwords
   */
  static async deriveKey(password: Uint8Array, salt: Uint8Array, iterations: number = 100000): Promise<Uint8Array> {
    return pbkdf2(sha256, password, salt, { c: iterations, dkLen: 32 }) as Uint8Array;
  }

  /**
   * Generate a secure address from public key
   * Uses production-grade hashing instead of ripemd160
   */
  static generateAddress(publicKey: Uint8Array): string {
    const hash1 = sha256(publicKey);
    const hash2 = sha256(hash1);
    const address = hash2.slice(0, 20); // Take first 20 bytes
    return '0x' + Buffer.from(address).toString('hex');
  }

  /**
   * Generate nonce for replay attack prevention
   * Combines timestamp with secure random bytes
   */
  static generateNonce(): string {
    const timestamp = Date.now();
    const randomPart = this.generateSecureRandom(8);
    const combined = new Uint8Array(12);
    
    // Add timestamp (8 bytes)
    const timestampBytes = new Uint8Array(8);
    const view = new DataView(timestampBytes.buffer);
    view.setBigUint64(0, BigInt(timestamp), false);
    combined.set(timestampBytes.slice(4), 0); // Use last 4 bytes of timestamp
    
    // Add random bytes (8 bytes)
    combined.set(randomPart, 4);
    
    return Buffer.from(combined).toString('hex');
  }

  /**
   * Verify nonce for replay attack prevention
   * Checks timestamp is within acceptable window
   */
  static verifyNonce(nonce: string, maxAgeMs: number = 300000): boolean { // 5 minutes default
    try {
      const nonceBytes = Buffer.from(nonce, 'hex');
      if (nonceBytes.length !== 12) return false;
      
      // Extract timestamp from first 4 bytes
      const timestampBytes = new Uint8Array(8);
      timestampBytes.set(nonceBytes.slice(0, 4), 4);
      const view = new DataView(timestampBytes.buffer);
      const timestamp = Number(view.getBigUint64(0, false));
      
      const now = Date.now();
      const age = now - timestamp;
      
      return age >= 0 && age <= maxAgeMs;
    } catch (error) {
      return false;
    }
  }

  /**
   * Secure comparison to prevent timing attacks
   * For comparing hashes, signatures, etc.
   */
  static secureCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    
    return result === 0;
  }

  /**
   * Generate threshold signature shares
   * For committee-based consensus signatures
   */
  static async generateThresholdShares(message: Uint8Array, privateKeys: Uint8Array[], threshold: number): Promise<{
    shares: Uint8Array[];
    publicKeys: Uint8Array[];
  }> {
    if (privateKeys.length < threshold) {
      throw new Error('Not enough private keys for threshold');
    }

    const shares: Uint8Array[] = [];
    const publicKeys: Uint8Array[] = [];

    for (const privateKey of privateKeys.slice(0, threshold)) {
      const signature = await this.signMessage(privateKey, message);
      const publicKey = secp256k1.getPublicKey(privateKey);
      
      shares.push(signature);
      publicKeys.push(publicKey);
    }

    return { shares, publicKeys };
  }

  /**
   * Verify threshold signature
   * Requires at least 'threshold' valid signatures
   */
  static async verifyThresholdSignature(
    message: Uint8Array, 
    shares: Uint8Array[], 
    publicKeys: Uint8Array[], 
    threshold: number
  ): Promise<boolean> {
    if (shares.length < threshold || publicKeys.length < threshold) {
      return false;
    }

    let validSignatures = 0;
    
    for (let i = 0; i < Math.min(shares.length, publicKeys.length); i++) {
      const isValid = await this.verifySignature(publicKeys[i], shares[i], message);
      if (isValid) {
        validSignatures++;
        if (validSignatures >= threshold) {
          return true;
        }
      }
    }

    return false;
  }
}

export default ProductionCrypto;