import { ApplicationError } from './application.error';

/**
 * StockUpdateError represents a failure during product stock update
 */
export class StockUpdateError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Failed to update stock: ${message}`, context);
  }
}
