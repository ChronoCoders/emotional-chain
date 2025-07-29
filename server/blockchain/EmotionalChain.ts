// EmotionalChain Core Implementation
// Based on attached blockchain files
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export class EmotionalChain extends EventEmitter {
  private chain: any[] = [];
  private pendingTransactions: any[] = [];
  private difficulty: number = 2;
  private isMining: boolean = false;
  private miningInterval: NodeJS.Timeout | null = null;
  private validators: Map<string, any> = new Map();
  
  // Token Economics from attached specification
  private tokenEconomics = {
    maxSupply: 1000000000, // 1 billion EMO hard cap
    totalSupply: 0,
    circulatingSupply: 0,
    pools: {
      stakingPool: { allocated: 400000000, remaining: 400000000 },
      wellnessPool: { allocated: 200000000, remaining: 200000000 },
      ecosystemPool: { allocated: 250000000, remaining: 250000000 },
      teamAllocation: { allocated: 150000000, remaining: 150000000 }
    },
    rewards: {
      baseBlockReward: 50, // 50 EMO base mining reward
      baseValidationReward: 5, // 5 EMO base validation reward
      emotionalConsensusBonus: 25, // Up to 25 EMO bonus
      minimumValidatorStake: 10000 // 10,000 EMO minimum stake
    },
    staking: {
      baseRate: 0.05, // 5% APY
      wellnessMultiplier: 1.5, // Up to 1.5x for wellness > 80%
      authenticityMultiplier: 2.0, // Up to 2.0x for authenticity > 90%
      maxAPY: 0.15 // 15% maximum APY
    }
  };

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

  private calculateWellnessMultiplier(emotionalScore: number): number {
    // Wellness multiplier for staking rewards (up to 1.5x for score > 80%)
    if (emotionalScore >= 80) {
      return 1.0 + ((emotionalScore - 80) / 20) * 0.5; // Linear scale to 1.5x
    }
    return 1.0;
  }

  private calculateAuthenticityMultiplier(authenticity: number): number {
    // Authenticity multiplier for staking rewards (up to 2.0x for authenticity > 90%)
    if (authenticity >= 0.9) {
      return 1.0 + ((authenticity - 0.9) / 0.1) * 1.0; // Linear scale to 2.0x
    }
    return authenticity * 1.11; // Scale from 0-2.0x based on authenticity
  }

  private calculateValidationReward(validator: any, consensusScore: number): number {
    const baseReward = this.tokenEconomics.rewards.baseValidationReward;
    const consensusMultiplier = Math.max(0.6, consensusScore / 100); // 0.6-1.0 based on consensus
    const authenticityMultiplier = Math.max(0.7, validator.biometricData?.authenticity || 0.7);
    
    return Math.round(baseReward * consensusMultiplier * authenticityMultiplier * 100) / 100;
  }

  private calculateMiningReward(validator: any, transactionFees: number = 0): number {
    const baseReward = this.tokenEconomics.rewards.baseBlockReward;
    const consensusBonus = this.calculateConsensusBonus(validator.emotionalScore);
    
    return baseReward + transactionFees + consensusBonus;
  }

  private calculateConsensusBonus(emotionalScore: number): number {
    // Emotional consensus bonus up to 25 EMO based on validator performance
    const maxBonus = this.tokenEconomics.rewards.emotionalConsensusBonus;
    const bonusMultiplier = Math.max(0, (emotionalScore - 75) / 25); // Bonus starts at 75% score
    
    return Math.round(maxBonus * bonusMultiplier * 100) / 100;
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
      
      // Calculate transaction fees from block
      const transactionFees = newBlock.transactions.reduce((total: number, tx: any) => 
        total + (tx.fee || 0), 0);
      
      // Calculate authentic mining reward based on token economics
      const miningReward = this.calculateMiningReward(selectedValidator, transactionFees);
      const validationReward = this.calculateValidationReward(selectedValidator, this.calculateConsensusScore());
      const totalReward = miningReward + validationReward;
      
      // Deduct from staking pool
      if (this.tokenEconomics.pools.stakingPool.remaining >= totalReward) {
        this.tokenEconomics.pools.stakingPool.remaining -= totalReward;
        this.tokenEconomics.totalSupply += totalReward;
        this.tokenEconomics.circulatingSupply += totalReward;
        
        // Add mining reward transaction
        this.addTransaction({
          from: 'stakingPool',
          to: selectedValidator.id,
          amount: miningReward,
          type: 'mining_reward',
          timestamp: Date.now(),
          breakdown: {
            baseReward: this.tokenEconomics.rewards.baseBlockReward,
            consensusBonus: this.calculateConsensusBonus(selectedValidator.emotionalScore),
            transactionFees: transactionFees
          }
        });
        
        // Add validation reward transaction
        this.addTransaction({
          from: 'stakingPool',
          to: selectedValidator.id,
          amount: validationReward,
          type: 'validation_reward',
          timestamp: Date.now(),
          emotionalScore: selectedValidator.emotionalScore,
          consensusScore: this.calculateConsensusScore()
        });
      }
      
      // Update validator stats
      selectedValidator.blocksValidated++;
      selectedValidator.lastActive = Date.now();
      
      console.log(`✅ Block ${newBlock.index} mined successfully! Hash: ${hash.substring(0, 16)}...`);
      console.log(`💰 Validator ${selectedValidator.id.substring(0, 8)}... earned ${totalReward} EMO total`);
      console.log(`   ⛏️  Mining: ${miningReward} EMO (${this.tokenEconomics.rewards.baseBlockReward} base + ${this.calculateConsensusBonus(selectedValidator.emotionalScore)} bonus)`);
      console.log(`   ✅ Validation: ${validationReward} EMO (emotional consensus reward)`);
      console.log(`   📊 Pool Status: ${this.tokenEconomics.pools.stakingPool.remaining.toLocaleString()} EMO remaining`);
      
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

  public getTokenEconomics(): any {
    const percentageIssued = (this.tokenEconomics.totalSupply / this.tokenEconomics.maxSupply) * 100;
    
    return {
      totalSupply: this.tokenEconomics.totalSupply,
      maxSupply: this.tokenEconomics.maxSupply,
      circulatingSupply: this.tokenEconomics.circulatingSupply,
      percentageIssued: Math.round(percentageIssued * 100) / 100,
      pools: {
        staking: {
          allocated: this.tokenEconomics.pools.stakingPool.allocated,
          remaining: this.tokenEconomics.pools.stakingPool.remaining,
          utilized: this.tokenEconomics.pools.stakingPool.allocated - this.tokenEconomics.pools.stakingPool.remaining
        },
        wellness: {
          allocated: this.tokenEconomics.pools.wellnessPool.allocated,
          remaining: this.tokenEconomics.pools.wellnessPool.remaining,
          utilized: 0
        },
        ecosystem: {
          allocated: this.tokenEconomics.pools.ecosystemPool.allocated,
          remaining: this.tokenEconomics.pools.ecosystemPool.remaining,
          utilized: 0
        }
      },
      rewards: this.tokenEconomics.rewards,
      contractStatus: "AUTHENTIC_DISTRIBUTION_ACTIVE"
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
      consensusScore: this.calculateConsensusScore(),
      tokenEconomics: this.getTokenEconomics()
    };
  }
}