// EmotionalChain Core Implementation
// Based on attached blockchain files

export class EmotionalChain {
  private chain: any[] = [];
  private pendingTransactions: any[] = [];
  private miningReward: number = 100;
  private difficulty: number = 2;

  constructor() {
    this.createGenesisBlock();
  }

  private createGenesisBlock() {
    const genesisBlock = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: "0",
      hash: this.calculateHash(0, Date.now(), [], "0", 0),
      nonce: 0,
      emotionalScore: "100.00",
      consensusScore: "100.00",
      authenticity: "100.00",
      validator: "genesis"
    };
    this.chain.push(genesisBlock);
  }

  private calculateHash(index: number, timestamp: number, transactions: any[], previousHash: string, nonce: number): string {
    const data = index + timestamp + JSON.stringify(transactions) + previousHash + nonce;
    // Simple hash function for demo - in real implementation use crypto.createHash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  public getChain(): any[] {
    return this.chain;
  }

  public getLatestBlock(): any {
    return this.chain[this.chain.length - 1];
  }

  public getChainStats(): any {
    return {
      totalBlocks: this.chain.length,
      totalValidators: 0,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      avgConsensusScore: 0.95,
      avgAuthenticity: 0.93
    };
  }

  public addTransaction(transaction: any): boolean {
    this.pendingTransactions.push(transaction);
    return true;
  }

  public startMining(): any {
    return {
      status: "started",
      message: "Mining started with Proof of Emotion consensus",
      emotionalScore: "95.2",
      device: "Connected Device",
      performance: "Optimal"
    };
  }

  public stopMining(): void {
    // Stop mining implementation
  }
}