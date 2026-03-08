import { ApplicationError } from './application.error';

/**
 * TransactionCreationError represents a failure during transaction creation
 */
export class TransactionCreationError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Failed to create transaction: ${message}`, context);
  }
}
