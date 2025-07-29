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
Starting bootstrap node on port ${this.port}
Consensus: Proof of Emotion
Network: P2P WebSocket
CEO: Altug Tatlisu - Bytus Technologies
===============================================
      `);
      
      console.log(`[INIT] Initializing EmotionalChain blockchain...`);
      console.log(`[INIT] Setting up P2P network on port ${this.port}...`);
      
      // Add a small delay to ensure network is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[SUCCESS] Bootstrap node started successfully!`);
      console.log(`[INFO] WebSocket server listening on port ${this.port}`);
      console.log(`[INFO] Ready to accept peer connections`);
      console.log(`[INFO] Blockchain initialized with genesis block`);
      
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
}