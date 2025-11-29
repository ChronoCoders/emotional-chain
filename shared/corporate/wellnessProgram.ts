import { EventEmitter } from 'eventemitter3';

/**
 * Corporate Wellness Platform
 * Third use case: Enterprise wellness tracking and team-based rewards
 * Privacy-preserving aggregated analytics for corporate health programs
 */

export interface CorporateProgram {
  programId: string;
  companyId: string;
  companyName: string;
  employeeCount: number;
  goals: {
    targetAvgFitness: number; // 0-100
    participationRate: number; // 0-100%
  };
  rewards: {
    individual: bigint; // EMO per employee per month if meets fitness threshold
    team: bigint; // EMO bonus if team goals met
  };
  isActive: boolean;
  createdAt: number;
}

export interface TeamMetrics {
  programId: string;
  month: number;
  avgFitness: number;
  participationRate: number;
  employeesTracked: number;
  topPerformers: string[]; // Top 10%
  needsSupport: string[]; // Bottom 10%
  goalsMetFitness: boolean;
  goalsMetParticipation: boolean;
}

export interface EmployeeMetric {
  employeeAddress: string;
  month: number;
  avgFitness: number;
  participationDays: number;
  benchmarkPercentile: number; // Where employee ranks vs team
}

export interface RewardDistribution {
  distributionId: string;
  programId: string;
  month: number;
  totalIndividualRewards: bigint;
  totalTeamBonus: bigint;
  employeesRewarded: number;
  teamGoalsMet: boolean;
  timestamp: number;
}

/**
 * Corporate Wellness Manager
 */
export class CorporateWellness extends EventEmitter {
  private programs: Map<string, CorporateProgram> = new Map();
  private teamMetrics: Map<string, TeamMetrics[]> = new Map();
  private employeeMetrics: Map<string, EmployeeMetric[]> = new Map();
  private rewardDistributions: Map<string, RewardDistribution> = new Map();
  private employeeList: Map<string, Set<string>> = new Map(); // companyId -> employee addresses

  // Statistics
  private statistics = {
    totalPrograms: 0,
    totalEmployeesTracked: 0,
    totalRewardsDistributed: BigInt(0),
    totalCompaniesEngaged: 0,
    averageParticipationRate: 0,
  };

  /**
   * Create corporate wellness program
   */
  async createProgram(
    companyId: string,
    companyName: string,
    employeeCount: number,
    targetAvgFitness: number,
    targetParticipationRate: number,
    individualRewardEMO: bigint,
    teamBonusEMO: bigint
  ): Promise<string> {
    const programId = this.generateProgramId();
    const program: CorporateProgram = {
      programId,
      companyId,
      companyName,
      employeeCount,
      goals: {
        targetAvgFitness,
        participationRate: targetParticipationRate,
      },
      rewards: {
        individual: individualRewardEMO,
        team: teamBonusEMO,
      },
      isActive: true,
      createdAt: Date.now(),
    };

    this.programs.set(programId, program);
    this.teamMetrics.set(programId, []);
    this.statistics.totalPrograms++;
    this.statistics.totalCompaniesEngaged++;

    this.emit('programCreated', {
      programId,
      companyId,
      companyName,
      employeeCount,
      targetAvgFitness,
      targetParticipationRate,
    });

    return programId;
  }

  /**
   * Register employees for program
   */
  async registerEmployees(programId: string, employeeAddresses: string[]): Promise<void> {
    const program = this.programs.get(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    if (!this.employeeList.has(programId)) {
      this.employeeList.set(programId, new Set());
    }

    const employees = this.employeeList.get(programId)!;
    employeeAddresses.forEach(addr => employees.add(addr));

    this.statistics.totalEmployeesTracked += employeeAddresses.length;

    this.emit('employeesRegistered', {
      programId,
      count: employeeAddresses.length,
      totalEmployees: employees.size,
    });
  }

  /**
   * Track team health metrics (privacy-preserving aggregated only)
   */
  async trackTeamHealth(programId: string, month: number): Promise<TeamMetrics> {
    const program = this.programs.get(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    const employees = this.employeeList.get(programId);
    if (!employees || employees.size === 0) {
      throw new Error('No employees registered');
    }

    // Get metrics for all employees
    const employeeMetricsArray = Array.from(employees).map(addr => this.getEmployeeMetricForMonth(programId, addr, month));

    // Calculate team aggregates (privacy-preserving)
    const fitnessScores = employeeMetricsArray.map(m => m.avgFitness);
    const avgFitness = fitnessScores.reduce((a, b) => a + b, 0) / fitnessScores.length;

    const participatingEmployees = fitnessScores.filter(s => s > 0).length;
    const participationRate = (participatingEmployees / employees.size) * 100;

    // Identify top and bottom performers (privacy: only percentile, not individual)
    const sortedScores = [...fitnessScores].sort((a, b) => b - a);
    const topThreshold = sortedScores[Math.floor(sortedScores.length * 0.1)];
    const bottomThreshold = sortedScores[Math.floor(sortedScores.length * 0.9)];

    const topPerformers = employeeMetricsArray
      .filter(m => m.avgFitness >= topThreshold)
      .map(m => m.employeeAddress);

    const needsSupport = employeeMetricsArray
      .filter(m => m.avgFitness <= bottomThreshold)
      .map(m => m.employeeAddress);

    const metrics: TeamMetrics = {
      programId,
      month,
      avgFitness,
      participationRate,
      employeesTracked: employees.size,
      topPerformers,
      needsSupport,
      goalsMetFitness: avgFitness >= program.goals.targetAvgFitness,
      goalsMetParticipation: participationRate >= program.goals.participationRate,
    };

    // Record metrics
    const metricsHistory = this.teamMetrics.get(programId)!;
    metricsHistory.push(metrics);

    this.emit('teamMetricsCalculated', {
      programId,
      month,
      avgFitness: Math.round(avgFitness),
      participationRate: Math.round(participationRate),
      goalsMetFitness: metrics.goalsMetFitness,
      goalsMetParticipation: metrics.goalsMetParticipation,
    });

    return metrics;
  }

  /**
   * Distribute monthly rewards
   */
  async distributeMonthlyRewards(programId: string, month: number): Promise<string> {
    const program = this.programs.get(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    const metrics = await this.trackTeamHealth(programId, month);
    const employees = this.employeeList.get(programId);
    if (!employees) {
      throw new Error('No employees registered');
    }

    const distributionId = this.generateDistributionId();
    let totalIndividualRewards = BigInt(0);
    let totalTeamBonus = BigInt(0);
    let employeesRewarded = 0;

    // Individual rewards for employees meeting fitness threshold
    const fitnessThreshold = 75; // Employees with fitness >= 75 get reward
    for (const employeeAddr of employees) {
      const metric = this.getEmployeeMetricForMonth(programId, employeeAddr, month);
      if (metric.avgFitness >= fitnessThreshold) {
        totalIndividualRewards += program.rewards.individual;
        employeesRewarded++;

        this.emit('employeeRewardEarned', {
          employeeAddress: employeeAddr,
          amount: program.rewards.individual.toString(),
          reason: 'fitness_threshold_met',
        });
      }
    }

    // Team bonus if goals met
    if (metrics.goalsMetFitness && metrics.goalsMetParticipation) {
      totalTeamBonus = program.rewards.team;
      const bonusPerEmployee = program.rewards.team / BigInt(employees.size);

      for (const employeeAddr of employees) {
        this.emit('employeeTeamBonusEarned', {
          employeeAddress: employeeAddr,
          amount: bonusPerEmployee.toString(),
          reason: 'team_goals_met',
        });
      }
    }

    const distribution: RewardDistribution = {
      distributionId,
      programId,
      month,
      totalIndividualRewards,
      totalTeamBonus,
      employeesRewarded,
      teamGoalsMet: metrics.goalsMetFitness && metrics.goalsMetParticipation,
      timestamp: Date.now(),
    };

    this.rewardDistributions.set(distributionId, distribution);
    this.statistics.totalRewardsDistributed += totalIndividualRewards + totalTeamBonus;

    this.emit('rewardsDistributed', {
      distributionId,
      programId,
      month,
      totalRewards: (totalIndividualRewards + totalTeamBonus).toString(),
      employeesRewarded,
      teamGoalsMet: distribution.teamGoalsMet,
    });

    return distributionId;
  }

  /**
   * Record employee fitness data
   */
  async recordEmployeeFitness(
    programId: string,
    employeeAddress: string,
    month: number,
    avgFitness: number,
    participationDays: number
  ): Promise<void> {
    if (!this.employeeMetrics.has(employeeAddress)) {
      this.employeeMetrics.set(employeeAddress, []);
    }

    const metrics = this.employeeMetrics.get(employeeAddress)!;
    const existingIndex = metrics.findIndex(m => m.month === month);

    const metric: EmployeeMetric = {
      employeeAddress,
      month,
      avgFitness,
      participationDays,
      benchmarkPercentile: 0, // Will be calculated during team metrics
    };

    if (existingIndex >= 0) {
      metrics[existingIndex] = metric;
    } else {
      metrics.push(metric);
    }
  }

  /**
   * Get program details
   */
  getProgram(programId: string): CorporateProgram | undefined {
    return this.programs.get(programId);
  }

  /**
   * Get team metrics history
   */
  getTeamMetricsHistory(programId: string): TeamMetrics[] {
    return this.teamMetrics.get(programId) || [];
  }

  /**
   * Get corporate wellness statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      totalRewardsDistributed: this.statistics.totalRewardsDistributed.toString(),
    };
  }

  // Private helper methods

  private getEmployeeMetricForMonth(
    programId: string,
    employeeAddress: string,
    month: number
  ): EmployeeMetric {
    const metrics = this.employeeMetrics.get(employeeAddress) || [];
    return (
      metrics.find(m => m.month === month) || {
        employeeAddress,
        month,
        avgFitness: 0,
        participationDays: 0,
        benchmarkPercentile: 0,
      }
    );
  }

  private generateProgramId(): string {
    return `corp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDistributionId(): string {
    return `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default CorporateWellness;
