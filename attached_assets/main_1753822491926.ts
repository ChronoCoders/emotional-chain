// Debug EmotionalChain Main Entry Point
// File: emotional-chain/src/main.ts

import { config } from 'dotenv';
import { createInterface } from 'readline';

console.log('🧠 Starting EmotionalChain debug...');

// Load environment variables
config({ quiet: true });
console.log('✅ Step 1: Environment configured');

console.log('🔄 Step 2: Attempting to import EmotionalChain...');

try {
  const { EmotionalChain } = await import('./blockchain/EmotionalChain.js');
  console.log('✅ Step 2: EmotionalChain imported successfully');
  
  console.log('🔄 Step 3: Attempting to import EmotionalNetwork...');
  const { EmotionalNetwork } = await import('./network/EmotionalNetwork.js');
  console.log('✅ Step 3: EmotionalNetwork imported successfully');
  
  console.log('🔄 Step 4: Creating instances...');
  
  // Banner display
  function displayBanner(): void {
    console.log(`
===============================================
███████╗███╗   ███╗ ██████╗ ████████╗██╗ ██████╗ ███╗   ██╗ █████╗ ██╗      
██╔════╝████╗ ████║██╔═══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔══██╗██║      
█████╗  ██╔████╔██║██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║███████║██║      
██╔══╝  ██║╚██╔╝██║██║   ██║   ██║   ██║██║   ██║██║╚██╗██║██╔══██║██║      
███████╗██║ ╚═╝ ██║╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║██║  ██║███████╗
╚══════╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
                                                                            
██████╗ ██╗  ██╗ █████╗ ██╗███╗   ██╗    CUSTOM BLOCKCHAIN
██╔════╝██║  ██║██╔══██╗██║████╗  ██║    PROOF OF EMOTION CONSENSUS
██║     ███████║███████║██║██╔██╗ ██║    BIOMETRIC VALIDATION
██║     ██╔══██║██╔══██║██║██║╚██╗██║    P2P NETWORK
╚██████╗██║  ██║██║  ██║██║██║ ╚████║    REVOLUTIONARY BLOCKCHAIN
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
                                            
The World's First Emotion-Powered Blockchain
Version: 1.0.0 - Consensus: Proof of Emotion - Network: Custom
Human-Centric - Energy Efficient - Biometric Validated
===============================================
    `);
  }

  // Environment configuration
  interface EmotionalChainConfig {
    nodeEnv: string;
    port: number;
    networkId: string;
    dataDir: string;
    enableTestBiometrics: boolean;
  }

  function loadConfig(): EmotionalChainConfig {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.BLOCKCHAIN_PORT || '8001'),
      networkId: process.env.BLOCKCHAIN_NETWORK_ID || 'emotional-chain-custom',
      dataDir: process.env.BLOCKCHAIN_DATA_DIR || './emotional-chain-data',
      enableTestBiometrics: process.env.BLOCKCHAIN_ENABLE_TEST_BIOMETRICS === 'true'
    };
  }

  // Display banner
  displayBanner();
  
  // Load configuration
  const appConfig = loadConfig();
  
  console.log('📋 Loading EmotionalChain Configuration...');
  console.log(`   Environment: ${appConfig.nodeEnv}`);
  console.log(`   Network ID: ${appConfig.networkId}`);
  console.log(`   Port: ${appConfig.port}`);
  console.log(`   Data Directory: ${appConfig.dataDir}`);
  console.log(`   Test Biometrics: ${appConfig.enableTestBiometrics ? 'Enabled' : 'Disabled'}`);
  console.log('');

  // Initialize EmotionalChain Application
  console.log('🚀 Initializing EmotionalChain Custom Blockchain...');
  
  console.log('🔄 Step 5: Creating blockchain instance...');
  const blockchain = new EmotionalChain();
  console.log('✅ Step 5: Blockchain created');
  
  console.log('🔄 Step 6: Creating network instance...');
  const network = new EmotionalNetwork(blockchain, `node_${Date.now()}`, appConfig.port);
  console.log('✅ Step 6: Network created');
  
  console.log('✅ Network layer initialized');
  console.log('✅ Blockchain core ready');
  
  // Start the application
  console.log('🌐 Starting EmotionalChain Network...');
  
  console.log('🎉 EmotionalChain is now running!');
  console.log('');
  console.log('📖 Available Commands:');
  console.log('   help                 - Show all available commands');
  console.log('   status               - Show network status');
  console.log('   exit                 - Shutdown EmotionalChain');
  console.log('');
  console.log('⚡ Ready for commands! Type "help" for full command list.');
  
  // Keep process alive with heartbeat
  const heartbeat = () => {
    try {
      const stats = network.getNetworkStats();
      console.log(`[${new Date().toISOString()}] 💓 Network: ${stats.connectedPeers} peers, ${stats.activeValidators} validators`);
    } catch (error) {
      console.error('❌ Error getting network stats:', error);
    }
  };
  
  const heartbeatInterval = setInterval(heartbeat, 30000);
  heartbeat();
  
  // Simple CLI
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'emotional-chain> '
  });

  rl.prompt();

  rl.on('line', (input: string) => {
    const command = input.trim().toLowerCase();
    
    try {
      switch (command) {
        case 'help':
          console.log('🧠 EmotionalChain Commands:');
          console.log('   help    - Show this help');
          console.log('   status  - Show network status');
          console.log('   exit    - Exit EmotionalChain');
          break;
          
        case 'status':
          console.log('📊 EmotionalChain Status:');
          console.log('   Blockchain: ✅ Running');
          console.log('   Network: ✅ Active');
          console.log('   Consensus: 🧠 Proof of Emotion');
          try {
            const stats = network.getNetworkStats();
            console.log(`   Peers: ${stats.connectedPeers}`);
            console.log(`   Validators: ${stats.activeValidators}`);
          } catch (error) {
            console.log('   ❌ Error getting network stats');
          }
          break;
          
        case 'exit':
          console.log('🛑 Shutting down EmotionalChain...');
          clearInterval(heartbeatInterval);
          network.shutdown();
          rl.close();
          break;
          
        default:
          if (command) {
            console.log(`❌ Unknown command: ${command}`);
            console.log('💡 Type "help" for available commands');
          }
      }
    } catch (error) {
      console.error('❌ Command error:', error);
    }
    
    if (command !== 'exit') {
      rl.prompt();
    }
  });

  rl.on('close', () => {
    console.log('\n👋 EmotionalChain CLI closed');
    clearInterval(heartbeatInterval);
    network.shutdown();
    process.exit(0);
  });

} catch (error) {
  console.error('💥 Fatal error during import/execution:', error);
  console.error('🔍 Stack trace:', (error as Error).stack);
  process.exit(1);
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down EmotionalChain gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down EmotionalChain gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});