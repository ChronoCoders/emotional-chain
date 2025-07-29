import { storage } from '../storage';
import { type Block, type Transaction, type Validator, type BiometricData, type NetworkStats } from '@shared/schema';
import { BootstrapNode } from '../blockchain/BootstrapNode';
import { EmotionalWallet } from '../blockchain/EmotionalWallet';

export class EmotionalChainService {
  private isRunning: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private bootstrapNode: BootstrapNode | null = null;
  private wallet: EmotionalWallet | null = null;

  constructor() {
    this.initializeBlockchain();
    this.startHeartbeat();
  }

  private async initializeRealBlockchain() {
    try {
      console.log('🔄 Starting EmotionalChain Bootstrap Node...');
      
      // Initialize bootstrap node with your actual blockchain
      this.bootstrapNode = new BootstrapNode(8000);
      await this.bootstrapNode.start();
      
      // Initialize wallet with the bootstrap node's blockchain and network
      this.wallet = new EmotionalWallet(
        this.bootstrapNode.getBlockchain(), 
        this.bootstrapNode.getNetwork()
      );
      console.log('✅ EmotionalWallet initialized');
      
      this.isRunning = true;
      console.log('🎉 EmotionalChain Bootstrap Node is fully operational!');
      
    } catch (error) {
      console.error('❌ Failed to start EmotionalChain Bootstrap Node:', error);
      this.isRunning = false;
    }
  }

  // Helper methods to access blockchain and network through bootstrap node
  private get blockchain() {
    return this.bootstrapNode?.getBlockchain();
  }

  private get network() {
    return this.bootstrapNode?.getNetwork();
  }

  private async initializeBlockchain() {
    await this.initializeRealBlockchain();
  }

  public async getNetworkStatus() {
    if (this.bootstrapNode && this.isRunning) {
      try {
        const realStats = this.bootstrapNode.getNetwork().getNetworkStats();
        return {
          isRunning: this.isRunning,
          stats: {
            id: crypto.randomUUID(),
            connectedPeers: realStats.connectedPeers || 0,
            activeValidators: realStats.activeValidators || 0,
            blockHeight: realStats.blockHeight || 0,
            consensusPercentage: realStats.consensusPercentage || "0.00",
            networkStress: realStats.networkStress || "0.00",
            networkEnergy: realStats.networkEnergy || "0.00",
            networkFocus: realStats.networkFocus || "0.00",
            timestamp: new Date()
          },
          validators: await this.getValidators(),
          latestBlock: await this.getLatestBlock(),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error getting real network status:', error);
      }
    }
    
    return {
      isRunning: false,
      stats: null,
      validators: [],
      latestBlock: null,
      timestamp: new Date().toISOString()
    };
  }

  private async getLatestBlock() {
    if (this.bootstrapNode && this.isRunning) {
      try {
        const latestBlock = this.bootstrapNode.getBlockchain().getLatestBlock();
        if (latestBlock) {
          return {
            id: latestBlock.hash || crypto.randomUUID(),
            height: latestBlock.index || 0,
            hash: latestBlock.hash || '',
            previousHash: latestBlock.previousHash || '',
            timestamp: new Date(latestBlock.timestamp || Date.now()),
            transactions: latestBlock.transactions || [],
            validator: latestBlock.validator || '',
            emotionalScore: latestBlock.emotionalScore || "0.00",
            consensusScore: latestBlock.consensusScore || "0.00",
            authenticity: latestBlock.authenticity || "0.00"
          };
        }
      } catch (error) {
        console.error('Error getting latest block:', error);
      }
    }
    return null;
  }

  public async getBlocks(limit: number = 10) {
    if (this.blockchain && this.isRunning) {
      try {
        const chain = this.blockchain.getChain();
        return chain.slice(-limit).map((block: any) => ({
          id: block.hash || crypto.randomUUID(),
          height: block.index || 0,
          hash: block.hash || '',
          previousHash: block.previousHash || '',
          timestamp: new Date(block.timestamp || Date.now()),
          transactions: block.transactions || [],
          validator: block.validator || '',
          emotionalScore: block.emotionalScore || "0.00",
          consensusScore: block.consensusScore || "0.00",
          authenticity: block.authenticity || "0.00"
        }));
      } catch (error) {
        console.error('Error getting real blocks:', error);
      }
    }
    return [];
  }

  public async getTransactions(limit: number = 10) {
    if (this.blockchain && this.isRunning) {
      try {
        const blocks = this.blockchain.getChain();
        const transactions: any[] = [];
        
        blocks.forEach((block: any) => {
          if (block.transactions) {
            block.transactions.forEach((tx: any) => {
              transactions.push({
                id: tx.id || crypto.randomUUID(),
                from: tx.from || '',
                to: tx.to || '',
                amount: tx.amount || "0.00",
                fee: tx.fee || "0.00",
                timestamp: new Date(tx.timestamp || Date.now()),
                blockHash: block.hash || '',
                status: tx.status || 'pending',
                emotionalData: tx.emotionalData || null
              });
            });
          }
        });
        
        return transactions.slice(-limit);
      } catch (error) {
        console.error('Error getting real transactions:', error);
      }
    }
    return [];
  }

  public async getValidators() {
    if (this.network && this.isRunning) {
      try {
        const validators = this.network.getValidatorPeers();
        return validators.map((validator: any) => ({
          id: validator.id || crypto.randomUUID(),
          address: validator.address || '',
          stake: validator.stake || "0.00",
          isActive: validator.isActive || false,
          uptime: validator.uptime || "0.00",
          authScore: validator.authScore || "0.00",
          device: validator.device || 'Unknown',
          lastValidation: new Date(validator.lastValidation || Date.now())
        }));
      } catch (error) {
        console.error('Error getting real validators:', error);
      }
    }
    return [];
  }

  public async getBiometricData(validatorId: string) {
    if (this.blockchain && this.isRunning) {
      try {
        // Get real biometric data from your blockchain
        // This would query your blockchain for validator biometric data
        return null; // Will be populated when blockchain is connected
      } catch (error) {
        console.error('Error getting real biometric data:', error);
      }
    }
    return null;
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
      if (!this.isRunning || !this.wallet) {
        return `❌ EmotionalChain Wallet - Not Connected
⏳ Waiting for blockchain connection...
💡 Start your EmotionalChain blockchain first`;
      }
      
      try {
        // Get wallet data from your real blockchain
        const walletData = this.wallet.getStatus();
        return `🧠 EmotionalChain Wallet - Connected

💰 Account Information:
   Address: ${walletData.address}
   Balance: ${walletData.balance} EMO
   Staked: ${walletData.staked} EMO
   Type: ${walletData.type}

🧠 Emotional Profile:
   Authenticity Score: ${walletData.authScore}%
   Stress Threshold: ${walletData.stressThreshold}%
   Validation History: ${walletData.validationCount} blocks
   Reputation: ${walletData.reputation}%`;
      } catch (error) {
        return `❌ Error getting wallet status: ${error}`;
      }
    }
    
    return 'Usage: wallet [--status]';
  }

  private async handleMineCommand(args: string[]): Promise<string> {
    const flag = args[0] || '--start';
    
    if (!this.isRunning || !this.blockchain) {
      return `❌ EmotionalChain Mining - Not Available
⏳ Blockchain not connected
💡 Start your EmotionalChain blockchain first`;
    }
    
    if (flag === '--start' || flag === '--biometric-validation') {
      try {
        // Use your real blockchain mining functionality
        const miningResult = this.blockchain.startMining();
        return `⛏️ Starting mining with biometric validation...
🧠 Processing biometric data from your blockchain...
✅ ${miningResult.message || 'Mining initiated'}`;
      } catch (error) {
        return `❌ Mining error: ${error}`;
      }
    }
    
    return 'Usage: mine [--start | --biometric-validation]';
  }

  private async handleNetworkCommand(args: string[]): Promise<string> {
    const flag = args[0] || '--info';
    
    if (!this.isRunning || !this.network) {
      return `❌ EmotionalChain Network - Not Connected
⏳ Network not available
💡 Start your EmotionalChain blockchain first`;
    }
    
    if (flag === '--info' || flag === '--peers') {
      try {
        const stats = this.network.getNetworkStats();
        return `🌐 Network Peer Discovery:
   Connected Peers: ${stats.connectedPeers}
   Active Validators: ${stats.activeValidators}
   Network Latency: ${stats.latency || 'N/A'}
   Consensus Participation: ${stats.consensusPercentage}%`;
      } catch (error) {
        return `❌ Network error: ${error}`;
      }
    }
    
    return 'Usage: network [--info | --peers]';
  }

  private async handleStatusCommand(): Promise<string> {
    if (!this.isRunning) {
      return `📊 EmotionalChain Status:
   Blockchain: ❌ Not Connected
   Network: ❌ Not Connected
   Consensus: ❌ Not Active
   💡 Start your EmotionalChain blockchain to see live status`;
    }

    try {
      const networkStats = this.network?.getNetworkStats();
      const latestBlock = this.blockchain?.getLatestBlock();
      
      return `📊 EmotionalChain Status:
   Blockchain: ✅ Running
   Network: ✅ Active
   Consensus: 🧠 Proof of Emotion
   Peers: ${networkStats?.connectedPeers || 0}
   Validators: ${networkStats?.activeValidators || 0}
   Latest Block: #${latestBlock?.index || 0}
   Block Hash: ${latestBlock?.hash?.substring(0, 12) || 'N/A'}...`;
    } catch (error) {
      return `❌ Status error: ${error}`;
    }
  }

  private async handleHistoryCommand(): Promise<string> {
    if (!this.isRunning || !this.blockchain) {
      return `💸 Recent Transaction History:
❌ Blockchain not connected
💡 Start your EmotionalChain blockchain to see history`;
    }

    try {
      const chain = this.blockchain.getChain();
      const recentBlocks = chain.slice(-5);
      
      let result = '📜 EmotionalChain Recent History:\n\n';
      
      result += '🔗 Recent Blocks:\n';
      if (recentBlocks.length === 0) {
        result += '   No blocks found\n';
      } else {
        recentBlocks.forEach((block: any) => {
          result += `   Block #${block.index} - ${block.hash.substring(0, 10)}... - ${block.emotionalScore || 'N/A'}% emotion\n`;
        });
      }
      
      return result;
    } catch (error) {
      return `❌ History error: ${error}`;
    }
  }

  private startHeartbeat() {
    this.isRunning = true;
    this.heartbeatInterval = setInterval(async () => {
      // Heartbeat for blockchain connection - no data simulation
      if (this.blockchain && this.network) {
        try {
          // When real blockchain is connected, sync data here
          // For now, just maintain connection
        } catch (error) {
          console.error('Blockchain heartbeat error:', error);
        }
      }
    }, 5000);
  }

  public async startMining(): Promise<any> {
    if (this.bootstrapNode && this.isRunning) {
      return this.bootstrapNode.startMining();
    }
    return { error: 'Bootstrap node not running' };
  }

  public async stopMining(): Promise<any> {
    if (this.bootstrapNode && this.isRunning) {
      return this.bootstrapNode.stopMining();
    }
    return { error: 'Bootstrap node not running' };
  }

  public async getMiningStatus(): Promise<any> {
    if (this.bootstrapNode && this.isRunning) {
      return this.bootstrapNode.getMiningStatus();
    }
    return { error: 'Bootstrap node not running' };
  }

  public async getTokenEconomics(): Promise<any> {
    if (this.bootstrapNode && this.isRunning) {
      return this.bootstrapNode.getBlockchain().getTokenEconomics();
    }
    return { error: 'Bootstrap node not running' };
  }

  public shutdown() {
    this.isRunning = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Shutdown real blockchain connections
    if (this.network) {
      try {
        this.network.shutdown();
      } catch (error) {
        console.error('Error shutting down network:', error);
      }
    }
  }
}

export const emotionalChainService = new EmotionalChainService();
