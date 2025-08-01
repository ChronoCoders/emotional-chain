/**
 * Block Propagation Engine for EmotionalChain
 * Efficient block distribution across the P2P network
 */
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import crypto from 'crypto';
export interface Block {
  index: number;
  previousHash: string;
  transactions: any[];
  timestamp: number;
  hash: string;
  nonce: number;
  emotionalData: any;
  validator: string;
  signature: string;
}
export interface PropagationResult {
  blockHash: string;
  totalPeers: number;
  successfulPropagations: number;
  failedPropagations: number;
  averageLatency: number;
  propagationTime: number;
  networkCoverage: number;
}
export interface ValidationResult {
  isValid: boolean;
  validationTime: number;
  errors: string[];
  warnings: string[];
  validatorChecks: {
    hashValid: boolean;
    signatureValid: boolean;
    emotionalDataValid: boolean;
    timestampValid: boolean;
    transactionsValid: boolean;
  };
}
export interface OrphanBlock {
  block: Block;
  receivedFrom: string;
  timestamp: number;
  attempts: number;
  lastAttempt: number;
}
export interface PropagationMetrics {
  totalBlocks: number;
  successfulPropagations: number;
  failedPropagations: number;
  averagePropagationTime: number;
  orphanBlocks: number;
  networkEfficiency: number;
  bandwidthUsage: number;
}
export interface PeerInfo {
  id: string;
  connection: WebSocket;
  latency: number;
  reliability: number;
  blockHeight: number;
  lastSeen: number;
  isValidator: boolean;
}
export class BlockPropagation extends EventEmitter {
  private peers: Map<string, PeerInfo> = new Map();
  private blockCache: Map<string, Block> = new Map();
  private orphanBlocks: Map<string, OrphanBlock> = new Map();
  private propagationHistory: Map<string, PropagationResult> = new Map();
  private metrics: PropagationMetrics;
  private maxPropagationTime = 2000; // 2 seconds target
  private maxOrphanAge = 300000; // 5 minutes
  private compressionEnabled = true;
  constructor() {
    super();
    this.metrics = {
      totalBlocks: 0,
      successfulPropagations: 0,
      failedPropagations: 0,
      averagePropagationTime: 0,
      orphanBlocks: 0,
      networkEfficiency: 100,
      bandwidthUsage: 0
    };
    this.startOrphanBlockProcessor();
    this.startPerformanceMonitoring();
  }
  public async propagateBlock(block: Block, excludePeers: string[] = []): Promise<PropagationResult> {
    const startTime = Date.now();
    console.log(`📡 Starting block propagation: ${block.hash}`);
    try {
      // Validate block before propagation
      const validation = await this.validateIncomingBlock(block, 'local');
      if (!validation.isValid) {
        throw new Error(`Invalid block: ${validation.errors.join(', ')}`);
      }
      // Cache the block
      this.blockCache.set(block.hash, block);
      // Determine optimal propagation path
      const targetPeers = this.optimizePropagationPath(
        Array.from(this.peers.keys()).filter(id => !excludePeers.includes(id))
      );
      // Prepare block message
      const blockMessage = this.prepareBlockMessage(block);
      // Propagate to peers in parallel
      const propagationPromises = targetPeers.map(peerId => 
        this.propagateToSinglePeer(peerId, blockMessage)
      );
      const results = await Promise.allSettled(propagationPromises);
      // Analyze results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalLatency = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r: any) => sum + r.value.latency, 0);
      const averageLatency = successful > 0 ? totalLatency / successful : 0;
      const propagationTime = Date.now() - startTime;
      const networkCoverage = (successful / targetPeers.length) * 100;
      const propagationResult: PropagationResult = {
        blockHash: block.hash,
        totalPeers: targetPeers.length,
        successfulPropagations: successful,
        failedPropagations: failed,
        averageLatency,
        propagationTime,
        networkCoverage
      };
      // Update metrics
      this.updatePropagationMetrics(propagationResult);
      // Store result for analysis
      this.propagationHistory.set(block.hash, propagationResult);
      this.emit('blockPropagated', propagationResult);
      return propagationResult;
    } catch (error) {
      const propagationTime = Date.now() - startTime;
      this.metrics.failedPropagations++;
      this.emit('propagationFailed', { blockHash: block.hash, error: error.message, propagationTime });
      throw error;
    }
  }
  public async validateIncomingBlock(block: Block, source: string): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const validatorChecks = {
      hashValid: false,
      signatureValid: false,
      emotionalDataValid: false,
      timestampValid: false,
      transactionsValid: false
    };
    try {
      // Validate block hash
      const calculatedHash = this.calculateBlockHash(block);
      validatorChecks.hashValid = calculatedHash === block.hash;
      if (!validatorChecks.hashValid) {
        errors.push('Invalid block hash');
      }
      // Validate block signature
      validatorChecks.signatureValid = await this.validateBlockSignature(block);
      if (!validatorChecks.signatureValid) {
        errors.push('Invalid block signature');
      }
      // Validate emotional data
      validatorChecks.emotionalDataValid = this.validateEmotionalData(block.emotionalData);
      if (!validatorChecks.emotionalDataValid) {
        errors.push('Invalid emotional data');
      }
      // Validate timestamp
      const now = Date.now();
      const blockAge = now - block.timestamp;
      validatorChecks.timestampValid = blockAge >= 0 && blockAge < 300000; // Within 5 minutes
      if (!validatorChecks.timestampValid) {
        if (blockAge < 0) {
          errors.push('Block timestamp is in the future');
        } else {
          errors.push('Block timestamp is too old');
        }
      }
      // Validate transactions
      validatorChecks.transactionsValid = await this.validateTransactions(block.transactions);
      if (!validatorChecks.transactionsValid) {
        errors.push('Invalid transactions in block');
      }
      // Additional validations
      await this.validateBlockSequence(block);
      await this.validateValidatorEligibility(block.validator);
      const validationTime = Date.now() - startTime;
      const isValid = errors.length === 0;
      const validationResult: ValidationResult = {
        isValid,
        validationTime,
        errors,
        warnings,
        validatorChecks
      };
      if (isValid) {
        this.emit('blockValidated', { block, validationResult, source });
      } else {
        this.emit('blockValidationFailed', { block, validationResult, source });
      }
      return validationResult;
    } catch (error) {
      const validationTime = Date.now() - startTime;
      return {
        isValid: false,
        validationTime,
        errors: [`Validation error: ${error.message}`],
        warnings,
        validatorChecks
      };
    }
  }
  public async handleOrphanBlocks(orphanBlock: Block): Promise<void> {
    const orphanId = orphanBlock.hash;
    console.log(` Handling orphan block: ${orphanId}`);
    try {
      // Check if we already have this orphan
      if (this.orphanBlocks.has(orphanId)) {
        const existing = this.orphanBlocks.get(orphanId)!;
        existing.attempts++;
        existing.lastAttempt = Date.now();
      } else {
        // Add new orphan block
        this.orphanBlocks.set(orphanId, {
          block: orphanBlock,
          receivedFrom: 'network',
          timestamp: Date.now(),
          attempts: 1,
          lastAttempt: Date.now()
        });
        this.metrics.orphanBlocks++;
      }
      // Try to find parent block
      const parentFound = await this.findParentBlock(orphanBlock.previousHash);
      if (parentFound) {
        // Parent found, validate and add to chain
        const validation = await this.validateIncomingBlock(orphanBlock, 'orphan');
        if (validation.isValid) {
          // Remove from orphan pool and add to main chain
          this.orphanBlocks.delete(orphanId);
          this.metrics.orphanBlocks--;
          this.emit('orphanResolved', { block: orphanBlock, validation });
          // Try to resolve other orphans that might depend on this block
          await this.checkDependentOrphans(orphanBlock.hash);
        } else {
          this.emit('orphanValidationFailed', { block: orphanBlock, validation });
        }
      } else {
        // Request parent block from network
        await this.requestParentBlock(orphanBlock.previousHash);
        console.log(`🔍 Requested parent block for orphan: ${orphanBlock.previousHash}`);
        this.emit('parentBlockRequested', { orphanBlock, parentHash: orphanBlock.previousHash });
      }
    } catch (error) {
      this.emit('orphanHandlingError', { block: orphanBlock, error: error.message });
    }
  }
  public optimizePropagationPath(targetPeers: string[]): string[] {
    // Get peer information and sort by reliability and latency
    const peerInfos = targetPeers
      .map(id => ({ id, info: this.peers.get(id) }))
      .filter(p => p.info && p.info.connection.readyState === WebSocket.OPEN)
      .sort((a, b) => {
        // Prioritize validators
        if (a.info!.isValidator && !b.info!.isValidator) return -1;
        if (!a.info!.isValidator && b.info!.isValidator) return 1;
        // Then by reliability and latency
        const reliabilityDiff = b.info!.reliability - a.info!.reliability;
        if (Math.abs(reliabilityDiff) > 0.1) return reliabilityDiff;
        return a.info!.latency - b.info!.latency;
      });
    // Return optimized peer list
    const optimizedPeers = peerInfos.map(p => p.id);
    console.log(` Optimized propagation path: ${optimizedPeers.length} peers selected`);
    return optimizedPeers;
  }
  public addPeer(peerId: string, connection: WebSocket, isValidator: boolean = false): void {
    const peerInfo: PeerInfo = {
      id: peerId,
      connection,
      latency: 100, // Initial estimate
      reliability: 1.0, // Start with perfect reliability
      blockHeight: 0,
      lastSeen: Date.now(),
      isValidator
    };
    this.peers.set(peerId, peerInfo);
    // Set up connection event handlers
    connection.on('message', (data) => {
      this.handlePeerMessage(peerId, data);
    });
    connection.on('close', () => {
      this.peers.delete(peerId);
      console.log(`🔌 Peer disconnected: ${peerId}`);
      this.emit('peerDisconnected', peerId);
    });
    connection.on('error', (error) => {
      this.updatePeerReliability(peerId, false);
    });
    console.log(` Peer added: ${peerId} (validator: ${isValidator})`);
    this.emit('peerAdded', { peerId, isValidator });
  }
  public removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connection.close();
      this.peers.delete(peerId);
      console.log(`🔌 Peer removed: ${peerId}`);
      this.emit('peerRemoved', peerId);
    }
  }
  private async propagateToSinglePeer(peerId: string, blockMessage: any): Promise<{ latency: number }> {
    const peer = this.peers.get(peerId);
    if (!peer || peer.connection.readyState !== WebSocket.OPEN) {
      throw new Error(`Peer ${peerId} not available`);
    }
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.updatePeerReliability(peerId, false);
        reject(new Error(`Propagation timeout for peer ${peerId}`));
      }, 5000); // 5 second timeout
      peer.connection.send(blockMessage, (error) => {
        clearTimeout(timeout);
        if (error) {
          this.updatePeerReliability(peerId, false);
          reject(error);
        } else {
          const latency = Date.now() - startTime;
          this.updatePeerLatency(peerId, latency);
          this.updatePeerReliability(peerId, true);
          resolve({ latency });
        }
      });
    });
  }
  private prepareBlockMessage(block: Block): string {
    const message = {
      type: 'new_block',
      data: block,
      timestamp: Date.now()
    };
    let messageString = JSON.stringify(message);
    if (this.compressionEnabled) {
      messageString = this.compressMessage(messageString);
    }
    this.metrics.bandwidthUsage += messageString.length;
    return messageString;
  }
  private compressMessage(message: string): string {
    // Simplified compression (would use actual compression library)
    return Buffer.from(message).toString('base64');
  }
  private calculateBlockHash(block: Block): string {
    const blockString = JSON.stringify({
      index: block.index,
      previousHash: block.previousHash,
      transactions: block.transactions,
      timestamp: block.timestamp,
      emotionalData: block.emotionalData,
      validator: block.validator,
      nonce: block.nonce
    });
    return crypto.createHash('sha256').update(blockString).digest('hex');
  }
  private async validateBlockSignature(block: Block): Promise<boolean> {
    // Simplified signature validation
    return block.signature && block.signature.length > 0;
  }
  private validateEmotionalData(emotionalData: any): boolean {
    return !!(emotionalData &&
              typeof emotionalData.heartRate === 'number' &&
              typeof emotionalData.stressLevel === 'number' &&
              typeof emotionalData.focusLevel === 'number' &&
              typeof emotionalData.authenticity === 'number');
  }
  private async validateTransactions(transactions: any[]): Promise<boolean> {
    // Validate all transactions in the block
    for (const tx of transactions) {
      if (!this.validateSingleTransaction(tx)) {
        return false;
      }
    }
    return true;
  }
  private validateSingleTransaction(transaction: any): boolean {
    // Basic transaction validation
    return !!(transaction &&
              transaction.from &&
              transaction.to &&
              typeof transaction.amount === 'number' &&
              transaction.amount >= 0 &&
              transaction.signature);
  }
  private async validateBlockSequence(block: Block): Promise<void> {
    // Check if previous block exists (except for genesis)
    if (block.index > 0) {
      const parentExists = this.blockCache.has(block.previousHash);
      if (!parentExists) {
        // This might be an orphan block
        await this.handleOrphanBlocks(block);
      }
    }
  }
  private async validateValidatorEligibility(validator: string): Promise<void> {
    // Check if validator is eligible to create blocks
    const authorizedValidators = ['StellarNode', 'NebulaForge', 'QuantumReach']; // Simplified
    if (!authorizedValidators.includes(validator)) {
      throw new Error(`Unauthorized validator: ${validator}`);
    }
  }
  private async findParentBlock(parentHash: string): Promise<boolean> {
    return this.blockCache.has(parentHash);
  }
  private async requestParentBlock(parentHash: string): Promise<void> {
    const request = {
      type: 'request_block',
      blockHash: parentHash,
      timestamp: Date.now()
    };
    // Send request to all connected peers
    for (const [peerId, peer] of this.peers.entries()) {
      if (peer.connection.readyState === WebSocket.OPEN) {
        peer.connection.send(JSON.stringify(request));
      }
    }
  }
  private async checkDependentOrphans(blockHash: string): Promise<void> {
    // Check if any orphan blocks can now be resolved
    for (const [orphanId, orphan] of this.orphanBlocks.entries()) {
      if (orphan.block.previousHash === blockHash) {
        await this.handleOrphanBlocks(orphan.block);
      }
    }
  }
  private handlePeerMessage(peerId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      switch (message.type) {
        case 'new_block':
          this.handleIncomingBlock(peerId, message.data);
          break;
        case 'request_block':
          this.handleBlockRequest(peerId, message.blockHash);
          break;
        case 'block_response':
          this.handleBlockResponse(peerId, message.data);
          break;
        default:
          console.warn(`Unknown message type from ${peerId}: ${message.type}`);
      }
      // Update peer last seen
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.lastSeen = Date.now();
      }
    } catch (error) {
      console.error(`Error handling message from ${peerId}:`, error);
    }
  }
  private async handleIncomingBlock(peerId: string, block: Block): Promise<void> {
    // Validate the incoming block
    const validation = await this.validateIncomingBlock(block, peerId);
    if (validation.isValid) {
      // Add to cache and propagate to other peers
      this.blockCache.set(block.hash, block);
      // Propagate to other peers (excluding sender)
      await this.propagateBlock(block, [peerId]);
      this.emit('blockReceived', { block, source: peerId, validation });
    } else {
      this.emit('invalidBlockReceived', { block, source: peerId, validation });
    }
  }
  private handleBlockRequest(peerId: string, blockHash: string): void {
    const block = this.blockCache.get(blockHash);
    const peer = this.peers.get(peerId);
    if (block && peer && peer.connection.readyState === WebSocket.OPEN) {
      const response = {
        type: 'block_response',
        data: block,
        timestamp: Date.now()
      };
      peer.connection.send(JSON.stringify(response));
      console.log(`📤 Sent block to ${peerId}: ${blockHash}`);
    }
  }
  private handleBlockResponse(peerId: string, block: Block): void {
    console.log(`📥 Received requested block from ${peerId}: ${block.hash}`);
    // Add to cache and check if it resolves orphans
    this.blockCache.set(block.hash, block);
    this.checkDependentOrphans(block.hash);
  }
  private updatePeerLatency(peerId: string, latency: number): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      // Exponential moving average
      peer.latency = peer.latency * 0.7 + latency * 0.3;
    }
  }
  private updatePeerReliability(peerId: string, success: boolean): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      if (success) {
        peer.reliability = Math.min(1.0, peer.reliability + 0.01);
      } else {
        peer.reliability = Math.max(0.0, peer.reliability - 0.05);
      }
    }
  }
  private updatePropagationMetrics(result: PropagationResult): void {
    this.metrics.totalBlocks++;
    if (result.successfulPropagations > 0) {
      this.metrics.successfulPropagations++;
    } else {
      this.metrics.failedPropagations++;
    }
    // Update average propagation time
    const totalTime = this.metrics.averagePropagationTime * (this.metrics.totalBlocks - 1) + result.propagationTime;
    this.metrics.averagePropagationTime = totalTime / this.metrics.totalBlocks;
    // Update network efficiency
    this.metrics.networkEfficiency = (this.metrics.successfulPropagations / this.metrics.totalBlocks) * 100;
  }
  private startOrphanBlockProcessor(): void {
    // Process orphan blocks every 30 seconds
    setInterval(() => {
      this.processOrphanBlocks();
    }, 30000);
  }
  private processOrphanBlocks(): void {
    const now = Date.now();
    const expiredOrphans: string[] = [];
    for (const [orphanId, orphan] of this.orphanBlocks.entries()) {
      // Remove orphans older than max age
      if (now - orphan.timestamp > this.maxOrphanAge) {
        expiredOrphans.push(orphanId);
        continue;
      }
      // Retry orphan resolution if enough time has passed
      if (now - orphan.lastAttempt > 60000 && orphan.attempts < 5) { // 1 minute, max 5 attempts
        this.handleOrphanBlocks(orphan.block);
      }
    }
    // Clean up expired orphans
    for (const orphanId of expiredOrphans) {
      this.orphanBlocks.delete(orphanId);
      this.metrics.orphanBlocks--;
    }
  }
  private startPerformanceMonitoring(): void {
    // Emit performance metrics every minute
    setInterval(() => {
      this.emit('performanceMetrics', {
        ...this.metrics,
        connectedPeers: this.peers.size,
        cacheSize: this.blockCache.size,
        orphanCount: this.orphanBlocks.size
      });
    }, 60000);
  }
  // Public getters
  public getMetrics(): PropagationMetrics {
    return { ...this.metrics };
  }
  public getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }
  public getOrphanBlocks(): OrphanBlock[] {
    return Array.from(this.orphanBlocks.values());
  }
  public getPropagationHistory(): PropagationResult[] {
    return Array.from(this.propagationHistory.values());
  }
  public getBlockFromCache(blockHash: string): Block | undefined {
    return this.blockCache.get(blockHash);
  }
}