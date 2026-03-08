/**
 * Express type extensions
 *
 * Extends Express Request interface with custom properties
 */

declare namespace Express {
  export interface Request {
    /**
     * Correlation ID for request tracking
     * Added by correlation-id middleware
     */
    correlationId?: string;
  }
}
