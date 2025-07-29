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
    // Add 21 validators with diverse emotional/biometric profiles for real mining
    const testValidators = [
      // Cosmic / Sci-Fi Themed - Elite Performance
      { id: 'StellarNode', biometricData: { heartRate: 65, stressLevel: 0.12, focusLevel: 0.95, authenticity: 0.98 }},
      { id: 'NebulaForge', biometricData: { heartRate: 68, stressLevel: 0.15, focusLevel: 0.92, authenticity: 0.97 }},
      { id: 'QuantumReach', biometricData: { heartRate: 70, stressLevel: 0.18, focusLevel: 0.88, authenticity: 0.93 }},
      { id: 'OrionPulse', biometricData: { heartRate: 72, stressLevel: 0.2, focusLevel: 0.9, authenticity: 0.95 }},
      { id: 'DarkMatterLabs', biometricData: { heartRate: 74, stressLevel: 0.22, focusLevel: 0.89, authenticity: 0.96 }},
      { id: 'GravityCore', biometricData: { heartRate: 69, stressLevel: 0.16, focusLevel: 0.91, authenticity: 0.94 }},
      { id: 'AstroSentinel', biometricData: { heartRate: 75, stressLevel: 0.25, focusLevel: 0.85, authenticity: 0.92 }},
      
      // Tech / Futuristic Vibes - Advanced Performance
      { id: 'ByteGuardians', biometricData: { heartRate: 73, stressLevel: 0.23, focusLevel: 0.87, authenticity: 0.91 }},
      { id: 'ZeroLagOps', biometricData: { heartRate: 76, stressLevel: 0.27, focusLevel: 0.84, authenticity: 0.89 }},
      { id: 'ChainFlux', biometricData: { heartRate: 71, stressLevel: 0.24, focusLevel: 0.86, authenticity: 0.90 }},
      { id: 'BlockNerve', biometricData: { heartRate: 77, stressLevel: 0.26, focusLevel: 0.83, authenticity: 0.88 }},
      { id: 'ValidatorX', biometricData: { heartRate: 78, stressLevel: 0.30, focusLevel: 0.82, authenticity: 0.87 }},
      { id: 'NovaSync', biometricData: { heartRate: 79, stressLevel: 0.32, focusLevel: 0.80, authenticity: 0.85 }},
      
      // Security / Trust Focused - Reliable Performance
      { id: 'IronNode', biometricData: { heartRate: 80, stressLevel: 0.29, focusLevel: 0.81, authenticity: 0.86 }},
      { id: 'SentinelTrust', biometricData: { heartRate: 82, stressLevel: 0.31, focusLevel: 0.79, authenticity: 0.84 }},
      { id: 'VaultProof', biometricData: { heartRate: 81, stressLevel: 0.33, focusLevel: 0.78, authenticity: 0.83 }},
      { id: 'SecureMesh', biometricData: { heartRate: 83, stressLevel: 0.35, focusLevel: 0.77, authenticity: 0.82 }},
      { id: 'WatchtowerOne', biometricData: { heartRate: 84, stressLevel: 0.37, focusLevel: 0.76, authenticity: 0.81 }},
      
      // Creative / Myth-Inspired - Emerging Performance
      { id: 'AetherRunes', biometricData: { heartRate: 85, stressLevel: 0.36, focusLevel: 0.75, authenticity: 0.80 }},
      { id: 'ChronoKeep', biometricData: { heartRate: 86, stressLevel: 0.38, focusLevel: 0.74, authenticity: 0.79 }},
      { id: 'SolForge', biometricData: { heartRate: 87, stressLevel: 0.39, focusLevel: 0.73, authenticity: 0.78 }}
    ];

    testValidators.forEach(validator => {
      this.blockchain.addValidator(validator.id, validator.biometricData);
      this.network.addValidator(validator);
    });

    console.log(`👥 Total ${testValidators.length} validators added to EmotionalChain network`);

    // Add some test transactions for mining
    this.addTestTransactions();
  }

  private addTestTransactions(): void {
    // Create transactions between different validators from our themed list
    const validatorIds = [
      'StellarNode', 'NebulaForge', 'QuantumReach', 'OrionPulse', 'DarkMatterLabs',
      'ByteGuardians', 'ZeroLagOps', 'ChainFlux', 'IronNode', 'SentinelTrust'
    ];
    
    const testTransactions = [
      {
        from: validatorIds[0], // StellarNode
        to: validatorIds[1], // NebulaForge
        amount: 50,
        type: 'transfer',
        timestamp: Date.now()
      },
      {
        from: validatorIds[2], // QuantumReach
        to: validatorIds[3], // OrionPulse
        amount: 25,
        type: 'transfer', 
        timestamp: Date.now()
      },
      {
        from: validatorIds[4], // DarkMatterLabs
        to: validatorIds[5], // ByteGuardians
        amount: 75,
        type: 'transfer',
        timestamp: Date.now()
      },
      {
        from: validatorIds[6], // ZeroLagOps
        to: validatorIds[7], // ChainFlux
        amount: 100,
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