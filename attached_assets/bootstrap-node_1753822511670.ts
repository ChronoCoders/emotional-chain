// EmotionalChain Bootstrap Node
// File: emotional-chain/src/network/bootstrap-node.ts

import { EmotionalChain } from '../blockchain/EmotionalChain.js';
import { EmotionalNetwork } from './EmotionalNetwork.js';
import { createInterface } from 'readline';

class BootstrapNode {
  private blockchain: EmotionalChain;
  private network: EmotionalNetwork;
  private port: number;
  private statsInterval: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;

  constructor(port: number = 8000) {
    this.port = port;
    this.blockchain = new EmotionalChain();
    this.network = new EmotionalNetwork(this.blockchain, `bootstrap_${port}`, port);
    this.setupShutdownHandlers();
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
        if (!this.network) {
          console.warn('Network instance not available');
          return;
        }
        
        const stats = this.network.getNetworkStats();
        
        if (!stats) {
          console.warn('No network stats available');
          return;
        }
        
        const { connectedPeers = 0, activeValidators = 0 } = stats;
        const timestamp = new Date().toISOString();
        
        console.log(`[${timestamp}] Bootstrap Status: ${connectedPeers} peers, ${activeValidators} validators`);
        
        if (connectedPeers === 0) {
          console.log('[INFO] No peers connected - bootstrap node ready for connections');
        }
        
        if (activeValidators > 0 && connectedPeers === 0) {
          console.warn('[WARNING] Validators active but no peers connected - potential issue');
        }
        
        // Display blockchain stats
        try {
          const chainStats = this.blockchain.getChainStats();
          console.log(`[INFO] Blockchain: ${chainStats.totalBlocks} blocks, ${chainStats.totalValidators} validators`);
          console.log(`[INFO] Average consensus: ${(chainStats.avgConsensusScore * 100).toFixed(1)}%, authenticity: ${(chainStats.avgAuthenticity * 100).toFixed(1)}%`);
        } catch (error) {
          console.error('[ERROR] Failed to get blockchain stats:', error);
        }
        
      } catch (error) {
        console.error('Error getting network stats:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private setupShutdownHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}, initiating graceful shutdown...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await this.shutdown();
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      await this.shutdown();
      process.exit(1);
    });
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log('Shutting down bootstrap node...');
    
    try {
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
        console.log('Stats monitoring stopped');
      }
      
      if (this.network && typeof this.network.shutdown === 'function') {
        this.network.shutdown();
        console.log('Network shutdown complete');
      } else if (this.network && typeof (this.network as any).stop === 'function') {
        await (this.network as any).stop();
        console.log('Network shutdown complete');
      }
      
      if (this.blockchain && typeof this.blockchain.shutdown === 'function') {
        this.blockchain.shutdown();
        console.log('Blockchain cleanup complete');
      }
      
      console.log('Bootstrap node shutdown complete');
      
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  public getStatus(): object {
    try {
      const networkStats = this.network?.getNetworkStats() || { connectedPeers: 0, activeValidators: 0 };
      const chainStats = this.blockchain?.getChainStats() || { 
        totalBlocks: 0, 
        totalValidators: 0, 
        avgConsensusScore: 0, 
        avgAuthenticity: 0 
      };
      
      return {
        port: this.port,
        isRunning: !this.isShuttingDown,
        networkStats,
        chainStats,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        port: this.port,
        isRunning: !this.isShuttingDown,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Additional utility methods
  public getNetworkInfo(): object {
    try {
      const peers = this.network?.getPeers() || [];
      const validators = this.network?.getValidatorPeers() || [];
      
      return {
        totalPeers: peers.length,
        validatorPeers: validators.length,
        peerInfo: peers.map(peer => ({
          id: peer.id,
          isValidator: peer.isValidator,
          lastSeen: new Date(peer.lastSeen).toISOString(),
          emotionalReliability: peer.emotionalReliability
        }))
      };
    } catch (error) {
      return {
        error: (error as Error).message
      };
    }
  }

  public getBlockchainInfo(): object {
    try {
      const chain = this.blockchain.getChain();
      const latestBlock = this.blockchain.getLatestBlock();
      const stats = this.blockchain.getChainStats();
      
      return {
        chainLength: chain.length,
        latestBlockHash: latestBlock.hash,
        latestBlockTimestamp: new Date(latestBlock.timestamp).toISOString(),
        totalValidators: stats.totalValidators,
        avgConsensusScore: stats.avgConsensusScore,
        avgAuthenticity: stats.avgAuthenticity,
        difficulty: stats.difficulty,
        miningReward: stats.miningReward
      };
    } catch (error) {
      return {
        error: (error as Error).message
      };
    }
  }
}

async function main() {
  try {
    const portArg = process.argv[2];
    const port = portArg ? parseInt(portArg) : 8000;
    
    if (isNaN(port) || port < 1024 || port > 65535) {
      throw new Error(`Invalid port: ${portArg}. Port must be between 1024 and 65535`);
    }
    
    console.log(`Initializing EmotionalChain bootstrap node on port ${port}...`);
    console.log(`Research by: Altug Tatlisu, CEO Bytus Technologies`);
    console.log('');
    
    const bootstrap = new BootstrapNode(port);
    await bootstrap.start();
    
    // Keep the process alive
    process.stdin.resume();
    
    // Optional: Add simple CLI for bootstrap node
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'bootstrap> '
    });

    console.log('\nBootstrap node commands: status, network, blockchain, quit');
    rl.prompt();

    rl.on('line', (input: string) => {
      const command = input.trim().toLowerCase();
      
      switch (command) {
        case 'status':
          console.log(JSON.stringify(bootstrap.getStatus(), null, 2));
          break;
        case 'network':
          console.log(JSON.stringify(bootstrap.getNetworkInfo(), null, 2));
          break;
        case 'blockchain':
          console.log(JSON.stringify(bootstrap.getBlockchainInfo(), null, 2));
          break;
        case 'quit':
        case 'exit':
          console.log('Shutting down bootstrap node...');
          bootstrap.shutdown().then(() => process.exit(0));
          return;
        case 'help':
          console.log('Available commands: status, network, blockchain, quit');
          break;
        default:
          if (command) {
            console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
          }
      }
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('Shutting down bootstrap node...');
      bootstrap.shutdown().then(() => process.exit(0));
    });
    
  } catch (error) {
    console.error('Bootstrap node failed to start:', error);
    process.exit(1);
  }
}

// Export for use as module
export { BootstrapNode };

// Check if this file is being run directly using import.meta
// This is the ES module equivalent of require.main === module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main();
}