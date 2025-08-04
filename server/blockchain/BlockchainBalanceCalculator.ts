import { EmotionalTransaction, BlockchainState } from '../../shared/types/BlockchainTypes.js';

export class BlockchainBalanceCalculator {
  private validatorBalances: Map<string, number> = new Map();
  
  constructor() {
    // Initialize with genesis balances (21 validators × 10,000 EMO each)
    const genesisValidators = [
      'StellarNode', 'NebulaForge', 'QuantumReach', 'OrionPulse', 
      'DarkMatterLabs', 'GravityCore', 'AstroSentinel', 'ByteGuardians',
      'ZeroLagOps', 'ChainFlux', 'BlockNerve', 'ValidatorX', 'NovaSync',
      'IronNode', 'SentinelTrust', 'VaultProof', 'SecureMesh',
      'WatchtowerOne', 'AetherRunes', 'ChronoKeep', 'SolForge'
    ];
    
    genesisValidators.forEach(validator => {
      this.validatorBalances.set(validator, 10000);
    });
  }
  
  // Calculate balance by traversing ALL transactions in blockchain
  calculateBalanceFromBlockchain(validatorId: string, transactions: EmotionalTransaction[]): number {
    let balance = 10000; // Genesis balance
    
    // Process ALL transactions for this validator
    for (const tx of transactions) {
      if (tx.to === validatorId) {
        balance += tx.amount; // Incoming transaction
      }
      if (tx.from === validatorId) {
        balance -= tx.amount; // Outgoing transaction
      }
    }
    
    return balance;
  }
  
  // Calculate ALL validator balances from complete blockchain
  calculateAllBalancesFromBlockchain(allTransactions: EmotionalTransaction[]): Map<string, number> {
    const balances = new Map<string, number>();
    
    // Initialize all validators with genesis balance
    const validators = Array.from(this.validatorBalances.keys());
    validators.forEach(validator => {
      balances.set(validator, this.calculateBalanceFromBlockchain(validator, allTransactions));
    });
    
    return balances;
  }
  
  // Get current blockchain state
  getCurrentState(allTransactions: EmotionalTransaction[]): BlockchainState {
    const balances = this.calculateAllBalancesFromBlockchain(allTransactions);
    let totalSupply = 0;
    
    balances.forEach(balance => {
      totalSupply += balance;
    });
    
    return {
      blockHeight: 0, // Will be set by calling code
      totalSupply,
      validatorBalances: balances,
      lastBlockHash: ''
    };
  }
}