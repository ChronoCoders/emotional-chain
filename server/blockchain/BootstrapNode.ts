// EmotionalChain Bootstrap Node Implementation
import { EmotionalChain } from './EmotionalChain';
import { EmotionalNetwork } from './EmotionalNetwork';

export class BootstrapNode {
  private blockchain: EmotionalChain;
  private network: EmotionalNetwork;
  private port: number;
  private statsInterval: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;

  constructor(port: number = 8000) {
    this.port = port;
    this.blockchain = new EmotionalChain();
    this.network = new EmotionalNetwork(this.blockchain, `bootstrap_${port}`, port);
  }

  public async start(): Promise<void> {
    try {
      console.log(`
===============================================
         EMOTIONALCHAIN BOOTSTRAP NODE
===============================================
Port: ${this.port}
Consensus: Proof of Emotion
Network: P2P WebSocket
===============================================`);
      
      console.log(`[INIT] Initializing EmotionalChain blockchain...`);
      console.log(`[INIT] Setting up P2P network on port ${this.port}...`);
      
      // Add a small delay to ensure network is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[SUCCESS] Bootstrap node started successfully!`);
      console.log(`[INFO] WebSocket server listening on port ${this.port}`);
      console.log(`[INFO] Ready to accept peer connections`);
      console.log(`[INFO] Blockchain initialized with genesis block`);
      
      // Start mining with test validators
      this.startMining();
      
      this.startStatsMonitoring();
      
      console.log(`\n[READY] Bootstrap node fully operational on port ${this.port}`);
      console.log(`[READY] Waiting for validator nodes to connect...`);
      console.log(`[READY] Type 'help' for available commands\n`);
      
    } catch (error) {
      console.error('[ERROR] Failed to start bootstrap node:', error);
      await this.shutdown();
      throw error;
    }
  }

  private startStatsMonitoring(): void {
    this.statsInterval = setInterval(() => {
      if (this.isShuttingDown) {
        return;
      }
      
      try {
        const stats = this.network.getNetworkStats();
        const { connectedPeers = 0, activeValidators = 0 } = stats;
        const timestamp = new Date().toISOString();
        
        console.log(`[${timestamp}] Bootstrap Status: ${connectedPeers} peers, ${activeValidators} validators`);
        
        if (connectedPeers === 0) {
          console.log('[INFO] No peers connected - bootstrap node ready for connections');
        }
        
        // Display blockchain stats
        const chainStats = this.blockchain.getChainStats();
        console.log(`[INFO] Blockchain: ${chainStats.totalBlocks} blocks, ${chainStats.totalValidators} validators`);
        console.log(`[INFO] Average consensus: ${(chainStats.avgConsensusScore * 100).toFixed(1)}%, authenticity: ${(chainStats.avgAuthenticity * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.error('Error getting network stats:', error);
      }
    }, 30000); // Every 30 seconds
  }

  public async shutdown(): Promise<void> {
    console.log('[SHUTDOWN] Shutting down bootstrap node...');
    this.isShuttingDown = true;
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    if (this.network) {
      this.network.shutdown();
    }
    
    console.log('[SHUTDOWN] Bootstrap node stopped');
  }

  public getBlockchain(): EmotionalChain {
    return this.blockchain;
  }

  public getNetwork(): EmotionalNetwork {
    return this.network;
  }

  public startMining(): any {
    // Add test validators with biometric data for mining
    this.addTestValidators();
    
    // Start blockchain mining
    const result = this.blockchain.startMining();
    console.log('🚀 Bootstrap node mining started');
    return result;
  }

  public stopMining(): any {
    const result = this.blockchain.stopMining();
    console.log('🛑 Bootstrap node mining stopped');
    return result;
  }

  private addTestValidators(): void {
    // Add test validators with different emotional/biometric profiles
    const testValidators = [
      {
        id: 'validator_alpha_001',
        biometricData: {
          heartRate: 72,
          stressLevel: 0.2,
          focusLevel: 0.9,
          authenticity: 0.95
        }
      },
      {
        id: 'validator_beta_002', 
        biometricData: {
          heartRate: 68,
          stressLevel: 0.15,
          focusLevel: 0.85,
          authenticity: 0.92
        }
      },
      {
        id: 'validator_gamma_003',
        biometricData: {
          heartRate: 75,
          stressLevel: 0.25,
          focusLevel: 0.88,
          authenticity: 0.94
        }
      }
    ];

    testValidators.forEach(validator => {
      this.blockchain.addValidator(validator.id, validator.biometricData);
      this.network.addValidator(validator);
    });

    // Add some test transactions for mining
    this.addTestTransactions();
  }

  private addTestTransactions(): void {
    const testTransactions = [
      {
        from: 'user_001',
        to: 'user_002', 
        amount: 50,
        type: 'transfer',
        timestamp: Date.now()
      },
      {
        from: 'user_003',
        to: 'user_001',
        amount: 25,
        type: 'transfer', 
        timestamp: Date.now()
      },
      {
        from: 'user_004',
        to: 'user_005',
        amount: 75,
        type: 'transfer',
        timestamp: Date.now()
      }
    ];

    testTransactions.forEach(tx => {
      this.blockchain.addTransaction(tx);
    });

    console.log(`📝 Added ${testTransactions.length} test transactions for mining`);
  }

  public getMiningStatus(): any {
    return this.blockchain.getMiningStatus();
  }
}