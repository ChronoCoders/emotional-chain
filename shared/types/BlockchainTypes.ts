export interface EmotionalTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  blockNumber: number;
  transactionIndex: number;
  type: 'mining' | 'validation' | 'transfer' | 'delegation';
  metadata: {
    emotionalScore?: number;
    validatorId?: string;
    proofHash?: string;
  };
  signature: string;
}

export interface EnhancedEmotionalBlock {
  header: {
    blockNumber: number;
    parentHash: string;
    timestamp: number;
    transactionRoot: string;  // Merkle root of transactions
    stateRoot: string;        // State tree root
    consensusData: any;       // PoE consensus data
  };
  transactions: EmotionalTransaction[];  // ALL transactions in this block
  transactionCount: number;
}

export interface BlockchainState {
  blockHeight: number;
  totalSupply: number;
  validatorBalances: Map<string, number>;
  lastBlockHash: string;
}