import { ApplicationError } from './application.error';

/**
 * TransactionUpdateError represents a failure during transaction update
 */
export class TransactionUpdateError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Failed to update transaction: ${message}`, context);
  }
}
