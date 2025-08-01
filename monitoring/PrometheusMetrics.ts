import client from 'prom-client';
import { EventEmitter } from 'events';

/**
 * Comprehensive Prometheus metrics for EmotionalChain monitoring
 * Provides detailed insights into consensus, network, and biometric performance
 */
export class EmotionalChainMetrics extends EventEmitter {
  // Consensus Metrics
  private consensusRoundDuration = new client.Histogram({
    name: 'emotionalchain_consensus_round_duration_seconds',
    help: 'Duration of consensus rounds in seconds',
    labelNames: ['round_type', 'success'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 15, 30]
  });

  private consensusSuccessRate = new client.Counter({
    name: 'emotionalchain_consensus_success_total',
    help: 'Total number of successful consensus rounds',
    labelNames: ['validator_count_range']
  });

  private consensusFailureRate = new client.Counter({
    name: 'emotionalchain_consensus_failure_total',
    help: 'Total number of failed consensus rounds',
    labelNames: ['failure_reason']
  });

  // Validator Metrics
  private activeValidators = new client.Gauge({
    name: 'emotionalchain_active_validators_total',
    help: 'Number of currently active validators',
    labelNames: ['region']
  });

  private validatorEmotionalScore = new client.Histogram({
    name: 'emotionalchain_validator_emotional_score',
    help: 'Distribution of emotional scores across validators',
    labelNames: ['validator_id'],
    buckets: [0, 25, 50, 60, 70, 75, 80, 85, 90, 95, 100]
  });

  private validatorParticipationRate = new client.Gauge({
    name: 'emotionalchain_validator_participation_rate',
    help: 'Validator participation rate in consensus',
    labelNames: ['validator_id', 'time_window']
  });

  // Biometric Metrics
  private biometricReadingsPerSecond = new client.Counter({
    name: 'emotionalchain_biometric_readings_total',
    help: 'Total biometric readings processed',
    labelNames: ['device_type', 'quality_level', 'validator_id']
  });

  private biometricDeviceHealth = new client.Gauge({
    name: 'emotionalchain_biometric_device_health',
    help: 'Health status of biometric devices (0-1)',
    labelNames: ['device_id', 'device_type', 'validator_id']
  });

  private biometricAuthenticityScore = new client.Histogram({
    name: 'emotionalchain_biometric_authenticity_score',
    help: 'Distribution of biometric authenticity scores',
    labelNames: ['device_type'],
    buckets: [0, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0]
  });

  // Network Metrics
  private p2pConnectedPeers = new client.Gauge({
    name: 'emotionalchain_p2p_connected_peers_total',
    help: 'Number of connected P2P peers',
    labelNames: ['node_id', 'connection_type']
  });

  private p2pMessageLatency = new client.Histogram({
    name: 'emotionalchain_p2p_message_latency_seconds',
    help: 'P2P message latency in seconds',
    labelNames: ['message_type', 'source_region', 'target_region'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
  });

  private networkThroughput = new client.Counter({
    name: 'emotionalchain_network_throughput_bytes_total',
    help: 'Total network throughput in bytes',
    labelNames: ['direction', 'message_type']
  });

  // Blockchain Metrics
  private blockHeight = new client.Gauge({
    name: 'emotionalchain_block_height',
    help: 'Current blockchain height'
  });

  private blockTime = new client.Histogram({
    name: 'emotionalchain_block_time_seconds',
    help: 'Time between blocks in seconds',
    buckets: [5, 10, 15, 20, 30, 45, 60, 90, 120]
  });

  private transactionThroughput = new client.Counter({
    name: 'emotionalchain_transactions_total',
    help: 'Total number of transactions processed',
    labelNames: ['transaction_type', 'status']
  });

  private emoTokenMetrics = new client.Gauge({
    name: 'emotionalchain_emo_token_supply',
    help: 'EMO token supply metrics',
    labelNames: ['pool_type'] // staking, wellness, ecosystem, circulating
  });

  // Performance Metrics
  private databaseQueryDuration = new client.Histogram({
    name: 'emotionalchain_database_query_duration_seconds',
    help: 'Database query execution time',
    labelNames: ['query_type', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0]
  });

  private cacheHitRate = new client.Gauge({
    name: 'emotionalchain_cache_hit_rate',
    help: 'Cache hit rate percentage',
    labelNames: ['cache_type']
  });

  private memoryUsage = new client.Gauge({
    name: 'emotionalchain_memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['component']
  });

  // Security Metrics
  private byzantineFailures = new client.Counter({
    name: 'emotionalchain_byzantine_failures_total',
    help: 'Total Byzantine failures detected',
    labelNames: ['failure_type', 'validator_id']
  });

  private securityAlerts = new client.Counter({
    name: 'emotionalchain_security_alerts_total',
    help: 'Total security alerts triggered',
    labelNames: ['alert_type', 'severity']
  });

  constructor() {
    super();
    
    // Register all metrics
    client.register.registerMetric(this.consensusRoundDuration);
    client.register.registerMetric(this.consensusSuccessRate);
    client.register.registerMetric(this.consensusFailureRate);
    client.register.registerMetric(this.activeValidators);
    client.register.registerMetric(this.validatorEmotionalScore);
    client.register.registerMetric(this.validatorParticipationRate);
    client.register.registerMetric(this.biometricReadingsPerSecond);
    client.register.registerMetric(this.biometricDeviceHealth);
    client.register.registerMetric(this.biometricAuthenticityScore);
    client.register.registerMetric(this.p2pConnectedPeers);
    client.register.registerMetric(this.p2pMessageLatency);
    client.register.registerMetric(this.networkThroughput);
    client.register.registerMetric(this.blockHeight);
    client.register.registerMetric(this.blockTime);
    client.register.registerMetric(this.transactionThroughput);
    client.register.registerMetric(this.emoTokenMetrics);
    client.register.registerMetric(this.databaseQueryDuration);
    client.register.registerMetric(this.cacheHitRate);
    client.register.registerMetric(this.memoryUsage);
    client.register.registerMetric(this.byzantineFailures);
    client.register.registerMetric(this.securityAlerts);

    console.log('📊 EmotionalChain Prometheus metrics initialized');
  }

  // Consensus Metrics Methods
  recordConsensusRound(duration: number, success: boolean, roundType: string = 'standard') {
    this.consensusRoundDuration
      .labels(roundType, success.toString())
      .observe(duration);
      
    if (success) {
      this.consensusSuccessRate.labels('21-50').inc(); // Default range
    } else {
      this.consensusFailureRate.labels('unknown').inc();
    }
  }

  recordConsensusFailure(reason: string) {
    this.consensusFailureRate.labels(reason).inc();
    this.emit('consensus-failure', { reason, timestamp: Date.now() });
  }

  // Validator Metrics Methods
  updateActiveValidators(count: number, region: string = 'global') {
    this.activeValidators.labels(region).set(count);
  }

  recordValidatorEmotionalScore(validatorId: string, score: number) {
    this.validatorEmotionalScore.labels(validatorId).observe(score);
  }

  updateValidatorParticipation(validatorId: string, rate: number, timeWindow: string = '1h') {
    this.validatorParticipationRate.labels(validatorId, timeWindow).set(rate);
  }

  // Biometric Metrics Methods
  recordBiometricReading(deviceType: string, qualityLevel: string, validatorId: string) {
    this.biometricReadingsPerSecond.labels(deviceType, qualityLevel, validatorId).inc();
  }

  updateBiometricDeviceHealth(deviceId: string, deviceType: string, validatorId: string, health: number) {
    this.biometricDeviceHealth.labels(deviceId, deviceType, validatorId).set(health);
  }

  recordBiometricAuthenticity(deviceType: string, authenticity: number) {
    this.biometricAuthenticityScore.labels(deviceType).observe(authenticity);
  }

  // Network Metrics Methods
  updateConnectedPeers(nodeId: string, count: number, connectionType: string = 'tcp') {
    this.p2pConnectedPeers.labels(nodeId, connectionType).set(count);
  }

  recordMessageLatency(messageType: string, latency: number, sourceRegion?: string, targetRegion?: string) {
    this.p2pMessageLatency
      .labels(messageType, sourceRegion || 'unknown', targetRegion || 'unknown')
      .observe(latency);
  }

  recordNetworkThroughput(bytes: number, direction: 'inbound' | 'outbound', messageType: string) {
    this.networkThroughput.labels(direction, messageType).inc(bytes);
  }

  // Blockchain Metrics Methods
  updateBlockHeight(height: number) {
    this.blockHeight.set(height);
  }

  recordBlockTime(seconds: number) {
    this.blockTime.observe(seconds);
  }

  recordTransaction(type: string, status: 'confirmed' | 'failed' | 'pending') {
    this.transactionThroughput.labels(type, status).inc();
  }

  updateEMOTokenSupply(poolType: string, amount: number) {
    this.emoTokenMetrics.labels(poolType).set(amount);
  }

  // Performance Metrics Methods
  recordDatabaseQuery(queryType: string, table: string, duration: number) {
    this.databaseQueryDuration.labels(queryType, table).observe(duration);
  }

  updateCacheHitRate(cacheType: string, rate: number) {
    this.cacheHitRate.labels(cacheType).set(rate);
  }

  updateMemoryUsage(component: string, bytes: number) {
    this.memoryUsage.labels(component).set(bytes);
  }

  // Security Metrics Methods
  recordByzantineFailure(failureType: string, validatorId: string) {
    this.byzantineFailures.labels(failureType, validatorId).inc();
    this.emit('byzantine-failure', { failureType, validatorId, timestamp: Date.now() });
  }

  recordSecurityAlert(alertType: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.securityAlerts.labels(alertType, severity).inc();
    this.emit('security-alert', { alertType, severity, timestamp: Date.now() });
  }

  // Utility Methods
  getMetrics(): string {
    return client.register.metrics();
  }

  getMetricsAsJSON() {
    return client.register.getMetricsAsJSON();
  }

  reset() {
    client.register.resetMetrics();
  }

  // Comprehensive system health check
  getSystemHealth(): {
    consensus: number;
    network: number;
    biometric: number;
    overall: number;
  } {
    // This would calculate health scores based on various metrics
    // For now, return mock values
    return {
      consensus: 0.95,
      network: 0.92,
      biometric: 0.88,
      overall: 0.92
    };
  }

  // Start automatic metrics collection
  startPeriodicCollection(intervalMs: number = 30000) {
    setInterval(() => {
      // Collect system metrics periodically
      const memUsage = process.memoryUsage();
      this.updateMemoryUsage('heap_used', memUsage.heapUsed);
      this.updateMemoryUsage('heap_total', memUsage.heapTotal);
      this.updateMemoryUsage('rss', memUsage.rss);
      
      this.emit('metrics-collected', { timestamp: Date.now() });
    }, intervalMs);
    
    console.log(`🔄 Started periodic metrics collection (${intervalMs}ms interval)`);
  }
}

// Singleton instance
export const metrics = new EmotionalChainMetrics();