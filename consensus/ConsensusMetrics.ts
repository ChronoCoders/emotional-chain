import { EventEmitter } from 'eventemitter3';
import * as _ from 'lodash';
/**
 * Real-time consensus performance monitoring and analytics
 * Tracks validator participation, emotional scores, and network health
 */
export interface EpochMetrics {
  epochNumber: number;
  duration: number;
  participantCount: number;
  emotionalAverage: number;
  byzantineFailures: number;
  consensusStrength: number;
  networkHealth: number;
  timestamp: number;
}
export interface ValidatorMetrics {
  validatorId: string;
  participationRate: number;
  averageEmotionalScore: number;
  reputationScore: number;
  blocksProposed: number;
  blocksValidated: number;
  rewards: number;
  penalties: number;
  lastActive: number;
}
export interface NetworkMetrics {
  totalValidators: number;
  activeValidators: number;
  averageEmotionalScore: number;
  consensusStrength: number;
  participationRate: number;
  networkHealth: number;
  throughput: number; // TPS
  latency: number; // ms
  uptime: number; // percentage
}
export class ConsensusMetrics extends EventEmitter {
  private epochHistory: EpochMetrics[] = [];
  private validatorMetrics = new Map<string, ValidatorMetrics>();
  private networkHistory: NetworkMetrics[] = [];
  // Real-time metrics
  private currentNetworkHealth = 100;
  private currentConsensusStrength = 0;
  private currentParticipationRate = 0;
  private currentValidatorCount = 0;
  // Performance tracking
  private throughputSamples: number[] = [];
  private latencySamples: number[] = [];
  private uptimeStart = Date.now();
  private totalDowntime = 0;
  constructor() {
    super();
    this.startMetricsCollection();
  }
  async initialize(): Promise<void> {
    // Load historical metrics if available
    await this.loadHistoricalMetrics();
  }
  // Epoch metrics recording
  async recordEpoch(metrics: EpochMetrics): Promise<void> {
    this.epochHistory.push(metrics);
    // Keep only recent history (last 1000 epochs)
    if (this.epochHistory.length > 1000) {
      this.epochHistory = this.epochHistory.slice(-1000);
    }
    // Update derived metrics
    this.updateNetworkMetrics();
    this.emit('epoch-recorded', metrics);
  }
  // Individual metric recording
  recordNetworkHealth(health: number): void {
    this.currentNetworkHealth = health;
    this.emit('network-health-updated', health);
  }
  recordConsensusStrength(strength: number): void {
    this.currentConsensusStrength = strength;
    this.emit('consensus-strength-updated', strength);
  }
  recordParticipationRate(rate: number): void {
    this.currentParticipationRate = rate;
    this.emit('participation-rate-updated', rate);
  }
  recordValidatorCount(count: number): void {
    this.currentValidatorCount = count;
    this.emit('validator-count-updated', count);
  }
  recordThroughput(tps: number): void {
    this.throughputSamples.push(tps);
    // Keep only recent samples (last 100)
    if (this.throughputSamples.length > 100) {
      this.throughputSamples = this.throughputSamples.slice(-100);
    }
    this.emit('throughput-updated', tps);
  }
  recordLatency(latency: number): void {
    this.latencySamples.push(latency);
    // Keep only recent samples (last 100)
    if (this.latencySamples.length > 100) {
      this.latencySamples = this.latencySamples.slice(-100);
    }
    this.emit('latency-updated', latency);
  }
  recordDowntime(duration: number): void {
    this.totalDowntime += duration;
    this.emit('downtime-recorded', duration);
  }
  // Validator metrics management
  updateValidatorMetrics(validatorId: string, updates: Partial<ValidatorMetrics>): void {
    const existing = this.validatorMetrics.get(validatorId) || {
      validatorId,
      participationRate: 0,
      averageEmotionalScore: 0,
      reputationScore: 100,
      blocksProposed: 0,
      blocksValidated: 0,
      rewards: 0,
      penalties: 0,
      lastActive: Date.now()
    };
    const updated = { ...existing, ...updates };
    this.validatorMetrics.set(validatorId, updated);
    this.emit('validator-metrics-updated', { validatorId, metrics: updated });
  }
  // Analytics and calculations
  private updateNetworkMetrics(): void {
    const recentEpochs = this.epochHistory.slice(-10); // Last 10 epochs
    if (recentEpochs.length === 0) return;
    const networkMetrics: NetworkMetrics = {
      totalValidators: this.currentValidatorCount,
      activeValidators: Math.round(_.meanBy(recentEpochs, 'participantCount')),
      averageEmotionalScore: _.meanBy(recentEpochs, 'emotionalAverage'),
      consensusStrength: _.meanBy(recentEpochs, 'consensusStrength'),
      participationRate: this.currentParticipationRate,
      networkHealth: this.currentNetworkHealth,
      throughput: this.calculateAverageThroughput(),
      latency: this.calculateAverageLatency(),
      uptime: this.calculateUptime()
    };
    this.networkHistory.push(networkMetrics);
    // Keep only recent network history (last 100 samples)
    if (this.networkHistory.length > 100) {
      this.networkHistory = this.networkHistory.slice(-100);
    }
    this.emit('network-metrics-updated', networkMetrics);
  }
  private calculateAverageThroughput(): number {
    if (this.throughputSamples.length === 0) return 0;
    return _.mean(this.throughputSamples);
  }
  private calculateAverageLatency(): number {
    if (this.latencySamples.length === 0) return 0;
    return _.mean(this.latencySamples);
  }
  private calculateUptime(): number {
    const totalTime = Date.now() - this.uptimeStart;
    const uptimeMs = totalTime - this.totalDowntime;
    return (uptimeMs / totalTime) * 100;
  }
  // Performance analytics
  getPerformanceAnalytics(): {
    avgEpochDuration: number;
    avgParticipation: number;
    avgEmotionalScore: number;
    consensusSuccess: number;
    networkStability: number;
    timeToFinality: number;
  } {
    const recentEpochs = this.epochHistory.slice(-50); // Last 50 epochs
    if (recentEpochs.length === 0) {
      return {
        avgEpochDuration: 0,
        avgParticipation: 0,
        avgEmotionalScore: 0,
        consensusSuccess: 0,
        networkStability: 0,
        timeToFinality: 0
      };
    }
    const avgEpochDuration = _.meanBy(recentEpochs, 'duration');
    const avgParticipation = _.meanBy(recentEpochs, 'participantCount');
    const avgEmotionalScore = _.meanBy(recentEpochs, 'emotionalAverage');
    // Success rate based on consensus strength
    const successfulEpochs = recentEpochs.filter(e => e.consensusStrength >= 67);
    const consensusSuccess = (successfulEpochs.length / recentEpochs.length) * 100;
    // Network stability based on variance in metrics
    const participationVariance = this.calculateVariance(recentEpochs.map(e => e.participantCount));
    const networkStability = Math.max(0, 100 - (participationVariance * 10));
    // Time to finality (epoch duration as proxy)
    const timeToFinality = avgEpochDuration;
    return {
      avgEpochDuration,
      avgParticipation,
      avgEmotionalScore,
      consensusSuccess,
      networkStability,
      timeToFinality
    };
  }
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = _.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return _.mean(squaredDiffs);
  }
  // Trend analysis
  analyzeTrends(): {
    emotionalTrend: 'improving' | 'stable' | 'declining';
    participationTrend: 'improving' | 'stable' | 'declining';
    performanceTrend: 'improving' | 'stable' | 'declining';
    trendStrength: number;
  } {
    const recentEpochs = this.epochHistory.slice(-20); // Last 20 epochs
    if (recentEpochs.length < 5) {
      return {
        emotionalTrend: 'stable',
        participationTrend: 'stable',
        performanceTrend: 'stable',
        trendStrength: 0
      };
    }
    const emotionalScores = recentEpochs.map(e => e.emotionalAverage);
    const participationCounts = recentEpochs.map(e => e.participantCount);
    const durations = recentEpochs.map(e => e.duration);
    const emotionalTrend = this.calculateTrend(emotionalScores);
    const participationTrend = this.calculateTrend(participationCounts);
    const performanceTrend = this.calculateTrend(durations.map(d => 30000 - d)); // Invert duration for performance
    // Calculate overall trend strength
    const trends = [emotionalTrend, participationTrend, performanceTrend];
    const trendStrength = this.calculateTrendStrength(trends);
    return {
      emotionalTrend,
      participationTrend,
      performanceTrend,
      trendStrength
    };
  }
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable';
    // Simple linear regression slope
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    if (slope > 0.5) return 'improving';
    if (slope < -0.5) return 'declining';
    return 'stable';
  }
  private calculateTrendStrength(trends: string[]): number {
    const improvingCount = trends.filter(t => t === 'improving').length;
    const decliningCount = trends.filter(t => t === 'declining').length;
    return Math.abs(improvingCount - decliningCount) / trends.length;
  }
  // Alerting system
  checkAlerts(): Array<{
    type: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }> {
    const alerts = [];
    // Network health alerts
    if (this.currentNetworkHealth < 50) {
      alerts.push({
        type: 'critical' as const,
        message: 'Network health critically low',
        metric: 'networkHealth',
        value: this.currentNetworkHealth,
        threshold: 50
      });
    } else if (this.currentNetworkHealth < 75) {
      alerts.push({
        type: 'warning' as const,
        message: 'Network health below optimal',
        metric: 'networkHealth',
        value: this.currentNetworkHealth,
        threshold: 75
      });
    }
    // Consensus strength alerts
    if (this.currentConsensusStrength < 67) {
      alerts.push({
        type: 'critical' as const,
        message: 'Consensus strength below Byzantine threshold',
        metric: 'consensusStrength',
        value: this.currentConsensusStrength,
        threshold: 67
      });
    }
    // Participation rate alerts
    if (this.currentParticipationRate < 50) {
      alerts.push({
        type: 'critical' as const,
        message: 'Validator participation critically low',
        metric: 'participationRate',
        value: this.currentParticipationRate,
        threshold: 50
      });
    } else if (this.currentParticipationRate < 75) {
      alerts.push({
        type: 'warning' as const,
        message: 'Validator participation below optimal',
        metric: 'participationRate',
        value: this.currentParticipationRate,
        threshold: 75
      });
    }
    // Performance alerts
    const recentEpochs = this.epochHistory.slice(-5);
    if (recentEpochs.length > 0) {
      const avgDuration = _.meanBy(recentEpochs, 'duration');
      if (avgDuration > 40000) { // More than 40 seconds
        alerts.push({
          type: 'warning' as const,
          message: 'Epoch duration above target',
          metric: 'epochDuration',
          value: avgDuration,
          threshold: 30000
        });
      }
    }
    return alerts;
  }
  // Export/reporting
  generateReport(): {
    summary: any;
    performance: any;
    trends: any;
    validators: any;
    alerts: any;
  } {
    const performance = this.getPerformanceAnalytics();
    const trends = this.analyzeTrends();
    const alerts = this.checkAlerts();
    const summary = {
      totalEpochs: this.epochHistory.length,
      totalValidators: this.currentValidatorCount,
      networkHealth: this.currentNetworkHealth,
      consensusStrength: this.currentConsensusStrength,
      participationRate: this.currentParticipationRate,
      uptime: this.calculateUptime(),
      reportTime: Date.now()
    };
    const validators = Array.from(this.validatorMetrics.values())
      .sort((a, b) => b.participationRate - a.participationRate)
      .slice(0, 10); // Top 10 validators
    return {
      summary,
      performance,
      trends,
      validators,
      alerts
    };
  }
  exportMetrics(): {
    epochs: EpochMetrics[];
    validators: ValidatorMetrics[];
    network: NetworkMetrics[];
  } {
    return {
      epochs: [...this.epochHistory],
      validators: Array.from(this.validatorMetrics.values()),
      network: [...this.networkHistory]
    };
  }
  // Data management
  private async loadHistoricalMetrics(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    // For now, start with empty arrays
  }
  private startMetricsCollection(): void {
    // Periodic metrics updates
    setInterval(() => {
      this.updateNetworkMetrics();
      // Check for alerts
      const alerts = this.checkAlerts();
      if (alerts.length > 0) {
        this.emit('alerts-detected', alerts);
      }
    }, 10000); // Every 10 seconds
    // Performance sampling
    setInterval(() => {
      // Sample current performance metrics
      const currentThroughput = this.calculateCurrentThroughput();
      const currentLatency = this.calculateCurrentLatency();
      if (currentThroughput > 0) {
        this.recordThroughput(currentThroughput);
      }
      if (currentLatency > 0) {
        this.recordLatency(currentLatency);
      }
    }, 5000); // Every 5 seconds
  }
  private calculateCurrentThroughput(): number {
    // Calculate TPS based on recent epochs
    const recentEpochs = this.epochHistory.slice(-3);
    if (recentEpochs.length === 0) return 0;
    const totalTransactions = recentEpochs.reduce((sum, epoch) => {
      // Estimate transactions per epoch (would be actual count in real implementation)
      return sum + (epoch.participantCount * 10); // Assume 10 transactions per participant
    }, 0);
    const totalTime = recentEpochs.reduce((sum, epoch) => sum + epoch.duration, 0);
    return totalTime > 0 ? (totalTransactions / totalTime) * 1000 : 0; // Convert to TPS
  }
  private calculateCurrentLatency(): number {
    // Use epoch duration as proxy for consensus latency
    const recentEpochs = this.epochHistory.slice(-1);
    return recentEpochs.length > 0 ? recentEpochs[0].duration : 0;
  }
  // Public getters
  getEpochHistory(): EpochMetrics[] {
    return [...this.epochHistory];
  }
  getValidatorMetrics(): Map<string, ValidatorMetrics> {
    return new Map(this.validatorMetrics);
  }
  getNetworkHistory(): NetworkMetrics[] {
    return [...this.networkHistory];
  }
  getCurrentMetrics(): {
    networkHealth: number;
    consensusStrength: number;
    participationRate: number;
    validatorCount: number;
  } {
    return {
      networkHealth: this.currentNetworkHealth,
      consensusStrength: this.currentConsensusStrength,
      participationRate: this.currentParticipationRate,
      validatorCount: this.currentValidatorCount
    };
  }
  // Cleanup
  async shutdown(): Promise<void> {
    // Save metrics to persistent storage
    console.log('💾 Saving consensus metrics...');
    // In a real implementation, this would persist metrics to database
  }
}