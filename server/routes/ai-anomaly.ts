// AI Anomaly Detection API Routes
import express from 'express';
import { aiConsensusIntegration } from '../ai/consensus-integration';
import { anomalyDetectionEngine } from '../ai/anomaly-detection';
import { emotionalChainService } from '../services/emotionalchain';

const router = express.Router();

// Get AI anomaly detection status
router.get('/status', async (req, res) => {
  try {
    const aiMetrics = aiConsensusIntegration.getAIMetrics();
    const modelMetrics = anomalyDetectionEngine.getModelMetrics();
    
    res.json({
      status: 'operational',
      model: modelMetrics,
      metrics: aiMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get AI status',
      message: (error as Error).message 
    });
  }
});

// Get consensus round analysis
router.get('/consensus/analysis', async (req, res) => {
  try {
    const validators = await emotionalChainService.getValidators();
    const roundData = {
      roundId: `round_${Date.now()}`,
      validators: validators.map(v => ({
        validatorId: v.id,
        emotionalScore: 75, // Use default emotional score
        consensusScore: 75, // Use default consensus score
        authenticity: 95,
        balance: v.balance,
        isActive: v.isActive,
        lastValidation: new Date().toISOString()
      })),
      blockHeight: 1000, // Default block height
      timestamp: Date.now()
    };

    const analysis = await aiConsensusIntegration.validateConsensusRound(roundData);
    
    res.json({
      analysis,
      roundData: {
        roundId: roundData.roundId,
        totalValidators: roundData.validators.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to analyze consensus round',
      message: (error as Error).message 
    });
  }
});

// Get anomaly history for a validator
router.get('/validator/:validatorId/history', async (req, res) => {
  try {
    const { validatorId } = req.params;
    const history = aiConsensusIntegration.getAnomalyHistory(validatorId);
    
    res.json({
      validatorId,
      anomalyHistory: history,
      totalAnomalies: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get validator anomaly history',
      message: (error as Error).message 
    });
  }
});

// Get last consensus adjustments
router.get('/consensus/adjustments', async (req, res) => {
  try {
    const adjustments = aiConsensusIntegration.getLastConsensusAdjustments();
    
    res.json({
      adjustments,
      summary: {
        total: adjustments.length,
        anomaliesDetected: adjustments.filter(a => a.anomalyDetected).length,
        criticalAnomalies: adjustments.filter(a => a.adjustedWeight === 0).length,
        averageConfidence: adjustments.reduce((sum, a) => sum + a.confidence, 0) / Math.max(adjustments.length, 1)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get consensus adjustments',
      message: (error as Error).message 
    });
  }
});

// Trigger model retraining
router.post('/model/retrain', async (req, res) => {
  try {
    await anomalyDetectionEngine.retrainModel();
    const metrics = anomalyDetectionEngine.getModelMetrics();
    
    res.json({
      status: 'retraining_completed',
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrain model',
      message: (error as Error).message 
    });
  }
});

export default router;