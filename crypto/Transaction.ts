import { ProductionCrypto } from './ProductionCrypto';
import { TransactionCrypto, SignedTransaction } from './TransactionCrypto';
import { KeyPair } from './KeyPair';
export interface BiometricData {
  heartRate: number;
  stressLevel: number;
  focusLevel: number;
  authenticity: number;
  timestamp: number;
}
export interface TransactionData {
  from: string;
  to: string;
  amount: number;
  type: 'transfer' | 'mining_reward' | 'validation_reward';
  timestamp: number;
  fee?: number;
  biometricData?: BiometricData;
  emotionalScore?: number;
  consensusScore?: number;
  breakdown?: {
    baseReward?: number;
    consensusBonus?: number;
    transactionFees?: number;
  };
}
export class Transaction {
  public id: string;
  public from: string;
  public to: string;
  public amount: number;
  public type: 'transfer' | 'mining_reward' | 'validation_reward';
  public timestamp: number;
  public fee: number;
  public biometricData?: BiometricData;
  public emotionalScore?: number;
  public consensusScore?: number;
  public breakdown?: {
    baseReward?: number;
    consensusBonus?: number;
    transactionFees?: number;
  };
  public signature?: string;
  public publicKey?: string;
  constructor(data: TransactionData) {
    this.from = data.from;
    this.to = data.to;
    this.amount = data.amount;
    this.type = data.type;
    this.timestamp = data.timestamp;
    this.fee = data.fee || 0;
    this.biometricData = data.biometricData;
    this.emotionalScore = data.emotionalScore;
    this.consensusScore = data.consensusScore;
    this.breakdown = data.breakdown;
    // Generate transaction ID from hash
    this.id = this.calculateHash();
  }
  /**
   * Calculate cryptographic hash of the transaction using production crypto
   */
  public calculateHash(): string {
    return TransactionCrypto.generateTransactionHash({
      from: this.from,
      to: this.to,
      amount: this.amount,
      nonce: 0, // Will be set during signing
      timestamp: this.timestamp,
      fee: this.fee,
      type: this.type,
      biometricData: this.biometricData,
      emotionalScore: this.emotionalScore,
      consensusScore: this.consensusScore,
      breakdown: this.breakdown
    });
  }
  /**
   * Sign the transaction with a private key
   */
  public sign(keyPair: KeyPair): void {
    // Only allow signing if the from address matches the keypair address
    if (this.from !== 'stakingPool' && this.from !== keyPair.getAddress()) {
      throw new Error('Cannot sign transaction: from address does not match keypair address');
    }
    const hash = this.calculateHash();
    this.signature = keyPair.sign(hash);
    this.publicKey = keyPair.getPublicKey();
  }
  /**
   * Verify the transaction signature
   */
  public verifySignature(): boolean {
    if (!this.signature || !this.publicKey) {
      // System transactions (mining/validation rewards) don't need signatures
      if (this.from === 'stakingPool') {
        return true;
      }
      return false;
    }
    const hash = this.calculateHash();
    return KeyPair.verify(hash, this.signature, this.publicKey);
  }
  /**
   * Validate the transaction structure and signature
   */
  public isValid(): boolean {
    // Check basic structure
    if (!this.from || !this.to || this.amount < 0) {
      return false;
    }
    // Check signature for user transactions
    if (!this.verifySignature()) {
      return false;
    }
    // Validate biometric data if present (for emotional consensus)
    if (this.biometricData) {
      if (!this.isValidBiometricData(this.biometricData)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Validate biometric data for emotional consensus
   */
  private isValidBiometricData(data: BiometricData): boolean {
    // Heart rate should be between 40-200 BPM
    if (data.heartRate < 40 || data.heartRate > 200) {
      return false;
    }
    // Stress level should be 0-100%
    if (data.stressLevel < 0 || data.stressLevel > 100) {
      return false;
    }
    // Focus level should be 0-100%
    if (data.focusLevel < 0 || data.focusLevel > 100) {
      return false;
    }
    // Authenticity should be 0-1 (0-100%)
    if (data.authenticity < 0 || data.authenticity > 1) {
      return false;
    }
    // Timestamp should be recent (within last hour)
    const oneHour = 60 * 60 * 1000;
    if (Math.abs(Date.now() - data.timestamp) > oneHour) {
      return false;
    }
    return true;
  }
  /**
   * Create a transfer transaction
   */
  public static createTransfer(
    from: string,
    to: string,
    amount: number,
    fee: number = 0.1,
    biometricData?: BiometricData
  ): Transaction {
    return new Transaction({
      from,
      to,
      amount,
      type: 'transfer',
      timestamp: Date.now(),
      fee,
      biometricData
    });
  }
  /**
   * Create a mining reward transaction
   */
  public static createMiningReward(
    to: string,
    amount: number,
    breakdown: { baseReward: number; consensusBonus: number; transactionFees: number }
  ): Transaction {
    return new Transaction({
      from: 'stakingPool',
      to,
      amount,
      type: 'mining_reward',
      timestamp: Date.now(),
      breakdown
    });
  }
  /**
   * Create a validation reward transaction
   */
  public static createValidationReward(
    to: string,
    amount: number,
    emotionalScore: number,
    consensusScore: number
  ): Transaction {
    return new Transaction({
      from: 'stakingPool',
      to,
      amount,
      type: 'validation_reward',
      timestamp: Date.now(),
      emotionalScore,
      consensusScore
    });
  }
  /**
   * Convert transaction to JSON for storage/transmission
   */
  public toJSON(): any {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      timestamp: this.timestamp,
      fee: this.fee,
      biometricData: this.biometricData,
      emotionalScore: this.emotionalScore,
      consensusScore: this.consensusScore,
      breakdown: this.breakdown,
      signature: this.signature,
      publicKey: this.publicKey
    };
  }
  /**
   * Create transaction from JSON data
   */
  public static fromJSON(data: any): Transaction {
    const tx = new Transaction({
      from: data.from,
      to: data.to,
      amount: data.amount,
      type: data.type,
      timestamp: data.timestamp,
      fee: data.fee,
      biometricData: data.biometricData,
      emotionalScore: data.emotionalScore,
      consensusScore: data.consensusScore,
      breakdown: data.breakdown
    });
    tx.signature = data.signature;
    tx.publicKey = data.publicKey;
    return tx;
  }
}