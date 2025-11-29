import { EventEmitter } from 'eventemitter3';

/**
 * Wellness Insurance Integration
 * Second use case: Programmable insurance with emotional fitness-based premiums
 * Incentivizes users to maintain wellness through dynamic premium adjustments
 */

export interface InsurancePolicy {
  policyId: string;
  policyHolder: string;
  baseMonthlyPremiumUSD: bigint;
  discountTiers: DiscountTier;
  verificationFrequency: 'weekly' | 'monthly';
  isActive: boolean;
  createdAt: number;
  lastPremiumChargedMonth: number;
}

export interface DiscountTier {
  bronze: { minFitness: number; discount: number }; // 5% off
  silver: { minFitness: number; discount: number }; // 10% off
  gold: { minFitness: number; discount: number }; // 15% off
}

export interface PremiumAdjustment {
  policyId: string;
  month: number;
  averageFitness: number;
  appliedDiscount: number;
  baseAmount: bigint;
  discountAmount: bigint;
  finalPremium: bigint;
  timestamp: number;
}

export interface PolicyClaim {
  claimId: string;
  policyId: string;
  claimType: 'wellness_benefit' | 'emergency' | 'dispute';
  amount: bigint;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  timestamp: number;
}

/**
 * Wellness Insurance Manager
 */
export class WellnessInsurance extends EventEmitter {
  private policies: Map<string, InsurancePolicy> = new Map();
  private premiumHistory: Map<string, PremiumAdjustment[]> = new Map();
  private claims: Map<string, PolicyClaim> = new Map();
  private fitnessSnapshots: Map<string, { month: number; avgFitness: number }[]> = new Map();

  // Statistics
  private statistics = {
    totalPolicies: 0,
    activePolicies: 0,
    totalPremiumsCollected: BigInt(0),
    totalDiscountsGiven: BigInt(0),
    totalClaimsPaid: BigInt(0),
    averageDiscountRate: 0,
  };

  /**
   * Create insurance policy
   */
  async createPolicy(
    policyHolder: string,
    baseMonthlyPremiumUSD: bigint,
    verificationFrequency: 'weekly' | 'monthly' = 'monthly'
  ): Promise<string> {
    if (baseMonthlyPremiumUSD <= BigInt(0)) {
      throw new Error('Premium must be greater than 0');
    }

    const policyId = this.generatePolicyId();
    const policy: InsurancePolicy = {
      policyId,
      policyHolder,
      baseMonthlyPremiumUSD,
      discountTiers: {
        bronze: { minFitness: 70, discount: 5 },
        silver: { minFitness: 80, discount: 10 },
        gold: { minFitness: 90, discount: 15 },
      },
      verificationFrequency,
      isActive: true,
      createdAt: Date.now(),
      lastPremiumChargedMonth: 0,
    };

    this.policies.set(policyId, policy);
    this.premiumHistory.set(policyId, []);
    this.statistics.totalPolicies++;
    this.statistics.activePolicies++;

    this.emit('policyCreated', {
      policyId,
      policyHolder,
      baseMonthlyPremium: baseMonthlyPremiumUSD.toString(),
      verificationFrequency,
    });

    return policyId;
  }

  /**
   * Calculate premium for a given month based on fitness
   */
  async calculatePremium(policyId: string, month: number): Promise<PremiumAdjustment> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    // Get average fitness for the month
    const avgFitness = await this.getAverageFitnessForMonth(policyId, month);

    // Determine discount tier
    let appliedDiscount = 0;
    if (avgFitness >= policy.discountTiers.gold.minFitness) {
      appliedDiscount = policy.discountTiers.gold.discount;
    } else if (avgFitness >= policy.discountTiers.silver.minFitness) {
      appliedDiscount = policy.discountTiers.silver.discount;
    } else if (avgFitness >= policy.discountTiers.bronze.minFitness) {
      appliedDiscount = policy.discountTiers.bronze.discount;
    }

    // Calculate discounted premium
    const discountAmount =
      (policy.baseMonthlyPremiumUSD * BigInt(appliedDiscount)) / BigInt(100);
    const finalPremium = policy.baseMonthlyPremiumUSD - discountAmount;

    const adjustment: PremiumAdjustment = {
      policyId,
      month,
      averageFitness: avgFitness,
      appliedDiscount,
      baseAmount: policy.baseMonthlyPremiumUSD,
      discountAmount,
      finalPremium,
      timestamp: Date.now(),
    };

    // Record premium adjustment
    const history = this.premiumHistory.get(policyId)!;
    history.push(adjustment);

    this.statistics.totalPremiumsCollected += finalPremium;
    this.statistics.totalDiscountsGiven += discountAmount;

    this.emit('premiumCalculated', {
      policyId,
      month,
      avgFitness,
      discount: appliedDiscount,
      finalPremium: finalPremium.toString(),
    });

    return adjustment;
  }

  /**
   * Record fitness data for a month
   */
  async recordMonthlyFitness(policyId: string, month: number, avgFitness: number): Promise<void> {
    if (!this.fitnessSnapshots.has(policyId)) {
      this.fitnessSnapshots.set(policyId, []);
    }

    const snapshots = this.fitnessSnapshots.get(policyId)!;
    
    // Replace existing month or add new
    const existingIndex = snapshots.findIndex(s => s.month === month);
    if (existingIndex >= 0) {
      snapshots[existingIndex].avgFitness = avgFitness;
    } else {
      snapshots.push({ month, avgFitness });
    }
  }

  /**
   * Submit insurance claim
   */
  async submitClaim(
    policyId: string,
    claimType: 'wellness_benefit' | 'emergency' | 'dispute',
    amount: bigint,
    description: string
  ): Promise<string> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    const claimId = this.generateClaimId();
    const claim: PolicyClaim = {
      claimId,
      policyId,
      claimType,
      amount,
      description,
      status: 'pending',
      timestamp: Date.now(),
    };

    this.claims.set(claimId, claim);

    this.emit('claimSubmitted', {
      claimId,
      policyId,
      claimType,
      amount: amount.toString(),
      status: 'pending',
    });

    return claimId;
  }

  /**
   * Approve and pay claim
   */
  async approveClaim(claimId: string): Promise<void> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    if (claim.status !== 'pending') {
      throw new Error('Claim is not in pending status');
    }

    claim.status = 'approved';
    this.statistics.totalClaimsPaid += claim.amount;

    this.emit('claimApproved', {
      claimId,
      amount: claim.amount.toString(),
      policyId: claim.policyId,
    });
  }

  /**
   * Get policy details
   */
  getPolicy(policyId: string): InsurancePolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get premium history
   */
  getPremiumHistory(policyId: string): PremiumAdjustment[] {
    return this.premiumHistory.get(policyId) || [];
  }

  /**
   * Get insurance statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      totalPremiumsCollected: this.statistics.totalPremiumsCollected.toString(),
      totalDiscountsGiven: this.statistics.totalDiscountsGiven.toString(),
      totalClaimsPaid: this.statistics.totalClaimsPaid.toString(),
    };
  }

  // Private helper methods

  private async getAverageFitnessForMonth(policyId: string, month: number): Promise<number> {
    const snapshots = this.fitnessSnapshots.get(policyId);
    if (!snapshots) {
      return 0;
    }

    const monthSnapshot = snapshots.find(s => s.month === month);
    return monthSnapshot ? monthSnapshot.avgFitness : 0;
  }

  private generatePolicyId(): string {
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateClaimId(): string {
    return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default WellnessInsurance;
