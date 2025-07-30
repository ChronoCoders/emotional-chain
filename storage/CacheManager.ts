/**
 * In-memory caching layer for EmotionalChain
 * Provides high-performance access to frequently used blockchain data
 */

import { Block } from '../server/blockchain/Block';
import { Transaction } from '../crypto/Transaction';
import { ValidatorState } from './StateManager';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictions: number;
}

export class CacheManager {
  private blockCache = new Map<string, CacheEntry<Block>>();
  private transactionCache = new Map<string, CacheEntry<Transaction>>();
  private validatorCache = new Map<string, CacheEntry<ValidatorState>>();
  private queryCache = new Map<string, CacheEntry<any>>();
  
  private maxEntries: number;
  private ttl: number; // Time to live in milliseconds
  private cleanupInterval: NodeJS.Timeout;
  
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  
  constructor(maxEntries: number = 10000, ttlMinutes: number = 30) {
    this.maxEntries = maxEntries;
    this.ttl = ttlMinutes * 60 * 1000;
    
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }
  
  // Block caching
  cacheBlock(hash: string, block: Block): void {
    this.blockCache.set(hash, {
      data: block,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
    
    this.enforceMaxEntries();
  }
  
  getCachedBlock(hash: string): Block | null {
    const entry = this.blockCache.get(hash);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.blockCache.delete(hash);
      this.stats.misses++;
      return null;
    }
    
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data;
  }
  
  // Transaction caching
  cacheTransaction(hash: string, transaction: Transaction): void {
    this.transactionCache.set(hash, {
      data: transaction,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
    
    this.enforceMaxEntries();
  }
  
  getCachedTransaction(hash: string): Transaction | null {
    const entry = this.transactionCache.get(hash);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.transactionCache.delete(hash);
      this.stats.misses++;
      return null;
    }
    
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data;
  }
  
  // Validator state caching
  cacheValidatorState(validatorId: string, state: ValidatorState): void {
    this.validatorCache.set(validatorId, {
      data: state,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
    
    this.enforceMaxEntries();
  }
  
  getCachedValidatorState(validatorId: string): ValidatorState | null {
    const entry = this.validatorCache.get(validatorId);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.validatorCache.delete(validatorId);
      this.stats.misses++;
      return null;
    }
    
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data;
  }
  
  // Query result caching
  cacheQueryResult(queryKey: string, result: any): void {
    this.queryCache.set(queryKey, {
      data: result,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
    
    this.enforceMaxEntries();
  }
  
  getCachedQueryResult(queryKey: string): any | null {
    const entry = this.queryCache.get(queryKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.queryCache.delete(queryKey);
      this.stats.misses++;
      return null;
    }
    
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data;
  }
  
  // Cache invalidation
  invalidateBlock(hash: string): void {
    this.blockCache.delete(hash);
  }
  
  invalidateTransaction(hash: string): void {
    this.transactionCache.delete(hash);
  }
  
  invalidateValidatorState(validatorId: string): void {
    this.validatorCache.delete(validatorId);
  }
  
  invalidateQueryPattern(pattern: string): void {
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }
  
  // Cache management
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }
  
  private enforceMaxEntries(): void {
    const totalEntries = this.blockCache.size + this.transactionCache.size + 
                        this.validatorCache.size + this.queryCache.size;
    
    if (totalEntries > this.maxEntries) {
      this.evictLeastUsed();
    }
  }
  
  private evictLeastUsed(): void {
    // Find least recently used entries across all caches
    const allEntries: { key: string; cache: string; lastAccessed: number }[] = [];
    
    for (const [key, entry] of this.blockCache.entries()) {
      allEntries.push({ key, cache: 'block', lastAccessed: entry.lastAccessed });
    }
    
    for (const [key, entry] of this.transactionCache.entries()) {
      allEntries.push({ key, cache: 'transaction', lastAccessed: entry.lastAccessed });
    }
    
    for (const [key, entry] of this.validatorCache.entries()) {
      allEntries.push({ key, cache: 'validator', lastAccessed: entry.lastAccessed });
    }
    
    for (const [key, entry] of this.queryCache.entries()) {
      allEntries.push({ key, cache: 'query', lastAccessed: entry.lastAccessed });
    }
    
    // Sort by last accessed time and evict oldest 10%
    allEntries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    const evictCount = Math.ceil(allEntries.length * 0.1);
    
    for (let i = 0; i < evictCount; i++) {
      const entry = allEntries[i];
      
      switch (entry.cache) {
        case 'block':
          this.blockCache.delete(entry.key);
          break;
        case 'transaction':
          this.transactionCache.delete(entry.key);
          break;
        case 'validator':
          this.validatorCache.delete(entry.key);
          break;
        case 'query':
          this.queryCache.delete(entry.key);
          break;
      }
      
      this.stats.evictions++;
    }
  }
  
  private cleanup(): void {
    const now = Date.now();
    
    // Clean expired entries from all caches
    for (const [key, entry] of this.blockCache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.blockCache.delete(key);
      }
    }
    
    for (const [key, entry] of this.transactionCache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.transactionCache.delete(key);
      }
    }
    
    for (const [key, entry] of this.validatorCache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.validatorCache.delete(key);
      }
    }
    
    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.queryCache.delete(key);
      }
    }
  }
  
  // Cache warming
  warmCache(blocks: Block[], transactions: Transaction[], validators: ValidatorState[]): void {
    // Pre-populate cache with frequently accessed data
    for (const block of blocks) {
      this.cacheBlock(block.hash, block);
    }
    
    for (const tx of transactions) {
      this.cacheTransaction(tx.hash, tx);
    }
    
    for (const validator of validators) {
      this.cacheValidatorState(validator.validatorId, validator);
    }
  }
  
  // Statistics and monitoring
  getStats(): CacheStats {
    const totalEntries = this.blockCache.size + this.transactionCache.size + 
                        this.validatorCache.size + this.queryCache.size;
    
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = totalEntries * 1024; // Assume 1KB per entry on average
    
    return {
      totalEntries,
      memoryUsage,
      hitRate,
      missRate,
      evictions: this.stats.evictions
    };
  }
  
  getCacheDistribution(): { [cacheType: string]: number } {
    return {
      blocks: this.blockCache.size,
      transactions: this.transactionCache.size,
      validators: this.validatorCache.size,
      queries: this.queryCache.size
    };
  }
  
  // Hot data identification
  getHotData(): { blocks: string[]; transactions: string[]; validators: string[] } {
    const hotBlocks = Array.from(this.blockCache.entries())
      .filter(([_, entry]) => entry.accessCount > 10)
      .map(([key, _]) => key);
    
    const hotTransactions = Array.from(this.transactionCache.entries())
      .filter(([_, entry]) => entry.accessCount > 5)
      .map(([key, _]) => key);
    
    const hotValidators = Array.from(this.validatorCache.entries())
      .filter(([_, entry]) => entry.accessCount > 20)
      .map(([key, _]) => key);
    
    return {
      blocks: hotBlocks,
      transactions: hotTransactions,
      validators: hotValidators
    };
  }
  
  // Memory pressure handling
  handleMemoryPressure(): void {
    // Aggressive eviction under memory pressure
    const targetReduction = Math.floor(this.maxEntries * 0.25); // Remove 25%
    
    const allEntries: { key: string; cache: string; accessCount: number; lastAccessed: number }[] = [];
    
    for (const [key, entry] of this.blockCache.entries()) {
      allEntries.push({ 
        key, 
        cache: 'block', 
        accessCount: entry.accessCount, 
        lastAccessed: entry.lastAccessed 
      });
    }
    
    for (const [key, entry] of this.transactionCache.entries()) {
      allEntries.push({ 
        key, 
        cache: 'transaction', 
        accessCount: entry.accessCount, 
        lastAccessed: entry.lastAccessed 
      });
    }
    
    for (const [key, entry] of this.validatorCache.entries()) {
      allEntries.push({ 
        key, 
        cache: 'validator', 
        accessCount: entry.accessCount, 
        lastAccessed: entry.lastAccessed 
      });
    }
    
    for (const [key, entry] of this.queryCache.entries()) {
      allEntries.push({ 
        key, 
        cache: 'query', 
        accessCount: entry.accessCount, 
        lastAccessed: entry.lastAccessed 
      });
    }
    
    // Sort by access count (ascending) and last accessed (ascending)
    allEntries.sort((a, b) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount;
      }
      return a.lastAccessed - b.lastAccessed;
    });
    
    // Evict least used entries
    for (let i = 0; i < Math.min(targetReduction, allEntries.length); i++) {
      const entry = allEntries[i];
      
      switch (entry.cache) {
        case 'block':
          this.blockCache.delete(entry.key);
          break;
        case 'transaction':
          this.transactionCache.delete(entry.key);
          break;
        case 'validator':
          this.validatorCache.delete(entry.key);
          break;
        case 'query':
          this.queryCache.delete(entry.key);
          break;
      }
      
      this.stats.evictions++;
    }
  }
  
  // Clear all caches
  clear(): void {
    this.blockCache.clear();
    this.transactionCache.clear();
    this.validatorCache.clear();
    this.queryCache.clear();
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }
  
  // Shutdown
  shutdown(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}