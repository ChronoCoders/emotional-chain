import { storage } from '../storage';
import { type Block, type Transaction, type Validator, type BiometricData, type NetworkStats } from '@shared/schema';

export class EmotionalChainService {
  private isRunning: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private validationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
    this.startValidationSimulation();
  }

  public async getNetworkStatus() {
    const stats = await storage.getLatestNetworkStats();
    const validators = await storage.getActiveValidators();
    const latestBlock = await storage.getLatestBlock();

    return {
      isRunning: this.isRunning,
      stats,
      validators,
      latestBlock,
      timestamp: new Date().toISOString()
    };
  }

  public async getBlocks(limit: number = 10) {
    return await storage.getBlocks(limit);
  }

  public async getTransactions(limit: number = 10) {
    return await storage.getTransactions(limit);
  }

  public async getValidators() {
    return await storage.getValidators();
  }

  public async getBiometricData(validatorId: string) {
    return await storage.getLatestBiometricData(validatorId);
  }

  public async executeCommand(command: string, args: string[] = []): Promise<string> {
    try {
      switch (command.toLowerCase()) {
        case 'wallet':
          return await this.handleWalletCommand(args);
        case 'mine':
          return await this.handleMineCommand(args);
        case 'network':
          return await this.handleNetworkCommand(args);
        case 'status':
          return await this.handleStatusCommand();
        case 'history':
          return await this.handleHistoryCommand();
        default:
          return `Unknown command: ${command}. Type 'help' for available commands.`;
      }
    } catch (error) {
      return `Error executing command: ${(error as Error).message}`;
    }
  }

  private async handleWalletCommand(args: string[]): Promise<string> {
    const subcommand = args[0] || '--status';
    
    if (subcommand === '--status') {
      const validators = await storage.getActiveValidators();
      const myValidator = validators[0]; // Simulate current user validator
      
      return `🧠 EmotionalChain Wallet v2.1.0 - Connected
📊 Research by: Altug Tatlisu, CEO Bytus Technologies

💰 Account Information:
   Address: ${myValidator?.address || '0xA7b2C9E8F1D3456789AbCdEf0123456789AbCdEf'}
   Balance: 15,420.75 EMO
   Staked: ${myValidator?.stake || '10,000.00'} EMO
   Type: Validator Node

🧠 Emotional Profile:
   Authenticity Score: ${myValidator?.authScore || '94.7'}%
   Stress Threshold: 68%
   Validation History: 1,247 blocks
   Reputation: 98.3%`;
    }
    
    return 'Usage: wallet [--status]';
  }

  private async handleMineCommand(args: string[]): Promise<string> {
    const flag = args[0] || '--start';
    
    if (flag === '--start' || flag === '--biometric-validation') {
      // Simulate biometric validation and mining
      const heartRate = Math.floor(Math.random() * 20) + 65; // 65-85 BPM
      const stressLevel = Math.floor(Math.random() * 30) + 15; // 15-45%
      const authenticity = Math.floor(Math.random() * 10) + 90; // 90-100%
      
      return `⛏️ Starting mining with biometric validation...
🧠 Processing biometric data...
   Heart Rate: ${heartRate}.4 BPM
   Stress Level: ${stressLevel}.1%
   Authenticity: ${authenticity}.8%
✅ Mining attempt completed - Block proposal submitted`;
    }
    
    return 'Usage: mine [--start | --biometric-validation]';
  }

  private async handleNetworkCommand(args: string[]): Promise<string> {
    const flag = args[0] || '--info';
    
    if (flag === '--info' || flag === '--peers') {
      const stats = await storage.getLatestNetworkStats();
      
      return `🌐 Network Peer Discovery:
   Connected Peers: ${stats?.connectedPeers || 127}
   Active Validators: ${stats?.activeValidators || 21}/21
   Network Latency: 45ms
   Consensus Participation: ${stats?.consensusPercentage || '89.7'}%`;
    }
    
    return 'Usage: network [--info | --peers]';
  }

  private async handleStatusCommand(): Promise<string> {
    const stats = await storage.getLatestNetworkStats();
    const validators = await storage.getActiveValidators();
    const latestBlock = await storage.getLatestBlock();
    
    return `📊 EmotionalChain Status:
   Blockchain: ✅ Running
   Network: ✅ Active
   Consensus: 🧠 Proof of Emotion
   Peers: ${stats?.connectedPeers || 127}
   Validators: ${validators.length}
   Latest Block: #${latestBlock?.height || 0}
   Block Hash: ${latestBlock?.hash?.substring(0, 12) || '0x000000000000'}...`;
  }

  private async handleHistoryCommand(): Promise<string> {
    const transactions = await storage.getTransactions(5);
    
    let result = '💸 Recent Transaction History:\n';
    if (transactions.length === 0) {
      result += '   No recent transactions found.';
    } else {
      transactions.forEach((tx, index) => {
        result += `   ${index + 1}. ${tx.hash.substring(0, 12)}... - ${tx.amount} EMO (${tx.status})\n`;
      });
    }
    
    return result;
  }

  private startHeartbeat() {
    this.isRunning = true;
    this.heartbeatInterval = setInterval(async () => {
      // Update network stats periodically
      const currentStats = await storage.getLatestNetworkStats();
      if (currentStats) {
        const updatedStats = {
          connectedPeers: Math.floor(Math.random() * 10) + 120, // 120-130
          activeValidators: 21,
          blockHeight: currentStats.blockHeight + (Math.random() > 0.7 ? 1 : 0),
          consensusPercentage: (Math.random() * 5 + 87).toFixed(2), // 87-92%
          networkStress: (Math.random() * 10 + 20).toFixed(2), // 20-30%
          networkEnergy: (Math.random() * 10 + 85).toFixed(2), // 85-95%
          networkFocus: (Math.random() * 5 + 92).toFixed(2), // 92-97%
        };
        
        await storage.createNetworkStats(updatedStats);
      }
    }, 5000); // Update every 5 seconds
  }

  private startValidationSimulation() {
    this.validationInterval = setInterval(async () => {
      const validators = await storage.getActiveValidators();
      
      // Simulate biometric data for random validator
      if (validators.length > 0) {
        const randomValidator = validators[Math.floor(Math.random() * validators.length)];
        
        const biometricData = {
          validatorId: randomValidator.id,
          heartRate: Math.floor(Math.random() * 20) + 65,
          hrv: Math.floor(Math.random() * 30) + 30,
          stressLevel: (Math.random() * 40 + 10).toFixed(2),
          focusLevel: (Math.random() * 20 + 80).toFixed(2),
          authenticity: (Math.random() * 10 + 90).toFixed(2),
        };
        
        await storage.createBiometricData(biometricData);
      }
    }, 3000); // Update every 3 seconds
  }

  public shutdown() {
    this.isRunning = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }
}

export const emotionalChainService = new EmotionalChainService();
