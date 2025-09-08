/**
 * Real Cryptographic Performance Monitor for EmotionalChain
 * Tracks actual computational work instead of fake multipliers
 */

export interface CryptoMetrics {
  hashOperationsPerSecond: number;
  ecdsaOperationsPerSecond: number;
  nonceAttemptsPerSecond: number;
  zkProofGenerationRate: number;
  merkleTreeOperationsPerSecond: number;
  totalComputationalPower: number; // Combined metric
}

export interface OperationTiming {
  operation: string;
  startTime: number;
  endTime?: number;
  success: boolean;
}

export class CryptoPerformanceMonitor {
  private static instance: CryptoPerformanceMonitor;
  
  // Operation counters
  private hashOperations = 0;
  private ecdsaOperations = 0;
  private nonceAttempts = 0;
  private zkProofGenerations = 0;
  private merkleTreeOperations = 0;
  
  // Timing tracking
  private operationTimings: OperationTiming[] = [];
  private lastResetTime = Date.now();
  private monitoringWindow = 60000; // 60 seconds
  
  // Real-time metrics
  private currentMetrics: CryptoMetrics = {
    hashOperationsPerSecond: 0,
    ecdsaOperationsPerSecond: 0,
    nonceAttemptsPerSecond: 0,
    zkProofGenerationRate: 0,
    merkleTreeOperationsPerSecond: 0,
    totalComputationalPower: 0
  };

  private constructor() {
    // Start performance calculation interval
    setInterval(() => this.calculatePerformanceMetrics(), 5000);
  }

  public static getInstance(): CryptoPerformanceMonitor {
    if (!CryptoPerformanceMonitor.instance) {
      CryptoPerformanceMonitor.instance = new CryptoPerformanceMonitor();
    }
    return CryptoPerformanceMonitor.instance;
  }

  /**
   * Record a hash operation (SHA-256, block hash, transaction hash)
   */
  public recordHashOperation(): void {
    this.hashOperations++;
  }

  /**
   * Record an ECDSA operation (sign or verify)
   */
  public recordECDSAOperation(): void {
    this.ecdsaOperations++;
  }

  /**
   * Record nonce attempts during mining
   */
  public recordNonceAttempt(): void {
    this.nonceAttempts++;
  }

  /**
   * Record ZK proof generation
   */
  public recordZKProofGeneration(): void {
    this.zkProofGenerations++;
  }

  /**
   * Record Merkle tree operation
   */
  public recordMerkleTreeOperation(): void {
    this.merkleTreeOperations++;
  }

  /**
   * Start timing a complex operation
   */
  public startOperation(operation: string): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.operationTimings.push({
      operation,
      startTime: Date.now(),
      success: false
    });
    return operationId;
  }

  /**
   * End timing an operation
   */
  public endOperation(operationId: string, success: boolean = true): void {
    const timing = this.operationTimings.find(t => 
      t.operation.includes(operationId.split('_')[0]) && !t.endTime
    );
    if (timing) {
      timing.endTime = Date.now();
      timing.success = success;
    }
  }

  /**
   * Calculate real-time performance metrics
   */
  private calculatePerformanceMetrics(): void {
    const now = Date.now();
    const timeElapsed = (now - this.lastResetTime) / 1000; // Convert to seconds
    
    if (timeElapsed === 0) return;

    // Calculate operations per second
    this.currentMetrics = {
      hashOperationsPerSecond: this.hashOperations / timeElapsed,
      ecdsaOperationsPerSecond: this.ecdsaOperations / timeElapsed,
      nonceAttemptsPerSecond: this.nonceAttempts / timeElapsed,
      zkProofGenerationRate: this.zkProofGenerations / timeElapsed,
      merkleTreeOperationsPerSecond: this.merkleTreeOperations / timeElapsed,
      totalComputationalPower: this.calculateTotalPower(timeElapsed)
    };

    // Clean up old operation timings (keep only last 5 minutes)
    const cutoffTime = now - (5 * 60 * 1000);
    this.operationTimings = this.operationTimings.filter(t => t.startTime > cutoffTime);

    // Reset counters but keep a rolling window
    if (timeElapsed > 60) { // Reset every minute
      this.hashOperations = Math.floor(this.hashOperations * 0.1); // Keep 10%
      this.ecdsaOperations = Math.floor(this.ecdsaOperations * 0.1);
      this.nonceAttempts = Math.floor(this.nonceAttempts * 0.1);
      this.zkProofGenerations = Math.floor(this.zkProofGenerations * 0.1);
      this.merkleTreeOperations = Math.floor(this.merkleTreeOperations * 0.1);
      this.lastResetTime = now;
    }
  }

  /**
   * Calculate total computational power (weighted combination)
   */
  private calculateTotalPower(timeElapsed: number): number {
    // Weight different operations by computational complexity
    const hashWeight = 1;      // SHA-256 baseline
    const ecdsaWeight = 100;   // ECDSA much more expensive
    const nonceWeight = 1;     // Nonce attempts are hashes
    const zkWeight = 1000;     // ZK proofs very expensive
    const merkleWeight = 5;    // Merkle operations moderate

    const weightedOperations = 
      (this.hashOperations * hashWeight) +
      (this.ecdsaOperations * ecdsaWeight) +
      (this.nonceAttempts * nonceWeight) +
      (this.zkProofGenerations * zkWeight) +
      (this.merkleTreeOperations * merkleWeight);

    return weightedOperations / timeElapsed;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): CryptoMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get human-readable hashrate equivalent
   */
  public getHashrateEquivalent(): string {
    const totalOps = this.currentMetrics.totalComputationalPower;
    
    if (totalOps >= 1000000000) {
      return `${(totalOps / 1000000000).toFixed(2)} GH/s`;
    } else if (totalOps >= 1000000) {
      return `${(totalOps / 1000000).toFixed(2)} MH/s`;
    } else if (totalOps >= 1000) {
      return `${(totalOps / 1000).toFixed(2)} KH/s`;
    } else {
      return `${totalOps.toFixed(2)} H/s`;
    }
  }

  /**
   * Get detailed performance report
   */
  public getPerformanceReport(): any {
    const recentOperations = this.operationTimings.filter(t => 
      t.endTime && (Date.now() - t.startTime) < 60000
    );

    const avgOperationTime = recentOperations.length > 0 ? 
      recentOperations.reduce((sum, op) => sum + (op.endTime! - op.startTime), 0) / recentOperations.length : 0;

    return {
      metrics: this.currentMetrics,
      hashrateEquivalent: this.getHashrateEquivalent(),
      recentOperations: recentOperations.length,
      averageOperationTime: `${avgOperationTime.toFixed(2)}ms`,
      successRate: recentOperations.length > 0 ? 
        (recentOperations.filter(op => op.success).length / recentOperations.length * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  public reset(): void {
    this.hashOperations = 0;
    this.ecdsaOperations = 0;
    this.nonceAttempts = 0;
    this.zkProofGenerations = 0;
    this.merkleTreeOperations = 0;
    this.operationTimings = [];
    this.lastResetTime = Date.now();
  }
}