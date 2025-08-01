import { EventEmitter } from 'eventemitter3';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Mutex } from 'async-mutex';
import PQueue from 'p-queue';
import pLimit from 'p-limit';
import { performance } from 'perf_hooks';
import { nanoid } from 'nanoid';
import * as _ from 'lodash';
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
import { P2PNode } from '../network/P2PNode';
import { DatabaseStorage } from '../storage/DatabaseStorage';
import { Block } from '../server/blockchain/Block';
import { Transaction } from '../crypto/Transaction';
import { EmotionalValidator } from './EmotionalValidator';
import { ConsensusRound } from './ConsensusRound';
import { EmotionalCommittee } from './EmotionalCommittee';
import { ByzantineTolerance } from './ByzantineTolerance';
import { EmotionalProof } from './EmotionalProof';
import { RewardCalculator } from './RewardCalculator';
import { ForkResolution } from './ForkResolution';
import { ConsensusMetrics } from './ConsensusMetrics';
/**
 * Production-grade Proof of Emotion consensus engine
 * Implements Byzantine fault-tolerant emotional consensus with real-time validation
 */
export interface ConsensusConfig {
  epochDuration: number; // 30 seconds
  emotionalThreshold: number; // 75% minimum emotional fitness
  byzantineThreshold: number; // 67% honest validator requirement
  committeeSize: number; // 21 active validators
  minimumStake: number; // 10,000 EMO
  votingTimeout: number; // 8 seconds
  proposalTimeout: number; // 10 seconds
  finalityTimeout: number; // 2 seconds
}
export interface ConsensusState {
  currentEpoch: number;
  currentRound: ConsensusRound | null;
  activeCommittee: EmotionalCommittee | null;
  networkHealth: number;
  consensusStrength: number;
  emotionalFitness: number;
  participationRate: number;
  lastFinalized: Block | null;
  pendingTransactions: Transaction[];
}
export interface EpochResult {
  success: boolean;
  block: Block | null;
  metrics: {
    duration: number;
    participantCount: number;
    emotionalAverage: number;
    byzantineFailures: number;
  };
  errors: string[];
}
export class ProofOfEmotionEngine extends EventEmitter {
  private config: ConsensusConfig;
  private p2pNode: P2PNode;
  private storage: DatabaseStorage;
  private consensusMutex = new Mutex();
  private processingQueue = new PQueue({ concurrency: 1 });
  private validatorPool = new Map<string, EmotionalValidator>();
  // Consensus components
  private byzantineTolerance: ByzantineTolerance;
  private rewardCalculator: RewardCalculator;
  private forkResolution: ForkResolution;
  private metrics: ConsensusMetrics;
  // State management
  private state$ = new BehaviorSubject<ConsensusState>({
    currentEpoch: 0,
    currentRound: null,
    activeCommittee: null,
    networkHealth: 100,
    consensusStrength: 0,
    emotionalFitness: 0,
    participationRate: 0,
    lastFinalized: null,
    pendingTransactions: []
  });
  private epochTimer?: NodeJS.Timeout;
  private isRunning = false;
  private epochStartTime = 0;
  constructor(
    p2pNode: P2PNode,
    storage: DatabaseStorage,
    config: Partial<ConsensusConfig> = {}
  ) {
    super();
    this.p2pNode = p2pNode;
    this.storage = storage;
    this.config = {
      epochDuration: 30000, // 30 seconds
      emotionalThreshold: 75,
      byzantineThreshold: 67,
      committeeSize: 21,
      minimumStake: 10000,
      votingTimeout: 8000,
      proposalTimeout: 10000,
      finalityTimeout: 2000,
      ...config
    };
    // Initialize consensus components
    this.byzantineTolerance = new ByzantineTolerance(this.config);
    this.rewardCalculator = new RewardCalculator(this.config);
    this.forkResolution = new ForkResolution(this.storage);
    this.metrics = new ConsensusMetrics();
    this.setupNetworkHandlers();
    this.startMetricsCollection();
  }
  async initialize(): Promise<void> {
    // Load validator pool from storage
    await this.loadValidatorPool();
    // Initialize consensus components
    await this.byzantineTolerance.initialize();
    await this.forkResolution.initialize();
    await this.metrics.initialize();
    // Recover from any interrupted consensus
    await this.recoverConsensusState();
    this.emit('initialized');
  }
  async startConsensus(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Consensus engine is already running');
    }
    this.isRunning = true;
    console.log(' Starting Proof of Emotion consensus...');
    // Start the epoch cycle
    await this.startEpochCycle();
    this.emit('consensus-started');
  }
  async stopConsensus(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    console.log('🛑 Stopping Proof of Emotion consensus...');
    if (this.epochTimer) {
      clearTimeout(this.epochTimer);
      this.epochTimer = undefined;
    }
    // Complete any ongoing rounds
    const currentState = this.state$.value;
    if (currentState.currentRound) {
      await currentState.currentRound.abort();
    }
    await this.processingQueue.onIdle();
    this.emit('consensus-stopped');
  }
  // Epoch management
  private async startEpochCycle(): Promise<void> {
    if (!this.isRunning) return;
    try {
      const epochResult = await this.executeEpoch();
      // Schedule next epoch
      const nextEpochDelay = Math.max(
        0,
        this.config.epochDuration - (performance.now() - this.epochStartTime)
      );
      this.epochTimer = setTimeout(() => {
        this.startEpochCycle();
      }, nextEpochDelay);
      this.emit('epoch-completed', epochResult);
    } catch (error) {
      this.emit('epoch-failed', error);
      // Retry after brief delay
      this.epochTimer = setTimeout(() => {
        this.startEpochCycle();
      }, 5000);
    }
  }
  private async executeEpoch(): Promise<EpochResult> {
    const epochId = nanoid();
    this.epochStartTime = performance.now();
    console.log(`⏰ Starting epoch ${this.state$.value.currentEpoch + 1} (${epochId})`);
    const limit = pLimit(10); // Parallel processing limit
    const epochMetrics = {
      duration: 0,
      participantCount: 0,
      emotionalAverage: 0,
      byzantineFailures: 0
    };
    const errors: string[] = [];
    try {
      return await this.consensusMutex.runExclusive(async () => {
        // Phase 1: Emotional Assessment (5 seconds)
        const assessmentStart = performance.now();
        const eligibleValidators = await this.performEmotionalAssessment();
        const assessmentDuration = performance.now() - assessmentStart;
        if (eligibleValidators.length === 0) {
          throw new Error('No validators meet emotional fitness threshold');
        }
        epochMetrics.participantCount = eligibleValidators.length;
        epochMetrics.emotionalAverage = _.meanBy(eligibleValidators, 'emotionalScore');
        // Phase 2: Committee Selection (5 seconds)
        const committee = await this.selectEmotionalCommittee(eligibleValidators);
        // Phase 3: Block Proposal (10 seconds)
        const proposalStart = performance.now();
        const proposedBlock = await this.proposeBlock(committee);
        if (!proposedBlock) {
          throw new Error('Block proposal failed');
        }
        // Phase 4: Emotional Voting (8 seconds)
        const votingStart = performance.now();
        const consensusRound = new ConsensusRound(
          epochId,
          committee,
          proposedBlock,
          this.config,
          this.p2pNode
        );
        // Update state with current round
        this.updateState({
          currentEpoch: this.state$.value.currentEpoch + 1,
          currentRound: consensusRound,
          activeCommittee: committee
        });
        const votingResult = await consensusRound.executeVoting();
        if (!votingResult.success) {
          epochMetrics.byzantineFailures = votingResult.byzantineCount;
          throw new Error(`Voting failed: ${votingResult.reason}`);
        }
        // Phase 5: Block Finalization (2 seconds)
        const finalizedBlock = await this.finalizeBlock(proposedBlock, votingResult);
        // Update metrics
        epochMetrics.duration = performance.now() - this.epochStartTime;
        await this.metrics.recordEpoch(epochMetrics);
        // Update state
        this.updateState({
          currentRound: null,
          lastFinalized: finalizedBlock,
          networkHealth: this.calculateNetworkHealth(),
          consensusStrength: votingResult.consensusStrength
        });
        // Distribute rewards
        await this.distributeRewards(committee, votingResult, epochMetrics);
        return {
          success: true,
          block: finalizedBlock,
          metrics: epochMetrics,
          errors
        };
      });
    } catch (error) {
      errors.push(error.message);
      // Handle Byzantine failures
      if (error.message.includes('byzantine')) {
        await this.byzantineTolerance.handleByzantineFailure(error);
      }
      epochMetrics.duration = performance.now() - this.epochStartTime;
      return {
        success: false,
        block: null,
        metrics: epochMetrics,
        errors
      };
    }
  }
  // Phase 1: Emotional Assessment
  private async performEmotionalAssessment(): Promise<EmotionalValidator[]> {
    console.log('💓 Performing emotional assessment...');
    const assessmentPromises = Array.from(this.validatorPool.values()).map(async (validator) => {
      try {
        await validator.updateEmotionalState();
        // Check minimum requirements
        if (validator.getEmotionalScore() >= this.config.emotionalThreshold &&
            validator.getStake() >= this.config.minimumStake &&
            validator.isActive()) {
          return validator;
        }
        return null;
      } catch (error) {
        return null;
      }
    });
    const results = await Promise.allSettled(assessmentPromises);
    const eligibleValidators = results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<EmotionalValidator>).value);
    console.log(`💓 ${eligibleValidators.length}/${this.validatorPool.size} validators eligible`);
    return eligibleValidators;
  }
  // Phase 2: Committee Selection
  private async selectEmotionalCommittee(eligibleValidators: EmotionalValidator[]): Promise<EmotionalCommittee> {
    const committee = new EmotionalCommittee(
      this.config.committeeSize,
      this.config.byzantineThreshold
    );
    await committee.selectValidators(eligibleValidators);
    return committee;
  }
  // Phase 3: Block Proposal
  private async proposeBlock(committee: EmotionalCommittee): Promise<Block | null> {
    const primaryValidator = committee.getPrimaryValidator();
    if (!primaryValidator) {
      throw new Error('No primary validator available');
    }
    // Get pending transactions
    const pendingTxs = this.state$.value.pendingTransactions.slice(0, 1000); // Limit to 1000 txs
    // Get latest block for chaining
    const latestBlock = await this.storage.getLatestBlock();
    const height = latestBlock ? latestBlock.height + 1 : 1;
    // Create emotional proof for the block
    const emotionalProof = await EmotionalProof.createBlockProof(
      committee.getValidators(),
      await this.collectBiometricReadings(committee.getValidators())
    );
    // Propose block
    const proposedBlock = await primaryValidator.proposeBlock({
      height,
      previousHash: latestBlock?.hash || '0'.repeat(64),
      transactions: pendingTxs,
      emotionalProof,
      timestamp: Date.now()
    });
    // Broadcast proposal to committee
    await committee.broadcastProposal(proposedBlock);
    return proposedBlock;
  }
  // Phase 5: Block Finalization
  private async finalizeBlock(block: Block, votingResult: any): Promise<Block> {
    console.log(' Finalizing block...');
    // Store block with consensus metadata
    const finalizedBlock = {
      ...block,
      consensusMetadata: {
        votingResult,
        participantCount: votingResult.participants.length,
        consensusStrength: votingResult.consensusStrength,
        emotionalFitness: votingResult.averageEmotionalScore,
        finalizedAt: Date.now()
      }
    };
    // Persist to storage
    await this.storage.storeBlock(finalizedBlock);
    // Remove finalized transactions from pending
    const finalizedTxHashes = new Set(block.transactions.map(tx => tx.hash));
    this.updateState({
      pendingTransactions: this.state$.value.pendingTransactions.filter(
        tx => !finalizedTxHashes.has(tx.hash)
      )
    });
    // Check for forks and resolve if necessary
    await this.forkResolution.checkAndResolve(finalizedBlock);
    console.log(` Block ${finalizedBlock.height} finalized with ${block.transactions.length} transactions`);
    return finalizedBlock;
  }
  // Reward distribution
  private async distributeRewards(
    committee: EmotionalCommittee,
    votingResult: any,
    epochMetrics: any
  ): Promise<void> {
    const rewards = await this.rewardCalculator.calculateRewards(
      committee.getValidators(),
      votingResult,
      epochMetrics
    );
    for (const [validatorId, reward] of rewards.entries()) {
      const validator = this.validatorPool.get(validatorId);
      if (validator) {
        await validator.addReward(reward);
        await this.storage.updateValidatorBalance(validatorId, validator.getBalance());
      }
    }
  }
  // Transaction management
  async submitTransaction(transaction: Transaction): Promise<void> {
    // Validate transaction
    if (!transaction.hash || !transaction.signature) {
      throw new Error('Invalid transaction: missing hash or signature');
    }
    // Check for duplicates
    const existingTx = await this.storage.getTransaction(transaction.hash);
    if (existingTx) {
      throw new Error('Transaction already exists');
    }
    // Add to pending transactions
    const currentState = this.state$.value;
    this.updateState({
      pendingTransactions: [...currentState.pendingTransactions, transaction]
    });
    this.emit('transaction-submitted', transaction);
  }
  // Validator management
  async registerValidator(validator: EmotionalValidator): Promise<void> {
    if (validator.getStake() < this.config.minimumStake) {
      throw new Error(`Minimum stake of ${this.config.minimumStake} EMO required`);
    }
    this.validatorPool.set(validator.getId(), validator);
    await this.storage.updateValidatorBalance(validator.getId(), validator.getBalance());
    console.log(`👤 Validator ${validator.getId()} registered with ${validator.getStake()} EMO stake`);
    this.emit('validator-registered', validator);
  }
  async removeValidator(validatorId: string): Promise<void> {
    const validator = this.validatorPool.get(validatorId);
    if (!validator) {
      throw new Error('Validator not found');
    }
    this.validatorPool.delete(validatorId);
    console.log(`👤 Validator ${validatorId} removed from consensus`);
    this.emit('validator-removed', validatorId);
  }
  // Network event handlers
  private setupNetworkHandlers(): void {
    this.p2pNode.on('consensus-message', async (message: any) => {
      await this.handleConsensusMessage(message);
    });
    this.p2pNode.on('validator-heartbeat', async (heartbeat: any) => {
      await this.handleValidatorHeartbeat(heartbeat);
    });
    this.p2pNode.on('network-partition', async () => {
      await this.handleNetworkPartition();
    });
  }
  private async handleConsensusMessage(message: any): Promise<void> {
    const currentRound = this.state$.value.currentRound;
    if (currentRound) {
      await currentRound.handleMessage(message);
    }
  }
  private async handleValidatorHeartbeat(heartbeat: any): Promise<void> {
    const validator = this.validatorPool.get(heartbeat.validatorId);
    if (validator) {
      await validator.updateLastSeen();
    }
  }
  private async handleNetworkPartition(): Promise<void> {
    await this.stopConsensus();
    // Wait for network healing
    setTimeout(() => {
      if (this.p2pNode.getPeerCount() > this.config.committeeSize / 2) {
        this.startConsensus();
      }
    }, 30000);
  }
  // State management
  private updateState(updates: Partial<ConsensusState>): void {
    const currentState = this.state$.value;
    const newState = { ...currentState, ...updates };
    this.state$.next(newState);
    this.emit('state-updated', newState);
  }
  // Utility methods
  private async loadValidatorPool(): Promise<void> {
    const validatorStates = await this.storage.getAllValidatorStates();
    for (const state of validatorStates) {
      if (state.balance >= this.config.minimumStake) {
        const validator = new EmotionalValidator(
          state.validatorId,
          state.balance,
          state.emotionalScore
        );
        this.validatorPool.set(state.validatorId, validator);
      }
    }
  }
  private async recoverConsensusState(): Promise<void> {
    const latestBlock = await this.storage.getLatestBlock();
    if (latestBlock) {
      this.updateState({
        lastFinalized: latestBlock,
        currentEpoch: latestBlock.height
      });
    }
  }
  private async collectBiometricReadings(validators: EmotionalValidator[]): Promise<Map<string, BiometricReading[]>> {
    const readings = new Map<string, BiometricReading[]>();
    for (const validator of validators) {
      const validatorReadings = await validator.getRecentBiometricData();
      readings.set(validator.getId(), validatorReadings);
    }
    return readings;
  }
  private calculateNetworkHealth(): number {
    const activeValidators = Array.from(this.validatorPool.values()).filter(v => v.isActive());
    const totalValidators = this.validatorPool.size;
    if (totalValidators === 0) return 0;
    const activityRate = (activeValidators.length / totalValidators) * 100;
    const averageEmotionalScore = _.meanBy(activeValidators, v => v.getEmotionalScore());
    return (activityRate * 0.6) + (averageEmotionalScore * 0.4);
  }
  private startMetricsCollection(): void {
    // Collect metrics every 10 seconds
    setInterval(() => {
      const state = this.state$.value;
      this.metrics.recordNetworkHealth(state.networkHealth);
      this.metrics.recordConsensusStrength(state.consensusStrength);
      this.metrics.recordParticipationRate(state.participationRate);
      this.metrics.recordValidatorCount(this.validatorPool.size);
    }, 10000);
  }
  // Public API
  getState(): ConsensusState {
    return this.state$.value;
  }
  getStateObservable(): Observable<ConsensusState> {
    return this.state$.asObservable();
  }
  getValidatorCount(): number {
    return this.validatorPool.size;
  }
  getActiveValidatorCount(): number {
    return Array.from(this.validatorPool.values()).filter(v => v.isActive()).length;
  }
  getMetrics(): ConsensusMetrics {
    return this.metrics;
  }
  async getConsensusHealth(): Promise<{ healthy: boolean; details: any }> {
    const state = this.state$.value;
    const activeValidators = this.getActiveValidatorCount();
    const healthy = 
      this.isRunning &&
      activeValidators >= this.config.committeeSize &&
      state.networkHealth > 50 &&
      state.consensusStrength > this.config.byzantineThreshold;
    return {
      healthy,
      details: {
        running: this.isRunning,
        activeValidators,
        requiredValidators: this.config.committeeSize,
        networkHealth: state.networkHealth,
        consensusStrength: state.consensusStrength,
        currentEpoch: state.currentEpoch,
        lastFinalized: state.lastFinalized?.height || 0,
        pendingTransactions: state.pendingTransactions.length,
        timestamp: Date.now()
      }
    };
  }
  // Shutdown
  async shutdown(): Promise<void> {
    await this.stopConsensus();
    await this.metrics.shutdown();
    console.log('🛑 Proof of Emotion consensus engine shutdown complete');
  }
}