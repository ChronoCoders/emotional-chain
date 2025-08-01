// AI Model Retraining System for Dynamic Learning
import * as tf from '@tensorflow/tfjs-node';
import { db } from '../db';
import { aiTrainingEvents, aiLearningMetrics, InsertAiLearningMetrics } from '@shared/schema';
import { eq, desc, count, avg, sql } from 'drizzle-orm';
import { CONFIG } from '../../shared/config';
import { anomalyDetectionEngine } from './anomaly-detection';

// Suppress TensorFlow.js optimization messages
tf.env().set('WEBGL_CPU_FORWARD', false);
tf.enableProdMode();

export interface RetrainingResult {
  success: boolean;
  modelVersion: string;
  trainingRound: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rewardFairnessScore: number;
    biasScore: number;
    performanceImprovement: number;
  };
  trainingDetails: {
    epochs: number;
    learningRate: number;
    dataSize: number;
    validationSize: number;
    trainingLoss: number;
    validationLoss: number;
  };
  error?: string;
}

export class AIModelRetrainer {
  private static instance: AIModelRetrainer;
  private isRetraining = false;
  private currentModelVersion = '1.0.0';
  private trainingRound = 0;

  public static getInstance(): AIModelRetrainer {
    if (!AIModelRetrainer.instance) {
      AIModelRetrainer.instance = new AIModelRetrainer();
    }
    return AIModelRetrainer.instance;
  }

  /**
   * Main retraining function that orchestrates the entire learning process
   */
  async retrainModel(forceRetrain = false): Promise<RetrainingResult> {
    if (this.isRetraining && !forceRetrain) {
      throw new Error('Model retraining already in progress');
    }

    this.isRetraining = true;
    
    try {
      // 1. Check if retraining is needed
      const shouldRetrain = await this.shouldRetrain(forceRetrain);
      if (!shouldRetrain && !forceRetrain) {
        return {
          success: false,
          modelVersion: this.currentModelVersion,
          trainingRound: this.trainingRound,
          metrics: await this.getLastMetrics(),
          trainingDetails: {
            epochs: 0,
            learningRate: 0,
            dataSize: 0,
            validationSize: 0,
            trainingLoss: 0,
            validationLoss: 0
          },
          error: 'Retraining not required based on current metrics'
        };
      }

      // 2. Prepare training data from feedback events
      const trainingData = await this.prepareTrainingData();
      if (trainingData.features.length < CONFIG.ai.minTrainingDataSize) {
        throw new Error(`Insufficient training data: ${trainingData.features.length} samples, need ${CONFIG.ai.minTrainingDataSize}`);
      }

      // 3. Split data into training and validation sets
      const { trainData, validationData } = this.splitTrainingData(trainingData);

      // 4. Create and configure new model
      const model = this.createImprovedModel();

      // 5. Train the model with feedback data
      const trainingResult = await this.trainModel(model, trainData, validationData);

      // 6. Evaluate model performance
      const metrics = await this.evaluateModel(model, validationData, trainingData);

      // 7. Update AI detector with new model
      await this.deployModel(model);

      // 8. Store training metrics
      await this.storeTrainingMetrics(metrics, trainingResult);

      // 9. Mark feedback events as processed
      await this.markFeedbackProcessed();

      // Update version and round
      this.trainingRound++;
      this.currentModelVersion = `${Math.floor(Date.now() / 1000)}.${this.trainingRound}`;

      return {
        success: true,
        modelVersion: this.currentModelVersion,
        trainingRound: this.trainingRound,
        metrics: {
          accuracy: metrics.accuracy,
          precision: metrics.precision,
          recall: metrics.recall,
          f1Score: metrics.f1Score,
          rewardFairnessScore: metrics.rewardFairnessScore,
          biasScore: metrics.biasScore,
          performanceImprovement: metrics.performanceImprovement
        },
        trainingDetails: trainingResult
      };

    } catch (error) {
      return {
        success: false,
        modelVersion: this.currentModelVersion,
        trainingRound: this.trainingRound,
        metrics: await this.getLastMetrics(),
        trainingDetails: {
          epochs: 0,
          learningRate: 0,
          dataSize: 0,
          validationSize: 0,
          trainingLoss: 0,
          validationLoss: 0
        },
        error: error instanceof Error ? error.message : 'Unknown training error'
      };
    } finally {
      this.isRetraining = false;
    }
  }

  /**
   * Determine if model retraining is needed based on performance metrics
   */
  private async shouldRetrain(force = false): Promise<boolean> {
    if (force) return true;

    // Check if enough new training events have been collected
    const unprocessedCount = await db
      .select({ count: count() })
      .from(aiTrainingEvents)
      .where(eq(aiTrainingEvents.feedbackProcessed, false));

    if (unprocessedCount[0]?.count < CONFIG.ai.minTrainingDataSize) {
      return false;
    }

    // Check if model performance has degraded
    const recentMetrics = await this.getRecentPerformanceMetrics();
    if (recentMetrics.rewardFairnessScore < CONFIG.ai.retrainThreshold.fairnessScore ||
        recentMetrics.biasScore > CONFIG.ai.retrainThreshold.maxBias ||
        recentMetrics.accuracy < CONFIG.ai.retrainThreshold.minAccuracy) {
      return true;
    }

    // Check time-based retraining trigger
    const lastRetraining = await this.getLastRetrainingTime();
    const hoursAgo = (Date.now() - lastRetraining) / (1000 * 60 * 60);
    return hoursAgo >= CONFIG.ai.retrainInterval;
  }

  /**
   * Prepare training data from stored feedback events
   */
  private async prepareTrainingData(): Promise<{
    features: number[][];
    labels: number[];
    metadata: any[];
  }> {
    const events = await db
      .select()
      .from(aiTrainingEvents)
      .where(eq(aiTrainingEvents.feedbackProcessed, false))
      .orderBy(desc(aiTrainingEvents.createdAt));

    const features: number[][] = [];
    const labels: number[] = [];
    const metadata: any[] = [];

    for (const event of events) {
      // Feature vector: same 6 features as original model
      const featureVector = [
        event.emotionalScore,
        event.consensusScore,
        event.authenticity,
        event.deviation,
        event.historicalAverage,
        event.timeOfDay
      ];

      // Label: 1 if anomaly (poor performance), 0 if normal
      const isAnomaly = this.determineGroundTruthLabel(event);

      features.push(featureVector);
      labels.push(isAnomaly ? 1 : 0);
      metadata.push({
        validatorId: event.validatorId,
        originalPrediction: event.anomalyPrediction,
        actualPerformance: event.validatorPerformance,
        rewardFairness: event.rewardFairness
      });
    }

    return { features, labels, metadata };
  }

  /**
   * Determine ground truth label based on actual validator performance
   */
  private determineGroundTruthLabel(event: any): boolean {
    // Consider it an anomaly if:
    // 1. Low validator performance (< 70%)
    // 2. Unfair reward distribution (< 0.5 fairness score)
    // 3. Didn't participate in consensus when expected
    // 4. Large emotion drift (> 20 points)

    const lowPerformance = (event.validatorPerformance || 0) < 70;
    const unfairReward = (event.rewardFairness || 1) < 0.5;
    const noParticipation = !event.consensusParticipation;
    const highDrift = Math.abs(event.emotionDrift || 0) > 20;

    return lowPerformance || unfairReward || noParticipation || highDrift;
  }

  /**
   * Split data into training and validation sets
   */
  private splitTrainingData(data: { features: number[][]; labels: number[]; metadata: any[] }) {
    const splitIndex = Math.floor(data.features.length * 0.8);
    
    return {
      trainData: {
        features: data.features.slice(0, splitIndex),
        labels: data.labels.slice(0, splitIndex),
        metadata: data.metadata.slice(0, splitIndex)
      },
      validationData: {
        features: data.features.slice(splitIndex),
        labels: data.labels.slice(splitIndex),
        metadata: data.metadata.slice(splitIndex)
      }
    };
  }

  /**
   * Create improved model architecture
   */
  private createImprovedModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [6], 
          units: 64, 
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ 
          units: 32, 
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu' 
        }),
        tf.layers.dense({ 
          units: 1, 
          activation: 'sigmoid' 
        })
      ]
    });

    // Improved optimizer with adaptive learning rate
    model.compile({
      optimizer: tf.train.adam(CONFIG.ai.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });

    return model;
  }

  /**
   * Train model with prepared data
   */
  private async trainModel(
    model: tf.LayersModel, 
    trainData: any, 
    validationData: any
  ): Promise<{
    epochs: number;
    learningRate: number;
    dataSize: number;
    validationSize: number;
    trainingLoss: number;
    validationLoss: number;
  }> {
    const xs = tf.tensor2d(trainData.features);
    const ys = tf.tensor2d(trainData.labels, [trainData.labels.length, 1]);
    const valXs = tf.tensor2d(validationData.features);
    const valYs = tf.tensor2d(validationData.labels, [validationData.labels.length, 1]);

    const history = await model.fit(xs, ys, {
      epochs: CONFIG.ai.maxEpochs,
      batchSize: 32,
      validationData: [valXs, valYs],
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          // Early stopping if validation loss starts increasing
          if (logs && logs.val_loss > logs.loss * 1.5) {
            model.stopTraining = true;
          }
        }
      }
    });

    // Clean up tensors
    xs.dispose();
    ys.dispose();
    valXs.dispose();
    valYs.dispose();

    const finalEpoch = history.epoch[history.epoch.length - 1] || 0;
    const finalLoss = history.history.loss[history.history.loss.length - 1] as number || 0;
    const finalValLoss = history.history.val_loss[history.history.val_loss.length - 1] as number || 0;

    return {
      epochs: finalEpoch + 1,
      learningRate: CONFIG.ai.learningRate,
      dataSize: trainData.features.length,
      validationSize: validationData.features.length,
      trainingLoss: finalLoss,
      validationLoss: finalValLoss
    };
  }

  /**
   * Evaluate model performance with comprehensive metrics
   */
  private async evaluateModel(model: tf.LayersModel, validationData: any, allData: any) {
    const predictions = model.predict(tf.tensor2d(validationData.features)) as tf.Tensor;
    const predArray = await predictions.data();
    predictions.dispose();

    // Calculate standard metrics
    let tp = 0, fp = 0, tn = 0, fn = 0;
    const threshold = 0.5;

    for (let i = 0; i < validationData.labels.length; i++) {
      const predicted = predArray[i] > threshold ? 1 : 0;
      const actual = validationData.labels[i];

      if (predicted === 1 && actual === 1) tp++;
      else if (predicted === 1 && actual === 0) fp++;
      else if (predicted === 0 && actual === 0) tn++;
      else if (predicted === 0 && actual === 1) fn++;
    }

    const accuracy = (tp + tn) / (tp + fp + tn + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    // Calculate fairness metrics
    const rewardFairnessScore = await this.calculateRewardFairness(validationData);
    const biasScore = await this.calculateBiasScore(validationData, predArray);

    // Calculate improvement over previous model
    const previousMetrics = await this.getLastMetrics();
    const performanceImprovement = accuracy - (previousMetrics.accuracy || 0);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      rewardFairnessScore,
      biasScore,
      performanceImprovement
    };
  }

  /**
   * Calculate reward fairness score
   */
  private async calculateRewardFairness(validationData: any): Promise<number> {
    let totalFairness = 0;
    let count = 0;

    for (const metadata of validationData.metadata) {
      if (metadata.rewardFairness !== null && metadata.rewardFairness !== undefined) {
        totalFairness += metadata.rewardFairness;
        count++;
      }
    }

    return count > 0 ? totalFairness / count : 1.0;
  }

  /**
   * Calculate bias score (lower is better)
   */
  private async calculateBiasScore(validationData: any, predictions: Float32Array): Promise<number> {
    // Calculate variance in predictions across different validator groups
    const validatorGroups: { [key: string]: number[] } = {};
    
    for (let i = 0; i < validationData.metadata.length; i++) {
      const validatorId = validationData.metadata[i].validatorId;
      if (!validatorGroups[validatorId]) {
        validatorGroups[validatorId] = [];
      }
      validatorGroups[validatorId].push(predictions[i]);
    }

    // Calculate variance across validator groups
    const groupAverages = Object.values(validatorGroups).map(preds => 
      preds.reduce((sum, pred) => sum + pred, 0) / preds.length
    );

    const overallAverage = groupAverages.reduce((sum, avg) => sum + avg, 0) / groupAverages.length;
    const variance = groupAverages.reduce((sum, avg) => sum + Math.pow(avg - overallAverage, 2), 0) / groupAverages.length;

    return Math.sqrt(variance); // Return standard deviation as bias score
  }

  /**
   * Deploy trained model to production
   */
  private async deployModel(model: tf.LayersModel): Promise<void> {
    // Update the anomaly detection engine with new model
    anomalyDetectionEngine.model = model;
    console.log(`Updated AI model to version ${this.currentModelVersion}`);
  }

  /**
   * Store training metrics in database
   */
  private async storeTrainingMetrics(metrics: any, trainingDetails: any): Promise<void> {
    const metricsData: InsertAiLearningMetrics = {
      modelVersion: this.currentModelVersion,
      trainingRound: this.trainingRound,
      accuracy: metrics.accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
      rewardFairnessScore: metrics.rewardFairnessScore,
      emotionDriftVariance: 0, // Will calculate this separately
      biasScore: metrics.biasScore,
      trainingDataSize: trainingDetails.dataSize,
      validationDataSize: trainingDetails.validationSize,
      trainingLoss: trainingDetails.trainingLoss,
      validationLoss: trainingDetails.validationLoss,
      epochs: trainingDetails.epochs,
      learningRate: trainingDetails.learningRate,
      performanceImprovement: metrics.performanceImprovement,
      biasReduction: 0 // Will calculate vs previous model
    };

    await db.insert(aiLearningMetrics).values(metricsData);
  }

  /**
   * Mark feedback events as processed
   */
  private async markFeedbackProcessed(): Promise<void> {
    await db
      .update(aiTrainingEvents)
      .set({ 
        feedbackProcessed: true,
        updatedAt: new Date()
      })
      .where(eq(aiTrainingEvents.feedbackProcessed, false));
  }

  /**
   * Get recent performance metrics
   */
  private async getRecentPerformanceMetrics() {
    const recent = await db
      .select()
      .from(aiLearningMetrics)
      .orderBy(desc(aiLearningMetrics.createdAt))
      .limit(1);

    return recent[0] || {
      rewardFairnessScore: 1.0,
      biasScore: 0.0,
      accuracy: 0.5
    };
  }

  /**
   * Get last retraining time
   */
  private async getLastRetrainingTime(): Promise<number> {
    const lastMetrics = await db
      .select()
      .from(aiLearningMetrics)
      .orderBy(desc(aiLearningMetrics.createdAt))
      .limit(1);

    return lastMetrics[0]?.createdAt?.getTime() || 0;
  }

  /**
   * Get last training metrics
   */
  private async getLastMetrics() {
    const last = await db
      .select()
      .from(aiLearningMetrics)
      .orderBy(desc(aiLearningMetrics.createdAt))
      .limit(1);

    return last[0] || {
      accuracy: 0.5,
      precision: 0.5,
      recall: 0.5,
      f1Score: 0.5,
      rewardFairnessScore: 1.0,
      biasScore: 0.0,
      performanceImprovement: 0
    };
  }

  /**
   * Get current model info
   */
  getCurrentModelInfo() {
    return {
      version: this.currentModelVersion,
      trainingRound: this.trainingRound,
      isRetraining: this.isRetraining
    };
  }
}