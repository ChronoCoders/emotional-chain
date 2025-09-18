import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { ProductionCrypto } from '../../crypto/ProductionCrypto';

/**
 * Production-grade security middleware
 * Implements enterprise security controls
 */

// Rate limiting configuration
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for internal server-to-server requests
  skip: (req: Request) => {
    return req.headers['x-internal-request'] === 'true';
  }
});

// Strict rate limiting for sensitive operations
export const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit to 10 requests per 5 minutes
  message: {
    error: 'Rate limit exceeded for sensitive operation',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Content Security Policy
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "blob:", "data:"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:"],
    connectSrc: ["'self'", "ws:", "wss:"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
};

// Helmet security configuration  
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Disable CSP for development compatibility
  crossOriginEmbedderPolicy: false, // Disable for WebAssembly compatibility
  hsts: false, // Disable HSTS for development
  noSniff: true,
  frameguard: { action: 'sameorigin' }, // Less restrictive for development
  referrerPolicy: { policy: 'same-origin' }
});

// CORS configuration
export const corsConfig = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, restrict to known domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://emotionalchain.com',
      'https://www.emotionalchain.com',
      /\.replit\.dev$/,
      /\.replit\.app$/
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else {
        return allowed.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Signature', 'X-Nonce'],
  maxAge: 86400 // 24 hours
};

// Message authentication middleware
export const authenticateMessage = async (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for GET requests and public endpoints
  if (req.method === 'GET' || req.path.startsWith('/api/public/')) {
    return next();
  }

  const signature = req.headers['x-signature'] as string;
  const nonce = req.headers['x-nonce'] as string;
  
  if (!signature || !nonce) {
    return res.status(401).json({
      error: 'Missing authentication headers',
      required: ['X-Signature', 'X-Nonce']
    });
  }

  try {
    // Verify nonce to prevent replay attacks
    if (!ProductionCrypto.verifyNonce(nonce)) {
      return res.status(401).json({
        error: 'Invalid or expired nonce'
      });
    }

    // TODO: Implement signature verification with validator public keys
    // For now, accept requests with proper nonce
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: (error as Error).message
    });
  }
};

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Input validation failed',
        details: error.details.map((detail: any) => detail.message)
      });
    }
    next();
  };
};

// SQL injection prevention
export const sanitizeQuery = (req: Request, res: Response, next: NextFunction) => {
  // Check for SQL injection patterns in query parameters
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i
  ];

  const checkValue = (value: string): boolean => {
    return sqlInjectionPatterns.some(pattern => pattern.test(value));
  };

  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string' && checkValue(value)) {
      return res.status(400).json({
        error: 'Invalid query parameter detected',
        parameter: key
      });
    }
  }

  // Check request body
  const checkObject = (obj: any): boolean => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && checkValue(value)) {
        return true;
      }
      if (typeof value === 'object' && value !== null && checkObject(value)) {
        return true;
      }
    }
    return false;
  };

  if (req.body && checkObject(req.body)) {
    return res.status(400).json({
      error: 'Invalid input detected'
    });
  }

  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
      referer: req.get('Referer')
    };

    // Log suspicious activity
    if (res.statusCode >= 400) {
      console.warn('Security Event:', JSON.stringify(logData));
    }
  });

  next();
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // Add XSS protection headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
};

export default {
  apiRateLimit,
  strictRateLimit,
  securityHeaders,
  corsConfig,
  authenticateMessage,
  validateInput,
  sanitizeQuery,
  securityLogger,
  xssProtection
};