// EmotionalChain Bootstrap Node Implementation
import { EmotionalChain } from './EmotionalChain';
import { EmotionalNetwork } from './EmotionalNetwork';
import { biometricDeviceManager } from '../biometric/BiometricDeviceManager';
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
      // EmotionalChain Bootstrap Node started
      // Add a small delay to ensure network is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Start mining with test validators
      this.startMining();
      this.startStatsMonitoring();
    } catch (error) {
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
        if (connectedPeers === 0) {
        }
        // Display blockchain stats
        const chainStats = this.blockchain.getChainStats();
      } catch (error) {
      }
    }, 30000); // Every 30 seconds
  }
  public async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    if (this.network) {
      this.network.shutdown();
    }
  }
  public getBlockchain(): EmotionalChain {
    return this.blockchain;
  }
  public getNetwork(): EmotionalNetwork {
    return this.network;
  }
  public startMining(): any {
    // Check for connected biometric devices first
    const authenticatedValidators = biometricDeviceManager.getAuthenticatedValidators();
    
    if (authenticatedValidators.length === 0) {
      console.log('No biometric devices detected. Using ecosystem validators.');
      // Add ecosystem validators for the EmotionalChain network
      this.addEcosystemValidators();
    }
    
    // Start blockchain mining
    const result = this.blockchain.startMining();
    console.log(`Mining started with ecosystem validators`);
    return result;
  }
  public stopMining(): any {
    const result = this.blockchain.stopMining();
    return result;
  }
  private addEcosystemValidators(): void {
    // Add 21 ecosystem validators with ENTERPRISE-GRADE 7-METRIC biometric data
    const ecosystemValidators = [
      // Cosmic / Sci-Fi Themed - Elite Performance (Consumer & Professional Devices)
      { id: 'StellarNode', biometricData: { 
        heartRate: 65, stressLevel: 0.12, focusLevel: 0.95, authenticity: 0.98,
        heartRateVariability: 0.85, galvanicSkinResponse: 0.15, blinkRate: 0.2, reactionTime: 0.1,
        deviceType: 'professional-hrv', sessionDuration: 2.5, responseConsistency: 0.95
      }},
      { id: 'NebulaForge', biometricData: { 
        heartRate: 68, stressLevel: 0.15, focusLevel: 0.92, authenticity: 0.97,
        heartRateVariability: 0.80, galvanicSkinResponse: 0.18, blinkRate: 0.25, reactionTime: 0.15,
        deviceType: 'consumer-watch', sessionDuration: 1.8, responseConsistency: 0.92
      }},
      { id: 'QuantumReach', biometricData: { 
        heartRate: 70, stressLevel: 0.18, focusLevel: 0.88, authenticity: 0.93,
        heartRateVariability: 0.75, galvanicSkinResponse: 0.22, blinkRate: 0.3, reactionTime: 0.2,
        deviceType: 'consumer-galaxy', sessionDuration: 3.2, responseConsistency: 0.88
      }},
      { id: 'OrionPulse', biometricData: { 
        heartRate: 72, stressLevel: 0.2, focusLevel: 0.9, authenticity: 0.95,
        heartRateVariability: 0.78, galvanicSkinResponse: 0.25, blinkRate: 0.28, reactionTime: 0.18,
        deviceType: 'consumer-garmin', sessionDuration: 2.1, responseConsistency: 0.90
      }},
      { id: 'DarkMatterLabs', biometricData: { 
        heartRate: 74, stressLevel: 0.22, focusLevel: 0.89, authenticity: 0.96,
        heartRateVariability: 0.76, galvanicSkinResponse: 0.28, blinkRate: 0.32, reactionTime: 0.22,
        deviceType: 'eeg-professional', sessionDuration: 4.1, responseConsistency: 0.89
      }},
      { id: 'GravityCore', biometricData: { 
        heartRate: 69, stressLevel: 0.16, focusLevel: 0.91, authenticity: 0.94,
        heartRateVariability: 0.79, galvanicSkinResponse: 0.20, blinkRate: 0.26, reactionTime: 0.16,
        deviceType: 'consumer-oura', sessionDuration: 1.9, responseConsistency: 0.91
      }},
      { id: 'AstroSentinel', biometricData: { 
        heartRate: 75, stressLevel: 0.25, focusLevel: 0.85, authenticity: 0.92,
        heartRateVariability: 0.72, galvanicSkinResponse: 0.32, blinkRate: 0.35, reactionTime: 0.25,
        deviceType: 'consumer-fitbit', sessionDuration: 3.8, responseConsistency: 0.85
      }},
      // Tech / Futuristic Vibes - Advanced Performance (Mixed Devices)
      { id: 'ByteGuardians', biometricData: { 
        heartRate: 73, stressLevel: 0.23, focusLevel: 0.87, authenticity: 0.91,
        heartRateVariability: 0.74, galvanicSkinResponse: 0.30, blinkRate: 0.33, reactionTime: 0.23,
        deviceType: 'multimodal', sessionDuration: 2.7, responseConsistency: 0.87
      }},
      { id: 'ZeroLagOps', biometricData: { 
        heartRate: 76, stressLevel: 0.27, focusLevel: 0.84, authenticity: 0.89,
        heartRateVariability: 0.71, galvanicSkinResponse: 0.34, blinkRate: 0.37, reactionTime: 0.27,
        deviceType: 'consumer-watch', sessionDuration: 4.5, responseConsistency: 0.84
      }},
      { id: 'ChainFlux', biometricData: { 
        heartRate: 71, stressLevel: 0.24, focusLevel: 0.86, authenticity: 0.90,
        heartRateVariability: 0.73, galvanicSkinResponse: 0.31, blinkRate: 0.34, reactionTime: 0.24,
        deviceType: 'stress', sessionDuration: 3.1, responseConsistency: 0.86
      }},
      { id: 'BlockNerve', biometricData: { 
        heartRate: 77, stressLevel: 0.26, focusLevel: 0.83, authenticity: 0.88,
        heartRateVariability: 0.70, galvanicSkinResponse: 0.35, blinkRate: 0.38, reactionTime: 0.28,
        deviceType: 'consumer-galaxy', sessionDuration: 5.2, responseConsistency: 0.83
      }},
      { id: 'ValidatorX', biometricData: { 
        heartRate: 78, stressLevel: 0.30, focusLevel: 0.82, authenticity: 0.87,
        heartRateVariability: 0.68, galvanicSkinResponse: 0.38, blinkRate: 0.40, reactionTime: 0.30,
        deviceType: 'consumer-muse', sessionDuration: 4.8, responseConsistency: 0.82
      }},
      { id: 'NovaSync', biometricData: { 
        heartRate: 79, stressLevel: 0.32, focusLevel: 0.80, authenticity: 0.85,
        heartRateVariability: 0.66, galvanicSkinResponse: 0.40, blinkRate: 0.42, reactionTime: 0.32,
        deviceType: 'consumer-fitbit', sessionDuration: 6.1, responseConsistency: 0.80
      }},
      // Security / Trust Focused - Reliable Performance (Professional Focus)
      { id: 'IronNode', biometricData: { 
        heartRate: 80, stressLevel: 0.29, focusLevel: 0.81, authenticity: 0.86,
        heartRateVariability: 0.67, galvanicSkinResponse: 0.37, blinkRate: 0.39, reactionTime: 0.29,
        deviceType: 'professional-hrv', sessionDuration: 3.9, responseConsistency: 0.81
      }},
      { id: 'SentinelTrust', biometricData: { 
        heartRate: 82, stressLevel: 0.31, focusLevel: 0.79, authenticity: 0.84,
        heartRateVariability: 0.65, galvanicSkinResponse: 0.39, blinkRate: 0.41, reactionTime: 0.31,
        deviceType: 'consumer-oura', sessionDuration: 5.5, responseConsistency: 0.79
      }},
      { id: 'VaultProof', biometricData: { 
        heartRate: 81, stressLevel: 0.33, focusLevel: 0.78, authenticity: 0.83,
        heartRateVariability: 0.64, galvanicSkinResponse: 0.41, blinkRate: 0.43, reactionTime: 0.33,
        deviceType: 'eeg-professional', sessionDuration: 4.2, responseConsistency: 0.78
      }},
      { id: 'SecureMesh', biometricData: { 
        heartRate: 83, stressLevel: 0.35, focusLevel: 0.77, authenticity: 0.82,
        heartRateVariability: 0.63, galvanicSkinResponse: 0.43, blinkRate: 0.45, reactionTime: 0.35,
        deviceType: 'consumer-watch', sessionDuration: 6.8, responseConsistency: 0.77
      }},
      { id: 'WatchtowerOne', biometricData: { 
        heartRate: 84, stressLevel: 0.37, focusLevel: 0.76, authenticity: 0.81,
        heartRateVariability: 0.62, galvanicSkinResponse: 0.45, blinkRate: 0.47, reactionTime: 0.37,
        deviceType: 'multimodal', sessionDuration: 5.9, responseConsistency: 0.76
      }},
      // Creative / Myth-Inspired - Emerging Performance (Consumer Focus)
      { id: 'AetherRunes', biometricData: { 
        heartRate: 85, stressLevel: 0.36, focusLevel: 0.75, authenticity: 0.80,
        heartRateVariability: 0.61, galvanicSkinResponse: 0.44, blinkRate: 0.46, reactionTime: 0.36,
        deviceType: 'consumer-muse', sessionDuration: 4.7, responseConsistency: 0.75
      }},
      { id: 'ChronoKeep', biometricData: { 
        heartRate: 86, stressLevel: 0.38, focusLevel: 0.74, authenticity: 0.79,
        heartRateVariability: 0.60, galvanicSkinResponse: 0.46, blinkRate: 0.48, reactionTime: 0.38,
        deviceType: 'consumer-galaxy', sessionDuration: 7.2, responseConsistency: 0.74
      }},
      { id: 'SolForge', biometricData: { 
        heartRate: 87, stressLevel: 0.39, focusLevel: 0.73, authenticity: 0.78,
        heartRateVariability: 0.59, galvanicSkinResponse: 0.47, blinkRate: 0.49, reactionTime: 0.39,
        deviceType: 'consumer-fitbit', sessionDuration: 6.5, responseConsistency: 0.73
      }}
    ];
    ecosystemValidators.forEach(validator => {
      this.blockchain.addValidator(validator.id, validator.biometricData);
      this.network.addValidator(validator);
    });
    // Add initial transactions for mining
    this.addInitialTransactions();
  }

  private addInitialTransactions(): void {
    // Create transactions between different validators
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
  }
  public getMiningStatus(): any {
    return this.blockchain.getMiningStatus();
  }
}