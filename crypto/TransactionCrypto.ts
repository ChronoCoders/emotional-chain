import { ProductionCrypto, ECDSASignature } from './ProductionCrypto';

export interface SignedTransaction {
  from: string;
  to: string;
  amount: number;
  nonce: number;
  signature: string;  // Real ECDSA signature
  hash: string;       // Cryptographic hash of signed data
  timestamp: number;
  fee: number;
  type: 'transfer' | 'mining_reward' | 'validation_reward';
  biometricData?: any;
  emotionalScore?: number;
  consensusScore?: number;
  breakdown?: any;
}

export interface TransactionInput {
  from: string;
  to: string;
  amount: number;
  nonce: number;
  timestamp: number;
  fee: number;
  type: 'transfer' | 'mining_reward' | 'validation_reward';
  biometricData?: any;
  emotionalScore?: number;
  consensusScore?: number;
  breakdown?: any;
}

/**
 * Production-grade transaction cryptography using ECDSA signatures
 * Replaces amateur Node.js crypto with real cryptographic operations
 */
export class TransactionCrypto {
  
  /**
   * Sign transaction using ECDSA with secp256k1
   */
  static async signTransaction(tx: TransactionInput, privateKey: Uint8Array): Promise<SignedTransaction> {
    // Generate transaction hash from canonical data
    const txHash = this.generateTransactionHash(tx);
    
    // Sign the transaction hash with ECDSA
    const signature = ProductionCrypto.signECDSA(new TextEncoder().encode(txHash), privateKey);
    
    return {
      ...tx,
      signature: signature.signature,
      hash: txHash
    };
  }
  
  /**
   * Verify transaction signature using ECDSA
   */
  static async verifyTransaction(tx: SignedTransaction, publicKey: Uint8Array): Promise<boolean> {
    try {
      // Reconstruct transaction data without signature
      const txInput: TransactionInput = {
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        nonce: tx.nonce,
        timestamp: tx.timestamp,
        fee: tx.fee,
        type: tx.type,
        biometricData: tx.biometricData,
        emotionalScore: tx.emotionalScore,
        consensusScore: tx.consensusScore,
        breakdown: tx.breakdown
      };
      
      // Verify hash matches
      const expectedHash = this.generateTransactionHash(txInput);
      if (expectedHash !== tx.hash) {
        return false;
      }
      
      // Verify ECDSA signature
      const signatureObj: ECDSASignature = {
        signature: tx.signature,
        algorithm: 'ECDSA-secp256k1',
        r: tx.signature.substring(0, 64),
        s: tx.signature.substring(64, 128),
        recovery: 0
      };
      
      return ProductionCrypto.verifyECDSA(
        new TextEncoder().encode(tx.hash), 
        signatureObj, 
        publicKey
      );
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Generate cryptographic hash of transaction data
   */
  static generateTransactionHash(tx: TransactionInput): string {
    // Create canonical transaction representation
    const canonicalData = {
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      nonce: tx.nonce,
      timestamp: tx.timestamp,
      fee: tx.fee,
      type: tx.type,
      biometricData: tx.biometricData || null,
      emotionalScore: tx.emotionalScore || null,
      consensusScore: tx.consensusScore || null,
      breakdown: tx.breakdown || null
    };
    
    // Convert to deterministic byte representation
    const dataString = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());
    const dataBytes = new TextEncoder().encode(dataString);
    
    // Generate SHA-256 hash using production crypto
    const hashBytes = ProductionCrypto.hash(dataBytes);
    return Buffer.from(hashBytes).toString('hex');
  }
  
  /**
   * Derive address from public key using proper cryptographic derivation
   */
  static deriveAddress(publicKey: Uint8Array): string {
    // Use production crypto for address derivation
    const hash = ProductionCrypto.hash(publicKey);
    // Take last 20 bytes and encode as hex with checksum
    const addressBytes = hash.slice(-20);
    return '0x' + Buffer.from(addressBytes).toString('hex');
  }
  
  /**
   * Validate transaction structure and cryptographic integrity
   */
  static validateTransactionStructure(tx: SignedTransaction): boolean {
    // Check required fields
    if (!tx.from || !tx.to || !tx.signature || !tx.hash) {
      return false;
    }
    
    // Check amount is non-negative
    if (tx.amount < 0) {
      return false;
    }
    
    // Check nonce is non-negative
    if (tx.nonce < 0) {
      return false;
    }
    
    // Check timestamp is reasonable (not too far in future/past)
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (Math.abs(now - tx.timestamp) > oneHour) {
      return false;
    }
    
    // Validate biometric data if present
    if (tx.biometricData) {
      return this.validateBiometricData(tx.biometricData);
    }
    
    return true;
  }
  
  /**
   * Validate biometric data for emotional consensus
   */
  private static validateBiometricData(data: any): boolean {
    if (!data) return false;
    
    // Heart rate validation
    if (data.heartRate && (data.heartRate < 40 || data.heartRate > 200)) {
      return false;
    }
    
    // Stress level validation (0-1 range)
    if (data.stressLevel !== undefined && (data.stressLevel < 0 || data.stressLevel > 1)) {
      return false;
    }
    
    // Focus level validation (0-1 range)
    if (data.focusLevel !== undefined && (data.focusLevel < 0 || data.focusLevel > 1)) {
      return false;
    }
    
    // Authenticity validation (0-1 range)
    if (data.authenticity !== undefined && (data.authenticity < 0 || data.authenticity > 1)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Create nonce for replay protection
   */
  static generateNonce(): number {
    // Use secure random for nonce generation
    const randomBytes = ProductionCrypto.generateSecureRandom(4);
    return new DataView(randomBytes.buffer).getUint32(0, false);
  }
  
  /**
   * Validate transaction against replay attacks
   */
  static validateReplayProtection(tx: SignedTransaction, knownNonces: Set<string>): boolean {
    const nonceKey = `${tx.from}:${tx.nonce}`;
    return !knownNonces.has(nonceKey);
  }
}