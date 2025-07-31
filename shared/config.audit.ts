/**
 * Configuration Audit and Snapshot System
 * Historical configuration tracking for governance and forensic analysis
 */

import { db } from '../server/db';
import { configSnapshots } from './schema';
import { eq, desc } from 'drizzle-orm';
import type { EmotionalChainConfig } from './config.schema';

export interface ConfigSnapshot {
  id: number;
  blockHeight: number;
  config: EmotionalChainConfig;
  createdAt: Date;
  changeReason?: string;
  adminId?: string;
}

export interface ConfigChangeEvent {
  timestamp: number;
  blockHeight: number;
  previousConfig: Partial<EmotionalChainConfig>;
  newConfig: Partial<EmotionalChainConfig>;
  changeReason: string;
  adminId?: string;
  ipAddress?: string;
}

export class ConfigurationAudit {
  private changeLog: ConfigChangeEvent[] = [];
  private lastSnapshotBlock: number = 0;
  private readonly SNAPSHOT_INTERVAL = 100; // Every 100 blocks

  /**
   * Store configuration snapshot in database
   */
  async createSnapshot(
    config: EmotionalChainConfig,
    blockHeight: number,
    changeReason?: string,
    adminId?: string
  ): Promise<number> {
    try {
      const [snapshot] = await db
        .insert(configSnapshots)
        .values({
          blockHeight,
          config: JSON.stringify(config),
          changeReason,
          adminId,
          createdAt: new Date(),
        })
        .returning({ id: configSnapshots.id });

      this.lastSnapshotBlock = blockHeight;
      
      console.log(`📸 Configuration snapshot created: ID ${snapshot.id} at block ${blockHeight}`);
      
      return snapshot.id;
    } catch (error) {
      console.error('Failed to create configuration snapshot:', error);
      throw error;
    }
  }

  /**
   * Get configuration at specific block height
   */
  async getConfigAtBlock(blockHeight: number): Promise<EmotionalChainConfig | null> {
    try {
      const [snapshot] = await db
        .select()
        .from(configSnapshots)
        .where(eq(configSnapshots.blockHeight, blockHeight))
        .limit(1);

      if (!snapshot) {
        // Find the most recent snapshot before this block
        const [recentSnapshot] = await db
          .select()
          .from(configSnapshots)
          .orderBy(desc(configSnapshots.blockHeight))
          .limit(1);

        return recentSnapshot ? JSON.parse(recentSnapshot.config as string) : null;
      }

      return JSON.parse(snapshot.config as string);
    } catch (error) {
      console.error(`Failed to get config at block ${blockHeight}:`, error);
      return null;
    }
  }

  /**
   * Get all configuration snapshots within date range
   */
  async getSnapshotHistory(
    startDate?: Date,
    endDate?: Date,
    limit: number = 50
  ): Promise<ConfigSnapshot[]> {
    try {
      let query = db.select().from(configSnapshots);

      if (startDate || endDate) {
        // Add date filtering when implemented in schema
      }

      const snapshots = await query
        .orderBy(desc(configSnapshots.createdAt))
        .limit(limit);

      return snapshots.map(snapshot => ({
        id: snapshot.id,
        blockHeight: snapshot.blockHeight,
        config: JSON.parse(snapshot.config as string),
        createdAt: snapshot.createdAt,
        changeReason: snapshot.changeReason || undefined,
        adminId: snapshot.adminId || undefined,
      }));
    } catch (error) {
      console.error('Failed to get snapshot history:', error);
      return [];
    }
  }

  /**
   * Track configuration change event
   */
  logConfigChange(
    previousConfig: Partial<EmotionalChainConfig>,
    newConfig: Partial<EmotionalChainConfig>,
    blockHeight: number,
    changeReason: string,
    adminId?: string,
    ipAddress?: string
  ): void {
    const changeEvent: ConfigChangeEvent = {
      timestamp: Date.now(),
      blockHeight,
      previousConfig,
      newConfig,
      changeReason,
      adminId,
      ipAddress,
    };

    this.changeLog.push(changeEvent);

    // Keep only last 1000 change events in memory
    if (this.changeLog.length > 1000) {
      this.changeLog = this.changeLog.slice(-1000);
    }

    console.log(`📝 Config change logged: ${changeReason} at block ${blockHeight}`);
  }

  /**
   * Get configuration change differences
   */
  getConfigDiff(
    config1: EmotionalChainConfig,
    config2: EmotionalChainConfig
  ): Array<{ path: string; oldValue: any; newValue: any }> {
    const differences: Array<{ path: string; oldValue: any; newValue: any }> = [];

    const comparePaths = (obj1: any, obj2: any, path: string = '') => {
      for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj1[key] === 'object' && obj1[key] !== null && !Array.isArray(obj1[key])) {
          if (typeof obj2[key] === 'object' && obj2[key] !== null) {
            comparePaths(obj1[key], obj2[key], currentPath);
          } else {
            differences.push({
              path: currentPath,
              oldValue: obj1[key],
              newValue: obj2[key],
            });
          }
        } else if (obj1[key] !== obj2[key]) {
          differences.push({
            path: currentPath,
            oldValue: obj1[key],
            newValue: obj2[key],
          });
        }
      }
    };

    comparePaths(config1, config2);
    
    return differences;
  }

  /**
   * Check if snapshot should be created based on block interval
   */
  shouldCreateSnapshot(currentBlock: number): boolean {
    return currentBlock - this.lastSnapshotBlock >= this.SNAPSHOT_INTERVAL;
  }

  /**
   * Get recent change events
   */
  getRecentChanges(limit: number = 20): ConfigChangeEvent[] {
    return this.changeLog.slice(-limit);
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSnapshots: number;
    totalChanges: number;
    mostFrequentChanges: Array<{ path: string; count: number }>;
    adminActivity: Array<{ adminId: string; changes: number }>;
    timeline: Array<{ date: string; snapshots: number; changes: number }>;
  }> {
    const snapshots = await this.getSnapshotHistory(startDate, endDate);
    const changes = this.changeLog.filter(
      change => change.timestamp >= startDate.getTime() && change.timestamp <= endDate.getTime()
    );

    const pathChanges: Record<string, number> = {};
    const adminActivity: Record<string, number> = {};

    changes.forEach(change => {
      // Count path changes (simplified)
      Object.keys(change.newConfig).forEach(path => {
        pathChanges[path] = (pathChanges[path] || 0) + 1;
      });

      // Count admin activity
      if (change.adminId) {
        adminActivity[change.adminId] = (adminActivity[change.adminId] || 0) + 1;
      }
    });

    const mostFrequentChanges = Object.entries(pathChanges)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const adminActivityArray = Object.entries(adminActivity)
      .map(([adminId, changes]) => ({ adminId, changes }))
      .sort((a, b) => b.changes - a.changes);

    return {
      totalSnapshots: snapshots.length,
      totalChanges: changes.length,
      mostFrequentChanges,
      adminActivity: adminActivityArray,
      timeline: [], // Simplified for now
    };
  }
}

// Export singleton instance
export const configAudit = new ConfigurationAudit();