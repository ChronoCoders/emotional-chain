/**
 * API routes for real cryptographic performance metrics
 */
import { Router } from 'express';
import { CryptoPerformanceMonitor } from '../monitoring/CryptoPerformanceMonitor';

const router = Router();

/**
 * GET /api/crypto/performance
 * Returns real-time cryptographic performance metrics
 */
router.get('/performance', (req, res) => {
  try {
    const monitor = CryptoPerformanceMonitor.getInstance();
    const report = monitor.getPerformanceReport();
    
    res.json({
      success: true,
      data: {
        ...report,
        timestamp: new Date().toISOString(),
        description: "Real cryptographic work measurements from EmotionalChain operations"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get crypto performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/crypto/hashrate
 * Returns current real hashrate equivalent
 */
router.get('/hashrate', (req, res) => {
  try {
    const monitor = CryptoPerformanceMonitor.getInstance();
    const metrics = monitor.getMetrics();
    const hashrateEquivalent = monitor.getHashrateEquivalent();
    
    res.json({
      success: true,
      data: {
        hashrateEquivalent,
        rawMetrics: {
          hashOpsPerSec: metrics.hashOperationsPerSecond.toFixed(2),
          ecdsaOpsPerSec: metrics.ecdsaOperationsPerSecond.toFixed(2),
          nonceAttemptsPerSec: metrics.nonceAttemptsPerSecond.toFixed(2),
          totalComputationalPower: metrics.totalComputationalPower.toFixed(2)
        },
        isReal: true,
        description: "Measured from actual SHA-256, ECDSA, and nonce operations"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get hashrate metrics'
    });
  }
});

/**
 * POST /api/crypto/reset
 * Reset performance counters (for testing)
 */
router.post('/reset', (req, res) => {
  try {
    const monitor = CryptoPerformanceMonitor.getInstance();
    monitor.reset();
    
    res.json({
      success: true,
      message: 'Performance counters reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset performance counters'
    });
  }
});

export default router;