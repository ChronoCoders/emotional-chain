import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { bootstrap } from '@libp2p/bootstrap';
import { kadDHT } from '@libp2p/kad-dht';
import { floodsub } from '@libp2p/floodsub';
import { multiaddr } from 'multiaddr';
import { EventEmitter } from 'events';
export interface P2PConfig {
  nodeId: string;
  listenPort: number;
  bootstrapPeers: string[];
  maxConnections: number;
  minConnections: number;
  enableWebRTC: boolean;
  enableTCP: boolean;
  enableWebSockets: boolean;
}
export interface PeerInfo {
  id: string;
  multiaddrs: string[];
  protocols: string[];
  lastSeen: number;
  reputation: number;
  isBootstrap: boolean;
}
export class P2PNode extends EventEmitter {
  private libp2p: Libp2p | null = null;
  private config: P2PConfig;
  private isStarted = false;
  private connectedPeers = new Map<string, PeerInfo>();
  private messageHandlers = new Map<string, Function>();
  private protocolPrefix = '/emotionalchain/1.0.0';
  constructor(config: P2PConfig) {
    super();
    this.config = {
      ...config,
      maxConnections: config.maxConnections || 50, // Increased for production scale
      minConnections: config.minConnections || 20, // Higher minimum for resilience
      enableWebRTC: config.enableWebRTC !== undefined ? config.enableWebRTC : true,
      enableTCP: config.enableTCP !== undefined ? config.enableTCP : true,
      enableWebSockets: config.enableWebSockets !== undefined ? config.enableWebSockets : true,
    };
  }
  /**
   * Start the P2P node with libp2p configuration
   */
  public async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error('P2P node is already started');
    }
    console.log(`   📡 Listen port: ${this.config.listenPort}`);
    console.log(`    Bootstrap peers: ${this.config.bootstrapPeers.length}`);
    try {
      // Configure transports based on enabled options
      const transports = [];
      if (this.config.enableTCP) {
        transports.push(tcp());
      }
      if (this.config.enableWebSockets) {
        transports.push(webSockets());
      }
      if (this.config.enableWebRTC) {
        transports.push(webRTC());
      }
      // Create libp2p node
      this.libp2p = await createLibp2p({
        addresses: {
          listen: [
            `/ip4/0.0.0.0/tcp/${this.config.listenPort}`,
            `/ip4/0.0.0.0/tcp/${this.config.listenPort + 1}/ws`
          ]
        },
        transports,
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        peerDiscovery: [
          bootstrap({
            list: this.config.bootstrapPeers.map(addr => multiaddr(addr))
          })
        ],
        services: {
          dht: kadDHT(),
          pubsub: floodsub()
        },
        connectionManager: {
          maxConnections: this.config.maxConnections,
          dialTimeout: 30000 // 30 second dial timeout
        }
      });
      // Set up event listeners
      this.setupEventListeners();
      // Start the node
      await this.libp2p.start();
      this.isStarted = true;
      const peerId = this.libp2p.peerId.toString();
      const multiaddrs = this.libp2p.getMultiaddrs().map(ma => ma.toString());
      console.log(`   🆔 Peer ID: ${peerId.substring(0, 20)}...`);
      console.log(`   📍 Multiaddrs: ${multiaddrs.length} available`);
      this.emit('started', { peerId, multiaddrs });
      // Start peer discovery
      await this.startPeerDiscovery();
    } catch (error) {
      console.error('Failed to start P2P node:', error);
      throw error;
    }
  }
  /**
   * Stop the P2P node
   */
  public async stop(): Promise<void> {
    if (!this.isStarted || !this.libp2p) {
      return;
    }
    console.log('🛑 Stopping P2P node...');
    try {
      await this.libp2p.stop();
      this.isStarted = false;
      this.connectedPeers.clear();
      this.libp2p = null;
      this.emit('stopped');
    } catch (error) {
      console.error('Error stopping P2P node:', error);
      throw error;
    }
  }
  /**
   * Register a protocol handler
   */
  public registerProtocol(protocol: string, handler: Function): void {
    if (!this.libp2p) {
      throw new Error('P2P node not started');
    }
    const fullProtocol = `${this.protocolPrefix}/${protocol}`;
    this.messageHandlers.set(fullProtocol, handler);
    this.libp2p.handle(fullProtocol, async ({ stream, connection }) => {
      try {
        const peerId = connection.remotePeer.toString();
        console.log(`📨 Received ${protocol} from ${peerId.substring(0, 12)}...`);
        await handler(stream, peerId);
      } catch (error) {
        console.error(`Error handling ${protocol}:`, error);
      }
    });
    console.log(`📋 Registered protocol: ${protocol}`);
  }
  /**
   * Send a message to a specific peer
   */
  public async sendToPeer(peerId: string, protocol: string, data: Uint8Array): Promise<void> {
    if (!this.libp2p) {
      throw new Error('P2P node not started');
    }
    try {
      const fullProtocol = `${this.protocolPrefix}/${protocol}`;
      const stream = await this.libp2p.dialProtocol(peerId, fullProtocol);
      await stream.sink([data]);
      await stream.close();
      console.log(`📤 Sent ${protocol} to ${peerId.substring(0, 12)}... (${data.length} bytes)`);
    } catch (error) {
      console.error(`Failed to send ${protocol} to ${peerId}:`, error);
      throw error;
    }
  }
  /**
   * Broadcast a message to all connected peers
   */
  public async broadcast(protocol: string, data: Uint8Array): Promise<void> {
    if (!this.libp2p) {
      throw new Error('P2P node not started');
    }
    try {
      const peers = Array.from(this.connectedPeers.keys());
      const sendPromises = peers.map(peerId => 
        this.sendToPeer(peerId, protocol, data).catch(error => {
          console.warn(`Failed to send to ${peerId}:`, error.message);
        })
      );
      await Promise.allSettled(sendPromises);
      console.log(`📡 Broadcasted ${protocol} to ${peers.length} peers (${data.length} bytes)`);
    } catch (error) {
      console.error('Broadcast failed:', error);
      throw error;
    }
  }
  /**
   * Publish to a pubsub topic
   */
  public async publishToTopic(topic: string, data: Uint8Array): Promise<void> {
    if (!this.libp2p || !this.libp2p.services?.pubsub) {
      throw new Error('P2P node not started or pubsub not available');
    }
    try {
      await this.libp2p.services.pubsub.publish(topic, data);
      console.log(`📢 Published to topic ${topic} (${data.length} bytes)`);
    } catch (error) {
      console.error(`Failed to publish to ${topic}:`, error);
      throw error;
    }
  }
  /**
   * Subscribe to a pubsub topic
   */
  public async subscribeToTopic(topic: string, handler: (data: Uint8Array, peerId: string) => void): Promise<void> {
    if (!this.libp2p || !this.libp2p.services?.pubsub) {
      throw new Error('P2P node not started or pubsub not available');
    }
    this.libp2p.services.pubsub.addEventListener('message', (evt: any) => {
      if (evt.detail.topic === topic) {
        const peerId = evt.detail.from.toString();
        handler(evt.detail.data, peerId);
      }
    });
    await this.libp2p.services.pubsub.subscribe(topic);
    console.log(`🔔 Subscribed to topic: ${topic}`);
  }
  /**
   * Get connected peers
   */
  public getConnectedPeers(): PeerInfo[] {
    return Array.from(this.connectedPeers.values());
  }
  /**
   * Get peer count
   */
  public getPeerCount(): number {
    return this.connectedPeers.size;
  }
  /**
   * Get node info
   */
  public getNodeInfo(): any {
    if (!this.libp2p) {
      return null;
    }
    return {
      peerId: this.libp2p.peerId.toString(),
      multiaddrs: this.libp2p.getMultiaddrs().map(ma => ma.toString()),
      isStarted: this.isStarted,
      connectedPeers: this.connectedPeers.size,
      protocols: Array.from(this.messageHandlers.keys())
    };
  }
  /**
   * Find peer by ID using DHT
   */
  public async findPeer(peerId: string): Promise<PeerInfo | null> {
    if (!this.libp2p || !this.libp2p.services?.dht) {
      return null;
    }
    try {
      const peerInfo = await this.libp2p.services.dht.findPeer(peerId);
      return {
        id: peerInfo.id.toString(),
        multiaddrs: peerInfo.multiaddrs.map((ma: any) => ma.toString()),
        protocols: [],
        lastSeen: Date.now(),
        reputation: 0,
        isBootstrap: false
      };
    } catch (error: any) {
      console.warn(`Failed to find peer ${peerId}:`, error.message);
      return null;
    }
  }
  /**
   * Set up event listeners for libp2p events
   */
  private setupEventListeners(): void {
    if (!this.libp2p) return;
    // Connection events
    this.libp2p.addEventListener('peer:connect', (evt) => {
      const peerId = evt.detail.toString();
      const peerInfo: PeerInfo = {
        id: peerId,
        multiaddrs: [],
        protocols: [],
        lastSeen: Date.now(),
        reputation: 0,
        isBootstrap: this.config.bootstrapPeers.some(bootstrap => 
          bootstrap.includes(peerId.substring(0, 20))
        )
      };
      this.connectedPeers.set(peerId, peerInfo);
      console.log(`🤝 Peer connected: ${peerId.substring(0, 20)}... (${this.connectedPeers.size} total)`);
      this.emit('peer:connect', peerInfo);
    });
    this.libp2p.addEventListener('peer:disconnect', (evt) => {
      const peerId = evt.detail.toString();
      const peerInfo = this.connectedPeers.get(peerId);
      this.connectedPeers.delete(peerId);
      console.log(`👋 Peer disconnected: ${peerId.substring(0, 20)}... (${this.connectedPeers.size} remaining)`);
      this.emit('peer:disconnect', { peerId, peerInfo });
    });
    // Discovery events
    this.libp2p.addEventListener('peer:discovery', (evt) => {
      const peerId = evt.detail.id.toString();
      const multiaddrs = evt.detail.multiaddrs.map(ma => ma.toString());
      console.log(`🔍 Discovered peer: ${peerId.substring(0, 20)}... (${multiaddrs.length} addrs)`);
      this.emit('peer:discovery', { peerId, multiaddrs });
    });
    // Protocol events
    this.libp2p.addEventListener('peer:identify', (evt) => {
      const peerId = evt.detail.peerId.toString();
      const protocols = evt.detail.protocols;
      const peerInfo = this.connectedPeers.get(peerId);
      if (peerInfo) {
        peerInfo.protocols = protocols;
        peerInfo.lastSeen = Date.now();
      }
      console.log(`🆔 Identified peer: ${peerId.substring(0, 20)}... (${protocols.length} protocols)`);
      this.emit('peer:identify', { peerId, protocols });
    });
  }
  /**
   * Start peer discovery process
   */
  private async startPeerDiscovery(): Promise<void> {
    if (!this.libp2p) return;
    console.log('🔍 Starting peer discovery...');
    // Start DHT for peer discovery
    if (this.libp2p.services?.dht) {
      try {
        // Announce ourselves on the DHT
        await this.libp2p.services.dht.setMode('server');
        console.log('📡 DHT server mode enabled');
      } catch (error: any) {
        console.warn('DHT setup warning:', error.message);
      }
    }
    // Periodically check connection count and discover new peers
    setInterval(async () => {
      if (!this.isStarted || !this.libp2p) return;
      const peerCount = this.connectedPeers.size;
      if (peerCount < this.config.minConnections) {
        // Try to discover more peers
        try {
          if (this.libp2p.services?.dht) {
            const randomPeerId = this.libp2p.peerId.toString();
            await this.libp2p.services.dht.getClosestPeers(randomPeerId);
          }
        } catch (error: any) {
          console.warn('Peer discovery error:', error.message);
        }
      }
    }, 30000); // Check every 30 seconds
  }
  /**
   * Update peer reputation
   */
  public updatePeerReputation(peerId: string, delta: number): void {
    const peerInfo = this.connectedPeers.get(peerId);
    if (peerInfo) {
      peerInfo.reputation = Math.max(-100, Math.min(100, peerInfo.reputation + delta));
      peerInfo.lastSeen = Date.now();
      if (peerInfo.reputation < -50) {
        this.emit('peer:lowReputation', peerInfo);
      }
    }
  }
  /**
   * Disconnect from a specific peer
   */
  public async disconnectPeer(peerId: string, reason?: string): Promise<void> {
    if (!this.libp2p) return;
    try {
      const connections = this.libp2p.getConnections().filter(conn => 
        conn.remotePeer.toString() === peerId
      );
      await Promise.all(connections.map(conn => conn.close()));
      console.log(`🚪 Disconnected from peer ${peerId.substring(0, 12)}...${reason ? ` (${reason})` : ''}`);
    } catch (error) {
      console.error(`Failed to disconnect from ${peerId}:`, error);
    }
  }
  /**
   * Check if connected to a specific peer
   */
  public isConnectedToPeer(peerId: string): boolean {
    return this.connectedPeers.has(peerId);
  }
  /**
   * Get connection quality metrics
   */
  public getConnectionMetrics(): any {
    const peers = Array.from(this.connectedPeers.values());
    const now = Date.now();
    return {
      totalPeers: peers.length,
      activePeers: peers.filter(p => (now - p.lastSeen) < 60000).length, // Active in last minute
      bootstrapPeers: peers.filter(p => p.isBootstrap).length,
      averageReputation: peers.length > 0 
        ? peers.reduce((sum, p) => sum + p.reputation, 0) / peers.length 
        : 0,
      protocols: Array.from(this.messageHandlers.keys()).length,
      isHealthy: this.isStarted && peers.length >= this.config.minConnections
    };
  }
}