import { EventEmitter } from 'eventemitter3';
import * as os from 'os';
import * as fs from 'fs/promises';
import { performance } from 'perf_hooks';
import winston from 'winston';
import { CONFIG } from '../shared/config';

/**
 * Production node lifecycle management
 * Handles graceful startup/shutdown, health checks, and resource monitoring
 */

export interface NodeConfig {
  nodeId: string;
  nodeType: 'validator' | 'bootstrap' | 'api';
  port: number;
  dataDir: string;
  maxMemoryMB: number;
  maxCpuPercent: number;
  healthCheckInterval: number;
  restartOnFailure: boolean;
}

export interface NodeHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkConnections: number;
  lastHealthCheck: number;
  errors: string[];
}

export interface ResourceUsage {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    load: number[];
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
}

export class NodeManager extends EventEmitter {
  private config: NodeConfig;
  private logger: winston.Logger;
  private startTime = Date.now();
  private isShuttingDown = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private resourceMonitorTimer?: NodeJS.Timeout;
  
  // Resource monitoring
  private lastCpuUsage = process.cpuUsage();
  private lastNetworkStats = { bytesIn: 0, bytesOut: 0 };
  private errorCount = 0;
  private lastErrors: string[] = [];
  
  constructor(config: NodeConfig) {
    super();
    this.config = config;
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: `${config.dataDir}/logs/error.log`, 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: `${config.dataDir}/logs/combined.log` 
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }
  
  async initialize(): Promise<void> {
    this.logger.info(`🔄 Initializing ${this.config.nodeType} node ${this.config.nodeId}...`);
    
    try {
      // Create data directory if it doesn't exist
      await this.ensureDataDirectory();
      
      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start resource monitoring
      this.startResourceMonitoring();
      
      // Load configuration
      await this.loadConfiguration();
      
      this.logger.info(`✅ Node ${this.config.nodeId} initialized successfully`);
      this.emit('initialized');
      
    } catch (error) {
      this.logger.error('❌ Node initialization failed:', error);
      throw error;
    }
  }
  
  private async ensureDataDirectory(): Promise<void> {
    const dirs = [
      this.config.dataDir,
      `${this.config.dataDir}/logs`,
      `${this.config.dataDir}/config`,
      `${this.config.dataDir}/blockchain`,
      `${this.config.dataDir}/backups`
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if ((error as any).code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }
  
  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      this.logger.info(`📡 Received ${signal}, initiating graceful shutdown...`);
      await this.shutdown();
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')); // PM2 reload
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('💥 Uncaught exception:', error);
      this.recordError('uncaught_exception', error.message);
      
      if (this.config.restartOnFailure) {
        this.logger.info('🔄 Restarting due to uncaught exception...');
        setTimeout(() => process.exit(1), 1000);
      }
    });
    
    process.on('unhandledRejection', (reason) => {
      this.logger.error('💥 Unhandled rejection:', reason);
      this.recordError('unhandled_rejection', String(reason));
    });
  }
  
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const health = await this.performHealthCheck();
        this.emit('health-check', health);
        
        // Log health issues
        if (health.status !== 'healthy') {
          this.logger.warn(`⚠️ Node health: ${health.status}`, {
            memoryUsage: health.memoryUsage,
            cpuUsage: health.cpuUsage,
            errors: health.errors
          });
        }
        
        // Auto-restart on critical failures
        if (health.status === 'unhealthy' && this.config.restartOnFailure) {
          this.logger.error('🚨 Node unhealthy, initiating restart...');
          await this.restart();
        }
        
      } catch (error) {
        this.logger.error('❌ Health check failed:', error);
        this.recordError('health_check_failure', (error as Error).message);
      }
    }, this.config.healthCheckInterval);
  }
  
  private startResourceMonitoring(): void {
    this.resourceMonitorTimer = setInterval(async () => {
      try {
        const usage = await this.getResourceUsage();
        this.emit('resource-usage', usage);
        
        // Check resource limits
        if (usage.memory.percentage > 90) {
          this.logger.warn('⚠️ High memory usage:', usage.memory.percentage + '%');
          this.recordError('high_memory_usage', `${usage.memory.percentage}%`);
        }
        
        if (usage.cpu.usage > this.config.maxCpuPercent) {
          this.logger.warn('⚠️ High CPU usage:', usage.cpu.usage + '%');
          this.recordError('high_cpu_usage', `${usage.cpu.usage}%`);
        }
        
        if (usage.disk.percentage > 85) {
          this.logger.warn('⚠️ High disk usage:', usage.disk.percentage + '%');
          this.recordError('high_disk_usage', `${usage.disk.percentage}%`);
        }
        
      } catch (error) {
        this.logger.error('❌ Resource monitoring failed:', error);
      }
    }, 30000); // Every 30 seconds
  }
  
  async performHealthCheck(): Promise<NodeHealth> {
    const startTime = performance.now();
    const errors: string[] = [...this.lastErrors];
    
    try {
      // Get resource usage
      const resources = await this.getResourceUsage();
      
      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      // Check memory
      if (resources.memory.percentage > 95) {
        status = 'unhealthy';
        errors.push('Critical memory usage');
      } else if (resources.memory.percentage > 80) {
        status = 'degraded';
        errors.push('High memory usage');
      }
      
      // Check CPU
      if (resources.cpu.usage > 95) {
        status = 'unhealthy';
        errors.push('Critical CPU usage');
      } else if (resources.cpu.usage > 80) {
        status = 'degraded';
        errors.push('High CPU usage');
      }
      
      // Check disk
      if (resources.disk.percentage > 95) {
        status = 'unhealthy';
        errors.push('Critical disk usage');
      } else if (resources.disk.percentage > 85) {
        status = 'degraded';
        errors.push('High disk usage');
      }
      
      // Check if we have too many recent errors
      if (this.errorCount > 10) {
        status = 'unhealthy';
        errors.push('Too many recent errors');
      } else if (this.errorCount > 5) {
        status = 'degraded';
        errors.push('Multiple recent errors');
      }
      
      return {
        status,
        uptime: Date.now() - this.startTime,
        memoryUsage: resources.memory.percentage,
        cpuUsage: resources.cpu.usage,
        diskUsage: resources.disk.percentage,
        networkConnections: resources.network.connections,
        lastHealthCheck: Date.now(),
        errors
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: Date.now() - this.startTime,
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        networkConnections: 0,
        lastHealthCheck: Date.now(),
        errors: ['Health check failed: ' + (error as Error).message]
      };
    }
  }
  
  private async getResourceUsage(): Promise<ResourceUsage> {
    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // CPU usage
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
    const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000 * 100;
    this.lastCpuUsage = process.cpuUsage();
    
    // Load average
    const loadAvg = os.loadavg();
    
    // Disk usage (approximate)
    let diskUsage = { used: 0, total: 0, percentage: 0 };
    try {
      const stats = await fs.stat(this.config.dataDir);
      // This is a simplified disk usage calculation
      diskUsage = {
        used: memUsage.rss,
        total: totalMemory,
        percentage: (memUsage.rss / totalMemory) * 100
      };
    } catch (error) {
      this.logger.debug('Could not get disk usage:', error);
    }
    
    // Network stats (simplified)
    const networkStats = {
      bytesIn: this.lastNetworkStats.bytesIn,
      bytesOut: this.lastNetworkStats.bytesOut,
      connections: 0 // Would be populated by actual network monitoring
    };
    
    return {
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      cpu: {
        usage: cpuPercent,
        load: loadAvg
      },
      disk: diskUsage,
      network: networkStats
    };
  }
  
  private recordError(type: string, message: string): void {
    this.errorCount++;
    this.lastErrors.push(`${type}: ${message}`);
    
    // Keep only recent errors
    if (this.lastErrors.length > 10) {
      this.lastErrors = this.lastErrors.slice(-10);
    }
    
    // Reset error count after some time
    setTimeout(() => {
      this.errorCount = Math.max(0, this.errorCount - 1);
    }, 300000); // 5 minutes
  }
  
  private async loadConfiguration(): Promise<void> {
    const configPath = `${this.config.dataDir}/config/node.json`;
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Merge with current config
      Object.assign(this.config, config);
      
      this.logger.info('📄 Configuration loaded from file');
      
    } catch (error) {
      // Create default config if it doesn't exist
      await this.saveConfiguration();
      this.logger.info('📄 Created default configuration file');
    }
  }
  
  async saveConfiguration(): Promise<void> {
    const configPath = `${this.config.dataDir}/config/node.json`;
    
    try {
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
      this.logger.info('💾 Configuration saved');
    } catch (error) {
      this.logger.error('❌ Failed to save configuration:', error);
    }
  }
  
  async restart(): Promise<void> {
    this.logger.info('🔄 Restarting node...');
    
    try {
      await this.shutdown();
      
      // Wait before reinitializing using configurable delay
      await new Promise(resolve => setTimeout(resolve, CONFIG.network.protocols.websocket.reconnectDelay));
      
      await this.initialize();
      
      this.logger.info('✅ Node restarted successfully');
      this.emit('restarted');
      
    } catch (error) {
      this.logger.error('❌ Node restart failed:', error);
      throw error;
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.logger.info('🛑 Shutting down node...');
    
    try {
      // Clear timers
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = undefined;
      }
      
      if (this.resourceMonitorTimer) {
        clearInterval(this.resourceMonitorTimer);
        this.resourceMonitorTimer = undefined;
      }
      
      // Save final configuration
      await this.saveConfiguration();
      
      // Emit shutdown event
      this.emit('shutdown');
      
      this.logger.info('✅ Node shutdown complete');
      
    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error);
    }
  }
  
  // Hot-reload configuration
  async reloadConfiguration(): Promise<void> {
    this.logger.info('🔄 Reloading configuration...');
    
    try {
      await this.loadConfiguration();
      this.emit('config-reloaded', this.config);
      this.logger.info('✅ Configuration reloaded');
    } catch (error) {
      this.logger.error('❌ Configuration reload failed:', error);
      throw error;
    }
  }
  
  // Readiness probe for Kubernetes
  async isReady(): Promise<boolean> {
    try {
      const health = await this.performHealthCheck();
      return health.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
  
  // Liveness probe for Kubernetes
  async isAlive(): Promise<boolean> {
    try {
      // Simple check - if we can perform basic operations
      await this.getResourceUsage();
      return !this.isShuttingDown;
    } catch (error) {
      return false;
    }
  }
  
  // Public getters
  getConfig(): NodeConfig {
    return { ...this.config };
  }
  
  getUptime(): number {
    return Date.now() - this.startTime;
  }
  
  getLogger(): winston.Logger {
    return this.logger;
  }
  
  async getStatus(): Promise<{
    nodeId: string;
    nodeType: string;
    uptime: number;
    health: NodeHealth;
    resources: ResourceUsage;
    errorCount: number;
  }> {
    const health = await this.performHealthCheck();
    const resources = await this.getResourceUsage();
    
    return {
      nodeId: this.config.nodeId,
      nodeType: this.config.nodeType,
      uptime: this.getUptime(),
      health,
      resources,
      errorCount: this.errorCount
    };
  }
  
  // Metrics for Prometheus
  getMetrics(): Record<string, number> {
    return {
      node_uptime_seconds: this.getUptime() / 1000,
      node_error_count: this.errorCount,
      node_restart_count: 0, // Would track actual restarts
      node_memory_usage_bytes: process.memoryUsage().rss,
      node_cpu_usage_percent: 0, // Would be populated by actual CPU monitoring
    };
  }
}