// AI Consensus Integration for Anomaly Detection
import { anomalyDetectionEngine } from './anomaly-detection';
import { AIFeedbackCollector, ValidatorFeedbackData } from './feedback-collector';
import { storage } from '../storage';
import { CONFIG } from '../../shared/config';

interface ValidatorState {
  validatorId: string;
  emotionalScore: number;
  consensusScore: number;
  authenticity: number;
  balance: number;
  isActive: boolean;
  lastValidation: string;
}

interface ConsensusRoundData {
  roundId: string;
  validators: ValidatorState[];
  blockHeight: number;
  timestamp: number;
}

interface AdjustedConsensusWeight {
  validatorId: string;
  originalWeight: number;
  adjustedWeight: number;
  anomalyDetected: boolean;
  anomalyType: string;
  confidence: number;
  recommendation: string;
}

export class AIConsensusIntegration {
  private anomalyHistory: Map<string, any[]> = new Map();
  private consensusAdjustments: AdjustedConsensusWeight[] = [];

  public async validateConsensusRound(roundData: ConsensusRoundData): Promise<{
    adjustedValidators: AdjustedConsensusWeight[];
    roundMetrics: {
      totalValidators: number;
      anomaliesDetected: number;
      criticalAnomalies: number;
      averageConfidence: number;
      recommendedAction: string;
    };
  }> {
    try {
      // Prepare emotional patterns for analysis
      const patterns = await this.prepareEmotionalPatterns(roundData.validators);
      
      // Run anomaly detection
      const anomalyResults = await anomalyDetectionEngine.detectAnomalies(patterns);
      
      // Calculate consensus weight adjustments
      const adjustedValidators = this.calculateConsensusAdjustments(
        roundData.validators, 
        anomalyResults
      );
      
      // Generate round metrics
      const roundMetrics = this.generateRoundMetrics(adjustedValidators);
      
      // Update training data for continuous learning
      this.updateTrainingData(patterns, anomalyResults);
      
      // Store adjustment history
      this.consensusAdjustments = adjustedValidators;
      
      return {
        adjustedValidators,
        roundMetrics
      };
      
    } catch (error) {
      // Fallback to standard consensus on AI failure
      return this.getFallbackConsensusResult(roundData.validators);
    }
  }

  private async prepareEmotionalPatterns(validators: ValidatorState[]): Promise<any[]> {
    const patterns = [];
    
    for (const validator of validators) {
      // Get historical data for deviation calculation
      const historicalScores = await this.getHistoricalScores(validator.validatorId);
      const historicalAverage = this.calculateHistoricalAverage(historicalScores);
      const deviation = Math.abs(validator.emotionalScore - historicalAverage);
      
      patterns.push({
        validatorId: validator.validatorId,
        emotionalScore: validator.emotionalScore,
        consensusScore: validator.consensusScore || validator.emotionalScore,
        authenticity: validator.authenticity || 95, // Default high authenticity
        timestamp: Date.now(),
        historicalAverage,
        deviation
      });
    }
    
    return patterns;
  }

  private async getHistoricalScores(validatorId: string): Promise<number[]> {
    try {
      // Get recent blocks to calculate historical emotional scores
      const recentBlocks = await storage.getBlocks(50);
      const validatorBlocks = recentBlocks.filter(block => 
        block.validatorId === validatorId && block.emotionalScore
      );
      
      return validatorBlocks.map(block => parseFloat(block.emotionalScore!) || 75);
    } catch (error) {
      return [75]; // Default baseline score
    }
  }

  private calculateHistoricalAverage(scores: number[]): number {
    if (scores.length === 0) return 75; // Default baseline
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateConsensusAdjustments(
    validators: ValidatorState[], 
    anomalyResults: Map<string, any>
  ): AdjustedConsensusWeight[] {
    const adjustments: AdjustedConsensusWeight[] = [];
    
    validators.forEach(validator => {
      const anomalyResult = anomalyResults.get(validator.validatorId);
      const originalWeight = this.calculateOriginalWeight(validator);
      
      let adjustedWeight = originalWeight;
      let anomalyDetected = false;
      let anomalyType = 'normal';
      let confidence = 0;
      let recommendation = 'Proceed with normal consensus weight';
      
      if (anomalyResult) {
        anomalyDetected = anomalyResult.isAnomaly;
        anomalyType = anomalyResult.anomalyType;
        confidence = anomalyResult.confidence;
        recommendation = anomalyResult.recommendation;
        
        if (anomalyResult.isAnomaly) {
          adjustedWeight = this.applyAnomalyAdjustment(originalWeight, anomalyResult);
        }
      }
      
      adjustments.push({
        validatorId: validator.validatorId,
        originalWeight,
        adjustedWeight,
        anomalyDetected,
        anomalyType,
        confidence,
        recommendation
      });
    });
    
    return adjustments;
  }

  private calculateOriginalWeight(validator: ValidatorState): number {
    // Base weight calculation using emotional score, balance, and activity
    const emotionalWeight = validator.emotionalScore / 100;
    const balanceWeight = Math.min(validator.balance / 1000, 1); // Cap balance influence
    const activityWeight = validator.isActive ? 1 : 0.1;
    
    return (emotionalWeight * 0.6 + balanceWeight * 0.3 + activityWeight * 0.1);
  }

  private applyAnomalyAdjustment(originalWeight: number, anomalyResult: any): number {
    const confidence = anomalyResult.confidence;
    const severity = anomalyResult.severity;
    
    // Apply weight reduction based on anomaly severity
    let reductionFactor = 1.0;
    
    switch (severity) {
      case 'critical':
        reductionFactor = 0.0; // Exclude from consensus
        break;
      case 'high':
        reductionFactor = 0.25; // 75% reduction
        break;
      case 'medium':
        reductionFactor = 0.5; // 50% reduction
        break;
      case 'low':
        reductionFactor = 0.75; // 25% reduction
        break;
      default:
        reductionFactor = 1.0;
    }
    
    return Math.max(originalWeight * reductionFactor, 0);
  }

  private generateRoundMetrics(adjustedValidators: AdjustedConsensusWeight[]): any {
    const totalValidators = adjustedValidators.length;
    const anomaliesDetected = adjustedValidators.filter(v => v.anomalyDetected).length;
    const criticalAnomalies = adjustedValidators.filter(v => 
      v.anomalyDetected && v.adjustedWeight === 0
    ).length;
    
    const averageConfidence = adjustedValidators.reduce((sum, v) => 
      sum + v.confidence, 0
    ) / totalValidators;
    
    let recommendedAction = 'Proceed with consensus round';
    
    if (criticalAnomalies > totalValidators * 0.3) {
      recommendedAction = 'Delay consensus round - too many critical anomalies';
    } else if (anomaliesDetected > totalValidators * 0.5) {
      recommendedAction = 'Proceed with caution - high anomaly rate detected';
    }
    
    return {
      totalValidators,
      anomaliesDetected,
      criticalAnomalies,
      averageConfidence,
      recommendedAction
    };
  }

  private updateTrainingData(patterns: any[], anomalyResults: Map<string, any>): void {
    patterns.forEach(pattern => {
      anomalyDetectionEngine.updateTrainingData(pattern);
    });
    
    // Trigger model retraining periodically
    const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
    if (patterns.length > 0 && (randomByte / 255) < 0.1) { // 10% chance
      anomalyDetectionEngine.retrainModel();
    }
  }

  private getFallbackConsensusResult(validators: ValidatorState[]): any {
    const adjustedValidators = validators.map(validator => ({
      validatorId: validator.validatorId,
      originalWeight: this.calculateOriginalWeight(validator),
      adjustedWeight: this.calculateOriginalWeight(validator),
      anomalyDetected: false,
      anomalyType: 'normal',
      confidence: 0,
      recommendation: 'AI analysis unavailable - using standard consensus'
    }));
    
    return {
      adjustedValidators,
      roundMetrics: {
        totalValidators: validators.length,
        anomaliesDetected: 0,
        criticalAnomalies: 0,
        averageConfidence: 0,
        recommendedAction: 'Proceed with standard consensus (AI fallback)'
      }
    };
  }

  public getAnomalyHistory(validatorId: string): any[] {
    return this.anomalyHistory.get(validatorId) || [];
  }

  public getLastConsensusAdjustments(): AdjustedConsensusWeight[] {
    return this.consensusAdjustments;
  }

  public getAIMetrics(): {
    modelStatus: any;
    recentAdjustments: number;
    anomalyRate: number;
  } {
    const modelStatus = anomalyDetectionEngine.getModelMetrics();
    const recentAdjustments = this.consensusAdjustments.length;
    const anomalyRate = this.consensusAdjustments.filter(a => a.anomalyDetected).length / 
                       Math.max(recentAdjustments, 1);
    
    return {
      modelStatus,
      recentAdjustments,
      anomalyRate
    };
  }
}

// Singleton instance for consensus integration
export const aiConsensusIntegration = new AIConsensusIntegration();