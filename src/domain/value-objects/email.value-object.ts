import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';

/**
 * Email Value Object
 *
 * Represents an email address with validation and normalization.
 * Ensures immutability and validates business rules:
 * - Email must conform to standard email format
 * - Email is normalized to lowercase for consistency
 *
 * @example
 * ```typescript
 * const email = Email.create('user@example.com');
 * if (email.isSuccess) {
 *   console.log(email.value.value); // 'user@example.com'
 * }
 * ```
 */
export class Email {
  private constructor(public readonly value: string) {}

  /**
   * Factory method to create an Email instance with validation
   *
   * @param email - The email address string
   * @returns Result containing Email instance or ValidationError
   *
   * **Validates: Requirements 3.2, 12.3**
   */
  static create(email: string): Result<Email, DomainError> {
    // Standard email regex pattern (Requirement 12.3)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return Result.fail(
        new ValidationError('Invalid email format', {
          email,
        })
      );
    }

    // Normalize email to lowercase (Requirement 3.2)
    return Result.ok(new Email(email.toLowerCase()));
  }

  /**
   * Compare two Email instances for equality
   *
   * @param other - The other Email instance to compare
   * @returns true if emails are equal, false otherwise
   */
  equals(other: Email): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
