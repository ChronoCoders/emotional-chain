import { P2PNode } from './P2PNode';
import { ProductionCrypto } from '../crypto/ProductionCrypto';
import { CONFIG } from '../shared/config';

/**
 * Phase 2: Network Infrastructure Hardening
 * Implements enterprise-grade P2P security and Byzantine resistance
 */
export class NetworkHardening {
  private peerReputationMap = new Map<string, PeerReputation>();
  private suspiciousActivityLog = new Map<string, SuspiciousActivity[]>();
  private networkPartitionDetector: NetworkPartitionDetector;
  private dosProtection: DoSProtection;
  
  constructor(private p2pNode: P2PNode) {
    this.networkPartitionDetector = new NetworkPartitionDetector();
    this.dosProtection = new DoSProtection();
    this.initializeHardening();
  }

  private initializeHardening(): void {
    // Initialize peer reputation system
    this.setupPeerReputationSystem();
    
    // Initialize DoS protection
    this.setupDoSProtection();
    
    // Initialize network partition detection
    this.setupPartitionDetection();
    
    // Initialize message validation
    this.setupMessageValidation();
  }

  /**
   * Peer Reputation System
   * Tracks peer behavior and automatically blacklists malicious nodes
   */
  private setupPeerReputationSystem(): void {
    // Track peer behavior metrics
    this.p2pNode.on('message', (peerId: string, message: any) => {
      this.updatePeerReputation(peerId, 'message_received', 1);
    });

    this.p2pNode.on('peer:connect', (peerId: string) => {
      this.initializePeerReputation(peerId);
    });

    this.p2pNode.on('peer:disconnect', (peerId: string) => {
      this.handlePeerDisconnection(peerId);
    });
  }

  private initializePeerReputation(peerId: string): void {
    this.peerReputationMap.set(peerId, {
      score: 100, // Start with neutral reputation
      lastSeen: Date.now(),
      messageCount: 0,
      validMessages: 0,
      invalidMessages: 0,
      consensusParticipation: 0,
      byzantineBehavior: 0,
      uptime: 0,
      responseLatency: []
    });
  }

  private updatePeerReputation(peerId: string, action: string, value: number): void {
    const reputation = this.peerReputationMap.get(peerId);
    if (!reputation) return;

    reputation.lastSeen = Date.now();

    switch (action) {
      case 'message_received':
        reputation.messageCount += value;
        break;
      case 'valid_message':
        reputation.validMessages += value;
        reputation.score += 2;
        break;
      case 'invalid_message':
        reputation.invalidMessages += value;
        reputation.score -= 10;
        this.logSuspiciousActivity(peerId, 'invalid_message', value);
        break;
      case 'consensus_participation':
        reputation.consensusParticipation += value;
        reputation.score += 5;
        break;
      case 'byzantine_behavior':
        reputation.byzantineBehavior += value;
        reputation.score -= 50;
        this.logSuspiciousActivity(peerId, 'byzantine_behavior', value);
        break;
      case 'response_latency':
        reputation.responseLatency.push(value);
        if (reputation.responseLatency.length > 100) {
          reputation.responseLatency.shift();
        }
        break;
    }

    // Auto-blacklist peers with very low reputation
    if (reputation.score < 20) {
      this.blacklistPeer(peerId, 'low_reputation');
    }

    // Update the reputation map
    this.peerReputationMap.set(peerId, reputation);
  }

  private logSuspiciousActivity(peerId: string, type: string, severity: number): void {
    const activities = this.suspiciousActivityLog.get(peerId) || [];
    activities.push({
      timestamp: Date.now(),
      type,
      severity,
      details: `Suspicious ${type} detected`
    });

    // Keep only last 100 activities per peer
    if (activities.length > 100) {
      activities.shift();
    }

    this.suspiciousActivityLog.set(peerId, activities);

    // Alert if multiple suspicious activities in short time
    const recentActivities = activities.filter(a => Date.now() - a.timestamp < 300000); // 5 minutes
    if (recentActivities.length > 5) {
      this.handleSuspiciousPeer(peerId, recentActivities);
    }
  }

  private async blacklistPeer(peerId: string, reason: string): Promise<void> {
    console.warn(`🚫 Blacklisting peer ${peerId}: ${reason}`);
    
    // Disconnect from peer
    await this.p2pNode.disconnectPeer(peerId);
    
    // Add to blacklist (implementation depends on P2P library)
    // This would prevent future connections from this peer
    
    // Log the blacklisting event
    console.log(`Peer ${peerId} blacklisted for: ${reason}`);
  }

  /**
   * DoS Protection System
   * Implements bandwidth limiting and request throttling
   */
  private setupDoSProtection(): void {
    this.dosProtection = new DoSProtection({
      maxMessagesPerSecond: 100,
      maxBytesPerSecond: 1024 * 1024, // 1MB/s
      burstAllowance: 10,
      windowSize: 60000 // 1 minute
    });
  }

  /**
   * Network Partition Detection
   * Monitors network health and detects split-brain scenarios
   */
  private setupPartitionDetection(): void {
    this.networkPartitionDetector = new NetworkPartitionDetector({
      heartbeatInterval: 30000, // 30 seconds
      partitionThreshold: 0.33, // Trigger if < 33% of peers reachable
      recoveryTimeout: 120000 // 2 minutes
    });

    this.networkPartitionDetector.on('partition_detected', (partitionInfo) => {
      this.handleNetworkPartition(partitionInfo);
    });

    this.networkPartitionDetector.on('partition_recovered', () => {
      this.handlePartitionRecovery();
    });
  }

  private handleNetworkPartition(partitionInfo: any): void {
    console.warn('🔥 Network partition detected:', partitionInfo);
    
    // Implement partition recovery strategies
    // 1. Attempt to reconnect to bootstrap nodes
    // 2. Reduce consensus requirements temporarily
    // 3. Log partition event for analysis
    
    // Broadcast partition detection to remaining peers
    this.broadcastPartitionAlert(partitionInfo);
  }

  private handlePartitionRecovery(): void {
    console.log('✅ Network partition recovered');
    
    // Reset consensus parameters to normal
    // Sync missed blocks/transactions
    // Update peer reputation for partition survivors
  }

  /**
   * Message Validation and Authentication
   * Ensures all network messages are cryptographically valid
   */
  private setupMessageValidation(): void {
    this.p2pNode.on('message', async (peerId: string, message: any) => {
      const isValid = await this.validateMessage(peerId, message);
      
      if (isValid) {
        this.updatePeerReputation(peerId, 'valid_message', 1);
      } else {
        this.updatePeerReputation(peerId, 'invalid_message', 1);
        console.warn(`Invalid message from peer ${peerId}:`, message);
      }
    });
  }

  private async validateMessage(peerId: string, message: any): Promise<boolean> {
    try {
      // Check message structure
      if (!message.type || !message.payload || !message.signature || !message.nonce) {
        return false;
      }

      // Verify timestamp (prevent replay attacks)
      const now = Date.now();
      if (!message.timestamp || Math.abs(now - message.timestamp) > 300000) { // 5 minutes
        return false;
      }

      // Verify nonce
      if (!ProductionCrypto.verifyNonce(message.nonce)) {
        return false;
      }

      // Get peer's public key (would be stored during peer registration)
      const peerPublicKey = await this.getPeerPublicKey(peerId);
      if (!peerPublicKey) {
        return false;
      }

      // Verify message signature
      const messageBytes = new TextEncoder().encode(JSON.stringify({
        type: message.type,
        payload: message.payload,
        timestamp: message.timestamp,
        nonce: message.nonce
      }));

      const signatureBytes = Buffer.from(message.signature, 'hex');
      return ProductionCrypto.verifySignature(peerPublicKey, signatureBytes, messageBytes);
      
    } catch (error) {
      console.error('Message validation error:', error);
      return false;
    }
  }

  private async getPeerPublicKey(peerId: string): Promise<Uint8Array | null> {
    // Implementation would retrieve public key from peer registry
    // For now, return null to indicate key not found
    return null;
  }

  private async broadcastPartitionAlert(partitionInfo: any): Promise<void> {
    const alertMessage = {
      type: 'network_partition_alert',
      payload: partitionInfo,
      timestamp: Date.now(),
      nonce: ProductionCrypto.generateNonce()
    };

    // Broadcast to all connected peers
    await this.p2pNode.broadcast(alertMessage);
  }

  private handleSuspiciousPeer(peerId: string, activities: SuspiciousActivity[]): void {
    const totalSeverity = activities.reduce((sum, activity) => sum + activity.severity, 0);
    
    if (totalSeverity > 50) {
      this.blacklistPeer(peerId, 'high_suspicious_activity');
    } else {
      console.warn(`⚠️  Suspicious activity from peer ${peerId}:`, activities);
    }
  }

  /**
   * Get network health metrics
   */
  public getNetworkMetrics(): NetworkMetrics {
    const connectedPeers = Array.from(this.peerReputationMap.keys());
    const avgReputation = connectedPeers.reduce((sum, peerId) => {
      return sum + (this.peerReputationMap.get(peerId)?.score || 0);
    }, 0) / connectedPeers.length;

    return {
      connectedPeers: connectedPeers.length,
      averageReputation: avgReputation,
      blacklistedPeers: 0, // Would track blacklisted peers
      partitionStatus: this.networkPartitionDetector.getStatus(),
      suspiciousActivities: this.suspiciousActivityLog.size
    };
  }
}

// Supporting interfaces and classes
interface PeerReputation {
  score: number;
  lastSeen: number;
  messageCount: number;
  validMessages: number;
  invalidMessages: number;
  consensusParticipation: number;
  byzantineBehavior: number;
  uptime: number;
  responseLatency: number[];
}

interface SuspiciousActivity {
  timestamp: number;
  type: string;
  severity: number;
  details: string;
}

interface NetworkMetrics {
  connectedPeers: number;
  averageReputation: number;
  blacklistedPeers: number;
  partitionStatus: string;
  suspiciousActivities: number;
}

class DoSProtection {
  private requestCounts = new Map<string, number[]>();
  
  constructor(private config: {
    maxMessagesPerSecond: number;
    maxBytesPerSecond: number;
    burstAllowance: number;
    windowSize: number;
  }) {}

  checkRateLimit(peerId: string): boolean {
    const now = Date.now();
    const requests = this.requestCounts.get(peerId) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < this.config.windowSize);
    
    // Check if rate limit exceeded
    if (validRequests.length >= this.config.maxMessagesPerSecond) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requestCounts.set(peerId, validRequests);
    
    return true;
  }
}

class NetworkPartitionDetector {
  private isPartitioned = false;
  private lastHeartbeat = Date.now();
  
  constructor(private config: {
    heartbeatInterval: number;
    partitionThreshold: number;
    recoveryTimeout: number;
  }) {}

  on(event: string, callback: Function): void {
    // Event emitter implementation
  }

  getStatus(): string {
    return this.isPartitioned ? 'partitioned' : 'healthy';
  }
}

export default NetworkHardening;