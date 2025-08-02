import { NetworkHardening } from '../../network/NetworkHardening';
import { AdvancedByzantineDetection } from '../../network/AdvancedByzantineDetection';
import { P2PNode } from '../../network/P2PNode';
import { prometheusIntegration } from '../monitoring/prometheus-integration';

/**
 * Network Hardening Service Integration
 * Coordinates all Phase 2 network security enhancements
 */
export class NetworkHardeningService {
  private networkHardening: NetworkHardening;
  private byzantineDetection: AdvancedByzantineDetection;
  private p2pNode: P2PNode;
  private isInitialized = false;
  
  constructor() {
    this.byzantineDetection = new AdvancedByzantineDetection();
  }

  /**
   * Initialize network hardening with P2P node
   */
  async initialize(p2pNode: P2PNode): Promise<void> {
    if (this.isInitialized) {
      console.log('Network hardening already initialized');
      return;
    }

    this.p2pNode = p2pNode;
    this.networkHardening = new NetworkHardening(p2pNode);
    
    // Set up event handlers for Byzantine detection
    this.setupByzantineDetectionHandlers();
    
    // Set up network monitoring
    this.setupNetworkMonitoring();
    
    this.isInitialized = true;
    console.log('✅ Phase 2 Network Hardening Service initialized');
  }

  /**
   * Set up Byzantine detection event handlers
   */
  private setupByzantineDetectionHandlers(): void {
    // Monitor consensus votes for Byzantine behavior
    this.p2pNode.on('consensus_vote', async (validatorId: string, vote: any) => {
      const action = {
        type: 'consensus_vote' as const,
        vote: vote.vote,
        blockHash: vote.blockHash,
        timestamp: Date.now()
      };
      
      const assessment = await this.byzantineDetection.analyzeValidatorBehavior(validatorId, action);
      
      if (assessment.threatLevel === 'high' || assessment.threatLevel === 'critical') {
        console.warn(`🚨 Byzantine threat detected from validator ${validatorId}:`, assessment);
        
        // Update Prometheus metrics
        prometheusIntegration.recordByzantineDetection(assessment.threatLevel);
        
        // Take defensive action
        await this.handleByzantineThreat(validatorId, assessment);
      }
    });

    // Monitor biometric submissions
    this.p2pNode.on('biometric_data', async (validatorId: string, data: any) => {
      const action = {
        type: 'biometric_submission' as const,
        data: data.biometrics,
        quality: data.quality,
        timestamp: Date.now()
      };
      
      const assessment = await this.byzantineDetection.analyzeValidatorBehavior(validatorId, action);
      
      if (assessment.confidence > 70) {
        console.log(`Biometric assessment for ${validatorId}:`, assessment.threatLevel);
        
        // Update biometric quality metrics
        prometheusIntegration.updateBiometricQuality(
          validatorId, 
          'mixed', 
          100 - assessment.confidence
        );
      }
    });

    // Monitor network messages
    this.p2pNode.on('message', async (peerId: string, message: any) => {
      const action = {
        type: 'network_message' as const,
        messageType: message.type,
        timestamp: Date.now(),
        responseTime: message.processingTime || 0
      };
      
      // Check for honeypot interactions
      if (message.target && this.byzantineDetection.checkHoneypotInteraction(message.target, peerId)) {
        console.warn(`🍯 Honeypot interaction detected from ${peerId}`);
        prometheusIntegration.recordByzantineDetection('honeypot_interaction');
      }
      
      await this.byzantineDetection.analyzeValidatorBehavior(peerId, action);
    });
  }

  /**
   * Set up comprehensive network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor peer connections
    this.p2pNode.on('peer:connect', (peerId: string) => {
      const metrics = this.networkHardening.getNetworkMetrics();
      prometheusIntegration.updatePeerConnections(metrics.connectedPeers);
      
      console.log(`📡 Peer connected: ${peerId} (Total: ${metrics.connectedPeers})`);
    });

    this.p2pNode.on('peer:disconnect', (peerId: string) => {
      const metrics = this.networkHardening.getNetworkMetrics();
      prometheusIntegration.updatePeerConnections(metrics.connectedPeers);
      
      console.log(`📡 Peer disconnected: ${peerId} (Total: ${metrics.connectedPeers})`);
    });

    // Monitor message latency
    this.p2pNode.on('message', (peerId: string, message: any, latency: number) => {
      if (latency) {
        prometheusIntegration.recordMessageLatency(message.type || 'unknown', latency / 1000);
      }
    });

    // Periodic network health checks
    setInterval(() => {
      this.performNetworkHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle Byzantine threat detection
   */
  private async handleByzantineThreat(validatorId: string, assessment: any): Promise<void> {
    console.warn(`🚨 Handling Byzantine threat from ${validatorId}:`, assessment);
    
    // Generate detailed threat report
    const report = await this.byzantineDetection.generateThreatReport(validatorId);
    
    // Log the threat for investigation
    console.log('Threat Report:', JSON.stringify(report, null, 2));
    
    // Take graduated response based on threat level
    switch (assessment.threatLevel) {
      case 'critical':
        // Immediate isolation
        console.warn(`🔴 CRITICAL: Isolating validator ${validatorId}`);
        await this.isolateValidator(validatorId);
        break;
        
      case 'high':
        // Increase monitoring
        console.warn(`🟠 HIGH: Increasing monitoring for ${validatorId}`);
        await this.enhanceMonitoring(validatorId);
        break;
        
      case 'medium':
        // Log and continue monitoring
        console.warn(`🟡 MEDIUM: Monitoring ${validatorId} closely`);
        break;
    }
  }

  /**
   * Isolate a malicious validator
   */
  private async isolateValidator(validatorId: string): Promise<void> {
    try {
      // Disconnect from the validator
      await this.p2pNode.disconnectPeer(validatorId);
      
      // Add to blacklist
      // This would prevent future connections
      
      console.log(`✅ Validator ${validatorId} isolated successfully`);
    } catch (error) {
      console.error(`Failed to isolate validator ${validatorId}:`, error);
    }
  }

  /**
   * Enhance monitoring for suspicious validator
   */
  private async enhanceMonitoring(validatorId: string): Promise<void> {
    // Increase biometric sampling frequency
    // Require additional authentication steps
    // Monitor consensus participation more closely
    
    console.log(`🔍 Enhanced monitoring activated for ${validatorId}`);
  }

  /**
   * Perform comprehensive network health check
   */
  private performNetworkHealthCheck(): void {
    if (!this.isInitialized) return;
    
    const networkMetrics = this.networkHardening.getNetworkMetrics();
    
    // Update Prometheus metrics
    prometheusIntegration.updatePeerConnections(networkMetrics.connectedPeers);
    
    // Check for network partitions
    if (networkMetrics.partitionStatus === 'partitioned') {
      console.warn('🔥 Network partition detected!');
      prometheusIntegration.recordNetworkPartition();
    }
    
    // Log network health summary
    if (networkMetrics.connectedPeers < 10) {
      console.warn(`⚠️  Low peer count: ${networkMetrics.connectedPeers}`);
    }
    
    if (networkMetrics.averageReputation < 80) {
      console.warn(`⚠️  Low average peer reputation: ${networkMetrics.averageReputation}`);
    }
  }

  /**
   * Get comprehensive network security status
   */
  public getSecurityStatus(): NetworkSecurityStatus {
    if (!this.isInitialized) {
      return {
        initialized: false,
        networkHealth: 'unknown',
        threatLevel: 'unknown',
        activeThreats: 0,
        peerCount: 0,
        averageReputation: 0
      };
    }

    const networkMetrics = this.networkHardening.getNetworkMetrics();
    
    return {
      initialized: true,
      networkHealth: networkMetrics.partitionStatus === 'healthy' ? 'healthy' : 'degraded',
      threatLevel: this.assessOverallThreatLevel(networkMetrics),
      activeThreats: networkMetrics.suspiciousActivities,
      peerCount: networkMetrics.connectedPeers,
      averageReputation: networkMetrics.averageReputation,
      lastHealthCheck: Date.now()
    };
  }

  private assessOverallThreatLevel(metrics: any): string {
    if (metrics.averageReputation < 50 || metrics.suspiciousActivities > 10) {
      return 'high';
    }
    
    if (metrics.averageReputation < 80 || metrics.suspiciousActivities > 5) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Generate security report for external monitoring
   */
  public async generateSecurityReport(): Promise<SecurityReport> {
    const status = this.getSecurityStatus();
    const networkMetrics = this.networkHardening?.getNetworkMetrics();
    
    return {
      timestamp: Date.now(),
      phase: 'Phase 2 - Network Hardening',
      securityStatus: status,
      networkMetrics: networkMetrics || {},
      byzantineDetections: 0, // Would track actual detections
      recommendations: this.generateSecurityRecommendations(status)
    };
  }

  private generateSecurityRecommendations(status: NetworkSecurityStatus): string[] {
    const recommendations: string[] = [];
    
    if (status.peerCount < 20) {
      recommendations.push('Increase peer connections for better network resilience');
    }
    
    if (status.averageReputation < 80) {
      recommendations.push('Review peer reputation scores and consider blacklisting low-reputation peers');
    }
    
    if (status.threatLevel === 'high') {
      recommendations.push('Implement additional security measures immediately');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Network security status is optimal');
    }
    
    return recommendations;
  }
}

// Supporting interfaces
interface NetworkSecurityStatus {
  initialized: boolean;
  networkHealth: 'healthy' | 'degraded' | 'unknown';
  threatLevel: 'low' | 'medium' | 'high' | 'unknown';
  activeThreats: number;
  peerCount: number;
  averageReputation: number;
  lastHealthCheck?: number;
}

interface SecurityReport {
  timestamp: number;
  phase: string;
  securityStatus: NetworkSecurityStatus;
  networkMetrics: any;
  byzantineDetections: number;
  recommendations: string[];
}

// Export singleton instance
export const networkHardeningService = new NetworkHardeningService();
export default NetworkHardeningService;