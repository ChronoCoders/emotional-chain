/**
 * IPFS Distributed Storage for EmotionalChain
 * Decentralized content storage with content addressing
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface IPFSNode {
  id: string;
  multiaddr: string;
  online: boolean;
  latency: number;
  reliability: number;
  storageCapacity: number;
  storageUsed: number;
  lastSeen: number;
}

export interface IPFSFile {
  hash: string;
  size: number;
  type: 'biometric_data' | 'block_data' | 'validator_profile' | 'consensus_proof' | 'backup' | 'other';
  created: number;
  accessed: number;
  pinned: boolean;
  replicas: number;
  metadata: {
    filename?: string;
    contentType?: string;
    encryption?: boolean;
    compression?: boolean;
    tags?: string[];
  };
}

export interface ReplicationStatus {
  hash: string;
  targetReplicas: number;
  currentReplicas: number;
  replicatedNodes: string[];
  replicationHealth: 'healthy' | 'degraded' | 'critical';
  lastReplication: number;
}

export interface StorageMetrics {
  totalFiles: number;
  totalSize: number;
  averageReplicationFactor: number;
  networkNodes: number;
  onlineNodes: number;
  storageEfficiency: number;
  retrievalLatency: number;
  dataIntegrity: number;
}

export interface PinningStrategy {
  type: 'permanent' | 'temporary' | 'conditional';
  duration?: number; // milliseconds for temporary
  conditions?: {
    minReplicas: number;
    accessFrequency: number;
    importance: 'critical' | 'high' | 'medium' | 'low';
  };
}

export class IPFSStorage extends EventEmitter {
  private nodes: Map<string, IPFSNode> = new Map();
  private files: Map<string, IPFSFile> = new Map();
  private replicationStatus: Map<string, ReplicationStatus> = new Map();
  private metrics: StorageMetrics;
  private isInitialized = false;
  private defaultReplicationFactor = 3;
  private maxRetries = 3;

  constructor() {
    super();
    
    this.metrics = {
      totalFiles: 0,
      totalSize: 0,
      averageReplicationFactor: 0,
      networkNodes: 0,
      onlineNodes: 0,
      storageEfficiency: 0,
      retrievalLatency: 0,
      dataIntegrity: 100
    };

    this.initializeIPFS();
  }

  private async initializeIPFS(): Promise<void> {
    try {
      console.log(`🌐 Initializing IPFS distributed storage`);

      // Initialize bootstrap nodes
      await this.initializeBootstrapNodes();

      // Start network discovery
      this.startNetworkDiscovery();

      // Start replication monitoring
      this.startReplicationMonitoring();

      // Start garbage collection
      this.startGarbageCollection();

      this.isInitialized = true;
      console.log(`✅ IPFS storage initialized successfully`);
      this.emit('ready');

    } catch (error) {
      console.error(`❌ Failed to initialize IPFS storage:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  public async add(
    data: Buffer | string | any,
    options: {
      pin?: PinningStrategy;
      filename?: string;
      contentType?: string;
      encryption?: boolean;
      compression?: boolean;
      tags?: string[];
      type?: IPFSFile['type'];
    } = {}
  ): Promise<{ hash: string; size: number }> {
    if (!this.isInitialized) {
      throw new Error('IPFS storage not initialized');
    }

    const startTime = Date.now();

    try {
      // Prepare data
      let processedData: Buffer;
      
      if (typeof data === 'string') {
        processedData = Buffer.from(data, 'utf8');
      } else if (Buffer.isBuffer(data)) {
        processedData = data;
      } else {
        processedData = Buffer.from(JSON.stringify(data), 'utf8');
      }

      // Apply compression if requested
      if (options.compression) {
        processedData = await this.compressData(processedData);
      }

      // Apply encryption if requested
      if (options.encryption) {
        processedData = await this.encryptData(processedData);
      }

      // Generate content hash
      const hash = this.generateContentHash(processedData);

      // Check if content already exists
      if (this.files.has(hash)) {
        const existingFile = this.files.get(hash)!;
        existingFile.accessed = Date.now();
        console.log(`📄 Content already exists: ${hash}`);
        return { hash, size: existingFile.size };
      }

      // Create file metadata
      const file: IPFSFile = {
        hash,
        size: processedData.length,
        type: options.type || 'other',
        created: Date.now(),
        accessed: Date.now(),
        pinned: !!options.pin,
        replicas: 0,
        metadata: {
          filename: options.filename,
          contentType: options.contentType,
          encryption: options.encryption,
          compression: options.compression,
          tags: options.tags || []
        }
      };

      // Store in network
      await this.storeInNetwork(hash, processedData, file);

      // Apply pinning strategy
      if (options.pin) {
        await this.applyPinningStrategy(hash, options.pin);
      }

      // Update metrics
      this.updateStorageMetrics(file);

      const addTime = Date.now() - startTime;
      console.log(`✅ Added to IPFS: ${hash} (${file.size} bytes, ${addTime}ms)`);
      this.emit('fileAdded', { hash, size: file.size, addTime });

      return { hash, size: file.size };

    } catch (error) {
      const addTime = Date.now() - startTime;
      console.error(`❌ Failed to add to IPFS:`, error);
      this.emit('addError', { error: error.message, addTime });
      throw error;
    }
  }

  public async get(hash: string, options: { decrypt?: boolean; decompress?: boolean } = {}): Promise<Buffer> {
    if (!this.isInitialized) {
      throw new Error('IPFS storage not initialized');
    }

    const startTime = Date.now();

    try {
      const file = this.files.get(hash);
      if (!file) {
        throw new Error(`File not found: ${hash}`);
      }

      // Update access time
      file.accessed = Date.now();

      // Retrieve from network
      const data = await this.retrieveFromNetwork(hash);

      let processedData = data;

      // Apply decryption if needed
      if (options.decrypt && file.metadata.encryption) {
        processedData = await this.decryptData(processedData);
      }

      // Apply decompression if needed
      if (options.decompress && file.metadata.compression) {
        processedData = await this.decompressData(processedData);
      }

      const retrievalTime = Date.now() - startTime;
      this.updateRetrievalMetrics(retrievalTime);

      console.log(`📥 Retrieved from IPFS: ${hash} (${processedData.length} bytes, ${retrievalTime}ms)`);
      this.emit('fileRetrieved', { hash, size: processedData.length, retrievalTime });

      return processedData;

    } catch (error) {
      const retrievalTime = Date.now() - startTime;
      console.error(`❌ Failed to retrieve from IPFS: ${hash}`, error);
      this.emit('retrievalError', { hash, error: error.message, retrievalTime });
      throw error;
    }
  }

  public async pin(hash: string, strategy: PinningStrategy): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('IPFS storage not initialized');
    }

    try {
      const file = this.files.get(hash);
      if (!file) {
        throw new Error(`File not found: ${hash}`);
      }

      await this.applyPinningStrategy(hash, strategy);
      file.pinned = true;

      console.log(`📌 Pinned file: ${hash} (${strategy.type})`);
      this.emit('filePinned', { hash, strategy });

    } catch (error) {
      console.error(`❌ Failed to pin file: ${hash}`, error);
      this.emit('pinError', { hash, error: error.message });
      throw error;
    }
  }

  public async unpin(hash: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('IPFS storage not initialized');
    }

    try {
      const file = this.files.get(hash);
      if (!file) {
        throw new Error(`File not found: ${hash}`);
      }

      // Remove from pinning
      await this.removePinning(hash);
      file.pinned = false;

      console.log(`📌 Unpinned file: ${hash}`);
      this.emit('fileUnpinned', { hash });

    } catch (error) {
      console.error(`❌ Failed to unpin file: ${hash}`, error);
      this.emit('unpinError', { hash, error: error.message });
      throw error;
    }
  }

  public async ensureReplication(hash: string, targetReplicas: number = this.defaultReplicationFactor): Promise<ReplicationStatus> {
    if (!this.isInitialized) {
      throw new Error('IPFS storage not initialized');
    }

    try {
      const file = this.files.get(hash);
      if (!file) {
        throw new Error(`File not found: ${hash}`);
      }

      console.log(`🔄 Ensuring replication for ${hash}: target ${targetReplicas} replicas`);

      // Get current replication status
      let status = this.replicationStatus.get(hash);
      if (!status) {
        status = {
          hash,
          targetReplicas,
          currentReplicas: 0,
          replicatedNodes: [],
          replicationHealth: 'critical',
          lastReplication: Date.now()
        };
        this.replicationStatus.set(hash, status);
      }

      // Find suitable nodes for replication
      const availableNodes = this.getAvailableNodes();
      const replicationNodes = this.selectReplicationNodes(availableNodes, targetReplicas, status.replicatedNodes);

      // Replicate to additional nodes if needed
      for (const nodeId of replicationNodes) {
        await this.replicateToNode(hash, nodeId);
        if (!status.replicatedNodes.includes(nodeId)) {
          status.replicatedNodes.push(nodeId);
        }
      }

      // Update replication status
      status.currentReplicas = status.replicatedNodes.length;
      status.targetReplicas = targetReplicas;
      status.lastReplication = Date.now();
      status.replicationHealth = this.calculateReplicationHealth(status);

      file.replicas = status.currentReplicas;

      console.log(`✅ Replication ensured for ${hash}: ${status.currentReplicas}/${targetReplicas} replicas`);
      this.emit('replicationEnsured', status);

      return status;

    } catch (error) {
      console.error(`❌ Failed to ensure replication for ${hash}:`, error);
      this.emit('replicationError', { hash, error: error.message });
      throw error;
    }
  }

  public async garbageCollect(): Promise<{ removedFiles: number; freedSpace: number }> {
    if (!this.isInitialized) {
      throw new Error('IPFS storage not initialized');
    }

    console.log(`🗑️ Starting garbage collection`);
    const startTime = Date.now();

    try {
      let removedFiles = 0;
      let freedSpace = 0;
      const now = Date.now();
      const filesToRemove: string[] = [];

      // Identify files for removal
      for (const [hash, file] of this.files.entries()) {
        let shouldRemove = false;

        // Remove unpinned files not accessed in 7 days
        if (!file.pinned && now - file.accessed > 7 * 24 * 60 * 60 * 1000) {
          shouldRemove = true;
        }

        // Remove temporary pins that have expired
        if (file.pinned) {
          // Check if temporary pin has expired (simplified)
          const pinExpired = false; // Would check actual pin strategy
          if (pinExpired) {
            shouldRemove = true;
          }
        }

        if (shouldRemove) {
          filesToRemove.push(hash);
          freedSpace += file.size;
        }
      }

      // Remove identified files
      for (const hash of filesToRemove) {
        await this.removeFile(hash);
        removedFiles++;
      }

      const gcTime = Date.now() - startTime;
      console.log(`✅ Garbage collection completed: removed ${removedFiles} files, freed ${(freedSpace / 1024 / 1024).toFixed(2)} MB in ${gcTime}ms`);
      
      this.emit('garbageCollected', { removedFiles, freedSpace, gcTime });
      return { removedFiles, freedSpace };

    } catch (error) {
      console.error(`❌ Garbage collection failed:`, error);
      this.emit('gcError', { error: error.message });
      throw error;
    }
  }

  private async initializeBootstrapNodes(): Promise<void> {
    // Initialize with some bootstrap nodes
    const bootstrapNodes = [
      {
        id: 'bootstrap-1',
        multiaddr: '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
        online: true,
        latency: 50,
        reliability: 0.99,
        storageCapacity: 1000000000, // 1GB
        storageUsed: 0,
        lastSeen: Date.now()
      },
      {
        id: 'bootstrap-2',
        multiaddr: '/ip4/104.236.179.241/tcp/4001/p2p/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
        online: true,
        latency: 75,
        reliability: 0.98,
        storageCapacity: 2000000000, // 2GB
        storageUsed: 0,
        lastSeen: Date.now()
      }
    ];

    for (const node of bootstrapNodes) {
      this.nodes.set(node.id, node);
    }

    this.updateNetworkMetrics();
    console.log(`🌱 Initialized ${bootstrapNodes.length} bootstrap nodes`);
  }

  private startNetworkDiscovery(): void {
    // Discover new nodes every 30 seconds
    setInterval(() => {
      this.discoverNodes();
    }, 30000);
  }

  private startReplicationMonitoring(): void {
    // Monitor replication health every 5 minutes
    setInterval(() => {
      this.monitorReplicationHealth();
    }, 5 * 60 * 1000);
  }

  private startGarbageCollection(): void {
    // Run garbage collection every hour
    setInterval(() => {
      this.garbageCollect();
    }, 60 * 60 * 1000);
  }

  private async discoverNodes(): Promise<void> {
    // Simulate node discovery
    const discoveredNodes = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < discoveredNodes; i++) {
      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const node: IPFSNode = {
        id: nodeId,
        multiaddr: `/ip4/192.168.1.${Math.floor(Math.random() * 255)}/tcp/4001/p2p/${nodeId}`,
        online: Math.random() > 0.1, // 90% online
        latency: 20 + Math.random() * 200,
        reliability: 0.8 + Math.random() * 0.2,
        storageCapacity: (0.5 + Math.random() * 2) * 1000000000, // 0.5-2.5GB
        storageUsed: 0,
        lastSeen: Date.now()
      };

      this.nodes.set(nodeId, node);
    }

    if (discoveredNodes > 0) {
      this.updateNetworkMetrics();
      console.log(`🔍 Discovered ${discoveredNodes} new nodes`);
    }
  }

  private async monitorReplicationHealth(): Promise<void> {
    console.log(`💊 Monitoring replication health for ${this.replicationStatus.size} files`);

    for (const [hash, status] of this.replicationStatus.entries()) {
      // Check if replication is healthy
      const onlineReplicas = status.replicatedNodes.filter(nodeId => {
        const node = this.nodes.get(nodeId);
        return node && node.online;
      }).length;

      if (onlineReplicas < status.targetReplicas * 0.7) { // Less than 70% target
        console.warn(`⚠️ Replication degraded for ${hash}: ${onlineReplicas}/${status.targetReplicas}`);
        await this.ensureReplication(hash, status.targetReplicas);
      }
    }
  }

  private generateContentHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async compressData(data: Buffer): Promise<Buffer> {
    // Simplified compression (would use actual compression library)
    return Buffer.from(data.toString('base64'));
  }

  private async decompressData(data: Buffer): Promise<Buffer> {
    // Simplified decompression
    return Buffer.from(data.toString(), 'base64');
  }

  private async encryptData(data: Buffer): Promise<Buffer> {
    // Simplified encryption (would use proper encryption)
    const cipher = crypto.createCipher('aes-256-cbc', 'ipfs-encryption-key');
    return Buffer.concat([cipher.update(data), cipher.final()]);
  }

  private async decryptData(data: Buffer): Promise<Buffer> {
    // Simplified decryption
    const decipher = crypto.createDecipher('aes-256-cbc', 'ipfs-encryption-key');
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }

  private async storeInNetwork(hash: string, data: Buffer, file: IPFSFile): Promise<void> {
    // Store file metadata
    this.files.set(hash, file);

    // Simulate network storage
    console.log(`💾 Stored in network: ${hash} (${data.length} bytes)`);

    // Initialize replication
    await this.ensureReplication(hash);
  }

  private async retrieveFromNetwork(hash: string): Promise<Buffer> {
    // Simulate network retrieval
    const file = this.files.get(hash);
    if (!file) {
      throw new Error(`File not found in network: ${hash}`);
    }

    // Simulate data retrieval (would actually retrieve from network)
    const simulatedData = Buffer.from(`simulated-data-for-${hash}`);
    return simulatedData;
  }

  private async applyPinningStrategy(hash: string, strategy: PinningStrategy): Promise<void> {
    console.log(`📌 Applying pinning strategy for ${hash}: ${strategy.type}`);

    switch (strategy.type) {
      case 'permanent':
        // Pin permanently
        break;
      case 'temporary':
        // Pin with expiration
        if (strategy.duration) {
          setTimeout(() => {
            this.unpin(hash).catch(console.error);
          }, strategy.duration);
        }
        break;
      case 'conditional':
        // Pin based on conditions
        if (strategy.conditions) {
          await this.ensureReplication(hash, strategy.conditions.minReplicas);
        }
        break;
    }
  }

  private async removePinning(hash: string): Promise<void> {
    console.log(`📌 Removing pinning for ${hash}`);
    // Remove from pinning (simplified)
  }

  private getAvailableNodes(): IPFSNode[] {
    return Array.from(this.nodes.values()).filter(node => node.online);
  }

  private selectReplicationNodes(availableNodes: IPFSNode[], targetReplicas: number, excludeNodes: string[]): string[] {
    const candidateNodes = availableNodes.filter(node => !excludeNodes.includes(node.id));
    
    // Sort by reliability and available storage
    candidateNodes.sort((a, b) => {
      const aScore = a.reliability * (1 - a.storageUsed / a.storageCapacity);
      const bScore = b.reliability * (1 - b.storageUsed / b.storageCapacity);
      return bScore - aScore;
    });

    const needed = Math.max(0, targetReplicas - excludeNodes.length);
    return candidateNodes.slice(0, needed).map(node => node.id);
  }

  private async replicateToNode(hash: string, nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    console.log(`🔄 Replicating ${hash} to ${nodeId}`);
    
    // Simulate replication
    const file = this.files.get(hash);
    if (file) {
      node.storageUsed += file.size;
    }
  }

  private calculateReplicationHealth(status: ReplicationStatus): 'healthy' | 'degraded' | 'critical' {
    const ratio = status.currentReplicas / status.targetReplicas;
    
    if (ratio >= 1.0) return 'healthy';
    if (ratio >= 0.7) return 'degraded';
    return 'critical';
  }

  private async removeFile(hash: string): Promise<void> {
    const file = this.files.get(hash);
    if (file) {
      this.files.delete(hash);
      this.replicationStatus.delete(hash);

      // Update node storage usage
      const status = this.replicationStatus.get(hash);
      if (status) {
        for (const nodeId of status.replicatedNodes) {
          const node = this.nodes.get(nodeId);
          if (node) {
            node.storageUsed = Math.max(0, node.storageUsed - file.size);
          }
        }
      }
    }
  }

  private updateStorageMetrics(file: IPFSFile): void {
    this.metrics.totalFiles++;
    this.metrics.totalSize += file.size;
    this.calculateAverageReplicationFactor();
    this.updateNetworkMetrics();
  }

  private updateRetrievalMetrics(retrievalTime: number): void {
    this.metrics.retrievalLatency = (this.metrics.retrievalLatency + retrievalTime) / 2;
  }

  private calculateAverageReplicationFactor(): void {
    if (this.files.size === 0) {
      this.metrics.averageReplicationFactor = 0;
      return;
    }

    const totalReplicas = Array.from(this.files.values()).reduce((sum, file) => sum + file.replicas, 0);
    this.metrics.averageReplicationFactor = totalReplicas / this.files.size;
  }

  private updateNetworkMetrics(): void {
    this.metrics.networkNodes = this.nodes.size;
    this.metrics.onlineNodes = Array.from(this.nodes.values()).filter(node => node.online).length;
    
    if (this.metrics.networkNodes > 0) {
      this.metrics.storageEfficiency = (this.metrics.onlineNodes / this.metrics.networkNodes) * 100;
    }
  }

  // Public getters
  public getMetrics(): StorageMetrics {
    return { ...this.metrics };
  }

  public getFiles(): IPFSFile[] {
    return Array.from(this.files.values());
  }

  public getNodes(): IPFSNode[] {
    return Array.from(this.nodes.values());
  }

  public getReplicationStatus(): ReplicationStatus[] {
    return Array.from(this.replicationStatus.values());
  }

  public getFileInfo(hash: string): IPFSFile | undefined {
    return this.files.get(hash);
  }

  public isOnline(): boolean {
    return this.isInitialized && this.metrics.onlineNodes > 0;
  }
}