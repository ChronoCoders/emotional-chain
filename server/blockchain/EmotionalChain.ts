// EmotionalChain Core Implementation
// Based on attached blockchain files
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export class EmotionalChain extends EventEmitter {
  private chain: any[] = [];
  private pendingTransactions: any[] = [];
  private miningReward: number = 100;
  private difficulty: number = 2;
  private isMining: boolean = false;
  private miningInterval: NodeJS.Timeout | null = null;
  private validators: Map<string, any> = new Map();

  constructor() {
    super();
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
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private calculateEmotionalScore(biometricData: any): number {
    // Proof of Emotion calculation based on biometric validation
    const heartRate = biometricData?.heartRate || 70;
    const stressLevel = biometricData?.stressLevel || 0.3;
    const focusLevel = biometricData?.focusLevel || 0.8;
    const authenticity = biometricData?.authenticity || 0.9;
    
    // Calculate emotional consensus score
    const normalizedHR = Math.max(0, Math.min(1, (heartRate - 60) / 40)); // 60-100 BPM range
    const emotionalScore = (
      (1 - stressLevel) * 0.3 + 
      focusLevel * 0.3 + 
      authenticity * 0.4
    ) * 100;
    
    return Math.round(emotionalScore * 100) / 100;
  }

  private isValidEmotionalProof(emotionalScore: number): boolean {
    // PoE validation: emotional score must be above threshold
    return emotionalScore >= 75.0; // 75% minimum emotional consensus
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

  public addValidator(validatorId: string, biometricData: any): boolean {
    this.validators.set(validatorId, {
      id: validatorId,
      biometricData,
      lastActive: Date.now(),
      blocksValidated: 0,
      emotionalScore: this.calculateEmotionalScore(biometricData)
    });
    console.log(`✅ Validator ${validatorId.substring(0, 8)}... added with emotional score: ${this.calculateEmotionalScore(biometricData)}%`);
    return true;
  }

  public removeValidator(validatorId: string): void {
    this.validators.delete(validatorId);
    console.log(`❌ Validator ${validatorId.substring(0, 8)}... removed`);
  }

  public getValidators(): any[] {
    return Array.from(this.validators.values());
  }

  private selectValidator(): any | null {
    const activeValidators = Array.from(this.validators.values())
      .filter(v => Date.now() - v.lastActive < 60000) // Active within 1 minute
      .filter(v => this.isValidEmotionalProof(v.emotionalScore));
    
    if (activeValidators.length === 0) return null;
    
    // Select validator with highest emotional score
    return activeValidators.reduce((best, current) => 
      current.emotionalScore > best.emotionalScore ? current : best
    );
  }

  private mineBlock(): boolean {
    if (this.pendingTransactions.length === 0) return false;
    
    const selectedValidator = this.selectValidator();
    if (!selectedValidator) {
      console.log('⏸️ Mining paused: No valid validators with sufficient emotional proof');
      return false;
    }

    const previousBlock = this.getLatestBlock();
    const newBlock = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
      validator: selectedValidator.id,
      emotionalScore: selectedValidator.emotionalScore.toString(),
      consensusScore: this.calculateConsensusScore().toString(),
      authenticity: selectedValidator.biometricData?.authenticity ? (selectedValidator.biometricData.authenticity * 100).toFixed(2) : "90.00"
    };

    // Proof of Emotion mining process
    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(this.difficulty);
    
    console.log(`⛏️ Mining block ${newBlock.index} with validator ${selectedValidator.id.substring(0, 8)}... (emotional score: ${selectedValidator.emotionalScore}%)`);
    
    do {
      nonce++;
      hash = this.calculateHash(
        newBlock.index,
        newBlock.timestamp,
        newBlock.transactions,
        newBlock.previousHash,
        nonce
      );
    } while (!hash.startsWith(target) && nonce < 1000000);

    if (hash.startsWith(target)) {
      newBlock.nonce = nonce;
      newBlock.hash = hash;
      
      // Add block to chain
      this.chain.push(newBlock);
      
      // Clear pending transactions
      this.pendingTransactions = [];
      
      // Reward validator
      this.addTransaction({
        from: 'system',
        to: selectedValidator.id,
        amount: this.miningReward,
        type: 'mining_reward',
        timestamp: Date.now()
      });
      
      // Update validator stats
      selectedValidator.blocksValidated++;
      selectedValidator.lastActive = Date.now();
      
      console.log(`✅ Block ${newBlock.index} mined successfully! Hash: ${hash.substring(0, 16)}...`);
      console.log(`💰 Validator ${selectedValidator.id.substring(0, 8)}... rewarded ${this.miningReward} EMO`);
      
      // Emit mining event
      this.emit('blockMined', newBlock);
      
      return true;
    } else {
      console.log(`❌ Mining failed for block ${newBlock.index} - max nonce reached`);
      return false;
    }
  }

  private calculateConsensusScore(): number {
    if (this.validators.size === 0) return 95.0;
    
    const validatorScores = Array.from(this.validators.values())
      .map(v => v.emotionalScore);
    
    const averageScore = validatorScores.reduce((sum, score) => sum + score, 0) / validatorScores.length;
    return Math.round(averageScore * 100) / 100;
  }

  public startMining(): any {
    if (this.isMining) {
      return {
        status: "already_running",
        message: "Mining is already active",
        validators: this.validators.size,
        difficulty: this.difficulty
      };
    }

    this.isMining = true;
    
    // Start mining loop
    this.miningInterval = setInterval(() => {
      if (this.isMining && this.pendingTransactions.length > 0) {
        this.mineBlock();
      }
    }, 10000); // Attempt mining every 10 seconds

    console.log('🚀 EmotionalChain mining started with Proof of Emotion consensus');
    
    return {
      status: "started",
      message: "Mining started with Proof of Emotion consensus",
      validators: this.validators.size,
      difficulty: this.difficulty,
      consensusType: "Proof of Emotion (PoE)",
      miningInterval: "10 seconds"
    };
  }

  public stopMining(): any {
    if (!this.isMining) {
      return {
        status: "not_running",
        message: "Mining is not currently active"
      };
    }

    this.isMining = false;
    
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }

    console.log('🛑 EmotionalChain mining stopped');
    
    return {
      status: "stopped",
      message: "Mining stopped",
      totalBlocks: this.chain.length,
      validators: this.validators.size
    };
  }

  public getMiningStatus(): any {
    return {
      isActive: this.isMining,
      validators: this.validators.size,
      activeValidators: Array.from(this.validators.values())
        .filter(v => Date.now() - v.lastActive < 60000).length,
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      lastBlock: this.getLatestBlock(),
      consensusScore: this.calculateConsensusScore()
    };
  }
}