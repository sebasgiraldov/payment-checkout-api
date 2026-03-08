import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';

/**
 * Phone Value Object
 *
 * Represents a phone number with validation and normalization.
 * Ensures immutability and validates business rules:
 * - Phone must contain 10-15 digits
 * - Non-digit characters are stripped during validation
 *
 * @example
 * ```typescript
 * const phone = Phone.create('+1 (555) 123-4567');
 * if (phone.isSuccess) {
 *   console.log(phone.value.value); // '15551234567'
 * }
 * ```
 */
export class Phone {
  private constructor(public readonly value: string) {}

  /**
   * Factory method to create a Phone instance with validation
   *
   * @param phone - The phone number string
   * @returns Result containing Phone instance or ValidationError
   *
   * **Validates: Requirements 3.3, 12.4**
   */
  static create(phone: string): Result<Phone, DomainError> {
    // Strip non-digit characters (Requirement 12.4)
    const cleaned = phone.replace(/\D/g, '');

    // Validate length between 10-15 digits (Requirement 3.3, 12.4)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return Result.fail(
        new ValidationError('Invalid phone number', {
          phone,
        })
      );
    }

    return Result.ok(new Phone(cleaned));
  }

  /**
   * Compare two Phone instances for equality
   *
   * @param other - The other Phone instance to compare
   * @returns true if phones are equal, false otherwise
   */
  equals(other: Phone): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
