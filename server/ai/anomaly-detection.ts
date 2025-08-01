// AI Consensus Anomaly Detection System
import * as tf from '@tensorflow/tfjs-node';
import { CONFIG } from '../../shared/config';

// Suppress TensorFlow.js optimization messages
tf.env().set('WEBGL_CPU_FORWARD', false);
tf.enableProdMode();

interface EmotionalPattern {
  validatorId: string;
  emotionalScore: number;
  consensusScore: number;
  authenticity: number;
  timestamp: number;
  historicalAverage: number;
  deviation: number;
}

interface AnomalyResult {
  isAnomaly: boolean;
  confidence: number;
  anomalyType: 'emotional_spike' | 'consensus_drift' | 'authenticity_drop' | 'pattern_break' | 'normal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export class AnomalyDetectionEngine {
  private model: tf.LayersModel | null = null;
  private isInitialized: boolean = false;
  private trainingData: EmotionalPattern[] = [];
  private readonly windowSize = CONFIG.ai.models.anomalyDetector.sensitivity * 20 || 10;
  private readonly threshold = CONFIG.ai.models.anomalyDetector.sensitivity || 0.75;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      // Create baseline TensorFlow.js model for anomaly detection
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [6], // emotionalScore, consensusScore, authenticity, deviation, timeOfDay, historicalVariance
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 8,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid' // Output probability of anomaly
          })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      throw new Error(`Failed to initialize anomaly detection model: ${error}`);
    }
  }

  public async detectAnomalies(patterns: EmotionalPattern[]): Promise<Map<string, AnomalyResult>> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Anomaly detection model not initialized');
    }

    const results = new Map<string, AnomalyResult>();

    for (const pattern of patterns) {
      try {
        const anomalyResult = await this.analyzePattern(pattern);
        results.set(pattern.validatorId, anomalyResult);
      } catch (error) {
        results.set(pattern.validatorId, {
          isAnomaly: false,
          confidence: 0,
          anomalyType: 'normal',
          severity: 'low',
          recommendation: 'Analysis failed - using fallback validation'
        });
      }
    }

    return results;
  }

  private async analyzePattern(pattern: EmotionalPattern): Promise<AnomalyResult> {
    // Prepare input features
    const timeOfDay = this.getTimeOfDayFeature(pattern.timestamp);
    const historicalVariance = this.calculateHistoricalVariance(pattern.validatorId);
    
    const inputTensor = tf.tensor2d([[
      pattern.emotionalScore / 100,    // Normalize to 0-1
      pattern.consensusScore / 100,    // Normalize to 0-1
      pattern.authenticity / 100,      // Normalize to 0-1
      Math.min(pattern.deviation / 50, 1), // Cap and normalize deviation
      timeOfDay,                       // 0-1 based on time
      historicalVariance              // Historical variance metric
    ]]);

    const prediction = this.model!.predict(inputTensor) as tf.Tensor;
    const anomalyProbability = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();

    const confidence = anomalyProbability[0];
    const isAnomaly = confidence > this.threshold;

    return {
      isAnomaly,
      confidence,
      anomalyType: this.classifyAnomalyType(pattern, confidence),
      severity: this.calculateSeverity(confidence),
      recommendation: this.generateRecommendation(pattern, confidence, isAnomaly)
    };
  }

  private getTimeOfDayFeature(timestamp: number): number {
    const hour = new Date(timestamp).getHours();
    // Convert to sine wave to capture cyclical nature of time
    return (Math.sin(2 * Math.PI * hour / 24) + 1) / 2;
  }

  private calculateHistoricalVariance(validatorId: string): number {
    const validatorHistory = this.trainingData.filter(d => d.validatorId === validatorId);
    if (validatorHistory.length < 2) return 0.5; // Default moderate variance
    
    const scores = validatorHistory.map(h => h.emotionalScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.min(variance / 1000, 1); // Normalize variance
  }

  private classifyAnomalyType(pattern: EmotionalPattern, confidence: number): AnomalyResult['anomalyType'] {
    if (confidence < this.threshold) return 'normal';

    // Emotional spike detection
    if (pattern.deviation > 30 && pattern.emotionalScore > 90) {
      return 'emotional_spike';
    }

    // Consensus drift detection
    if (Math.abs(pattern.emotionalScore - pattern.consensusScore) > 25) {
      return 'consensus_drift';
    }

    // Authenticity drop detection
    if (pattern.authenticity < 70) {
      return 'authenticity_drop';
    }

    // Pattern break detection (significant deviation from historical)
    if (pattern.deviation > 40) {
      return 'pattern_break';
    }

    return 'normal';
  }

  private calculateSeverity(confidence: number): AnomalyResult['severity'] {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  private generateRecommendation(pattern: EmotionalPattern, confidence: number, isAnomaly: boolean): string {
    if (!isAnomaly) {
      return 'Pattern within normal parameters - proceed with consensus';
    }

    if (confidence >= 0.9) {
      return 'Critical anomaly detected - exclude from consensus round and trigger investigation';
    }

    if (confidence >= 0.8) {
      return 'High anomaly likelihood - reduce consensus weight by 75%';
    }

    if (confidence >= 0.7) {
      return 'Moderate anomaly detected - reduce consensus weight by 50%';
    }

    return 'Minor anomaly detected - reduce consensus weight by 25%';
  }

  public updateTrainingData(newPattern: EmotionalPattern): void {
    this.trainingData.push(newPattern);
    
    // Keep rolling window of training data
    const maxTrainingSize = 10000;
    if (this.trainingData.length > maxTrainingSize) {
      this.trainingData = this.trainingData.slice(-maxTrainingSize);
    }
  }

  public async retrainModel(): Promise<void> {
    if (!this.model || this.trainingData.length < 100) return;

    try {
      // Prepare training data
      const features = this.trainingData.map(pattern => [
        pattern.emotionalScore / 100,
        pattern.consensusScore / 100,
        pattern.authenticity / 100,
        Math.min(pattern.deviation / 50, 1),
        this.getTimeOfDayFeature(pattern.timestamp),
        this.calculateHistoricalVariance(pattern.validatorId)
      ]);

      // Generate labels (simplified anomaly detection based on deviation)
      const labels = this.trainingData.map(pattern => 
        pattern.deviation > 35 || pattern.authenticity < 70 ? 1 : 0
      );

      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels.map(l => [l]));

      await this.model.fit(xs, ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });

      xs.dispose();
      ys.dispose();
    } catch (error) {
      // Continue with existing model on training failure
    }
  }

  public getModelMetrics(): { isInitialized: boolean; trainingDataSize: number; threshold: number } {
    return {
      isInitialized: this.isInitialized,
      trainingDataSize: this.trainingData.length,
      threshold: this.threshold
    };
  }
}

// Singleton instance for global use
export const anomalyDetectionEngine = new AnomalyDetectionEngine();