import { ApplicationError } from './application.error';

/**
 * DeliveryCreationError represents a failure during delivery information creation
 */
export class DeliveryCreationError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Failed to create delivery: ${message}`, context);
  }
}
