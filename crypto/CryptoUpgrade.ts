import { ProductionCrypto } from './ProductionCrypto';
import { BiometricKeyPair } from './KeyPair';

/**
 * Migration utility to upgrade existing crypto implementations
 * Replaces elliptic curve and Node.js crypto usage with production-grade @noble libraries
 */
export class CryptoUpgrade {
  
  /**
   * Migrate an existing BiometricKeyPair to use ProductionCrypto
   */
  static async migrateBiometricKeyPair(existingKeyPair: BiometricKeyPair): Promise<{
    publicKey: Uint8Array;
    privateKey: Uint8Array;
    address: string;
  }> {
    // Generate new production-grade key pair
    const { publicKey, privateKey } = await ProductionCrypto.generateKeyPair();
    
    // Generate address using production hashing
    const address = ProductionCrypto.generateAddress(publicKey);
    
    return {
      publicKey,
      privateKey,
      address
    };
  }

  /**
   * Upgrade signature operations to use production crypto
   */
  static async upgradeSignature(privateKey: Uint8Array, message: string): Promise<{
    signature: Uint8Array;
    messageHash: Uint8Array;
  }> {
    const messageBytes = new TextEncoder().encode(message);
    const signature = await ProductionCrypto.signMessage(privateKey, messageBytes);
    const messageHash = ProductionCrypto.hash(messageBytes);
    
    return {
      signature,
      messageHash
    };
  }

  /**
   * Upgrade verification to use production crypto
   */
  static async upgradeVerification(
    publicKey: Uint8Array,
    signature: Uint8Array,
    message: string
  ): Promise<boolean> {
    const messageBytes = new TextEncoder().encode(message);
    return ProductionCrypto.verifySignature(publicKey, signature, messageBytes);
  }

  /**
   * Create secure message authentication for network communications
   */
  static async createAuthenticatedMessage(
    privateKey: Uint8Array,
    messageData: any
  ): Promise<{
    message: any;
    signature: string;
    nonce: string;
    timestamp: number;
  }> {
    const timestamp = Date.now();
    const nonce = ProductionCrypto.generateNonce();
    
    const messageWithMetadata = {
      ...messageData,
      timestamp,
      nonce
    };
    
    const messageBytes = new TextEncoder().encode(JSON.stringify(messageWithMetadata));
    const signature = await ProductionCrypto.signMessage(privateKey, messageBytes);
    
    return {
      message: messageWithMetadata,
      signature: Buffer.from(signature).toString('hex'),
      nonce,
      timestamp
    };
  }

  /**
   * Verify authenticated message
   */
  static async verifyAuthenticatedMessage(
    publicKey: Uint8Array,
    messageData: any,
    signature: string,
    nonce: string,
    timestamp: number,
    maxAgeMs: number = 300000 // 5 minutes
  ): Promise<boolean> {
    // Verify nonce first to prevent replay attacks
    if (!ProductionCrypto.verifyNonce(nonce, maxAgeMs)) {
      return false;
    }

    // Verify timestamp is within acceptable range
    const now = Date.now();
    if (Math.abs(now - timestamp) > maxAgeMs) {
      return false;
    }

    // Reconstruct message with metadata
    const messageWithMetadata = {
      ...messageData,
      timestamp,
      nonce
    };

    const messageBytes = new TextEncoder().encode(JSON.stringify(messageWithMetadata));
    const signatureBytes = Buffer.from(signature, 'hex');
    
    return ProductionCrypto.verifySignature(publicKey, signatureBytes, messageBytes);
  }

  /**
   * Generate secure API keys for external service authentication
   */
  static async generateAPIKey(): Promise<{
    keyId: string;
    secretKey: string;
    publicKey: string;
  }> {
    const { publicKey, privateKey } = await ProductionCrypto.generateKeyPair();
    
    const keyId = ProductionCrypto.generateNonce();
    const secretKey = Buffer.from(privateKey).toString('hex');
    const publicKeyHex = Buffer.from(publicKey).toString('hex');
    
    return {
      keyId,
      secretKey,
      publicKey: publicKeyHex
    };
  }

  /**
   * Create threshold signature for consensus operations
   */
  static async createThresholdConsensusSignature(
    validatorPrivateKeys: Uint8Array[],
    blockData: any,
    threshold: number
  ): Promise<{
    signatures: string[];
    publicKeys: string[];
    threshold: number;
    blockHash: string;
  }> {
    const blockBytes = new TextEncoder().encode(JSON.stringify(blockData));
    const blockHash = ProductionCrypto.hash(blockBytes);
    
    const { shares, publicKeys } = await ProductionCrypto.generateThresholdShares(
      blockHash,
      validatorPrivateKeys,
      threshold
    );
    
    return {
      signatures: shares.map(sig => Buffer.from(sig).toString('hex')),
      publicKeys: publicKeys.map(pk => Buffer.from(pk).toString('hex')),
      threshold,
      blockHash: Buffer.from(blockHash).toString('hex')
    };
  }

  /**
   * Verify threshold consensus signature
   */
  static async verifyThresholdConsensusSignature(
    blockData: any,
    signatures: string[],
    publicKeys: string[],
    threshold: number,
    expectedBlockHash: string
  ): Promise<boolean> {
    // Verify block hash first
    const blockBytes = new TextEncoder().encode(JSON.stringify(blockData));
    const actualBlockHash = ProductionCrypto.hash(blockBytes);
    const expectedHashBytes = Buffer.from(expectedBlockHash, 'hex');
    
    if (!ProductionCrypto.secureCompare(actualBlockHash, expectedHashBytes)) {
      return false;
    }

    // Convert signatures and public keys back to Uint8Array
    const signatureBytes = signatures.map(sig => Buffer.from(sig, 'hex'));
    const publicKeyBytes = publicKeys.map(pk => Buffer.from(pk, 'hex'));
    
    return ProductionCrypto.verifyThresholdSignature(
      actualBlockHash,
      signatureBytes,
      publicKeyBytes,
      threshold
    );
  }
}

export default CryptoUpgrade;