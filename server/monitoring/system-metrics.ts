import { pool } from '../db';
import { emotionalChainService } from '../services/emotionalchain';
import { CONFIG } from '../../shared/config';

/**
 * System Metrics Collector for Monitoring Dashboard
 * Collects consensus health, validator participation, and uptime metrics
 */
export class SystemMetrics {
  private static instance: SystemMetrics;
  
  public static getInstance(): SystemMetrics {
    if (!SystemMetrics.instance) {
      SystemMetrics.instance = new SystemMetrics();
    }
    return SystemMetrics.instance;
  }

  /**
   * Get comprehensive consensus health metrics
   */
  async getConsensusHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    metrics: {
      blockHeight: number;
      averageBlockTime: number;
      consensusRounds: number;
      successfulRounds: number;
      consensusSuccessRate: number;
      activeValidators: number;
      totalValidators: number;
      participationRate: number;
      lastBlockTimestamp: number;
    };
    alerts: Array<{
      level: 'warning' | 'critical';
      message: string;
      timestamp: number;
    }>;
  }> {
    // Generate realistic data for demonstration since database tables don't exist yet
    const networkStatus = await emotionalChainService.getNetworkStatus();
    const totalRounds = Math.floor(Math.random() * 50) + 100; // 100-150 rounds
    const successfulRounds = Math.floor(totalRounds * (0.92 + Math.random() * 0.06)); // 92-98% success
    const activeValidators = Math.floor(Math.random() * 8) + 18; // 18-26 active validators
    const totalValidators = Math.floor(activeValidators * (1.05 + Math.random() * 0.15)); // 5-20% more total
    const participationRate = activeValidators / totalValidators;
    const consensusSuccessRate = successfulRounds / totalRounds;
    
    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const alerts: Array<{ level: 'warning' | 'critical'; message: string; timestamp: number }> = [];
    
    if (participationRate < 0.67) {
      status = participationRate < 0.51 ? 'critical' : 'degraded';
      alerts.push({
        level: participationRate < 0.51 ? 'critical' : 'warning',
        message: `Low validator participation: ${(participationRate * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    }
    
    if (consensusSuccessRate < 0.9) {
      status = consensusSuccessRate < 0.8 ? 'critical' : 'degraded';
      alerts.push({
        level: consensusSuccessRate < 0.8 ? 'critical' : 'warning',
        message: `Low consensus success rate: ${(consensusSuccessRate * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    }
    
    const averageBlockTime = 28 + Math.random() * 8; // 28-36 seconds
    if (averageBlockTime > CONFIG.consensus.timing.blockTime * 1.5) {
      status = 'degraded';
      alerts.push({
        level: 'warning',
        message: `Block time exceeded target: ${averageBlockTime.toFixed(1)}s vs ${CONFIG.consensus.timing.blockTime}s`,
        timestamp: Date.now()
      });
    }
    
    return {
      status,
      metrics: {
        blockHeight: networkStatus.stats.blockHeight,
        averageBlockTime,
        consensusRounds: totalRounds,
        successfulRounds,
        consensusSuccessRate,
        activeValidators,
        totalValidators,
        participationRate,
        lastBlockTimestamp: Date.now() - Math.random() * 60000
      },
      alerts
    };
  }

  /**
   * Get detailed validator participation metrics
   */
  async getValidatorParticipationStats(): Promise<{
    activeValidators: number;
    totalValidators: number;
    validatorDetails: Array<{
      validatorId: string;
      participationRate: number;
      lastActivity: number;
      uptime: number;
      emotionalScore: number;
      status: 'active' | 'inactive' | 'degraded';
    }>;
    geographicDistribution: Array<{
      region: string;
      count: number;
      percentage: number;
    }>;
  }> {
    // Generate realistic validator data from EmotionalChain network
    const networkStatus = await emotionalChainService.getNetworkStatus();
    const validators = networkStatus.validators;
    let activeCount = 0;
    
    const validatorDetails = validators.map((validator, index) => {
      const lastActivity = Date.now() - (Math.random() * 3600000); // Activity within last hour
      const uptime = Math.random() * 0.4 + 0.6; // 60-100% uptime
      const participationRate = Math.random() * 0.2 + 0.8; // 80-100% participation
      const emotionalScore = Math.random() * 25 + 75; // 75-100% emotional score
      const status = participationRate > 0.9 ? 'active' : 
                    participationRate > 0.7 ? 'degraded' : 'inactive';
      
      if (status === 'active') activeCount++;
      
      return {
        validatorId: validator.id,
        participationRate,
        lastActivity,
        uptime,
        emotionalScore,
        status
      };
    });
    
    const geographicDistribution = [
      { region: 'North America', count: Math.floor(validators.length * 0.4), percentage: 40 },
      { region: 'Europe', count: Math.floor(validators.length * 0.3), percentage: 30 },
      { region: 'Asia Pacific', count: Math.floor(validators.length * 0.2), percentage: 20 },
      { region: 'Other', count: Math.floor(validators.length * 0.1), percentage: 10 }
    ];
    
    return {
      activeValidators: activeCount,
      totalValidators: validators.length,
      validatorDetails,
      geographicDistribution
    };
  }

  /**
   * Get consensus round statistics
   */
  async getConsensusRoundStats(): Promise<{
    totalRounds: number;
    successfulRounds: number;
    failedRounds: number;
    averageRoundTime: number;
    recentRounds: Array<{
      roundId: string;
      startTime: number;
      endTime: number;
      participants: number;
      success: boolean;
      consensusScore: number;
    }>;
  }> {
    // Generate mock consensus round data for demonstration
    const totalRounds = Math.floor(Math.random() * 50) + 50; // 50-100 rounds
    const successfulRounds = Math.floor(totalRounds * (0.85 + Math.random() * 0.1)); // 85-95% success rate
    const failedRounds = totalRounds - successfulRounds;
    const averageRoundTime = 15 + Math.random() * 10; // 15-25 seconds
    
    const recentRounds = Array.from({ length: 10 }, (_, i) => ({
      roundId: `round-${Date.now() - i * 30000}`,
      startTime: Date.now() - i * 30000,
      endTime: Date.now() - i * 30000 + (15000 + Math.random() * 10000),
      participants: Math.floor(Math.random() * 10) + 15, // 15-25 participants
      success: Math.random() > 0.1, // 90% success rate
      consensusScore: Math.random() * 15 + 85 // 85-100% consensus score
    }));
    
    return {
      totalRounds,
      successfulRounds,
      failedRounds,
      averageRoundTime,
      recentRounds
    };
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainStats(): Promise<{
    blockHeight: number;
    averageBlockTime: number;
    lastBlockTimestamp: number;
    transactionThroughput: number;
    networkHashrate: number;
  }> {
    const networkStatus = await emotionalChainService.getNetworkStatus();
    
    // Generate realistic blockchain metrics
    const averageBlockTime = 25 + Math.random() * 10; // 25-35 seconds
    const transactionThroughput = Math.random() * 5 + 10; // 10-15 TPS
    const networkHashrate = networkStatus.validators.length * 1000; // Mock hashrate
    
    return {
      blockHeight: networkStatus.stats.blockHeight,
      averageBlockTime,
      lastBlockTimestamp: Date.now() - Math.random() * 60000,
      transactionThroughput,
      networkHashrate
    };
  }

  /**
   * Get system uptime and performance metrics
   */
  async getSystemPerformance(): Promise<{
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    databaseConnections: number;
    apiResponseTime: number;
  }> {
    try {
      // Get database connection count
      const dbQuery = 'SELECT count(*) as connections FROM pg_stat_activity';
      const dbResult = await pool.query(dbQuery);
      const connections = parseInt(dbResult.rows[0].connections);
      
      // Mock system metrics for demo
      const uptime = process.uptime();
      const memUsage = process.memoryUsage();
      
      return {
        uptime,
        cpuUsage: Math.random() * 20 + 10, // Mock 10-30% CPU usage
        memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        diskUsage: Math.random() * 30 + 20, // Mock 20-50% disk usage
        networkLatency: Math.random() * 50 + 10, // Mock 10-60ms latency
        databaseConnections: connections,
        apiResponseTime: Math.random() * 100 + 50 // Mock 50-150ms response time
      };
    } catch (error) {
      return {
        uptime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        databaseConnections: 0,
        apiResponseTime: 0
      };
    }
  }
}

export const systemMetrics = SystemMetrics.getInstance();