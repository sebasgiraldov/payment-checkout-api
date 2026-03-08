import { DomainError } from './domain.error';

/**
 * ValidationError represents invalid input data or business rule violations
 * Used when data fails validation constraints
 */
export class ValidationError extends DomainError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}
