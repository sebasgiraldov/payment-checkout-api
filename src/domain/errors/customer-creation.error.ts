import { ApplicationError } from './application.error';

/**
 * CustomerCreationError represents a failure during customer creation
 */
export class CustomerCreationError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Failed to create customer: ${message}`, context);
  }
}
