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
 * Get Prometheus-compatible metrics
 */
router.get('/metrics/prometheus', async (req, res) => {
  try {
    const [
      consensusHealth,
      validatorParticipation,
      systemPerformance
    ] = await Promise.all([
      systemMetrics.getConsensusHealth(),
      systemMetrics.getValidatorParticipationStats(),
      systemMetrics.getSystemPerformance()
    ]);

    // Generate Prometheus format metrics
    const metrics = [
      `# HELP emotionalchain_consensus_success_rate Consensus success rate percentage`,
      `# TYPE emotionalchain_consensus_success_rate gauge`,
      `emotionalchain_consensus_success_rate ${consensusHealth.metrics.consensusSuccessRate}`,
      ``,
      `# HELP emotionalchain_active_validators Number of active validators`,
      `# TYPE emotionalchain_active_validators gauge`,
      `emotionalchain_active_validators ${validatorParticipation.activeValidators}`,
      ``,
      `# HELP emotionalchain_participation_rate Validator participation rate`,
      `# TYPE emotionalchain_participation_rate gauge`,
      `emotionalchain_participation_rate ${consensusHealth.metrics.participationRate}`,
      ``,
      `# HELP emotionalchain_block_height Current block height`,
      `# TYPE emotionalchain_block_height counter`,
      `emotionalchain_block_height ${consensusHealth.metrics.blockHeight}`,
      ``,
      `# HELP emotionalchain_average_block_time Average block time in seconds`,
      `# TYPE emotionalchain_average_block_time gauge`,
      `emotionalchain_average_block_time ${consensusHealth.metrics.averageBlockTime}`,
      ``,
      `# HELP emotionalchain_system_uptime System uptime in seconds`,
      `# TYPE emotionalchain_system_uptime counter`,
      `emotionalchain_system_uptime ${systemPerformance.uptime}`,
      ``,
      `# HELP emotionalchain_cpu_usage CPU usage percentage`,
      `# TYPE emotionalchain_cpu_usage gauge`,
      `emotionalchain_cpu_usage ${systemPerformance.cpuUsage}`,
      ``,
      `# HELP emotionalchain_memory_usage Memory usage percentage`,
      `# TYPE emotionalchain_memory_usage gauge`,
      `emotionalchain_memory_usage ${systemPerformance.memoryUsage}`,
      ``
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate Prometheus metrics', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;