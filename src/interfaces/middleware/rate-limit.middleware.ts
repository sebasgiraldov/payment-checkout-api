import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../../shared/utils/logger';

/**
 * Rate Limiting Middleware
 *
 * Implements rate limiting to protect against abuse and ensure fair usage.
 * Provides both general and strict rate limiters for different endpoint types.
 *
 * **Validates: Requirements 14.6, 16.6**
 */

/**
 * General Rate Limiter
 *
 * Applies to all API routes with a limit of 100 requests per minute per IP.
 * This protects the API from general abuse while allowing normal usage patterns.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '60 seconds',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('General rate limit exceeded', {
      correlationId: req.correlationId,
      ip: req.ip || req.connection.remoteAddress,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '60 seconds',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  },
});

/**
 * Strict Rate Limiter for Payment Endpoints
 *
 * Applies to payment processing endpoints with a limit of 10 requests per minute per IP.
 * This provides additional protection for sensitive payment operations.
 */
export const strictPaymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window per IP
  message: {
    error: 'Too Many Requests',
    message: 'Too many payment requests from this IP, please try again later.',
    retryAfter: '60 seconds',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('Payment rate limit exceeded', {
      correlationId: req.correlationId,
      ip: req.ip || req.connection.remoteAddress,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many payment requests from this IP, please try again later.',
      retryAfter: '60 seconds',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  },
});

export default {
  generalRateLimiter,
  strictPaymentRateLimiter,
};
