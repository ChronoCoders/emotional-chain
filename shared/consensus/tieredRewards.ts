/**
 * Tiered Rewards Calculator
 * 
 * Demonstrates how validator tier affects block rewards in production.
 * This is a research/demonstration implementation showing the architecture.
 */

import { TIER_REWARDS, ValidatorTier } from './hierarchicalValidators';
import { calculateBlockReward } from '@shared/tokenomics/emissionSchedule';

export interface TieredRewardCalculation {
  baseReward: number;
  tierMultiplier: number;
  finalReward: number;
  tier: ValidatorTier;
  validatorId: string;
}

/**
 * Calculate reward for a validator based on their tier
 * 
 * In production, this would be called by the consensus engine
 * to determine actual block rewards.
 */
export function calculateTieredReward(
  validatorId: string,
  tier: ValidatorTier,
  blockHeight: number,
  emotionalScore: number = 1.0 // 0.0 to 1.0
): TieredRewardCalculation {
  // Get base reward from emission schedule
  const baseReward = calculateBlockReward(blockHeight);
  
  // Get tier multiplier
  const tierMultiplier = TIER_REWARDS[tier];
  
  // Calculate final reward: base * tier * emotional score
  const finalReward = baseReward * tierMultiplier * emotionalScore;
  
  return {
    baseReward,
    tierMultiplier,
    finalReward,
    tier,
    validatorId,
  };
}

/**
 * Get tier name as string
 */
export function getTierName(tier: ValidatorTier): string {
  return {
    [ValidatorTier.PRIMARY]: 'PRIMARY',
    [ValidatorTier.SECONDARY]: 'SECONDARY',
    [ValidatorTier.LIGHT]: 'LIGHT',
  }[tier];
}

/**
 * Example: Calculate rewards for all tiers at current block height
 */
export function demonstrateTierRewards(blockHeight: number): {
  primary: TieredRewardCalculation;
  secondary: TieredRewardCalculation;
  light: TieredRewardCalculation;
} {
  return {
    primary: calculateTieredReward('PrimaryValidator', ValidatorTier.PRIMARY, blockHeight),
    secondary: calculateTieredReward('SecondaryValidator', ValidatorTier.SECONDARY, blockHeight),
    light: calculateTieredReward('LightValidator', ValidatorTier.LIGHT, blockHeight),
  };
}

/**
 * Production Integration Notes:
 * 
 * To fully integrate tier-based rewards:
 * 
 * 1. Update consensus/RewardCalculator.ts:
 *    - Replace hardcoded reward calculation
 *    - Call calculateTieredReward() instead
 *    - Pass validator tier from hierarchicalConsensus
 * 
 * 2. Update validator registration:
 *    - When validators stake, determine initial tier
 *    - Store tier in validator record
 *    - Update tier during performance reassessment
 * 
 * 3. Update block mining:
 *    - Select validators based on tier (primary validators only for consensus)
 *    - Secondary validators receive checkpoints every 10 minutes
 *    - Light validators validate transactions only
 * 
 * 4. Update P2P propagation:
 *    - Use OptimizedP2PNetwork.propagateBlock()
 *    - Send full blocks to primary validators
 *    - Send headers only to secondary validators
 *    - Send transaction hashes to light validators
 */
