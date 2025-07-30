import { EventEmitter } from 'eventemitter3';
import { performance } from 'perf_hooks';
import * as _ from 'lodash';

import { Block } from '../server/blockchain/Block';
import { P2PNode } from '../network/P2PNode';
import { EmotionalValidator } from './EmotionalValidator';
import { EmotionalCommittee } from './EmotionalCommittee';
import { EmotionalProof } from './EmotionalProof';

/**
 * Individual consensus round implementation
 * Three-phase process: PROPOSE → VOTE → COMMIT
 */

export enum RoundPhase {
  PROPOSE = 'PROPOSE',
  VOTE = 'VOTE', 
  COMMIT = 'COMMIT',
  FINALIZED = 'FINALIZED',
  ABORTED = 'ABORTED'
}

export interface RoundConfig {
  votingTimeout: number;
  proposalTimeout: number;
  finalityTimeout: number;
  byzantineThreshold: number;
}

export interface Vote {
  validatorId: string;
  blockHash: string;
  emotionalScore: number;
  signature: string;
  timestamp: number;
  approved: boolean;
  reason?: string;
}

export interface VotingResult {
  success: boolean;
  consensusStrength: number;
  participantCount: number;
  byzantineCount: number;
  averageEmotionalScore: number;
  participants: string[];
  votes: Vote[];
  reason?: string;
}

export class ConsensusRound extends EventEmitter {
  private roundId: string;
  private committee: EmotionalCommittee;
  private proposedBlock: Block;
  private config: RoundConfig;
  private p2pNode: P2PNode;
  
  private phase = RoundPhase.PROPOSE;
  private startTime = performance.now();
  private votes = new Map<string, Vote>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  
  private result: VotingResult | null = null;
  private aborted = false;
  
  constructor(
    roundId: string,
    committee: EmotionalCommittee,
    proposedBlock: Block,
    config: RoundConfig,
    p2pNode: P2PNode
  ) {
    super();
    
    this.roundId = roundId;
    this.committee = committee;
    this.proposedBlock = proposedBlock;
    this.config = config;
    this.p2pNode = p2pNode;
    
    this.setupNetworkHandlers();
  }
  
  async executeVoting(): Promise<VotingResult> {
    if (this.aborted) {
      throw new Error('Consensus round already aborted');
    }
    
    console.log(`🗳️  Starting consensus round ${this.roundId}`);
    
    try {
      // Phase 1: Proposal Broadcasting (already done in ProofOfEmotionEngine)
      await this.executeProposalPhase();
      
      // Phase 2: Voting
      await this.executeVotingPhase();
      
      // Phase 3: Commit
      await this.executeCommitPhase();
      
      this.phase = RoundPhase.FINALIZED;
      
      const result = this.calculateResult();
      this.result = result;
      
      console.log(`✅ Consensus round ${this.roundId} completed: ${result.success}`);
      this.emit('round-completed', result);
      
      return result;
      
    } catch (error) {
      this.phase = RoundPhase.ABORTED;
      console.error(`❌ Consensus round ${this.roundId} failed:`, error.message);
      
      const errorResult: VotingResult = {
        success: false,
        consensusStrength: 0,
        participantCount: 0,
        byzantineCount: 0,
        averageEmotionalScore: 0,
        participants: [],
        votes: [],
        reason: error.message
      };
      
      this.result = errorResult;
      this.emit('round-failed', errorResult);
      
      return errorResult;
    } finally {
      this.cleanup();
    }
  }
  
  // Phase 1: Proposal Broadcasting
  private async executeProposalPhase(): Promise<void> {
    this.phase = RoundPhase.PROPOSE;
    
    const proposalMessage = {
      type: 'block-proposal',
      roundId: this.roundId,
      block: this.proposedBlock,
      proposer: this.committee.getPrimaryValidator()?.getId(),
      timestamp: Date.now()
    };
    
    // Broadcast to all committee members
    for (const validator of this.committee.getValidators()) {
      await this.p2pNode.sendMessage(validator.getId(), proposalMessage);
    }
    
    // Wait for proposal timeout
    await this.wait(this.config.proposalTimeout);
    
    console.log(`📨 Block proposal broadcasted to ${this.committee.size()} validators`);
  }
  
  // Phase 2: Voting
  private async executeVotingPhase(): Promise<void> {
    this.phase = RoundPhase.VOTE;
    
    console.log(`🗳️  Starting voting phase for round ${this.roundId}`);
    
    // Request votes from all committee members
    const votingMessage = {
      type: 'voting-request',
      roundId: this.roundId,
      blockHash: this.proposedBlock.hash,
      timeout: this.config.votingTimeout,
      timestamp: Date.now()
    };
    
    // Send voting request to all validators
    const votingPromises = this.committee.getValidators().map(async (validator) => {
      try {
        await this.p2pNode.sendMessage(validator.getId(), votingMessage);
        
        // Set timeout for this validator's vote
        const timeoutId = setTimeout(() => {
          this.handleVoteTimeout(validator.getId());
        }, this.config.votingTimeout);
        
        this.timeouts.set(validator.getId(), timeoutId);
        
      } catch (error) {
        console.warn(`⚠️  Failed to send voting request to ${validator.getId()}`);
      }
    });
    
    await Promise.allSettled(votingPromises);
    
    // Wait for voting period to complete
    await this.wait(this.config.votingTimeout);
    
    console.log(`🗳️  Voting phase completed: ${this.votes.size}/${this.committee.size()} votes received`);
  }
  
  // Phase 3: Commit
  private async executeCommitPhase(): Promise<void> {
    this.phase = RoundPhase.COMMIT;
    
    const result = this.calculateResult();
    
    if (result.success) {
      // Broadcast commit message
      const commitMessage = {
        type: 'block-commit',
        roundId: this.roundId,
        blockHash: this.proposedBlock.hash,
        consensusStrength: result.consensusStrength,
        participants: result.participants,
        timestamp: Date.now()
      };
      
      // Notify all committee members of successful consensus
      for (const validator of this.committee.getValidators()) {
        try {
          await this.p2pNode.sendMessage(validator.getId(), commitMessage);
        } catch (error) {
          console.warn(`⚠️  Failed to send commit message to ${validator.getId()}`);
        }
      }
      
      console.log(`✅ Block ${this.proposedBlock.hash.substring(0, 12)}... committed with ${result.consensusStrength}% consensus`);
    } else {
      // Broadcast rejection message
      const rejectMessage = {
        type: 'block-reject',
        roundId: this.roundId,
        blockHash: this.proposedBlock.hash,
        reason: result.reason,
        timestamp: Date.now()
      };
      
      for (const validator of this.committee.getValidators()) {
        try {
          await this.p2pNode.sendMessage(validator.getId(), rejectMessage);
        } catch (error) {
          console.warn(`⚠️  Failed to send reject message to ${validator.getId()}`);
        }
      }
      
      console.log(`❌ Block ${this.proposedBlock.hash.substring(0, 12)}... rejected: ${result.reason}`);
    }
    
    // Wait for finality timeout
    await this.wait(this.config.finalityTimeout);
  }
  
  // Message handling
  private setupNetworkHandlers(): void {
    // Already handled in ProofOfEmotionEngine, but we can process specific round messages
  }
  
  async handleMessage(message: any): Promise<void> {
    if (message.roundId !== this.roundId) return;
    
    switch (message.type) {
      case 'vote-response':
        await this.handleVoteResponse(message);
        break;
        
      case 'vote-timeout':
        this.handleVoteTimeout(message.validatorId);
        break;
        
      default:
        console.warn(`Unknown message type in consensus round: ${message.type}`);
    }
  }
  
  private async handleVoteResponse(message: any): Promise<void> {
    const { validatorId, vote } = message;
    
    // Validate vote
    if (!this.isValidVote(vote)) {
      console.warn(`⚠️  Invalid vote received from ${validatorId}`);
      return;
    }
    
    // Check if validator is in committee
    if (!this.committee.hasValidator(validatorId)) {
      console.warn(`⚠️  Vote from non-committee member: ${validatorId}`);
      return;
    }
    
    // Check if already voted
    if (this.votes.has(validatorId)) {
      console.warn(`⚠️  Duplicate vote from ${validatorId}`);
      return;
    }
    
    // Store vote
    this.votes.set(validatorId, vote);
    
    // Clear timeout for this validator
    const timeoutId = this.timeouts.get(validatorId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(validatorId);
    }
    
    console.log(`✅ Vote received from ${validatorId}: ${vote.approved ? 'APPROVE' : 'REJECT'} (score: ${vote.emotionalScore})`);
    
    this.emit('vote-received', { validatorId, vote });
    
    // Check if we have enough votes for early consensus
    if (this.votes.size >= Math.ceil(this.committee.size() * 0.67)) {
      const preliminaryResult = this.calculateResult();
      
      if (preliminaryResult.success && preliminaryResult.consensusStrength >= this.config.byzantineThreshold) {
        console.log(`🚀 Early consensus achieved: ${preliminaryResult.consensusStrength}%`);
        this.emit('early-consensus', preliminaryResult);
      }
    }
  }
  
  private handleVoteTimeout(validatorId: string): void {
    if (this.votes.has(validatorId)) return; // Already voted
    
    console.warn(`⏰ Vote timeout for validator ${validatorId}`);
    
    // Create timeout vote (counts as abstain/reject)
    const timeoutVote: Vote = {
      validatorId,
      blockHash: this.proposedBlock.hash,
      emotionalScore: 0,
      signature: '',
      timestamp: Date.now(),
      approved: false,
      reason: 'timeout'
    };
    
    this.votes.set(validatorId, timeoutVote);
    
    this.emit('vote-timeout', { validatorId });
  }
  
  // Vote validation
  private isValidVote(vote: Vote): boolean {
    // Check required fields
    if (!vote.validatorId || !vote.blockHash || !vote.signature) {
      return false;
    }
    
    // Check block hash matches
    if (vote.blockHash !== this.proposedBlock.hash) {
      return false;
    }
    
    // Check emotional score range
    if (vote.emotionalScore < 0 || vote.emotionalScore > 100) {
      return false;
    }
    
    // Check timestamp is recent
    if (Date.now() - vote.timestamp > 60000) { // 1 minute max age
      return false;
    }
    
    // TODO: Verify signature (requires validator's public key)
    
    return true;
  }
  
  // Result calculation
  private calculateResult(): VotingResult {
    const allVotes = Array.from(this.votes.values());
    const approvedVotes = allVotes.filter(vote => vote.approved);
    const participantCount = this.votes.size;
    const committeeSize = this.committee.size();
    
    // Calculate consensus strength
    const approvalRate = participantCount > 0 ? (approvedVotes.length / participantCount) * 100 : 0;
    const participationRate = (participantCount / committeeSize) * 100;
    const consensusStrength = (approvalRate * 0.7) + (participationRate * 0.3);
    
    // Calculate average emotional score
    const averageEmotionalScore = participantCount > 0 
      ? _.meanBy(allVotes, 'emotionalScore') 
      : 0;
    
    // Count Byzantine failures (timeouts and rejections without valid reasons)
    const byzantineCount = allVotes.filter(vote => 
      !vote.approved && (!vote.reason || vote.reason === 'timeout')
    ).length;
    
    // Determine success
    const requiredVotes = Math.ceil(committeeSize * (this.config.byzantineThreshold / 100));
    const success = 
      approvedVotes.length >= requiredVotes &&
      consensusStrength >= this.config.byzantineThreshold &&
      averageEmotionalScore >= 75;
    
    let reason: string | undefined;
    if (!success) {
      if (approvedVotes.length < requiredVotes) {
        reason = `Insufficient approved votes: ${approvedVotes.length}/${requiredVotes} required`;
      } else if (consensusStrength < this.config.byzantineThreshold) {
        reason = `Consensus strength too low: ${consensusStrength.toFixed(1)}% < ${this.config.byzantineThreshold}%`;
      } else if (averageEmotionalScore < 75) {
        reason = `Average emotional score too low: ${averageEmotionalScore.toFixed(1)}% < 75%`;
      }
    }
    
    return {
      success,
      consensusStrength,
      participantCount,
      byzantineCount,
      averageEmotionalScore,
      participants: Array.from(this.votes.keys()),
      votes: allVotes,
      reason
    };
  }
  
  // Utilities
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private cleanup(): void {
    // Clear all timeouts
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
  }
  
  // Public methods
  async abort(): Promise<void> {
    if (this.aborted) return;
    
    this.aborted = true;
    this.phase = RoundPhase.ABORTED;
    
    console.log(`🛑 Aborting consensus round ${this.roundId}`);
    
    // Notify committee members
    const abortMessage = {
      type: 'round-abort',
      roundId: this.roundId,
      reason: 'External abort request',
      timestamp: Date.now()
    };
    
    for (const validator of this.committee.getValidators()) {
      try {
        await this.p2pNode.sendMessage(validator.getId(), abortMessage);
      } catch (error) {
        // Ignore send errors during abort
      }
    }
    
    this.cleanup();
    this.emit('round-aborted');
  }
  
  getRoundId(): string {
    return this.roundId;
  }
  
  getPhase(): RoundPhase {
    return this.phase;
  }
  
  getProposedBlock(): Block {
    return this.proposedBlock;
  }
  
  getCommittee(): EmotionalCommittee {
    return this.committee;
  }
  
  getVotes(): Map<string, Vote> {
    return new Map(this.votes);
  }
  
  getResult(): VotingResult | null {
    return this.result;
  }
  
  getDuration(): number {
    return performance.now() - this.startTime;
  }
  
  isCompleted(): boolean {
    return this.phase === RoundPhase.FINALIZED || this.phase === RoundPhase.ABORTED;
  }
  
  isAborted(): boolean {
    return this.aborted;
  }
  
  // Statistics
  getStatistics(): {
    duration: number;
    phase: RoundPhase;
    voteCount: number;
    consensusStrength: number;
    averageEmotionalScore: number;
  } {
    const result = this.result || this.calculateResult();
    
    return {
      duration: this.getDuration(),
      phase: this.phase,
      voteCount: this.votes.size,
      consensusStrength: result.consensusStrength,
      averageEmotionalScore: result.averageEmotionalScore
    };
  }
}