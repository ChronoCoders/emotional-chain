/**
 * Hierarchical Validator Network
 * 
 * Solves bandwidth and scalability issues by organizing validators into three tiers:
 * - PRIMARY: 21 validators with full consensus participation (high bandwidth)
 * - SECONDARY: 100 validators with checkpoint validation every 10 minutes (medium bandwidth)
 * - LIGHT: Unlimited validators for transaction validation only (low bandwidth)
 */

export enum ValidatorTier {
  PRIMARY = 1,   // Full consensus participation
  SECONDARY = 2, // Checkpoint validation
  LIGHT = 3,     // Transaction validation only
}

export interface TieredValidator {
  address: string;
  tier: ValidatorTier;
  stakedAmount: bigint;
  bandwidth: number; // KB/s
  uptime: number; // percentage
  lastPerformanceCheck: Date;
  consecutiveFailures: number;
}

export interface TierRequirements {
  minBandwidth: number; // KB/s
  minUptime: number; // percentage
  minStake: bigint; // EMO tokens
  requiresBiometric: boolean;
  maxValidators?: number;
}

export const TIER_REQUIREMENTS: Record<ValidatorTier, TierRequirements> = {
  [ValidatorTier.PRIMARY]: {
    minBandwidth: 1000, // 1 Mbps
    minUptime: 99.9,
    minStake: BigInt(50_000),
    requiresBiometric: true,
    maxValidators: 21,
  },
  [ValidatorTier.SECONDARY]: {
    minBandwidth: 100, // 100 Kbps
    minUptime: 95.0,
    minStake: BigInt(20_000),
    requiresBiometric: true,
    maxValidators: 100,
  },
  [ValidatorTier.LIGHT]: {
    minBandwidth: 10, // 10 Kbps
    minUptime: 80.0,
    minStake: BigInt(10_000),
    requiresBiometric: false,
    maxValidators: undefined, // Unlimited
  },
};

export const TIER_REWARDS: Record<ValidatorTier, number> = {
  [ValidatorTier.PRIMARY]: 1.0,    // 100% of base reward
  [ValidatorTier.SECONDARY]: 0.5,  // 50% of base reward
  [ValidatorTier.LIGHT]: 0.1,      // 10% of base reward
};

export class HierarchicalConsensus {
  private validators: Map<string, TieredValidator> = new Map();
  
  /**
   * Get all validators across all tiers
   */
  async getAllValidators(): Promise<TieredValidator[]> {
    return Array.from(this.validators.values());
  }
  
  /**
   * Select primary validators (Tier 1)
   * Requirements:
   * - Minimum 1 Mbps bandwidth
   * - 99.9% uptime
   * - 50,000+ EMO staked
   * - Biometric requirement
   */
  async selectPrimaryValidators(): Promise<TieredValidator[]> {
    const requirements = TIER_REQUIREMENTS[ValidatorTier.PRIMARY];
    const candidates = await this.getAllValidators();
    
    const qualified = candidates.filter(v => 
      v.bandwidth >= requirements.minBandwidth &&
      v.uptime >= requirements.minUptime &&
      v.stakedAmount >= requirements.minStake
    );
    
    // Select top 21 by stake amount
    return qualified
      .sort((a, b) => Number(b.stakedAmount - a.stakedAmount))
      .slice(0, requirements.maxValidators!);
  }
  
  /**
   * Select secondary validators (Tier 2)
   * Requirements:
   * - Minimum 100 Kbps bandwidth
   * - 95% uptime
   * - 20,000+ EMO staked
   * - NOT already in primary tier
   */
  async selectSecondaryValidators(): Promise<TieredValidator[]> {
    const requirements = TIER_REQUIREMENTS[ValidatorTier.SECONDARY];
    const candidates = await this.getAllValidators();
    const primaryValidators = await this.selectPrimaryValidators();
    const primaryAddresses = new Set(primaryValidators.map(v => v.address));
    
    const qualified = candidates.filter(v =>
      !primaryAddresses.has(v.address) &&
      v.bandwidth >= requirements.minBandwidth &&
      v.uptime >= requirements.minUptime &&
      v.stakedAmount >= requirements.minStake
    );
    
    return qualified
      .sort((a, b) => Number(b.stakedAmount - a.stakedAmount))
      .slice(0, requirements.maxValidators!);
  }
  
  /**
   * Register a light validator (Tier 3)
   * Requirements:
   * - Minimum 10 Kbps bandwidth
   * - 10,000 EMO staked
   * - NO biometric requirement
   */
  async registerLightValidator(
    address: string,
    stake: bigint,
    bandwidth: number,
    uptime: number = 80.0
  ): Promise<void> {
    const requirements = TIER_REQUIREMENTS[ValidatorTier.LIGHT];
    
    if (stake < requirements.minStake) {
      throw new Error(`Insufficient stake for light validator. Minimum: ${requirements.minStake} EMO`);
    }
    
    if (bandwidth < requirements.minBandwidth) {
      throw new Error(`Insufficient bandwidth. Minimum: ${requirements.minBandwidth} KB/s`);
    }
    
    const validator: TieredValidator = {
      address,
      tier: ValidatorTier.LIGHT,
      stakedAmount: stake,
      bandwidth,
      uptime,
      lastPerformanceCheck: new Date(),
      consecutiveFailures: 0,
    };
    
    this.validators.set(address, validator);
  }
  
  /**
   * Get bandwidth requirements for each tier
   */
  getBandwidthRequirements(): Record<ValidatorTier, string> {
    return {
      [ValidatorTier.PRIMARY]: '1 Mbps (continuous biometric + consensus)',
      [ValidatorTier.SECONDARY]: '100 Kbps (10-min checkpoints)',
      [ValidatorTier.LIGHT]: '10 Kbps (tx validation only)',
    };
  }
  
  /**
   * Calculate appropriate tier for a validator based on performance
   */
  calculateAppropriateTier(validator: TieredValidator): ValidatorTier {
    const primaryReqs = TIER_REQUIREMENTS[ValidatorTier.PRIMARY];
    const secondaryReqs = TIER_REQUIREMENTS[ValidatorTier.SECONDARY];
    const lightReqs = TIER_REQUIREMENTS[ValidatorTier.LIGHT];
    
    // Check if qualifies for primary tier
    if (
      validator.bandwidth >= primaryReqs.minBandwidth &&
      validator.uptime >= primaryReqs.minUptime &&
      validator.stakedAmount >= primaryReqs.minStake
    ) {
      return ValidatorTier.PRIMARY;
    }
    
    // Check if qualifies for secondary tier
    if (
      validator.bandwidth >= secondaryReqs.minBandwidth &&
      validator.uptime >= secondaryReqs.minUptime &&
      validator.stakedAmount >= secondaryReqs.minStake
    ) {
      return ValidatorTier.SECONDARY;
    }
    
    // Default to light tier
    if (
      validator.bandwidth >= lightReqs.minBandwidth &&
      validator.uptime >= lightReqs.minUptime &&
      validator.stakedAmount >= lightReqs.minStake
    ) {
      return ValidatorTier.LIGHT;
    }
    
    throw new Error('Validator does not meet minimum requirements for any tier');
  }
  
  /**
   * Promote or demote validator based on performance
   */
  async updateValidatorTier(address: string): Promise<{
    oldTier: ValidatorTier;
    newTier: ValidatorTier;
    promoted: boolean;
  }> {
    const validator = this.validators.get(address);
    if (!validator) {
      throw new Error(`Validator not found: ${address}`);
    }
    
    const oldTier = validator.tier;
    const newTier = this.calculateAppropriateTier(validator);
    
    if (newTier !== oldTier) {
      validator.tier = newTier;
      validator.lastPerformanceCheck = new Date();
      this.validators.set(address, validator);
    }
    
    return {
      oldTier,
      newTier,
      promoted: newTier < oldTier, // Lower tier number = higher tier
    };
  }
  
  /**
   * Get reward multiplier for a validator based on tier
   */
  getRewardMultiplier(tier: ValidatorTier): number {
    return TIER_REWARDS[tier];
  }
  
  /**
   * Get validators by tier
   */
  async getValidatorsByTier(tier: ValidatorTier): Promise<TieredValidator[]> {
    const all = await this.getAllValidators();
    return all.filter(v => v.tier === tier);
  }
  
  /**
   * Get tier statistics
   */
  async getTierStats(): Promise<{
    tier: ValidatorTier;
    count: number;
    totalStake: bigint;
    avgBandwidth: number;
    avgUptime: number;
  }[]> {
    const stats: Map<ValidatorTier, {
      count: number;
      totalStake: bigint;
      totalBandwidth: number;
      totalUptime: number;
    }> = new Map();
    
    // Initialize stats for all tiers
    [ValidatorTier.PRIMARY, ValidatorTier.SECONDARY, ValidatorTier.LIGHT].forEach(tier => {
      stats.set(tier, {
        count: 0,
        totalStake: BigInt(0),
        totalBandwidth: 0,
        totalUptime: 0,
      });
    });
    
    // Calculate stats
    const validators = await this.getAllValidators();
    validators.forEach(v => {
      const stat = stats.get(v.tier)!;
      stat.count++;
      stat.totalStake += v.stakedAmount;
      stat.totalBandwidth += v.bandwidth;
      stat.totalUptime += v.uptime;
    });
    
    // Return formatted stats
    return Array.from(stats.entries()).map(([tier, stat]) => ({
      tier,
      count: stat.count,
      totalStake: stat.totalStake,
      avgBandwidth: stat.count > 0 ? stat.totalBandwidth / stat.count : 0,
      avgUptime: stat.count > 0 ? stat.totalUptime / stat.count : 0,
    }));
  }
  
  /**
   * Check if validator needs tier reassessment
   */
  needsReassessment(validator: TieredValidator, intervalHours: number = 24): boolean {
    const now = new Date();
    const hoursSinceCheck = (now.getTime() - validator.lastPerformanceCheck.getTime()) / (1000 * 60 * 60);
    return hoursSinceCheck >= intervalHours;
  }
  
  /**
   * Batch reassess all validators
   */
  async reassessAllValidators(): Promise<{
    promoted: number;
    demoted: number;
    unchanged: number;
  }> {
    const validators = await this.getAllValidators();
    let promoted = 0;
    let demoted = 0;
    let unchanged = 0;
    
    for (const validator of validators) {
      if (this.needsReassessment(validator)) {
        const result = await this.updateValidatorTier(validator.address);
        if (result.promoted) {
          promoted++;
        } else if (result.oldTier !== result.newTier) {
          demoted++;
        } else {
          unchanged++;
        }
      }
    }
    
    return { promoted, demoted, unchanged };
  }
}

// Singleton instance
export const hierarchicalConsensus = new HierarchicalConsensus();
