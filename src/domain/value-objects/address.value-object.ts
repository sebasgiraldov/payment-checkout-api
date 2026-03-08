import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';

/**
 * Address Value Object
 *
 * Represents a delivery address with validation.
 * Ensures immutability and validates business rules:
 * - Street, city, and country are required fields
 * - State and postal code are optional
 *
 * @example
 * ```typescript
 * const address = Address.create({
 *   street: '123 Main St',
 *   city: 'New York',
 *   state: 'NY',
 *   country: 'USA',
 *   postalCode: '10001'
 * });
 * if (address.isSuccess) {
 *   console.log(address.value.toString());
 * }
 * ```
 */
export class Address {
  private constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string,
    public readonly country: string,
    public readonly postalCode: string
  ) {}

  /**
   * Factory method to create an Address instance with validation
   *
   * @param props - Address properties
   * @returns Result containing Address instance or ValidationError
   *
   * **Validates: Requirements 4.2, 14.1**
   */
  static create(props: AddressProps): Result<Address, DomainError> {
    // Validate required field: street (Requirement 4.2)
    if (!props.street || props.street.trim().length === 0) {
      return Result.fail(
        new ValidationError('Street is required', {
          street: props.street,
        })
      );
    }

    // Validate required field: city (Requirement 4.2)
    if (!props.city || props.city.trim().length === 0) {
      return Result.fail(
        new ValidationError('City is required', {
          city: props.city,
        })
      );
    }

    // Validate required field: country (Requirement 4.2)
    if (!props.country || props.country.trim().length === 0) {
      return Result.fail(
        new ValidationError('Country is required', {
          country: props.country,
        })
      );
    }

    return Result.ok(
      new Address(props.street, props.city, props.state, props.country, props.postalCode)
    );
  }

  /**
   * Returns a formatted string representation of the address
   *
   * @returns Formatted address string
   */
  toString(): string {
    return `${this.street}, ${this.city}, ${this.state}, ${this.country} ${this.postalCode}`;
  }

  /**
   * Returns the full address as a formatted string
   *
   * @returns Full address string
   */
  getFullAddress(): string {
    const parts = [this.street, this.city];
    if (this.state) parts.push(this.state);
    parts.push(this.country);
    if (this.postalCode) parts.push(this.postalCode);
    return parts.join(', ');
  }

  /**
   * Compare two Address instances for equality
   *
   * @param other - The other Address instance to compare
   * @returns true if addresses are equal, false otherwise
   */
  equals(other: Address): boolean {
    if (!other) return false;
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.state === other.state &&
      this.country === other.country &&
      this.postalCode === other.postalCode
    );
  }
}

/**
 * Props interface for creating an Address
 */
export interface AddressProps {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}
