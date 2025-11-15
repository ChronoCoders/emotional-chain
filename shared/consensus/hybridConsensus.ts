// Hybrid Consensus Mechanism (PoE + PoS)
// Combines Proof of Stake economic security with Proof of Emotion biometric bonuses

import type { ValidatorState, ValidatorStake, DeviceRegistration } from '../schema';

export interface ValidatorRequirements {
  minimumStake: bigint; // 10,000 EMO
  emotionalFitnessThreshold: number; // 75% (soft requirement now)
  deviceTrustLevel: 1 | 2 | 3;
}

export interface StakeParams {
  validatorAddress: string;
  amount: bigint;
  lockPeriod: number; // days
}

export interface RewardCalculation {
  baseReward: bigint;
  emotionalBonus: bigint;
  deviceBonus: bigint;
  totalReward: bigint;
}

export class HybridConsensus {
  private static readonly MINIMUM_STAKE = BigInt(10000); // 10,000 EMO
  private static readonly EMOTIONAL_FITNESS_THRESHOLD = 75; // 75%
  private static readonly LOCK_PERIOD_DAYS = 14; // 14 days minimum lock
  
  // Device trust level multipliers
  private static readonly DEVICE_MULTIPLIERS = {
    1: 0.5,  // Commodity devices (OAuth verified)
    2: 1.0,  // Medical devices (Serial verified)
    3: 1.5   // HSM devices (Cryptographically attested)
  };

  /**
   * Check if validator can participate in consensus
   * Hard requirements: stake + device registration
   * Soft requirement: emotional fitness (affects rewards)
   */
  async canParticipateInConsensus(
    validator: ValidatorState,
    stake: ValidatorStake | null,
    device: DeviceRegistration | null
  ): Promise<boolean> {
    // Hard requirement 1: Minimum stake
    const hasMinimumStake = stake && BigInt(stake.stakedAmount) >= HybridConsensus.MINIMUM_STAKE;
    
    // Hard requirement 2: Registered device
    const hasRegisteredDevice = device && device.isActive;
    
    // Hard requirements must be met
    if (!hasMinimumStake || !hasRegisteredDevice) {
      return false;
    }
    
    // Check stake lock period (prevent early unstake during consensus)
    if (stake && new Date(stake.lockedUntil) < new Date()) {
      return false; // Stake lock expired, need to renew
    }
    
    // Emotional fitness now affects rewards, not participation
    return true;
  }

  /**
   * Calculate block reward based on stake + emotional performance + device trust
   */
  calculateBlockReward(
    baseReward: bigint,
    emotionalScore: number,
    deviceTrustLevel: 1 | 2 | 3
  ): RewardCalculation {
    // Base: 50 EMO
    let reward = baseReward;
    
    // Emotional bonus: -25% to +25%
    // Score 0-100 maps to multiplier 0.75-1.25
    const emotionalMultiplier = 0.75 + (emotionalScore / 100) * 0.5;
    const emotionalBonus = BigInt(Math.floor(Number(reward) * (emotionalMultiplier - 1)));
    reward = BigInt(Math.floor(Number(reward) * emotionalMultiplier));
    
    // Device trust bonus
    const deviceMultiplier = HybridConsensus.DEVICE_MULTIPLIERS[deviceTrustLevel];
    const deviceBonus = BigInt(Math.floor(Number(baseReward) * (deviceMultiplier - 1)));
    reward = BigInt(Math.floor(Number(reward) * deviceMultiplier));
    
    return {
      baseReward,
      emotionalBonus,
      deviceBonus,
      totalReward: reward
    };
  }

  /**
   * Stake tokens for validator eligibility
   */
  async stakeTokens(params: StakeParams): Promise<ValidatorStake> {
    if (params.amount < HybridConsensus.MINIMUM_STAKE) {
      throw new Error(`Minimum stake is ${HybridConsensus.MINIMUM_STAKE} EMO`);
    }

    const now = new Date();
    const lockPeriod = Math.max(params.lockPeriod, HybridConsensus.LOCK_PERIOD_DAYS);
    const lockedUntil = new Date(now.getTime() + lockPeriod * 24 * 60 * 60 * 1000);

    return {
      id: 0, // Will be set by database
      validatorAddress: params.validatorAddress,
      stakedAmount: params.amount.toString(),
      stakeTimestamp: now,
      lockedUntil,
      slashingEvents: 0,
      totalSlashed: '0',
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Unstake tokens after lock period
   */
  async unstakeTokens(stake: ValidatorStake): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    
    if (now < new Date(stake.lockedUntil)) {
      return {
        allowed: false,
        reason: `Stake locked until ${stake.lockedUntil.toISOString()}`
      };
    }

    return { allowed: true };
  }

  /**
   * Slash validator for offline behavior (not stress)
   */
  async slashValidator(
    stake: ValidatorStake,
    reason: 'offline' | 'double_sign' | 'protocol_violation',
    percentage: number
  ): Promise<ValidatorStake> {
    const slashAmount = BigInt(Math.floor(Number(stake.stakedAmount) * percentage));
    const newStakedAmount = BigInt(stake.stakedAmount) - slashAmount;
    const newTotalSlashed = BigInt(stake.totalSlashed || '0') + slashAmount;

    return {
      ...stake,
      stakedAmount: newStakedAmount.toString(),
      slashingEvents: (stake.slashingEvents || 0) + 1,
      totalSlashed: newTotalSlashed.toString(),
      updatedAt: new Date()
    };
  }

  /**
   * Calculate slashing percentage based on offense
   */
  getSlashingPercentage(reason: 'offline' | 'double_sign' | 'protocol_violation'): number {
    switch (reason) {
      case 'offline':
        return 0.01; // 1% for temporary offline
      case 'double_sign':
        return 0.50; // 50% for critical offense
      case 'protocol_violation':
        return 0.25; // 25% for major violation
      default:
        return 0.01;
    }
  }

  /**
   * Get validator voting power based on stake and emotional fitness
   */
  getVotingPower(stake: ValidatorStake, emotionalScore: number): number {
    const stakeWeight = 0.7; // 70% from stake
    const emotionalWeight = 0.3; // 30% from emotional fitness
    
    // Normalize stake (assuming max stake of 1M EMO)
    const normalizedStake = Math.min(Number(stake.stakedAmount) / 1000000, 1);
    
    // Normalize emotional score (0-100 -> 0-1)
    const normalizedEmotional = emotionalScore / 100;
    
    return (normalizedStake * stakeWeight) + (normalizedEmotional * emotionalWeight);
  }
}

export const hybridConsensus = new HybridConsensus();
