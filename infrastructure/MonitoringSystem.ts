import { EventEmitter } from 'eventemitter3';
import { register, Gauge, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import winston from 'winston';

/**
 * Comprehensive monitoring system for EmotionalChain network
 * Tracks system metrics, consensus performance, and custom blockchain metrics
 */

export interface AlertRule {
  name: string;
  metric: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  threshold: number;
  duration: number; // Duration in ms before triggering
  severity: 'info' | 'warning' | 'critical';
  description: string;
  enabled: boolean;
}

export interface MetricSample {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface EmotionalChainMetrics {
  consensusRounds: number;
  averageEmotionalScore: number;
  validatorParticipation: number;
  networkHealth: number;
  blockTime: number;
  transactionThroughput: number;
  byzantineFailures: number;
  forkResolutions: number;
}

export class MonitoringSystem extends EventEmitter {
  private logger: winston.Logger;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, { triggeredAt: number; acknowledged: boolean }> = new Map();
  private metricHistory: MetricSample[] = [];
  
  // Prometheus metrics
  private nodeUptime: Gauge<string>;
  private consensusRounds: Counter<string>;
  private emotionalScoreGauge: Gauge<string>;
  private validatorParticipation: Gauge<string>;
  private networkHealthGauge: Gauge<string>;
  private blockTimeHistogram: Histogram<string>;
  private transactionCounter: Counter<string>;
  private byzantineFailuresCounter: Counter<string>;
  private systemResourcesGauge: Gauge<string>;
  
  constructor() {
    super();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'monitoring.log' })
      ]
    });
    
    this.initializeMetrics();
    this.setupDefaultAlertRules();
  }
  
  private initializeMetrics(): void {
    // Clear existing metrics
    register.clear();
    
    // Enable default system metrics collection
    collectDefaultMetrics({ register });
    
    // Custom EmotionalChain metrics
    this.nodeUptime = new Gauge({
      name: 'emotional_chain_node_uptime_seconds',
      help: 'Node uptime in seconds',
      labelNames: ['node_id', 'node_type']
    });
    
    this.consensusRounds = new Counter({
      name: 'emotional_chain_consensus_rounds_total',
      help: 'Total number of consensus rounds',
      labelNames: ['status', 'validator_id']
    });
    
    this.emotionalScoreGauge = new Gauge({
      name: 'emotional_chain_emotional_score',
      help: 'Current emotional score for validators',
      labelNames: ['validator_id']
    });
    
    this.validatorParticipation = new Gauge({
      name: 'emotional_chain_validator_participation_rate',
      help: 'Validator participation rate in consensus',
      labelNames: ['validator_id']
    });
    
    this.networkHealthGauge = new Gauge({
      name: 'emotional_chain_network_health',
      help: 'Overall network health score (0-100)',
      labelNames: ['metric_type']
    });
    
    this.blockTimeHistogram = new Histogram({
      name: 'emotional_chain_block_time_seconds',
      help: 'Time taken to produce blocks',
      buckets: [1, 5, 10, 30, 60, 120, 300],
      labelNames: ['validator_id']
    });
    
    this.transactionCounter = new Counter({
      name: 'emotional_chain_transactions_total',
      help: 'Total number of transactions processed',
      labelNames: ['status', 'type']
    });
    
    this.byzantineFailuresCounter = new Counter({
      name: 'emotional_chain_byzantine_failures_total',
      help: 'Total number of Byzantine failures detected',
      labelNames: ['failure_type', 'validator_id']
    });
    
    this.systemResourcesGauge = new Gauge({
      name: 'emotional_chain_system_resources',
      help: 'System resource utilization',
      labelNames: ['resource_type', 'node_id']
    });
  }
  
  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        name: 'high_consensus_latency',
        metric: 'emotional_chain_block_time_seconds',
        operator: '>',
        threshold: 60,
        duration: 300000, // 5 minutes
        severity: 'warning',
        description: 'Consensus block time exceeding 60 seconds',
        enabled: true
      },
      {
        name: 'low_network_health',
        metric: 'emotional_chain_network_health',
        operator: '<',
        threshold: 50,
        duration: 120000, // 2 minutes
        severity: 'critical',
        description: 'Network health below 50%',
        enabled: true
      },
      {
        name: 'low_validator_participation',
        metric: 'emotional_chain_validator_participation_rate',
        operator: '<',
        threshold: 67,
        duration: 180000, // 3 minutes
        severity: 'warning',
        description: 'Validator participation below Byzantine threshold',
        enabled: true
      },
      {
        name: 'byzantine_failure_spike',
        metric: 'emotional_chain_byzantine_failures_total',
        operator: '>',
        threshold: 5,
        duration: 300000, // 5 minutes
        severity: 'critical',
        description: 'High number of Byzantine failures detected',
        enabled: true
      },
      {
        name: 'low_emotional_score',
        metric: 'emotional_chain_emotional_score',
        operator: '<',
        threshold: 75,
        duration: 600000, // 10 minutes
        severity: 'warning',
        description: 'Average emotional score below threshold',
        enabled: true
      }
    ];
    
    for (const rule of defaultRules) {
      this.alertRules.set(rule.name, rule);
    }
  }
  
  async initialize(): Promise<void> {
    this.logger.info('📊 Initializing monitoring system...');
    
    // Start metric collection
    this.startMetricCollection();
    
    // Start alert evaluation
    this.startAlertEvaluation();
    
    this.logger.info('✅ Monitoring system initialized');
    this.emit('initialized');
  }
  
  private startMetricCollection(): void {
    // Collect metrics every 15 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 15000);
    
    // Collect blockchain-specific metrics every 30 seconds
    setInterval(() => {
      this.collectBlockchainMetrics();
    }, 30000);
  }
  
  private startAlertEvaluation(): void {
    // Evaluate alerts every 60 seconds
    setInterval(() => {
      this.evaluateAlerts();
    }, 60000);
  }
  
  // Metric recording methods
  recordNodeUptime(nodeId: string, nodeType: string, uptimeSeconds: number): void {
    this.nodeUptime.set({ node_id: nodeId, node_type: nodeType }, uptimeSeconds);
    this.recordMetricSample('node_uptime', uptimeSeconds, { node_id: nodeId, node_type: nodeType });
  }
  
  recordConsensusRound(status: 'success' | 'failure', validatorId: string): void {
    this.consensusRounds.inc({ status, validator_id: validatorId });
    this.recordMetricSample('consensus_rounds', 1, { status, validator_id: validatorId });
  }
  
  recordEmotionalScore(validatorId: string, score: number): void {
    this.emotionalScoreGauge.set({ validator_id: validatorId }, score);
    this.recordMetricSample('emotional_score', score, { validator_id: validatorId });
  }
  
  recordValidatorParticipation(validatorId: string, participationRate: number): void {
    this.validatorParticipation.set({ validator_id: validatorId }, participationRate);
    this.recordMetricSample('validator_participation', participationRate, { validator_id: validatorId });
  }
  
  recordNetworkHealth(metricType: string, healthScore: number): void {
    this.networkHealthGauge.set({ metric_type: metricType }, healthScore);
    this.recordMetricSample('network_health', healthScore, { metric_type: metricType });
  }
  
  recordBlockTime(validatorId: string, blockTimeSeconds: number): void {
    this.blockTimeHistogram.observe({ validator_id: validatorId }, blockTimeSeconds);
    this.recordMetricSample('block_time', blockTimeSeconds, { validator_id: validatorId });
  }
  
  recordTransaction(status: 'success' | 'failure', type: string): void {
    this.transactionCounter.inc({ status, type });
    this.recordMetricSample('transactions', 1, { status, type });
  }
  
  recordByzantineFailure(failureType: string, validatorId: string): void {
    this.byzantineFailuresCounter.inc({ failure_type: failureType, validator_id: validatorId });
    this.recordMetricSample('byzantine_failures', 1, { failure_type: failureType, validator_id: validatorId });
  }
  
  recordSystemResources(resourceType: string, nodeId: string, value: number): void {
    this.systemResourcesGauge.set({ resource_type: resourceType, node_id: nodeId }, value);
    this.recordMetricSample('system_resources', value, { resource_type: resourceType, node_id: nodeId });
  }
  
  private recordMetricSample(name: string, value: number, labels: Record<string, string>): void {
    const sample: MetricSample = {
      name,
      value,
      labels,
      timestamp: Date.now()
    };
    
    this.metricHistory.push(sample);
    
    // Keep only recent history (last 1000 samples)
    if (this.metricHistory.length > 1000) {
      this.metricHistory = this.metricHistory.slice(-1000);
    }
    
    this.emit('metric-recorded', sample);
  }
  
  // System metrics collection
  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Record system metrics
      this.recordSystemResources('memory_rss', 'local', memUsage.rss);
      this.recordSystemResources('memory_heap_used', 'local', memUsage.heapUsed);
      this.recordSystemResources('memory_heap_total', 'local', memUsage.heapTotal);
      this.recordSystemResources('cpu_user', 'local', cpuUsage.user);
      this.recordSystemResources('cpu_system', 'local', cpuUsage.system);
      
    } catch (error) {
      this.logger.error('❌ Failed to collect system metrics:', error);
    }
  }
  
  private collectBlockchainMetrics(): void {
    try {
      // These would be collected from actual blockchain components
      // For now, simulate some metrics
      
      const simulatedMetrics: EmotionalChainMetrics = {
        consensusRounds: Math.floor(Date.now() / 30000), // Every 30 seconds
        averageEmotionalScore: 85 + Math.random() * 10,
        validatorParticipation: 80 + Math.random() * 20,
        networkHealth: 90 + Math.random() * 10,
        blockTime: 25 + Math.random() * 10,
        transactionThroughput: 50 + Math.random() * 100,
        byzantineFailures: Math.random() < 0.05 ? 1 : 0,
        forkResolutions: Math.random() < 0.01 ? 1 : 0
      };
      
      // Record blockchain metrics
      this.recordNetworkHealth('overall', simulatedMetrics.networkHealth);
      this.recordValidatorParticipation('network_average', simulatedMetrics.validatorParticipation);
      this.recordEmotionalScore('network_average', simulatedMetrics.averageEmotionalScore);
      
      if (simulatedMetrics.byzantineFailures > 0) {
        this.recordByzantineFailure('simulation', 'unknown');
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to collect blockchain metrics:', error);
    }
  }
  
  // Alert system
  private evaluateAlerts(): void {
    for (const [ruleName, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;
      
      try {
        const shouldTrigger = this.evaluateAlertRule(rule);
        const isActive = this.activeAlerts.has(ruleName);
        
        if (shouldTrigger && !isActive) {
          this.triggerAlert(ruleName, rule);
        } else if (!shouldTrigger && isActive) {
          this.resolveAlert(ruleName);
        }
        
      } catch (error) {
        this.logger.error(`❌ Failed to evaluate alert rule ${ruleName}:`, error);
      }
    }
  }
  
  private evaluateAlertRule(rule: AlertRule): boolean {
    // Get recent samples for this metric
    const now = Date.now();
    const recentSamples = this.metricHistory.filter(sample => 
      sample.name === rule.metric.replace('emotional_chain_', '') &&
      now - sample.timestamp <= rule.duration
    );
    
    if (recentSamples.length === 0) return false;
    
    // Calculate aggregate value (average for simplicity)
    const aggregateValue = recentSamples.reduce((sum, sample) => sum + sample.value, 0) / recentSamples.length;
    
    // Evaluate condition
    switch (rule.operator) {
      case '>': return aggregateValue > rule.threshold;
      case '<': return aggregateValue < rule.threshold;
      case '>=': return aggregateValue >= rule.threshold;
      case '<=': return aggregateValue <= rule.threshold;
      case '==': return aggregateValue === rule.threshold;
      case '!=': return aggregateValue !== rule.threshold;
      default: return false;
    }
  }
  
  private triggerAlert(ruleName: string, rule: AlertRule): void {
    const alert = {
      triggeredAt: Date.now(),
      acknowledged: false
    };
    
    this.activeAlerts.set(ruleName, alert);
    
    this.logger.warn(`🚨 Alert triggered: ${ruleName}`, {
      rule: rule.name,
      severity: rule.severity,
      description: rule.description,
      threshold: rule.threshold
    });
    
    this.emit('alert-triggered', {
      name: ruleName,
      rule,
      triggeredAt: alert.triggeredAt
    });
  }
  
  private resolveAlert(ruleName: string): void {
    this.activeAlerts.delete(ruleName);
    
    this.logger.info(`✅ Alert resolved: ${ruleName}`);
    
    this.emit('alert-resolved', {
      name: ruleName,
      resolvedAt: Date.now()
    });
  }
  
  // Alert management
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.name, rule);
    this.logger.info(`➕ Added alert rule: ${rule.name}`);
  }
  
  removeAlertRule(ruleName: string): void {
    this.alertRules.delete(ruleName);
    this.activeAlerts.delete(ruleName);
    this.logger.info(`➖ Removed alert rule: ${ruleName}`);
  }
  
  acknowledgeAlert(ruleName: string): void {
    const alert = this.activeAlerts.get(ruleName);
    if (alert) {
      alert.acknowledged = true;
      this.logger.info(`✅ Alert acknowledged: ${ruleName}`);
      this.emit('alert-acknowledged', { name: ruleName });
    }
  }
  
  // Dashboard data
  getDashboardData(): {
    systemHealth: any;
    consensusMetrics: any;
    networkStats: any;
    activeAlerts: any[];
    recentMetrics: MetricSample[];
  } {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    
    // Get recent metrics
    const recentMetrics = this.metricHistory.filter(sample => 
      sample.timestamp > last24h
    );
    
    // Calculate system health
    const systemHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeConnections: 0, // Would be populated from actual data
      errorRate: 0 // Would be calculated from error metrics
    };
    
    // Calculate consensus metrics
    const consensusMetrics = {
      totalRounds: recentMetrics.filter(m => m.name === 'consensus_rounds').length,
      successRate: 95, // Would be calculated from actual data
      averageBlockTime: 30, // Would be calculated from block_time metrics
      participationRate: 85 // Would be calculated from participation metrics
    };
    
    // Network statistics
    const networkStats = {
      totalValidators: 21, // Would come from actual network data
      activeValidators: 18,
      networkHealth: 92,
      byzantineFailures: recentMetrics.filter(m => m.name === 'byzantine_failures').length
    };
    
    // Active alerts
    const activeAlerts = Array.from(this.activeAlerts.entries()).map(([name, alert]) => ({
      name,
      triggeredAt: alert.triggeredAt,
      acknowledged: alert.acknowledged,
      rule: this.alertRules.get(name)
    }));
    
    return {
      systemHealth,
      consensusMetrics,
      networkStats,
      activeAlerts,
      recentMetrics: recentMetrics.slice(-100) // Last 100 samples
    };
  }
  
  // SLA tracking
  calculateSLA(timeWindowMs: number): {
    uptime: number;
    availability: number;
    meanTimeToRecovery: number;
    errorRate: number;
  } {
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    
    const windowMetrics = this.metricHistory.filter(sample => 
      sample.timestamp >= windowStart
    );
    
    // Calculate uptime (simplified)
    const uptimeMetrics = windowMetrics.filter(m => m.name === 'node_uptime');
    const uptime = uptimeMetrics.length > 0 ? 
      uptimeMetrics[uptimeMetrics.length - 1].value : 0;
    
    // Calculate availability
    const totalTime = timeWindowMs / 1000;
    const availability = totalTime > 0 ? (uptime / totalTime) * 100 : 0;
    
    // Calculate error rate
    const totalTransactions = windowMetrics.filter(m => m.name === 'transactions').length;
    const failedTransactions = windowMetrics.filter(m => 
      m.name === 'transactions' && m.labels.status === 'failure'
    ).length;
    const errorRate = totalTransactions > 0 ? 
      (failedTransactions / totalTransactions) * 100 : 0;
    
    // Mean time to recovery (simplified)
    const meanTimeToRecovery = 0; // Would be calculated from actual incident data
    
    return {
      uptime,
      availability,
      meanTimeToRecovery,
      errorRate
    };
  }
  
  // Prometheus metrics endpoint
  async getPrometheusMetrics(): Promise<string> {
    return register.metrics();
  }
  
  // Anomaly detection (simplified)
  detectAnomalies(): Array<{
    metric: string;
    value: number;
    expected: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    const anomalies = [];
    
    // Simple anomaly detection based on recent history
    const recentSamples = this.metricHistory.slice(-100);
    const metricGroups = this.groupBy(recentSamples, 'name');
    
    for (const [metricName, samples] of Object.entries(metricGroups)) {
      if (samples.length < 10) continue; // Need enough samples
      
      const values = samples.map(s => s.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      const latest = values[values.length - 1];
      const deviation = Math.abs(latest - mean) / stdDev;
      
      if (deviation > 2) { // More than 2 standard deviations
        anomalies.push({
          metric: metricName,
          value: latest,
          expected: mean,
          deviation,
          severity: deviation > 3 ? 'high' : deviation > 2.5 ? 'medium' : 'low'
        });
      }
    }
    
    return anomalies;
  }
  
  private groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as { [key: string]: T[] });
  }
  
  // Cleanup and shutdown
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down monitoring system...');
    
    // Clear metrics registry
    register.clear();
    
    // Clear internal state
    this.alertRules.clear();
    this.activeAlerts.clear();
    this.metricHistory = [];
    
    this.emit('shutdown');
    this.logger.info('✅ Monitoring system shutdown complete');
  }
  
  // Public getters
  getActiveAlerts(): Map<string, any> {
    return new Map(this.activeAlerts);
  }
  
  getAlertRules(): Map<string, AlertRule> {
    return new Map(this.alertRules);
  }
  
  getMetricHistory(metricName?: string, timeWindowMs?: number): MetricSample[] {
    let samples = this.metricHistory;
    
    if (metricName) {
      samples = samples.filter(sample => sample.name === metricName);
    }
    
    if (timeWindowMs) {
      const cutoff = Date.now() - timeWindowMs;
      samples = samples.filter(sample => sample.timestamp > cutoff);
    }
    
    return samples;
  }
}