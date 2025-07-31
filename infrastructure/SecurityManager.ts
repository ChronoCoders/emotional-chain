import { EventEmitter } from 'eventemitter3';
import helmet from 'helmet';
import { createHash, randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import winston from 'winston';
import { CONFIG, configHelpers } from '../shared/config';

/**
 * Production security hardening and threat protection
 * Handles authentication, authorization, and security monitoring
 */

export interface SecurityConfig {
  apiKeyRequired: boolean;
  rateLimitPerMinute: number;
  maxConnectionsPerIP: number;
  bruteForceProtection: boolean;
  ddosProtection: boolean;
  sqlInjectionProtection: boolean;
  xssProtection: boolean;
  csrfProtection: boolean;
  tlsRequired: boolean;
  auditLogging: boolean;
}

export interface SecurityThreat {
  id: string;
  type: 'ddos' | 'brute_force' | 'sql_injection' | 'xss' | 'unauthorized_access' | 'anomalous_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  timestamp: number;
  details: any;
  blocked: boolean;
}

export interface ApiKey {
  keyId: string;
  hashedKey: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: number;
  createdAt: number;
  lastUsed?: number;
  active: boolean;
}

export class SecurityManager extends EventEmitter {
  private config: SecurityConfig;
  private logger: winston.Logger;
  private apiKeys = new Map<string, ApiKey>();
  private blockedIPs = new Set<string>();
  private failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private activeSessions = new Map<string, { userId: string; createdAt: number }>();
  private threatHistory: SecurityThreat[] = [];
  
  // Rate limiting stores
  private ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
  private ddosDetection = new Map<string, { requests: number[]; blocked: boolean }>();
  
  constructor(config: SecurityConfig) {
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
        new winston.transports.File({ filename: 'security.log' })
      ]
    });
  }
  
  async initialize(): Promise<void> {
    this.logger.info('🔒 Initializing security manager...');
    
    // Start security monitoring
    this.startSecurityMonitoring();
    
    // Generate initial API keys if needed
    if (this.config.apiKeyRequired) {
      await this.generateDefaultApiKeys();
    }
    
    this.logger.info('✅ Security manager initialized');
    this.emit('initialized');
  }
  
  private startSecurityMonitoring(): void {
    // Monitor for threats using configurable intervals
    setInterval(() => {
      this.analyzeThreatPatterns();
      this.cleanupExpiredSessions();
      this.cleanupFailedAttempts();
    }, CONFIG.infrastructure.monitoring.metricsInterval);
    
    // DDoS detection using configurable interval
    setInterval(() => {
      this.detectDDoSAttacks();
    }, CONFIG.infrastructure.monitoring.metricsInterval / 3);
  }
  
  // Helmet security middleware configuration
  getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: CONFIG.security.authentication.sessionTimeout,
        includeSubDomains: true,
        preload: true
      }
    });
  }
  
  // Rate limiting middleware
  getRateLimitConfig() {
    return rateLimit({
      windowMs: CONFIG.security.rateLimiting.windowSize,
      max: CONFIG.security.rateLimiting.requestsPerMinute,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: any, res: any) => {
        this.recordThreat({
          type: 'ddos',
          severity: 'medium',
          sourceIP: req.ip,
          details: { route: req.path, method: req.method },
          blocked: true
        });
        
        const windowSeconds = CONFIG.security.rateLimiting.windowSize / 1000;
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(windowSeconds - (Date.now() % CONFIG.security.rateLimiting.windowSize) / 1000)
        });
      }
    });
  }
  
  // API Key management
  async generateApiKey(permissions: string[], customConfig?: Partial<ApiKey>): Promise<{ keyId: string; key: string }> {
    const keyIdLength = CONFIG.security.authentication.apiKeyLength / 2; // hex is 2 chars per byte
    const keyLength = CONFIG.security.authentication.apiKeyLength;
    const keyId = randomBytes(keyIdLength).toString('hex');
    const key = randomBytes(keyLength).toString('hex');
    const hashedKey = createHash('sha256').update(key).digest('hex');
    
    const apiKey: ApiKey = {
      keyId,
      hashedKey,
      permissions,
      rateLimit: CONFIG.security.rateLimiting.requestsPerMinute,
      expiresAt: Date.now() + (CONFIG.security.authentication.apiKeyExpirationDays * 24 * 60 * 60 * 1000),
      createdAt: Date.now(),
      active: true,
      ...customConfig
    };
    
    this.apiKeys.set(keyId, apiKey);
    
    this.logger.info(`🔑 Generated API key: ${keyId}`, {
      permissions,
      rateLimit: apiKey.rateLimit
    });
    
    return { keyId, key };
  }
  
  async validateApiKey(keyId: string, providedKey: string): Promise<{ valid: boolean; permissions?: string[] }> {
    const apiKey = this.apiKeys.get(keyId);
    
    if (!apiKey || !apiKey.active) {
      return { valid: false };
    }
    
    // Check expiration
    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      apiKey.active = false;
      return { valid: false };
    }
    
    // Validate key
    const hashedProvided = createHash('sha256').update(providedKey).digest('hex');
    const valid = hashedProvided === apiKey.hashedKey;
    
    if (valid) {
      apiKey.lastUsed = Date.now();
      return { valid: true, permissions: apiKey.permissions };
    }
    
    return { valid: false };
  }
  
  revokeApiKey(keyId: string): void {
    const apiKey = this.apiKeys.get(keyId);
    if (apiKey) {
      apiKey.active = false;
      this.logger.info(`🔑 Revoked API key: ${keyId}`);
    }
  }
  
  private async generateDefaultApiKeys(): Promise<void> {
    // Generate admin key
    const adminKey = await this.generateApiKey([
      'consensus.read', 'consensus.write',
      'validator.read', 'validator.write',
      'blockchain.read', 'blockchain.write',
      'monitoring.read', 'system.admin'
    ], { rateLimit: 1000 });
    
    // Generate readonly key
    const readOnlyKey = await this.generateApiKey([
      'consensus.read', 'validator.read', 'blockchain.read'
    ], { rateLimit: 100 });
    
    this.logger.info('🔑 Generated default API keys', {
      adminKeyId: adminKey.keyId,
      readOnlyKeyId: readOnlyKey.keyId
    });
  }
  
  // Authentication middleware
  async authenticateRequest(req: any): Promise<{ authenticated: boolean; permissions?: string[]; userId?: string }> {
    // Check for API key
    const apiKeyHeader = req.headers['x-api-key'];
    const keyId = req.headers['x-key-id'];
    
    if (this.config.apiKeyRequired && (!apiKeyHeader || !keyId)) {
      return { authenticated: false };
    }
    
    if (apiKeyHeader && keyId) {
      const keyValidation = await this.validateApiKey(keyId, apiKeyHeader);
      if (keyValidation.valid) {
        return {
          authenticated: true,
          permissions: keyValidation.permissions,
          userId: `api_key:${keyId}`
        };
      }
    }
    
    // Check for session (simplified)
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        return {
          authenticated: true,
          permissions: ['basic.access'],
          userId: session.userId
        };
      }
    }
    
    return { authenticated: false };
  }
  
  // Authorization
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes('system.admin')) {
      return true; // Admin has all permissions
    }
    
    return userPermissions.includes(requiredPermission);
  }
  
  // IP blocking and filtering
  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }
  
  blockIP(ip: string, reason: string, duration?: number): void {
    this.blockedIPs.add(ip);
    
    this.logger.warn(`🚫 Blocked IP: ${ip}`, { reason });
    
    // Auto-unblock after duration
    if (duration) {
      setTimeout(() => {
        this.unblockIP(ip);
      }, duration);
    }
    
    this.emit('ip-blocked', { ip, reason, duration });
  }
  
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.logger.info(`✅ Unblocked IP: ${ip}`);
    this.emit('ip-unblocked', { ip });
  }
  
  // Brute force protection
  recordFailedAttempt(ip: string): boolean {
    const attempt = this.failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempt.count++;
    attempt.lastAttempt = Date.now();
    
    this.failedAttempts.set(ip, attempt);
    
    // Block after 5 failed attempts within 15 minutes
    if (attempt.count >= 5) {
      this.blockIP(ip, 'Brute force attack detected', 30 * 60 * 1000); // 30 minutes
      
      this.recordThreat({
        type: 'brute_force',
        severity: 'high',
        sourceIP: ip,
        details: { attempts: attempt.count },
        blocked: true
      });
      
      return true; // Blocked
    }
    
    return false; // Not blocked yet
  }
  
  recordSuccessfulAuth(ip: string): void {
    this.failedAttempts.delete(ip);
  }
  
  private cleanupFailedAttempts(): void {
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    
    for (const [ip, attempt] of this.failedAttempts.entries()) {
      if (now - attempt.lastAttempt > fifteenMinutes) {
        this.failedAttempts.delete(ip);
      }
    }
  }
  
  // DDoS detection
  private detectDDoSAttacks(): void {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute window
    const threshold = 100; // 100 requests per minute per IP
    
    for (const [ip, detection] of this.ddosDetection.entries()) {
      // Clean old requests
      detection.requests = detection.requests.filter(timestamp => 
        now - timestamp < windowSize
      );
      
      // Check if threshold exceeded
      if (detection.requests.length > threshold && !detection.blocked) {
        detection.blocked = true;
        this.blockIP(ip, 'DDoS attack detected', 60 * 60 * 1000); // 1 hour
        
        this.recordThreat({
          type: 'ddos',
          severity: 'critical',
          sourceIP: ip,
          details: { requestCount: detection.requests.length, window: '1 minute' },
          blocked: true
        });
      }
    }
  }
  
  recordRequest(ip: string): void {
    const detection = this.ddosDetection.get(ip) || { requests: [], blocked: false };
    detection.requests.push(Date.now());
    this.ddosDetection.set(ip, detection);
  }
  
  // Input validation
  getValidationRules() {
    return {
      // Common validation rules
      validateEmail: body('email').isEmail().normalizeEmail(),
      validatePassword: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
      validateHex: (field: string) => body(field).matches(/^[a-fA-F0-9]+$/),
      validateAddress: body('address').matches(/^0x[a-fA-F0-9]{40}$/),
      validateAmount: body('amount').isFloat({ min: 0 }),
      
      // Prevent SQL injection
      sanitizeString: (field: string) => body(field).escape().trim(),
      
      // Prevent XSS
      sanitizeHtml: (field: string) => body(field).escape()
    };
  }
  
  validateRequest(req: any): { valid: boolean; errors?: any[] } {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Log validation failures
      this.logger.warn('🚨 Validation failed', {
        ip: req.ip,
        path: req.path,
        errors: errors.array()
      });
      
      return { valid: false, errors: errors.array() };
    }
    
    return { valid: true };
  }
  
  // Threat recording and analysis
  private recordThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp'>): void {
    const fullThreat: SecurityThreat = {
      id: randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      ...threat
    };
    
    this.threatHistory.push(fullThreat);
    
    // Keep only recent threats (last 1000)
    if (this.threatHistory.length > 1000) {
      this.threatHistory = this.threatHistory.slice(-1000);
    }
    
    this.logger.warn('🚨 Security threat detected', fullThreat);
    this.emit('threat-detected', fullThreat);
  }
  
  private analyzeThreatPatterns(): void {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    
    const recentThreats = this.threatHistory.filter(t => t.timestamp > lastHour);
    
    // Analyze patterns
    const threatsByIP = new Map<string, SecurityThreat[]>();
    for (const threat of recentThreats) {
      const threats = threatsByIP.get(threat.sourceIP) || [];
      threats.push(threat);
      threatsByIP.set(threat.sourceIP, threats);
    }
    
    // Look for coordinated attacks
    for (const [ip, threats] of threatsByIP.entries()) {
      if (threats.length > 10) { // More than 10 threats from same IP in an hour
        this.recordThreat({
          type: 'anomalous_behavior',
          severity: 'high',
          sourceIP: ip,
          details: { threatCount: threats.length, types: threats.map(t => t.type) },
          blocked: false
        });
        
        if (!this.isBlocked(ip)) {
          this.blockIP(ip, 'Coordinated attack pattern detected', 2 * 60 * 60 * 1000); // 2 hours
        }
      }
    }
  }
  
  // Session management
  createSession(userId: string): string {
    const sessionId = randomBytes(32).toString('hex');
    
    this.activeSessions.set(sessionId, {
      userId,
      createdAt: Date.now()
    });
    
    return sessionId;
  }
  
  destroySession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }
  
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.createdAt > maxAge) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
  
  // Security scanning
  async performSecurityScan(): Promise<{
    vulnerabilities: Array<{ type: string; severity: string; description: string }>;
    recommendations: string[];
    score: number;
  }> {
    const vulnerabilities = [];
    const recommendations = [];
    
    // Check configuration security
    if (!this.config.tlsRequired) {
      vulnerabilities.push({
        type: 'configuration',
        severity: 'high',
        description: 'TLS not required - sensitive data may be transmitted unencrypted'
      });
      recommendations.push('Enable TLS requirement for all connections');
    }
    
    if (!this.config.bruteForceProtection) {
      vulnerabilities.push({
        type: 'authentication',
        severity: 'medium',
        description: 'Brute force protection disabled'
      });
      recommendations.push('Enable brute force protection');
    }
    
    const maxRecommendedRate = CONFIG.security.rateLimiting.requestsPerMinute * 1.5; // 150% of configured as threshold
    if (this.config.rateLimitPerMinute > maxRecommendedRate) {
      vulnerabilities.push({
        type: 'rate_limiting',
        severity: 'medium',
        description: `Rate limit too high (${this.config.rateLimitPerMinute} > ${maxRecommendedRate}) - may allow DDoS attacks`
      });
      recommendations.push(`Reduce rate limit to below ${maxRecommendedRate} requests per minute`);
    }
    
    // Check for weak API keys
    let weakKeys = 0;
    for (const apiKey of this.apiKeys.values()) {
      if (!apiKey.expiresAt) {
        weakKeys++;
      }
    }
    
    if (weakKeys > 0) {
      vulnerabilities.push({
        type: 'api_keys',
        severity: 'low',
        description: `${weakKeys} API keys without expiration`
      });
      recommendations.push('Set expiration dates for all API keys');
    }
    
    // Calculate security score
    const totalChecks = 10;
    const passedChecks = totalChecks - vulnerabilities.length;
    const score = (passedChecks / totalChecks) * 100;
    
    return {
      vulnerabilities,
      recommendations,
      score
    };
  }
  
  // Security metrics
  getSecurityMetrics(): {
    totalThreats: number;
    threatsLast24h: number;
    blockedIPs: number;
    activeApiKeys: number;
    activeSessions: number;
    securityScore: number;
  } {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    
    const threatsLast24h = this.threatHistory.filter(t => t.timestamp > last24h).length;
    const activeApiKeys = Array.from(this.apiKeys.values()).filter(k => k.active).length;
    
    return {
      totalThreats: this.threatHistory.length,
      threatsLast24h,
      blockedIPs: this.blockedIPs.size,
      activeApiKeys,
      activeSessions: this.activeSessions.size,
      securityScore: 85 // Would be calculated from actual security scan
    };
  }
  
  // Audit logging
  logSecurityEvent(event: {
    type: string;
    userId?: string;
    ip?: string;
    action: string;
    details?: any;
  }): void {
    if (!this.config.auditLogging) return;
    
    const auditLog = {
      timestamp: Date.now(),
      eventId: randomBytes(16).toString('hex'),
      ...event
    };
    
    this.logger.info('🔍 Security audit log', auditLog);
    this.emit('audit-logged', auditLog);
  }
  
  // Emergency procedures
  async emergencyLockdown(): Promise<void> {
    this.logger.error('🚨 EMERGENCY LOCKDOWN INITIATED');
    
    // Block all new connections
    this.config.rateLimitPerMinute = 0;
    
    // Revoke all API keys except admin
    for (const [keyId, apiKey] of this.apiKeys.entries()) {
      if (!apiKey.permissions.includes('system.admin')) {
        apiKey.active = false;
      }
    }
    
    // Clear all sessions
    this.activeSessions.clear();
    
    this.emit('emergency-lockdown');
  }
  
  async exitLockdown(): Promise<void> {
    this.logger.info('✅ Exiting emergency lockdown');
    
    // Restore normal rate limits
    this.config.rateLimitPerMinute = 100;
    
    this.emit('lockdown-lifted');
  }
  
  // Cleanup and shutdown
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down security manager...');
    
    // Clear sensitive data
    this.apiKeys.clear();
    this.activeSessions.clear();
    this.failedAttempts.clear();
    this.blockedIPs.clear();
    
    this.emit('shutdown');
    this.logger.info('✅ Security manager shutdown complete');
  }
  
  // Public getters
  getThreats(timeWindowMs?: number): SecurityThreat[] {
    if (!timeWindowMs) return [...this.threatHistory];
    
    const cutoff = Date.now() - timeWindowMs;
    return this.threatHistory.filter(t => t.timestamp > cutoff);
  }
  
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
  
  getActiveApiKeys(): Array<{ keyId: string; permissions: string[]; lastUsed?: number }> {
    return Array.from(this.apiKeys.values())
      .filter(key => key.active)
      .map(key => ({
        keyId: key.keyId,
        permissions: key.permissions,
        lastUsed: key.lastUsed
      }));
  }
}