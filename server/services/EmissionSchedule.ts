/**
 * EmotionalChain Emission Schedule Calculator
 * Implements sustainable tokenomics with halving-like mechanism
 */

export interface EmissionScheduleConfig {
  maxSupply: number;
  genesisReward: number;
  halvingEpochBlocks: number;
  decayFactor: number;
  minBlockReward: number;
}

export interface EmissionMetrics {
  currentReward: number;
  currentEpoch: number;
  nextHalvingBlock: number;
  blocksUntilHalving: number;
  projectedYearsToCompletion: number;
  annualInflationRate: number;
  currentSupplyPercentage: number;
}

export interface ProjectionDataPoint {
  blockHeight: number;
  year: number;
  totalSupply: number;
  blockReward: number;
  annualInflation: number;
  epoch: number;
}

export class EmissionSchedule {
  private config: EmissionScheduleConfig;

  constructor(config: Partial<EmissionScheduleConfig> = {}) {
    // Default configuration
    this.config = {
      maxSupply: config.maxSupply || 1_000_000_000, // 1 billion EMO
      genesisReward: config.genesisReward || 70, // Starting reward
      halvingEpochBlocks: config.halvingEpochBlocks || 3_153_600, // ~1 year at 10s blocks
      decayFactor: config.decayFactor || 0.5, // 50% reduction per epoch (like Bitcoin)
      minBlockReward: config.minBlockReward || 0.01 // Minimum reward (tail emission)
    };
  }

  /**
   * Calculate current epoch based on block height
   */
  public getEpoch(blockHeight: number): number {
    return Math.floor(blockHeight / this.config.halvingEpochBlocks);
  }

  /**
   * Calculate block reward based on current supply and epoch
   * Uses exponential decay: reward = genesisReward * (decayFactor ^ epoch)
   * Plus supply-based reduction to ensure we never exceed max supply
   */
  public calculateBlockReward(currentSupply: number, blockHeight: number): number {
    // Ensure we never exceed max supply
    if (currentSupply >= this.config.maxSupply) {
      return 0;
    }

    const epoch = this.getEpoch(blockHeight);
    
    // Exponential decay (halving-like)
    let reward = this.config.genesisReward * Math.pow(this.config.decayFactor, epoch);
    
    // Supply-based reduction as we approach cap
    const supplyRatio = currentSupply / this.config.maxSupply;
    const supplyMultiplier = Math.pow(1 - supplyRatio, 2); // Quadratic reduction
    reward = reward * supplyMultiplier;
    
    // Enforce minimum (tail emission for long-term security)
    reward = Math.max(reward, this.config.minBlockReward);
    
    // Final cap enforcement: ensure this reward doesn't push us over
    const remainingSupply = this.config.maxSupply - currentSupply;
    reward = Math.min(reward, remainingSupply);
    
    return Math.max(0, reward);
  }

  /**
   * Calculate validation reward (percentage of block reward)
   */
  public calculateValidationReward(blockReward: number, emotionalScore: number): number {
    // Validation reward is 5-10% of block reward based on emotional fitness
    const basePercentage = 0.05; // 5%
    const emotionalBonus = (emotionalScore / 100) * 0.05; // Up to +5% for perfect score
    const validationPercentage = basePercentage + emotionalBonus;
    
    return blockReward * validationPercentage;
  }

  /**
   * Get current emission metrics
   */
  public getEmissionMetrics(currentSupply: number, blockHeight: number): EmissionMetrics {
    const currentEpoch = this.getEpoch(blockHeight);
    const blocksIntoEpoch = blockHeight % this.config.halvingEpochBlocks;
    const nextHalvingBlock = (currentEpoch + 1) * this.config.halvingEpochBlocks;
    const blocksUntilHalving = nextHalvingBlock - blockHeight;
    
    const currentReward = this.calculateBlockReward(currentSupply, blockHeight);
    
    // Calculate projected completion time
    const remainingSupply = this.config.maxSupply - currentSupply;
    const blocksPerDay = 8640; // 10s block time
    const avgRewardPerDay = currentReward * blocksPerDay;
    const daysToCompletion = remainingSupply / avgRewardPerDay;
    const projectedYearsToCompletion = daysToCompletion / 365;
    
    // Annual inflation rate
    const annualIssuance = currentReward * blocksPerDay * 365;
    const annualInflationRate = currentSupply > 0 ? (annualIssuance / currentSupply) * 100 : 0;
    
    return {
      currentReward,
      currentEpoch,
      nextHalvingBlock,
      blocksUntilHalving,
      projectedYearsToCompletion,
      annualInflationRate,
      currentSupplyPercentage: (currentSupply / this.config.maxSupply) * 100
    };
  }

  /**
   * Generate emission projection data for charting
   */
  public generateProjection(currentSupply: number, currentBlock: number, yearsToProject: number = 20): ProjectionDataPoint[] {
    const dataPoints: ProjectionDataPoint[] = [];
    const blocksPerYear = 3_153_600; // ~365.25 days at 10s blocks
    const blocksToProject = yearsToProject * blocksPerYear;
    // ✅ SECURITY FIX: Prevent infinite loop by ensuring minimum sampling interval of 1
    const samplingInterval = Math.max(1, Math.floor(blocksToProject / 100)); // 100 data points
    
    let supply = currentSupply;
    let block = currentBlock;
    
    for (let i = 0; i <= blocksToProject; i += samplingInterval) {
      const projectedBlock = block + i;
      const epoch = this.getEpoch(projectedBlock);
      const blockReward = this.calculateBlockReward(supply, projectedBlock);
      
      // Calculate supply increase over sampling interval
      const blocksInInterval = Math.min(samplingInterval, blocksToProject - i);
      const supplyIncrease = blockReward * blocksInInterval;
      supply = Math.min(supply + supplyIncrease, this.config.maxSupply);
      
      // Annual inflation rate
      const annualIssuance = blockReward * blocksPerYear;
      const annualInflation = supply > 0 ? (annualIssuance / supply) * 100 : 0;
      
      dataPoints.push({
        blockHeight: projectedBlock,
        year: currentBlock > 0 ? (i / blocksPerYear) : (projectedBlock / blocksPerYear),
        totalSupply: supply,
        blockReward: blockReward,
        annualInflation: annualInflation,
        epoch: epoch
      });
      
      // Stop if we hit max supply
      if (supply >= this.config.maxSupply) {
        break;
      }
    }
    
    return dataPoints;
  }

  /**
   * Calculate years until max supply at current rate
   */
  public yearsUntilMaxSupply(currentSupply: number, blockHeight: number): number {
    const projection = this.generateProjection(currentSupply, blockHeight, 50);
    const maxSupplyPoint = projection.find(p => p.totalSupply >= this.config.maxSupply);
    
    if (!maxSupplyPoint) {
      return 50; // Beyond 50 year projection
    }
    
    return maxSupplyPoint.year;
  }

  /**
   * Get halving schedule information
   */
  public getHalvingSchedule(): { epoch: number; blockHeight: number; reward: number }[] {
    const schedule = [];
    
    for (let epoch = 0; epoch <= 10; epoch++) {
      const blockHeight = epoch * this.config.halvingEpochBlocks;
      const reward = this.config.genesisReward * Math.pow(this.config.decayFactor, epoch);
      
      if (reward < this.config.minBlockReward) break;
      
      schedule.push({
        epoch,
        blockHeight,
        reward: Math.max(reward, this.config.minBlockReward)
      });
    }
    
    return schedule;
  }
}

// Export singleton instance
export const emissionSchedule = new EmissionSchedule({
  maxSupply: 1_000_000_000,
  genesisReward: 70,
  halvingEpochBlocks: 3_153_600, // 1 year
  decayFactor: 0.5,
  minBlockReward: 0.01
});
