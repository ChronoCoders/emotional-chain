import { PostgreSQLStorage } from './PostgreSQLStorage';
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
/**
 * Blockchain state management for EmotionalChain
 * Manages validator balances, emotional scores, and consensus state
 */
export interface ValidatorState {
  validatorId: string;
  balance: number;
  emotionalScore: number;
  publicKey: string;
  reputation: number;
  lastActivity: number;
  totalBlocksMined: number;
  totalValidations: number;
}
export interface ConsensusState {
  currentRound: number;
  participants: string[];
  emotionalScores: { [validatorId: string]: number };
  consensusStrength: number;
  networkHealth: number;
  totalStake: number;
}
export interface EmotionalSnapshot {
  timestamp: number;
  roundId: number;
  validatorScores: { [validatorId: string]: number };
  averageScore: number;
  participationRate: number;
  consensusQuality: number;
}
export class StateManager {
  private storage: PostgreSQLStorage;
  private currentState: Map<string, ValidatorState> = new Map();
  private consensusState: ConsensusState;
  private snapshots: EmotionalSnapshot[] = [];
  constructor(storage: PostgreSQLStorage) {
    this.storage = storage;
    this.consensusState = {
      currentRound: 0,
      participants: [],
      emotionalScores: {},
      consensusStrength: 0,
      networkHealth: 100,
      totalStake: 0
    };
  }
  async initialize(): Promise<void> {
    // Load current validator states from storage
    const validatorStates = await this.storage.getAllValidatorStates();
    for (const state of validatorStates) {
      this.currentState.set(state.validatorId, {
        validatorId: state.validatorId,
        balance: state.balance,
        emotionalScore: state.emotionalScore,
        publicKey: '', // TODO: Load from storage
        reputation: 100, // TODO: Load from storage
        lastActivity: Date.now(),
        totalBlocksMined: 0, // TODO: Load from storage
        totalValidations: 0 // TODO: Load from storage
      });
    }
    // Load latest consensus state
    const latestConsensus = await this.storage.getLatestConsensusRound();
    if (latestConsensus) {
      this.consensusState = {
        currentRound: latestConsensus.roundId,
        participants: latestConsensus.participants,
        emotionalScores: latestConsensus.emotionalScores,
        consensusStrength: this.calculateConsensusStrength(latestConsensus.emotionalScores),
        networkHealth: this.calculateNetworkHealth(),
        totalStake: this.calculateTotalStake()
      };
    }
  }
  // Validator state management
  async getValidatorState(validatorId: string): Promise<ValidatorState | null> {
    const cached = this.currentState.get(validatorId);
    if (cached) {
      return cached;
    }
    const stored = await this.storage.getValidatorState(validatorId);
    if (stored) {
      const state: ValidatorState = {
        validatorId,
        balance: stored.balance,
        emotionalScore: stored.emotionalScore,
        publicKey: '', // TODO: Load from storage
        reputation: 100, // TODO: Load from storage
        lastActivity: Date.now(),
        totalBlocksMined: 0, // TODO: Load from storage
        totalValidations: 0 // TODO: Load from storage
      };
      this.currentState.set(validatorId, state);
      return state;
    }
    return null;
  }
  async updateValidatorBalance(validatorId: string, newBalance: number): Promise<void> {
    const state = await this.getValidatorState(validatorId);
    if (state) {
      state.balance = newBalance;
      state.lastActivity = Date.now();
      this.currentState.set(validatorId, state);
      // Persist to storage
      await this.storage.storeValidatorState(validatorId, newBalance, state.emotionalScore);
    } else {
      // Create new validator state
      const newState: ValidatorState = {
        validatorId,
        balance: newBalance,
        emotionalScore: 75.0, // Default emotional score
        publicKey: '',
        reputation: 100,
        lastActivity: Date.now(),
        totalBlocksMined: 0,
        totalValidations: 0
      };
      this.currentState.set(validatorId, newState);
      await this.storage.storeValidatorState(validatorId, newBalance, 75.0);
    }
  }
  async updateValidatorEmotionalScore(validatorId: string, emotionalScore: number, biometricData?: BiometricReading, proof?: AuthenticityProof): Promise<void> {
    const state = await this.getValidatorState(validatorId);
    if (state) {
      state.emotionalScore = emotionalScore;
      state.lastActivity = Date.now();
      this.currentState.set(validatorId, state);
      // Persist to storage
      await this.storage.storeValidatorState(validatorId, state.balance, emotionalScore);
      // Store biometric data if provided
      if (biometricData && proof) {
        await this.storage.storeBiometricData(validatorId, biometricData, proof);
      }
    }
  }
  async incrementValidatorStats(validatorId: string, blocksMined: number = 0, validations: number = 0): Promise<void> {
    const state = await this.getValidatorState(validatorId);
    if (state) {
      state.totalBlocksMined += blocksMined;
      state.totalValidations += validations;
      state.lastActivity = Date.now();
      this.currentState.set(validatorId, state);
    }
  }
  getAllValidatorStates(): ValidatorState[] {
    return Array.from(this.currentState.values());
  }
  getValidatorCount(): number {
    return this.currentState.size;
  }
  getTotalStake(): number {
    return Array.from(this.currentState.values())
      .reduce((total, state) => total + state.balance, 0);
  }
  // Consensus state management
  async startConsensusRound(roundId: number, participants: string[]): Promise<void> {
    this.consensusState = {
      currentRound: roundId,
      participants,
      emotionalScores: {},
      consensusStrength: 0,
      networkHealth: this.calculateNetworkHealth(),
      totalStake: this.calculateTotalStake()
    };
    // Initialize emotional scores for participants
    for (const validatorId of participants) {
      const state = await this.getValidatorState(validatorId);
      if (state) {
        this.consensusState.emotionalScores[validatorId] = state.emotionalScore;
      }
    }
  }
  async updateConsensusVote(validatorId: string, emotionalScore: number): Promise<void> {
    if (this.consensusState.participants.includes(validatorId)) {
      this.consensusState.emotionalScores[validatorId] = emotionalScore;
      this.consensusState.consensusStrength = this.calculateConsensusStrength(this.consensusState.emotionalScores);
      // Update validator's emotional score
      await this.updateValidatorEmotionalScore(validatorId, emotionalScore);
    }
  }
  async finalizeConsensusRound(): Promise<EmotionalSnapshot> {
    const snapshot: EmotionalSnapshot = {
      timestamp: Date.now(),
      roundId: this.consensusState.currentRound,
      validatorScores: { ...this.consensusState.emotionalScores },
      averageScore: this.calculateAverageEmotionalScore(this.consensusState.emotionalScores),
      participationRate: this.calculateParticipationRate(),
      consensusQuality: this.consensusState.consensusStrength
    };
    // Store consensus round in persistent storage
    await this.storage.storeConsensusRound(
      this.consensusState.currentRound,
      this.consensusState.participants,
      this.consensusState.emotionalScores
    );
    // Add to snapshot history (keep last 100 snapshots)
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }
    return snapshot;
  }
  getCurrentConsensusState(): ConsensusState {
    return { ...this.consensusState };
  }
  getConsensusHistory(limit: number = 10): EmotionalSnapshot[] {
    return this.snapshots.slice(-limit);
  }
  // State transitions and rollbacks
  async createStateSnapshot(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(6));
    const snapshotId = `snapshot_${Date.now()}_${Buffer.from(randomBytes).toString('hex')}`;
    const snapshot = {
      id: snapshotId,
      timestamp: Date.now(),
      validators: Array.from(this.currentState.entries()),
      consensusState: { ...this.consensusState },
      snapshots: [...this.snapshots]
    };
    // Store snapshot (in production, this would go to a snapshot storage system)
    console.log(`Created state snapshot: ${snapshotId}`);
    return snapshotId;
  }
  async rollbackToSnapshot(snapshotId: string): Promise<void> {
    // In production, this would restore from snapshot storage
    console.log(`Rolling back to snapshot: ${snapshotId}`);
    // For now, just reinitialize from persistent storage
    this.currentState.clear();
    this.snapshots = [];
    await this.initialize();
  }
  // Emotional consensus state tracking
  getAverageEmotionalScore(): number {
    const scores = Array.from(this.currentState.values()).map(state => state.emotionalScore);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }
  getEmotionalScoreDistribution(): { [range: string]: number } {
    const distribution = {
      'excellent (90-100)': 0,
      'good (70-89)': 0,
      'average (50-69)': 0,
      'poor (30-49)': 0,
      'very_poor (0-29)': 0
    };
    for (const state of this.currentState.values()) {
      const score = state.emotionalScore;
      if (score >= 90) distribution['excellent (90-100)']++;
      else if (score >= 70) distribution['good (70-89)']++;
      else if (score >= 50) distribution['average (50-69)']++;
      else if (score >= 30) distribution['poor (30-49)']++;
      else distribution['very_poor (0-29)']++;
    }
    return distribution;
  }
  getTopValidatorsByEmotionalScore(limit: number = 10): ValidatorState[] {
    return Array.from(this.currentState.values())
      .sort((a, b) => b.emotionalScore - a.emotionalScore)
      .slice(0, limit);
  }
  getTopValidatorsByBalance(limit: number = 10): ValidatorState[] {
    return Array.from(this.currentState.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }
  // Network health calculations
  private calculateConsensusStrength(emotionalScores: { [validatorId: string]: number }): number {
    const scores = Object.values(emotionalScores);
    if (scores.length === 0) return 0;
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    // Calculate standard deviation to measure consensus quality
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    // Lower standard deviation = stronger consensus
    // Scale to 0-100 range
    const consensusStrength = Math.max(0, 100 - (standardDeviation * 2));
    return Math.min(100, consensusStrength);
  }
  private calculateNetworkHealth(): number {
    const activeValidators = Array.from(this.currentState.values())
      .filter(state => Date.now() - state.lastActivity < 300000); // Active in last 5 minutes
    const totalValidators = this.currentState.size;
    const activityRate = totalValidators > 0 ? (activeValidators.length / totalValidators) * 100 : 0;
    const averageEmotionalScore = this.getAverageEmotionalScore();
    // Network health is combination of activity rate and emotional wellbeing
    return (activityRate * 0.6) + (averageEmotionalScore * 0.4);
  }
  private calculateTotalStake(): number {
    return this.getTotalStake();
  }
  private calculateAverageEmotionalScore(scores: { [validatorId: string]: number }): number {
    const scoreValues = Object.values(scores);
    return scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0;
  }
  private calculateParticipationRate(): number {
    const totalValidators = this.currentState.size;
    const participants = this.consensusState.participants.length;
    return totalValidators > 0 ? (participants / totalValidators) * 100 : 0;
  }
  // Maintenance and monitoring
  async getStateHealth(): Promise<{ healthy: boolean; details: any }> {
    const totalValidators = this.currentState.size;
    const averageScore = this.getAverageEmotionalScore();
    const networkHealth = this.calculateNetworkHealth();
    const healthy = totalValidators > 0 && averageScore > 30 && networkHealth > 50;
    return {
      healthy,
      details: {
        totalValidators,
        averageEmotionalScore: averageScore,
        networkHealth,
        totalStake: this.getTotalStake(),
        consensusStrength: this.consensusState.consensusStrength,
        activeRound: this.consensusState.currentRound,
        timestamp: Date.now()
      }
    };
  }
  async syncWithStorage(): Promise<void> {
    // Sync in-memory state with persistent storage
    for (const [validatorId, state] of this.currentState.entries()) {
      await this.storage.storeValidatorState(validatorId, state.balance, state.emotionalScore);
    }
  }
  // Cleanup and optimization
  async cleanupInactiveValidators(inactivityThreshold: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    for (const [validatorId, state] of this.currentState.entries()) {
      if (now - state.lastActivity > inactivityThreshold && state.balance === 0) {
        this.currentState.delete(validatorId);
        console.log(`Cleaned up inactive validator: ${validatorId}`);
      }
    }
  }
}