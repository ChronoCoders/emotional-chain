import express from 'express';
import { systemMetrics } from '../monitoring/system-metrics';

const router = express.Router();

/**
 * GET /api/monitoring/consensus-health
 * Get comprehensive consensus health metrics
 */
router.get('/consensus-health', async (req, res) => {
  try {
    const healthData = await systemMetrics.getConsensusHealth();
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get consensus health', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/monitoring/validator-participation
 * Get detailed validator participation metrics
 */
router.get('/validator-participation', async (req, res) => {
  try {
    const participationData = await systemMetrics.getValidatorParticipationStats();
    res.json(participationData);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get validator participation', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/monitoring/consensus-rounds
 * Get consensus round statistics
 */
router.get('/consensus-rounds', async (req, res) => {
  try {
    const roundStats = await systemMetrics.getConsensusRoundStats();
    res.json(roundStats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get consensus round stats', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/monitoring/blockchain-stats
 * Get blockchain statistics
 */
router.get('/blockchain-stats', async (req, res) => {
  try {
    const blockchainStats = await systemMetrics.getBlockchainStats();
    res.json(blockchainStats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get blockchain stats', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/monitoring/system-performance
 * Get system performance metrics
 */
router.get('/system-performance', async (req, res) => {
  try {
    const performanceData = await systemMetrics.getSystemPerformance();
    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get system performance', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/monitoring/dashboard-data
 * Get comprehensive dashboard data for monitoring interface
 */
router.get('/dashboard-data', async (req, res) => {
  try {
    const [
      consensusHealth,
      validatorParticipation,
      consensusRounds,
      blockchainStats,
      systemPerformance
    ] = await Promise.all([
      systemMetrics.getConsensusHealth(),
      systemMetrics.getValidatorParticipationStats(),
      systemMetrics.getConsensusRoundStats(),
      systemMetrics.getBlockchainStats(),
      systemMetrics.getSystemPerformance()
    ]);

    res.json({
      timestamp: Date.now(),
      consensusHealth,
      validatorParticipation,
      consensusRounds,
      blockchainStats,
      systemPerformance,
      summary: {
        overallStatus: consensusHealth.status,
        criticalAlerts: consensusHealth.alerts.filter(a => a.level === 'critical').length,
        warningAlerts: consensusHealth.alerts.filter(a => a.level === 'warning').length,
        activeValidators: validatorParticipation.activeValidators,
        consensusSuccessRate: (consensusRounds.successfulRounds / Math.max(1, consensusRounds.totalRounds) * 100).toFixed(1),
        systemUptime: Math.floor(systemPerformance.uptime / 3600) // hours
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get dashboard data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get active system alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const healthData = await systemMetrics.getConsensusHealth();
    const participationData = await systemMetrics.getValidatorParticipationStats();
    
    const alerts = [...healthData.alerts];
    
    // Add validator-specific alerts
    const inactiveValidators = participationData.validatorDetails.filter(v => v.status === 'inactive');
    if (inactiveValidators.length > 0) {
      alerts.push({
        level: 'warning' as const,
        message: `${inactiveValidators.length} validators are inactive`,
        timestamp: Date.now()
      });
    }
    
    const degradedValidators = participationData.validatorDetails.filter(v => v.status === 'degraded');
    if (degradedValidators.length > 0) {
      alerts.push({
        level: 'warning' as const,
        message: `${degradedValidators.length} validators showing degraded performance`,
        timestamp: Date.now()
      });
    }
    
    res.json({
      alerts: alerts.sort((a, b) => b.timestamp - a.timestamp),
      summary: {
        critical: alerts.filter(a => a.level === 'critical').length,
        warning: alerts.filter(a => a.level === 'warning').length,
        total: alerts.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get alerts', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/monitoring/metrics/prometheus
 * Get comprehensive Prometheus-compatible metrics
 */
router.get('/metrics/prometheus', async (req, res) => {
  try {
    // Import the production Prometheus integration
    const { prometheusIntegration } = await import('../monitoring/prometheus-integration');
    
    // Get comprehensive metrics from the production system
    const metricsOutput = await prometheusIntegration.getMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metricsOutput);
  } catch (error) {
    console.error('Prometheus metrics error:', error);
    
    // Fallback to basic metrics if production system fails
    const [
      consensusHealth,
      validatorParticipation,
      systemPerformance
    ] = await Promise.all([
      systemMetrics.getConsensusHealth(),
      systemMetrics.getValidatorParticipationStats(),
      systemMetrics.getSystemPerformance()
    ]);

    // Generate basic Prometheus format metrics as fallback
    const basicMetrics = [
      `# HELP emotionalchain_consensus_success_rate Consensus success rate (0-1)`,
      `# TYPE emotionalchain_consensus_success_rate gauge`,
      `emotionalchain_consensus_success_rate{status="${consensusHealth.status}"} ${consensusHealth.metrics.consensusSuccessRate}`,
      ``,
      `# HELP emotionalchain_active_validators_total Number of active validators`,
      `# TYPE emotionalchain_active_validators_total gauge`,
      `emotionalchain_active_validators_total{region="global",status="active"} ${validatorParticipation.activeValidators}`,
      `emotionalchain_active_validators_total{region="global",status="total"} ${validatorParticipation.totalValidators}`,
      ``,
      `# HELP emotionalchain_block_height Current block height`,
      `# TYPE emotionalchain_block_height gauge`,
      `emotionalchain_block_height ${consensusHealth.metrics.blockHeight}`,
      ``,
      `# HELP emotionalchain_system_uptime_seconds System uptime in seconds`,
      `# TYPE emotionalchain_system_uptime_seconds gauge`,
      `emotionalchain_system_uptime_seconds ${systemPerformance.uptime}`,
      ``,
      `# HELP emotionalchain_memory_usage_bytes Memory usage in bytes`,
      `# TYPE emotionalchain_memory_usage_bytes gauge`,
      `emotionalchain_memory_usage_bytes{component="heap_used"} ${process.memoryUsage().heapUsed}`,
      `emotionalchain_memory_usage_bytes{component="heap_total"} ${process.memoryUsage().heapTotal}`,
      ``
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(basicMetrics);
  }
});

export default router;