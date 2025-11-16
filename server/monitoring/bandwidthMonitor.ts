/**
 * Bandwidth Monitor
 * 
 * Tracks and measures validator bandwidth usage and performance.
 * Used for tier assignment and automatic promotion/demotion.
 */

import { ValidatorTier } from '@shared/consensus/hierarchicalValidators';

export interface BandwidthMeasurement {
  validatorId: string;
  timestamp: Date;
  downloadSpeedKBps: number;
  uploadSpeedKBps: number;
  latencyMs: number;
  packetLoss: number; // percentage
}

export interface UptimeRecord {
  validatorId: string;
  startTime: Date;
  endTime: Date | null;
  status: 'online' | 'offline';
}

export interface ValidatorPerformance {
  validatorId: string;
  tier: ValidatorTier;
  avgBandwidthKBps: number;
  uptimePercentage: number;
  lastMeasurement: Date;
  consecutiveFailures: number;
  meetsRequirements: boolean;
}

export class BandwidthMonitor {
  private measurements: Map<string, BandwidthMeasurement[]> = new Map();
  private uptimeRecords: Map<string, UptimeRecord[]> = new Map();
  private performanceCache: Map<string, ValidatorPerformance> = new Map();
  
  /**
   * Record a bandwidth measurement
   */
  recordMeasurement(measurement: BandwidthMeasurement): void {
    const validatorMeasurements = this.measurements.get(measurement.validatorId) || [];
    validatorMeasurements.push(measurement);
    
    // Keep only last 100 measurements per validator
    if (validatorMeasurements.length > 100) {
      validatorMeasurements.shift();
    }
    
    this.measurements.set(measurement.validatorId, validatorMeasurements);
  }
  
  /**
   * Test validator bandwidth
   * In production, this would actually perform network tests
   */
  async testBandwidth(validatorId: string): Promise<BandwidthMeasurement> {
    // Simulate bandwidth test
    // In production, this would use actual network testing tools
    const measurement: BandwidthMeasurement = {
      validatorId,
      timestamp: new Date(),
      downloadSpeedKBps: Math.random() * 2000, // 0-2000 KB/s
      uploadSpeedKBps: Math.random() * 1000,   // 0-1000 KB/s
      latencyMs: Math.random() * 100,          // 0-100 ms
      packetLoss: Math.random() * 2,           // 0-2%
    };
    
    this.recordMeasurement(measurement);
    return measurement;
  }
  
  /**
   * Get average bandwidth for a validator
   */
  getAverageBandwidth(validatorId: string, periodMinutes: number = 60): number {
    const measurements = this.measurements.get(validatorId) || [];
    if (measurements.length === 0) return 0;
    
    const cutoffTime = new Date(Date.now() - periodMinutes * 60 * 1000);
    const recentMeasurements = measurements.filter(m => m.timestamp >= cutoffTime);
    
    if (recentMeasurements.length === 0) return 0;
    
    const avgDownload = recentMeasurements.reduce((sum, m) => sum + m.downloadSpeedKBps, 0) / recentMeasurements.length;
    const avgUpload = recentMeasurements.reduce((sum, m) => sum + m.uploadSpeedKBps, 0) / recentMeasurements.length;
    
    // Return the minimum of upload/download as effective bandwidth
    return Math.min(avgDownload, avgUpload);
  }
  
  /**
   * Record uptime event
   */
  recordUptimeEvent(validatorId: string, status: 'online' | 'offline'): void {
    const records = this.uptimeRecords.get(validatorId) || [];
    
    // Close previous record if it exists and is still open
    if (records.length > 0 && records[records.length - 1].endTime === null) {
      records[records.length - 1].endTime = new Date();
    }
    
    // Add new record
    records.push({
      validatorId,
      startTime: new Date(),
      endTime: null,
      status,
    });
    
    this.uptimeRecords.set(validatorId, records);
  }
  
  /**
   * Calculate uptime percentage
   */
  calculateUptime(validatorId: string, periodHours: number = 24): number {
    const records = this.uptimeRecords.get(validatorId) || [];
    if (records.length === 0) return 100; // Assume 100% if no records
    
    const cutoffTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const now = new Date();
    
    let totalTime = 0;
    let onlineTime = 0;
    
    for (const record of records) {
      const startTime = record.startTime < cutoffTime ? cutoffTime : record.startTime;
      const endTime = record.endTime ? (record.endTime > now ? now : record.endTime) : now;
      
      if (startTime < endTime) {
        const duration = endTime.getTime() - startTime.getTime();
        totalTime += duration;
        
        if (record.status === 'online') {
          onlineTime += duration;
        }
      }
    }
    
    return totalTime > 0 ? (onlineTime / totalTime) * 100 : 100;
  }
  
  /**
   * Get validator performance metrics
   */
  async getPerformance(validatorId: string, tier: ValidatorTier): Promise<ValidatorPerformance> {
    const avgBandwidth = this.getAverageBandwidth(validatorId);
    const uptime = this.calculateUptime(validatorId);
    const measurements = this.measurements.get(validatorId) || [];
    const lastMeasurement = measurements.length > 0 ? measurements[measurements.length - 1].timestamp : new Date();
    
    // Check if validator meets tier requirements
    const meetsRequirements = this.checkTierRequirements(tier, avgBandwidth, uptime);
    
    const performance: ValidatorPerformance = {
      validatorId,
      tier,
      avgBandwidthKBps: avgBandwidth,
      uptimePercentage: uptime,
      lastMeasurement,
      consecutiveFailures: 0, // Would be tracked separately in production
      meetsRequirements,
    };
    
    this.performanceCache.set(validatorId, performance);
    return performance;
  }
  
  /**
   * Check if validator meets tier requirements
   */
  private checkTierRequirements(tier: ValidatorTier, bandwidth: number, uptime: number): boolean {
    const requirements = {
      [ValidatorTier.PRIMARY]: { minBandwidth: 1000, minUptime: 99.9 },
      [ValidatorTier.SECONDARY]: { minBandwidth: 100, minUptime: 95.0 },
      [ValidatorTier.LIGHT]: { minBandwidth: 10, minUptime: 80.0 },
    };
    
    const req = requirements[tier];
    return bandwidth >= req.minBandwidth && uptime >= req.minUptime;
  }
  
  /**
   * Get all validator performance metrics
   */
  async getAllPerformance(): Promise<ValidatorPerformance[]> {
    return Array.from(this.performanceCache.values());
  }
  
  /**
   * Get bandwidth statistics summary
   */
  getBandwidthStatistics(): {
    totalValidators: number;
    avgBandwidth: number;
    minBandwidth: number;
    maxBandwidth: number;
    avgUptime: number;
  } {
    const performances = Array.from(this.performanceCache.values());
    
    if (performances.length === 0) {
      return {
        totalValidators: 0,
        avgBandwidth: 0,
        minBandwidth: 0,
        maxBandwidth: 0,
        avgUptime: 0,
      };
    }
    
    const bandwidths = performances.map(p => p.avgBandwidthKBps);
    const uptimes = performances.map(p => p.uptimePercentage);
    
    return {
      totalValidators: performances.length,
      avgBandwidth: bandwidths.reduce((a, b) => a + b, 0) / bandwidths.length,
      minBandwidth: Math.min(...bandwidths),
      maxBandwidth: Math.max(...bandwidths),
      avgUptime: uptimes.reduce((a, b) => a + b, 0) / uptimes.length,
    };
  }
  
  /**
   * Clear old measurements and records
   */
  cleanup(daysToKeep: number = 7): void {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    // Clean measurements
    for (const [validatorId, measurements] of this.measurements.entries()) {
      const filtered = measurements.filter(m => m.timestamp >= cutoffTime);
      if (filtered.length > 0) {
        this.measurements.set(validatorId, filtered);
      } else {
        this.measurements.delete(validatorId);
      }
    }
    
    // Clean uptime records
    for (const [validatorId, records] of this.uptimeRecords.entries()) {
      const filtered = records.filter(r => r.startTime >= cutoffTime);
      if (filtered.length > 0) {
        this.uptimeRecords.set(validatorId, filtered);
      } else {
        this.uptimeRecords.delete(validatorId);
      }
    }
  }
}

// Singleton instance
export const bandwidthMonitor = new BandwidthMonitor();
