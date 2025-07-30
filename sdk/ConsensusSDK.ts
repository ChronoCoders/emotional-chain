import { EventEmitter } from 'eventemitter3';
import { AxiosInstance } from 'axios';

/**
 * ConsensusSDK - Real-time consensus monitoring and participation
 * 
 * @example
 * ```typescript
 * const consensus = sdk.consensus;
 * const currentRound = await consensus.getCurrentRound();
 * const validators = await consensus.getValidators();
 * 
 * consensus.on('consensusRound', (round) => {
 *   console.log('New consensus round:', round.emotionalScores);
 * });
 * ```
 */

export interface ConsensusRound {
  roundId: string;
  epoch: number;
  phase: 'propose' | 'vote' | 'commit' | 'finalized';
  startTime: number;
  endTime?: number;
  duration?: number;
  blockHash?: string;
  blockNumber: number;
  proposer: string;
  participants: string[];
  emotionalScores: Record<string, number>;
  votes: Record<string, 'yes' | 'no'>;
  result: 'pending' | 'success' | 'failed';
  byzantineFailures: string[];
}

export interface ValidatorInfo {
  id: string;
  address: string;
  name: string;
  emotionalScore: number;
  participationRate: number;
  reputationScore: number;
  status: 'active' | 'inactive' | 'slashed' | 'quarantined';
  stake: number;
  rewards: number;
  penalties: number;
  lastActive: number;
  biometricDevices: string[];
}

export interface NetworkStats {
  totalValidators: number;
  activeValidators: number;
  currentBlockHeight: number;
  averageBlockTime: number;
  averageEmotionalScore: number;
  networkHealth: number;
  consensusStrength: number;
  throughputTPS: number;
  byzantineFaultTolerance: number;
}

export interface EmotionalCommittee {
  roundId: string;
  members: string[];
  threshold: number;
  emotionalRequirement: number;
  formation: 'random' | 'reputation' | 'emotional' | 'hybrid';
  diversity: number;
}

export interface ForkInfo {
  detected: boolean;
  forkHeight: number;
  chains: Array<{
    id: string;
    length: number;
    emotionalScore: number;
    validators: string[];
  }>;
  resolution: 'pending' | 'resolved';
  resolutionMethod: 'longest_chain' | 'emotional_consensus' | 'manual';
}

export class ConsensusSDK extends EventEmitter {
  private httpClient: AxiosInstance;
  
  constructor(httpClient: AxiosInstance) {
    super();
    this.httpClient = httpClient;
  }
  
  // Current consensus state
  async getCurrentRound(): Promise<ConsensusRound> {
    const response = await this.httpClient.get('/api/v1/consensus/current');
    return response.data;
  }
  
  async getRound(roundId: string): Promise<ConsensusRound> {
    const response = await this.httpClient.get(`/api/v1/consensus/rounds/${roundId}`);
    return response.data;
  }
  
  async getRecentRounds(limit = 50): Promise<ConsensusRound[]> {
    const response = await this.httpClient.get('/api/v1/consensus/rounds', {
      params: { limit }
    });
    return response.data.rounds;
  }
  
  // Validator information
  async getValidators(): Promise<ValidatorInfo[]> {
    const response = await this.httpClient.get('/api/v1/consensus/validators');
    return response.data.validators;
  }
  
  async getValidator(validatorId: string): Promise<ValidatorInfo> {
    const response = await this.httpClient.get(`/api/v1/consensus/validators/${validatorId}`);
    return response.data;
  }
  
  async getActiveValidators(): Promise<ValidatorInfo[]> {
    const response = await this.httpClient.get('/api/v1/consensus/validators/active');
    return response.data.validators;
  }
  
  async getValidatorPerformance(validatorId: string, timeFrame = '24h'): Promise<{
    participationRate: number;
    averageEmotionalScore: number;
    roundsParticipated: number;
    roundsMissed: number;
    penalties: number;
    rewards: number;
  }> {
    const response = await this.httpClient.get(`/api/v1/consensus/validators/${validatorId}/performance`, {
      params: { timeFrame }
    });
    return response.data;
  }
  
  // Network statistics
  async getNetworkStats(): Promise<NetworkStats> {
    const response = await this.httpClient.get('/api/v1/consensus/network/stats');
    return response.data;
  }
  
  async getNetworkHealth(): Promise<{
    overall: number;
    consensus: number;
    participation: number;
    emotional: number;
    byzantine: number;
    details: any;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/network/health');
    return response.data;
  }
  
  async getThroughputMetrics(): Promise<{
    currentTPS: number;
    averageTPS: number;
    maxTPS: number;
    blockTime: number;
    queueLength: number;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/throughput');
    return response.data;
  }
  
  // Emotional consensus
  async getEmotionalCommittee(roundId?: string): Promise<EmotionalCommittee> {
    const url = roundId 
      ? `/api/v1/consensus/committee/${roundId}`
      : '/api/v1/consensus/committee/current';
    
    const response = await this.httpClient.get(url);
    return response.data;
  }
  
  async getEmotionalTrends(timeFrame = '24h'): Promise<{
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    data: Array<{
      timestamp: number;
      score: number;
      validators: number;
    }>;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/emotional/trends', {
      params: { timeFrame }
    });
    return response.data;
  }
  
  async getEmotionalDistribution(): Promise<{
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    median: number;
    mean: number;
    standardDeviation: number;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/emotional/distribution');
    return response.data;
  }
  
  // Fork detection and resolution
  async getForkStatus(): Promise<ForkInfo> {
    const response = await this.httpClient.get('/api/v1/consensus/forks/status');
    return response.data;
  }
  
  async getForkHistory(limit = 20): Promise<ForkInfo[]> {
    const response = await this.httpClient.get('/api/v1/consensus/forks/history', {
      params: { limit }
    });
    return response.data.forks;
  }
  
  // Byzantine fault tolerance
  async getByzantineFailures(timeFrame = '24h'): Promise<Array<{
    validatorId: string;
    type: 'equivocation' | 'unavailability' | 'invalid_proposal' | 'emotional_manipulation';
    timestamp: number;
    evidence: any;
    penaltyApplied: boolean;
  }>> {
    const response = await this.httpClient.get('/api/v1/consensus/byzantine/failures', {
      params: { timeFrame }
    });
    return response.data.failures;
  }
  
  async getByzantineDetectionMetrics(): Promise<{
    detectionRate: number;
    falsePositiveRate: number;
    averageDetectionTime: number;
    quarantinedValidators: number;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/byzantine/metrics');
    return response.data;
  }
  
  // Participation and rewards
  async participateInConsensus(validatorId: string, emotionalProof: any): Promise<{
    accepted: boolean;
    roundId: string;
    emotionalScore: number;
  }> {
    const response = await this.httpClient.post('/api/v1/consensus/participate', {
      validatorId,
      emotionalProof
    });
    return response.data;
  }
  
  async getRewardCalculation(validatorId: string, roundId: string): Promise<{
    baseReward: number;
    emotionalBonus: number;
    participationBonus: number;
    totalReward: number;
    penalties: number;
    netReward: number;
  }> {
    const response = await this.httpClient.get(`/api/v1/consensus/rewards/${validatorId}/${roundId}`);
    return response.data;
  }
  
  async getRewardHistory(validatorId: string, limit = 100): Promise<Array<{
    roundId: string;
    timestamp: number;
    reward: number;
    penalty: number;
    emotionalScore: number;
  }>> {
    const response = await this.httpClient.get(`/api/v1/consensus/rewards/${validatorId}/history`, {
      params: { limit }
    });
    return response.data.rewards;
  }
  
  // Consensus proposals
  async submitProposal(proposal: {
    type: 'block' | 'parameter_change' | 'validator_action';
    data: any;
    emotionalJustification: string;
  }): Promise<{
    proposalId: string;
    accepted: boolean;
    votingDeadline: number;
  }> {
    const response = await this.httpClient.post('/api/v1/consensus/proposals', proposal);
    return response.data;
  }
  
  async getActiveProposals(): Promise<Array<{
    id: string;
    type: string;
    proposer: string;
    description: string;
    votes: { yes: number; no: number };
    deadline: number;
    status: 'active' | 'passed' | 'failed';
  }>> {
    const response = await this.httpClient.get('/api/v1/consensus/proposals/active');
    return response.data.proposals;
  }
  
  async voteOnProposal(proposalId: string, vote: 'yes' | 'no', emotionalJustification?: string): Promise<{
    recorded: boolean;
    voteWeight: number;
  }> {
    const response = await this.httpClient.post(`/api/v1/consensus/proposals/${proposalId}/vote`, {
      vote,
      emotionalJustification
    });
    return response.data;
  }
  
  // Slashing and penalties
  async getSlashingEvents(timeFrame = '7d'): Promise<Array<{
    validatorId: string;
    type: 'double_signing' | 'downtime' | 'emotional_manipulation' | 'byzantine_behavior';
    amount: number;
    timestamp: number;
    evidence: any;
  }>> {
    const response = await this.httpClient.get('/api/v1/consensus/slashing/events', {
      params: { timeFrame }
    });
    return response.data.events;
  }
  
  async getSlashingConditions(): Promise<{
    downtimeThreshold: number;
    emotionalManipulationPenalty: number;
    byzantineBehaviorPenalty: number;
    doubleSigningPenalty: number;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/slashing/conditions');
    return response.data;
  }
  
  // Analytics and insights
  async getConsensusAnalytics(timeFrame = '24h'): Promise<{
    totalRounds: number;
    successfulRounds: number;
    failedRounds: number;
    averageRoundTime: number;
    averageParticipation: number;
    emergencyActivations: number;
    forkEvents: number;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/analytics', {
      params: { timeFrame }
    });
    return response.data;
  }
  
  async getValidatorRankings(metric: 'emotional' | 'participation' | 'reputation' | 'rewards' = 'emotional'): Promise<Array<{
    rank: number;
    validatorId: string;
    score: number;
    change: number;
  }>> {
    const response = await this.httpClient.get('/api/v1/consensus/rankings', {
      params: { metric }
    });
    return response.data.rankings;
  }
  
  async getPredictiveInsights(): Promise<{
    networkStability: {
      prediction: 'stable' | 'declining' | 'improving';
      confidence: number;
      factors: string[];
    };
    validatorTurnover: {
      expectedChurns: number;
      riskFactors: Array<{
        validatorId: string;
        risk: number;
        reasons: string[];
      }>;
    };
    consensusHealth: {
      forecast: Array<{
        timestamp: number;
        expectedHealth: number;
      }>;
    };
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/insights/predictive');
    return response.data;
  }
  
  // Real-time monitoring
  async subscribeToConsensusEvents(): Promise<void> {
    // This would typically be handled by WebSocket
    this.emit('subscribed', 'consensus_events');
  }
  
  async unsubscribeFromConsensusEvents(): Promise<void> {
    this.emit('unsubscribed', 'consensus_events');
  }
  
  // Emergency procedures
  async getEmergencyStatus(): Promise<{
    active: boolean;
    type?: 'network_partition' | 'validator_takeover' | 'emotional_manipulation' | 'technical_failure';
    activatedAt?: number;
    expectedResolution?: number;
    actions: string[];
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/emergency/status');
    return response.data;
  }
  
  async reportEmergency(type: string, evidence: any, description: string): Promise<{
    reportId: string;
    acknowledged: boolean;
    escalated: boolean;
  }> {
    const response = await this.httpClient.post('/api/v1/consensus/emergency/report', {
      type,
      evidence,
      description
    });
    return response.data;
  }
  
  // Configuration and parameters
  async getConsensusParameters(): Promise<{
    epochDuration: number;
    byzantineFaultTolerance: number;
    emotionalThreshold: number;
    participationThreshold: number;
    slashingParameters: any;
    rewardParameters: any;
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/parameters');
    return response.data;
  }
  
  async getProtocolVersion(): Promise<{
    version: string;
    consensusVersion: string;
    emotionalVersion: string;
    upgradeScheduled: boolean;
    nextUpgrade?: {
      version: string;
      timestamp: number;
      features: string[];
    };
  }> {
    const response = await this.httpClient.get('/api/v1/consensus/version');
    return response.data;
  }
  
  // Historical data
  async getHistoricalConsensusData(
    startTime: number,
    endTime: number,
    granularity: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<Array<{
    timestamp: number;
    rounds: number;
    averageEmotionalScore: number;
    participation: number;
    byzantineEvents: number;
  }>> {
    const response = await this.httpClient.get('/api/v1/consensus/historical', {
      params: { startTime, endTime, granularity }
    });
    return response.data.data;
  }
  
  async exportConsensusData(
    format: 'json' | 'csv',
    timeFrame = '24h',
    includeEmotionalData = true
  ): Promise<{
    downloadUrl: string;
    expiresAt: number;
    fileSize: number;
  }> {
    const response = await this.httpClient.post('/api/v1/consensus/export', {
      format,
      timeFrame,
      includeEmotionalData
    });
    return response.data;
  }
  
  // Utility methods
  calculateByzantineTolerance(totalValidators: number): number {
    // Byzantine fault tolerance is (n-1)/3 where n is total validators
    return Math.floor((totalValidators - 1) / 3);
  }
  
  calculateEmotionalWeight(emotionalScore: number, stake: number): number {
    // Emotional weight combines emotional authenticity with stake
    return emotionalScore * Math.sqrt(stake);
  }
  
  isConsensusHealthy(stats: NetworkStats): boolean {
    return (
      stats.networkHealth > 80 &&
      stats.averageEmotionalScore > 75 &&
      stats.byzantineFaultTolerance > (stats.totalValidators * 0.3)
    );
  }
  
  formatRoundDuration(round: ConsensusRound): string {
    if (!round.duration) return 'In progress';
    
    const seconds = Math.floor(round.duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
  
  // Event helpers
  onConsensusRound(callback: (round: ConsensusRound) => void): () => void {
    this.on('consensusRound', callback);
    return () => this.off('consensusRound', callback);
  }
  
  onValidatorUpdate(callback: (validator: ValidatorInfo) => void): () => void {
    this.on('validatorUpdate', callback);
    return () => this.off('validatorUpdate', callback);
  }
  
  onForkDetected(callback: (fork: ForkInfo) => void): () => void {
    this.on('forkDetected', callback);
    return () => this.off('forkDetected', callback);
  }
  
  onByzantineFailure(callback: (failure: any) => void): () => void {
    this.on('byzantineFailure', callback);
    return () => this.off('byzantineFailure', callback);
  }
  
  onEmergencyActivated(callback: (emergency: any) => void): () => void {
    this.on('emergencyActivated', callback);
    return () => this.off('emergencyActivated', callback);
  }
}