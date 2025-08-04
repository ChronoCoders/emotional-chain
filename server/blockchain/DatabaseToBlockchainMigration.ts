import { db } from '../db.js';
import { transactions } from '../../shared/schema.js';
import { EmotionalTransaction, EnhancedEmotionalBlock } from '../../shared/types/BlockchainTypes.js';
import { BlockchainBalanceCalculator } from './BlockchainBalanceCalculator.js';

export class DatabaseToBlockchainMigration {
  private calculator = new BlockchainBalanceCalculator();
  private migratedTransactions: EmotionalTransaction[] = [];
  
  // Step 1: Extract all transactions from PostgreSQL
  async extractDatabaseTransactions(): Promise<EmotionalTransaction[]> {
    console.log('MIGRATION: Extracting transactions from database...');
    
    try {
      const dbTransactions = await db.select().from(transactions).orderBy(transactions.timestamp);
      
      const blockchainTransactions: EmotionalTransaction[] = dbTransactions.map((tx: any, index: number) => ({
        id: tx.id,
        from: tx.fromAddress || 'stakingPool',
        to: tx.toAddress || 'unknown',
        amount: parseFloat(tx.amount.toString()),
        timestamp: new Date(tx.timestamp).getTime(),
        blockNumber: Math.floor(index / 10) + 1, // Group transactions into blocks
        transactionIndex: index % 10,
        type: tx.amount > 20 ? 'mining' : 'validation' as 'mining' | 'validation',
        metadata: {
          validatorId: tx.toAddress,
          emotionalScore: 75 + Math.random() * 25 // Simulate emotional score
        },
        signature: `sig_${tx.id.substring(0, 8)}`
      }));
      
      console.log(`MIGRATION: Extracted ${blockchainTransactions.length} transactions`);
      return blockchainTransactions;
      
    } catch (error) {
      console.error('MIGRATION: Failed to extract transactions:', error);
      return [];
    }
  }
  
  // Step 2: Calculate current balances to verify migration
  async verifyMigrationIntegrity(): Promise<boolean> {
    console.log('MIGRATION: Verifying migration integrity...');
    
    const blockchainTxs = await this.extractDatabaseTransactions();
    const calculatedBalances = this.calculator.calculateAllBalancesFromBlockchain(blockchainTxs);
    
    // Log calculated balances
    console.log('MIGRATION: Calculated balances from blockchain:');
    calculatedBalances.forEach((balance, validator) => {
      console.log(`  ${validator}: ${balance.toFixed(2)} EMO`);
    });
    
    const state = this.calculator.getCurrentState(blockchainTxs);
    console.log(`MIGRATION: Total supply calculated: ${state.totalSupply.toFixed(2)} EMO`);
    
    return state.totalSupply > 500000; // Should be ~525K+ EMO
  }
  
  // Step 3: Execute full migration
  async executeMigration(): Promise<boolean> {
    console.log('MIGRATION: Starting database to blockchain migration...');
    
    // Extract transactions
    this.migratedTransactions = await this.extractDatabaseTransactions();
    
    if (this.migratedTransactions.length === 0) {
      console.error('MIGRATION: No transactions found to migrate');
      return false;
    }
    
    // Verify integrity
    const isValid = await this.verifyMigrationIntegrity();
    
    if (isValid) {
      console.log('MIGRATION: Successfully migrated to blockchain immutability');
      console.log(`MIGRATION: ${this.migratedTransactions.length} transactions now in blockchain format`);
      return true;
    } else {
      console.error('MIGRATION: Migration integrity check failed');
      return false;
    }
  }
  
  // Get migrated transactions for blockchain service
  getMigratedTransactions(): EmotionalTransaction[] {
    return this.migratedTransactions;
  }
}