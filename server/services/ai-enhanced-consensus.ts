// AI-Enhanced Consensus Service
import { aiConsensusIntegration } from '../ai/consensus-integration';
import { emotionalChainService } from './emotionalchain';
import { storage } from '../storage';

interface EnhancedConsensusRound {
  roundId: string;
  originalValidators: any[];
  adjustedValidators: any[];
  aiAnalysis: any;
  consensusResult: 'proceed' | 'delay' | 'abort';
  timestamp: number;
}

export class AIEnhancedConsensusService {
  private currentRound: EnhancedConsensusRound | null = null;
  private roundHistory: EnhancedConsensusRound[] = [];

  public async performEnhancedConsensusRound(): Promise<EnhancedConsensusRound> {
    try {
      // Get current validators
      const validators = await emotionalChainService.getValidators();
      
      // Prepare round data
      const roundData = {
        roundId: `ai_round_${Date.now()}`,
        validators: validators.map(v => ({
          validatorId: v.id,
          emotionalScore: 75, // Use default emotional score
          consensusScore: 75, // Use default consensus score
          authenticity: 95,
          balance: v.balance,
          isActive: v.isActive,
          lastValidation: new Date().toISOString()
        })),
        blockHeight: 10430,
        timestamp: Date.now()
      };

      // Run AI analysis
      const aiAnalysis = await aiConsensusIntegration.validateConsensusRound(roundData);
      
      // Determine consensus result
      const consensusResult = this.determineConsensusResult(aiAnalysis);
      
      // Create enhanced round result
      const enhancedRound: EnhancedConsensusRound = {
        roundId: roundData.roundId,
        originalValidators: validators,
        adjustedValidators: aiAnalysis.adjustedValidators,
        aiAnalysis: aiAnalysis.roundMetrics,
        consensusResult,
        timestamp: Date.now()
      };

      // Store round
      this.currentRound = enhancedRound;
      this.roundHistory.push(enhancedRound);
      
      // Keep only last 100 rounds
      if (this.roundHistory.length > 100) {
        this.roundHistory = this.roundHistory.slice(-100);
      }

      return enhancedRound;
      
    } catch (error) {
      throw new Error(`AI-enhanced consensus failed: ${(error as Error).message}`);
    }
  }

  private async getCurrentBlockHeight(): Promise<number> {
    try {
      const blocks = await storage.getBlocks(1);
      return blocks.length > 0 ? blocks[0].height : 1000;
    } catch (error) {
      return 1000; // Default fallback
    }
  }

  private determineConsensusResult(aiAnalysis: any): 'proceed' | 'delay' | 'abort' {
    const { roundMetrics } = aiAnalysis;
    
    // Abort if too many critical anomalies
    if (roundMetrics.criticalAnomalies > roundMetrics.totalValidators * 0.3) {
      return 'abort';
    }
    
    // Delay if high anomaly rate
    if (roundMetrics.anomaliesDetected > roundMetrics.totalValidators * 0.5) {
      return 'delay';
    }
    
    // Proceed with normal consensus
    return 'proceed';
  }

  public getCurrentRound(): EnhancedConsensusRound | null {
    return this.currentRound;
  }

  public getRoundHistory(): EnhancedConsensusRound[] {
    return this.roundHistory;
  }

  public getConsensusMetrics(): {
    totalRounds: number;
    successfulRounds: number;
    delayedRounds: number;
    abortedRounds: number;
    averageAnomalyRate: number;
  } {
    if (this.roundHistory.length === 0) {
      return {
        totalRounds: 0,
        successfulRounds: 0,
        delayedRounds: 0,
        abortedRounds: 0,
        averageAnomalyRate: 0
      };
    }

    const totalRounds = this.roundHistory.length;
    const successfulRounds = this.roundHistory.filter(r => r.consensusResult === 'proceed').length;
    const delayedRounds = this.roundHistory.filter(r => r.consensusResult === 'delay').length;
    const abortedRounds = this.roundHistory.filter(r => r.consensusResult === 'abort').length;
    
    const averageAnomalyRate = this.roundHistory.reduce((sum, round) => {
      const totalValidators = round.aiAnalysis.totalValidators || 1;
      const anomalies = round.aiAnalysis.anomaliesDetected || 0;
      return sum + (anomalies / totalValidators);
    }, 0) / totalRounds;

    return {
      totalRounds,
      successfulRounds,
      delayedRounds,
      abortedRounds,
      averageAnomalyRate
    };
  }
}

// Singleton service instance
export const aiEnhancedConsensusService = new AIEnhancedConsensusService();