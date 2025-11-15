/**
 * EmotionalChain Token Economics
 * Realistic emission schedule with halving mechanism and validator ROI calculations
 */

export const TOKENOMICS = {
  totalSupply: 100_000_000, // 100M EMO
  
  distribution: {
    validatorRewards: 50_000_000, // 50% over 10 years
    ecosystem: 30_000_000,        // 30% for grants/development
    team: 15_000_000,             // 15% with 4-year vesting
    investors: 5_000_000,         // 5% with 4-year vesting
  },
  
  blockReward: {
    initial: 50, // EMO per block
    halvingInterval: 2_100_000, // ~2 years at 30s blocks
    minimumReward: 1,
  },
  
  stakingRequirements: {
    minimumStake: 10_000, // EMO
    lockPeriod: 30 * 24 * 60 * 60, // 30 days in seconds
  },
};

export interface ValidatorROI {
  dailyReward: number;
  monthlyReward: number;
  breakEvenMonths: number;
  annualROI: number;
}

export class EmissionSchedule {
  /**
   * Calculate block reward with halving mechanism
   * Reward halves every 2.1M blocks (~2 years)
   */
  calculateBlockReward(blockHeight: number): number {
    let reward = TOKENOMICS.blockReward.initial;
    const halvings = Math.floor(blockHeight / TOKENOMICS.blockReward.halvingInterval);
    
    for (let i = 0; i < halvings; i++) {
      reward = reward / 2;
    }
    
    return Math.max(reward, TOKENOMICS.blockReward.minimumReward);
  }
  
  /**
   * Calculate total supply at a given block height
   */
  calculateTotalSupply(blockHeight: number): number {
    let totalMinted = 0;
    let currentBlock = 0;
    
    while (currentBlock < blockHeight) {
      const blocksInEra = Math.min(
        TOKENOMICS.blockReward.halvingInterval,
        blockHeight - currentBlock
      );
      const rewardInEra = this.calculateBlockReward(currentBlock);
      totalMinted += blocksInEra * rewardInEra;
      currentBlock += blocksInEra;
    }
    
    return totalMinted;
  }
  
  /**
   * Validator ROI calculation
   * Helps validators understand profitability based on current emission schedule
   * 
   * @param blockHeight Current block height (determines reward via halving)
   * @param stakedAmount Amount of EMO staked by validator
   * @param deviceCost Initial biometric device cost (USD)
   * @param monthlyCost Monthly operating cost (USD)
   * @param tokenPrice Current EMO token price (USD)
   * @param validatorCount Number of active validators (default: 21)
   * @returns ROI projections
   */
  calculateValidatorROI(
    blockHeight: number,
    stakedAmount: number,
    deviceCost: number,
    monthlyCost: number,
    tokenPrice: number,
    validatorCount: number = 21
  ): ValidatorROI {
    // Get current block reward based on halving schedule
    const currentBlockReward = this.calculateBlockReward(blockHeight);
    
    const blocksPerDay = (24 * 60 * 60) / 30; // 2,880 blocks
    const blocksPerValidator = blocksPerDay / validatorCount; // ~137 blocks/day
    
    // Use actual emission schedule reward (not hardcoded)
    const dailyReward = blocksPerValidator * currentBlockReward;
    const monthlyReward = dailyReward * 30;
    const monthlyValue = monthlyReward * tokenPrice;
    
    const initialInvestment = stakedAmount * tokenPrice + deviceCost;
    
    // Handle case where monthly costs exceed revenue
    const monthlyProfit = monthlyValue - monthlyCost;
    const breakEvenMonths = monthlyProfit > 0
      ? initialInvestment / monthlyProfit
      : Infinity; // Never breaks even if costs exceed revenue
    
    const annualRevenue = monthlyValue * 12;
    const annualCost = monthlyCost * 12;
    const annualProfit = annualRevenue - annualCost;
    const annualROI = initialInvestment > 0
      ? (annualProfit / initialInvestment) * 100
      : 0;
    
    return {
      dailyReward,
      monthlyReward,
      breakEvenMonths,
      annualROI,
    };
  }
  
  /**
   * Calculate vesting amount for team/investors
   * Linear vesting over 4 years with 1-year cliff
   */
  calculateVestedAmount(
    totalAllocation: number,
    startTimestamp: number,
    currentTimestamp: number
  ): number {
    const CLIFF_PERIOD = 365 * 24 * 60 * 60; // 1 year in seconds
    const VESTING_PERIOD = 4 * 365 * 24 * 60 * 60; // 4 years in seconds
    
    const elapsed = currentTimestamp - startTimestamp;
    
    // Before cliff - no vesting
    if (elapsed < CLIFF_PERIOD) {
      return 0;
    }
    
    // After full vesting period - 100%
    if (elapsed >= VESTING_PERIOD) {
      return totalAllocation;
    }
    
    // Linear vesting between cliff and full period
    return (totalAllocation * elapsed) / VESTING_PERIOD;
  }
  
  /**
   * Check if unlock period has passed for staked tokens
   */
  canUnstake(stakingTimestamp: number, currentTimestamp: number): boolean {
    const elapsed = currentTimestamp - stakingTimestamp;
    return elapsed >= TOKENOMICS.stakingRequirements.lockPeriod;
  }
  
  /**
   * Calculate remaining lock time in seconds
   */
  getRemainingLockTime(stakingTimestamp: number, currentTimestamp: number): number {
    const elapsed = currentTimestamp - stakingTimestamp;
    const remaining = TOKENOMICS.stakingRequirements.lockPeriod - elapsed;
    return Math.max(0, remaining);
  }
}

// Singleton instance
export const emissionSchedule = new EmissionSchedule();
