import elliptic from 'elliptic';
import * as crypto from 'crypto';

const { ec: EC } = elliptic;

export class KeyPair {
  private ec: elliptic.ec;
  private keyPair: elliptic.ec.KeyPair;

  constructor(privateKey?: string) {
    this.ec = new EC('secp256k1');
    
    if (privateKey) {
      this.keyPair = this.ec.keyFromPrivate(privateKey, 'hex');
    } else {
      this.keyPair = this.ec.genKeyPair();
    }
  }

  /**
   * Get the private key as hex string
   */
  public getPrivateKey(): string {
    return this.keyPair.getPrivate('hex');
  }

  /**
   * Get the public key as hex string
   */
  public getPublicKey(): string {
    return this.keyPair.getPublic('hex');
  }

  /**
   * Generate wallet address from public key (Ethereum-style)
   * Format: 0x[40-char-hex]
   */
  public getAddress(): string {
    const publicKey = this.keyPair.getPublic().encode('hex', false);
    // Remove '04' prefix and take last 40 chars after keccak256
    const publicKeyWithoutPrefix = publicKey.slice(2);
    const hash = crypto.createHash('sha256').update(Buffer.from(publicKeyWithoutPrefix, 'hex')).digest('hex');
    return '0x' + hash.slice(-40);
  }

  /**
   * Sign a message or transaction hash
   */
  public sign(messageHash: string): string {
    const signature = this.keyPair.sign(messageHash, 'hex');
    return signature.toDER('hex');
  }

  /**
   * Verify a signature against a message hash and public key
   */
  public static verify(messageHash: string, signature: string, publicKey: string): boolean {
    try {
      const ec = new EC('secp256k1');
      const key = ec.keyFromPublic(publicKey, 'hex');
      return key.verify(messageHash, signature);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify signature using this keypair's public key
   */
  public verifySignature(messageHash: string, signature: string): boolean {
    return KeyPair.verify(messageHash, signature, this.getPublicKey());
  }

  /**
   * Create KeyPair from existing private key
   */
  public static fromPrivateKey(privateKey: string): KeyPair {
    return new KeyPair(privateKey);
  }

  /**
   * Generate a random KeyPair
   */
  public static generate(): KeyPair {
    return new KeyPair();
  }
}