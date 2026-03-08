import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';

/**
 * Money Value Object
 *
 * Represents a monetary amount with currency.
 * Ensures immutability and validates business rules:
 * - Amount must be non-negative
 * - Currency must be a valid 3-letter ISO code
 * - Arithmetic operations maintain currency consistency
 *
 * @example
 * ```typescript
 * const price = Money.create(100, 'USD');
 * const fee = Money.create(10, 'USD');
 * const total = price.value.add(fee.value); // Money(110, 'USD')
 * ```
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  /**
   * Factory method to create a Money instance with validation
   *
   * @param amount - The monetary amount (must be >= 0)
   * @param currency - The 3-letter ISO currency code (e.g., USD, COP, EUR)
   * @returns Result containing Money instance or ValidationError
   *
   * **Validates: Requirements 10.2, 10.3, 12.5**
   */
  static create(amount: number, currency: string): Result<Money, DomainError> {
    // Validate amount is non-negative (Requirement 10.2)
    if (amount < 0) {
      return Result.fail(
        new ValidationError('Amount cannot be negative', {
          amount,
          currency,
        })
      );
    }

    // Validate currency is a 3-letter code (Requirement 12.5)
    if (!currency || currency.length !== 3) {
      return Result.fail(
        new ValidationError('Currency must be a 3-letter code', {
          amount,
          currency,
        })
      );
    }

    // Validate currency contains only letters
    if (!/^[A-Z]{3}$/.test(currency.toUpperCase())) {
      return Result.fail(
        new ValidationError('Currency must contain only uppercase letters', {
          amount,
          currency,
        })
      );
    }

    return Result.ok(new Money(amount, currency.toUpperCase()));
  }

  /**
   * Adds another Money instance to this one
   *
   * @param other - The Money instance to add
   * @returns A new Money instance with the sum
   * @throws Error if currencies don't match
   *
   * **Validates: Requirements 10.1, 10.3**
   */
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot add money with different currencies: ${this.currency} and ${other.currency}`
      );
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtracts another Money instance from this one
   *
   * @param other - The Money instance to subtract
   * @returns A new Money instance with the difference
   * @throws Error if currencies don't match
   *
   * **Validates: Requirements 10.1, 10.3**
   */
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot subtract money with different currencies: ${this.currency} and ${other.currency}`
      );
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * Multiplies this Money instance by a factor
   *
   * @param factor - The multiplication factor
   * @returns A new Money instance with the product
   *
   * **Validates: Requirements 10.1**
   */
  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  /**
   * Checks equality with another Money instance
   *
   * @param other - The Money instance to compare
   * @returns true if both amount and currency are equal
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
