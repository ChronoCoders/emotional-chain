/**
 * Network Monitoring Dashboard
 * Real-time monitoring and management for distributed EmotionalChain network
 */

import { DistributedBlockchainIntegration } from '../server/blockchain/DistributedBlockchainIntegration';
import { ValidatorNodeDeployment } from './ValidatorNodeDeployment';
import { EventEmitter } from 'events';

export interface NetworkMetrics {
  timestamp: number;
  validatorCount: number;
  activeValidators: number;
  consensusHealth: number;
  networkLatency: number;
  throughput: number;
  blockHeight: number;
  economicSecurity: string;
  partitionStatus: string;
  totalStaked: number;
  totalRewards: number;
  byzantineThreats: number;
}

export interface ValidatorMetrics {
  validatorId: string;
  status: string;
  emotionalScore: number;
  authenticity: number;
  blocksProposed: number;
  blocksValidated: number;
  consensusParticipation: number;
  earnings: number;
  uptime: number;
  lastSeen: number;
  peersConnected: number;
}

export interface NetworkAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  validatorId?: string;
  acknowledged: boolean;
  autoResolve: boolean;
}

/**
 * Comprehensive network monitoring and alerting system
 */
export class NetworkMonitoringDashboard extends EventEmitter {
  private integration: DistributedBlockchainIntegration;
  private deployment: ValidatorNodeDeployment;
  
  private metricsHistory: NetworkMetrics[] = [];
  private validatorMetrics: Map<string, ValidatorMetrics[]> = new Map();
  private activeAlerts: Map<string, NetworkAlert> = new Map();
  private monitoringActive: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    integration: DistributedBlockchainIntegration,
    deployment: ValidatorNodeDeployment
  ) {
    super();
    
    this.integration = integration;
    this.deployment = deployment;
    
    console.log('📊 Network Monitoring Dashboard initialized');
  }

  /**
   * Start real-time network monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringActive) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    console.log(`📊 Starting network monitoring (${intervalMs/1000}s intervals)...`);

    this.monitoringActive = true;
    
    // Initial metrics collection
    this.collectMetrics();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlertConditions();
      this.cleanupOldData();
    }, intervalMs);

    this.emit('monitoring:started');
  }

  /**
   * Stop network monitoring
   */
  stopMonitoring(): void {
    if (!this.monitoringActive) return;

    console.log('📊 Stopping network monitoring...');
    
    this.monitoringActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emit('monitoring:stopped');
  }

  /**
   * Collect current network metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Get network status from integration
      const networkStatus = this.integration.getNetworkStatus();
      const readiness = this.integration.getDeploymentReadiness();

      // Get validator metrics
      const validatorNodes = this.integration.listValidatorNodes();
      const deployments = this.deployment.listDeployments();

      // Calculate aggregate metrics
      const activeValidators = validatorNodes.filter(v => v.status.isActive).length;
      const totalStaked = validatorNodes.reduce((sum, v) => sum + (v.metrics.earnings || 0), 0);
      const totalRewards = validatorNodes.reduce((sum, v) => sum + v.metrics.earnings, 0);

      // Create network metrics snapshot
      const metrics: NetworkMetrics = {
        timestamp: Date.now(),
        validatorCount: validatorNodes.length,
        activeValidators,
        consensusHealth: networkStatus.consensusHealth,
        networkLatency: networkStatus.networkLatency,
        throughput: networkStatus.throughput,
        blockHeight: 13400 + Math.floor(Date.now() / 30000), // Simulated block height
        economicSecurity: networkStatus.economicSecurity,
        partitionStatus: networkStatus.partitionStatus,
        totalStaked,
        totalRewards,
        byzantineThreats: 0 // Would come from partition recovery system
      };

      // Store metrics
      this.metricsHistory.push(metrics);

      // Update validator metrics
      for (const validator of validatorNodes) {
        const validatorMetric: ValidatorMetrics = {
          validatorId: validator.validatorId,
          status: validator.status.isActive ? 'active' : 'inactive',
          emotionalScore: validator.status.emotionalScore || 0,
          authenticity: validator.status.authenticity || 0,
          blocksProposed: validator.metrics.blocksProposed || 0,
          blocksValidated: validator.metrics.blocksValidated || 0,
          consensusParticipation: 0.9 + Math.random() * 0.1, // Simulated
          earnings: validator.metrics.earnings || 0,
          uptime: validator.metrics.uptime || 0,
          lastSeen: Date.now(),
          peersConnected: validator.status.peersConnected || 0
        };

        if (!this.validatorMetrics.has(validator.validatorId)) {
          this.validatorMetrics.set(validator.validatorId, []);
        }
        
        this.validatorMetrics.get(validator.validatorId)!.push(validatorMetric);
      }

      // Emit metrics update
      this.emit('metrics:updated', metrics);

    } catch (error) {
      console.error('❌ Failed to collect metrics:', error);
      
      // Create error alert
      this.createAlert('error', 'Metrics Collection Failed', 
        'Unable to collect network metrics. Monitoring may be incomplete.');
    }
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(): void {
    if (this.metricsHistory.length === 0) return;

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const previous = this.metricsHistory.length > 1 ? 
      this.metricsHistory[this.metricsHistory.length - 2] : latest;

    // Check network health alerts
    this.checkNetworkHealthAlerts(latest, previous);
    
    // Check validator alerts
    this.checkValidatorAlerts();
    
    // Check consensus alerts
    this.checkConsensusAlerts(latest, previous);
    
    // Check economic alerts
    this.checkEconomicAlerts(latest);
  }

  /**
   * Check network health alerts
   */
  private checkNetworkHealthAlerts(current: NetworkMetrics, previous: NetworkMetrics): void {
    // Low validator count
    if (current.activeValidators < 4) {
      this.createAlert('critical', 'Low Validator Count', 
        `Only ${current.activeValidators} active validators. Network security at risk.`);
    }

    // Network partition detected
    if (current.partitionStatus !== 'HEALTHY') {
      this.createAlert('error', 'Network Partition Detected', 
        `Network status: ${current.partitionStatus}. Network healing in progress.`);
    }

    // High network latency
    if (current.networkLatency > 1000) {
      this.createAlert('warning', 'High Network Latency', 
        `Network latency: ${current.networkLatency}ms. Performance may be degraded.`);
    }

    // Consensus health degradation
    if (current.consensusHealth < 80) {
      this.createAlert('warning', 'Consensus Health Low', 
        `Consensus health at ${current.consensusHealth}%. Check validator connectivity.`);
    }

    // Throughput drop
    if (current.throughput < previous.throughput * 0.5 && previous.throughput > 0) {
      this.createAlert('warning', 'Throughput Drop', 
        `Network throughput dropped from ${previous.throughput.toFixed(1)} to ${current.throughput.toFixed(1)} blocks/hour.`);
    }

    // Byzantine threats
    if (current.byzantineThreats > 0) {
      this.createAlert('critical', 'Byzantine Behavior Detected', 
        `${current.byzantineThreats} Byzantine threats detected. Network under attack.`);
    }
  }

  /**
   * Check validator-specific alerts
   */
  private checkValidatorAlerts(): void {
    for (const [validatorId, metrics] of this.validatorMetrics.entries()) {
      if (metrics.length === 0) continue;
      
      const latest = metrics[metrics.length - 1];
      const timeSinceLastSeen = Date.now() - latest.lastSeen;
      
      // Validator offline
      if (timeSinceLastSeen > 300000) { // 5 minutes
        this.createAlert('error', 'Validator Offline', 
          `Validator ${validatorId} has been offline for ${Math.floor(timeSinceLastSeen/60000)} minutes.`,
          validatorId);
      }
      
      // Low emotional score
      if (latest.emotionalScore < 70) {
        this.createAlert('warning', 'Low Emotional Score', 
          `Validator ${validatorId} emotional score: ${latest.emotionalScore}%. Consensus participation may be affected.`,
          validatorId);
      }
      
      // Low consensus participation
      if (latest.consensusParticipation < 0.8) {
        this.createAlert('warning', 'Poor Consensus Participation', 
          `Validator ${validatorId} consensus participation: ${(latest.consensusParticipation * 100).toFixed(1)}%.`,
          validatorId);
      }
      
      // No peers connected
      if (latest.peersConnected === 0) {
        this.createAlert('error', 'Validator Isolated', 
          `Validator ${validatorId} has no peer connections. Network connectivity issue.`,
          validatorId);
      }
    }
  }

  /**
   * Check consensus-specific alerts
   */
  private checkConsensusAlerts(current: NetworkMetrics, previous: NetworkMetrics): void {
    // Consensus stall
    if (current.blockHeight === previous.blockHeight && 
        Date.now() - previous.timestamp > 60000) { // No new blocks for 1 minute
      this.createAlert('critical', 'Consensus Stall', 
        'No new blocks produced in the last minute. Consensus may have stalled.');
    }
    
    // Low consensus health
    if (current.consensusHealth < 50) {
      this.createAlert('critical', 'Consensus Failure', 
        `Consensus health critically low: ${current.consensusHealth}%. Network functionality compromised.`);
    }
  }

  /**
   * Check economic security alerts
   */
  private checkEconomicAlerts(current: NetworkMetrics): void {
    // Low economic security
    if (current.economicSecurity.includes('LOW')) {
      this.createAlert('warning', 'Low Economic Security', 
        'Network economic security is low. Consider increasing validator stakes.');
    }
    
    // Very low staked amount
    if (current.totalStaked < 50000) {
      this.createAlert('warning', 'Insufficient Staking', 
        `Total staked: ${current.totalStaked} EMO. Network security may be compromised.`);
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(
    type: NetworkAlert['type'], 
    title: string, 
    message: string, 
    validatorId?: string
  ): void {
    const alertId = crypto.randomUUID();
    
    const alert: NetworkAlert = {
      id: alertId,
      type,
      title,
      message,
      timestamp: Date.now(),
      validatorId,
      acknowledged: false,
      autoResolve: type === 'info' || type === 'warning'
    };

    // Check for duplicate alerts
    const existingAlert = Array.from(this.activeAlerts.values()).find(a => 
      a.title === title && a.validatorId === validatorId && !a.acknowledged
    );

    if (existingAlert) {
      // Update existing alert timestamp
      existingAlert.timestamp = Date.now();
      return;
    }

    this.activeAlerts.set(alertId, alert);
    
    console.log(`🚨 ${type.toUpperCase()} Alert: ${title} - ${message}`);
    
    this.emit('alert:created', alert);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    
    if (!alert) return false;
    
    alert.acknowledged = true;
    
    this.emit('alert:acknowledged', alert);
    
    return true;
  }

  /**
   * Clean up old data to prevent memory leaks
   */
  private cleanupOldData(): void {
    const maxHistoryLength = 1000; // Keep last 1000 metrics snapshots
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean metrics history
    if (this.metricsHistory.length > maxHistoryLength) {
      this.metricsHistory = this.metricsHistory.slice(-maxHistoryLength);
    }
    
    // Clean validator metrics
    for (const [validatorId, metrics] of this.validatorMetrics.entries()) {
      if (metrics.length > maxHistoryLength) {
        this.validatorMetrics.set(validatorId, metrics.slice(-maxHistoryLength));
      }
    }
    
    // Clean old alerts
    const cutoff = Date.now() - maxAge;
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (alert.acknowledged && alert.timestamp < cutoff) {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  /**
   * Get current network metrics
   */
  getCurrentMetrics(): NetworkMetrics | null {
    return this.metricsHistory.length > 0 ? 
      this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): NetworkMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get validator metrics
   */
  getValidatorMetrics(validatorId: string, hours: number = 24): ValidatorMetrics[] {
    const metrics = this.validatorMetrics.get(validatorId) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get all validator metrics (latest for each)
   */
  getAllValidatorMetrics(): ValidatorMetrics[] {
    const result: ValidatorMetrics[] = [];
    
    for (const [validatorId, metrics] of this.validatorMetrics.entries()) {
      if (metrics.length > 0) {
        result.push(metrics[metrics.length - 1]);
      }
    }
    
    return result;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): NetworkAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => !a.acknowledged)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all alerts (including acknowledged)
   */
  getAllAlerts(): NetworkAlert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get network statistics
   */
  getNetworkStatistics(hours: number = 24): any {
    const history = this.getMetricsHistory(hours);
    
    if (history.length === 0) {
      return {
        dataPoints: 0,
        timespan: 0
      };
    }

    const latest = history[history.length - 1];
    const earliest = history[0];

    return {
      dataPoints: history.length,
      timespan: latest.timestamp - earliest.timestamp,
      
      validators: {
        current: latest.validatorCount,
        active: latest.activeValidators,
        averageActive: history.reduce((sum, m) => sum + m.activeValidators, 0) / history.length
      },
      
      consensus: {
        currentHealth: latest.consensusHealth,
        averageHealth: history.reduce((sum, m) => sum + m.consensusHealth, 0) / history.length,
        minHealth: Math.min(...history.map(m => m.consensusHealth)),
        maxHealth: Math.max(...history.map(m => m.consensusHealth))
      },
      
      network: {
        currentLatency: latest.networkLatency,
        averageLatency: history.reduce((sum, m) => sum + m.networkLatency, 0) / history.length,
        currentThroughput: latest.throughput,
        averageThroughput: history.reduce((sum, m) => sum + m.throughput, 0) / history.length
      },
      
      economics: {
        totalStaked: latest.totalStaked,
        totalRewards: latest.totalRewards,
        economicSecurity: latest.economicSecurity
      },
      
      alerts: {
        active: this.getActiveAlerts().length,
        total: this.activeAlerts.size,
        critical: this.getActiveAlerts().filter(a => a.type === 'critical').length,
        warnings: this.getActiveAlerts().filter(a => a.type === 'warning').length
      }
    };
  }

  /**
   * Export monitoring data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: Date.now(),
      networkMetrics: this.metricsHistory,
      validatorMetrics: Object.fromEntries(this.validatorMetrics),
      alerts: Array.from(this.activeAlerts.values()),
      statistics: this.getNetworkStatistics()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV format (simplified)
      const csvLines = ['timestamp,validators,active,consensusHealth,latency,throughput'];
      
      for (const metric of this.metricsHistory) {
        csvLines.push([
          metric.timestamp,
          metric.validatorCount,
          metric.activeValidators,
          metric.consensusHealth,
          metric.networkLatency,
          metric.throughput
        ].join(','));
      }
      
      return csvLines.join('\n');
    }
  }
}