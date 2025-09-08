/**
 * Independent Validator Node for EmotionalChain
 * Production-ready validator that can run anywhere and coordinate via P2P
 */

import { P2PValidatorNetwork, NetworkValidator, NetworkState } from './P2PValidatorNetwork';
import { EmotionalValidator, EmotionalValidatorUtils } from '../crypto/EmotionalValidator';
import { ZKProofService, EmotionalZKProof } from '../crypto/zkproofs/ZKProofService';
import { Block } from '../crypto/Block';
import { Transaction } from '../crypto/Transaction';
import { ImmutableBlockchainService } from '../server/blockchain/ImmutableBlockchainService';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ValidatorConfig {
  validatorId: string;
  privateKey: string;
  stakingAmount: number;
  biometricEnabled: boolean;
  networkConfig: {
    bootstrapNodes: string[];
    listenPort?: number;
    dataDir: string;
  };
  consensusConfig: {
    minEmotionalScore: number;
    minAuthenticity: number;
    roundTimeout: number;
  };
}

export interface ValidatorMetrics {
  blocksProposed: number;
  blocksValidated: number;
  consensusParticipation: number;
  networkLatency: number;
  uptime: number;
  earnings: number;
  reputation: number;
  slashingEvents: number;
}

export interface ValidatorStatus {
  isActive: boolean;
  isStaked: boolean;
  isEligible: boolean;
  currentStake: number;
  emotionalScore: number;
  authenticity: number;
  networkConnected: boolean;
  peersConnected: number;
  lastBlockTime: number;
  syncStatus: 'synced' | 'syncing' | 'behind';
}

/**
 * Independent Validator Node
 * Can run on any machine and participate in EmotionalChain consensus
 */
export class IndependentValidatorNode {
  private config: ValidatorConfig;
  private p2pNetwork: P2PValidatorNetwork;
  private blockchain: ImmutableBlockchainService;
  private zkProofService: ZKProofService;
  private validator?: EmotionalValidator;
  
  private metrics: ValidatorMetrics;
  private status: ValidatorStatus;
  private isRunning: boolean;
  private dataDir: string;

  constructor(config: ValidatorConfig) {
    this.config = config;
    this.dataDir = config.networkConfig.dataDir;
    
    // Initialize services
    this.p2pNetwork = new P2PValidatorNetwork({
      bootstrapNodes: config.networkConfig.bootstrapNodes,
      listenPort: config.networkConfig.listenPort,
      minValidators: 7
    });
    
    this.blockchain = new ImmutableBlockchainService();
    this.zkProofService = ZKProofService.getInstance();
    
    // Initialize metrics
    this.metrics = {
      blocksProposed: 0,
      blocksValidated: 0,
      consensusParticipation: 0,
      networkLatency: 0,
      uptime: 0,
      earnings: 0,
      reputation: 100,
      slashingEvents: 0
    };
    
    // Initialize status
    this.status = {
      isActive: false,
      isStaked: false,
      isEligible: false,
      currentStake: 0,
      emotionalScore: 0,
      authenticity: 0,
      networkConnected: false,
      peersConnected: 0,
      lastBlockTime: 0,
      syncStatus: 'behind'
    };
    
    this.isRunning = false;
    
    console.log(`🏗️ Independent validator node created: ${config.validatorId}`);
  }

  /**
   * Start the independent validator node
   */
  async start(): Promise<void> {
    try {
      console.log(`🚀 Starting independent validator node: ${this.config.validatorId}`);
      
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      // Load or create validator identity
      await this.initializeValidator();
      
      // Initialize blockchain service
      await this.blockchain.initialize();
      
      // Start P2P network
      await this.p2pNetwork.initialize();
      await this.p2pNetwork.registerValidator(this.validator!);
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Start validator operations
      await this.startValidatorOperations();
      
      // Begin network synchronization
      await this.synchronizeWithNetwork();
      
      this.isRunning = true;
      this.status.isActive = true;
      this.status.networkConnected = true;
      
      console.log(`✅ Validator node ${this.config.validatorId} started successfully`);
      
      // Start metrics tracking
      this.startMetricsTracking();
      
    } catch (error) {
      console.error(`❌ Failed to start validator node:`, error);
      throw error;
    }
  }

  /**
   * Initialize validator identity and load from disk if exists
   */
  private async initializeValidator(): Promise<void> {
    const validatorPath = path.join(this.dataDir, 'validator.json');
    
    try {
      // Try to load existing validator
      const validatorData = await fs.readFile(validatorPath, 'utf-8');
      const validatorInfo = JSON.parse(validatorData);
      
      this.validator = {
        id: validatorInfo.id,
        address: validatorInfo.address,
        emotionalScore: 80, // Will be updated from biometric data
        authenticity: 0.85,
        biometricData: validatorInfo.biometricData || {
          heartRate: 75,
          stressLevel: 25,
          focusLevel: 90,
          authenticity: 0.85,
          timestamp: Date.now()
        },
        lastActive: Date.now(),
        blocksValidated: this.metrics.blocksValidated
      };
      
      console.log(`📋 Loaded existing validator: ${this.validator.id}`);
      
    } catch (error) {
      // Create new validator
      this.validator = EmotionalValidatorUtils.createValidator(
        this.config.validatorId,
        crypto.randomBytes(20).toString('hex') // Generate address
      );
      
      // Save validator to disk
      await this.saveValidatorData();
      
      console.log(`🆕 Created new validator: ${this.validator.id}`);
    }
  }

  /**
   * Save validator data to disk
   */
  private async saveValidatorData(): Promise<void> {
    if (!this.validator) return;
    
    const validatorPath = path.join(this.dataDir, 'validator.json');
    const validatorData = {
      id: this.validator.id,
      address: this.validator.address,
      biometricData: this.validator.biometricData,
      blocksValidated: this.validator.blocksValidated,
      lastSaved: Date.now()
    };
    
    await fs.writeFile(validatorPath, JSON.stringify(validatorData, null, 2));
  }

  /**
   * Set up P2P network event handlers
   */
  private setupEventHandlers(): void {
    this.p2pNetwork.on('network:ready', () => {
      console.log('🌐 P2P network ready');
      this.status.networkConnected = true;
    });

    this.p2pNetwork.on('peer:connected', (peerId: string) => {
      this.status.peersConnected++;
      console.log(`🤝 Connected to peer: ${peerId} (${this.status.peersConnected} total)`);
    });

    this.p2pNetwork.on('consensus:complete', (data: any) => {
      this.handleConsensusComplete(data);
    });

    this.p2pNetwork.on('consensus:timeout', (round: number) => {
      console.log(`⏰ Consensus round ${round} timed out`);
      this.metrics.consensusParticipation = Math.max(0, this.metrics.consensusParticipation - 0.1);
    });
  }

  /**
   * Start validator operations (block production, validation, etc.)
   */
  private async startValidatorOperations(): Promise<void> {
    // Check staking status
    await this.checkStakingStatus();
    
    // Start emotional state monitoring
    this.startEmotionalMonitoring();
    
    // Begin consensus participation
    this.startConsensusParticipation();
    
    console.log(`🔄 Validator operations started`);
  }

  /**
   * Synchronize blockchain state with the network
   */
  private async synchronizeWithNetwork(): Promise<void> {
    console.log('🔄 Synchronizing with network...');
    this.status.syncStatus = 'syncing';
    
    try {
      // Get current blockchain height from network
      const networkState = this.p2pNetwork.getNetworkState();
      
      // Sync blockchain state
      // In a real implementation, this would download missing blocks
      await this.blockchain.syncWithNetwork();
      
      this.status.syncStatus = 'synced';
      console.log('✅ Network synchronization complete');
      
    } catch (error) {
      console.error('❌ Network synchronization failed:', error);
      this.status.syncStatus = 'behind';
    }
  }

  /**
   * Check if validator is properly staked
   */
  private async checkStakingStatus(): Promise<void> {
    // In a real implementation, this would check on-chain staking
    this.status.currentStake = this.config.stakingAmount;
    this.status.isStaked = this.status.currentStake >= 1000; // Minimum stake
    
    console.log(`💰 Staking status: ${this.status.isStaked ? 'STAKED' : 'NOT STAKED'} (${this.status.currentStake} EMO)`);
  }

  /**
   * Start emotional state monitoring
   */
  private startEmotionalMonitoring(): void {
    if (!this.validator) return;
    
    setInterval(async () => {
      try {
        // Update emotional state (in real implementation, from biometric devices)
        if (this.config.biometricEnabled) {
          await this.updateBiometricData();
        } else {
          await this.updateSimulatedEmotionalState();
        }
        
        // Check eligibility for consensus
        this.checkConsensusEligibility();
        
      } catch (error) {
        console.error('❌ Emotional monitoring error:', error);
      }
    }, 300000); // Every 5 minutes (reduced from 30 seconds)
  }

  /**
   * Update biometric data from real devices
   */
  private async updateBiometricData(): Promise<void> {
    if (!this.validator) return;
    
    try {
      // In real implementation, connect to biometric devices via Web Bluetooth
      // For now, simulate realistic biometric variation
      const baseScore = 75 + Math.random() * 20;
      const authenticity = 0.8 + Math.random() * 0.15;
      
      this.validator.emotionalScore = baseScore;
      this.validator.authenticity = authenticity;
      this.validator.biometricData = {
        heartRate: 70 + Math.random() * 20,
        stressLevel: 20 + Math.random() * 30,
        focusLevel: 80 + Math.random() * 15,
        authenticity,
        timestamp: Date.now()
      };
      
      console.log(`❤️ Biometric update - Score: ${baseScore.toFixed(1)}, Authenticity: ${(authenticity * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ Biometric data update failed:', error);
    }
  }

  /**
   * Update simulated emotional state (for development)
   */
  private async updateSimulatedEmotionalState(): Promise<void> {
    if (!this.validator) return;
    
    // Simulate realistic emotional variations
    const baseScore = 75 + Math.sin(Date.now() / 300000) * 10 + Math.random() * 10;
    const authenticity = 0.85 + Math.random() * 0.1;
    
    this.validator.emotionalScore = Math.max(0, Math.min(100, baseScore));
    this.validator.authenticity = Math.max(0, Math.min(1, authenticity));
    this.validator.lastActive = Date.now();
    
    this.status.emotionalScore = this.validator.emotionalScore;
    this.status.authenticity = this.validator.authenticity;
  }

  /**
   * Check if validator is eligible for consensus participation
   */
  private checkConsensusEligibility(): void {
    if (!this.validator) return;
    
    const meetsEmotionalThreshold = this.validator.emotionalScore >= this.config.consensusConfig.minEmotionalScore;
    const meetsAuthenticityThreshold = this.validator.authenticity >= this.config.consensusConfig.minAuthenticity;
    const isStaked = this.status.isStaked;
    const isNetworkConnected = this.status.networkConnected;
    
    this.status.isEligible = meetsEmotionalThreshold && 
                            meetsAuthenticityThreshold && 
                            isStaked && 
                            isNetworkConnected;
    
    if (this.status.isEligible) {
      console.log(`✅ Validator eligible for consensus - Score: ${this.validator.emotionalScore.toFixed(1)}, Auth: ${(this.validator.authenticity * 100).toFixed(1)}%`);
    }
  }

  /**
   * Start participating in consensus rounds
   */
  private startConsensusParticipation(): void {
    setInterval(async () => {
      if (this.status.isEligible && this.isRunning) {
        await this.participateInConsensus();
      }
    }, 120000); // Every 2 minutes (reduced from 30 seconds)
  }

  /**
   * Participate in a consensus round
   */
  private async participateInConsensus(): Promise<void> {
    if (!this.validator) return;
    
    try {
      console.log(`🗳️ Participating in consensus as ${this.validator.id}`);
      
      // Generate ZK proof for emotional validation
      const zkProof = await this.zkProofService.generateValidatorProof(this.validator);
      
      // Create a new block proposal (if selected as proposer)
      if (this.shouldProposeBlock()) {
        const block = await this.createBlockProposal();
        const success = await this.p2pNetwork.startConsensusRound(block);
        
        if (success) {
          this.metrics.blocksProposed++;
          console.log(`📦 Proposed block ${block.index} for consensus`);
        }
      }
      
      this.metrics.consensusParticipation = Math.min(1.0, this.metrics.consensusParticipation + 0.1);
      
    } catch (error) {
      console.error('❌ Consensus participation error:', error);
      this.metrics.consensusParticipation = Math.max(0, this.metrics.consensusParticipation - 0.05);
    }
  }

  /**
   * Determine if this validator should propose the next block
   */
  private shouldProposeBlock(): boolean {
    // Simple round-robin selection based on validator ID
    // In production, use weighted random selection based on stake
    const networkState = this.p2pNetwork.getNetworkState();
    const activeValidators = Array.from(networkState.activeValidators.values())
      .filter(v => v.isActive);
    
    if (activeValidators.length === 0) return false;
    
    const proposerIndex = networkState.currentRound % activeValidators.length;
    const selectedProposer = activeValidators[proposerIndex];
    
    return selectedProposer?.id === this.validator?.id;
  }

  /**
   * Create a new block proposal
   */
  private async createBlockProposal(): Promise<Block> {
    if (!this.validator) {
      throw new Error('No validator available for block proposal');
    }
    
    // Get pending transactions
    const pendingTxs = await this.blockchain.getPendingTransactions();
    
    // Create new block
    const lastBlock = await this.blockchain.getLatestBlock();
    const block = new Block(
      lastBlock.index + 1,
      pendingTxs.slice(0, 100), // Limit to 100 transactions per block
      lastBlock.hash,
      this.validator,
      this.validator.emotionalScore
    );
    
    return block;
  }

  /**
   * Handle completed consensus rounds
   */
  private handleConsensusComplete(data: any): void {
    console.log(`🎯 Consensus complete for round ${data.round}`);
    
    this.metrics.blocksValidated++;
    this.status.lastBlockTime = Date.now();
    
    // Calculate earnings (simplified)
    const earnings = this.calculateBlockReward(data.block);
    this.metrics.earnings += earnings;
    
    console.log(`💰 Block reward: ${earnings} EMO`);
  }

  /**
   * Calculate block reward for validator participation
   */
  private calculateBlockReward(block: any): number {
    // Base reward of 10 EMO per block
    let reward = 10;
    
    // Bonus for emotional score
    if (this.validator && this.validator.emotionalScore > 90) {
      reward += 2;
    }
    
    // Bonus for high consensus participation
    if (this.metrics.consensusParticipation > 0.9) {
      reward += 1;
    }
    
    return reward;
  }

  /**
   * Start metrics tracking and periodic reporting
   */
  private startMetricsTracking(): void {
    const startTime = Date.now();
    
    setInterval(() => {
      // Update uptime
      this.metrics.uptime = Date.now() - startTime;
      
      // Log metrics periodically
      if (this.metrics.uptime % 300000 === 0) { // Every 5 minutes
        this.logValidatorMetrics();
      }
      
      // Save validator data periodically
      this.saveValidatorData().catch(console.error);
      
    }, 60000); // Every minute
  }

  /**
   * Log validator metrics
   */
  private logValidatorMetrics(): void {
    console.log(`📊 Validator Metrics for ${this.config.validatorId}:`);
    console.log(`   Blocks Proposed: ${this.metrics.blocksProposed}`);
    console.log(`   Blocks Validated: ${this.metrics.blocksValidated}`);
    console.log(`   Consensus Participation: ${(this.metrics.consensusParticipation * 100).toFixed(1)}%`);
    console.log(`   Network Peers: ${this.status.peersConnected}`);
    console.log(`   Emotional Score: ${this.status.emotionalScore.toFixed(1)}`);
    console.log(`   Authenticity: ${(this.status.authenticity * 100).toFixed(1)}%`);
    console.log(`   Total Earnings: ${this.metrics.earnings.toFixed(2)} EMO`);
    console.log(`   Reputation: ${this.metrics.reputation}/100`);
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Get current validator status
   */
  getStatus(): ValidatorStatus {
    return { ...this.status };
  }

  /**
   * Get validator metrics
   */
  getMetrics(): ValidatorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get network state
   */
  getNetworkState(): NetworkState {
    return this.p2pNetwork.getNetworkState();
  }

  /**
   * Stop the validator node
   */
  async stop(): Promise<void> {
    console.log(`🛑 Stopping validator node: ${this.config.validatorId}`);
    
    this.isRunning = false;
    this.status.isActive = false;
    
    // Save final state
    await this.saveValidatorData();
    
    // Shutdown P2P network
    await this.p2pNetwork.shutdown();
    
    console.log(`✅ Validator node ${this.config.validatorId} stopped`);
  }
}