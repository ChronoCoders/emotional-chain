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
    // Check for connected biometric devices
    const authenticatedValidators = biometricDeviceManager.getAuthenticatedValidators();
    
    if (authenticatedValidators.length === 0) {
      console.log('⚠️  No biometric devices connected. Mining requires real validators with biometric authentication.');
      console.log('📱 Please connect heart rate monitors, stress sensors, or EEG devices to participate in consensus.');
      
      return {
        status: 'waiting_for_biometric_devices',
        message: 'Mining requires authenticated biometric validators',
        connectedDevices: 0,
        requiredDevices: 1
      };
    }
    
    // Start blockchain mining with authenticated validators
    const result = this.blockchain.startMining();
    console.log(`🔄 Mining started with ${authenticatedValidators.length} biometrically authenticated validators`);
    return result;
  }
  public stopMining(): any {
    const result = this.blockchain.stopMining();
    return result;
  }
  // REMOVED: All test validators are fake data - system now requires real biometric devices
  // Real validators must connect with actual biometric devices to participate in consensus
  // REMOVED: Test transactions are fake data - real transactions will come from authentic biometric validators
  public getMiningStatus(): any {
    return this.blockchain.getMiningStatus();
  }
}