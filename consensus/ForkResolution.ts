import { DatabaseStorage } from '../storage/DatabaseStorage';
import { Block } from '../server/blockchain/Block';
import * as _ from 'lodash';

/**
 * Automatic fork detection and resolution for EmotionalChain
 * Implements longest valid emotional chain rule with Byzantine fault tolerance
 */

export interface ForkInfo {
  forkHeight: number;
  mainChain: Block[];
  alternativeChains: Block[][];
  detectedAt: number;
  resolved: boolean;
  resolution: 'main_chain' | 'alternative_chain' | 'manual_intervention';
}

export class ForkResolution {
  private storage: DatabaseStorage;
  private detectedForks: Map<number, ForkInfo> = new Map();
  private orphanBlocks: Map<string, Block> = new Map();
  
  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }
  
  async initialize(): Promise<void> {
    console.log('🔀 Initializing fork resolution system...');
    
    // Load any existing orphan blocks
    await this.loadOrphanBlocks();
    
    console.log('✅ Fork resolution system initialized');
  }
  
  async checkAndResolve(newBlock: Block): Promise<void> {
    // Check if this block creates or resolves a fork
    const forkDetected = await this.detectFork(newBlock);
    
    if (forkDetected) {
      console.log(`🔀 Fork detected at height ${newBlock.height}`);
      await this.resolveFork(forkDetected);
    }
    
    // Check for orphan block connections
    await this.checkOrphanConnections(newBlock);
  }
  
  private async detectFork(newBlock: Block): Promise<ForkInfo | null> {
    // Get the current chain tip
    const chainTip = await this.storage.getLatestBlock();
    
    if (!chainTip) {
      // Genesis block case
      return null;
    }
    
    // Check if new block extends the main chain
    if (newBlock.previousHash === chainTip.hash) {
      // Normal chain extension
      return null;
    }
    
    // Check if this creates a fork
    const parentBlock = await this.storage.getBlockByHash(newBlock.previousHash);
    
    if (!parentBlock) {
      // Orphan block - store for later resolution
      this.orphanBlocks.set(newBlock.hash, newBlock);
      console.log(`🔗 Orphan block detected: ${newBlock.hash.substring(0, 12)}...`);
      return null;
    }
    
    // Fork detected - new block extends a different branch
    const forkHeight = parentBlock.height + 1;
    
    // Check if we already know about this fork
    const existingFork = this.detectedForks.get(forkHeight);
    if (existingFork) {
      // Add to existing fork
      const alternativeChain = this.findChainFromBlock(newBlock);
      existingFork.alternativeChains.push(alternativeChain);
      return existingFork;
    }
    
    // New fork
    const mainChain = await this.getChainFromHeight(forkHeight);
    const alternativeChain = this.findChainFromBlock(newBlock);
    
    const forkInfo: ForkInfo = {
      forkHeight,
      mainChain,
      alternativeChains: [alternativeChain],
      detectedAt: Date.now(),
      resolved: false,
      resolution: 'main_chain'
    };
    
    this.detectedForks.set(forkHeight, forkInfo);
    
    return forkInfo;
  }
  
  private async resolveFork(forkInfo: ForkInfo): Promise<void> {
    console.log(`🔧 Resolving fork at height ${forkInfo.forkHeight}...`);
    
    // Compare chains using emotional weight rules
    const bestChain = await this.selectBestChain(forkInfo);
    
    if (bestChain === 'main_chain') {
      // Main chain wins - reject alternative chains
      forkInfo.resolution = 'main_chain';
      await this.rejectAlternativeChains(forkInfo.alternativeChains);
      
    } else {
      // Alternative chain wins - reorganize blockchain
      forkInfo.resolution = 'alternative_chain';
      await this.reorganizeBlockchain(forkInfo, bestChain as number);
    }
    
    forkInfo.resolved = true;
    
    console.log(`✅ Fork resolved: ${forkInfo.resolution}`);
  }
  
  private async selectBestChain(forkInfo: ForkInfo): Promise<'main_chain' | number> {
    const chains = [forkInfo.mainChain, ...forkInfo.alternativeChains];
    let bestChainIndex = 0;
    let bestScore = 0;
    
    for (let i = 0; i < chains.length; i++) {
      const chain = chains[i];
      const score = await this.calculateChainScore(chain);
      
      console.log(`🏆 Chain ${i} score: ${score.toFixed(2)}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestChainIndex = i;
      }
    }
    
    return bestChainIndex === 0 ? 'main_chain' : bestChainIndex - 1;
  }
  
  private async calculateChainScore(chain: Block[]): Promise<number> {
    if (chain.length === 0) return 0;
    
    let score = 0;
    
    // Base score: chain length (longer chains preferred)
    score += chain.length * 10;
    
    // Emotional weight: sum of emotional scores
    const emotionalWeight = _.sumBy(chain, block => block.emotionalScore || 0);
    score += emotionalWeight * 0.5;
    
    // Consensus strength: average consensus strength
    const consensusStrengths = chain
      .map(block => block.consensusMetadata?.consensusStrength || 0)
      .filter(strength => strength > 0);
    
    if (consensusStrengths.length > 0) {
      const avgConsensusStrength = _.mean(consensusStrengths);
      score += avgConsensusStrength * 2;
    }
    
    // Validator diversity: number of unique validators
    const uniqueValidators = new Set(chain.map(block => block.validatorId)).size;
    score += uniqueValidators * 5;
    
    // Temporal consistency: penalize blocks with suspicious timestamps
    const temporalPenalty = this.calculateTemporalPenalty(chain);
    score -= temporalPenalty;
    
    // Byzantine resistance: penalize chains with low participation
    const byzantinePenalty = this.calculateByzantinePenalty(chain);
    score -= byzantinePenalty;
    
    return Math.max(0, score);
  }
  
  private calculateTemporalPenalty(chain: Block[]): number {
    let penalty = 0;
    
    for (let i = 1; i < chain.length; i++) {
      const timeDiff = chain[i].timestamp - chain[i-1].timestamp;
      
      // Penalize blocks that are too close together (< 10 seconds)
      if (timeDiff < 10000) {
        penalty += 5;
      }
      
      // Penalize blocks that are too far apart (> 60 seconds)
      if (timeDiff > 60000) {
        penalty += 10;
      }
      
      // Penalize blocks from the future (allowing 30 second clock skew)
      if (chain[i].timestamp > Date.now() + 30000) {
        penalty += 20;
      }
    }
    
    return penalty;
  }
  
  private calculateByzantinePenalty(chain: Block[]): number {
    let penalty = 0;
    
    for (const block of chain) {
      const metadata = block.consensusMetadata;
      
      if (!metadata) {
        penalty += 15; // No consensus metadata is suspicious
        continue;
      }
      
      // Penalize low participation
      if (metadata.participantCount < 10) {
        penalty += 10;
      }
      
      // Penalize low consensus strength
      if (metadata.consensusStrength < 67) {
        penalty += 15;
      }
      
      // Penalize low emotional fitness
      if (metadata.emotionalFitness < 75) {
        penalty += 8;
      }
    }
    
    return penalty;
  }
  
  private async reorganizeBlockchain(forkInfo: ForkInfo, winningChainIndex: number): Promise<void> {
    console.log('🔄 Reorganizing blockchain...');
    
    const winningChain = forkInfo.alternativeChains[winningChainIndex];
    
    // Revert main chain blocks after fork point
    const blocksToRevert = await this.getBlocksFromHeight(forkInfo.forkHeight);
    
    for (const block of blocksToRevert.reverse()) {
      await this.revertBlock(block);
    }
    
    // Apply winning chain blocks
    for (const block of winningChain) {
      await this.applyBlock(block);
    }
    
    console.log(`✅ Blockchain reorganized: ${winningChain.length} blocks applied`);
  }
  
  private async revertBlock(block: Block): Promise<void> {
    console.log(`⏪ Reverting block ${block.height}: ${block.hash.substring(0, 12)}...`);
    
    // Revert transactions (return to mempool)
    for (const transaction of block.transactions) {
      await this.storage.addTransactionToMempool(transaction);
    }
    
    // Remove block from storage
    await this.storage.removeBlock(block.hash);
    
    // Update validator balances (reverse rewards)
    const validatorBalance = await this.storage.getValidatorBalance(block.validatorId);
    if (validatorBalance) {
      const rewardAmount = this.calculateBlockReward(block);
      await this.storage.updateValidatorBalance(
        block.validatorId,
        validatorBalance - rewardAmount
      );
    }
  }
  
  private async applyBlock(block: Block): Promise<void> {
    console.log(`⏩ Applying block ${block.height}: ${block.hash.substring(0, 12)}...`);
    
    // Store block
    await this.storage.storeBlock(block);
    
    // Process transactions (remove from mempool)
    for (const transaction of block.transactions) {
      await this.storage.removeTransactionFromMempool(transaction.hash);
    }
    
    // Update validator balances (add rewards)
    const validatorBalance = await this.storage.getValidatorBalance(block.validatorId);
    if (validatorBalance !== null) {
      const rewardAmount = this.calculateBlockReward(block);
      await this.storage.updateValidatorBalance(
        block.validatorId,
        validatorBalance + rewardAmount
      );
    }
  }
  
  private calculateBlockReward(block: Block): number {
    // Calculate the reward that was given for this block
    const baseReward = 50;
    const emotionalBonus = Math.max(0, (block.emotionalScore - 75) * 0.4);
    return baseReward + emotionalBonus;
  }
  
  private async rejectAlternativeChains(alternativeChains: Block[][]): Promise<void> {
    for (const chain of alternativeChains) {
      for (const block of chain) {
        // Move rejected blocks to orphan storage
        this.orphanBlocks.set(block.hash, block);
        console.log(`❌ Rejected block ${block.height}: ${block.hash.substring(0, 12)}...`);
      }
    }
  }
  
  private findChainFromBlock(block: Block): Block[] {
    // This would traverse backwards to build the full chain
    // For now, return single block (simplified)
    return [block];
  }
  
  private async getChainFromHeight(height: number): Promise<Block[]> {
    const blocks = [];
    let currentHeight = height;
    
    while (currentHeight <= (await this.storage.getLatestBlock())?.height) {
      const block = await this.storage.getBlockByHeight(currentHeight);
      if (block) {
        blocks.push(block);
        currentHeight++;
      } else {
        break;
      }
    }
    
    return blocks;
  }
  
  private async getBlocksFromHeight(height: number): Promise<Block[]> {
    return await this.getChainFromHeight(height);
  }
  
  private async checkOrphanConnections(newBlock: Block): Promise<void> {
    // Check if any orphan blocks can now be connected
    const connectedOrphans = [];
    
    for (const [hash, orphanBlock] of this.orphanBlocks.entries()) {
      if (orphanBlock.previousHash === newBlock.hash) {
        connectedOrphans.push(orphanBlock);
        this.orphanBlocks.delete(hash);
      }
    }
    
    // Process newly connected orphans
    for (const orphan of connectedOrphans) {
      console.log(`🔗 Orphan block connected: ${orphan.hash.substring(0, 12)}...`);
      await this.checkAndResolve(orphan);
    }
  }
  
  private async loadOrphanBlocks(): Promise<void> {
    // In a real implementation, this would load orphan blocks from persistent storage
    // For now, start with empty map
    this.orphanBlocks.clear();
  }
  
  // Network partition handling
  async handleNetworkPartition(): Promise<void> {
    console.log('🌐 Handling network partition...');
    
    // Pause consensus during partition
    // Mark all recent blocks as potentially disputed
    const recentBlocks = await this.getBlocksFromHeight(
      Math.max(0, (await this.storage.getLatestBlock())?.height - 10)
    );
    
    for (const block of recentBlocks) {
      // Mark block as disputed (would be stored in metadata)
      console.log(`❓ Marking block ${block.height} as disputed due to partition`);
    }
  }
  
  async handleNetworkHealing(): Promise<void> {
    console.log('🔄 Network partition healed, resolving conflicts...');
    
    // Re-evaluate recent blocks and resolve any conflicts
    // This would involve syncing with other nodes and resolving forks
    
    const recentForks = Array.from(this.detectedForks.values())
      .filter(fork => !fork.resolved && Date.now() - fork.detectedAt < 3600000); // 1 hour
    
    for (const fork of recentForks) {
      await this.resolveFork(fork);
    }
  }
  
  // Public API
  getDetectedForks(): ForkInfo[] {
    return Array.from(this.detectedForks.values());
  }
  
  getOrphanBlocks(): Block[] {
    return Array.from(this.orphanBlocks.values());
  }
  
  async getForkStatistics(): Promise<{
    totalForks: number;
    resolvedForks: number;
    pendingForks: number;
    orphanBlocks: number;
    averageResolutionTime: number;
  }> {
    const forks = Array.from(this.detectedForks.values());
    const resolvedForks = forks.filter(f => f.resolved);
    
    const averageResolutionTime = resolvedForks.length > 0
      ? _.meanBy(resolvedForks, f => f.detectedAt)
      : 0;
    
    return {
      totalForks: forks.length,
      resolvedForks: resolvedForks.length,
      pendingForks: forks.length - resolvedForks.length,
      orphanBlocks: this.orphanBlocks.size,
      averageResolutionTime
    };
  }
  
  // Emergency procedures
  async emergencyChainReset(resetToHeight: number): Promise<void> {
    console.log(`🚨 Emergency chain reset to height ${resetToHeight}`);
    
    // This would be used in extreme cases where the chain state is corrupted
    // Remove all blocks after the reset height
    const currentHeight = (await this.storage.getLatestBlock())?.height || 0;
    
    for (let height = currentHeight; height > resetToHeight; height--) {
      const block = await this.storage.getBlockByHeight(height);
      if (block) {
        await this.revertBlock(block);
      }
    }
    
    // Clear fork detection state
    this.detectedForks.clear();
    this.orphanBlocks.clear();
    
    console.log(`✅ Emergency reset complete at height ${resetToHeight}`);
  }
  
  async validateChainIntegrity(): Promise<{
    valid: boolean;
    errors: string[];
    lastValidHeight: number;
  }> {
    const errors: string[] = [];
    let lastValidHeight = 0;
    
    const latestBlock = await this.storage.getLatestBlock();
    if (!latestBlock) {
      return { valid: true, errors: [], lastValidHeight: 0 };
    }
    
    // Validate chain from genesis
    for (let height = 1; height <= latestBlock.height; height++) {
      const block = await this.storage.getBlockByHeight(height);
      const prevBlock = await this.storage.getBlockByHeight(height - 1);
      
      if (!block) {
        errors.push(`Missing block at height ${height}`);
        break;
      }
      
      if (!prevBlock && height > 1) {
        errors.push(`Missing previous block at height ${height - 1}`);
        break;
      }
      
      if (height > 1 && block.previousHash !== prevBlock.hash) {
        errors.push(`Invalid previous hash at height ${height}`);
        break;
      }
      
      lastValidHeight = height;
    }
    
    return {
      valid: errors.length === 0,
      errors,
      lastValidHeight
    };
  }
}