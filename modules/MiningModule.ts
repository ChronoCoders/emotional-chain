/**
 * EmotionalChain Mining Module
 * Handles Proof of Emotion mining process
 */

import { EmotionalEngine, EmotionalState } from '../engine/EmotionalEngine';
import { BiometricDevice } from '../biometric/BiometricDevice';
import { Transaction } from '../crypto/Transaction';
import { WalletModule } from './WalletModule';

export interface MiningSession {
  sessionId: string;
  validatorId: string;
  startTime: number;
  duration: number;
  emotionalStates: EmotionalState[];
  averageScore: number;
  blocksValidated: number;
  rewardsEarned: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
}

export interface MiningReward {
  sessionId: string;
  validatorId: string;
  blockNumber: number;
  miningReward: number;
  validationReward: number;
  totalReward: number;
  emotionalScore: number;
  timestamp: number;
}

export class MiningModule {
  private emotionalEngine: EmotionalEngine;
  private wallet: WalletModule;
  private currentSession: MiningSession | null = null;
  private connectedDevice: BiometricDevice | null = null;
  private rewardHistory: MiningReward[] = [];
  private isActive: boolean = false;

  // Mining parameters
  private readonly BASE_MINING_REWARD = 50.0; // Base EMO per block
  private readonly VALIDATION_BONUS = 0.1; // 10% bonus for validation
  private readonly MIN_SESSION_DURATION = 300000; // 5 minutes minimum
  private readonly MAX_SESSION_DURATION = 3600000; // 1 hour maximum

  constructor(wallet: WalletModule) {
    this.emotionalEngine = new EmotionalEngine();
    this.wallet = wallet;
    console.log(`MINING MODULE: Initialized for wallet ${wallet.getAddress()}`);
  }

  /**
   * Start mining session with biometric device
   */
  public async startMining(
    device: BiometricDevice,
    validatorId: string,
    sessionDuration: number = 1800000 // 30 minutes default
  ): Promise<string> {
    try {
      if (this.currentSession && this.currentSession.status === 'active') {
        throw new Error('Mining session already active');
      }

      if (sessionDuration < this.MIN_SESSION_DURATION || sessionDuration > this.MAX_SESSION_DURATION) {
        throw new Error(`Session duration must be between ${this.MIN_SESSION_DURATION/1000}s and ${this.MAX_SESSION_DURATION/1000}s`);
      }

      // Register device with emotional engine
      this.emotionalEngine.registerDevice(device);
      this.connectedDevice = device;

      // Create new mining session
      const sessionId = this.generateSessionId();
      this.currentSession = {
        sessionId,
        validatorId,
        startTime: Date.now(),
        duration: sessionDuration,
        emotionalStates: [],
        averageScore: 0,
        blocksValidated: 0,
        rewardsEarned: 0,
        status: 'active'
      };

      this.isActive = true;

      // Start emotional monitoring
      this.startEmotionalMonitoring();

      console.log(`MINING MODULE: Started session ${sessionId} for validator ${validatorId}`);
      return sessionId;
    } catch (error) {
      console.error('MINING MODULE: Failed to start mining:', error);
      throw error;
    }
  }

  /**
   * Stop current mining session
   */
  public async stopMining(): Promise<MiningSession | null> {
    try {
      if (!this.currentSession || this.currentSession.status !== 'active') {
        throw new Error('No active mining session');
      }

      this.isActive = false;
      this.currentSession.status = 'completed';

      // Calculate final session statistics
      if (this.currentSession.emotionalStates.length > 0) {
        this.currentSession.averageScore = this.currentSession.emotionalStates
          .reduce((sum, state) => sum + this.calculateSessionScore(state), 0) / this.currentSession.emotionalStates.length;
      }

      // Cleanup
      if (this.connectedDevice) {
        this.emotionalEngine.unregisterDevice(this.connectedDevice.id);
        this.connectedDevice = null;
      }

      console.log(`MINING MODULE: Completed session ${this.currentSession.sessionId}`);
      console.log(`MINING MODULE: Validated ${this.currentSession.blocksValidated} blocks, earned ${this.currentSession.rewardsEarned} EMO`);

      const completedSession = this.currentSession;
      this.currentSession = null;
      return completedSession;
    } catch (error) {
      console.error('MINING MODULE: Failed to stop mining:', error);
      throw error;
    }
  }

  /**
   * Process block validation and calculate rewards
   */
  public async processBlockValidation(
    blockNumber: number,
    emotionalState: EmotionalState
  ): Promise<MiningReward | null> {
    try {
      if (!this.currentSession || this.currentSession.status !== 'active') {
        return null;
      }

      // Validate emotional fitness
      const validation = this.emotionalEngine.validateEmotionalFitness(
        this.currentSession.validatorId,
        emotionalState,
        this.connectedDevice?.type || 'unknown'
      );

      if (!validation.isValid) {
        console.log(`MINING MODULE: Block ${blockNumber} validation failed - ${validation.reason}`);
        return null;
      }

      // Calculate rewards based on emotional score
      const miningReward = this.BASE_MINING_REWARD * validation.score;
      const validationReward = miningReward * this.VALIDATION_BONUS;
      const totalReward = miningReward + validationReward;

      // Create reward record
      const reward: MiningReward = {
        sessionId: this.currentSession.sessionId,
        validatorId: this.currentSession.validatorId,
        blockNumber,
        miningReward,
        validationReward,
        totalReward,
        emotionalScore: validation.score,
        timestamp: Date.now()
      };

      // Update session statistics
      this.currentSession.blocksValidated++;
      this.currentSession.rewardsEarned += totalReward;
      this.currentSession.emotionalStates.push(emotionalState);

      // Store reward
      this.rewardHistory.unshift(reward);
      if (this.rewardHistory.length > 1000) {
        this.rewardHistory = this.rewardHistory.slice(0, 1000);
      }

      // Create reward transaction
      const rewardTransaction = this.wallet.createTransaction(
        this.wallet.getAddress(),
        totalReward,
        JSON.stringify({ type: 'MINING_REWARD', blockNumber, score: validation.score })
      );

      console.log(`MINING MODULE: Block ${blockNumber} validated - Reward: ${totalReward.toFixed(2)} EMO (score: ${validation.score.toFixed(3)})`);
      
      return reward;
    } catch (error) {
      console.error('MINING MODULE: Block validation failed:', error);
      return null;
    }
  }

  /**
   * Start emotional monitoring loop
   */
  private async startEmotionalMonitoring(): Promise<void> {
    const monitoringInterval = setInterval(async () => {
      try {
        if (!this.isActive || !this.currentSession || !this.connectedDevice) {
          clearInterval(monitoringInterval);
          return;
        }

        // Check session timeout
        const elapsed = Date.now() - this.currentSession.startTime;
        if (elapsed >= this.currentSession.duration) {
          await this.stopMining();
          clearInterval(monitoringInterval);
          return;
        }

        // Get biometric data from device
        const biometricData = await this.connectedDevice.readData();
        
        // Process emotional state
        const emotionalState = await this.emotionalEngine.processEmotionalState(
          this.connectedDevice.id,
          biometricData
        );

        // Simulate block validation (in real implementation, this would come from consensus)
        const currentBlock = Math.floor(Date.now() / 30000); // 30-second blocks
        await this.processBlockValidation(currentBlock, emotionalState);

      } catch (error) {
        console.error('MINING MODULE: Emotional monitoring error:', error);
      }
    }, 10000); // Monitor every 10 seconds
  }

  /**
   * Calculate session score from emotional state
   */
  private calculateSessionScore(state: EmotionalState): number {
    return (
      (1.0 - state.stress) * 0.3 +
      state.focus * 0.3 +
      state.authenticity * 0.4
    );
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current mining session
   */
  public getCurrentSession(): MiningSession | null {
    return this.currentSession;
  }

  /**
   * Get reward history
   */
  public getRewardHistory(): MiningReward[] {
    return [...this.rewardHistory];
  }

  /**
   * Get total rewards earned
   */
  public getTotalRewards(): number {
    return this.rewardHistory.reduce((sum, reward) => sum + reward.totalReward, 0);
  }

  /**
   * Get mining statistics
   */
  public getMiningStats() {
    const totalRewards = this.getTotalRewards();
    const totalBlocks = this.rewardHistory.length;
    const averageScore = totalBlocks > 0 
      ? this.rewardHistory.reduce((sum, r) => sum + r.emotionalScore, 0) / totalBlocks 
      : 0;

    return {
      totalRewards,
      totalBlocks,
      averageScore,
      sessionsCompleted: new Set(this.rewardHistory.map(r => r.sessionId)).size,
      isCurrentlyMining: this.isActive
    };
  }

  /**
   * Pause current session
   */
  public pauseSession(): boolean {
    if (this.currentSession && this.currentSession.status === 'active') {
      this.currentSession.status = 'paused';
      this.isActive = false;
      console.log(`MINING MODULE: Paused session ${this.currentSession.sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * Resume paused session
   */
  public resumeSession(): boolean {
    if (this.currentSession && this.currentSession.status === 'paused') {
      this.currentSession.status = 'active';
      this.isActive = true;
      this.startEmotionalMonitoring();
      console.log(`MINING MODULE: Resumed session ${this.currentSession.sessionId}`);
      return true;
    }
    return false;
  }
}