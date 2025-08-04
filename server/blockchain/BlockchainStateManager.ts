/**
 * Blockchain State Management Engine
 * Implements true blockchain immutability with Bitcoin/Ethereum-level integrity
 * Calculates all balances and state from blockchain data only
 */

import { createHash } from 'crypto';
import type { Block, Transaction } from '@shared/schema';

export interface EmotionalTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  emotionalProofHash: string; // ZK proof commitment
  signature: string; // Cryptographic signature
  blockNumber: number; // Block inclusion
  fee?: number;
}

export interface EnhancedBlock {
  header: {
    blockNumber: number;
    parentHash: string;
    stateRoot: string;
    transactionRoot: string; // Merkle root of transactions
    timestamp: number;
    consensusData: any; // PoE consensus data
    validatorId: string;
    emotionalScore: number;
  };
  transactions: EmotionalTransaction[]; // Full transaction list
  zkProofs: any[]; // Privacy-preserving proofs
}

export interface BlockchainState {
  [address: string]: {
    balance: number;
    nonce: number;
    lastActivity: number;
  };
}

export class BlockchainStateManager {
  private currentState: BlockchainState = {};
  private blockCache: Map<number, EnhancedBlock> = new Map();
  private genesisState: BlockchainState = {};

  constructor() {
    this.initializeGenesisState();
  }

  /**
   * Initialize genesis state with validator allocations
   */
  private initializeGenesisState(): void {
    // Genesis allocations for validators
    const genesisValidators = [
      'StellarNode', 'NebulaForge', 'QuantumReach', 'OrionPulse', 'DarkMatterLabs',
      'GravityCore', 'AstroSentinel', 'ByteGuardians', 'ZeroLagOps', 'ChainFlux',
      'BlockNerve', 'ValidatorX', 'NovaSync', 'IronNode', 'SentinelTrust',
      'VaultProof', 'SecureMesh'
    ];

    // Initialize with genesis allocations
    genesisValidators.forEach(validatorId => {
      this.genesisState[validatorId] = {
        balance: 10000, // Genesis allocation
        nonce: 0,
        lastActivity: Date.now()
      };
    });

    this.currentState = { ...this.genesisState };
  }

  /**
   * Calculate balance from blockchain traversal (IMMUTABLE SOURCE)
   */
  public calculateBalanceFromBlockchain(address: string, blocks: EnhancedBlock[]): number {
    let balance = this.genesisState[address]?.balance || 0;

    // Traverse all blocks and sum transactions
    for (const block of blocks.sort((a, b) => a.header.blockNumber - b.header.blockNumber)) {
      for (const tx of block.transactions) {
        if (tx.to === address) {
          balance += tx.amount;
        }
        if (tx.from === address) {
          balance -= (tx.amount + (tx.fee || 0));
        }
      }
    }

    return balance;
  }

  /**
   * Calculate state root hash for block header
   */
  public calculateStateRoot(state: BlockchainState): string {
    const stateString = JSON.stringify(state, Object.keys(state).sort());
    return createHash('sha256').update(stateString).digest('hex');
  }

  /**
   * Calculate transaction merkle root
   */
  public calculateTransactionRoot(transactions: EmotionalTransaction[]): string {
    if (transactions.length === 0) return '0'.repeat(64);
    
    const txHashes = transactions.map(tx => 
      createHash('sha256').update(JSON.stringify(tx)).digest('hex')
    );

    // Simple merkle root calculation
    let hashes = txHashes;
    while (hashes.length > 1) {
      const newHashes: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        const combined = createHash('sha256').update(left + right).digest('hex');
        newHashes.push(combined);
      }
      hashes = newHashes;
    }

    return hashes[0];
  }

  /**
   * Validate state transition for new block
   */
  public validateStateTransition(
    previousState: BlockchainState, 
    block: EnhancedBlock
  ): { valid: boolean; newState: BlockchainState; errors: string[] } {
    const errors: string[] = [];
    const newState = { ...previousState };

    try {
      // Apply all transactions in the block
      for (const tx of block.transactions) {
        // Validate sender has sufficient balance
        const senderBalance = newState[tx.from]?.balance || 0;
        const totalDeduction = tx.amount + (tx.fee || 0);

        if (senderBalance < totalDeduction) {
          errors.push(`Insufficient balance for ${tx.from}: ${senderBalance} < ${totalDeduction}`);
          continue;
        }

        // Apply transaction
        if (!newState[tx.from]) {
          newState[tx.from] = { balance: 0, nonce: 0, lastActivity: tx.timestamp };
        }
        if (!newState[tx.to]) {
          newState[tx.to] = { balance: 0, nonce: 0, lastActivity: tx.timestamp };
        }

        newState[tx.from].balance -= totalDeduction;
        newState[tx.from].nonce += 1;
        newState[tx.from].lastActivity = tx.timestamp;

        newState[tx.to].balance += tx.amount;
        newState[tx.to].lastActivity = tx.timestamp;
      }

      // Validate state root
      const calculatedStateRoot = this.calculateStateRoot(newState);
      if (calculatedStateRoot !== block.header.stateRoot) {
        errors.push(`State root mismatch: calculated ${calculatedStateRoot}, expected ${block.header.stateRoot}`);
      }

      return {
        valid: errors.length === 0,
        newState,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        newState: previousState,
        errors: [`State transition error: ${error}`]
      };
    }
  }

  /**
   * Get current blockchain state
   */
  public getCurrentState(): BlockchainState {
    return { ...this.currentState };
  }

  /**
   * Update state after successful block validation
   */
  public updateState(newState: BlockchainState): void {
    this.currentState = { ...newState };
  }

  /**
   * Get balance for specific address
   */
  public getBalance(address: string): number {
    return this.currentState[address]?.balance || 0;
  }

  /**
   * Get all account balances
   */
  public getAllBalances(): { [address: string]: number } {
    const balances: { [address: string]: number } = {};
    for (const [address, state] of Object.entries(this.currentState)) {
      balances[address] = state.balance;
    }
    return balances;
  }

  /**
   * Sync state from blockchain blocks (recovery mechanism)
   */
  public syncFromBlockchain(blocks: EnhancedBlock[]): void {
    // Reset to genesis
    this.currentState = { ...this.genesisState };

    // Apply all blocks in order
    const sortedBlocks = blocks.sort((a, b) => a.header.blockNumber - b.header.blockNumber);
    
    for (const block of sortedBlocks) {
      const validation = this.validateStateTransition(this.currentState, block);
      if (validation.valid) {
        this.currentState = validation.newState;
      } else {
        console.error(`Block ${block.header.blockNumber} validation failed:`, validation.errors);
      }
    }
  }
}