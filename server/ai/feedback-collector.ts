// AI Feedback Collection System for Learning Loop
import { db } from '../db';
import { aiTrainingEvents, InsertAiTrainingEvent } from '@shared/schema';
import { CONFIG } from '../../shared/config';

export interface ValidatorFeedbackData {
  validatorId: string;
  
  // Emotional Pattern Input
  emotionalScore: number;
  consensusScore: number;
  authenticity: number;
  deviation: number;
  historicalAverage: number;
  timeOfDay: number;
  
  // AI Prediction Results
  anomalyPrediction: number;
  anomalyType: string;
  confidence: number;
  adjustedWeight: number;
  originalWeight: number;
  
  // Actual Outcomes (Ground Truth)
  finalBlockReward?: number;
  validatorPerformance?: number;
  consensusParticipation: boolean;
  blockCreatedSuccessfully?: boolean;
  
  // System Response
  systemAction: 'proceed' | 'reduce_weight' | 'exclude' | 'investigate';
  rewardFairness?: number;
  emotionDrift?: number;
  
  // Context
  contextData?: any;
}

export class AIFeedbackCollector {
  private static instance: AIFeedbackCollector;
  private currentModelVersion = '1.0.0';
  private currentTrainingRound = 0;

  public static getInstance(): AIFeedbackCollector {
    if (!AIFeedbackCollector.instance) {
      AIFeedbackCollector.instance = new AIFeedbackCollector();
    }
    return AIFeedbackCollector.instance;
  }

  /**
   * Collect feedback from a consensus round with AI predictions and actual outcomes
   */
  async collectFeedback(feedbackData: ValidatorFeedbackData): Promise<void> {
    try {
      // Calculate additional metrics
      const rewardFairness = this.calculateRewardFairness(feedbackData);
      const emotionDrift = this.calculateEmotionDrift(feedbackData);
      
      // Prepare training event data
      const trainingEvent: InsertAiTrainingEvent = {
        validatorId: feedbackData.validatorId,
        
        // Emotional patterns
        emotionalScore: feedbackData.emotionalScore,
        consensusScore: feedbackData.consensusScore,
        authenticity: feedbackData.authenticity,
        deviation: feedbackData.deviation,
        historicalAverage: feedbackData.historicalAverage,
        timeOfDay: feedbackData.timeOfDay,
        
        // AI predictions
        anomalyPrediction: feedbackData.anomalyPrediction,
        anomalyType: feedbackData.anomalyType,
        confidence: feedbackData.confidence,
        adjustedWeight: feedbackData.adjustedWeight,
        originalWeight: feedbackData.originalWeight,
        
        // Actual outcomes
        finalBlockReward: feedbackData.finalBlockReward,
        validatorPerformance: feedbackData.validatorPerformance,
        consensusParticipation: feedbackData.consensusParticipation,
        blockCreatedSuccessfully: feedbackData.blockCreatedSuccessfully,
        
        // System response
        systemAction: feedbackData.systemAction,
        rewardFairness: rewardFairness,
        emotionDrift: emotionDrift,
        
        // Learning metadata
        modelVersion: this.currentModelVersion,
        trainingRound: this.currentTrainingRound,
        feedbackProcessed: false,
        
        // Context
        contextData: feedbackData.contextData || {}
      };

      // Store in database
      await db.insert(aiTrainingEvents).values(trainingEvent);

      // Check if we should trigger retraining
      await this.checkRetrainingTrigger();

    } catch (error) {
      console.error('Failed to collect AI feedback:', error);
      throw error;
    }
  }

  /**
   * Collect batch feedback from multiple validators in a single consensus round
   */
  async collectBatchFeedback(feedbackBatch: ValidatorFeedbackData[]): Promise<void> {
    const trainingEvents: InsertAiTrainingEvent[] = [];

    for (const feedbackData of feedbackBatch) {
      const rewardFairness = this.calculateRewardFairness(feedbackData);
      const emotionDrift = this.calculateEmotionDrift(feedbackData);

      trainingEvents.push({
        validatorId: feedbackData.validatorId,
        emotionalScore: feedbackData.emotionalScore,
        consensusScore: feedbackData.consensusScore,
        authenticity: feedbackData.authenticity,
        deviation: feedbackData.deviation,
        historicalAverage: feedbackData.historicalAverage,
        timeOfDay: feedbackData.timeOfDay,
        anomalyPrediction: feedbackData.anomalyPrediction,
        anomalyType: feedbackData.anomalyType,
        confidence: feedbackData.confidence,
        adjustedWeight: feedbackData.adjustedWeight,
        originalWeight: feedbackData.originalWeight,
        finalBlockReward: feedbackData.finalBlockReward,
        validatorPerformance: feedbackData.validatorPerformance,
        consensusParticipation: feedbackData.consensusParticipation,
        blockCreatedSuccessfully: feedbackData.blockCreatedSuccessfully,
        systemAction: feedbackData.systemAction,
        rewardFairness: rewardFairness,
        emotionDrift: emotionDrift,
        modelVersion: this.currentModelVersion,
        trainingRound: this.currentTrainingRound,
        feedbackProcessed: false,
        contextData: feedbackData.contextData || {}
      });
    }

    // Batch insert for efficiency
    if (trainingEvents.length > 0) {
      await db.insert(aiTrainingEvents).values(trainingEvents);
      await this.checkRetrainingTrigger();
    }
  }

  /**
   * Calculate reward fairness based on prediction accuracy vs actual performance
   */
  private calculateRewardFairness(feedback: ValidatorFeedbackData): number {
    if (!feedback.finalBlockReward || !feedback.validatorPerformance) {
      return 1.0; // Neutral if no reward data
    }

    // Expected reward based on performance (normalized 0-1)
    const expectedReward = feedback.validatorPerformance / 100;
    
    // Actual reward normalized
    const maxPossibleReward = CONFIG.blockchain.blockReward;
    const actualReward = feedback.finalBlockReward / maxPossibleReward;
    
    // Fairness is inverse of the absolute difference
    const difference = Math.abs(expectedReward - actualReward);
    return Math.max(0, 1 - difference);
  }

  /**
   * Calculate emotional drift between prediction time and outcome time
   */
  private calculateEmotionDrift(feedback: ValidatorFeedbackData): number {
    // This would normally compare emotional scores before and after the event
    // For now, we'll use a simulated drift based on system action severity
    switch (feedback.systemAction) {
      case 'exclude':
        return -30; // Large negative drift for exclusions
      case 'reduce_weight':
        return -15; // Moderate negative drift
      case 'investigate':
        return -10; // Small negative drift
      case 'proceed':
      default:
        const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
        return (randomByte / 255) * 10 - 5; // Random small drift for normal operation
    }
  }

  /**
   * Check if retraining should be triggered based on collected feedback
   */
  private async checkRetrainingTrigger(): Promise<void> {
    try {
      // Count unprocessed feedback events
      const unprocessedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiTrainingEvents)
        .where(sql`feedback_processed = false`);

      const count = unprocessedCount[0]?.count || 0;

      // Trigger retraining if we have enough new data
      if (count >= CONFIG.ai.minTrainingDataSize) {
        // Send signal to retraining system (could be event, queue, etc.)
        console.log(`AI retraining trigger: ${count} unprocessed feedback events collected`);
        
        // You could implement actual retraining trigger here:
        // - Emit event to retraining service
        // - Add to job queue
        // - Set flag for cron job to pick up
      }
    } catch (error) {
      console.error('Failed to check retraining trigger:', error);
    }
  }

  /**
   * Get feedback statistics for monitoring
   */
  async getFeedbackStats(): Promise<{
    totalEvents: number;
    unprocessedEvents: number;
    averageRewardFairness: number;
    averageEmotionDrift: number;
    lastCollectedAt: Date | null;
  }> {
    try {
      const [totalResult, unprocessedResult, avgFairnessResult, avgDriftResult, lastEventResult] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(aiTrainingEvents),
        db.select({ count: sql<number>`count(*)` }).from(aiTrainingEvents).where(sql`feedback_processed = false`),
        db.select({ avg: sql<number>`avg(reward_fairness)` }).from(aiTrainingEvents).where(sql`reward_fairness IS NOT NULL`),
        db.select({ avg: sql<number>`avg(emotion_drift)` }).from(aiTrainingEvents).where(sql`emotion_drift IS NOT NULL`),
        db.select({ createdAt: aiTrainingEvents.createdAt }).from(aiTrainingEvents).orderBy(sql`created_at DESC`).limit(1)
      ]);

      return {
        totalEvents: totalResult[0]?.count || 0,
        unprocessedEvents: unprocessedResult[0]?.count || 0,
        averageRewardFairness: avgFairnessResult[0]?.avg || 1.0,
        averageEmotionDrift: avgDriftResult[0]?.avg || 0.0,
        lastCollectedAt: lastEventResult[0]?.createdAt || null
      };
    } catch (error) {
      console.error('Failed to get feedback stats:', error);
      return {
        totalEvents: 0,
        unprocessedEvents: 0,
        averageRewardFairness: 1.0,
        averageEmotionDrift: 0.0,
        lastCollectedAt: null
      };
    }
  }

  /**
   * Update model version for future feedback collection
   */
  updateModelVersion(version: string, trainingRound: number): void {
    this.currentModelVersion = version;
    this.currentTrainingRound = trainingRound;
  }

  /**
   * Clear old feedback data (for maintenance)
   */
  async clearOldFeedback(daysOld = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await db
      .delete(aiTrainingEvents)
      .where(sql`created_at < ${cutoffDate} AND feedback_processed = true`);

    return result.rowCount || 0;
  }
}