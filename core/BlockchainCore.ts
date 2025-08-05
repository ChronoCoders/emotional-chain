/**
 * EmotionalChain Core - Main Blockchain Engine
 * Central coordinator for the entire blockchain system
 */

import { Block } from '../crypto/Block';
import { Transaction } from '../crypto/Transaction';
import { EmotionalValidator } from '../consensus/EmotionalValidator';
import { ProofOfEmotionEngine } from '../consensus/ProofOfEmotionEngine';
import { BiometricDevice } from '../biometric/BiometricDevice';
import { P2PNode } from '../network/P2PNode';
import { EnterpriseEmotionalProcessor } from '../biometric/EnterpriseEmotionalMetrics';

export interface BlockchainState {
  currentBlock: number;
  totalSupply: number;
  circulatingSupply: number;
  stakedSupply: number;
  validators: EmotionalValidator[];
  pendingTransactions: Transaction[];
}

export class BlockchainCore {
  private currentBlock: number = 0;
  private blockchain: Block[] = [];
  private validators: Map<string, EmotionalValidator> = new Map();
  private pendingTransactions: Transaction[] = [];
  private consensusEngine: ProofOfEmotionEngine;
  private p2pNode: P2PNode;
  private emotionalMetrics: EnterpriseEmotionalProcessor;
  
  // Economic Constants
  private readonly TOTAL_SUPPLY = 1000000; // 1M EMO maximum
  private readonly GENESIS_SUPPLY = 640000; // Current circulating supply
  private readonly STAKED_SUPPLY = 179411.10; // Currently staked

  constructor() {
    this.consensusEngine = new ProofOfEmotionEngine();
    this.p2pNode = new P2PNode();
    this.emotionalMetrics = new EnterpriseEmotionalProcessor();
    this.initializeGenesis();
  }

  private initializeGenesis(): void {
    console.log('BLOCKCHAIN CORE: Initializing EmotionalChain Genesis Block');
    
    // Create genesis block with initial validator set
    const genesisBlock = new Block(
      0,
      '0000000000000000000000000000000000000000000000000000000000000000',
      [],
      Date.now(),
      'Genesis Block - Proof of Emotion Blockchain'
    );
    
    this.blockchain.push(genesisBlock);
    this.currentBlock = 1;
    
    // Initialize the 21 ecosystem validators
    this.initializeValidators();
    
    console.log(`BLOCKCHAIN CORE: Genesis initialized with ${this.validators.size} validators`);
    console.log(`BLOCKCHAIN CORE: Economic state - Total: ${this.TOTAL_SUPPLY}, Circulating: ${this.GENESIS_SUPPLY}, Staked: ${this.STAKED_SUPPLY}`);
  }

  private initializeValidators(): void {
    const validatorNames = [
      'QuantumReach', 'NeuralForge', 'CryptoSentinel', 'DataVault', 'ChainFlux',
      'StellarNode', 'ByteGuardians', 'NebulaForge', 'AstroSentinel', 'GravityCore',
      'OrionPulse', 'DarkMatterLabs', 'VoidMining', 'CosmicForge', 'EtherWave',
      'InfinityMining', 'QuantumEdge', 'NexusCore', 'CyberForge', 'StealthMining', 'ApexNode'
    ];

    validatorNames.forEach((name, index) => {
      const validator = new EmotionalValidator(
        `validator_${index + 1}`,
        name,
        this.generateValidatorAddress(name),
        1000 + Math.random() * 9000 // Random stake between 1K-10K EMO
      );
      
      this.validators.set(validator.id, validator);
    });
  }

  private generateValidatorAddress(name: string): string {
    // Generate deterministic address based on validator name
    return `0x${Buffer.from(name).toString('hex').padEnd(40, '0').substring(0, 40)}`;
  }

  /**
   * Get current blockchain state
   */
  public getBlockchainState(): BlockchainState {
    const totalStaked = Array.from(this.validators.values())
      .reduce((sum, validator) => sum + validator.stake, 0);

    return {
      currentBlock: this.currentBlock,
      totalSupply: this.TOTAL_SUPPLY,
      circulatingSupply: this.GENESIS_SUPPLY,
      stakedSupply: totalStaked,
      validators: Array.from(this.validators.values()),
      pendingTransactions: this.pendingTransactions
    };
  }

  /**
   * Process new block with PoE consensus
   */
  public async processNewBlock(transactions: Transaction[]): Promise<Block | null> {
    try {
      // Get current consensus round from PoE engine
      const consensusResult = await this.consensusEngine.runConsensusRound(
        Array.from(this.validators.values()),
        transactions
      );

      if (!consensusResult.success) {
        console.log('BLOCKCHAIN CORE: Consensus failed, block rejected');
        return null;
      }

      // Create new block
      const previousBlock = this.blockchain[this.blockchain.length - 1];
      const newBlock = new Block(
        this.currentBlock,
        previousBlock.hash,
        transactions,
        Date.now(),
        `Block ${this.currentBlock} - PoE Consensus`
      );

      // Add to blockchain
      this.blockchain.push(newBlock);
      this.currentBlock++;

      // Clear processed transactions
      this.pendingTransactions = this.pendingTransactions.filter(
        tx => !transactions.includes(tx)
      );

      console.log(`BLOCKCHAIN CORE: Block ${newBlock.index} processed with ${transactions.length} transactions`);
      
      // Broadcast to network
      await this.p2pNode.broadcastBlock(newBlock);

      return newBlock;
    } catch (error) {
      console.error('BLOCKCHAIN CORE: Block processing failed:', error);
      return null;
    }
  }

  /**
   * Add transaction to pending pool
   */
  public addTransaction(transaction: Transaction): boolean {
    try {
      // Validate transaction
      if (!transaction.verify()) {
        console.log('BLOCKCHAIN CORE: Invalid transaction rejected');
        return false;
      }

      this.pendingTransactions.push(transaction);
      console.log(`BLOCKCHAIN CORE: Transaction ${transaction.id} added to pool`);
      return true;
    } catch (error) {
      console.error('BLOCKCHAIN CORE: Transaction validation failed:', error);
      return false;
    }
  }

  /**
   * Get validator by ID
   */
  public getValidator(id: string): EmotionalValidator | undefined {
    return this.validators.get(id);
  }

  /**
   * Get all active validators
   */
  public getActiveValidators(): EmotionalValidator[] {
    return Array.from(this.validators.values()).filter(v => v.isActive);
  }

  /**
   * Get blockchain length
   */
  public getBlockchainLength(): number {
    return this.blockchain.length;
  }

  /**
   * Get latest block
   */
  public getLatestBlock(): Block {
    return this.blockchain[this.blockchain.length - 1];
  }

  /**
   * Get block by index
   */
  public getBlock(index: number): Block | undefined {
    return this.blockchain[index];
  }

  /**
   * Start blockchain processing
   */
  public async start(): Promise<void> {
    console.log('BLOCKCHAIN CORE: Starting EmotionalChain blockchain');
    
    // Start P2P networking
    await this.p2pNode.start();
    
    // Start consensus engine
    await this.consensusEngine.start();
    
    // Start emotional metrics processing
    this.emotionalMetrics.startProcessing();
    
    console.log('BLOCKCHAIN CORE: EmotionalChain blockchain started successfully');
  }

  /**
   * Stop blockchain processing
   */
  public async stop(): Promise<void> {
    console.log('BLOCKCHAIN CORE: Stopping EmotionalChain blockchain');
    
    await this.p2pNode.stop();
    await this.consensusEngine.stop();
    this.emotionalMetrics.stopProcessing();
    
    console.log('BLOCKCHAIN CORE: EmotionalChain blockchain stopped');
  }
}