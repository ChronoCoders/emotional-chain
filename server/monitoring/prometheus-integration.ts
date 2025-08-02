import promClient from 'prom-client';
import { CONFIG } from '../../shared/config';

/**
 * Production-grade Prometheus metrics integration
 * Provides comprehensive monitoring for EmotionalChain consensus
 */
export class PrometheusIntegration {
  private register: promClient.Registry;
  
  // Consensus metrics
  private blockHeight: promClient.Gauge;
  private consensusLatency: promClient.Histogram;
  private validatorCount: promClient.Gauge;
  private emotionalScore: promClient.Gauge;
  private byzantineDetections: promClient.Counter;
  
  // Network metrics
  private peerConnections: promClient.Gauge;
  private messageLatency: promClient.Histogram;
  private networkPartitions: promClient.Counter;
  
  // Biometric metrics
  private biometricDevices: promClient.Gauge;
  private biometricQuality: promClient.Gauge;
  private authenticationFailures: promClient.Counter;
  
  // Performance metrics
  private memoryUsage: promClient.Gauge;
  private cpuUsage: promClient.Gauge;
  private databaseConnections: promClient.Gauge;
  
  constructor() {
    this.register = new promClient.Registry();
    
    // Add default Node.js metrics
    promClient.collectDefaultMetrics({ register: this.register });
    
    this.initializeMetrics();
  }
  
  private initializeMetrics(): void {
    // Consensus metrics
    this.blockHeight = new promClient.Gauge({
      name: 'emotionalchain_block_height',
      help: 'Current blockchain height',
      registers: [this.register]
    });
    
    this.consensusLatency = new promClient.Histogram({
      name: 'emotionalchain_consensus_latency_seconds',
      help: 'Time taken for consensus rounds',
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register]
    });
    
    this.validatorCount = new promClient.Gauge({
      name: 'emotionalchain_active_validators',
      help: 'Number of active validators',
      registers: [this.register]
    });
    
    this.emotionalScore = new promClient.Gauge({
      name: 'emotionalchain_emotional_score',
      help: 'Current network emotional score',
      labelNames: ['validator_id'],
      registers: [this.register]
    });
    
    this.byzantineDetections = new promClient.Counter({
      name: 'emotionalchain_byzantine_detections_total',
      help: 'Total number of Byzantine behavior detections',
      labelNames: ['detection_type'],
      registers: [this.register]
    });
    
    // Network metrics
    this.peerConnections = new promClient.Gauge({
      name: 'emotionalchain_peer_connections',
      help: 'Number of active peer connections',
      registers: [this.register]
    });
    
    this.messageLatency = new promClient.Histogram({
      name: 'emotionalchain_message_latency_seconds',
      help: 'Network message propagation latency',
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
      labelNames: ['message_type'],
      registers: [this.register]
    });
    
    this.networkPartitions = new promClient.Counter({
      name: 'emotionalchain_network_partitions_total',
      help: 'Total number of network partitions detected',
      registers: [this.register]
    });
    
    // Biometric metrics
    this.biometricDevices = new promClient.Gauge({
      name: 'emotionalchain_biometric_devices',
      help: 'Number of connected biometric devices',
      labelNames: ['device_type'],
      registers: [this.register]
    });
    
    this.biometricQuality = new promClient.Gauge({
      name: 'emotionalchain_biometric_quality_score',
      help: 'Biometric data quality score',
      labelNames: ['validator_id', 'device_type'],
      registers: [this.register]
    });
    
    this.authenticationFailures = new promClient.Counter({
      name: 'emotionalchain_authentication_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['failure_type'],
      registers: [this.register]
    });
    
    // Performance metrics
    this.memoryUsage = new promClient.Gauge({
      name: 'emotionalchain_memory_usage_bytes',
      help: 'Memory usage in bytes',
      collect: () => {
        const usage = process.memoryUsage();
        this.memoryUsage.set(usage.heapUsed);
      },
      registers: [this.register]
    });
    
    this.cpuUsage = new promClient.Gauge({
      name: 'emotionalchain_cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [this.register]
    });
    
    this.databaseConnections = new promClient.Gauge({
      name: 'emotionalchain_database_connections',
      help: 'Number of active database connections',
      registers: [this.register]
    });
  }
  
  // Update methods for real-time metrics
  updateBlockHeight(height: number): void {
    this.blockHeight.set(height);
  }
  
  recordConsensusLatency(latencySeconds: number): void {
    this.consensusLatency.observe(latencySeconds);
  }
  
  updateValidatorCount(count: number): void {
    this.validatorCount.set(count);
  }
  
  updateEmotionalScore(validatorId: string, score: number): void {
    this.emotionalScore.set({ validator_id: validatorId }, score);
  }
  
  recordByzantineDetection(type: string): void {
    this.byzantineDetections.inc({ detection_type: type });
  }
  
  updatePeerConnections(count: number): void {
    this.peerConnections.set(count);
  }
  
  recordMessageLatency(messageType: string, latencySeconds: number): void {
    this.messageLatency.observe({ message_type: messageType }, latencySeconds);
  }
  
  recordNetworkPartition(): void {
    this.networkPartitions.inc();
  }
  
  updateBiometricDevices(deviceType: string, count: number): void {
    this.biometricDevices.set({ device_type: deviceType }, count);
  }
  
  updateBiometricQuality(validatorId: string, deviceType: string, quality: number): void {
    this.biometricQuality.set({ validator_id: validatorId, device_type: deviceType }, quality);
  }
  
  recordAuthenticationFailure(type: string): void {
    this.authenticationFailures.inc({ failure_type: type });
  }
  
  updateCpuUsage(percentage: number): void {
    this.cpuUsage.set(percentage);
  }
  
  updateDatabaseConnections(count: number): void {
    this.databaseConnections.set(count);
  }
  
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
  
  // Custom metrics for EmotionalChain specifics
  createCustomMetric(name: string, type: 'gauge' | 'counter' | 'histogram', help: string, labelNames?: string[]): any {
    const metricName = `emotionalchain_${name}`;
    
    switch (type) {
      case 'gauge':
        return new promClient.Gauge({
          name: metricName,
          help,
          labelNames,
          registers: [this.register]
        });
      case 'counter':
        return new promClient.Counter({
          name: metricName,
          help,
          labelNames,
          registers: [this.register]
        });
      case 'histogram':
        return new promClient.Histogram({
          name: metricName,
          help,
          buckets: [0.1, 0.5, 1, 2, 5, 10],
          labelNames,
          registers: [this.register]
        });
    }
  }
}

// Export singleton instance
export const prometheusIntegration = new PrometheusIntegration();
export default PrometheusIntegration;