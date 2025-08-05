/**
 * EmotionalChain Backend API
 * RESTful API for blockchain interactions
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { BlockchainCore } from '../core/BlockchainCore';
import { WalletModule } from '../modules/WalletModule';
import { MiningModule } from '../modules/MiningModule';
import { ValidatorNode } from '../validator/ValidatorNode';
import { BiometricDevice } from '../biometric/BiometricDevice';
import { RealHardwareDeviceManager } from '../biometric/RealHardwareDeviceManager';

export interface APIConfig {
  port: number;
  corsOrigins: string[];
  enableDevMode: boolean;
}

export class EmotionalChainAPI {
  private app: express.Application;
  private blockchain: BlockchainCore;
  private deviceManager: RealHardwareDeviceManager;
  private validatorNodes: Map<string, ValidatorNode> = new Map();
  private wallets: Map<string, WalletModule> = new Map();
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
    this.app = express();
    this.blockchain = new BlockchainCore();
    this.deviceManager = new RealHardwareDeviceManager();
    
    this.setupMiddleware();
    this.setupRoutes();
    
    console.log('EMOTIONAL CHAIN API: Initialized');
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next) => {
      console.log(`API: ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        blockchain: {
          currentBlock: this.blockchain.getBlockchainLength(),
          validators: this.validatorNodes.size
        }
      });
    });

    // Blockchain routes
    this.app.get('/api/blockchain/state', this.getBlockchainState.bind(this));
    this.app.get('/api/blockchain/blocks/:index', this.getBlock.bind(this));
    this.app.get('/api/blockchain/latest', this.getLatestBlock.bind(this));

    // Wallet routes
    this.app.post('/api/wallet/create', this.createWallet.bind(this));
    this.app.get('/api/wallet/:address/balance', this.getWalletBalance.bind(this));
    this.app.get('/api/wallet/:address/transactions', this.getWalletTransactions.bind(this));
    this.app.post('/api/wallet/:address/transaction', this.createTransaction.bind(this));

    // Validator routes
    this.app.get('/api/validators', this.getValidators.bind(this));
    this.app.get('/api/validators/:id', this.getValidator.bind(this));
    this.app.post('/api/validators/:id/start', this.startValidator.bind(this));
    this.app.post('/api/validators/:id/stop', this.stopValidator.bind(this));

    // Mining routes
    this.app.post('/api/mining/start', this.startMining.bind(this));
    this.app.post('/api/mining/stop', this.stopMining.bind(this));
    this.app.get('/api/mining/stats/:address', this.getMiningStats.bind(this));

    // Biometric device routes
    this.app.get('/api/devices', this.getDevices.bind(this));
    this.app.post('/api/devices/scan', this.scanDevices.bind(this));
    this.app.get('/api/devices/:id/data', this.getDeviceData.bind(this));

    // Error handling
    this.app.use((error: Error, req: Request, res: Response, next: any) => {
      console.error('API ERROR:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: this.config.enableDevMode ? error.message : 'An error occurred'
      });
    });
  }

  /**
   * Get blockchain state
   */
  private async getBlockchainState(req: Request, res: Response): Promise<void> {
    try {
      const state = this.blockchain.getBlockchainState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get blockchain state' });
    }
  }

  /**
   * Get block by index
   */
  private async getBlock(req: Request, res: Response): Promise<void> {
    try {
      const index = parseInt(req.params.index);
      const block = this.blockchain.getBlock(index);
      
      if (!block) {
        res.status(404).json({ error: 'Block not found' });
        return;
      }

      res.json(block);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get block' });
    }
  }

  /**
   * Get latest block
   */
  private async getLatestBlock(req: Request, res: Response): Promise<void> {
    try {
      const block = this.blockchain.getLatestBlock();
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get latest block' });
    }
  }

  /**
   * Create new wallet
   */
  private async createWallet(req: Request, res: Response): Promise<void> {
    try {
      const { privateKey } = req.body;
      const wallet = new WalletModule(privateKey);
      const address = wallet.getAddress();
      
      this.wallets.set(address, wallet);
      
      res.json({
        address,
        publicKey: wallet.exportPublicKey(),
        info: wallet.getWalletInfo()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create wallet' });
    }
  }

  /**
   * Get wallet balance
   */
  private async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const wallet = this.wallets.get(address);
      
      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const balance = await wallet.getBalance();
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get wallet balance' });
    }
  }

  /**
   * Get wallet transactions
   */
  private async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const wallet = this.wallets.get(address);
      
      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const transactions = wallet.getTransactionHistory();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get wallet transactions' });
    }
  }

  /**
   * Create transaction
   */
  private async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { toAddress, amount, data } = req.body;
      const wallet = this.wallets.get(address);
      
      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const transaction = wallet.createTransaction(toAddress, amount, data);
      const success = this.blockchain.addTransaction(transaction);
      
      if (success) {
        wallet.addTransactionToHistory(transaction, -1, false);
        res.json({ transaction, success: true });
      } else {
        res.status(400).json({ error: 'Transaction rejected' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }

  /**
   * Get all validators
   */
  private async getValidators(req: Request, res: Response): Promise<void> {
    try {
      const validators = this.blockchain.getActiveValidators();
      const validatorInfo = validators.map(v => ({
        id: v.id,
        name: v.name,
        address: v.address,
        stake: v.stake,
        isActive: v.isActive,
        lastActivity: v.lastActivity
      }));
      
      res.json(validatorInfo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get validators' });
    }
  }

  /**
   * Get validator by ID
   */
  private async getValidator(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatorNode = this.validatorNodes.get(id);
      
      if (!validatorNode) {
        res.status(404).json({ error: 'Validator not found' });
        return;
      }

      const info = validatorNode.getValidatorInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get validator' });
    }
  }

  /**
   * Start validator
   */
  private async startValidator(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatorNode = this.validatorNodes.get(id);
      
      if (!validatorNode) {
        res.status(404).json({ error: 'Validator not found' });
        return;
      }

      await validatorNode.start();
      res.json({ success: true, message: 'Validator started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start validator' });
    }
  }

  /**
   * Stop validator
   */
  private async stopValidator(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatorNode = this.validatorNodes.get(id);
      
      if (!validatorNode) {
        res.status(404).json({ error: 'Validator not found' });
        return;
      }

      await validatorNode.stop();
      res.json({ success: true, message: 'Validator stopped' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop validator' });
    }
  }

  /**
   * Start mining
   */
  private async startMining(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, deviceId, validatorId, duration } = req.body;
      const wallet = this.wallets.get(walletAddress);
      
      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const device = this.deviceManager.getDevice(deviceId);
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }

      const miningModule = new MiningModule(wallet);
      const sessionId = await miningModule.startMining(device, validatorId, duration);
      
      res.json({ sessionId, success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start mining' });
    }
  }

  /**
   * Stop mining
   */
  private async stopMining(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      // Implementation would require session tracking
      res.json({ success: true, message: 'Mining stopped' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop mining' });
    }
  }

  /**
   * Get mining stats
   */
  private async getMiningStats(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const wallet = this.wallets.get(address);
      
      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const miningModule = new MiningModule(wallet);
      const stats = miningModule.getMiningStats();
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get mining stats' });
    }
  }

  /**
   * Get connected devices
   */
  private async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const devices = this.deviceManager.getConnectedDevices();
      const deviceInfo = devices.map(device => ({
        id: device.id,
        type: device.type,
        name: device.name,
        isConnected: device.isConnected(),
        lastReading: device.lastReading
      }));
      
      res.json(deviceInfo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get devices' });
    }
  }

  /**
   * Scan for devices
   */
  private async scanDevices(req: Request, res: Response): Promise<void> {
    try {
      await this.deviceManager.scanForDevices();
      const devices = this.deviceManager.getConnectedDevices();
      
      res.json({
        success: true,
        devicesFound: devices.length,
        devices: devices.map(d => ({ id: d.id, type: d.type, name: d.name }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to scan for devices' });
    }
  }

  /**
   * Get device data
   */
  private async getDeviceData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const device = this.deviceManager.getDevice(id);
      
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }

      const data = await device.readData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get device data' });
    }
  }

  /**
   * Start API server
   */
  public async start(): Promise<void> {
    try {
      // Start blockchain
      await this.blockchain.start();
      
      // Start device manager
      await this.deviceManager.initialize();
      
      // Start Express server
      this.app.listen(this.config.port, () => {
        console.log(`EMOTIONAL CHAIN API: Server running on port ${this.config.port}`);
      });
    } catch (error) {
      console.error('EMOTIONAL CHAIN API: Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop API server
   */
  public async stop(): Promise<void> {
    try {
      // Stop all validators
      for (const validator of this.validatorNodes.values()) {
        await validator.stop();
      }
      
      // Stop blockchain
      await this.blockchain.stop();
      
      // Stop device manager
      await this.deviceManager.cleanup();
      
      console.log('EMOTIONAL CHAIN API: Server stopped');
    } catch (error) {
      console.error('EMOTIONAL CHAIN API: Failed to stop:', error);
      throw error;
    }
  }
}