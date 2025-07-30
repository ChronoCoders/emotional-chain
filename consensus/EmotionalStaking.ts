/**
 * Emotional Staking Engine for EmotionalChain
 * Stake-weighted emotional consensus with dynamic rewards and slashing
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface Validator {
  id: string;
  address: string;
  stake: number;
  emotionalScore: number;
  reputation: number;
  isActive: boolean;
  commission: number; // Percentage
  lastActivityTime: number;
  totalRewards: number;
  slashingHistory: SlashingEvent[];
  performance: {
    uptime: number; // Percentage
    averageEmotionalScore: number;
    consensusParticipation: number; // Percentage
    blocksProposed: number;
    blocksValidated: number;
  };
}

export interface StakeEntry {
  validatorId: string;
  delegator: string;
  amount: number;
  timestamp: number;
  lockupPeriod: number; // seconds
  rewards: number;
  lastClaimTime: number;
  emotionalMultiplier: number;
  status: 'active' | 'unbonding' | 'slashed' | 'withdrawn';
}

export interface SlashingEvent {
  id: string;
  validatorId: string;
  offense: 'poor_emotional_behavior' | 'missed_consensus' | 'invalid_biometric' | 'double_signing' | 'downtime';
  severity: 'minor' | 'major' | 'critical';
  slashingRate: number; // Percentage
  amount: number; // EMO tokens slashed
  timestamp: number;
  evidence: any;
  redistributed: boolean;
}

export interface RewardDistribution {
  epoch: number;
  timestamp: number;
  totalRewards: number;
  validatorRewards: Map<string, number>;
  delegatorRewards: Map<string, number>;
  emotionalBonuses: Map<string, number>;
  baseRewards: number;
  performanceBonuses: number;
  emotionalIncentives: number;
}

export interface StakingMetrics {
  totalStaked: number;
  activeValidators: number;
  averageStake: number;
  totalDelegators: number;
  stakingRatio: number; // Percentage of total supply staked
  rewardRate: number; // Annual percentage
  slashingRate: number; // Percentage of stakes slashed
  emotionalPerformance: number; // Average emotional score
}

export class EmotionalStaking extends EventEmitter {
  private validators: Map<string, Validator> = new Map();
  private stakes: Map<string, StakeEntry> = new Map();
  private slashingEvents: Map<string, SlashingEvent> = new Map();
  private rewardHistory: RewardDistribution[] = [];
  private metrics: StakingMetrics;
  
  private readonly minStake = 50000; // Minimum 50k EMO to become validator
  private readonly maxValidators = 101; // Maximum active validators
  private readonly slashingRates = {
    minor: 0.01, // 1%
    major: 0.05, // 5%
    critical: 0.15 // 15%
  };
  private readonly emotionalThreshold = 75; // Minimum emotional score
  private currentEpoch = 0;

  constructor() {
    super();
    
    this.metrics = {
      totalStaked: 0,
      activeValidators: 0,
      averageStake: 0,
      totalDelegators: 0,
      stakingRatio: 0,
      rewardRate: 12.5, // 12.5% annual
      slashingRate: 0,
      emotionalPerformance: 0
    };

    this.initializeStaking();
  }

  private initializeStaking(): void {
    console.log(`💰 Initializing Emotional Staking Engine`);
    
    // Start epoch processing
    this.startEpochProcessing();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start slashing detection
    this.startSlashingDetection();
    
    console.log(`✅ Emotional Staking Engine initialized`);
    this.emit('ready');
  }

  public async registerValidator(
    id: string,
    address: string,
    initialStake: number,
    commission: number = 5
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (this.validators.has(id)) {
        return { success: false, message: 'Validator already registered' };
      }

      if (initialStake < this.minStake) {
        return { success: false, message: `Minimum stake required: ${this.minStake} EMO` };
      }

      if (commission < 0 || commission > 20) {
        return { success: false, message: 'Commission must be between 0% and 20%' };
      }

      if (this.getActiveValidatorCount() >= this.maxValidators) {
        return { success: false, message: 'Maximum validators reached' };
      }

      const validator: Validator = {
        id,
        address,
        stake: initialStake,
        emotionalScore: 0,
        reputation: 100, // Start with perfect reputation
        isActive: true,
        commission,
        lastActivityTime: Date.now(),
        totalRewards: 0,
        slashingHistory: [],
        performance: {
          uptime: 100,
          averageEmotionalScore: 0,
          consensusParticipation: 0,
          blocksProposed: 0,
          blocksValidated: 0
        }
      };

      this.validators.set(id, validator);

      // Create initial stake entry
      const stakeId = this.generateStakeId(id, address);
      const stakeEntry: StakeEntry = {
        validatorId: id,
        delegator: address, // Self-stake
        amount: initialStake,
        timestamp: Date.now(),
        lockupPeriod: 21 * 24 * 60 * 60, // 21 days
        rewards: 0,
        lastClaimTime: Date.now(),
        emotionalMultiplier: 1.0,
        status: 'active'
      };

      this.stakes.set(stakeId, stakeEntry);
      this.updateMetrics();

      console.log(`✅ Validator registered: ${id} with ${initialStake} EMO stake`);
      this.emit('validatorRegistered', { validator, stakeEntry });

      return { success: true, message: `Validator ${id} registered successfully` };

    } catch (error) {
      console.error(`❌ Validator registration failed:`, error);
      return { success: false, message: 'Registration failed' };
    }
  }

  public async delegateStake(
    validatorId: string,
    delegator: string,
    amount: number,
    lockupPeriod: number = 21 * 24 * 60 * 60
  ): Promise<{ success: boolean; stakeId?: string; message: string }> {
    try {
      const validator = this.validators.get(validatorId);
      if (!validator) {
        return { success: false, message: 'Validator not found' };
      }

      if (!validator.isActive) {
        return { success: false, message: 'Validator is not active' };
      }

      if (amount < 1000) { // Minimum 1k EMO delegation
        return { success: false, message: 'Minimum delegation: 1,000 EMO' };
      }

      const stakeId = this.generateStakeId(validatorId, delegator);
      
      // Check if delegation already exists
      if (this.stakes.has(stakeId)) {
        const existingStake = this.stakes.get(stakeId)!;
        existingStake.amount += amount;
        existingStake.timestamp = Date.now();
      } else {
        const stakeEntry: StakeEntry = {
          validatorId,
          delegator,
          amount,
          timestamp: Date.now(),
          lockupPeriod,
          rewards: 0,
          lastClaimTime: Date.now(),
          emotionalMultiplier: 1.0,
          status: 'active'
        };

        this.stakes.set(stakeId, stakeEntry);
      }

      // Update validator total stake
      validator.stake += amount;
      this.updateMetrics();

      console.log(`💰 Stake delegated: ${amount} EMO to ${validatorId} by ${delegator}`);
      this.emit('stakeDelegated', { validatorId, delegator, amount, stakeId });

      return { success: true, stakeId, message: 'Stake delegated successfully' };

    } catch (error) {
      console.error(`❌ Stake delegation failed:`, error);
      return { success: false, message: 'Delegation failed' };
    }
  }

  public calculateStakeWeight(validator: Validator): number {
    // Calculate stake weight with emotional multiplier
    const baseWeight = Math.sqrt(validator.stake); // Square root to reduce whale dominance
    const emotionalBonus = Math.max(0, (validator.emotionalScore - this.emotionalThreshold) / 100);
    const reputationMultiplier = validator.reputation / 100;
    
    return baseWeight * (1 + emotionalBonus) * reputationMultiplier;
  }

  public applyEmotionalMultiplier(baseReward: number, emotionalScore: number): number {
    // Apply emotional score multiplier to rewards
    if (emotionalScore < this.emotionalThreshold) {
      // Penalty for low emotional scores
      const penalty = (this.emotionalThreshold - emotionalScore) / 100;
      return baseReward * (1 - penalty * 0.5); // Up to 50% penalty
    } else {
      // Bonus for high emotional scores
      const bonus = (emotionalScore - this.emotionalThreshold) / 100;
      return baseReward * (1 + bonus * 0.3); // Up to 30% bonus
    }
  }

  public async slashStakeForPoorBehavior(
    validatorId: string,
    offense: SlashingEvent['offense'],
    evidence: any
  ): Promise<void> {
    try {
      const validator = this.validators.get(validatorId);
      if (!validator) {
        throw new Error(`Validator not found: ${validatorId}`);
      }

      const severity = this.determineSeverity(offense, evidence);
      const slashingRate = this.slashingRates[severity];
      const slashingAmount = validator.stake * slashingRate;

      const slashingEvent: SlashingEvent = {
        id: crypto.randomBytes(16).toString('hex'),
        validatorId,
        offense,
        severity,
        slashingRate,
        amount: slashingAmount,
        timestamp: Date.now(),
        evidence,
        redistributed: false
      };

      // Apply slashing to validator
      validator.stake = Math.max(0, validator.stake - slashingAmount);
      validator.reputation = Math.max(0, validator.reputation - severity === 'critical' ? 20 : severity === 'major' ? 10 : 5);
      validator.slashingHistory.push(slashingEvent);

      // Slash delegator stakes proportionally
      await this.slashDelegatorStakes(validatorId, slashingRate);

      // Deactivate validator if stake falls below minimum
      if (validator.stake < this.minStake) {
        validator.isActive = false;
        console.log(`🚫 Validator deactivated due to insufficient stake: ${validatorId}`);
      }

      this.slashingEvents.set(slashingEvent.id, slashingEvent);
      this.updateMetrics();

      console.log(`⚡ Slashed ${slashingAmount} EMO from ${validatorId} for ${offense} (${severity})`);
      this.emit('validatorSlashed', slashingEvent);

      // Redistribute slashed tokens
      await this.redistributeSlashedStake(slashingAmount);

    } catch (error) {
      console.error(`❌ Slashing failed for ${validatorId}:`, error);
      throw error;
    }
  }

  public async redistributeSlashedStake(amount: number): Promise<void> {
    try {
      console.log(`🔄 Redistributing ${amount} EMO slashed tokens`);

      const activeValidators = Array.from(this.validators.values()).filter(v => v.isActive);
      if (activeValidators.length === 0) {
        console.warn(`⚠️ No active validators to redistribute slashed tokens`);
        return;
      }

      // Calculate redistribution weights based on emotional performance
      const totalWeight = activeValidators.reduce((sum, v) => sum + this.calculateStakeWeight(v), 0);
      
      for (const validator of activeValidators) {
        const weight = this.calculateStakeWeight(validator);
        const redistribution = (weight / totalWeight) * amount;
        
        validator.stake += redistribution;
        validator.totalRewards += redistribution;
        
        console.log(`💰 Redistributed ${redistribution.toFixed(2)} EMO to ${validator.id}`);
      }

      this.emit('slashedStakeRedistributed', { amount, recipients: activeValidators.length });

    } catch (error) {
      console.error(`❌ Stake redistribution failed:`, error);
      throw error;
    }
  }

  public async processEpochRewards(): Promise<RewardDistribution> {
    try {
      this.currentEpoch++;
      console.log(`🏆 Processing epoch ${this.currentEpoch} rewards`);

      const activeValidators = Array.from(this.validators.values()).filter(v => v.isActive);
      const totalStakeWeight = activeValidators.reduce((sum, v) => sum + this.calculateStakeWeight(v), 0);
      
      // Calculate total rewards for this epoch (simplified)
      const baseRewardPool = 100000; // 100k EMO per epoch
      const emotionalBonusPool = 50000; // 50k EMO emotional bonuses
      const totalRewards = baseRewardPool + emotionalBonusPool;

      const distribution: RewardDistribution = {
        epoch: this.currentEpoch,
        timestamp: Date.now(),
        totalRewards,
        validatorRewards: new Map(),
        delegatorRewards: new Map(),
        emotionalBonuses: new Map(),
        baseRewards: baseRewardPool,
        performanceBonuses: 0,
        emotionalIncentives: emotionalBonusPool
      };

      // Distribute rewards to validators and delegators
      for (const validator of activeValidators) {
        const stakeWeight = this.calculateStakeWeight(validator);
        const baseReward = (stakeWeight / totalStakeWeight) * baseRewardPool;
        const emotionalReward = this.applyEmotionalMultiplier(baseReward, validator.emotionalScore);
        
        // Validator commission
        const commission = emotionalReward * (validator.commission / 100);
        const validatorReward = commission;
        
        validator.totalRewards += validatorReward;
        distribution.validatorRewards.set(validator.id, validatorReward);

        // Distribute remaining rewards to delegators
        const delegatorReward = emotionalReward - commission;
        await this.distributeDelegatorRewards(validator.id, delegatorReward, distribution);

        // Emotional bonus
        if (validator.emotionalScore > this.emotionalThreshold + 10) {
          const emotionalBonus = (validator.emotionalScore - this.emotionalThreshold) * 100;
          validator.totalRewards += emotionalBonus;
          distribution.emotionalBonuses.set(validator.id, emotionalBonus);
        }

        console.log(`💰 Distributed ${emotionalReward.toFixed(2)} EMO to ${validator.id} (emotional score: ${validator.emotionalScore})`);
      }

      this.rewardHistory.push(distribution);
      this.updateMetrics();

      console.log(`✅ Epoch ${this.currentEpoch} rewards distributed: ${totalRewards} EMO`);
      this.emit('epochRewardsDistributed', distribution);

      return distribution;

    } catch (error) {
      console.error(`❌ Epoch reward processing failed:`, error);
      throw error;
    }
  }

  private async distributeDelegatorRewards(
    validatorId: string,
    totalDelegatorReward: number,
    distribution: RewardDistribution
  ): Promise<void> {
    const validatorStakes = Array.from(this.stakes.values()).filter(s => 
      s.validatorId === validatorId && s.status === 'active'
    );

    const totalDelegatedStake = validatorStakes.reduce((sum, s) => sum + s.amount, 0);

    for (const stake of validatorStakes) {
      const stakeRatio = stake.amount / totalDelegatedStake;
      const baseReward = totalDelegatorReward * stakeRatio;
      const emotionalReward = baseReward * stake.emotionalMultiplier;
      
      stake.rewards += emotionalReward;
      distribution.delegatorRewards.set(stake.delegator, 
        (distribution.delegatorRewards.get(stake.delegator) || 0) + emotionalReward
      );
    }
  }

  private async slashDelegatorStakes(validatorId: string, slashingRate: number): Promise<void> {
    const validatorStakes = Array.from(this.stakes.values()).filter(s => 
      s.validatorId === validatorId && s.status === 'active'
    );

    for (const stake of validatorStakes) {
      const slashingAmount = stake.amount * slashingRate;
      stake.amount = Math.max(0, stake.amount - slashingAmount);
      
      if (stake.amount === 0) {
        stake.status = 'slashed';
      }
      
      console.log(`⚡ Slashed ${slashingAmount} EMO from delegator ${stake.delegator}`);
    }
  }

  private determineSeverity(offense: SlashingEvent['offense'], evidence: any): SlashingEvent['severity'] {
    switch (offense) {
      case 'poor_emotional_behavior':
        return evidence.emotionalScore < 50 ? 'major' : 'minor';
      case 'missed_consensus':
        return evidence.missedRounds > 10 ? 'major' : 'minor';
      case 'invalid_biometric':
        return evidence.spoofingDetected ? 'critical' : 'major';
      case 'double_signing':
        return 'critical';
      case 'downtime':
        return evidence.downtimeHours > 24 ? 'major' : 'minor';
      default:
        return 'minor';
    }
  }

  private generateStakeId(validatorId: string, delegator: string): string {
    return crypto.createHash('sha256').update(`${validatorId}:${delegator}`).digest('hex');
  }

  private getActiveValidatorCount(): number {
    return Array.from(this.validators.values()).filter(v => v.isActive).length;
  }

  private updateMetrics(): void {
    const allValidators = Array.from(this.validators.values());
    const activeValidators = allValidators.filter(v => v.isActive);
    const allStakes = Array.from(this.stakes.values()).filter(s => s.status === 'active');

    this.metrics.totalStaked = allStakes.reduce((sum, s) => sum + s.amount, 0);
    this.metrics.activeValidators = activeValidators.length;
    this.metrics.averageStake = activeValidators.length > 0 ? 
      activeValidators.reduce((sum, v) => sum + v.stake, 0) / activeValidators.length : 0;
    this.metrics.totalDelegators = new Set(allStakes.map(s => s.delegator)).size;
    
    // Calculate staking ratio (assuming 5B total supply)
    this.metrics.stakingRatio = (this.metrics.totalStaked / 5000000000) * 100;
    
    // Calculate emotional performance
    this.metrics.emotionalPerformance = activeValidators.length > 0 ?
      activeValidators.reduce((sum, v) => sum + v.emotionalScore, 0) / activeValidators.length : 0;

    // Calculate slashing rate
    const totalSlashed = Array.from(this.slashingEvents.values())
      .reduce((sum, event) => sum + event.amount, 0);
    this.metrics.slashingRate = this.metrics.totalStaked > 0 ? 
      (totalSlashed / this.metrics.totalStaked) * 100 : 0;
  }

  private startEpochProcessing(): void {
    // Process epochs every hour (simplified - would be based on actual consensus rounds)
    setInterval(async () => {
      try {
        await this.processEpochRewards();
      } catch (error) {
        console.error(`❌ Epoch processing failed:`, error);
      }
    }, 60 * 60 * 1000);
  }

  private startPerformanceMonitoring(): void {
    // Monitor validator performance every 5 minutes
    setInterval(() => {
      this.monitorValidatorPerformance();
    }, 5 * 60 * 1000);
  }

  private startSlashingDetection(): void {
    // Check for slashing conditions every minute
    setInterval(() => {
      this.detectSlashingConditions();
    }, 60 * 1000);
  }

  private monitorValidatorPerformance(): void {
    for (const [id, validator] of this.validators.entries()) {
      if (!validator.isActive) continue;

      // Update performance metrics
      const timeSinceLastActivity = Date.now() - validator.lastActivityTime;
      
      // Check for downtime
      if (timeSinceLastActivity > 60 * 60 * 1000) { // 1 hour
        validator.performance.uptime = Math.max(0, validator.performance.uptime - 1);
        console.warn(`⚠️ Validator ${id} has been inactive for ${Math.floor(timeSinceLastActivity / 60000)} minutes`);
      }
    }
  }

  private detectSlashingConditions(): void {
    for (const [id, validator] of this.validators.entries()) {
      if (!validator.isActive) continue;

      // Check for poor emotional behavior
      if (validator.emotionalScore < this.emotionalThreshold - 20) {
        this.slashStakeForPoorBehavior(id, 'poor_emotional_behavior', {
          emotionalScore: validator.emotionalScore,
          threshold: this.emotionalThreshold
        });
      }

      // Check for excessive downtime
      if (validator.performance.uptime < 95) {
        this.slashStakeForPoorBehavior(id, 'downtime', {
          uptime: validator.performance.uptime,
          downtimeHours: (100 - validator.performance.uptime) * 24 / 100
        });
      }
    }
  }

  // Public getters and utilities
  public getValidators(): Validator[] {
    return Array.from(this.validators.values());
  }

  public getValidator(id: string): Validator | undefined {
    return this.validators.get(id);
  }

  public getStakes(validatorId?: string): StakeEntry[] {
    const stakes = Array.from(this.stakes.values());
    return validatorId ? stakes.filter(s => s.validatorId === validatorId) : stakes;
  }

  public getSlashingEvents(): SlashingEvent[] {
    return Array.from(this.slashingEvents.values());
  }

  public getRewardHistory(): RewardDistribution[] {
    return [...this.rewardHistory];
  }

  public getMetrics(): StakingMetrics {
    return { ...this.metrics };
  }

  public getTopValidators(count: number = 10): Validator[] {
    return Array.from(this.validators.values())
      .filter(v => v.isActive)
      .sort((a, b) => this.calculateStakeWeight(b) - this.calculateStakeWeight(a))
      .slice(0, count);
  }

  public updateValidatorEmotionalScore(validatorId: string, emotionalScore: number): void {
    const validator = this.validators.get(validatorId);
    if (validator) {
      validator.emotionalScore = emotionalScore;
      validator.lastActivityTime = Date.now();
      
      // Update emotional multiplier for delegator stakes
      const validatorStakes = this.getStakes(validatorId);
      for (const stake of validatorStakes) {
        stake.emotionalMultiplier = Math.max(0.5, Math.min(1.5, emotionalScore / 100));
      }

      this.updateMetrics();
    }
  }

  public isValidatorEligible(validatorId: string): boolean {
    const validator = this.validators.get(validatorId);
    return !!(validator && 
              validator.isActive && 
              validator.stake >= this.minStake &&
              validator.emotionalScore >= this.emotionalThreshold &&
              validator.reputation >= 50);
  }
}