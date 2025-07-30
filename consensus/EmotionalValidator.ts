import { EventEmitter } from 'eventemitter3';
import { BehaviorSubject, Observable } from 'rxjs';
import * as _ from 'lodash';
import { performance } from 'perf_hooks';

import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
import { BiometricWallet } from '../biometric/BiometricWallet';
import { Block } from '../server/blockchain/Block';
import { Transaction } from '../crypto/Transaction';
import { KeyPair } from '../crypto/KeyPair';

/**
 * Enhanced validator with real-time emotional monitoring
 * Supports continuous biometric data validation and emotional score tracking
 */

export interface ValidatorMetrics {
  totalBlocksProposed: number;
  totalBlocksValidated: number;
  averageEmotionalScore: number;
  reputationScore: number;
  uptimePercentage: number;
  lastActiveTime: number;
  stakingRewards: number;
  slashingPenalties: number;
}

export interface EmotionalState {
  currentScore: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  lastUpdated: number;
  biometricReadings: BiometricReading[];
  authenticityProof: AuthenticityProof | null;
}

export interface SlashingCondition {
  type: 'emotional_manipulation' | 'poor_performance' | 'offline' | 'byzantine_behavior';
  severity: 'minor' | 'major' | 'critical';
  penalty: number;
  description: string;
}

export class EmotionalValidator extends EventEmitter {
  private validatorId: string;
  private keyPair: KeyPair;
  private biometricWallet: BiometricWallet;
  private stake: number;
  private balance: number;
  private isActiveStatus = true;
  
  // Emotional state management
  private emotionalState$ = new BehaviorSubject<EmotionalState>({
    currentScore: 0,
    trend: 'stable',
    confidence: 0,
    lastUpdated: 0,
    biometricReadings: [],
    authenticityProof: null
  });
  
  // Performance metrics
  private metrics: ValidatorMetrics = {
    totalBlocksProposed: 0,
    totalBlocksValidated: 0,
    averageEmotionalScore: 0,
    reputationScore: 100,
    uptimePercentage: 100,
    lastActiveTime: Date.now(),
    stakingRewards: 0,
    slashingPenalties: 0
  };
  
  // Historical data for trend analysis
  private scoreHistory: { score: number; timestamp: number }[] = [];
  private readonly maxHistorySize = 100;
  
  // Slashing and reputation
  private slashingHistory: SlashingCondition[] = [];
  private lastSlashingCheck = Date.now();
  
  constructor(
    validatorId: string,
    stake: number,
    initialBalance: number = 0,
    keyPair?: KeyPair
  ) {
    super();
    
    this.validatorId = validatorId;
    this.stake = stake;
    this.balance = initialBalance;
    this.keyPair = keyPair || new KeyPair();
    
    // Initialize biometric wallet
    this.biometricWallet = new BiometricWallet(this.keyPair);
    
    this.startMonitoring();
  }
  
  // Core validator operations
  async updateEmotionalState(): Promise<void> {
    try {
      // Collect fresh biometric data
      const biometricReadings = await this.collectBiometricData();
      
      if (biometricReadings.length === 0) {
        throw new Error('No biometric data available');
      }
      
      // Generate authenticity proof
      const authenticityProof = await this.generateAuthenticityProof(biometricReadings);
      
      // Calculate current emotional score
      const currentScore = this.calculateEmotionalScore(biometricReadings);
      
      // Analyze trend
      const trend = this.analyzeTrend(currentScore);
      
      // Calculate confidence based on data quality and consistency
      const confidence = this.calculateConfidence(biometricReadings, authenticityProof);
      
      // Update emotional state
      const newState: EmotionalState = {
        currentScore,
        trend,
        confidence,
        lastUpdated: Date.now(),
        biometricReadings,
        authenticityProof
      };
      
      this.emotionalState$.next(newState);
      
      // Update score history
      this.updateScoreHistory(currentScore);
      
      // Update metrics
      this.updateAverageEmotionalScore(currentScore);
      this.metrics.lastActiveTime = Date.now();
      
      this.emit('emotional-state-updated', newState);
      
    } catch (error) {
      console.error(`❌ Failed to update emotional state for ${this.validatorId}:`, error.message);
      this.emit('emotional-update-failed', error);
      throw error;
    }
  }
  
  // Block proposal
  async proposeBlock(blockData: {
    height: number;
    previousHash: string;
    transactions: Transaction[];
    emotionalProof: any;
    timestamp: number;
  }): Promise<Block> {
    if (!this.isActiveStatus) {
      throw new Error('Validator is not active');
    }
    
    const currentState = this.emotionalState$.value;
    if (currentState.currentScore < 75) {
      throw new Error('Insufficient emotional fitness for block proposal');
    }
    
    // Create block with emotional consensus data
    const block = new Block(
      blockData.height,
      blockData.previousHash,
      blockData.transactions,
      this.validatorId,
      currentState.currentScore,
      blockData.emotionalProof
    );
    
    // Sign the block
    await block.sign(this.keyPair);
    
    // Update metrics
    this.metrics.totalBlocksProposed++;
    
    this.emit('block-proposed', block);
    
    return block;
  }
  
  // Block validation
  async validateBlock(block: Block): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Validate block structure
      if (!block.hash || !block.signature) {
        return { valid: false, reason: 'Missing block hash or signature' };
      }
      
      // Validate emotional proof
      if (!block.emotionalProof) {
        return { valid: false, reason: 'Missing emotional proof' };
      }
      
      // Verify emotional score is within acceptable range
      if (block.emotionalScore < 50 || block.emotionalScore > 100) {
        return { valid: false, reason: 'Invalid emotional score range' };
      }
      
      // Validate transactions
      for (const tx of block.transactions) {
        if (!tx.hash || !tx.signature) {
          return { valid: false, reason: 'Invalid transaction in block' };
        }
      }
      
      // Update metrics
      this.metrics.totalBlocksValidated++;
      
      this.emit('block-validated', { block, valid: true });
      
      return { valid: true };
      
    } catch (error) {
      this.emit('block-validation-failed', { block, error });
      return { valid: false, reason: error.message };
    }
  }
  
  // Biometric data collection
  private async collectBiometricData(): Promise<BiometricReading[]> {
    try {
      // Get readings from biometric wallet
      const readings = await this.biometricWallet.collectBiometricData();
      
      if (readings.length === 0) {
        // Generate synthetic readings for demo (in production, this would be real sensor data)
        return [
          {
            deviceId: `${this.validatorId}_heart`,
            type: 'heartRate',
            value: 60 + Math.random() * 40, // 60-100 BPM
            quality: 0.8 + Math.random() * 0.2, // 80-100% quality
            timestamp: Date.now(),
            metadata: { sensor: 'synthetic_demo' }
          },
          {
            deviceId: `${this.validatorId}_stress`,
            type: 'stress',
            value: Math.random() * 30, // 0-30% stress
            quality: 0.85 + Math.random() * 0.15,
            timestamp: Date.now(),
            metadata: { sensor: 'synthetic_demo' }
          },
          {
            deviceId: `${this.validatorId}_focus`,
            type: 'focus',
            value: 70 + Math.random() * 30, // 70-100% focus
            quality: 0.9 + Math.random() * 0.1,
            timestamp: Date.now(),
            metadata: { sensor: 'synthetic_demo' }
          }
        ];
      }
      
      return readings;
      
    } catch (error) {
      console.warn(`⚠️  Biometric collection failed for ${this.validatorId}:`, error.message);
      return [];
    }
  }
  
  // Authenticity proof generation
  private async generateAuthenticityProof(readings: BiometricReading[]): Promise<AuthenticityProof> {
    return await AuthenticityProof.generate(
      readings,
      this.keyPair,
      {
        requireLiveness: true,
        requireMultiModal: true,
        temporalWindow: 30000 // 30 seconds
      }
    );
  }
  
  // Emotional score calculation
  private calculateEmotionalScore(readings: BiometricReading[]): number {
    if (readings.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const reading of readings) {
      let score = 0;
      const weight = reading.quality;
      
      switch (reading.type) {
        case 'heartRate':
          // Optimal heart rate range: 60-100 BPM
          const hr = reading.value;
          if (hr >= 60 && hr <= 80) {
            score = 100;
          } else if (hr >= 50 && hr <= 100) {
            score = 80;
          } else {
            score = 50;
          }
          break;
          
        case 'stress':
          // Lower stress is better (0-100 scale)
          const stress = reading.value;
          score = Math.max(0, 100 - (stress * 2));
          break;
          
        case 'focus':
          // Higher focus is better (0-100 scale)
          score = reading.value;
          break;
          
        default:
          score = 75; // Default score for unknown types
      }
      
      totalScore += score * weight;
      totalWeight += weight;
    }
    
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Apply consistency bonus
    const consistencyBonus = this.calculateConsistencyBonus();
    
    return Math.min(100, Math.max(0, finalScore + consistencyBonus));
  }
  
  // Trend analysis
  private analyzeTrend(currentScore: number): 'improving' | 'stable' | 'declining' {
    if (this.scoreHistory.length < 3) return 'stable';
    
    const recent = this.scoreHistory.slice(-5);
    const slope = this.calculateSlope(recent);
    
    if (slope > 2) return 'improving';
    if (slope < -2) return 'declining';
    return 'stable';
  }
  
  private calculateSlope(points: { score: number; timestamp: number }[]): number {
    if (points.length < 2) return 0;
    
    const n = points.length;
    const sumX = points.reduce((sum, p, i) => sum + i, 0);
    const sumY = points.reduce((sum, p) => sum + p.score, 0);
    const sumXY = points.reduce((sum, p, i) => sum + (i * p.score), 0);
    const sumXX = points.reduce((sum, p, i) => sum + (i * i), 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  
  // Confidence calculation
  private calculateConfidence(readings: BiometricReading[], proof: AuthenticityProof): number {
    if (readings.length === 0) return 0;
    
    // Base confidence from data quality
    const avgQuality = _.meanBy(readings, 'quality') * 100;
    
    // Multi-modal bonus
    const uniqueTypes = new Set(readings.map(r => r.type)).size;
    const multiModalBonus = Math.min(20, uniqueTypes * 5);
    
    // Authenticity proof bonus
    const proofBonus = proof.isValid ? 15 : 0;
    
    // Temporal consistency bonus
    const temporalBonus = this.calculateTemporalConsistency(readings);
    
    return Math.min(100, avgQuality + multiModalBonus + proofBonus + temporalBonus);
  }
  
  private calculateTemporalConsistency(readings: BiometricReading[]): number {
    if (readings.length < 2) return 0;
    
    const timeSpan = Math.max(...readings.map(r => r.timestamp)) - Math.min(...readings.map(r => r.timestamp));
    
    // Readings should be collected within a reasonable timeframe
    if (timeSpan > 60000) return 0; // More than 1 minute apart
    if (timeSpan < 5000) return 10; // Within 5 seconds - good consistency
    
    return Math.max(0, 10 - (timeSpan / 10000)); // Linear decay
  }
  
  // Score history management
  private updateScoreHistory(score: number): void {
    this.scoreHistory.push({
      score,
      timestamp: Date.now()
    });
    
    // Keep only recent history
    if (this.scoreHistory.length > this.maxHistorySize) {
      this.scoreHistory = this.scoreHistory.slice(-this.maxHistorySize);
    }
  }
  
  private calculateConsistencyBonus(): number {
    if (this.scoreHistory.length < 5) return 0;
    
    const recent = this.scoreHistory.slice(-10);
    const scores = recent.map(h => h.score);
    const variance = this.calculateVariance(scores);
    
    // Lower variance = higher consistency bonus
    return Math.max(0, 10 - (variance / 10));
  }
  
  private calculateVariance(values: number[]): number {
    const mean = _.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return _.mean(squaredDiffs);
  }
  
  // Reputation and slashing
  async checkSlashingConditions(): Promise<SlashingCondition[]> {
    const conditions: SlashingCondition[] = [];
    const now = Date.now();
    
    // Check for emotional manipulation
    if (this.detectEmotionalManipulation()) {
      conditions.push({
        type: 'emotional_manipulation',
        severity: 'major',
        penalty: this.stake * 0.1, // 10% stake slash
        description: 'Suspected emotional data manipulation'
      });
    }
    
    // Check for poor performance
    const currentState = this.emotionalState$.value;
    if (currentState.currentScore < 50 && this.metrics.averageEmotionalScore < 60) {
      conditions.push({
        type: 'poor_performance',
        severity: 'minor',
        penalty: this.stake * 0.02, // 2% stake slash
        description: 'Consistently poor emotional performance'
      });
    }
    
    // Check for offline behavior
    if (now - this.metrics.lastActiveTime > 300000) { // 5 minutes
      conditions.push({
        type: 'offline',
        severity: 'minor',
        penalty: this.stake * 0.01, // 1% stake slash
        description: 'Validator offline for extended period'
      });
    }
    
    return conditions;
  }
  
  private detectEmotionalManipulation(): boolean {
    if (this.scoreHistory.length < 10) return false;
    
    const recent = this.scoreHistory.slice(-10);
    
    // Check for impossible score jumps
    for (let i = 1; i < recent.length; i++) {
      const scoreDiff = Math.abs(recent[i].score - recent[i-1].score);
      const timeDiff = recent[i].timestamp - recent[i-1].timestamp;
      
      // Score shouldn't change more than 20 points in less than 30 seconds
      if (scoreDiff > 20 && timeDiff < 30000) {
        return true;
      }
    }
    
    // Check for perfect scores (suspicious)
    const perfectCount = recent.filter(h => h.score >= 99).length;
    if (perfectCount > 7) return true; // More than 70% perfect scores
    
    return false;
  }
  
  async applySlashing(condition: SlashingCondition): Promise<void> {
    // Reduce stake
    this.stake = Math.max(0, this.stake - condition.penalty);
    
    // Reduce reputation
    const reputationPenalty = condition.severity === 'critical' ? 20 : 
                             condition.severity === 'major' ? 10 : 5;
    this.metrics.reputationScore = Math.max(0, this.metrics.reputationScore - reputationPenalty);
    
    // Record slashing
    this.slashingHistory.push(condition);
    this.metrics.slashingPenalties += condition.penalty;
    
    // Deactivate if stake too low or reputation too poor
    if (this.stake < 1000 || this.metrics.reputationScore < 20) {
      this.isActiveStatus = false;
    }
    
    console.log(`⚠️  Validator ${this.validatorId} slashed: ${condition.description} (-${condition.penalty} EMO)`);
    this.emit('slashed', condition);
  }
  
  // Reward management
  async addReward(amount: number): Promise<void> {
    this.balance += amount;
    this.metrics.stakingRewards += amount;
    
    // Reputation bonus for consistent good performance
    if (this.metrics.averageEmotionalScore > 85) {
      this.metrics.reputationScore = Math.min(100, this.metrics.reputationScore + 0.1);
    }
    
    this.emit('reward-received', { amount, newBalance: this.balance });
  }
  
  // Monitoring
  private startMonitoring(): void {
    // Update emotional state every 30 seconds
    setInterval(async () => {
      if (this.isActiveStatus) {
        try {
          await this.updateEmotionalState();
        } catch (error) {
          console.warn(`⚠️  Emotional state update failed for ${this.validatorId}`);
        }
      }
    }, 30000);
    
    // Check slashing conditions every 5 minutes
    setInterval(async () => {
      if (this.isActiveStatus) {
        const conditions = await this.checkSlashingConditions();
        for (const condition of conditions) {
          await this.applySlashing(condition);
        }
      }
    }, 300000);
  }
  
  // Metrics updates
  private updateAverageEmotionalScore(newScore: number): void {
    const totalReadings = this.metrics.totalBlocksProposed + this.metrics.totalBlocksValidated;
    if (totalReadings === 0) {
      this.metrics.averageEmotionalScore = newScore;
    } else {
      this.metrics.averageEmotionalScore = 
        ((this.metrics.averageEmotionalScore * totalReadings) + newScore) / (totalReadings + 1);
    }
  }
  
  async updateLastSeen(): Promise<void> {
    this.metrics.lastActiveTime = Date.now();
    
    // Update uptime percentage
    const totalTime = Date.now() - (this.metrics.lastActiveTime - 3600000); // Last hour
    const activeTime = Math.min(totalTime, Date.now() - this.metrics.lastActiveTime + 60000);
    this.metrics.uptimePercentage = (activeTime / totalTime) * 100;
  }
  
  // Public getters
  getId(): string {
    return this.validatorId;
  }
  
  getStake(): number {
    return this.stake;
  }
  
  getBalance(): number {
    return this.balance;
  }
  
  getEmotionalScore(): number {
    return this.emotionalState$.value.currentScore;
  }
  
  getEmotionalState(): EmotionalState {
    return this.emotionalState$.value;
  }
  
  getEmotionalStateObservable(): Observable<EmotionalState> {
    return this.emotionalState$.asObservable();
  }
  
  getMetrics(): ValidatorMetrics {
    return { ...this.metrics };
  }
  
  isActive(): boolean {
    return this.isActiveStatus && this.stake >= 1000;
  }
  
  getReputationScore(): number {
    return this.metrics.reputationScore;
  }
  
  getPublicKey(): string {
    return this.keyPair.getPublicKey();
  }
  
  async getRecentBiometricData(): Promise<BiometricReading[]> {
    return this.emotionalState$.value.biometricReadings;
  }
  
  getScoreTrend(): 'improving' | 'stable' | 'declining' {
    return this.emotionalState$.value.trend;
  }
  
  getConfidence(): number {
    return this.emotionalState$.value.confidence;
  }
  
  // Validator lifecycle
  async activate(): Promise<void> {
    if (this.stake < 1000) {
      throw new Error('Insufficient stake to activate validator');
    }
    
    this.isActiveStatus = true;
    await this.updateEmotionalState();
    
    console.log(`✅ Validator ${this.validatorId} activated`);
    this.emit('activated');
  }
  
  async deactivate(): Promise<void> {
    this.isActiveStatus = false;
    
    console.log(`⏸️  Validator ${this.validatorId} deactivated`);
    this.emit('deactivated');
  }
  
  // Stake management
  async addStake(amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Stake amount must be positive');
    }
    
    this.stake += amount;
    this.balance -= amount; // Assume stake comes from balance
    
    // Reactivate if previously deactivated due to low stake
    if (!this.isActiveStatus && this.stake >= 1000) {
      await this.activate();
    }
  }
  
  async removeStake(amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Stake amount must be positive');
    }
    
    if (amount > this.stake) {
      throw new Error('Insufficient stake to remove');
    }
    
    this.stake -= amount;
    this.balance += amount;
    
    // Deactivate if stake too low
    if (this.stake < 1000) {
      await this.deactivate();
    }
  }
}