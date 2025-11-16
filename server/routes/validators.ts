/**
 * Validator Management API Routes
 * Handles tier assignment, bandwidth testing, and performance monitoring
 */

import express from 'express';
import { hierarchicalConsensus, ValidatorTier, TIER_REQUIREMENTS } from '@shared/consensus/hierarchicalValidators';
import { bandwidthMonitor } from '../monitoring/bandwidthMonitor';
import { optimizedP2P } from '../p2p/optimizedGossip';

const router = express.Router();

/**
 * GET /api/validators/tiers
 * Get all validators organized by tier
 */
router.get('/tiers', async (req, res) => {
  try {
    const stats = await hierarchicalConsensus.getTierStats();
    res.json({
      success: true,
      tiers: stats,
      requirements: TIER_REQUIREMENTS,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tier stats',
    });
  }
});

/**
 * GET /api/validators/:address/tier
 * Get tier information for a specific validator
 */
router.get('/:address/tier', async (req, res) => {
  try {
    const { address } = req.params;
    const validators = await hierarchicalConsensus.getAllValidators();
    const validator = validators.find(v => v.address === address);
    
    if (!validator) {
      return res.status(404).json({
        success: false,
        error: 'Validator not found',
      });
    }
    
    const performance = await bandwidthMonitor.getPerformance(address, validator.tier);
    
    res.json({
      success: true,
      validator: {
        address: validator.address,
        tier: validator.tier,
        stakedAmount: validator.stakedAmount.toString(),
        bandwidth: validator.bandwidth,
        uptime: validator.uptime,
        performance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get validator tier',
    });
  }
});

/**
 * POST /api/validators/:address/bandwidth-test
 * Run bandwidth test for a validator
 */
router.post('/:address/bandwidth-test', async (req, res) => {
  try {
    const { address } = req.params;
    const measurement = await bandwidthMonitor.testBandwidth(address);
    
    res.json({
      success: true,
      measurement: {
        validatorId: measurement.validatorId,
        timestamp: measurement.timestamp,
        downloadSpeedKBps: measurement.downloadSpeedKBps,
        uploadSpeedKBps: measurement.uploadSpeedKBps,
        latencyMs: measurement.latencyMs,
        packetLoss: measurement.packetLoss,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run bandwidth test',
    });
  }
});

/**
 * POST /api/validators/:address/reassess-tier
 * Reassess validator tier based on current performance
 */
router.post('/:address/reassess-tier', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await hierarchicalConsensus.updateValidatorTier(address);
    
    res.json({
      success: true,
      result: {
        oldTier: result.oldTier,
        newTier: result.newTier,
        promoted: result.promoted,
        tierName: {
          1: 'PRIMARY',
          2: 'SECONDARY',
          3: 'LIGHT',
        }[result.newTier],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reassess tier',
    });
  }
});

/**
 * POST /api/validators/reassess-all
 * Batch reassess all validators
 */
router.post('/reassess-all', async (req, res) => {
  try {
    const result = await hierarchicalConsensus.reassessAllValidators();
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reassess all validators',
    });
  }
});

/**
 * GET /api/validators/bandwidth-stats
 * Get bandwidth statistics for all validators
 */
router.get('/bandwidth-stats', async (req, res) => {
  try {
    const stats = bandwidthMonitor.getBandwidthStatistics();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bandwidth stats',
    });
  }
});

/**
 * GET /api/validators/network-stats
 * Get P2P network statistics
 */
router.get('/network-stats', async (req, res) => {
  try {
    const stats = optimizedP2P.getNetworkStats();
    const config = optimizedP2P.getConfig();
    const topics = optimizedP2P.getTopics();
    
    res.json({
      success: true,
      network: {
        stats,
        config,
        topics,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get network stats',
    });
  }
});

/**
 * GET /api/validators/tier-requirements
 * Get tier requirements
 */
router.get('/tier-requirements', (req, res) => {
  try {
    const requirements = hierarchicalConsensus.getBandwidthRequirements();
    
    res.json({
      success: true,
      requirements: {
        [ValidatorTier.PRIMARY]: {
          ...TIER_REQUIREMENTS[ValidatorTier.PRIMARY],
          description: requirements[ValidatorTier.PRIMARY],
        },
        [ValidatorTier.SECONDARY]: {
          ...TIER_REQUIREMENTS[ValidatorTier.SECONDARY],
          description: requirements[ValidatorTier.SECONDARY],
        },
        [ValidatorTier.LIGHT]: {
          ...TIER_REQUIREMENTS[ValidatorTier.LIGHT],
          description: requirements[ValidatorTier.LIGHT],
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tier requirements',
    });
  }
});

export default router;
