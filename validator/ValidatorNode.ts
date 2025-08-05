/**
 * EmotionalChain Validator Node
 * Core validator implementation for Proof of Emotion consensus
 */

import { EmotionalValidator } from '../consensus/EmotionalValidator';
import { EmotionalEngine, EmotionalState } from '../engine/EmotionalEngine';
import { BiometricDevice } from '../biometric/BiometricDevice';
import { WalletModule } from '../modules/WalletModule';
import { MiningModule } from '../modules/MiningModule';
import { BlockchainCore } from '../core/BlockchainCore';
import { Block } from '../crypto/Block';
import { Transaction } from '../crypto/Transaction';

export interface ValidatorConfig {
  validatorId: string;
  validatorName: string;
  wallet: WalletModule;
  stakeAmount: number;
  biometricDevice?: BiometricDevice;
  autoMining: boolean;
}

export interface ValidatorStats {
  blocksValidated: number;
  totalRewards: number;
  emotionalScore: number;
  uptime: number;
  slashingCount: number;
  lastActivity: number;
  status: 'active' | 'inactive' | 'slashed' | 'jailed';
}

export class ValidatorNode {
  private validator: EmotionalValidator;
  private emotionalEngine: EmotionalEngine;
  private wallet: WalletModule;
  private miningModule: MiningModule;
  private blockchain: BlockchainCore;
  private config: ValidatorConfig;
  private stats: ValidatorStats;
  private isRunning: boolean = false;
  private biometricDevice: BiometricDevice | null = null;

  constructor(config: ValidatorConfig, blockchain: BlockchainCore) {
    this.config = config;
    this.blockchain = blockchain;
    this.wallet = config.wallet;
    this.miningModule = new MiningModule(this.wallet);
    this.emotionalEngine = new EmotionalEngine();

    // Initialize validator
    this.validator = new EmotionalValidator(
      config.validatorId,
      config.validatorName,
      config.wallet.getAddress(),
      config.stakeAmount
    );

    // Initialize stats
    this.stats = {
      blocksValidated: 0,
      totalRewards: 0,
      emotionalScore: 0,
      uptime: 0,
      slashingCount: 0,
      lastActivity: Date.now(),
      status: 'inactive'
    };

    // Setup biometric device if provided
    if (config.biometricDevice) {
      this.setupBiometricDevice(config.biometricDevice);
    }

    console.log(`VALIDATOR NODE: Initialized ${config.validatorName} (${config.validatorId})`);
  }

  /**
   * Start validator node
   */
  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        throw new Error('Validator node already running');
      }

      console.log(`VALIDATOR NODE: Starting ${this.config.validatorName}...`);

      // Start emotional engine
      await this.emotionalEngine.start();

      // Start validator
      this.validator.activate();
      this.stats.status = 'active';
      this.stats.lastActivity = Date.now();
      this.isRunning = true;

      // Start auto-mining if enabled
      if (this.config.autoMining && this.biometricDevice) {
        await this.startAutoMining();
      }

      // Start validation loop
      this.startValidationLoop();

      console.log(`VALIDATOR NODE: ${this.config.validatorName} started successfully`);
    } catch (error) {
      console.error(`VALIDATOR NODE: Failed to start ${this.config.validatorName}:`, error);
      throw error;
    }
  }

  /**
   * Stop validator node
   */
  public async stop(): Promise<void> {
    try {
      console.log(`VALIDATOR NODE: Stopping ${this.config.validatorName}...`);

      this.isRunning = false;
      this.validator.deactivate();
      this.stats.status = 'inactive';

      // Stop mining if active
      const currentSession = this.miningModule.getCurrentSession();
      if (currentSession && currentSession.status === 'active') {
        await this.miningModule.stopMining();
      }

      // Stop emotional engine
      await this.emotionalEngine.stop();

      console.log(`VALIDATOR NODE: ${this.config.validatorName} stopped`);
    } catch (error) {
      console.error(`VALIDATOR NODE: Failed to stop ${this.config.validatorName}:`, error);
      throw error;
    }
  }

  /**
   * Setup biometric device
   */
  private setupBiometricDevice(device: BiometricDevice): void {
    this.biometricDevice = device;
    this.emotionalEngine.registerDevice(device);
    console.log(`VALIDATOR NODE: Connected biometric device ${device.id} (${device.type})`);
  }

  /**
   * Start auto-mining
   */
  private async startAutoMining(): Promise<void> {
    if (!this.biometricDevice) {
      throw new Error('No biometric device available for mining');
    }

    try {
      await this.miningModule.startMining(
        this.biometricDevice,
        this.config.validatorId,
        1800000 // 30 minutes
      );

      console.log(`VALIDATOR NODE: Auto-mining started for ${this.config.validatorName}`);
    } catch (error) {
      console.error(`VALIDATOR NODE: Auto-mining failed for ${this.config.validatorName}:`, error);
    }
  }

  /**
   * Start validation loop
   */
  private startValidationLoop(): void {
    const validationInterval = setInterval(async () => {
      try {
        if (!this.isRunning) {
          clearInterval(validationInterval);
          return;
        }

        await this.performValidation();
        this.updateUptime();
        
      } catch (error) {
        console.error(`VALIDATOR NODE: Validation error for ${this.config.validatorName}:`, error);
      }
    }, 30000); // Validate every 30 seconds
  }

  /**
   * Perform block validation
   */
  private async performValidation(): Promise<void> {
    try {
      // Get latest block
      const latestBlock = this.blockchain.getLatestBlock();
      
      // Get current emotional state if device available
      let emotionalState: EmotionalState | null = null;
      if (this.biometricDevice) {
        const biometricData = await this.biometricDevice.readData();
        emotionalState = await this.emotionalEngine.processEmotionalState(
          this.biometricDevice.id,
          biometricData
        );
      }

      // Validate emotional fitness
      if (emotionalState) {
        const validation = this.emotionalEngine.validateEmotionalFitness(
          this.config.validatorId,
          emotionalState,
          this.biometricDevice?.type || 'unknown'
        );

        this.stats.emotionalScore = validation.score;

        if (!validation.isValid) {
          console.log(`VALIDATOR NODE: ${this.config.validatorName} failed emotional validation: ${validation.reason}`);
          return;
        }
      }

      // Participate in consensus
      const blockchainState = this.blockchain.getBlockchainState();
      const canValidate = this.validator.canParticipateInConsensus(blockchainState.currentBlock);

      if (canValidate) {
        // Validate current block
        const isValid = await this.validateBlock(latestBlock, emotionalState);
        
        if (isValid) {
          this.stats.blocksValidated++;
          this.stats.lastActivity = Date.now();
          
          console.log(`VALIDATOR NODE: ${this.config.validatorName} validated block ${latestBlock.index}`);
        }
      }

    } catch (error) {
      console.error(`VALIDATOR NODE: Validation failed for ${this.config.validatorName}:`, error);
    }
  }

  /**
   * Validate a block
   */
  private async validateBlock(block: Block, emotionalState: EmotionalState | null): Promise<boolean> {
    try {
      // Basic block validation
      if (!block.isValid()) {
        return false;
      }

      // Emotional state validation
      if (emotionalState) {
        const validation = this.emotionalEngine.validateEmotionalFitness(
          this.config.validatorId,
          emotionalState,
          this.biometricDevice?.type || 'unknown'
        );

        if (!validation.isValid) {
          return false;
        }
      }

      // Transaction validation
      for (const transaction of block.transactions) {
        if (!transaction.verify()) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`VALIDATOR NODE: Block validation error:`, error);
      return false;
    }
  }

  /**
   * Update uptime statistics
   */
  private updateUptime(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.stats.lastActivity;
    
    // If active within last 5 minutes, count as uptime
    if (timeSinceLastActivity < 300000) {
      this.stats.uptime += 30; // 30 seconds per validation cycle
    }
  }

  /**
   * Handle slashing event
   */
  public handleSlashing(reason: string, penalty: number): void {
    this.stats.slashingCount++;
    this.stats.status = 'slashed';
    this.validator.slash(penalty);
    
    console.log(`VALIDATOR NODE: ${this.config.validatorName} slashed for ${reason}, penalty: ${penalty} EMO`);
  }

  /**
   * Get validator information
   */
  public getValidatorInfo() {
    return {
      config: this.config,
      validator: this.validator,
      stats: this.stats,
      isRunning: this.isRunning,
      hasBiometricDevice: !!this.biometricDevice,
      miningStats: this.miningModule.getMiningStats()
    };
  }

  /**
   * Get current emotional state
   */
  public async getCurrentEmotionalState(): Promise<EmotionalState | null> {
    if (!this.biometricDevice) {
      return null;
    }

    try {
      const biometricData = await this.biometricDevice.readData();
      return await this.emotionalEngine.processEmotionalState(
        this.biometricDevice.id,
        biometricData
      );
    } catch (error) {
      console.error(`VALIDATOR NODE: Failed to get emotional state:`, error);
      return null;
    }
  }

  /**
   * Update stake amount
   */
  public updateStake(newStakeAmount: number): void {
    this.validator.updateStake(newStakeAmount);
    this.config.stakeAmount = newStakeAmount;
    console.log(`VALIDATOR NODE: Updated stake for ${this.config.validatorName} to ${newStakeAmount} EMO`);
  }

  /**
   * Get validator statistics
   */
  public getStats(): ValidatorStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      blocksValidated: 0,
      totalRewards: 0,
      emotionalScore: 0,
      uptime: 0,
      slashingCount: 0,
      lastActivity: Date.now(),
      status: this.isRunning ? 'active' : 'inactive'
    };

    console.log(`VALIDATOR NODE: Reset statistics for ${this.config.validatorName}`);
  }
}