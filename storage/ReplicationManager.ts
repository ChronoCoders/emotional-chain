import { PostgreSQLStorage } from './PostgreSQLStorage';
import { Block } from '../server/blockchain/Block';
import { Transaction } from '../crypto/Transaction';
import { P2PNode } from '../network/P2PNode';

/**
 * Multi-node data replication and consistency management
 * Handles distributed storage across EmotionalChain validator network
 */

export interface ReplicationConfig {
  replicationFactor: number; // Number of replicas per data item
  consistencyLevel: 'eventual' | 'strong' | 'quorum';
  enableAutoRepair: boolean;
  repairInterval: number; // ms
  maxReplicationLag: number; // ms
}

export interface ReplicationNode {
  nodeId: string;
  address: string;
  storage: PostgreSQLStorage;
  lastSeen: number;
  replicationLag: number;
  isHealthy: boolean;
}

export interface ReplicationStatus {
  nodeId: string;
  totalReplicas: number;
  healthyReplicas: number;
  replicationLag: number;
  lastSync: number;
  inconsistencies: number;
}

export class ReplicationManager {
  private primaryStorage: PostgreSQLStorage;
  private replicaNodes: Map<string, ReplicationNode> = new Map();
  private config: ReplicationConfig;
  private p2pNode: P2PNode;
  private repairTimer?: NodeJS.Timeout;
  
  constructor(
    primaryStorage: PostgreSQLStorage,
    p2pNode: P2PNode,
    config: Partial<ReplicationConfig> = {}
  ) {
    this.primaryStorage = primaryStorage;
    this.p2pNode = p2pNode;
    this.config = {
      replicationFactor: 3,
      consistencyLevel: 'quorum',
      enableAutoRepair: true,
      repairInterval: 30000, // 30 seconds
      maxReplicationLag: 5000, // 5 seconds
      ...config
    };
  }
  
  async initialize(): Promise<void> {
    // Start automatic repair process if enabled
    if (this.config.enableAutoRepair) {
      this.startAutoRepair();
    }
    
    // Set up P2P message handlers for replication
    this.setupReplicationHandlers();
    
    console.log(`🔄 Replication manager initialized with factor ${this.config.replicationFactor}`);
  }
  
  private setupReplicationHandlers(): void {
    // Handle replication sync requests
    this.p2pNode.on('replication-sync-request', async (data: any) => {
      await this.handleSyncRequest(data);
    });
    
    // Handle replication data messages
    this.p2pNode.on('replication-data', async (data: any) => {
      await this.handleReplicationData(data);
    });
    
    // Handle node health updates
    this.p2pNode.on('node-health-update', (data: any) => {
      this.updateNodeHealth(data.nodeId, data.healthy);
    });
  }
  
  // Node management
  async addReplicaNode(nodeId: string, address: string, storage: PostgreSQLStorage): Promise<void> {
    const replicaNode: ReplicationNode = {
      nodeId,
      address,
      storage,
      lastSeen: Date.now(),
      replicationLag: 0,
      isHealthy: true
    };
    
    this.replicaNodes.set(nodeId, replicaNode);
    
    // Perform initial sync with new replica
    await this.performInitialSync(replicaNode);
    
    console.log(`📡 Added replica node: ${nodeId}`);
  }
  
  removeReplicaNode(nodeId: string): void {
    this.replicaNodes.delete(nodeId);
    console.log(`📡 Removed replica node: ${nodeId}`);
  }
  
  private updateNodeHealth(nodeId: string, healthy: boolean): void {
    const node = this.replicaNodes.get(nodeId);
    if (node) {
      node.isHealthy = healthy;
      node.lastSeen = Date.now();
    }
  }
  
  // Data replication operations
  async replicateBlock(block: Block): Promise<void> {
    const healthyNodes = this.getHealthyNodes();
    const targetNodes = this.selectReplicationTargets(healthyNodes);
    
    const replicationPromises = targetNodes.map(async (node) => {
      try {
        await node.storage.storeBlock(block);
        
        // Send replication confirmation via P2P
        await this.p2pNode.sendToPeer(node.nodeId, {
          type: 'replication-confirmation',
          operation: 'store-block',
          blockHash: block.hash,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`❌ Failed to replicate block to ${node.nodeId}:`, error.message);
        node.isHealthy = false;
      }
    });
    
    if (this.config.consistencyLevel === 'strong') {
      // Wait for all replications to complete
      await Promise.all(replicationPromises);
    } else if (this.config.consistencyLevel === 'quorum') {
      // Wait for majority of replications to complete
      const quorumSize = Math.floor(targetNodes.length / 2) + 1;
      const completed = await Promise.allSettled(replicationPromises);
      const successful = completed.filter(result => result.status === 'fulfilled').length;
      
      if (successful < quorumSize) {
        throw new Error(`Replication quorum not reached: ${successful}/${quorumSize}`);
      }
    }
    // For eventual consistency, we don't wait
  }
  
  async replicateTransaction(transaction: Transaction, blockHash: string): Promise<void> {
    const healthyNodes = this.getHealthyNodes();
    const targetNodes = this.selectReplicationTargets(healthyNodes);
    
    const replicationPromises = targetNodes.map(async (node) => {
      try {
        await node.storage.storeTransaction(transaction, blockHash);
        
        await this.p2pNode.sendToPeer(node.nodeId, {
          type: 'replication-confirmation',
          operation: 'store-transaction',
          transactionHash: transaction.hash,
          blockHash,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`❌ Failed to replicate transaction to ${node.nodeId}:`, error.message);
        node.isHealthy = false;
      }
    });
    
    await this.handleConsistencyLevel(replicationPromises, targetNodes);
  }
  
  async replicateValidatorState(validatorId: string, balance: number, emotionalScore: number): Promise<void> {
    const healthyNodes = this.getHealthyNodes();
    const targetNodes = this.selectReplicationTargets(healthyNodes);
    
    const replicationPromises = targetNodes.map(async (node) => {
      try {
        await node.storage.storeValidatorState(validatorId, balance, emotionalScore);
        
        await this.p2pNode.sendToPeer(node.nodeId, {
          type: 'replication-confirmation',
          operation: 'store-validator-state',
          validatorId,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error(`❌ Failed to replicate validator state to ${node.nodeId}:`, error.message);
        node.isHealthy = false;
      }
    });
    
    await this.handleConsistencyLevel(replicationPromises, targetNodes);
  }
  
  // Consistency and conflict resolution
  private async handleConsistencyLevel(promises: Promise<any>[], targetNodes: ReplicationNode[]): Promise<void> {
    if (this.config.consistencyLevel === 'strong') {
      await Promise.all(promises);
    } else if (this.config.consistencyLevel === 'quorum') {
      const quorumSize = Math.floor(targetNodes.length / 2) + 1;
      const completed = await Promise.allSettled(promises);
      const successful = completed.filter(result => result.status === 'fulfilled').length;
      
      if (successful < quorumSize) {
        throw new Error(`Replication quorum not reached: ${successful}/${quorumSize}`);
      }
    }
  }
  
  async resolveConflicts(blockHash: string): Promise<Block | null> {
    const healthyNodes = this.getHealthyNodes();
    const blockVersions: { node: ReplicationNode; block: Block | null }[] = [];
    
    // Collect block versions from all healthy nodes
    for (const node of healthyNodes) {
      try {
        const block = await node.storage.getBlock(blockHash);
        blockVersions.push({ node, block });
      } catch (error) {
        console.error(`❌ Failed to get block from ${node.nodeId}:`, error.message);
      }
    }
    
    // Add primary storage version
    const primaryBlock = await this.primaryStorage.getBlock(blockHash);
    blockVersions.push({ node: null as any, block: primaryBlock });
    
    // Use majority voting for conflict resolution
    const versionCounts = new Map<string, { count: number; block: Block }>();
    
    for (const { block } of blockVersions) {
      if (block) {
        const key = `${block.hash}_${block.height}_${block.timestamp}`;
        
        if (versionCounts.has(key)) {
          versionCounts.get(key)!.count++;
        } else {
          versionCounts.set(key, { count: 1, block });
        }
      }
    }
    
    // Find the version with the most votes
    let winningVersion: Block | null = null;
    let maxCount = 0;
    
    for (const { count, block } of versionCounts.values()) {
      if (count > maxCount) {
        maxCount = count;
        winningVersion = block;
      }
    }
    
    if (winningVersion && maxCount > 1) {
      // Propagate the winning version to nodes with incorrect data
      await this.propagateCorrectVersion(blockHash, winningVersion, blockVersions);
    }
    
    return winningVersion;
  }
  
  private async propagateCorrectVersion(
    blockHash: string,
    correctBlock: Block,
    nodeVersions: { node: ReplicationNode; block: Block | null }[]
  ): Promise<void> {
    for (const { node, block } of nodeVersions) {
      if (node && (!block || block.hash !== correctBlock.hash)) {
        try {
          await node.storage.storeBlock(correctBlock);
          console.log(`🔄 Corrected block version on ${node.nodeId}`);
        } catch (error) {
          console.error(`❌ Failed to correct block on ${node.nodeId}:`, error.message);
        }
      }
    }
  }
  
  // Automatic repair and maintenance
  private startAutoRepair(): void {
    this.repairTimer = setInterval(async () => {
      await this.performHealthCheck();
      await this.repairInconsistencies();
    }, this.config.repairInterval);
  }
  
  private async performHealthCheck(): Promise<void> {
    const healthPromises = Array.from(this.replicaNodes.values()).map(async (node) => {
      try {
        const health = await node.storage.healthCheck();
        node.isHealthy = health.healthy;
        node.lastSeen = Date.now();
        
        // Calculate replication lag
        const primaryStats = await this.primaryStorage.getStorageStats();
        const nodeStats = await node.storage.getStorageStats();
        
        node.replicationLag = Math.abs(primaryStats.totalBlocks - nodeStats.totalBlocks);
        
      } catch (error) {
        node.isHealthy = false;
        console.error(`❌ Health check failed for ${node.nodeId}:`, error.message);
      }
    });
    
    await Promise.allSettled(healthPromises);
  }
  
  private async repairInconsistencies(): Promise<void> {
    const healthyNodes = this.getHealthyNodes();
    
    for (const node of healthyNodes) {
      if (node.replicationLag > this.config.maxReplicationLag) {
        await this.syncNodeWithPrimary(node);
      }
    }
  }
  
  private async syncNodeWithPrimary(node: ReplicationNode): Promise<void> {
    try {
      console.log(`🔄 Syncing ${node.nodeId} with primary...`);
      
      const primaryStats = await this.primaryStorage.getStorageStats();
      const nodeStats = await node.storage.getStorageStats();
      
      // Sync missing blocks
      if (nodeStats.totalBlocks < primaryStats.totalBlocks) {
        const startHeight = nodeStats.totalBlocks;
        const endHeight = primaryStats.totalBlocks - 1;
        
        const missingBlocks = await this.primaryStorage.getBlockRange(startHeight, endHeight);
        
        for (const block of missingBlocks) {
          await node.storage.storeBlock(block);
          
          // Also sync transactions for this block
          const transactions = await this.primaryStorage.getTransactionsByBlock(block.hash);
          for (const tx of transactions) {
            await node.storage.storeTransaction(tx, block.hash);
          }
        }
        
        console.log(`✅ Synced ${missingBlocks.length} blocks to ${node.nodeId}`);
      }
      
      node.replicationLag = 0;
      
    } catch (error) {
      console.error(`❌ Failed to sync ${node.nodeId}:`, error.message);
      node.isHealthy = false;
    }
  }
  
  private async performInitialSync(node: ReplicationNode): Promise<void> {
    try {
      console.log(`🔄 Performing initial sync for ${node.nodeId}...`);
      
      const primaryStats = await this.primaryStorage.getStorageStats();
      
      if (primaryStats.totalBlocks > 0) {
        // Sync all blocks and transactions
        const allBlocks = await this.primaryStorage.getBlockRange(0, primaryStats.totalBlocks - 1);
        
        for (const block of allBlocks) {
          await node.storage.storeBlock(block);
          
          const transactions = await this.primaryStorage.getTransactionsByBlock(block.hash);
          for (const tx of transactions) {
            await node.storage.storeTransaction(tx, block.hash);
          }
        }
        
        // Sync validator states
        const validatorStates = await this.primaryStorage.getAllValidatorStates();
        for (const state of validatorStates) {
          await node.storage.storeValidatorState(state.validatorId, state.balance, state.emotionalScore);
        }
        
        console.log(`✅ Initial sync completed for ${node.nodeId}: ${allBlocks.length} blocks`);
      }
      
    } catch (error) {
      console.error(`❌ Initial sync failed for ${node.nodeId}:`, error.message);
      node.isHealthy = false;
    }
  }
  
  // Network partition handling
  async handleNetworkPartition(): Promise<void> {
    const healthyNodes = this.getHealthyNodes();
    const partitionThreshold = Math.floor(this.replicaNodes.size / 2);
    
    if (healthyNodes.length < partitionThreshold) {
      console.warn(`⚠️  Network partition detected: ${healthyNodes.length}/${this.replicaNodes.size} nodes healthy`);
      
      // Switch to read-only mode to maintain consistency
      console.log('🔒 Switching to read-only mode due to partition');
      
      // In a production system, this would disable writes until partition is resolved
    }
  }
  
  async handlePartitionRecovery(): Promise<void> {
    const healthyNodes = this.getHealthyNodes();
    const recoveryThreshold = Math.floor(this.replicaNodes.size * 0.75);
    
    if (healthyNodes.length >= recoveryThreshold) {
      console.log(`✅ Network partition recovered: ${healthyNodes.length}/${this.replicaNodes.size} nodes healthy`);
      
      // Perform consistency repair across all nodes
      await this.repairInconsistencies();
      
      console.log('🔓 Resuming normal operations');
    }
  }
  
  // Utility methods
  private getHealthyNodes(): ReplicationNode[] {
    return Array.from(this.replicaNodes.values()).filter(node => node.isHealthy);
  }
  
  private selectReplicationTargets(healthyNodes: ReplicationNode[]): ReplicationNode[] {
    const targetCount = Math.min(this.config.replicationFactor - 1, healthyNodes.length);
    
    // Select nodes with lowest replication lag
    return healthyNodes
      .sort((a, b) => a.replicationLag - b.replicationLag)
      .slice(0, targetCount);
  }
  
  // Message handlers
  private async handleSyncRequest(data: any): Promise<void> {
    const { nodeId, lastBlockHeight } = data;
    
    try {
      const currentStats = await this.primaryStorage.getStorageStats();
      
      if (lastBlockHeight < currentStats.totalBlocks) {
        const missingBlocks = await this.primaryStorage.getBlockRange(
          lastBlockHeight,
          currentStats.totalBlocks - 1
        );
        
        // Send missing blocks to requesting node
        await this.p2pNode.sendToPeer(nodeId, {
          type: 'replication-data',
          blocks: missingBlocks,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error(`❌ Failed to handle sync request from ${nodeId}:`, error.message);
    }
  }
  
  private async handleReplicationData(data: any): Promise<void> {
    const { blocks, timestamp } = data;
    
    try {
      for (const blockData of blocks) {
        // Reconstruct block object and store
        await this.primaryStorage.storeBlock(blockData);
      }
      
      console.log(`📥 Received and stored ${blocks.length} blocks via replication`);
      
    } catch (error) {
      console.error(`❌ Failed to handle replication data:`, error.message);
    }
  }
  
  // Status and monitoring
  getReplicationStatus(): ReplicationStatus[] {
    return Array.from(this.replicaNodes.values()).map(node => ({
      nodeId: node.nodeId,
      totalReplicas: this.config.replicationFactor,
      healthyReplicas: this.getHealthyNodes().length,
      replicationLag: node.replicationLag,
      lastSync: node.lastSeen,
      inconsistencies: 0 // TODO: Calculate actual inconsistencies
    }));
  }
  
  async getReplicationHealth(): Promise<{ healthy: boolean; details: any }> {
    const healthyNodes = this.getHealthyNodes();
    const totalNodes = this.replicaNodes.size;
    const healthyPercentage = totalNodes > 0 ? (healthyNodes.length / totalNodes) * 100 : 0;
    
    const avgReplicationLag = healthyNodes.length > 0
      ? healthyNodes.reduce((sum, node) => sum + node.replicationLag, 0) / healthyNodes.length
      : 0;
    
    const healthy = healthyPercentage >= 75 && avgReplicationLag < this.config.maxReplicationLag;
    
    return {
      healthy,
      details: {
        totalNodes,
        healthyNodes: healthyNodes.length,
        healthyPercentage,
        averageReplicationLag: avgReplicationLag,
        replicationFactor: this.config.replicationFactor,
        consistencyLevel: this.config.consistencyLevel,
        timestamp: Date.now()
      }
    };
  }
  
  // Cleanup
  async shutdown(): Promise<void> {
    if (this.repairTimer) {
      clearInterval(this.repairTimer);
    }
    
    console.log('🛑 Replication manager shutdown complete');
  }
}