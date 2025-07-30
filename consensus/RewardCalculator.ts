import * as _ from 'lodash';
import { EmotionalValidator } from './EmotionalValidator';

/**
 * Dynamic reward calculation based on emotional contribution
 * Implements fair reward distribution for Proof of Emotion consensus
 */

export interface RewardConfig {
  baseReward: number; // 50 EMO
  maxEmotionalBonus: number; // 25 EMO
  stakeMultiplierCap: number; // 2.0x maximum
  consistencyBonusCap: number; // 10 EMO
  participationBonusCap: number; // 5 EMO
  penaltyFactor: number; // 0.1 for poor performance
}

export interface RewardMetrics {
  validatorId: string;
  baseReward: number;
  emotionalBonus: number;
  stakeMultiplier: number;
  consistencyBonus: number;
  participationBonus: number;
  totalReward: number;
  reputationImpact: number;
}

export class RewardCalculator {
  private config: RewardConfig;
  
  constructor(consensusConfig: any, customConfig: Partial<RewardConfig> = {}) {
    this.config = {
      baseReward: 50,
      maxEmotionalBonus: 25,
      stakeMultiplierCap: 2.0,
      consistencyBonusCap: 10,
      participationBonusCap: 5,
      penaltyFactor: 0.1,
      ...customConfig
    };
  }
  
  async calculateRewards(
    validators: EmotionalValidator[],
    votingResult: any,
    epochMetrics: any
  ): Promise<Map<string, number>> {
    const rewards = new Map<string, number>();
    const rewardMetrics: RewardMetrics[] = [];
    
    // Calculate individual rewards
    for (const validator of validators) {
      const metrics = await this.calculateValidatorReward(
        validator,
        votingResult,
        epochMetrics
      );
      
      rewards.set(validator.getId(), metrics.totalReward);
      rewardMetrics.push(metrics);
    }
    
    // Apply network-wide adjustments
    const adjustedRewards = this.applyNetworkAdjustments(rewards, rewardMetrics, epochMetrics);
    
    return adjustedRewards;
  }
  
  private async calculateValidatorReward(
    validator: EmotionalValidator,
    votingResult: any,
    epochMetrics: any
  ): Promise<RewardMetrics> {
    const validatorId = validator.getId();
    
    // Base reward - every validator gets this for participation
    const baseReward = this.config.baseReward;
    
    // Emotional bonus based on emotional score
    const emotionalScore = validator.getEmotionalScore();
    const emotionalBonus = this.calculateEmotionalBonus(emotionalScore);
    
    // Stake multiplier for long-term alignment
    const stakeMultiplier = this.calculateStakeMultiplier(validator.getStake());
    
    // Consistency bonus for reliable validators
    const consistencyBonus = await this.calculateConsistencyBonus(validator);
    
    // Participation bonus for active voting
    const participationBonus = this.calculateParticipationBonus(
      validator,
      votingResult
    );
    
    // Calculate total before multiplier
    const preMultiplierReward = baseReward + emotionalBonus + consistencyBonus + participationBonus;
    
    // Apply stake multiplier
    const totalReward = preMultiplierReward * stakeMultiplier;
    
    // Reputation impact for future rewards
    const reputationImpact = this.calculateReputationImpact(
      validator,
      emotionalScore,
      votingResult
    );
    
    return {
      validatorId,
      baseReward,
      emotionalBonus,
      stakeMultiplier,
      consistencyBonus,
      participationBonus,
      totalReward,
      reputationImpact
    };
  }
  
  private calculateEmotionalBonus(emotionalScore: number): number {
    // Bonus scales with emotional score above threshold
    const threshold = 75; // Minimum for participation
    const bonusRange = 100 - threshold;
    
    if (emotionalScore <= threshold) {
      return 0;
    }
    
    const bonusRatio = (emotionalScore - threshold) / bonusRange;
    return bonusRatio * this.config.maxEmotionalBonus;
  }
  
  private calculateStakeMultiplier(stake: number): number {
    // Logarithmic scaling to prevent excessive whale rewards
    const minStake = 10000; // 10K EMO minimum
    const maxMultiplierStake = 100000; // 100K EMO for max multiplier
    
    if (stake <= minStake) {
      return 1.0;
    }
    
    // Logarithmic scale between 1.0 and config.stakeMultiplierCap
    const ratio = Math.log(stake / minStake) / Math.log(maxMultiplierStake / minStake);
    const clampedRatio = Math.min(1, ratio);
    
    return 1.0 + (clampedRatio * (this.config.stakeMultiplierCap - 1.0));
  }
  
  private async calculateConsistencyBonus(validator: EmotionalValidator): Promise<number> {
    const metrics = validator.getMetrics();
    
    // Bonus based on reputation and uptime
    const reputationBonus = (metrics.reputationScore / 100) * 5;
    const uptimeBonus = (metrics.uptimePercentage / 100) * 3;
    
    // Average emotional score consistency
    const avgEmotionalScore = metrics.averageEmotionalScore;
    const consistencyBonus = avgEmotionalScore > 80 ? 2 : 0;
    
    const totalBonus = reputationBonus + uptimeBonus + consistencyBonus;
    
    return Math.min(this.config.consistencyBonusCap, totalBonus);
  }
  
  private calculateParticipationBonus(
    validator: EmotionalValidator,
    votingResult: any
  ): number {
    if (!votingResult.participants.includes(validator.getId())) {
      return 0; // No participation, no bonus
    }
    
    // Base participation bonus
    let bonus = 2;
    
    // Extra bonus for voting with majority
    const validatorVote = votingResult.votes.find(
      (vote: any) => vote.validatorId === validator.getId()
    );
    
    if (validatorVote) {
      // Bonus for quick response (voted within first half of voting period)
      if (validatorVote.timestamp <= votingResult.votingStart + (votingResult.votingDuration / 2)) {
        bonus += 1;
      }
      
      // Bonus for voting with eventual consensus
      if (validatorVote.approved === votingResult.success) {
        bonus += 2;
      }
    }
    
    return Math.min(this.config.participationBonusCap, bonus);
  }
  
  private calculateReputationImpact(
    validator: EmotionalValidator,
    emotionalScore: number,
    votingResult: any
  ): number {
    let impact = 0;
    
    // Positive impact for good performance
    if (emotionalScore > 85) {
      impact += 0.5;
    }
    
    // Positive impact for participating in consensus
    if (votingResult.participants.includes(validator.getId())) {
      impact += 0.2;
    }
    
    // Positive impact for voting correctly
    const validatorVote = votingResult.votes.find(
      (vote: any) => vote.validatorId === validator.getId()
    );
    
    if (validatorVote && validatorVote.approved === votingResult.success) {
      impact += 0.3;
    }
    
    // Negative impact for poor performance
    if (emotionalScore < 60) {
      impact -= 1.0;
    }
    
    // Negative impact for not participating
    if (!votingResult.participants.includes(validator.getId())) {
      impact -= 0.5;
    }
    
    return impact;
  }
  
  private applyNetworkAdjustments(
    rewards: Map<string, number>,
    rewardMetrics: RewardMetrics[],
    epochMetrics: any
  ): Map<string, number> {
    const adjustedRewards = new Map<string, number>();
    
    // Calculate total proposed rewards
    const totalProposedRewards = Array.from(rewards.values()).reduce((sum, reward) => sum + reward, 0);
    
    // Network health adjustment
    const networkHealthFactor = this.calculateNetworkHealthFactor(epochMetrics);
    
    // Apply adjustments
    for (const [validatorId, originalReward] of rewards.entries()) {
      let adjustedReward = originalReward * networkHealthFactor;
      
      // Minimum reward guarantee (50% of base reward)
      const minimumReward = this.config.baseReward * 0.5;
      adjustedReward = Math.max(adjustedReward, minimumReward);
      
      // Apply inflation/deflation based on total supply
      adjustedReward = this.applyInflationAdjustment(adjustedReward, epochMetrics);
      
      adjustedRewards.set(validatorId, Math.round(adjustedReward * 100) / 100);
    }
    
    return adjustedRewards;
  }
  
  private calculateNetworkHealthFactor(epochMetrics: any): number {
    // Base factor of 1.0
    let factor = 1.0;
    
    // Bonus for high participation
    if (epochMetrics.participantCount > 15) {
      factor += 0.1;
    }
    
    // Bonus for high emotional average
    if (epochMetrics.emotionalAverage > 85) {
      factor += 0.05;
    }
    
    // Penalty for Byzantine failures
    if (epochMetrics.byzantineFailures > 0) {
      factor -= epochMetrics.byzantineFailures * 0.1;
    }
    
    // Penalty for slow epochs
    if (epochMetrics.duration > 35000) { // More than 35 seconds
      factor -= 0.05;
    }
    
    // Keep factor within reasonable bounds
    return Math.max(0.5, Math.min(1.5, factor));
  }
  
  private applyInflationAdjustment(reward: number, epochMetrics: any): number {
    // Simple inflation model - reduce rewards slightly over time
    // This would be replaced with proper tokenomics in production
    
    const epochNumber = epochMetrics.epochNumber || 0;
    const inflationRate = 0.99999; // Very slight deflation per epoch
    
    return reward * Math.pow(inflationRate, epochNumber);
  }
  
  // Penalty system for poor behavior
  async calculatePenalties(
    validator: EmotionalValidator,
    slashingConditions: any[]
  ): Promise<number> {
    let totalPenalty = 0;
    
    for (const condition of slashingConditions) {
      switch (condition.type) {
        case 'emotional_manipulation':
          totalPenalty += validator.getStake() * 0.1; // 10% stake slash
          break;
          
        case 'poor_performance':
          totalPenalty += validator.getStake() * 0.02; // 2% stake slash
          break;
          
        case 'offline':
          totalPenalty += validator.getStake() * 0.01; // 1% stake slash
          break;
          
        case 'byzantine_behavior':
          totalPenalty += validator.getStake() * 0.2; // 20% stake slash
          break;
          
        default:
          totalPenalty += validator.getStake() * 0.05; // 5% default penalty
      }
    }
    
    return totalPenalty;
  }
  
  // Long-term incentive calculations
  calculateLongTermIncentives(
    validator: EmotionalValidator,
    rewardHistory: RewardMetrics[]
  ): {
    loyaltyBonus: number;
    consistencyMultiplier: number;
    growthBonus: number;
  } {
    const recentRewards = rewardHistory.slice(-30); // Last 30 epochs
    
    // Loyalty bonus for long-term validators
    const loyaltyBonus = recentRewards.length >= 30 ? 5 : 0;
    
    // Consistency multiplier for stable performance
    const emotionalScores = recentRewards.map(r => r.emotionalBonus);
    const variance = this.calculateVariance(emotionalScores);
    const consistencyMultiplier = variance < 5 ? 1.1 : 1.0;
    
    // Growth bonus for improving validators
    const growthTrend = this.calculateGrowthTrend(emotionalScores);
    const growthBonus = growthTrend > 0.1 ? 3 : 0;
    
    return {
      loyaltyBonus,
      consistencyMultiplier,
      growthBonus
    };
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = _.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return _.mean(squaredDiffs);
  }
  
  private calculateGrowthTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // Simple linear regression slope
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }
  
  // Public API for reward information
  getRewardConfig(): RewardConfig {
    return { ...this.config };
  }
  
  async calculatePotentialReward(
    validator: EmotionalValidator,
    hypotheticalScore: number
  ): Promise<number> {
    // Calculate what reward would be with given emotional score
    const baseReward = this.config.baseReward;
    const emotionalBonus = this.calculateEmotionalBonus(hypotheticalScore);
    const stakeMultiplier = this.calculateStakeMultiplier(validator.getStake());
    const consistencyBonus = await this.calculateConsistencyBonus(validator);
    
    return (baseReward + emotionalBonus + consistencyBonus) * stakeMultiplier;
  }
  
  getRewardBreakdown(validatorId: string, metrics: RewardMetrics): {
    components: { [key: string]: number };
    total: number;
    description: string;
  } {
    return {
      components: {
        'Base Reward': metrics.baseReward,
        'Emotional Bonus': metrics.emotionalBonus,
        'Consistency Bonus': metrics.consistencyBonus,
        'Participation Bonus': metrics.participationBonus,
        'Stake Multiplier': metrics.stakeMultiplier
      },
      total: metrics.totalReward,
      description: `Reward for validator ${validatorId} based on emotional contribution and network participation`
    };
  }
}