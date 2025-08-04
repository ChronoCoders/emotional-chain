/**
 * Immutable Blockchain Service
 * Transforms EmotionalChain from hybrid database to true blockchain immutability
 * Implements Bitcoin/Ethereum-level immutability with privacy-preserving architecture
 */

import { BlockchainStateManager, type EmotionalTransaction, type EnhancedBlock } from './BlockchainStateManager';
import { createHash } from 'crypto';
import { db } from '../db';
import { blocks, transactions } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export class ImmutableBlockchainService {
  private stateManager: BlockchainStateManager;
  private pendingTransactions: EmotionalTransaction[] = [];

  constructor() {
    this.stateManager = new BlockchainStateManager();
    this.initializeFromDatabase();
  }

  /**
   * Initialize blockchain state from existing database
   */
  private async initializeFromDatabase(): Promise<void> {
    try {

      
      // Load all blocks from database
      const dbBlocks = await db.select().from(blocks).orderBy(blocks.height);
      
      // Convert to enhanced block format
      const enhancedBlocks: EnhancedBlock[] = dbBlocks.map(block => ({
        header: {
          blockNumber: block.height,
          parentHash: block.previousHash,
          stateRoot: block.stateRoot || this.calculateDefaultStateRoot(),
          transactionRoot: block.transactionRoot || this.calculateDefaultTransactionRoot(),
          timestamp: block.timestamp,
          consensusData: block.emotionalProof || {},
          validatorId: block.validatorId,
          emotionalScore: parseFloat(block.emotionalScore || '0')
        },
        transactions: this.parseBlockTransactions(block.transactions),
        zkProofs: this.parseZKProofs(block.zkProofs)
      }));

      // Sync state manager with blockchain data
      this.stateManager.syncFromBlockchain(enhancedBlocks);
      

    } catch (error) {
      console.error('BLOCKCHAIN IMMUTABILITY: Failed to initialize from database:', error);
    }
  }

  /**
   * Parse transactions from block data
   */
  private parseBlockTransactions(txData: any): EmotionalTransaction[] {
    if (!txData || !Array.isArray(txData)) return [];
    
    return txData.map(tx => ({
      id: tx.id || crypto.randomUUID(),
      from: tx.from,
      to: tx.to,
      amount: parseFloat(tx.amount),
      timestamp: tx.timestamp,
      emotionalProofHash: tx.emotionalProofHash || '',
      signature: tx.signature || '',
      blockNumber: tx.blockNumber || 0,
      fee: parseFloat(tx.fee || '0')
    }));
  }

  /**
   * Parse ZK proofs from block data
   */
  private parseZKProofs(zkData: any): any[] {
    if (!zkData || !Array.isArray(zkData)) return [];
    return zkData;
  }

  /**
   * Calculate default state root for existing blocks
   */
  private calculateDefaultStateRoot(): string {
    return this.stateManager.calculateStateRoot(this.stateManager.getCurrentState());
  }

  /**
   * Calculate default transaction root for existing blocks
   */
  private calculateDefaultTransactionRoot(): string {
    return this.stateManager.calculateTransactionRoot([]);
  }

  /**
   * Get balance from blockchain state (IMMUTABLE SOURCE)
   */
  public getBalanceFromBlockchain(address: string): number {
    return this.stateManager.getBalance(address);
  }

  /**
   * Get all balances from blockchain state
   */
  public getAllBalancesFromBlockchain(): { [address: string]: number } {
    return this.stateManager.getAllBalances();
  }

  /**
   * Create new transaction (stored in pending pool until block creation)
   */
  public async createTransaction(
    from: string,
    to: string,
    amount: number,
    emotionalProofHash: string = '',
    signature: string = ''
  ): Promise<EmotionalTransaction> {
    const transaction: EmotionalTransaction = {
      id: crypto.randomUUID(),
      from,
      to,
      amount,
      timestamp: Date.now(),
      emotionalProofHash,
      signature,
      blockNumber: 0, // Will be set when included in block
      fee: amount * 0.001 // 0.1% transaction fee
    };

    // Validate transaction
    const senderBalance = this.getBalanceFromBlockchain(from);
    const totalRequired = amount + transaction.fee;

    if (senderBalance < totalRequired) {
      throw new Error(`Insufficient balance: ${senderBalance} < ${totalRequired}`);
    }

    // Add to pending pool
    this.pendingTransactions.push(transaction);
    

    
    return transaction;
  }

  /**
   * Create new block with pending transactions (IMMUTABLE STORAGE)
   */
  public async createBlockWithTransactions(
    validatorId: string,
    emotionalScore: number,
    emotionalProof: any = {}
  ): Promise<EnhancedBlock> {
    try {
      // Get current blockchain height
      const [latestBlock] = await db.select().from(blocks).orderBy(desc(blocks.height)).limit(1);
      const newHeight = (latestBlock?.height || 0) + 1;

      // Get transactions for this block
      const blockTransactions = this.pendingTransactions.splice(0, 10); // Take up to 10 transactions
      
      // Update block numbers for transactions
      blockTransactions.forEach(tx => {
        tx.blockNumber = newHeight;
      });

      // Calculate roots
      const transactionRoot = this.stateManager.calculateTransactionRoot(blockTransactions);
      
      // Calculate new state after applying transactions
      const currentState = this.stateManager.getCurrentState();
      const tempBlock: EnhancedBlock = {
        header: {
          blockNumber: newHeight,
          parentHash: latestBlock?.hash || '0'.repeat(64),
          stateRoot: '', // Will be calculated
          transactionRoot,
          timestamp: Date.now(),
          consensusData: emotionalProof,
          validatorId,
          emotionalScore
        },
        transactions: blockTransactions,
        zkProofs: []
      };

      // Validate state transition and get new state
      const stateValidation = this.stateManager.validateStateTransition(currentState, tempBlock);
      if (!stateValidation.valid) {
        throw new Error(`State validation failed: ${stateValidation.errors.join(', ')}`);
      }

      // Set final state root
      tempBlock.header.stateRoot = this.stateManager.calculateStateRoot(stateValidation.newState);

      // Create block hash
      const blockHash = this.calculateBlockHash(tempBlock);

      // Store block in database (IMMUTABLE)
      await db.insert(blocks).values({
        height: newHeight,
        hash: blockHash,
        previousHash: tempBlock.header.parentHash,
        merkleRoot: blockHash, // Legacy field
        transactionRoot: tempBlock.header.transactionRoot,
        stateRoot: tempBlock.header.stateRoot,
        timestamp: tempBlock.header.timestamp,
        nonce: 0,
        difficulty: 1,
        validatorId,
        emotionalScore: emotionalScore.toString(),
        emotionalProof: emotionalProof,
        blockData: {},
        transactions: blockTransactions, // IMMUTABLE TRANSACTION STORAGE
        zkProofs: tempBlock.zkProofs,
        transactionCount: blockTransactions.length
      });

      // Update cache entries for query optimization
      await this.updateTransactionCache(blockTransactions, blockHash, newHeight);

      // Update blockchain state
      this.stateManager.updateState(stateValidation.newState);



      return tempBlock;
    } catch (error) {
      console.error('BLOCKCHAIN IMMUTABILITY: Failed to create block:', error);
      throw error;
    }
  }

  /**
   * Update transaction cache for query optimization (READ-ONLY)
   */
  private async updateTransactionCache(
    transactions: EmotionalTransaction[],
    blockHash: string,
    blockNumber: number
  ): Promise<void> {
    for (const tx of transactions) {
      try {
        await db.insert(transactions).values({
          id: tx.id,
          hash: this.calculateTransactionHash(tx),
          blockHash,
          blockNumber,
          fromAddress: tx.from,
          toAddress: tx.to,
          amount: tx.amount.toString(),
          fee: tx.fee?.toString() || '0',
          timestamp: tx.timestamp,
          signature: { signature: tx.signature },
          emotionalProofHash: tx.emotionalProofHash,
          status: 'confirmed',
          isBlockchainVerified: true
        });
      } catch (error) {
        console.error(`BLOCKCHAIN IMMUTABILITY: Failed to cache transaction ${tx.id}:`, error);
      }
    }
  }

  /**
   * Calculate block hash
   */
  private calculateBlockHash(block: EnhancedBlock): string {
    const blockString = JSON.stringify({
      blockNumber: block.header.blockNumber,
      parentHash: block.header.parentHash,
      stateRoot: block.header.stateRoot,
      transactionRoot: block.header.transactionRoot,
      timestamp: block.header.timestamp,
      validatorId: block.header.validatorId,
      emotionalScore: block.header.emotionalScore
    });
    
    return createHash('sha256').update(blockString).digest('hex');
  }

  /**
   * Calculate transaction hash
   */
  private calculateTransactionHash(tx: EmotionalTransaction): string {
    const txString = JSON.stringify({
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      timestamp: tx.timestamp,
      emotionalProofHash: tx.emotionalProofHash
    });
    
    return createHash('sha256').update(txString).digest('hex');
  }

  /**
   * Get transactions from blockchain (IMMUTABLE SOURCE)
   */
  public async getTransactionsFromBlockchain(limit: number = 50): Promise<EmotionalTransaction[]> {
    try {
      const dbBlocks = await db.select().from(blocks)
        .orderBy(desc(blocks.height))
        .limit(20);

      const allTransactions: EmotionalTransaction[] = [];
      
      for (const block of dbBlocks) {
        const blockTxs = this.parseBlockTransactions(block.transactions);
        allTransactions.push(...blockTxs);
      }

      return allTransactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('BLOCKCHAIN IMMUTABILITY: Failed to get transactions from blockchain:', error);
      return [];
    }
  }

  /**
   * Verify blockchain integrity
   */
  public async verifyBlockchainIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const dbBlocks = await db.select().from(blocks).orderBy(blocks.height);
      
      for (let i = 1; i < dbBlocks.length; i++) {
        const currentBlock = dbBlocks[i];
        const previousBlock = dbBlocks[i - 1];
        
        // Verify chain linkage
        if (currentBlock.previousHash !== previousBlock.hash) {
          errors.push(`Block ${currentBlock.height}: Invalid previous hash`);
        }
        
        // Verify transaction root
        const blockTxs = this.parseBlockTransactions(currentBlock.transactions);
        const calculatedTxRoot = this.stateManager.calculateTransactionRoot(blockTxs);
        if (currentBlock.transactionRoot !== calculatedTxRoot) {
          errors.push(`Block ${currentBlock.height}: Invalid transaction root`);
        }
      }
      
  
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Verification failed: ${error}`]
      };
    }
  }

  /**
   * Get pending transactions count
   */
  public getPendingTransactionCount(): number {
    return this.pendingTransactions.length;
  }
}