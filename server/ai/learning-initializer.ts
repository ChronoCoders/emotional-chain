// AI Learning System Initializer
import { AILearningScheduler } from './learning-scheduler';
import { AIFeedbackCollector } from './feedback-collector';
import { AIModelRetrainer } from './retrain-model';
import { CONFIG } from '../../shared/config';

export class AILearningInitializer {
  private static initialized = false;

  /**
   * Initialize the AI learning system components
   */
  public static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('AI Learning System already initialized');
      return;
    }

    try {
      console.log('Initializing AI Learning System...');

      // Initialize core components
      const scheduler = AILearningScheduler.getInstance();
      const collector = AIFeedbackCollector.getInstance();
      const retrainer = AIModelRetrainer.getInstance();

      // Start learning scheduler if enabled
      if (CONFIG.ai.enableAutoRetraining) {
        scheduler.start();
        console.log('✓ AI Learning Scheduler started');
      }

      // Initialize feedback collection
      console.log('✓ AI Feedback Collector initialized');

      // Get initial model status
      const modelInfo = retrainer.getCurrentModelInfo();
      console.log(`✓ AI Model Retrainer initialized - Version: ${modelInfo.version}`);

      this.initialized = true;
      console.log('AI Learning System initialization complete');

    } catch (error) {
      console.error('Failed to initialize AI Learning System:', error);
      throw error;
    }
  }

  /**
   * Shutdown the AI learning system
   */
  public static async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log('Shutting down AI Learning System...');

      const scheduler = AILearningScheduler.getInstance();
      scheduler.stop();

      this.initialized = false;
      console.log('AI Learning System shutdown complete');

    } catch (error) {
      console.error('Error during AI Learning System shutdown:', error);
    }
  }

  /**
   * Get system status
   */
  public static getStatus() {
    return {
      initialized: this.initialized,
      timestamp: new Date().toISOString()
    };
  }
}