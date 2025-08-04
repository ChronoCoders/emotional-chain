/**
 * Voluntary Staking Service for EmotionalChain
 * Provides optional staking with bonus rewards for validators
 */

export class VoluntaryStakingService {
  private static instance: VoluntaryStakingService;
  private validatorStakes = new Map<string, number>(); // validatorId -> staked amount
  
  public static getInstance(): VoluntaryStakingService {
    if (!VoluntaryStakingService.instance) {
      VoluntaryStakingService.instance = new VoluntaryStakingService();
    }
    return VoluntaryStakingService.instance;
  }

  /**
   * Stake EMO tokens voluntarily for bonus rewards
   */
  public async stakeTokens(validatorId: string, amount: number): Promise<boolean> {
    if (amount <= 0) return false;
    
    // TODO: Implement with real wallet balance checking
    // For now, just track staking amounts
    const currentStake = this.validatorStakes.get(validatorId) || 0;
    this.validatorStakes.set(validatorId, currentStake + amount);
    
    console.log(`VOLUNTARY STAKING: ${validatorId} staked ${amount} EMO (total: ${currentStake + amount} EMO)`);
    return true;
  }

  /**
   * Unstake EMO tokens back to liquid wallet
   */
  public async unstakeTokens(validatorId: string, amount: number): Promise<boolean> {
    const currentStake = this.validatorStakes.get(validatorId) || 0;
    if (amount <= 0 || amount > currentStake) return false;
    
    this.validatorStakes.set(validatorId, currentStake - amount);
    
    console.log(`VOLUNTARY UNSTAKING: ${validatorId} unstaked ${amount} EMO (remaining: ${currentStake - amount} EMO)`);
    return true;
  }

  /**
   * Get staking information for a validator
   */
  public getStakingInfo(validatorId: string) {
    const stakedAmount = this.validatorStakes.get(validatorId) || 0;
    return {
      validatorId,
      stakedAmount,
      bonusAPY: "15%",
      stakingType: "voluntary",
      canUnstake: true,
      minStakeAmount: 100, // Minimum 100 EMO to stake
      estimatedBonusPerDay: stakedAmount * 0.15 / 365 // 15% APY calculation
    };
  }

  /**
   * Get total voluntary staking across all validators
   */
  public getTotalVoluntaryStaking(): { totalStaked: number, stakingValidators: number } {
    let totalStaked = 0;
    let stakingValidators = 0;
    
    for (const [validatorId, amount] of this.validatorStakes.entries()) {
      if (amount > 0) {
        totalStaked += amount;
        stakingValidators++;
      }
    }
    
    return { totalStaked, stakingValidators };
  }
}

export const voluntaryStakingService = VoluntaryStakingService.getInstance();