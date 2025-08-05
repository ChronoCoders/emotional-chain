/**
 * EmotionalChain Wallet Module
 * Handles EMO coin transactions and balance management
 */

import { Transaction } from '../crypto/Transaction';
import { KeyPair } from '../crypto/KeyPair';
import { ProductionCrypto } from '../crypto/ProductionCrypto';

export interface WalletBalance {
  address: string;
  balance: number;
  stakedAmount: number;
  pendingRewards: number;
  lastActivity: number;
}

export interface TransactionHistory {
  transaction: Transaction;
  blockNumber: number;
  timestamp: number;
  confirmed: boolean;
}

export class WalletModule {
  private keyPair: KeyPair;
  private address: string;
  private crypto: ProductionCrypto;
  private transactionHistory: TransactionHistory[] = [];

  constructor(privateKey?: string) {
    this.crypto = new ProductionCrypto();
    
    if (privateKey) {
      this.keyPair = KeyPair.fromPrivateKey(privateKey);
    } else {
      this.keyPair = KeyPair.generate();
    }
    
    this.address = this.keyPair.getAddress();
    console.log(`WALLET MODULE: Initialized wallet ${this.address}`);
  }

  /**
   * Get wallet address
   */
  public getAddress(): string {
    return this.address;
  }

  /**
   * Get wallet balance from blockchain state
   */
  public async getBalance(): Promise<WalletBalance> {
    // This would typically query the blockchain state
    // For now, return a structured balance object
    return {
      address: this.address,
      balance: 0,
      stakedAmount: 0,
      pendingRewards: 0,
      lastActivity: Date.now()
    };
  }

  /**
   * Create a new transaction
   */
  public createTransaction(
    toAddress: string,
    amount: number,
    data?: string
  ): Transaction {
    try {
      const transaction = new Transaction(
        this.address,
        toAddress,
        amount,
        Date.now(),
        data || ''
      );

      // Sign transaction with wallet's private key
      const signature = this.crypto.sign(transaction.getHash(), this.keyPair.privateKey);
      transaction.signature = signature;

      console.log(`WALLET MODULE: Created transaction ${transaction.id} for ${amount} EMO`);
      return transaction;
    } catch (error) {
      console.error('WALLET MODULE: Transaction creation failed:', error);
      throw error;
    }
  }

  /**
   * Sign arbitrary data
   */
  public signData(data: string): string {
    try {
      const hash = this.crypto.hash(data);
      return this.crypto.sign(hash, this.keyPair.privateKey);
    } catch (error) {
      console.error('WALLET MODULE: Data signing failed:', error);
      throw error;
    }
  }

  /**
   * Verify signature
   */
  public verifySignature(data: string, signature: string, publicKey?: string): boolean {
    try {
      const hash = this.crypto.hash(data);
      const keyToUse = publicKey || this.keyPair.publicKey;
      return this.crypto.verify(hash, signature, keyToUse);
    } catch (error) {
      console.error('WALLET MODULE: Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Add transaction to history
   */
  public addTransactionToHistory(
    transaction: Transaction,
    blockNumber: number,
    confirmed: boolean = false
  ): void {
    const historyEntry: TransactionHistory = {
      transaction,
      blockNumber,
      timestamp: Date.now(),
      confirmed
    };

    this.transactionHistory.unshift(historyEntry);

    // Keep only last 1000 transactions
    if (this.transactionHistory.length > 1000) {
      this.transactionHistory = this.transactionHistory.slice(0, 1000);
    }

    console.log(`WALLET MODULE: Added transaction ${transaction.id} to history`);
  }

  /**
   * Get transaction history
   */
  public getTransactionHistory(): TransactionHistory[] {
    return [...this.transactionHistory];
  }

  /**
   * Get pending transactions
   */
  public getPendingTransactions(): TransactionHistory[] {
    return this.transactionHistory.filter(entry => !entry.confirmed);
  }

  /**
   * Mark transaction as confirmed
   */
  public confirmTransaction(transactionId: string, blockNumber: number): boolean {
    const entry = this.transactionHistory.find(
      entry => entry.transaction.id === transactionId
    );

    if (entry) {
      entry.confirmed = true;
      entry.blockNumber = blockNumber;
      console.log(`WALLET MODULE: Confirmed transaction ${transactionId} in block ${blockNumber}`);
      return true;
    }

    return false;
  }

  /**
   * Export wallet (private key)
   */
  public exportPrivateKey(): string {
    console.log('WALLET MODULE: WARNING - Exporting private key');
    return this.keyPair.privateKey;
  }

  /**
   * Export public key
   */
  public exportPublicKey(): string {
    return this.keyPair.publicKey;
  }

  /**
   * Create staking transaction
   */
  public createStakingTransaction(amount: number): Transaction {
    return this.createTransaction(
      'STAKING_CONTRACT',
      amount,
      JSON.stringify({ type: 'STAKE', amount })
    );
  }

  /**
   * Create unstaking transaction
   */
  public createUnstakingTransaction(amount: number): Transaction {
    return this.createTransaction(
      'STAKING_CONTRACT',
      0,
      JSON.stringify({ type: 'UNSTAKE', amount })
    );
  }

  /**
   * Get wallet info
   */
  public getWalletInfo() {
    return {
      address: this.address,
      publicKey: this.keyPair.publicKey,
      transactionCount: this.transactionHistory.length,
      pendingCount: this.getPendingTransactions().length
    };
  }
}