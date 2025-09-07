/**
 * Validator Economics Engine for EmotionalChain
 * Handles staking, rewards, slashing, and economic incentives for distributed validators
 */

import { EmotionalValidator } from '../crypto/EmotionalValidator';
import { Block } from '../crypto/Block';
import { Transaction } from '../crypto/Transaction';
import * as crypto from 'crypto';

export interface ValidatorStake {
  validatorId: string;
  stakedAmount: number;
  stakingTimestamp: number;
  lockupPeriod: number; // in blocks
  isActive: boolean;
  delegatedStake: number;
  selfStake: number;
}

export interface ValidatorRewards {
  validatorId: string;
  blockRewards: number;
  consensusRewards: number;
  emotionalBonus: number;
  delegationFees: number;
  totalEarned: number;
  lastRewardBlock: number;
}

export interface SlashingEvent {
  validatorId: string;
  slashingType: 'BYZANTINE' | 'OFFLINE' | 'EMOTIONAL_FRAUD' | 'DOUBLE_VOTE';
  slashedAmount: number;
  blockNumber: number;
  timestamp: number;
  evidence: string;
}

export interface EconomicParameters {
  minimumStake: number;           // 1000 EMO minimum
  maximumStake: number;           // 100000 EMO maximum  
  blockReward: number;            // 10 EMO base reward
  consensusReward: number;        // 5 EMO for consensus participation
  emotionalBonusRate: number;     // 0.1 = 10% bonus for high emotional scores
  delegationFeeRate: number;      // 0.05 = 5% fee on delegation rewards
  slashingRates: {
    byzantine: number;            // 0.20 = 20% of stake
    offline: number;              // 0.05 = 5% of stake
    emotionalFraud: number;       // 0.15 = 15% of stake
    doubleVote: number;           // 0.10 = 10% of stake
  };
  lockupPeriods: {
    minimum: number;              // 7 days in blocks
    maximum: number;              // 365 days in blocks
  };
  apr: number;                    // 8% annual percentage rate
}

/**
 * Production-grade validator economics with proper incentive alignment
 */
export class ValidatorEconomics {
  private stakes: Map<string, ValidatorStake>;
  private rewards: Map<string, ValidatorRewards>;
  private slashingHistory: SlashingEvent[];
  private economicParams: EconomicParameters;
  
  // Economics tracking
  private totalStaked: number;
  private totalRewardsDistributed: number;
  private totalSlashed: number;
  private currentBlock: number;

  constructor() {
    this.stakes = new Map();
    this.rewards = new Map();
    this.slashingHistory = [];
    this.totalStaked = 0;
    this.totalRewardsDistributed = 0;
    this.totalSlashed = 0;
    this.currentBlock = 0;
    
    // Production-ready economic parameters
    this.economicParams = {
      minimumStake: 1000,      // 1000 EMO minimum stake
      maximumStake: 100000,    // 100k EMO maximum stake
      blockReward: 10,         // 10 EMO per block
      consensusReward: 5,      // 5 EMO for consensus participation
      emotionalBonusRate: 0.1, // 10% emotional bonus
      delegationFeeRate: 0.05, // 5% delegation fee
      slashingRates: {
        byzantine: 0.20,       // 20% for Byzantine behavior
        offline: 0.05,         // 5% for being offline
        emotionalFraud: 0.15,  // 15% for emotional score fraud
        doubleVote: 0.10       // 10% for double voting
      },
      lockupPeriods: {
        minimum: 7 * 24 * 30,   // 7 days (30 blocks per hour)
        maximum: 365 * 24 * 30  // 1 year
      },
      apr: 0.08 // 8% APR for staking rewards
    };
    
    console.log('💰 Validator Economics Engine initialized with production parameters');
  }

  /**
   * Stake tokens to become a validator
   */
  async stakeTokens(
    validatorId: string, 
    amount: number, 
    lockupPeriod?: number
  ): Promise<boolean> {
    if (amount < this.economicParams.minimumStake) {
      console.error(`❌ Stake amount ${amount} below minimum ${this.economicParams.minimumStake}`);
      return false;
    }

    if (amount > this.economicParams.maximumStake) {
      console.error(`❌ Stake amount ${amount} exceeds maximum ${this.economicParams.maximumStake}`);
      return false;
    }

    const existingStake = this.stakes.get(validatorId);
    const finalLockup = lockupPeriod || this.economicParams.lockupPeriods.minimum;

    if (existingStake) {
      // Add to existing stake
      existingStake.stakedAmount += amount;
      existingStake.selfStake += amount;
      existingStake.lockupPeriod = Math.max(existingStake.lockupPeriod, finalLockup);
      console.log(`💰 Added ${amount} EMO to ${validatorId} stake (Total: ${existingStake.stakedAmount})`);
    } else {
      // Create new stake
      const stake: ValidatorStake = {
        validatorId,
        stakedAmount: amount,
        stakingTimestamp: Date.now(),
        lockupPeriod: finalLockup,
        isActive: true,
        delegatedStake: 0,
        selfStake: amount
      };

      this.stakes.set(validatorId, stake);
      
      // Initialize rewards tracking
      this.rewards.set(validatorId, {
        validatorId,
        blockRewards: 0,
        consensusRewards: 0,
        emotionalBonus: 0,
        delegationFees: 0,
        totalEarned: 0,
        lastRewardBlock: this.currentBlock
      });

      console.log(`✅ Validator ${validatorId} staked ${amount} EMO with ${finalLockup} block lockup`);
    }

    this.totalStaked += amount;
    return true;
  }

  /**
   * Delegate stake to an existing validator
   */
  async delegateStake(
    delegatorId: string, 
    validatorId: string, 
    amount: number
  ): Promise<boolean> {
    const validatorStake = this.stakes.get(validatorId);
    
    if (!validatorStake) {
      console.error(`❌ Validator ${validatorId} not found for delegation`);
      return false;
    }

    if (!validatorStake.isActive) {
      console.error(`❌ Validator ${validatorId} is not active`);
      return false;
    }

    // Check if delegation would exceed maximum stake
    if (validatorStake.stakedAmount + amount > this.economicParams.maximumStake) {
      console.error(`❌ Delegation would exceed maximum stake limit`);
      return false;
    }

    // Add delegated stake
    validatorStake.delegatedStake += amount;
    validatorStake.stakedAmount += amount;

    this.totalStaked += amount;
    
    console.log(`🤝 ${delegatorId} delegated ${amount} EMO to ${validatorId} (Total: ${validatorStake.stakedAmount})`);
    
    return true;
  }

  /**
   * Distribute block rewards to validators
   */
  async distributeBlockRewards(block: Block, consensusParticipants: string[]): Promise<void> {
    const blockValidator = block.validator;
    this.currentBlock = block.index;
    
    console.log(`💰 Distributing rewards for block ${block.index}...`);

    // Block proposer reward
    await this.distributeBlockProposerReward(blockValidator, block);
    
    // Consensus participation rewards
    for (const participantId of consensusParticipants) {
      await this.distributeConsensusReward(participantId, block);
    }
    
    // Emotional bonuses based on validator scores
    await this.distributeEmotionalBonuses(consensusParticipants, block);

    console.log(`✅ Block rewards distributed for block ${block.index}`);
  }

  /**
   * Distribute block proposer reward
   */
  private async distributeBlockProposerReward(validatorId: string, block: Block): Promise<void> {
    const stake = this.stakes.get(validatorId);
    const rewards = this.rewards.get(validatorId);
    
    if (!stake || !rewards) {
      console.error(`❌ No stake/rewards found for validator ${validatorId}`);
      return;
    }

    let blockReward = this.economicParams.blockReward;
    
    // Stake-weighted bonus (higher stake = slightly higher reward)
    const stakeBonus = Math.min(2, stake.stakedAmount / 10000); // Max 2 EMO bonus
    blockReward += stakeBonus;
    
    // Update rewards
    rewards.blockRewards += blockReward;
    rewards.totalEarned += blockReward;
    rewards.lastRewardBlock = block.index;
    
    this.totalRewardsDistributed += blockReward;
    
    console.log(`🏆 Block proposer reward: ${blockReward.toFixed(2)} EMO to ${validatorId}`);
  }

  /**
   * Distribute consensus participation rewards
   */
  private async distributeConsensusReward(validatorId: string, block: Block): Promise<void> {
    const stake = this.stakes.get(validatorId);
    const rewards = this.rewards.get(validatorId);
    
    if (!stake || !rewards) return;

    const consensusReward = this.economicParams.consensusReward;
    
    rewards.consensusRewards += consensusReward;
    rewards.totalEarned += consensusReward;
    rewards.lastRewardBlock = block.index;
    
    this.totalRewardsDistributed += consensusReward;
    
    console.log(`🗳️ Consensus reward: ${consensusReward} EMO to ${validatorId}`);
  }

  /**
   * Distribute emotional bonuses for high emotional scores
   */
  private async distributeEmotionalBonuses(participants: string[], block: Block): Promise<void> {
    // This would need access to validator emotional scores
    // For now, simulate based on block data
    
    for (const validatorId of participants) {
      const rewards = this.rewards.get(validatorId);
      if (!rewards) continue;
      
      // Simulate emotional score (in real implementation, get from validator data)
      const emotionalScore = 75 + Math.random() * 25; // 75-100 range
      
      if (emotionalScore > 90) {
        const baseReward = this.economicParams.blockReward + this.economicParams.consensusReward;
        const emotionalBonus = baseReward * this.economicParams.emotionalBonusRate;
        
        rewards.emotionalBonus += emotionalBonus;
        rewards.totalEarned += emotionalBonus;
        
        this.totalRewardsDistributed += emotionalBonus;
        
        console.log(`❤️ Emotional bonus: ${emotionalBonus.toFixed(2)} EMO to ${validatorId} (score: ${emotionalScore.toFixed(1)})`);
      }
    }
  }

  /**
   * Slash validator for malicious behavior
   */
  async slashValidator(
    validatorId: string, 
    slashingType: SlashingEvent['slashingType'], 
    evidence: string
  ): Promise<number> {
    const stake = this.stakes.get(validatorId);
    
    if (!stake) {
      console.error(`❌ Cannot slash validator ${validatorId} - no stake found`);
      return 0;
    }

    const slashingRate = this.economicParams.slashingRates[slashingType.toLowerCase() as keyof typeof this.economicParams.slashingRates];
    const slashedAmount = Math.min(stake.stakedAmount * slashingRate, stake.stakedAmount);
    
    // Execute slashing
    stake.stakedAmount -= slashedAmount;
    this.totalStaked -= slashedAmount;
    this.totalSlashed += slashedAmount;
    
    // Deactivate validator if stake falls below minimum
    if (stake.stakedAmount < this.economicParams.minimumStake) {
      stake.isActive = false;
      console.log(`❌ Validator ${validatorId} deactivated due to insufficient stake`);
    }
    
    // Record slashing event
    const slashingEvent: SlashingEvent = {
      validatorId,
      slashingType,
      slashedAmount,
      blockNumber: this.currentBlock,
      timestamp: Date.now(),
      evidence
    };
    
    this.slashingHistory.push(slashingEvent);
    
    console.log(`⚡ Slashed ${slashedAmount.toFixed(2)} EMO from ${validatorId} for ${slashingType}`);
    
    return slashedAmount;
  }

  /**
   * Calculate APR for staking
   */
  calculateStakingAPR(validatorId: string): number {
    const stake = this.stakes.get(validatorId);
    const rewards = this.rewards.get(validatorId);
    
    if (!stake || !rewards) return 0;
    
    // Calculate time-weighted APR
    const stakingDays = (Date.now() - stake.stakingTimestamp) / (1000 * 60 * 60 * 24);
    
    if (stakingDays < 1) return 0; // Need at least 1 day of data
    
    const dailyReturn = rewards.totalEarned / stakingDays / stake.selfStake;
    const apr = dailyReturn * 365;
    
    return apr;
  }

  /**
   * Get validator economic status
   */
  getValidatorEconomics(validatorId: string): any {
    const stake = this.stakes.get(validatorId);
    const rewards = this.rewards.get(validatorId);
    
    if (!stake || !rewards) {
      return null;
    }
    
    const apr = this.calculateStakingAPR(validatorId);
    const slashingEvents = this.slashingHistory.filter(s => s.validatorId === validatorId);
    
    return {
      stake: { ...stake },
      rewards: { ...rewards },
      apr: (apr * 100).toFixed(2) + '%',
      slashingEvents: slashingEvents.length,
      totalSlashed: slashingEvents.reduce((sum, event) => sum + event.slashedAmount, 0),
      profitability: rewards.totalEarned - slashingEvents.reduce((sum, event) => sum + event.slashedAmount, 0)
    };
  }

  /**
   * Get network economic statistics
   */
  getNetworkEconomics(): any {
    const activeValidators = Array.from(this.stakes.values()).filter(s => s.isActive).length;
    const totalActiveStake = Array.from(this.stakes.values())
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + s.stakedAmount, 0);
    
    const averageStake = activeValidators > 0 ? totalActiveStake / activeValidators : 0;
    const stakingRatio = this.totalStaked / 768667.74; // Total EMO supply
    
    return {
      totalValidators: this.stakes.size,
      activeValidators,
      totalStaked: this.totalStaked.toFixed(2),
      totalRewardsDistributed: this.totalRewardsDistributed.toFixed(2),
      totalSlashed: this.totalSlashed.toFixed(2),
      averageStake: averageStake.toFixed(2),
      stakingRatio: (stakingRatio * 100).toFixed(1) + '%',
      networkAPR: (this.economicParams.apr * 100).toFixed(1) + '%',
      slashingEvents: this.slashingHistory.length,
      economicSecurity: this.calculateEconomicSecurity()
    };
  }

  /**
   * Calculate economic security of the network
   */
  private calculateEconomicSecurity(): string {
    const totalStakeValue = this.totalStaked;
    
    // Cost to attack (need 1/3 + 1 of total stake for Byzantine attack)
    const attackCost = (totalStakeValue / 3) + 1;
    
    let securityLevel: string;
    if (attackCost > 100000) securityLevel = 'ENTERPRISE';
    else if (attackCost > 50000) securityLevel = 'HIGH';
    else if (attackCost > 10000) securityLevel = 'MEDIUM';
    else securityLevel = 'LOW';
    
    return `${securityLevel} (${attackCost.toFixed(0)} EMO attack cost)`;
  }

  /**
   * Unstake tokens (with lockup period validation)
   */
  async unstakeTokens(validatorId: string, amount?: number): Promise<boolean> {
    const stake = this.stakes.get(validatorId);
    
    if (!stake) {
      console.error(`❌ No stake found for validator ${validatorId}`);
      return false;
    }

    // Check lockup period
    const blocksSinceStaking = this.currentBlock - (stake.stakingTimestamp / 1000 / 60 * 30); // Convert to blocks
    if (blocksSinceStaking < stake.lockupPeriod) {
      console.error(`❌ Lockup period not met (${blocksSinceStaking}/${stake.lockupPeriod} blocks)`);
      return false;
    }

    const unstakeAmount = amount || stake.selfStake;
    
    if (unstakeAmount > stake.selfStake) {
      console.error(`❌ Cannot unstake more than self-stake (${unstakeAmount} > ${stake.selfStake})`);
      return false;
    }

    // Execute unstaking
    stake.stakedAmount -= unstakeAmount;
    stake.selfStake -= unstakeAmount;
    this.totalStaked -= unstakeAmount;
    
    // Deactivate if below minimum
    if (stake.stakedAmount < this.economicParams.minimumStake) {
      stake.isActive = false;
    }
    
    console.log(`💸 Unstaked ${unstakeAmount} EMO from ${validatorId}`);
    
    return true;
  }

  /**
   * Get top validators by stake
   */
  getTopValidators(limit: number = 10): any[] {
    return Array.from(this.stakes.entries())
      .filter(([_, stake]) => stake.isActive)
      .sort(([_, a], [__, b]) => b.stakedAmount - a.stakedAmount)
      .slice(0, limit)
      .map(([validatorId, stake]) => ({
        validatorId,
        stakedAmount: stake.stakedAmount,
        delegatedStake: stake.delegatedStake,
        selfStake: stake.selfStake,
        apr: this.calculateStakingAPR(validatorId)
      }));
  }
}