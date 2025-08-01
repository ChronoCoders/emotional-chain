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
    try {
      const networkStatus = await emotionalChainService.getNetworkStatus();
      const validatorStats = await this.getValidatorParticipationStats();
      const consensusStats = await this.getConsensusRoundStats();
      const blockStats = await this.getBlockchainStats();
      
      const participationRate = validatorStats.activeValidators / validatorStats.totalValidators;
      const consensusSuccessRate = consensusStats.successfulRounds / consensusStats.totalRounds;
      
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
      
      if (blockStats.averageBlockTime > CONFIG.consensus.blockTime * 1.5) {
        status = 'degraded';
        alerts.push({
          level: 'warning',
          message: `Block time exceeded target: ${blockStats.averageBlockTime}s vs ${CONFIG.consensus.blockTime}s`,
          timestamp: Date.now()
        });
      }
      
      return {
        status,
        metrics: {
          blockHeight: blockStats.blockHeight,
          averageBlockTime: blockStats.averageBlockTime,
          consensusRounds: consensusStats.totalRounds,
          successfulRounds: consensusStats.successfulRounds,
          consensusSuccessRate,
          activeValidators: validatorStats.activeValidators,
          totalValidators: validatorStats.totalValidators,
          participationRate,
          lastBlockTimestamp: blockStats.lastBlockTimestamp
        },
        alerts
      };
    } catch (error) {
      return {
        status: 'critical',
        metrics: {
          blockHeight: 0,
          averageBlockTime: 0,
          consensusRounds: 0,
          successfulRounds: 0,
          consensusSuccessRate: 0,
          activeValidators: 0,
          totalValidators: 0,
          participationRate: 0,
          lastBlockTimestamp: 0
        },
        alerts: [{
          level: 'critical',
          message: 'Failed to collect consensus health metrics',
          timestamp: Date.now()
        }]
      };
    }
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
    try {
      // Get validator participation from database
      const validatorQuery = `
        SELECT 
          validator_id,
          COUNT(*) as total_rounds,
          COUNT(CASE WHEN participated = true THEN 1 END) as participated_rounds,
          MAX(last_activity) as last_activity,
          AVG(emotional_score) as avg_emotional_score,
          MAX(created_at) as last_seen
        FROM validator_rounds 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY validator_id
      `;
      
      const validatorResult = await pool.query(validatorQuery);
      const validators = validatorResult.rows;
      
      let activeCount = 0;
      const validatorDetails = validators.map(v => {
        const participationRate = v.participated_rounds / v.total_rounds;
        const lastActivity = new Date(v.last_activity).getTime();
        const timeSinceLastActivity = Date.now() - lastActivity;
        const uptimeHours = Math.max(0, 24 - (timeSinceLastActivity / (1000 * 60 * 60)));
        const uptime = uptimeHours / 24;
        
        let status: 'active' | 'inactive' | 'degraded' = 'inactive';
        if (participationRate > 0.8 && uptime > 0.9) {
          status = 'active';
          activeCount++;
        } else if (participationRate > 0.5 || uptime > 0.5) {
          status = 'degraded';
        }
        
        return {
          validatorId: v.validator_id,
          participationRate,
          lastActivity,
          uptime,
          emotionalScore: parseFloat(v.avg_emotional_score) || 0,
          status
        };
      });
      
      // Mock geographic distribution for demo
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
    } catch (error) {
      return {
        activeValidators: 0,
        totalValidators: 0,
        validatorDetails: [],
        geographicDistribution: []
      };
    }
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
    try {
      const roundsQuery = `
        SELECT 
          round_id,
          start_time,
          end_time,
          participant_count,
          success,
          consensus_score,
          created_at
        FROM consensus_rounds 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 100
      `;
      
      const roundsResult = await pool.query(roundsQuery);
      const rounds = roundsResult.rows;
      
      const successfulRounds = rounds.filter(r => r.success).length;
      const failedRounds = rounds.length - successfulRounds;
      
      const roundTimes = rounds
        .filter(r => r.end_time && r.start_time)
        .map(r => (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / 1000);
      
      const averageRoundTime = roundTimes.length > 0 
        ? roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length 
        : 0;
      
      const recentRounds = rounds.slice(0, 10).map(r => ({
        roundId: r.round_id,
        startTime: new Date(r.start_time).getTime(),
        endTime: new Date(r.end_time).getTime(),
        participants: r.participant_count,
        success: r.success,
        consensusScore: parseFloat(r.consensus_score) || 0
      }));
      
      return {
        totalRounds: rounds.length,
        successfulRounds,
        failedRounds,
        averageRoundTime,
        recentRounds
      };
    } catch (error) {
      return {
        totalRounds: 0,
        successfulRounds: 0,
        failedRounds: 0,
        averageRoundTime: 0,
        recentRounds: []
      };
    }
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
    try {
      const networkStatus = await emotionalChainService.getNetworkStatus();
      
      const blockQuery = `
        SELECT 
          height,
          timestamp,
          transaction_count,
          LAG(timestamp) OVER (ORDER BY height) as prev_timestamp
        FROM blocks 
        WHERE height > (SELECT MAX(height) - 100 FROM blocks)
        ORDER BY height DESC
      `;
      
      const blockResult = await pool.query(blockQuery);
      const blocks = blockResult.rows;
      
      const blockTimes = blocks
        .filter(b => b.prev_timestamp)
        .map(b => (new Date(b.timestamp).getTime() - new Date(b.prev_timestamp).getTime()) / 1000);
      
      const averageBlockTime = blockTimes.length > 0
        ? blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length
        : CONFIG.consensus.blockTime;
      
      const recentTransactions = blocks
        .slice(0, 10)
        .reduce((sum, b) => sum + (b.transaction_count || 0), 0);
      
      const transactionThroughput = recentTransactions / Math.max(1, blocks.slice(0, 10).length);
      
      return {
        blockHeight: networkStatus.blockHeight,
        averageBlockTime,
        lastBlockTimestamp: blocks.length > 0 ? new Date(blocks[0].timestamp).getTime() : Date.now(),
        transactionThroughput,
        networkHashrate: networkStatus.validators.length * 1000 // Mock hashrate
      };
    } catch (error) {
      return {
        blockHeight: 0,
        averageBlockTime: CONFIG.consensus.blockTime,
        lastBlockTimestamp: Date.now(),
        transactionThroughput: 0,
        networkHashrate: 0
      };
    }
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