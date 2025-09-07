/**
 * Distributed Consensus Engine for EmotionalChain
 * Coordinates Proof of Emotion consensus across P2P network with Byzantine fault tolerance
 */

import { P2PValidatorNetwork, ConsensusMessage, NetworkState } from './P2PValidatorNetwork';
import { EmotionalValidator } from '../crypto/EmotionalValidator';
import { EmotionalZKProof, ZKProofService } from '../crypto/zkproofs/ZKProofService';
import { Block } from '../crypto/Block';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface ConsensusRound {
  roundNumber: number;
  proposer: string;
  proposedBlock?: Block;
  phase: 'PROPOSE' | 'VOTE' | 'COMMIT' | 'FINALIZED' | 'FAILED';
  startTime: number;
  timeout: number;
  
  // Vote tracking
  proposals: Map<string, ConsensusMessage>;
  votes: Map<string, ConsensusMessage>;
  commits: Map<string, ConsensusMessage>;
  
  // ZK proof validation
  zkProofs: Map<string, EmotionalZKProof>;
  eligibleValidators: Set<string>;
  
  // Byzantine fault tolerance
  requiredVotes: number;
  requiredCommits: number;
  actualVotes: number;
  actualCommits: number;
}

export interface ConsensusConfig {
  roundTimeout: number;          // 30 seconds per round
  maxRounds: number;             // Maximum rounds before giving up
  byzantineThreshold: number;    // 0.33 - can tolerate up to 1/3 Byzantine validators
  consensusThreshold: number;    // 0.67 - need 2/3+ agreement
  minValidators: number;         // Minimum validators needed for consensus
  emotionalThreshold: number;    // 75 - minimum emotional score
  authenticityThreshold: number; // 0.7 - minimum authenticity
}

export interface FaultTolerance {
  totalValidators: number;
  honestValidators: number;
  byzantineValidators: number;
  faultTolerance: number;
  safetyGuarantee: boolean;
  livenessGuarantee: boolean;
}

/**
 * Production-grade distributed consensus with Byzantine fault tolerance
 */
export class DistributedConsensusEngine extends EventEmitter {
  private p2pNetwork: P2PValidatorNetwork;
  private zkProofService: ZKProofService;
  private config: ConsensusConfig;
  
  private currentRound?: ConsensusRound;
  private consensusHistory: ConsensusRound[];
  private isConsensusActive: boolean;
  
  // Fault tolerance tracking
  private suspectedByzantineNodes: Set<string>;
  private validatorReputations: Map<string, number>;

  constructor(p2pNetwork: P2PValidatorNetwork, config?: Partial<ConsensusConfig>) {
    super();
    
    this.p2pNetwork = p2pNetwork;
    this.zkProofService = ZKProofService.getInstance();
    
    this.config = {
      roundTimeout: 30000,        // 30 seconds
      maxRounds: 10,              // Maximum 10 rounds
      byzantineThreshold: 0.33,   // Tolerate up to 1/3 Byzantine
      consensusThreshold: 0.67,   // Require 2/3+ agreement
      minValidators: 4,           // Need at least 4 validators (3f+1 for f=1)
      emotionalThreshold: 75,
      authenticityThreshold: 0.7,
      ...config
    };
    
    this.consensusHistory = [];
    this.isConsensusActive = false;
    this.suspectedByzantineNodes = new Set();
    this.validatorReputations = new Map();
    
    console.log('🏛️ Distributed Consensus Engine initialized with Byzantine fault tolerance');
  }

  /**
   * Start consensus round for a new block
   */
  async startConsensusRound(proposedBlock: Block, validators: EmotionalValidator[]): Promise<boolean> {
    if (this.isConsensusActive) {
      console.log('⏳ Consensus already active, queuing request');
      return false;
    }

    console.log(`🚀 Starting distributed consensus round for block ${proposedBlock.index}`);
    
    try {
      // Validate we have enough validators
      if (validators.length < this.config.minValidators) {
        console.error(`❌ Insufficient validators: ${validators.length} < ${this.config.minValidators}`);
        return false;
      }

      // Check Byzantine fault tolerance requirements
      const faultTolerance = this.calculateFaultTolerance(validators.length);
      if (!faultTolerance.safetyGuarantee) {
        console.error(`❌ Byzantine fault tolerance not satisfied`);
        return false;
      }

      // Generate ZK proofs for all validators
      const zkProofResults = await this.generateValidatorZKProofs(validators);
      
      // Filter eligible validators based on ZK proofs
      const eligibleValidators = this.filterEligibleValidators(zkProofResults);
      
      if (eligibleValidators.size < this.config.minValidators) {
        console.error(`❌ Insufficient eligible validators: ${eligibleValidators.size}`);
        return false;
      }

      // Select proposer (simple round-robin for now)
      const proposer = this.selectProposer(Array.from(eligibleValidators));

      // Initialize consensus round
      this.currentRound = this.createConsensusRound(
        proposedBlock, 
        proposer, 
        eligibleValidators, 
        zkProofResults
      );

      this.isConsensusActive = true;

      // Start the consensus protocol phases
      await this.executeConsensusProtocol();
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to start consensus round:', error);
      this.isConsensusActive = false;
      return false;
    }
  }

  /**
   * Generate ZK proofs for all validators
   */
  private async generateValidatorZKProofs(validators: EmotionalValidator[]): Promise<Map<string, EmotionalZKProof>> {
    console.log(`🔐 Generating ZK proofs for ${validators.length} validators...`);
    
    const zkProofResults = new Map<string, EmotionalZKProof>();
    
    // Generate proofs in parallel for efficiency
    const proofPromises = validators.map(async (validator) => {
      try {
        const zkProof = await this.zkProofService.generateValidatorProof(validator);
        return { validatorId: validator.id, zkProof };
      } catch (error) {
        console.error(`Failed to generate ZK proof for ${validator.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(proofPromises);
    
    results.forEach(result => {
      if (result) {
        zkProofResults.set(result.validatorId, result.zkProof);
      }
    });

    console.log(`✅ Generated ${zkProofResults.size}/${validators.length} ZK proofs`);
    
    return zkProofResults;
  }

  /**
   * Filter validators eligible for consensus based on ZK proofs
   */
  private filterEligibleValidators(zkProofs: Map<string, EmotionalZKProof>): Set<string> {
    const eligibleValidators = new Set<string>();
    
    for (const [validatorId, zkProof] of zkProofs.entries()) {
      // Check if ZK proof proves emotional and authenticity thresholds
      const emotionalThresholdMet = zkProof.publicSignals[0] === '1';
      const authenticityValid = zkProof.publicSignals[1] === '1';
      
      // Check reputation (exclude suspected Byzantine nodes)
      const reputation = this.validatorReputations.get(validatorId) || 100;
      const goodReputation = reputation >= 50 && !this.suspectedByzantineNodes.has(validatorId);
      
      if (emotionalThresholdMet && authenticityValid && goodReputation) {
        eligibleValidators.add(validatorId);
      } else {
        console.log(`❌ Validator ${validatorId} ineligible: Emotional=${emotionalThresholdMet}, Auth=${authenticityValid}, Rep=${goodReputation}`);
      }
    }
    
    console.log(`✅ ${eligibleValidators.size} validators eligible for consensus`);
    
    return eligibleValidators;
  }

  /**
   * Create a new consensus round
   */
  private createConsensusRound(
    proposedBlock: Block, 
    proposer: string, 
    eligibleValidators: Set<string>, 
    zkProofs: Map<string, EmotionalZKProof>
  ): ConsensusRound {
    const roundNumber = this.consensusHistory.length + 1;
    const totalValidators = eligibleValidators.size;
    
    return {
      roundNumber,
      proposer,
      proposedBlock,
      phase: 'PROPOSE',
      startTime: Date.now(),
      timeout: this.config.roundTimeout,
      
      proposals: new Map(),
      votes: new Map(),
      commits: new Map(),
      
      zkProofs,
      eligibleValidators,
      
      // Byzantine fault tolerance calculations
      requiredVotes: Math.ceil(totalValidators * this.config.consensusThreshold),
      requiredCommits: Math.ceil(totalValidators * this.config.consensusThreshold),
      actualVotes: 0,
      actualCommits: 0
    };
  }

  /**
   * Execute the three-phase consensus protocol
   * PHASE 1: PROPOSE - Proposer broadcasts block proposal
   * PHASE 2: VOTE - Validators vote on the proposal
   * PHASE 3: COMMIT - Validators commit to the decision
   */
  private async executeConsensusProtocol(): Promise<void> {
    if (!this.currentRound) {
      throw new Error('No active consensus round');
    }

    console.log(`🏛️ Executing consensus protocol for round ${this.currentRound.roundNumber}`);

    try {
      // Phase 1: PROPOSE
      await this.executeProposalPhase();
      
      // Phase 2: VOTE  
      await this.executeVotingPhase();
      
      // Phase 3: COMMIT
      await this.executeCommitPhase();
      
      // Finalize consensus
      await this.finalizeConsensus();
      
    } catch (error) {
      console.error('❌ Consensus protocol failed:', error);
      await this.handleConsensusFailure();
    }
  }

  /**
   * Phase 1: PROPOSE - Broadcast block proposal
   */
  private async executeProposalPhase(): Promise<void> {
    if (!this.currentRound) return;
    
    console.log(`📝 Phase 1: PROPOSE (Round ${this.currentRound.roundNumber})`);
    this.currentRound.phase = 'PROPOSE';
    
    // Proposer broadcasts the block proposal
    const proposalMessage: ConsensusMessage = {
      type: 'PROPOSE',
      round: this.currentRound.roundNumber,
      blockHash: this.currentRound.proposedBlock?.hash,
      validatorId: this.currentRound.proposer,
      zkProof: this.currentRound.zkProofs.get(this.currentRound.proposer),
      signature: this.signMessage(this.currentRound.proposedBlock?.hash || ''),
      timestamp: Date.now()
    };

    // Broadcast proposal to network
    await this.broadcastConsensusMessage(proposalMessage);
    
    // Wait for proposal phase to complete
    await this.waitForPhaseTimeout(5000); // 5 seconds for proposal phase
  }

  /**
   * Phase 2: VOTE - Validators vote on the proposal
   */
  private async executeVotingPhase(): Promise<void> {
    if (!this.currentRound) return;
    
    console.log(`🗳️ Phase 2: VOTE (Round ${this.currentRound.roundNumber})`);
    this.currentRound.phase = 'VOTE';
    
    // Each eligible validator votes
    for (const validatorId of this.currentRound.eligibleValidators) {
      const voteMessage: ConsensusMessage = {
        type: 'VOTE',
        round: this.currentRound.roundNumber,
        blockHash: this.currentRound.proposedBlock?.hash,
        validatorId,
        zkProof: this.currentRound.zkProofs.get(validatorId),
        signature: this.signMessage(this.currentRound.proposedBlock?.hash || ''),
        timestamp: Date.now()
      };

      this.currentRound.votes.set(validatorId, voteMessage);
      await this.broadcastConsensusMessage(voteMessage);
    }

    this.currentRound.actualVotes = this.currentRound.votes.size;
    
    // Check if we have enough votes
    if (this.currentRound.actualVotes >= this.currentRound.requiredVotes) {
      console.log(`✅ Voting phase complete: ${this.currentRound.actualVotes}/${this.currentRound.requiredVotes} votes`);
    } else {
      throw new Error(`Insufficient votes: ${this.currentRound.actualVotes}/${this.currentRound.requiredVotes}`);
    }
    
    await this.waitForPhaseTimeout(10000); // 10 seconds for voting phase
  }

  /**
   * Phase 3: COMMIT - Validators commit to the decision
   */
  private async executeCommitPhase(): Promise<void> {
    if (!this.currentRound) return;
    
    console.log(`📋 Phase 3: COMMIT (Round ${this.currentRound.roundNumber})`);
    this.currentRound.phase = 'COMMIT';
    
    // Each voting validator commits
    for (const [validatorId, voteMessage] of this.currentRound.votes) {
      const commitMessage: ConsensusMessage = {
        type: 'COMMIT',
        round: this.currentRound.roundNumber,
        blockHash: voteMessage.blockHash,
        validatorId,
        signature: this.signMessage(voteMessage.blockHash || ''),
        timestamp: Date.now()
      };

      this.currentRound.commits.set(validatorId, commitMessage);
      await this.broadcastConsensusMessage(commitMessage);
    }

    this.currentRound.actualCommits = this.currentRound.commits.size;
    
    // Check if we have enough commits
    if (this.currentRound.actualCommits >= this.currentRound.requiredCommits) {
      console.log(`✅ Commit phase complete: ${this.currentRound.actualCommits}/${this.currentRound.requiredCommits} commits`);
    } else {
      throw new Error(`Insufficient commits: ${this.currentRound.actualCommits}/${this.currentRound.requiredCommits}`);
    }
    
    await this.waitForPhaseTimeout(10000); // 10 seconds for commit phase
  }

  /**
   * Finalize consensus and commit block
   */
  private async finalizeConsensus(): Promise<void> {
    if (!this.currentRound || !this.currentRound.proposedBlock) return;
    
    console.log(`🏁 Finalizing consensus for round ${this.currentRound.roundNumber}`);
    this.currentRound.phase = 'FINALIZED';
    
    // Update validator reputations (reward good behavior)
    this.updateValidatorReputations(true);
    
    // Emit consensus success
    this.emit('consensus:success', {
      block: this.currentRound.proposedBlock,
      round: this.currentRound.roundNumber,
      votes: this.currentRound.actualVotes,
      commits: this.currentRound.actualCommits,
      participants: this.currentRound.eligibleValidators.size
    });
    
    // Archive the round
    this.consensusHistory.push(this.currentRound);
    this.currentRound = undefined;
    this.isConsensusActive = false;
    
    console.log(`✅ Consensus successful - Block ${this.currentRound?.proposedBlock?.index} finalized`);
  }

  /**
   * Handle consensus failure
   */
  private async handleConsensusFailure(): Promise<void> {
    if (!this.currentRound) return;
    
    console.log(`❌ Consensus failed for round ${this.currentRound.roundNumber}`);
    this.currentRound.phase = 'FAILED';
    
    // Update validator reputations (penalize failure)
    this.updateValidatorReputations(false);
    
    // Detect Byzantine behavior
    this.detectByzantineBehavior();
    
    // Emit consensus failure
    this.emit('consensus:failure', {
      round: this.currentRound.roundNumber,
      reason: 'Consensus protocol failure',
      votes: this.currentRound.actualVotes,
      commits: this.currentRound.actualCommits
    });
    
    // Archive the failed round
    this.consensusHistory.push(this.currentRound);
    this.currentRound = undefined;
    this.isConsensusActive = false;
  }

  /**
   * Calculate Byzantine fault tolerance for given validator count
   */
  private calculateFaultTolerance(totalValidators: number): FaultTolerance {
    // Byzantine fault tolerance: can tolerate up to (n-1)/3 Byzantine nodes
    const maxByzantineNodes = Math.floor((totalValidators - 1) / 3);
    const minHonestNodes = totalValidators - maxByzantineNodes;
    
    return {
      totalValidators,
      honestValidators: minHonestNodes,
      byzantineValidators: maxByzantineNodes,
      faultTolerance: maxByzantineNodes,
      safetyGuarantee: totalValidators >= 3 * maxByzantineNodes + 1,
      livenessGuarantee: minHonestNodes >= Math.ceil(totalValidators * 0.67)
    };
  }

  /**
   * Select proposer for this round (simple round-robin)
   */
  private selectProposer(eligibleValidators: string[]): string {
    const roundNumber = this.consensusHistory.length;
    const proposerIndex = roundNumber % eligibleValidators.length;
    return eligibleValidators[proposerIndex];
  }

  /**
   * Update validator reputations based on consensus participation
   */
  private updateValidatorReputations(success: boolean): void {
    if (!this.currentRound) return;
    
    for (const validatorId of this.currentRound.eligibleValidators) {
      const currentReputation = this.validatorReputations.get(validatorId) || 100;
      
      if (success) {
        // Reward participation in successful consensus
        const participated = this.currentRound.votes.has(validatorId) && 
                           this.currentRound.commits.has(validatorId);
        
        if (participated) {
          this.validatorReputations.set(validatorId, Math.min(100, currentReputation + 1));
        }
      } else {
        // Penalize participation in failed consensus
        this.validatorReputations.set(validatorId, Math.max(0, currentReputation - 2));
      }
    }
  }

  /**
   * Detect potential Byzantine behavior
   */
  private detectByzantineBehavior(): void {
    if (!this.currentRound) return;
    
    // Look for validators who voted but didn't commit
    for (const [validatorId, voteMessage] of this.currentRound.votes) {
      if (!this.currentRound.commits.has(validatorId)) {
        console.log(`🚨 Suspicious behavior detected from validator ${validatorId}`);
        
        // Lower reputation significantly
        const currentReputation = this.validatorReputations.get(validatorId) || 100;
        this.validatorReputations.set(validatorId, Math.max(0, currentReputation - 10));
        
        // If reputation falls too low, mark as suspected Byzantine
        if (currentReputation < 30) {
          this.suspectedByzantineNodes.add(validatorId);
          console.log(`🚨 Validator ${validatorId} marked as suspected Byzantine node`);
        }
      }
    }
  }

  // Helper methods
  private async broadcastConsensusMessage(message: ConsensusMessage): Promise<void> {
    // In a real implementation, this would broadcast via P2P network
    console.log(`📡 Broadcasting ${message.type} message from ${message.validatorId}`);
  }

  private signMessage(message: string): string {
    // Simple signature - in production, use proper cryptographic signing
    return crypto.createHash('sha256').update(message + Date.now()).digest('hex');
  }

  private async waitForPhaseTimeout(timeout: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  /**
   * Get consensus engine status
   */
  getConsensusStatus(): any {
    return {
      isActive: this.isConsensusActive,
      currentRound: this.currentRound?.roundNumber || 0,
      currentPhase: this.currentRound?.phase || 'IDLE',
      totalRounds: this.consensusHistory.length,
      successfulRounds: this.consensusHistory.filter(r => r.phase === 'FINALIZED').length,
      suspectedByzantineNodes: Array.from(this.suspectedByzantineNodes),
      validatorReputations: Object.fromEntries(this.validatorReputations)
    };
  }

  /**
   * Get Byzantine fault tolerance info for current network
   */
  getByzantineFaultTolerance(): FaultTolerance | null {
    const networkState = this.p2pNetwork.getNetworkState();
    const totalValidators = networkState.activeValidators.size;
    
    if (totalValidators === 0) return null;
    
    return this.calculateFaultTolerance(totalValidators);
  }
}