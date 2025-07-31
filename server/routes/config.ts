/**
 * Internal Configuration Management API
 * Admin-only endpoints for configuration inspection and management
 */

import { Router } from 'express';
import { CONFIG, configHelpers } from '../../shared/config';
import { configAudit } from '../../shared/config.audit';
import { configFuzzer } from '../../shared/config.fuzzer';

const router = Router();

// Middleware for admin authentication (simplified for demo)
const requireAdmin = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-admin-api-key'];
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized - Admin API key required',
      hint: 'Set ADMIN_API_KEY environment variable and include X-Admin-API-Key header'
    });
  }
  
  // Log access for audit trail
  console.log(`🔐 Admin config access from ${req.ip} at ${new Date().toISOString()}`);
  next();
};

/**
 * GET /internal/config
 * Get current configuration (sanitized for security)
 */
router.get('/config', requireAdmin, (req, res) => {
  try {
    // Sanitize sensitive data
    const sanitizedConfig = {
      ...CONFIG,
      // Remove or mask sensitive information
      security: {
        ...CONFIG.security,
        authentication: {
          ...CONFIG.security.authentication,
          apiKeyLength: '[REDACTED]',
        },
      },
    };

    res.json({
      config: sanitizedConfig,
      metadata: {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        configVersion: '2.0.0',
        lastModified: 'On startup', // Would track this in production
      },
    });
  } catch (error) {
    console.error('Failed to get configuration:', error);
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
});

/**
 * GET /internal/config/validate
 * Validate current configuration
 */
router.get('/config/validate', requireAdmin, (req, res) => {
  try {
    // Re-validate current config
    const isValid = configHelpers.validateConfigChange({});
    
    res.json({
      valid: isValid,
      timestamp: Date.now(),
      validationDetails: {
        consensusQuorum: CONFIG.consensus.quorum.ratio >= 0.5 && CONFIG.consensus.quorum.ratio <= 1.0,
        networkTimeouts: CONFIG.network.timeouts.connection > 0,
        biometricThresholds: CONFIG.biometric.thresholds.authenticity.minimumScore >= 0.5,
        aiModelThresholds: CONFIG.ai.models.emotionalPredictor.threshold >= 0 && CONFIG.ai.models.emotionalPredictor.threshold <= 1,
      },
    });
  } catch (error) {
    console.error('Configuration validation failed:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Validation failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /internal/config/audit
 * Get configuration audit history
 */
router.get('/config/audit', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const snapshots = await configAudit.getSnapshotHistory(undefined, undefined, limit);
    const recentChanges = configAudit.getRecentChanges(20);

    res.json({
      snapshots,
      recentChanges,
      statistics: {
        totalSnapshots: snapshots.length,
        totalChanges: recentChanges.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to get audit history:', error);
    res.status(500).json({ error: 'Failed to retrieve audit history' });
  }
});

/**
 * POST /internal/config/snapshot
 * Create configuration snapshot
 */
router.post('/config/snapshot', requireAdmin, async (req, res) => {
  try {
    const { blockHeight, reason } = req.body;
    
    if (!blockHeight || typeof blockHeight !== 'number') {
      return res.status(400).json({ error: 'blockHeight is required and must be a number' });
    }

    const snapshotId = await configAudit.createSnapshot(
      CONFIG,
      blockHeight,
      reason || 'Manual snapshot',
      req.headers['x-admin-user-id'] as string
    );

    res.json({
      success: true,
      snapshotId,
      blockHeight,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    res.status(500).json({ error: 'Failed to create configuration snapshot' });
  }
});

/**
 * POST /internal/config/fuzz-test
 * Run configuration fuzz testing
 */
router.post('/config/fuzz-test', requireAdmin, async (req, res) => {
  try {
    const { iterations = 100, testSuite = 'api-request' } = req.body;
    
    if (iterations > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 iterations allowed per request' });
    }

    console.log(`🧪 Starting fuzz test: ${iterations} iterations`);
    
    const results = await configFuzzer.runFuzzTest(iterations, testSuite);
    const statistics = configFuzzer.getTestStatistics();

    res.json({
      success: true,
      results: results.slice(0, 10), // Return first 10 results
      statistics,
      timestamp: Date.now(),
      message: `Completed ${iterations} fuzz tests with ${statistics.successRate.toFixed(2)}% success rate`,
    });
  } catch (error) {
    console.error('Fuzz testing failed:', error);
    res.status(500).json({ error: 'Fuzz testing failed' });
  }
});

/**
 * GET /internal/config/health
 * Configuration health check
 */
router.get('/config/health', requireAdmin, (req, res) => {
  try {
    const health = {
      configValid: configHelpers.validateConfigChange({}),
      criticalThresholds: {
        consensusQuorum: CONFIG.consensus.quorum.ratio,
        emotionalThreshold: CONFIG.consensus.thresholds.emotionalScore,
        authenticityThreshold: CONFIG.biometric.thresholds.authenticity.minimumScore,
        aiModelAccuracy: CONFIG.ai.models.emotionalPredictor.accuracy,
      },
      networkSettings: {
        httpPort: CONFIG.network.ports.http,
        p2pPort: CONFIG.network.ports.p2p,
        websocketPort: CONFIG.network.ports.websocket,
        tlsRequired: CONFIG.network.protocols.tls.required,
      },
      performanceLimits: {
        maxTransactionsPerBlock: CONFIG.performance.limits.maxTransactionsPerBlock,
        maxBlockSize: CONFIG.performance.limits.maxBlockSize,
        maxValidatorsPerEpoch: CONFIG.performance.limits.maxValidatorsPerEpoch,
      },
      timestamp: Date.now(),
      status: 'healthy',
    };

    // Check for potential issues
    const warnings = [];
    
    if (CONFIG.consensus.quorum.ratio < 0.6) {
      warnings.push('Consensus quorum ratio below recommended minimum (0.6)');
    }
    
    if (CONFIG.ai.models.emotionalPredictor.accuracy < 0.85) {
      warnings.push('AI model accuracy below recommended threshold (0.85)');
    }
    
    if (!CONFIG.network.protocols.tls.required) {
      warnings.push('TLS not required - security risk in production');
    }

    if (warnings.length > 0) {
      health.status = 'warning';
      (health as any).warnings = warnings;
    }

    res.json(health);
  } catch (error) {
    console.error('Config health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: 'Health check failed',
      timestamp: Date.now(),
    });
  }
});

/**
 * GET /internal/config/diff/:blockHeight
 * Compare configuration at specific block with current
 */
router.get('/config/diff/:blockHeight', requireAdmin, async (req, res) => {
  try {
    const blockHeight = parseInt(req.params.blockHeight);
    
    if (isNaN(blockHeight)) {
      return res.status(400).json({ error: 'Invalid block height' });
    }

    const historicalConfig = await configAudit.getConfigAtBlock(blockHeight);
    
    if (!historicalConfig) {
      return res.status(404).json({ error: 'No configuration found for block height' });
    }

    const differences = configAudit.getConfigDiff(historicalConfig, CONFIG);

    res.json({
      blockHeight,
      differences,
      totalChanges: differences.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Config diff failed:', error);
    res.status(500).json({ error: 'Failed to generate configuration diff' });
  }
});

export default router;