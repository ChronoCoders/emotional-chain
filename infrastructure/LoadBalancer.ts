import { EventEmitter } from 'eventemitter3';
import { createHash } from 'crypto';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import winston from 'winston';

/**
 * Production load balancer for EmotionalChain network
 * Handles request routing, health-based distribution, and circuit breaker patterns
 */

export interface ValidatorNode {
  id: string;
  endpoint: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  successRate: number;
  currentLoad: number;
  region: string;
  capabilities: string[];
  lastHealthCheck: number;
}

export interface LoadBalancerConfig {
  strategy: 'round_robin' | 'least_connections' | 'weighted' | 'geographic' | 'emotional_score';
  healthCheckInterval: number;
  failureThreshold: number;
  recoveryThreshold: number;
  circuitBreakerTimeout: number;
  maxRetries: number;
  sessionStickiness: boolean;
}

export interface RouteConfig {
  path: string;
  method: string;
  strategy?: string;
  requiresAuth: boolean;
  rateLimit: number;
  timeout: number;
  cacheable: boolean;
}

export class LoadBalancer extends EventEmitter {
  private config: LoadBalancerConfig;
  private logger: winston.Logger;
  private nodes = new Map<string, ValidatorNode>();
  private routeConfigs = new Map<string, RouteConfig>();
  private connectionCounts = new Map<string, number>();
  private circuitBreakers = new Map<string, { state: 'closed' | 'open' | 'half-open'; lastFailure: number; failureCount: number }>();
  private stickySessions = new Map<string, string>(); // sessionId -> nodeId
  
  // Rate limiting
  private rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  private slowDownLimiter = slowDown({
    windowMs: 60 * 1000, // 1 minute
    delayAfter: 50, // allow 50 requests per minute at full speed
    delayMs: 500, // add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // max 20 second delay
  });
  
  constructor(config: LoadBalancerConfig) {
    super();
    this.config = config;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'load-balancer.log' })
      ]
    });
  }
  
  async initialize(): Promise<void> {
    this.logger.info('🔄 Initializing load balancer...');
    
    // Initialize default route configurations
    this.setupDefaultRoutes();
    
    // Start health checking
    this.startHealthChecking();
    
    this.logger.info('✅ Load balancer initialized');
    this.emit('initialized');
  }
  
  private setupDefaultRoutes(): void {
    const routes: RouteConfig[] = [
      {
        path: '/api/consensus',
        method: 'POST',
        strategy: 'emotional_score',
        requiresAuth: true,
        rateLimit: 10,
        timeout: 30000,
        cacheable: false
      },
      {
        path: '/api/validators',
        method: 'GET',
        strategy: 'least_connections',
        requiresAuth: false,
        rateLimit: 50,
        timeout: 5000,
        cacheable: true
      },
      {
        path: '/api/wallets',
        method: 'GET',
        strategy: 'round_robin',
        requiresAuth: false,
        rateLimit: 100,
        timeout: 3000,
        cacheable: true
      },
      {
        path: '/ws',
        method: 'WS',
        strategy: 'least_connections',
        requiresAuth: false,
        rateLimit: 5,
        timeout: 0,
        cacheable: false
      }
    ];
    
    for (const route of routes) {
      this.routeConfigs.set(`${route.method}:${route.path}`, route);
    }
  }
  
  // Node management
  async addNode(node: ValidatorNode): Promise<void> {
    this.logger.info(`➕ Adding validator node: ${node.id} (${node.endpoint})`);
    
    // Initialize connection count
    this.connectionCounts.set(node.id, 0);
    
    // Initialize circuit breaker
    this.circuitBreakers.set(node.id, {
      state: 'closed',
      lastFailure: 0,
      failureCount: 0
    });
    
    // Store node
    this.nodes.set(node.id, node);
    
    this.emit('node-added', node);
  }
  
  async removeNode(nodeId: string): Promise<void> {
    this.logger.info(`➖ Removing validator node: ${nodeId}`);
    
    this.nodes.delete(nodeId);
    this.connectionCounts.delete(nodeId);
    this.circuitBreakers.delete(nodeId);
    
    // Remove sticky sessions for this node
    for (const [sessionId, assignedNodeId] of this.stickySessions.entries()) {
      if (assignedNodeId === nodeId) {
        this.stickySessions.delete(sessionId);
      }
    }
    
    this.emit('node-removed', nodeId);
  }
  
  // Request routing
  async routeRequest(request: {
    path: string;
    method: string;
    clientIp: string;
    sessionId?: string;
    headers: Record<string, string>;
    body?: any;
  }): Promise<{
    nodeId: string;
    endpoint: string;
    timeout: number;
  }> {
    const routeKey = `${request.method}:${request.path}`;
    const routeConfig = this.routeConfigs.get(routeKey) || this.getDefaultRouteConfig();
    
    // Apply rate limiting
    await this.applyRateLimit(request.clientIp, routeConfig.rateLimit);
    
    // Select appropriate node
    const nodeId = await this.selectNode(request, routeConfig);
    const node = this.nodes.get(nodeId);
    
    if (!node) {
      throw new Error('No healthy nodes available');
    }
    
    // Check circuit breaker
    if (!this.isNodeAvailable(nodeId)) {
      throw new Error(`Node ${nodeId} is circuit broken`);
    }
    
    // Update connection count
    this.incrementConnections(nodeId);
    
    this.logger.debug(`🔀 Routing ${request.method} ${request.path} to node ${nodeId}`);
    
    return {
      nodeId,
      endpoint: node.endpoint,
      timeout: routeConfig.timeout
    };
  }
  
  private async selectNode(request: any, routeConfig: RouteConfig): Promise<string> {
    const strategy = routeConfig.strategy || this.config.strategy;
    const availableNodes = this.getHealthyNodes();
    
    if (availableNodes.length === 0) {
      throw new Error('No healthy nodes available');
    }
    
    // Handle sticky sessions
    if (this.config.sessionStickiness && request.sessionId) {
      const stickyNodeId = this.stickySessions.get(request.sessionId);
      if (stickyNodeId && availableNodes.some(n => n.id === stickyNodeId)) {
        return stickyNodeId;
      }
    }
    
    let selectedNode: ValidatorNode;
    
    switch (strategy) {
      case 'round_robin':
        selectedNode = this.selectRoundRobin(availableNodes);
        break;
        
      case 'least_connections':
        selectedNode = this.selectLeastConnections(availableNodes);
        break;
        
      case 'weighted':
        selectedNode = this.selectWeighted(availableNodes);
        break;
        
      case 'geographic':
        selectedNode = this.selectGeographic(availableNodes, request);
        break;
        
      case 'emotional_score':
        selectedNode = this.selectByEmotionalScore(availableNodes);
        break;
        
      default:
        selectedNode = availableNodes[0];
    }
    
    // Set sticky session if enabled
    if (this.config.sessionStickiness && request.sessionId) {
      this.stickySessions.set(request.sessionId, selectedNode.id);
    }
    
    return selectedNode.id;
  }
  
  private selectRoundRobin(nodes: ValidatorNode[]): ValidatorNode {
    // Simple round-robin implementation
    const timestamp = Date.now();
    const index = Math.floor(timestamp / 1000) % nodes.length;
    return nodes[index];
  }
  
  private selectLeastConnections(nodes: ValidatorNode[]): ValidatorNode {
    return nodes.reduce((min, node) => {
      const connections = this.connectionCounts.get(node.id) || 0;
      const minConnections = this.connectionCounts.get(min.id) || 0;
      return connections < minConnections ? node : min;
    });
  }
  
  private selectWeighted(nodes: ValidatorNode[]): ValidatorNode {
    // Weight based on success rate and response time
    const weights = nodes.map(node => {
      const successWeight = node.successRate / 100;
      const responseWeight = Math.max(0.1, 1 - (node.responseTime / 10000)); // 10s max
      const loadWeight = Math.max(0.1, 1 - (node.currentLoad / 100));
      
      return successWeight * responseWeight * loadWeight;
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let weightSum = 0;
    for (let i = 0; i < nodes.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        return nodes[i];
      }
    }
    
    return nodes[0];
  }
  
  private selectGeographic(nodes: ValidatorNode[], request: any): ValidatorNode {
    // Select node in same region if available
    const clientRegion = this.getClientRegion(request.clientIp);
    const regionalNodes = nodes.filter(node => node.region === clientRegion);
    
    if (regionalNodes.length > 0) {
      return this.selectLeastConnections(regionalNodes);
    }
    
    return this.selectLeastConnections(nodes);
  }
  
  private selectByEmotionalScore(nodes: ValidatorNode[]): ValidatorNode {
    // Select node with best emotional validation capabilities
    const emotionalNodes = nodes.filter(node => 
      node.capabilities.includes('emotional_validation')
    );
    
    if (emotionalNodes.length > 0) {
      return this.selectWeighted(emotionalNodes);
    }
    
    return this.selectWeighted(nodes);
  }
  
  private getHealthyNodes(): ValidatorNode[] {
    return Array.from(this.nodes.values()).filter(node => 
      node.health === 'healthy' && this.isNodeAvailable(node.id)
    );
  }
  
  private isNodeAvailable(nodeId: string): boolean {
    const breaker = this.circuitBreakers.get(nodeId);
    if (!breaker) return true;
    
    const now = Date.now();
    
    switch (breaker.state) {
      case 'closed':
        return true;
        
      case 'open':
        // Check if enough time has passed to try half-open
        if (now - breaker.lastFailure > this.config.circuitBreakerTimeout) {
          breaker.state = 'half-open';
          return true;
        }
        return false;
        
      case 'half-open':
        return true;
        
      default:
        return false;
    }
  }
  
  // Health monitoring
  private startHealthChecking(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }
  
  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.nodes.keys()).map(nodeId => 
      this.checkNodeHealth(nodeId)
    );
    
    await Promise.allSettled(promises);
  }
  
  private async checkNodeHealth(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    try {
      const startTime = Date.now();
      
      // Perform health check (simplified - would make actual HTTP request)
      const isHealthy = await this.pingNode(node.endpoint);
      const responseTime = Date.now() - startTime;
      
      // Update node metrics
      node.responseTime = responseTime;
      node.lastHealthCheck = Date.now();
      
      if (isHealthy) {
        this.handleHealthyResponse(nodeId, responseTime);
      } else {
        this.handleUnhealthyResponse(nodeId);
      }
      
    } catch (error) {
      this.handleUnhealthyResponse(nodeId);
      this.logger.warn(`❌ Health check failed for node ${nodeId}:`, (error as Error).message);
    }
  }
  
  private async pingNode(endpoint: string): Promise<boolean> {
    // Simplified health check - in production would make actual HTTP request
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      // 95% success rate for simulation
      return Math.random() > 0.05;
    } catch (error) {
      return false;
    }
  }
  
  private handleHealthyResponse(nodeId: string, responseTime: number): void {
    const node = this.nodes.get(nodeId);
    const breaker = this.circuitBreakers.get(nodeId);
    
    if (!node || !breaker) return;
    
    // Update node health
    if (responseTime < 1000) {
      node.health = 'healthy';
    } else if (responseTime < 5000) {
      node.health = 'degraded';
    } else {
      node.health = 'unhealthy';
    }
    
    // Update success rate (exponential moving average)
    node.successRate = node.successRate * 0.9 + 10; // +10% for success
    node.successRate = Math.min(100, node.successRate);
    
    // Reset circuit breaker
    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failureCount = 0;
    }
  }
  
  private handleUnhealthyResponse(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    const breaker = this.circuitBreakers.get(nodeId);
    
    if (!node || !breaker) return;
    
    // Update node health
    node.health = 'unhealthy';
    
    // Update success rate
    node.successRate = node.successRate * 0.9; // -10% for failure
    
    // Update circuit breaker
    breaker.failureCount++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failureCount >= this.config.failureThreshold) {
      breaker.state = 'open';
      this.logger.warn(`🔴 Circuit breaker opened for node ${nodeId}`);
      this.emit('circuit-breaker-opened', nodeId);
    }
  }
  
  // Connection management
  private incrementConnections(nodeId: string): void {
    const current = this.connectionCounts.get(nodeId) || 0;
    this.connectionCounts.set(nodeId, current + 1);
  }
  
  async releaseConnection(nodeId: string, success: boolean): Promise<void> {
    const current = this.connectionCounts.get(nodeId) || 0;
    this.connectionCounts.set(nodeId, Math.max(0, current - 1));
    
    // Update node metrics based on request success
    const node = this.nodes.get(nodeId);
    if (node) {
      if (success) {
        node.successRate = Math.min(100, node.successRate * 0.99 + 1);
      } else {
        node.successRate = Math.max(0, node.successRate * 0.99 - 1);
        this.handleUnhealthyResponse(nodeId);
      }
    }
  }
  
  // Rate limiting
  private async applyRateLimit(clientIp: string, limit: number): Promise<void> {
    // This would integrate with actual rate limiting middleware
    // For now, just check against a simple counter
    
    const key = `rate_limit:${clientIp}`;
    // In production, this would use Redis or similar
    
    // Simplified rate limiting check
    if (Math.random() < 0.01) { // 1% chance to trigger rate limit for demo
      throw new Error('Rate limit exceeded');
    }
  }
  
  // Utility methods
  private getClientRegion(clientIp: string): string {
    // Simplified region detection - would use GeoIP service
    const hash = createHash('md5').update(clientIp).digest('hex');
    const regions = ['us-east', 'us-west', 'eu-west', 'ap-southeast'];
    return regions[parseInt(hash.substring(0, 2), 16) % regions.length];
  }
  
  private getDefaultRouteConfig(): RouteConfig {
    return {
      path: '/*',
      method: 'GET',
      requiresAuth: false,
      rateLimit: 100,
      timeout: 5000,
      cacheable: false
    };
  }
  
  // Statistics and monitoring
  getLoadBalancerStats(): {
    totalNodes: number;
    healthyNodes: number;
    totalConnections: number;
    averageResponseTime: number;
    successRate: number;
    circuitBreakersOpen: number;
  } {
    const nodes = Array.from(this.nodes.values());
    const healthyNodes = nodes.filter(n => n.health === 'healthy');
    const totalConnections = Array.from(this.connectionCounts.values())
      .reduce((sum, count) => sum + count, 0);
    const averageResponseTime = nodes.length > 0 
      ? nodes.reduce((sum, node) => sum + node.responseTime, 0) / nodes.length 
      : 0;
    const successRate = nodes.length > 0
      ? nodes.reduce((sum, node) => sum + node.successRate, 0) / nodes.length
      : 0;
    const circuitBreakersOpen = Array.from(this.circuitBreakers.values())
      .filter(breaker => breaker.state === 'open').length;
    
    return {
      totalNodes: nodes.length,
      healthyNodes: healthyNodes.length,
      totalConnections,
      averageResponseTime,
      successRate,
      circuitBreakersOpen
    };
  }
  
  getNodeStats(): ValidatorNode[] {
    return Array.from(this.nodes.values()).map(node => ({
      ...node,
      currentLoad: this.connectionCounts.get(node.id) || 0
    }));
  }
  
  // Metrics for Prometheus
  getMetrics(): Record<string, number> {
    const stats = this.getLoadBalancerStats();
    
    return {
      lb_total_nodes: stats.totalNodes,
      lb_healthy_nodes: stats.healthyNodes,
      lb_total_connections: stats.totalConnections,
      lb_average_response_time_ms: stats.averageResponseTime,
      lb_success_rate_percent: stats.successRate,
      lb_circuit_breakers_open: stats.circuitBreakersOpen
    };
  }
  
  // Cleanup
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down load balancer...');
    
    // Clear all timers and connections
    this.nodes.clear();
    this.connectionCounts.clear();
    this.circuitBreakers.clear();
    this.stickySessions.clear();
    
    this.emit('shutdown');
    this.logger.info('✅ Load balancer shutdown complete');
  }
}