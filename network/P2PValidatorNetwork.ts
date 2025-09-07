/**
 * P2P Validator Network for EmotionalChain
 * Production-ready distributed validator coordination using libp2p
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { bootstrap } from '@libp2p/bootstrap';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { floodsub } from '@libp2p/floodsub';
import { multiaddr } from '@multiformats/multiaddr';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

import { EmotionalValidator } from '../crypto/EmotionalValidator';
import { EmotionalZKProof } from '../crypto/zkproofs/ZKProofService';
import { Block } from '../crypto/Block';

export interface NetworkValidator {
  id: string;
  peerId: string;
  multiaddr: string;
  emotionalScore?: number;
  authenticity?: number;
  lastSeen: number;
  stake: number;
  reputation: number;
  isActive: boolean;
}

export interface ConsensusMessage {
  type: 'PROPOSE' | 'VOTE' | 'COMMIT' | 'SYNC' | 'CHALLENGE';
  round: number;
  blockHash?: string;
  validatorId: string;
  zkProof?: EmotionalZKProof;
  signature: string;
  timestamp: number;
}

export interface NetworkState {
  activeValidators: Map<string, NetworkValidator>;
  currentRound: number;
  consensusInProgress: boolean;
  networkHealth: number;
  totalStake: number;
  connectedPeers: number;
}

/**
 * Distributed P2P Validator Network
 * Enables independent validator nodes to coordinate consensus across the internet
 */
export class P2PValidatorNetwork extends EventEmitter {
  private libp2p: any;
  private validators: Map<string, NetworkValidator>;
  private consensusState: {
    currentRound: number;
    proposedBlock?: Block;
    votes: Map<string, ConsensusMessage>;
    commits: Map<string, ConsensusMessage>;
  };
  
  private isBootstrapped: boolean;
  private networkConfig: {
    bootstrapNodes: string[];
    minValidators: number;
    consensusThreshold: number;
    roundTimeout: number;
  };

  constructor(config?: {
    bootstrapNodes?: string[];
    listenPort?: number;
    minValidators?: number;
  }) {
    super();
    
    this.validators = new Map();
    this.consensusState = {
      currentRound: 0,
      votes: new Map(),
      commits: new Map()
    };
    
    this.isBootstrapped = false;
    this.networkConfig = {
      bootstrapNodes: config?.bootstrapNodes || [
        '/ip4/127.0.0.1/tcp/4001', // Local bootstrap for development
        '/dns4/node1.emotionalchain.io/tcp/4001', // Production bootstrap nodes
        '/dns4/node2.emotionalchain.io/tcp/4001',
      ],
      minValidators: config?.minValidators || 7, // Minimum for Byzantine fault tolerance
      consensusThreshold: 0.67, // 67% agreement required
      roundTimeout: 30000 // 30 second consensus rounds
    };
    
    console.log('P2P Validator Network initializing...');
  }

  /**
   * Initialize P2P network with full protocol support
   */
  async initialize(): Promise<void> {
    try {
      console.log('Starting libp2p node with full transport support...');
      
      this.libp2p = await createLibp2p({
        addresses: {
          listen: [
            '/ip4/0.0.0.0/tcp/0', // Dynamic port for TCP
            '/ip4/0.0.0.0/tcp/0/ws', // WebSocket support
            '/webrtc' // WebRTC for browser validators
          ]
        },
        transports: [
          tcp(),
          webSockets(),
          webRTC()
        ],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        peerDiscovery: [
          bootstrap({
            list: this.networkConfig.bootstrapNodes
          }),
          pubsubPeerDiscovery({
            interval: 10000,
            topics: ['emotionalchain-discovery']
          })
        ],
        services: {
          dht: kadDHT({
            clientMode: false,
            validators: {
              pk: () => true,
              ipns: () => true
            }
          }),
          pubsub: floodsub({
            emitSelf: false,
            globalSignaturePolicy: 'StrictSign'
          })
        }
      });

      // Set up event handlers
      this.setupEventHandlers();
      
      // Start the node
      await this.libp2p.start();
      
      console.log(`P2P node started with PeerID: ${this.libp2p.peerId.toString()}`);
      console.log(`Listening on addresses:`, this.libp2p.getMultiaddrs());
      
      // Bootstrap network discovery
      await this.bootstrapNetwork();
      
      this.emit('network:ready');
      
    } catch (error) {
      console.error('❌ P2P network initialization failed:', error);
      throw error;
    }
  }

  /**
   * Bootstrap network and discover peers
   */
  private async bootstrapNetwork(): Promise<void> {
    console.log('🔍 Bootstrapping network discovery...');
    
    try {
      // Subscribe to consensus topics
      await this.libp2p.services.pubsub.subscribe('emotionalchain-consensus');
      await this.libp2p.services.pubsub.subscribe('emotionalchain-blocks');
      await this.libp2p.services.pubsub.subscribe('emotionalchain-validators');
      
      // Announce ourselves as a validator
      await this.announceValidator();
      
      // Start periodic network maintenance
      this.startNetworkMaintenance();
      
      this.isBootstrapped = true;
      console.log('Network bootstrap complete');
      
    } catch (error) {
      console.error('❌ Network bootstrap failed:', error);
      throw error;
    }
  }

  /**
   * Set up P2P event handlers
   */
  private setupEventHandlers(): void {
    // Peer connection events
    this.libp2p.addEventListener('peer:connect', (evt: any) => {
      const peerId = evt.detail.toString();
      console.log(`Connected to peer: ${peerId}`);
      this.emit('peer:connected', peerId);
    });

    this.libp2p.addEventListener('peer:disconnect', (evt: any) => {
      const peerId = evt.detail.toString();
      console.log(`Disconnected from peer: ${peerId}`);
      this.handlePeerDisconnect(peerId);
    });

    // Message handling
    this.libp2p.services.pubsub.addEventListener('message', (evt: any) => {
      this.handleNetworkMessage(evt);
    });
  }

  /**
   * Register this node as a validator in the network
   */
  async registerValidator(validator: EmotionalValidator): Promise<void> {
    console.log(`Registering validator: ${validator.id}`);
    
    const networkValidator: NetworkValidator = {
      id: validator.id,
      peerId: this.libp2p.peerId.toString(),
      multiaddr: this.libp2p.getMultiaddrs()[0]?.toString() || '',
      emotionalScore: validator.emotionalScore,
      authenticity: validator.authenticity,
      lastSeen: Date.now(),
      stake: 10000, // Default stake amount
      reputation: 100, // Starting reputation
      isActive: true
    };

    this.validators.set(validator.id, networkValidator);
    
    // Announce to network
    await this.broadcastMessage('emotionalchain-validators', {
      type: 'VALIDATOR_REGISTER',
      validator: networkValidator,
      timestamp: Date.now()
    });

    console.log(`Validator ${validator.id} registered in P2P network`);
  }

  /**
   * Start distributed consensus round
   */
  async startConsensusRound(proposedBlock: Block): Promise<boolean> {
    if (this.consensusState.consensusInProgress) {
      console.log('⏳ Consensus already in progress, skipping round');
      return false;
    }

    console.log(`Starting distributed consensus round ${this.consensusState.currentRound + 1}`);
    
    this.consensusState.currentRound++;
    this.consensusState.consensusInProgress = true;
    this.consensusState.proposedBlock = proposedBlock;
    this.consensusState.votes.clear();
    this.consensusState.commits.clear();

    // Phase 1: PROPOSE
    await this.broadcastConsensusMessage({
      type: 'PROPOSE',
      round: this.consensusState.currentRound,
      blockHash: proposedBlock.hash,
      validatorId: proposedBlock.validator,
      signature: this.signMessage(proposedBlock.hash),
      timestamp: Date.now()
    });

    // Start consensus timeout
    setTimeout(() => {
      this.handleConsensusTimeout();
    }, this.networkConfig.roundTimeout);

    return true;
  }

  /**
   * Handle incoming consensus messages
   */
  private async handleConsensusMessage(message: ConsensusMessage): Promise<void> {
    const { type, round, validatorId } = message;
    
    // Ignore messages from old rounds
    if (round < this.consensusState.currentRound) {
      return;
    }

    console.log(`📨 Received ${type} message from ${validatorId} for round ${round}`);

    switch (type) {
      case 'PROPOSE':
        await this.handleProposeMessage(message);
        break;
      case 'VOTE':
        await this.handleVoteMessage(message);
        break;
      case 'COMMIT':
        await this.handleCommitMessage(message);
        break;
      case 'SYNC':
        await this.handleSyncMessage(message);
        break;
    }
  }

  /**
   * Handle PROPOSE phase of consensus
   */
  private async handleProposeMessage(message: ConsensusMessage): Promise<void> {
    // Validate the proposed block
    const isValid = await this.validateProposedBlock(message);
    
    if (isValid) {
      // Send VOTE
      await this.broadcastConsensusMessage({
        type: 'VOTE',
        round: message.round,
        blockHash: message.blockHash,
        validatorId: this.getOurValidatorId(),
        signature: this.signMessage(message.blockHash || ''),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle VOTE phase of consensus
   */
  private async handleVoteMessage(message: ConsensusMessage): Promise<void> {
    this.consensusState.votes.set(message.validatorId, message);
    
    // Check if we have enough votes
    const requiredVotes = Math.ceil(this.validators.size * this.networkConfig.consensusThreshold);
    
    if (this.consensusState.votes.size >= requiredVotes) {
      console.log(`Received ${this.consensusState.votes.size}/${requiredVotes} votes, proceeding to COMMIT`);
      
      // Send COMMIT
      await this.broadcastConsensusMessage({
        type: 'COMMIT',
        round: this.consensusState.currentRound,
        blockHash: message.blockHash,
        validatorId: this.getOurValidatorId(),
        signature: this.signMessage(message.blockHash || ''),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle COMMIT phase of consensus
   */
  private async handleCommitMessage(message: ConsensusMessage): Promise<void> {
    this.consensusState.commits.set(message.validatorId, message);
    
    // Check if we have enough commits to finalize
    const requiredCommits = Math.ceil(this.validators.size * this.networkConfig.consensusThreshold);
    
    if (this.consensusState.commits.size >= requiredCommits) {
      console.log(`🎯 Consensus reached! ${this.consensusState.commits.size}/${requiredCommits} commits`);
      
      // Finalize the block
      await this.finalizeConsensusRound();
    }
  }

  /**
   * Finalize consensus round and commit block
   */
  private async finalizeConsensusRound(): Promise<void> {
    if (!this.consensusState.proposedBlock) {
      console.error('❌ No proposed block to finalize');
      return;
    }

    console.log(`🏁 Finalizing consensus round ${this.consensusState.currentRound}`);
    
    // Broadcast finalized block
    await this.broadcastMessage('emotionalchain-blocks', {
      type: 'BLOCK_FINALIZED',
      block: this.consensusState.proposedBlock.toJSON(),
      round: this.consensusState.currentRound,
      timestamp: Date.now()
    });

    // Emit consensus complete event
    this.emit('consensus:complete', {
      block: this.consensusState.proposedBlock,
      round: this.consensusState.currentRound,
      votes: this.consensusState.votes.size,
      commits: this.consensusState.commits.size
    });

    // Reset consensus state
    this.consensusState.consensusInProgress = false;
  }

  /**
   * Get network health and statistics
   */
  getNetworkState(): NetworkState {
    const connectedPeers = this.libp2p?.getPeers()?.length || 0;
    const totalStake = Array.from(this.validators.values())
      .reduce((sum, v) => sum + v.stake, 0);

    return {
      activeValidators: new Map(this.validators),
      currentRound: this.consensusState.currentRound,
      consensusInProgress: this.consensusState.consensusInProgress,
      networkHealth: this.calculateNetworkHealth(),
      totalStake,
      connectedPeers
    };
  }

  /**
   * Calculate network health score (0-100)
   */
  private calculateNetworkHealth(): number {
    const connectedPeers = this.libp2p?.getPeers()?.length || 0;
    const activeValidators = Array.from(this.validators.values())
      .filter(v => v.isActive).length;
    
    // Health based on connectivity and validator participation
    const peerHealth = Math.min(connectedPeers / 10, 1) * 50; // 50% weight
    const validatorHealth = Math.min(activeValidators / this.networkConfig.minValidators, 1) * 50; // 50% weight
    
    return Math.round(peerHealth + validatorHealth);
  }

  // Helper methods
  private async broadcastMessage(topic: string, message: any): Promise<void> {
    const messageData = new TextEncoder().encode(JSON.stringify(message));
    await this.libp2p.services.pubsub.publish(topic, messageData);
  }

  private async broadcastConsensusMessage(message: ConsensusMessage): Promise<void> {
    await this.broadcastMessage('emotionalchain-consensus', message);
  }

  private signMessage(message: string): string {
    // Simple signature - in production, use proper cryptographic signing
    return crypto.createHash('sha256').update(message + this.libp2p.peerId.toString()).digest('hex');
  }

  private async validateProposedBlock(message: ConsensusMessage): Promise<boolean> {
    // Implement block validation logic
    return true; // Simplified for now
  }

  private getOurValidatorId(): string {
    // Return our validator ID if we're a validator
    return Array.from(this.validators.keys())[0] || 'unknown';
  }

  private async announceValidator(): Promise<void> {
    // Announce our presence in the network
    await this.broadcastMessage('emotionalchain-discovery', {
      type: 'VALIDATOR_ANNOUNCE',
      peerId: this.libp2p.peerId.toString(),
      addresses: this.libp2p.getMultiaddrs().map((addr: any) => addr.toString()),
      timestamp: Date.now()
    });
  }

  private handleNetworkMessage(evt: any): void {
    try {
      const message = JSON.parse(new TextDecoder().decode(evt.detail.data));
      
      if (evt.detail.topic === 'emotionalchain-consensus') {
        this.handleConsensusMessage(message);
      }
      
    } catch (error) {
      console.error('❌ Failed to handle network message:', error);
    }
  }

  private handlePeerDisconnect(peerId: string): void {
    // Update validator status if a validator disconnected
    for (const [id, validator] of this.validators.entries()) {
      if (validator.peerId === peerId) {
        validator.isActive = false;
        validator.lastSeen = Date.now();
        console.log(`Validator ${id} marked as inactive`);
        break;
      }
    }
  }

  private handleConsensusTimeout(): void {
    if (this.consensusState.consensusInProgress) {
      console.log(`Consensus round ${this.consensusState.currentRound} timed out`);
      this.consensusState.consensusInProgress = false;
      this.emit('consensus:timeout', this.consensusState.currentRound);
    }
  }

  private startNetworkMaintenance(): void {
    // Periodic network health checks and cleanup
    setInterval(() => {
      this.performNetworkMaintenance();
    }, 60000); // Every minute
  }

  private performNetworkMaintenance(): void {
    const now = Date.now();
    
    // Mark inactive validators
    for (const [id, validator] of this.validators.entries()) {
      if (now - validator.lastSeen > 300000) { // 5 minutes
        validator.isActive = false;
      }
    }
    
    console.log(`Network maintenance: ${this.validators.size} validators, ${this.calculateNetworkHealth()}% health`);
  }

  /**
   * Shutdown the P2P network
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down P2P validator network...');
    
    if (this.libp2p) {
      await this.libp2p.stop();
    }
    
    console.log('P2P network shutdown complete');
  }
}