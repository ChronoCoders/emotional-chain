// AI Learning and Feedback Loop API Routes
import { Router } from 'express';
import { AIModelRetrainer } from '../ai/retrain-model';
import { AIFeedbackCollector } from '../ai/feedback-collector';
import { AILearningScheduler } from '../ai/learning-scheduler';
import { db } from '../db';
import { aiTrainingEvents, aiLearningMetrics } from '@shared/schema';
import { desc, count, sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/ai/learning/status
 * Get AI learning system status
 */
router.get('/status', async (req, res) => {
  try {
    const retrainer = AIModelRetrainer.getInstance();
    const collector = AIFeedbackCollector.getInstance();
    const scheduler = AILearningScheduler.getInstance();

    const [modelInfo, feedbackStats, schedulerStatus] = await Promise.all([
      retrainer.getCurrentModelInfo(),
      collector.getFeedbackStats(),
      scheduler.getStatus()
    ]);

    // Get latest training metrics
    const latestMetrics = await db
      .select()
      .from(aiLearningMetrics)
      .orderBy(desc(aiLearningMetrics.createdAt))
      .limit(1);

    res.json({
      status: 'active',
      model: modelInfo,
      feedback: feedbackStats,
      scheduler: schedulerStatus,
      latestMetrics: latestMetrics[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get learning status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/ai/learning/retrain
 * Trigger immediate model retraining
 */
router.post('/retrain', async (req, res) => {
  try {
    const { force = false } = req.body;
    
    const scheduler = AILearningScheduler.getInstance();
    const result = await scheduler.triggerImmediateRetraining();

    if (result.success) {
      res.json({
        success: true,
        message: 'Model retrained successfully',
        result: {
          modelVersion: result.modelVersion,
          trainingRound: result.trainingRound,
          metrics: result.metrics,
          trainingDetails: result.trainingDetails
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Model retraining failed',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to trigger retraining', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/ai/learning/metrics
 * Get training metrics history
 */
router.get('/metrics', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const metrics = await db
      .select()
      .from(aiLearningMetrics)
      .orderBy(desc(aiLearningMetrics.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get aggregate statistics
    const [totalModels, avgAccuracy, avgFairness, avgBias] = await Promise.all([
      db.select({ count: count() }).from(aiLearningMetrics),
      db.select({ avg: sql<number>`avg(accuracy)` }).from(aiLearningMetrics),
      db.select({ avg: sql<number>`avg(reward_fairness_score)` }).from(aiLearningMetrics),
      db.select({ avg: sql<number>`avg(bias_score)` }).from(aiLearningMetrics)
    ]);

    res.json({
      metrics,
      summary: {
        totalModels: totalModels[0]?.count || 0,
        averageAccuracy: avgAccuracy[0]?.avg || 0,
        averageFairness: avgFairness[0]?.avg || 0,
        averageBias: avgBias[0]?.avg || 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get learning metrics', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/ai/learning/feedback
 * Get feedback events for analysis
 */
router.get('/feedback', async (req, res) => {
  try {
    const { limit = 50, offset = 0, processed = 'all' } = req.query;
    
    let query = db.select().from(aiTrainingEvents);
    
    if (processed === 'true') {
      query = query.where(sql`processed = true`);
    } else if (processed === 'false') {
      query = query.where(sql`processed = false`);
    }
    
    const events = await query
      .orderBy(desc(aiTrainingEvents.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get feedback statistics
    const [totalEvents, processedEvents, avgFairness] = await Promise.all([
      db.select({ count: count() }).from(aiTrainingEvents),
      db.select({ count: count() }).from(aiTrainingEvents).where(sql`processed = true`),
      db.select({ avg: sql<number>`avg(fairness_score)` }).from(aiTrainingEvents).where(sql`fairness_score IS NOT NULL`)
    ]);

    res.json({
      events,
      summary: {
        totalEvents: totalEvents[0]?.count || 0,
        processedEvents: processedEvents[0]?.count || 0,
        unprocessedEvents: (totalEvents[0]?.count || 0) - (processedEvents[0]?.count || 0),
        averageFairness: avgFairness[0]?.avg || 0,
        averageDrift: avgDrift[0]?.avg || 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get feedback events', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/ai/learning/feedback
 * Collect feedback from consensus round
 */
router.post('/feedback', async (req, res) => {
  try {
    const feedbackData = req.body;
    
    // Validate required fields
    const requiredFields = [
      'validatorId', 'emotionalScore', 'consensusScore', 'authenticity',
      'deviation', 'historicalAverage', 'timeOfDay', 'anomalyPrediction',
      'anomalyType', 'confidence', 'adjustedWeight', 'originalWeight',
      'consensusParticipation', 'systemAction'
    ];

    for (const field of requiredFields) {
      if (feedbackData[field] === undefined || feedbackData[field] === null) {
        return res.status(400).json({ 
          error: `Missing required field: ${field}` 
        });
      }
    }

    const collector = AIFeedbackCollector.getInstance();
    await collector.collectFeedback(feedbackData);

    res.json({
      success: true,
      message: 'Feedback collected successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to collect feedback', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/ai/learning/feedback/batch
 * Collect batch feedback from multiple validators
 */
router.post('/feedback/batch', async (req, res) => {
  try {
    const { feedbackBatch } = req.body;
    
    if (!Array.isArray(feedbackBatch)) {
      return res.status(400).json({ 
        error: 'feedbackBatch must be an array' 
      });
    }

    const collector = AIFeedbackCollector.getInstance();
    await collector.collectBatchFeedback(feedbackBatch);

    res.json({
      success: true,
      message: `Batch feedback collected for ${feedbackBatch.length} validators`
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to collect batch feedback', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * PUT /api/ai/learning/scheduler
 * Update learning scheduler configuration
 */
router.put('/scheduler', async (req, res) => {
  try {
    const { intervalHours, active } = req.body;
    
    const scheduler = AILearningScheduler.getInstance();
    
    if (typeof active === 'boolean') {
      if (active) {
        scheduler.start();
      } else {
        scheduler.stop();
      }
    }
    
    if (typeof intervalHours === 'number' && intervalHours > 0) {
      scheduler.updateSchedule(intervalHours);
    }

    res.json({
      success: true,
      message: 'Scheduler updated successfully',
      status: scheduler.getStatus()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update scheduler', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * DELETE /api/ai/learning/feedback/old
 * Clean up old processed feedback data
 */
router.delete('/feedback/old', async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    
    const collector = AIFeedbackCollector.getInstance();
    const deletedCount = await collector.clearOldFeedback(parseInt(daysOld as string));

    res.json({
      success: true,
      message: `Deleted ${deletedCount} old feedback records`,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to clean up old feedback', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;