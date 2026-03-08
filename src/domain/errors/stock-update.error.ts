import { ApplicationError } from './application.error';

/**
 * Stock Update Error
 *
 * Thrown when stock update operations fail.
 * This includes failures to decrease stock or persist stock changes.
 */
export class StockUpdateError extends ApplicationError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, metadata);
    this.name = 'StockUpdateError';
  }
}
