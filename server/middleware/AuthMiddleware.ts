/**
 * EmotionalChain Authentication Middleware
 * JWT-based authentication with rate limiting for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createHash } from 'crypto';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    validatorId: string;
    role: 'validator' | 'admin' | 'observer';
    permissions: string[];
  };
}

export interface JWTPayload {
  userId: string;
  validatorId: string;
  role: 'validator' | 'admin' | 'observer';
  permissions: string[];
  iat: number;
  exp: number;
}

/**
 * JWT Authentication middleware
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      error: 'Access denied', 
      message: 'No authentication token provided' 
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'emotional-chain-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    req.user = {
      id: decoded.userId,
      validatorId: decoded.validatorId,
      role: decoded.role,
      permissions: decoded.permissions
    };
    
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.status(403).json({ 
      error: 'Access denied', 
      message: 'Invalid or expired token' 
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Access denied',
        message: `Role '${req.user.role}' not authorized for this endpoint` 
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ 
        error: 'Access denied',
        message: `Permission '${permission}' required` 
      });
      return;
    }

    next();
  };
}

/**
 * Validator ownership verification
 */
export function requireValidatorOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'User not authenticated' 
    });
    return;
  }

  const requestedValidatorId = req.params.validatorId || req.body.validatorId;
  
  if (req.user.role !== 'admin' && req.user.validatorId !== requestedValidatorId) {
    res.status(403).json({ 
      error: 'Access denied',
      message: 'Can only access your own validator data' 
    });
    return;
  }

  next();
}

/**
 * Rate limiting for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP + user ID for authenticated requests
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'emotional-chain-secret-key';
        const decoded = jwt.verify(token, secret) as JWTPayload;
        return `${req.ip}-${decoded.userId}`;
      } catch {
        // Fall back to IP if token is invalid
      }
    }
    return req.ip;
  }
});

/**
 * Strict rate limiting for sensitive endpoints
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 requests per hour
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many sensitive requests, please try again later'
  }
});

/**
 * Speed limiting (progressive delays)
 */
export const speedLimit = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 2000, // Maximum delay of 2 seconds
});

/**
 * Generate JWT token for user
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET || 'emotional-chain-secret-key';
  
  return jwt.sign(payload, secret, {
    expiresIn: '24h',
    issuer: 'emotional-chain',
    audience: 'emotional-chain-validators'
  });
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate secure API key
 */
export function generateApiKey(): string {
  const randomBytes = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return `emo_${randomBytes}`;
}

/**
 * API key authentication middleware
 */
export function authenticateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    res.status(401).json({ 
      error: 'API key required',
      message: 'X-API-Key header missing' 
    });
    return;
  }

  // In production, this would check against a database of valid API keys
  const hashedKey = hashApiKey(apiKey);
  const validApiKeys = new Set([
    hashApiKey('emo_development_key_12345'), // Development key
    hashApiKey('emo_validator_key_67890'),   // Validator key
  ]);

  if (!validApiKeys.has(hashedKey)) {
    res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid' 
    });
    return;
  }

  // Set user context for API key (would come from database in production)
  req.user = {
    id: 'api-user',
    validatorId: 'api-validator',
    role: 'observer',
    permissions: ['read:validators', 'read:blocks', 'read:transactions']
  };

  next();
}

/**
 * Combined authentication middleware (JWT or API key)
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  if (authHeader) {
    // Try JWT authentication
    authenticateToken(req, res, next);
  } else if (apiKey) {
    // Try API key authentication
    authenticateApiKey(req, res, next);
  } else {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Provide either Authorization header with JWT or X-API-Key header' 
    });
  }
}

/**
 * CORS configuration for WebSocket and API
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://emotional-chain.replit.app',
      /\.replit\.dev$/,
      /\.replit\.app$/
    ];

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};

export default {
  authenticateToken,
  requireRole,
  requirePermission,
  requireValidatorOwnership,
  apiRateLimit,
  strictRateLimit,
  speedLimit,
  generateToken,
  authenticate,
  corsOptions
};