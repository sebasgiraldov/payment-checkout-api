import { Request, Response, NextFunction } from 'express';
import { generateId } from '../../shared/utils/generate-id';

/**
 * Correlation ID header name
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Extended Express Request interface with correlationId
 */
export interface RequestWithCorrelationId extends Request {
  correlationId: string;
}

/**
 * Middleware that generates or extracts correlation ID from request headers
 * and attaches it to the request object for request tracing
 *
 * The correlation ID is:
 * - Extracted from the x-correlation-id header if present
 * - Generated as a new UUID v4 if not present
 * - Added to the response headers for client tracking
 * - Attached to the request object for use in logging
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract correlation ID from header or generate a new one
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || generateId();

  // Attach correlation ID to request object
  (req as RequestWithCorrelationId).correlationId = correlationId;

  // Add correlation ID to response headers
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  next();
}
