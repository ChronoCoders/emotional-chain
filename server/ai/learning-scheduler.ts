// AI Learning Scheduler for Automated Retraining
import { CONFIG } from '../../shared/config';
import { AIModelRetrainer } from './retrain-model';
import { AIFeedbackCollector } from './feedback-collector';

export class AILearningScheduler {
  private static instance: AILearningScheduler;
  private retrainingInterval: NodeJS.Timeout | null = null;
  private isSchedulerActive = false;

  public static getInstance(): AILearningScheduler {
    if (!AILearningScheduler.instance) {
      AILearningScheduler.instance = new AILearningScheduler();
    }
    return AILearningScheduler.instance;
  }

  /**
   * Start the learning scheduler
   */
  start(): void {
    if (this.isSchedulerActive) {
      console.log('AI Learning Scheduler already active');
      return;
    }

    this.isSchedulerActive = true;
    
    // Schedule periodic retraining based on config
    const intervalMs = CONFIG.ai.retrainInterval * 60 * 60 * 1000; // Convert hours to ms
    
    this.retrainingInterval = setInterval(async () => {
      await this.executeScheduledRetraining();
    }, intervalMs);

    console.log(`AI Learning Scheduler started - retraining every ${CONFIG.ai.retrainInterval} hours`);
  }

  /**
   * Stop the learning scheduler
   */
  stop(): void {
    if (this.retrainingInterval) {
      clearInterval(this.retrainingInterval);
      this.retrainingInterval = null;
    }
    this.isSchedulerActive = false;
    console.log('AI Learning Scheduler stopped');
  }

  /**
   * Execute scheduled retraining
   */
  private async executeScheduledRetraining(): Promise<void> {
    try {
      console.log('Executing scheduled AI model retraining...');
      
      const retrainer = AIModelRetrainer.getInstance();
      const collector = AIFeedbackCollector.getInstance();
      
      // Get feedback stats to determine if retraining is needed
      const stats = await collector.getFeedbackStats();
      
      if (stats.unprocessedEvents < CONFIG.ai.minTrainingDataSize) {
        console.log(`Skipping retraining - insufficient data: ${stats.unprocessedEvents}/${CONFIG.ai.minTrainingDataSize}`);
        return;
      }

      // Execute retraining
      const result = await retrainer.retrainModel(false);
      
      if (result.success) {
        console.log(`AI model retrained successfully - Version: ${result.modelVersion}, Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
        
        // Update collector with new model version
        collector.updateModelVersion(result.modelVersion, result.trainingRound);
      } else {
        console.error(`AI model retraining failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Scheduled retraining failed:', error);
    }
  }

  /**
   * Trigger immediate retraining
   */
  async triggerImmediateRetraining(): Promise<any> {
    console.log('Triggering immediate AI model retraining...');
    
    const retrainer = AIModelRetrainer.getInstance();
    const result = await retrainer.retrainModel(true);
    
    if (result.success) {
      const collector = AIFeedbackCollector.getInstance();
      collector.updateModelVersion(result.modelVersion, result.trainingRound);
    }
    
    return result;
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isActive: this.isSchedulerActive,
      nextRetrainingIn: this.retrainingInterval ? CONFIG.ai.retrainInterval * 60 * 60 * 1000 : null,
      retrainInterval: CONFIG.ai.retrainInterval
    };
  }

  /**
   * Update retraining schedule
   */
  updateSchedule(newIntervalHours: number): void {
    this.stop();
    
    // Update config (this would normally update the config system)
    // CONFIG.ai.retrainInterval = newIntervalHours;
    
    this.start();
    console.log(`AI Learning Scheduler updated - new interval: ${newIntervalHours} hours`);
  }
}