import { EventEmitter } from 'events';
import { P2PNode, PeerInfo } from './P2PNode';

export interface PeerMetrics {
  peerId: string;
  lastSeen: number;
  responseTime: number;
  messageSent: number;
  messageReceived: number;
  errorCount: number;
  reputation: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isReliable: boolean;
}

export interface ConnectionTarget {
  multiaddr: string;
  priority: number;
  lastAttempt: number;
  failureCount: number;
  isBootstrap: boolean;
}

export class PeerManager extends EventEmitter {
  private p2pNode: P2PNode;
  private nodeId: string;
  private peerMetrics = new Map<string, PeerMetrics>();
  private blacklistedPeers = new Set<string>();
  private connectionTargets = new Map<string, ConnectionTarget>();
  
  // Configuration
  private readonly TARGET_PEER_COUNT = 10;
  private readonly MIN_PEER_COUNT = 6;
  private readonly MAX_PEER_COUNT = 15;
  private readonly PEER_TIMEOUT = 300000; // 5 minutes
  private readonly BLACKLIST_DURATION = 3600000; // 1 hour
  private readonly REPUTATION_THRESHOLD = 30;
  private readonly MAX_FAILURES = 5;

  constructor(nodeId: string, p2pNode: P2PNode) {
    super();
    this.nodeId = nodeId;
    this.p2pNode = p2pNode;
    
    this.setupEventHandlers();
    this.startPeerMaintenance();
  }

  /**
   * Start peer management
   */
  public async start(): Promise<void> {
    console.log(`👥 Starting peer manager for ${this.nodeId}`);
    
    // Initialize with bootstrap peers
    await this.initializeBootstrapPeers();
    
    // Start peer discovery
    await this.discoverPeers();
    
    console.log('✅ Peer manager started successfully');
    this.emit('started');
  }

  /**
   * Stop peer management
   */
  public async stop(): Promise<void> {
    console.log('🛑 Stopping peer manager...');
    
    // Disconnect from all peers gracefully
    const connectedPeers = this.p2pNode.getConnectedPeers();
    for (const peer of connectedPeers) {
      await this.p2pNode.disconnectPeer(peer.id, 'Shutdown');
    }
    
    this.peerMetrics.clear();
    this.connectionTargets.clear();
    
    console.log('✅ Peer manager stopped');
    this.emit('stopped');
  }

  /**
   * Add a peer connection target
   */
  public addConnectionTarget(multiaddr: string, priority: number = 1, isBootstrap: boolean = false): void {
    const target: ConnectionTarget = {
      multiaddr,
      priority,
      lastAttempt: 0,
      failureCount: 0,
      isBootstrap
    };
    
    this.connectionTargets.set(multiaddr, target);
    console.log(`📝 Added connection target: ${multiaddr} (priority: ${priority})`);
  }

  /**
   * Remove a peer connection target
   */
  public removeConnectionTarget(multiaddr: string): void {
    this.connectionTargets.delete(multiaddr);
    console.log(`🗑️  Removed connection target: ${multiaddr}`);
  }

  /**
   * Blacklist a peer
   */
  public blacklistPeer(peerId: string, reason: string): void {
    this.blacklistedPeers.add(peerId);
    
    // Disconnect if currently connected
    if (this.p2pNode.isConnectedToPeer(peerId)) {
      this.p2pNode.disconnectPeer(peerId, `Blacklisted: ${reason}`);
    }
    
    console.log(`🚫 Blacklisted peer ${peerId.substring(0, 12)}...: ${reason}`);
    this.emit('peerBlacklisted', { peerId, reason });
    
    // Auto-remove from blacklist after duration
    setTimeout(() => {
      this.blacklistedPeers.delete(peerId);
      console.log(`✅ Removed ${peerId.substring(0, 12)}... from blacklist`);
    }, this.BLACKLIST_DURATION);
  }

  /**
   * Update peer reputation
   */
  public updatePeerReputation(peerId: string, delta: number, reason?: string): void {
    let metrics = this.peerMetrics.get(peerId);
    
    if (!metrics) {
      metrics = this.createPeerMetrics(peerId);
      this.peerMetrics.set(peerId, metrics);
    }
    
    const oldReputation = metrics.reputation;
    metrics.reputation = Math.max(0, Math.min(100, metrics.reputation + delta));
    metrics.lastSeen = Date.now();
    
    console.log(`⭐ Updated reputation for ${peerId.substring(0, 12)}...: ${oldReputation} → ${metrics.reputation} (${reason || 'no reason'})`);
    
    // Check if peer should be blacklisted
    if (metrics.reputation < this.REPUTATION_THRESHOLD) {
      this.blacklistPeer(peerId, `Low reputation: ${metrics.reputation}`);
    }
    
    this.emit('reputationUpdated', { peerId, oldReputation, newReputation: metrics.reputation, reason });
  }

  /**
   * Record peer message activity
   */
  public recordMessageActivity(peerId: string, type: 'sent' | 'received', responseTime?: number): void {
    let metrics = this.peerMetrics.get(peerId);
    
    if (!metrics) {
      metrics = this.createPeerMetrics(peerId);
      this.peerMetrics.set(peerId, metrics);
    }
    
    if (type === 'sent') {
      metrics.messageSent++;
    } else {
      metrics.messageReceived++;
      if (responseTime !== undefined) {
        metrics.responseTime = (metrics.responseTime + responseTime) / 2; // Running average
      }
    }
    
    metrics.lastSeen = Date.now();
    this.updateConnectionQuality(metrics);
  }

  /**
   * Record peer error
   */
  public recordPeerError(peerId: string, error: string): void {
    let metrics = this.peerMetrics.get(peerId);
    
    if (!metrics) {
      metrics = this.createPeerMetrics(peerId);
      this.peerMetrics.set(peerId, metrics);
    }
    
    metrics.errorCount++;
    metrics.lastSeen = Date.now();
    
    console.log(`⚠️  Recorded error for ${peerId.substring(0, 12)}...: ${error} (total: ${metrics.errorCount})`);
    
    // Decrease reputation for errors
    this.updatePeerReputation(peerId, -2, `Error: ${error}`);
    
    // Update connection quality
    this.updateConnectionQuality(metrics);
    
    this.emit('peerError', { peerId, error, errorCount: metrics.errorCount });
  }

  /**
   * Get peer metrics
   */
  public getPeerMetrics(peerId: string): PeerMetrics | null {
    return this.peerMetrics.get(peerId) || null;
  }

  /**
   * Get all peer metrics
   */
  public getAllPeerMetrics(): PeerMetrics[] {
    return Array.from(this.peerMetrics.values());
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): any {
    const connectedPeers = this.p2pNode.getConnectedPeers();
    const metrics = Array.from(this.peerMetrics.values());
    
    return {
      connected: connectedPeers.length,
      target: this.TARGET_PEER_COUNT,
      min: this.MIN_PEER_COUNT,
      max: this.MAX_PEER_COUNT,
      blacklisted: this.blacklistedPeers.size,
      targets: this.connectionTargets.size,
      averageReputation: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.reputation, 0) / metrics.length 
        : 0,
      qualityDistribution: {
        excellent: metrics.filter(m => m.connectionQuality === 'excellent').length,
        good: metrics.filter(m => m.connectionQuality === 'good').length,
        fair: metrics.filter(m => m.connectionQuality === 'fair').length,
        poor: metrics.filter(m => m.connectionQuality === 'poor').length
      }
    };
  }

  /**
   * Get recommended peers for important messages
   */
  public getReliablePeers(count: number = 5): PeerInfo[] {
    const connectedPeers = this.p2pNode.getConnectedPeers();
    const reliablePeers = connectedPeers.filter(peer => {
      const metrics = this.peerMetrics.get(peer.id);
      return metrics && metrics.isReliable && metrics.reputation > 70;
    });
    
    // Sort by reputation and connection quality
    reliablePeers.sort((a, b) => {
      const metricsA = this.peerMetrics.get(a.id)!;
      const metricsB = this.peerMetrics.get(b.id)!;
      
      if (metricsA.reputation !== metricsB.reputation) {
        return metricsB.reputation - metricsA.reputation;
      }
      
      const qualityOrder = ['excellent', 'good', 'fair', 'poor'];
      return qualityOrder.indexOf(metricsA.connectionQuality) - qualityOrder.indexOf(metricsB.connectionQuality);
    });
    
    return reliablePeers.slice(0, count);
  }

  /**
   * Check if peer is blacklisted
   */
  public isBlacklisted(peerId: string): boolean {
    return this.blacklistedPeers.has(peerId);
  }

  /**
   * Setup event handlers for P2P node events
   */
  private setupEventHandlers(): void {
    this.p2pNode.on('peer:connect', (peerInfo: PeerInfo) => {
      this.handlePeerConnect(peerInfo);
    });
    
    this.p2pNode.on('peer:disconnect', (data: any) => {
      this.handlePeerDisconnect(data.peerId);
    });
    
    this.p2pNode.on('peer:discovery', (data: any) => {
      this.handlePeerDiscovery(data.peerId, data.multiaddrs);
    });
    
    this.p2pNode.on('peer:lowReputation', (peerInfo: PeerInfo) => {
      this.blacklistPeer(peerInfo.id, 'Low reputation from P2P node');
    });
  }

  /**
   * Handle peer connection
   */
  private handlePeerConnect(peerInfo: PeerInfo): void {
    if (this.isBlacklisted(peerInfo.id)) {
      this.p2pNode.disconnectPeer(peerInfo.id, 'Blacklisted peer');
      return;
    }
    
    // Create or update peer metrics
    let metrics = this.peerMetrics.get(peerInfo.id);
    if (!metrics) {
      metrics = this.createPeerMetrics(peerInfo.id);
      this.peerMetrics.set(peerInfo.id, metrics);
    }
    
    metrics.lastSeen = Date.now();
    
    console.log(`🤝 Peer connected: ${peerInfo.id.substring(0, 12)}... (reputation: ${metrics.reputation})`);
    this.emit('peerConnected', { peerInfo, metrics });
  }

  /**
   * Handle peer disconnection
   */
  private handlePeerDisconnect(peerId: string): void {
    const metrics = this.peerMetrics.get(peerId);
    
    console.log(`👋 Peer disconnected: ${peerId.substring(0, 12)}...`);
    
    // Check if we need more connections
    this.checkConnectionNeeds();
    
    this.emit('peerDisconnected', { peerId, metrics });
  }

  /**
   * Handle peer discovery
   */
  private handlePeerDiscovery(peerId: string, multiaddrs: string[]): void {
    if (this.isBlacklisted(peerId)) {
      return;
    }
    
    // Add discovered peer as connection target
    for (const multiaddr of multiaddrs) {
      if (!this.connectionTargets.has(multiaddr)) {
        this.addConnectionTarget(multiaddr, 1, false);
      }
    }
    
    console.log(`🔍 Discovered peer: ${peerId.substring(0, 12)}... (${multiaddrs.length} addresses)`);
    this.emit('peerDiscovered', { peerId, multiaddrs });
  }

  /**
   * Initialize bootstrap peers
   */
  private async initializeBootstrapPeers(): Promise<void> {
    // Bootstrap peers would be loaded from configuration
    const bootstrapPeers = [
      '/ip4/127.0.0.1/tcp/4001/p2p/QmBootstrap1',
      '/ip4/127.0.0.1/tcp/4002/p2p/QmBootstrap2'
    ];
    
    for (const peerAddr of bootstrapPeers) {
      this.addConnectionTarget(peerAddr, 10, true); // High priority for bootstrap
    }
    
    console.log(`📡 Initialized ${bootstrapPeers.length} bootstrap peers`);
  }

  /**
   * Discover new peers
   */
  private async discoverPeers(): Promise<void> {
    const connectedCount = this.p2pNode.getPeerCount();
    
    if (connectedCount < this.TARGET_PEER_COUNT) {
      console.log(`🔍 Discovering peers (${connectedCount}/${this.TARGET_PEER_COUNT})`);
      
      // Try to connect to available targets
      await this.connectToTargets(this.TARGET_PEER_COUNT - connectedCount);
    }
  }

  /**
   * Connect to available targets
   */
  private async connectToTargets(maxConnections: number): Promise<void> {
    const targets = Array.from(this.connectionTargets.values())
      .filter(target => {
        const now = Date.now();
        return target.failureCount < this.MAX_FAILURES && 
               (now - target.lastAttempt) > 30000; // 30 second cooldown
      })
      .sort((a, b) => b.priority - a.priority) // Sort by priority
      .slice(0, maxConnections);
    
    for (const target of targets) {
      try {
        target.lastAttempt = Date.now();
        
        // Extract peer ID from multiaddr if possible
        const peerId = this.extractPeerIdFromMultiaddr(target.multiaddr);
        
        if (peerId && this.isBlacklisted(peerId)) {
          continue;
        }
        
        console.log(`🔗 Attempting connection to ${target.multiaddr}`);
        // Connection attempt would happen here
        // For now, we'll simulate connection attempts
        
      } catch (error) {
        target.failureCount++;
        console.warn(`Failed to connect to ${target.multiaddr}: ${error}`);
        
        if (target.failureCount >= this.MAX_FAILURES) {
          console.warn(`⚠️  Removing failed target: ${target.multiaddr}`);
          this.connectionTargets.delete(target.multiaddr);
        }
      }
    }
  }

  /**
   * Start peer maintenance routine
   */
  private startPeerMaintenance(): void {
    setInterval(() => {
      this.performMaintenance();
    }, 30000); // Run every 30 seconds
  }

  /**
   * Perform maintenance tasks
   */
  private performMaintenance(): void {
    const now = Date.now();
    
    // Clean up stale peer metrics
    for (const [peerId, metrics] of this.peerMetrics) {
      if (now - metrics.lastSeen > this.PEER_TIMEOUT) {
        this.peerMetrics.delete(peerId);
        console.log(`🧹 Cleaned up stale metrics for ${peerId.substring(0, 12)}...`);
      }
    }
    
    // Check connection needs
    this.checkConnectionNeeds();
    
    // Update peer reliability
    this.updatePeerReliability();
  }

  /**
   * Check if we need more connections
   */
  private checkConnectionNeeds(): void {
    const currentCount = this.p2pNode.getPeerCount();
    
    if (currentCount < this.MIN_PEER_COUNT) {
      console.log(`⚠️  Low peer count: ${currentCount}/${this.MIN_PEER_COUNT}`);
      this.discoverPeers();
    } else if (currentCount > this.MAX_PEER_COUNT) {
      console.log(`⚠️  Too many peers: ${currentCount}/${this.MAX_PEER_COUNT}`);
      this.disconnectLowQualityPeers(currentCount - this.TARGET_PEER_COUNT);
    }
  }

  /**
   * Disconnect low quality peers
   */
  private disconnectLowQualityPeers(count: number): void {
    const connectedPeers = this.p2pNode.getConnectedPeers();
    const peersWithMetrics = connectedPeers
      .map(peer => ({
        peer,
        metrics: this.peerMetrics.get(peer.id)
      }))
      .filter(item => item.metrics)
      .sort((a, b) => a.metrics!.reputation - b.metrics!.reputation) // Lowest reputation first
      .slice(0, count);
    
    for (const { peer } of peersWithMetrics) {
      this.p2pNode.disconnectPeer(peer.id, 'Low quality connection');
      console.log(`🚪 Disconnected low quality peer: ${peer.id.substring(0, 12)}...`);
    }
  }

  /**
   * Create default peer metrics
   */
  private createPeerMetrics(peerId: string): PeerMetrics {
    return {
      peerId,
      lastSeen: Date.now(),
      responseTime: 0,
      messageSent: 0,
      messageReceived: 0,
      errorCount: 0,
      reputation: 50, // Start with neutral reputation
      connectionQuality: 'fair',
      isReliable: false
    };
  }

  /**
   * Update connection quality based on metrics
   */
  private updateConnectionQuality(metrics: PeerMetrics): void {
    let score = 0;
    
    // Factor in reputation (0-40 points)
    score += (metrics.reputation / 100) * 40;
    
    // Factor in response time (0-30 points)
    if (metrics.responseTime > 0) {
      if (metrics.responseTime < 100) score += 30;
      else if (metrics.responseTime < 500) score += 20;
      else if (metrics.responseTime < 1000) score += 10;
      else score += 0;
    } else {
      score += 15; // Default if no response time data
    }
    
    // Factor in error rate (0-30 points)
    const totalMessages = metrics.messageSent + metrics.messageReceived;
    if (totalMessages > 0) {
      const errorRate = metrics.errorCount / totalMessages;
      if (errorRate < 0.01) score += 30; // < 1% error rate
      else if (errorRate < 0.05) score += 20; // < 5% error rate
      else if (errorRate < 0.1) score += 10; // < 10% error rate
      else score += 0; // > 10% error rate
    } else {
      score += 15; // Default if no message data
    }
    
    // Determine quality level
    if (score >= 80) {
      metrics.connectionQuality = 'excellent';
    } else if (score >= 60) {
      metrics.connectionQuality = 'good';
    } else if (score >= 40) {
      metrics.connectionQuality = 'fair';
    } else {
      metrics.connectionQuality = 'poor';
    }
  }

  /**
   * Update peer reliability
   */
  private updatePeerReliability(): void {
    for (const metrics of this.peerMetrics.values()) {
      const totalMessages = metrics.messageSent + metrics.messageReceived;
      const uptime = Date.now() - (metrics.lastSeen - 300000); // Assume 5min history
      
      metrics.isReliable = 
        metrics.reputation > 70 &&
        metrics.connectionQuality !== 'poor' &&
        totalMessages > 10 &&
        uptime > 180000; // At least 3 minutes uptime
    }
  }

  /**
   * Extract peer ID from multiaddr (simplified)
   */
  private extractPeerIdFromMultiaddr(multiaddr: string): string | null {
    const match = multiaddr.match(/\/p2p\/([^\/]+)/);
    return match ? match[1] : null;
  }
}