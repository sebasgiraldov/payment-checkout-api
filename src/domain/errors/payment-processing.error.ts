import { ApplicationError } from './application.error';

/**
 * PaymentProcessingError represents a failure during payment processing
 */
export class PaymentProcessingError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Payment processing failed: ${message}`, context);
  }
}
