import { EventEmitter } from 'events';
import { EmotionalConsensusEngine, EmotionalProfile, ConsensusResult } from '../biometric/EmotionalConsensus';
import { P2PNode } from './P2PNode';
import { EmotionalProtocol, MessageType, EmotionalVoteMessage, BlockProposalMessage } from './EmotionalProtocol';
// Block interface for consensus
interface BlockData {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
  transactions: any[];
  emotionalData: any;
}
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
export interface ConsensusRound {
  roundNumber: number;
  startTime: number;
  duration: number;
  participants: string[];
  votes: Map<string, EmotionalVoteMessage>;
  result: ConsensusResult | null;
  status: 'PREPARING' | 'VOTING' | 'COUNTING' | 'COMPLETED' | 'FAILED';
}
export interface ValidatorState {
  validatorId: string;
  isOnline: boolean;
  lastHeartbeat: number;
  emotionalProfile: EmotionalProfile | null;
  reputation: number;
  consecutiveFailures: number;
  totalVotes: number;
  successfulVotes: number;
}
export interface NetworkConsensus {
  currentRound: ConsensusRound | null;
  validators: Map<string, ValidatorState>;
  byzantineThreshold: number;
  consensusStrength: number;
  networkHealth: number;
  forkCount: number;
}
export class DistributedConsensusEngine extends EventEmitter {
  private p2pNode: P2PNode;
  private protocol: EmotionalProtocol;
  private emotionalEngine: EmotionalConsensusEngine;
  private validatorId: string;
  private networkConsensus: NetworkConsensus;
  private consensusHistory: ConsensusRound[] = [];
  private roundTimer: NodeJS.Timeout | null = null;
  // Consensus parameters
  private readonly CONSENSUS_ROUND_DURATION = 30000; // 30 seconds
  private readonly MIN_VALIDATORS_REQUIRED = 4;
  private readonly BYZANTINE_FAULT_TOLERANCE = 0.33; // 33% malicious tolerance
  private readonly HEARTBEAT_INTERVAL = 10000; // 10 seconds
  private readonly VALIDATOR_TIMEOUT = 60000; // 1 minute
  constructor(
    validatorId: string,
    p2pNode: P2PNode,
    protocol: EmotionalProtocol
  ) {
    super();
    this.validatorId = validatorId;
    this.p2pNode = p2pNode;
    this.protocol = protocol;
    this.emotionalEngine = new EmotionalConsensusEngine();
    this.networkConsensus = {
      currentRound: null,
      validators: new Map(),
      byzantineThreshold: 0,
      consensusStrength: 0,
      networkHealth: 0,
      forkCount: 0
    };
    this.setupProtocolHandlers();
    this.startHeartbeat();
  }
  /**
   * Start the distributed consensus process
   */
  public async startConsensus(): Promise<void> {
    console.log(` Starting distributed consensus for validator ${this.validatorId}`);
    try {
      // Register our validator
      await this.registerValidator();
      // Start consensus rounds
      await this.initiateConsensusRound();
      this.emit('consensusStarted');
    } catch (error) {
      console.error('Failed to start consensus:', error);
      this.emit('consensusError', error);
      throw error;
    }
  }
  /**
   * Stop the consensus process
   */
  public async stopConsensus(): Promise<void> {
    console.log('🛑 Stopping distributed consensus...');
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    // Complete current round if active
    if (this.networkConsensus.currentRound?.status === 'VOTING') {
      await this.finalizeConsensusRound();
    }
    this.emit('consensusStopped');
  }
  /**
   * Submit biometric data for consensus
   */
  public async submitBiometricData(
    readings: BiometricReading[],
    authenticityProofs: AuthenticityProof[]
  ): Promise<void> {
    try {
      // Calculate emotional profile
      const emotionalProfile = this.emotionalEngine.calculateEmotionalScore(readings, authenticityProofs);
      // Update our validator state
      const validatorState = this.networkConsensus.validators.get(this.validatorId);
      if (validatorState) {
        validatorState.emotionalProfile = emotionalProfile;
        validatorState.lastHeartbeat = Date.now();
      }
      // Create and broadcast biometric proof
      const biometricProof = this.protocol.createBiometricProof(
        this.validatorId,
        readings[0], // Use first reading as representative
        authenticityProofs[0]
      );
      await this.p2pNode.publishToTopic('biometric-proofs', biometricProof);
    } catch (error) {
      console.error('Failed to submit biometric data:', error);
      throw error;
    }
  }
  /**
   * Propose a new block to the network
   */
  public async proposeBlock(block: BlockData): Promise<void> {
    try {
      const currentRound = this.networkConsensus.currentRound;
      if (!currentRound || currentRound.status !== 'VOTING') {
        throw new Error('No active consensus round for block proposal');
      }
      const validatorState = this.networkConsensus.validators.get(this.validatorId);
      if (!validatorState?.emotionalProfile) {
        throw new Error('No emotional profile available for block proposal');
      }
      // Create block proposal message
      const votes = Array.from(currentRound.votes.values());
      const blockProposal = this.protocol.createBlockProposal(
        block,
        this.validatorId,
        validatorState.emotionalProfile.emotionalScore || 0,
        votes
      );
      // Broadcast to network
      await this.p2pNode.publishToTopic('block-proposals', blockProposal);
      this.emit('blockProposed', { block, round: currentRound.roundNumber });
    } catch (error) {
      console.error('Failed to propose block:', error);
      throw error;
    }
  }
  /**
   * Set up protocol message handlers
   */
  private setupProtocolHandlers(): void {
    // Handle biometric proofs
    this.protocol.on('biometricProof', (data) => {
      this.handleBiometricProof(data);
    });
    // Handle emotional votes
    this.protocol.on('emotionalVote', (data) => {
      this.handleEmotionalVote(data);
    });
    // Handle block proposals
    this.protocol.on('blockProposal', (data) => {
      this.handleBlockProposal(data);
    });
    // Handle consensus results
    this.protocol.on('consensusResult', (data) => {
      this.handleConsensusResult(data);
    });
    // Handle network status updates
    this.protocol.on('networkStatus', (data) => {
      this.handleNetworkStatus(data);
    });
    // Handle peer challenges
    this.protocol.on('peerChallenge', (data) => {
      this.handlePeerChallenge(data);
    });
  }
  /**
   * Register this validator in the network
   */
  private async registerValidator(): Promise<void> {
    const validatorState: ValidatorState = {
      validatorId: this.validatorId,
      isOnline: true,
      lastHeartbeat: Date.now(),
      emotionalProfile: null,
      reputation: 100, // Start with perfect reputation
      consecutiveFailures: 0,
      totalVotes: 0,
      successfulVotes: 0
    };
    this.networkConsensus.validators.set(this.validatorId, validatorState);
    // Broadcast our presence
    const networkStatus = this.protocol.createNetworkStatus(
      this.networkConsensus.networkHealth,
      this.p2pNode.getPeerCount(),
      this.networkConsensus.currentRound?.roundNumber || 0,
      0, // Block height - would get from blockchain
      0  // Emotional score - not available at registration
    );
    await this.p2pNode.publishToTopic('network-status', networkStatus);
  }
  /**
   * Initiate a new consensus round
   */
  private async initiateConsensusRound(): Promise<void> {
    // End current round if active
    if (this.networkConsensus.currentRound) {
      await this.finalizeConsensusRound();
    }
    const roundNumber = (this.networkConsensus.currentRound?.roundNumber || 0) + 1;
    const onlineValidators = Array.from(this.networkConsensus.validators.values())
      .filter(v => v.isOnline && (Date.now() - v.lastHeartbeat) < this.VALIDATOR_TIMEOUT);
    if (onlineValidators.length < this.MIN_VALIDATORS_REQUIRED) {
      // Retry in 10 seconds
      this.roundTimer = setTimeout(() => this.initiateConsensusRound(), 10000);
      return;
    }
    // Create new consensus round
    this.networkConsensus.currentRound = {
      roundNumber,
      startTime: Date.now(),
      duration: this.CONSENSUS_ROUND_DURATION,
      participants: onlineValidators.map(v => v.validatorId),
      votes: new Map(),
      result: null,
      status: 'PREPARING'
    };
    // Calculate Byzantine threshold
    this.networkConsensus.byzantineThreshold = Math.floor(onlineValidators.length * this.BYZANTINE_FAULT_TOLERANCE);
    console.log(` Initiated consensus round ${roundNumber}`);
    console.log(`   👥 Participants: ${onlineValidators.length}`);
    // Start voting phase
    this.networkConsensus.currentRound.status = 'VOTING';
    this.emit('consensusRoundStarted', this.networkConsensus.currentRound);
    // Schedule round completion
    this.roundTimer = setTimeout(() => {
      this.finalizeConsensusRound();
    }, this.CONSENSUS_ROUND_DURATION);
    // Cast our vote if we have emotional data
    await this.castEmotionalVote();
  }
  /**
   * Cast our emotional vote for the current round
   */
  private async castEmotionalVote(): Promise<void> {
    const currentRound = this.networkConsensus.currentRound;
    const validatorState = this.networkConsensus.validators.get(this.validatorId);
    if (!currentRound || !validatorState?.emotionalProfile) {
      return;
    }
    try {
      // Create biometric proof message
      const biometricProof = {
        validatorId: this.validatorId,
        biometricHash: new TextEncoder().encode(JSON.stringify({
          heartRate: validatorState.emotionalProfile.heartRate,
          stressLevel: validatorState.emotionalProfile.stressLevel,
          focusLevel: validatorState.emotionalProfile.focusLevel,
          timestamp: validatorState.emotionalProfile.timestamp
        })),
        authenticityProof: new TextEncoder().encode('proof-placeholder'),
        timestamp: Date.now(),
        signature: new Uint8Array(0)
      };
      // Create emotional vote
      const emotionalVote = this.protocol.createEmotionalVote(
        this.validatorId,
        validatorState.emotionalProfile.emotionalScore || 0,
        biometricProof,
        currentRound.roundNumber
      );
      // Broadcast vote
      await this.p2pNode.publishToTopic('emotional-votes', emotionalVote);
      // Record our vote locally
      const voteMessage: EmotionalVoteMessage = {
        validatorId: this.validatorId,
        emotionalScore: validatorState.emotionalProfile.emotionalScore || 0,
        biometricProof,
        consensusRound: currentRound.roundNumber,
        signature: new Uint8Array(0)
      };
      currentRound.votes.set(this.validatorId, voteMessage);
    } catch (error) {
      console.error('Failed to cast emotional vote:', error);
    }
  }
  /**
   * Finalize the current consensus round
   */
  private async finalizeConsensusRound(): Promise<void> {
    const currentRound = this.networkConsensus.currentRound;
    if (!currentRound) {
      return;
    }
    console.log(`🏁 Finalizing consensus round ${currentRound.roundNumber}`);
    currentRound.status = 'COUNTING';
    try {
      // Collect all emotional profiles from votes
      const emotionalProfiles: EmotionalProfile[] = [];
      for (const [validatorId, vote] of currentRound.votes) {
        const validatorState = this.networkConsensus.validators.get(validatorId);
        if (validatorState?.emotionalProfile) {
          emotionalProfiles.push(validatorState.emotionalProfile);
        }
      }
      if (emotionalProfiles.length === 0) {
        currentRound.status = 'FAILED';
        this.scheduleNextRound();
        return;
      }
      // Calculate consensus using emotional engine
      const consensusResult = this.emotionalEngine.calculateConsensusScores(emotionalProfiles);
      // Verify Byzantine fault tolerance
      const requiredVotes = Math.ceil((currentRound.participants.length - this.networkConsensus.byzantineThreshold) * 0.67);
      if (currentRound.votes.size < requiredVotes) {
        currentRound.status = 'FAILED';
        this.scheduleNextRound();
        return;
      }
      // Store consensus result
      currentRound.result = consensusResult;
      currentRound.status = 'COMPLETED';
      // Update network consensus strength
      this.networkConsensus.consensusStrength = consensusResult.consensusStrength;
      // Broadcast consensus result
      const consensusMessage = this.protocol.createConsensusResult(
        consensusResult.selectedValidator,
        currentRound.roundNumber,
        currentRound.votes.size,
        consensusResult.consensusStrength,
        '', // Block hash would be provided if we have a block
        [] // Signatures from validators
      );
      await this.p2pNode.publishToTopic('consensus-results', consensusMessage);
      // Update validator reputations
      this.updateValidatorReputations(currentRound, consensusResult);
      // Store in history
      this.consensusHistory.push({ ...currentRound });
      if (this.consensusHistory.length > 100) {
        this.consensusHistory.shift(); // Keep last 100 rounds
      }
      console.log(`   🏆 Winner: ${consensusResult.selectedValidator}`);
      console.log(`   💪 Strength: ${consensusResult.consensusStrength.toFixed(1)}%`);
      this.emit('consensusCompleted', { round: currentRound, result: consensusResult });
    } catch (error) {
      console.error('Error finalizing consensus round:', error);
      currentRound.status = 'FAILED';
    }
    // Schedule next round
    this.scheduleNextRound();
  }
  /**
   * Schedule the next consensus round
   */
  private scheduleNextRound(): void {
    const delay = 5000; // 5 second delay between rounds
    this.roundTimer = setTimeout(() => {
      this.initiateConsensusRound();
    }, delay);
  }
  /**
   * Update validator reputations based on consensus performance
   */
  private updateValidatorReputations(round: ConsensusRound, result: ConsensusResult): void {
    for (const participantId of round.participants) {
      const validatorState = this.networkConsensus.validators.get(participantId);
      if (!validatorState) continue;
      validatorState.totalVotes++;
      if (round.votes.has(participantId)) {
        // Validator participated in voting
        validatorState.successfulVotes++;
        validatorState.consecutiveFailures = 0;
        // Bonus reputation for being selected as winner
        if (participantId === result.selectedValidator) {
          validatorState.reputation = Math.min(100, validatorState.reputation + 5);
        } else {
          validatorState.reputation = Math.min(100, validatorState.reputation + 1);
        }
      } else {
        // Validator failed to vote
        validatorState.consecutiveFailures++;
        validatorState.reputation = Math.max(0, validatorState.reputation - 3);
        // Mark as offline if too many consecutive failures
        if (validatorState.consecutiveFailures >= 3) {
          validatorState.isOnline = false;
        }
      }
    }
  }
  /**
   * Handle incoming biometric proof
   */
  private handleBiometricProof(data: any): void {
    try {
      const validatorState = this.networkConsensus.validators.get(data.validatorId);
      if (validatorState) {
        validatorState.lastHeartbeat = Date.now();
        validatorState.isOnline = true;
        // Update emotional profile if needed
        // This would involve processing the biometric data
      }
    } catch (error) {
      console.error('Error handling biometric proof:', error);
    }
  }
  /**
   * Handle incoming emotional vote
   */
  private handleEmotionalVote(data: any): void {
    try {
      const currentRound = this.networkConsensus.currentRound;
      if (!currentRound || currentRound.status !== 'VOTING') {
        return;
      }
      // Verify validator is a participant
      if (!currentRound.participants.includes(data.validatorId)) {
        return;
      }
      // Verify consensus round matches
      if (data.consensusRound !== currentRound.roundNumber) {
        return;
      }
      // Store the vote
      const voteMessage: EmotionalVoteMessage = {
        validatorId: data.validatorId,
        emotionalScore: data.emotionalScore,
        biometricProof: data.biometricProof || {},
        consensusRound: data.consensusRound,
        signature: new Uint8Array(0)
      };
      currentRound.votes.set(data.validatorId, voteMessage);
      this.emit('voteReceived', { validatorId: data.validatorId, vote: voteMessage });
    } catch (error) {
      console.error('Error handling emotional vote:', error);
    }
  }
  /**
   * Handle incoming block proposal
   */
  private handleBlockProposal(data: any): void {
    try {
      // Validate the block proposal
      if (this.validateBlockProposal(data)) {
        this.emit('blockProposalReceived', data);
      } else {
      }
    } catch (error) {
      console.error('Error handling block proposal:', error);
    }
  }
  /**
   * Handle incoming consensus result
   */
  private handleConsensusResult(data: any): void {
    try {
      console.log(` Received consensus result: ${data.selectedValidator} wins round ${data.consensusRound}`);
      // Verify the consensus result
      if (this.validateConsensusResult(data)) {
        this.emit('consensusResultReceived', data);
      } else {
      }
    } catch (error) {
      console.error('Error handling consensus result:', error);
    }
  }
  /**
   * Handle network status updates
   */
  private handleNetworkStatus(data: any): void {
    try {
      // Update validator state
      let validatorState = this.networkConsensus.validators.get(data.nodeId);
      if (!validatorState) {
        validatorState = {
          validatorId: data.nodeId,
          isOnline: true,
          lastHeartbeat: Date.now(),
          emotionalProfile: null,
          reputation: 50, // New validators start with neutral reputation
          consecutiveFailures: 0,
          totalVotes: 0,
          successfulVotes: 0
        };
        this.networkConsensus.validators.set(data.nodeId, validatorState);
        console.log(`👋 New validator discovered: ${data.nodeId}`);
      }
      validatorState.lastHeartbeat = Date.now();
      validatorState.isOnline = true;
      // Update our network health calculation
      this.updateNetworkHealth();
    } catch (error) {
      console.error('Error handling network status:', error);
    }
  }
  /**
   * Handle peer challenges
   */
  private handlePeerChallenge(data: any): void {
    try {
      // Respond to challenge based on type
      switch (data.challengeType) {
        case 'BIOMETRIC_VERIFY':
          this.respondToBiometricChallenge(data);
          break;
        case 'REPUTATION_CHECK':
          this.respondToReputationChallenge(data);
          break;
        case 'LIVENESS_TEST':
          this.respondToLivenessChallenge(data);
          break;
        default:
          console.warn(`Unknown challenge type: ${data.challengeType}`);
      }
    } catch (error) {
      console.error('Error handling peer challenge:', error);
    }
  }
  /**
   * Start heartbeat to maintain validator presence
   */
  private startHeartbeat(): void {
    setInterval(async () => {
      try {
        const networkStatus = this.protocol.createNetworkStatus(
          this.networkConsensus.networkHealth,
          this.p2pNode.getPeerCount(),
          this.networkConsensus.currentRound?.roundNumber || 0,
          0, // Block height
          this.getOurEmotionalScore()
        );
        await this.p2pNode.publishToTopic('network-status', networkStatus);
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, this.HEARTBEAT_INTERVAL);
  }
  /**
   * Get our current emotional score
   */
  private getOurEmotionalScore(): number {
    const validatorState = this.networkConsensus.validators.get(this.validatorId);
    return validatorState?.emotionalProfile?.emotionalScore || 0;
  }
  /**
   * Update network health metrics
   */
  private updateNetworkHealth(): void {
    const validators = Array.from(this.networkConsensus.validators.values());
    const onlineValidators = validators.filter(v => v.isOnline);
    // Calculate health based on online validators and reputation
    const averageReputation = validators.length > 0 
      ? validators.reduce((sum, v) => sum + v.reputation, 0) / validators.length
      : 0;
    const connectivityRatio = validators.length > 0 ? onlineValidators.length / validators.length : 0;
    this.networkConsensus.networkHealth = (averageReputation * 0.7 + connectivityRatio * 100 * 0.3);
    // Emit health update
    this.emit('networkHealthUpdated', {
      health: this.networkConsensus.networkHealth,
      totalValidators: validators.length,
      onlineValidators: onlineValidators.length,
      averageReputation
    });
  }
  /**
   * Validate block proposal
   */
  private validateBlockProposal(proposal: any): boolean {
    // Basic validation - in production, this would be more comprehensive
    return !!(proposal.block && proposal.proposerId && proposal.emotionalScore >= 0);
  }
  /**
   * Validate consensus result
   */
  private validateConsensusResult(result: any): boolean {
    // Basic validation
    return !!(result.selectedValidator && result.consensusRound && result.consensusStrength >= 0);
  }
  /**
   * Respond to biometric challenge
   */
  private async respondToBiometricChallenge(challenge: any): Promise<void> {
    // Implementation would include sending current biometric proof
    console.log(`🔬 Responding to biometric challenge from ${challenge.challengerId}`);
  }
  /**
   * Respond to reputation challenge
   */
  private async respondToReputationChallenge(challenge: any): Promise<void> {
    // Implementation would include sending reputation history
    console.log(` Responding to reputation challenge from ${challenge.challengerId}`);
  }
  /**
   * Respond to liveness challenge
   */
  private async respondToLivenessChallenge(challenge: any): Promise<void> {
    // Implementation would include immediate response to prove liveness
    console.log(`💓 Responding to liveness challenge from ${challenge.challengerId}`);
  }
  /**
   * Get consensus statistics
   */
  public getConsensusStats(): any {
    const validators = Array.from(this.networkConsensus.validators.values());
    const onlineValidators = validators.filter(v => v.isOnline);
    return {
      currentRound: this.networkConsensus.currentRound?.roundNumber || 0,
      totalValidators: validators.length,
      onlineValidators: onlineValidators.length,
      byzantineThreshold: this.networkConsensus.byzantineThreshold,
      consensusStrength: this.networkConsensus.consensusStrength,
      networkHealth: this.networkConsensus.networkHealth,
      roundsCompleted: this.consensusHistory.filter(r => r.status === 'COMPLETED').length,
      roundsFailed: this.consensusHistory.filter(r => r.status === 'FAILED').length,
      averageParticipation: this.calculateAverageParticipation()
    };
  }
  /**
   * Calculate average participation rate
   */
  private calculateAverageParticipation(): number {
    const completedRounds = this.consensusHistory.filter(r => r.status === 'COMPLETED');
    if (completedRounds.length === 0) {
      return 0;
    }
    const totalParticipation = completedRounds.reduce((sum, round) => {
      return sum + (round.votes.size / round.participants.length);
    }, 0);
    return totalParticipation / completedRounds.length;
  }
}