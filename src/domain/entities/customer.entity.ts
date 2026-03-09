import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';
import { Email } from '../value-objects/email.value-object';
import { Phone } from '../value-objects/phone.value-object';
import { generateId } from '../../shared/utils/generate-id';

/**
 * Props for creating a Customer entity
 */
export interface CustomerProps {
  id?: string;
  name: string;
  email: string | Email;
  phone: string | Phone;
  createdAt?: Date;
}

/**
 * Customer Entity
 *
 * Represents a customer with contact information.
 * Enforces business rules:
 * - Customer name is required and non-empty
 * - Email must be valid format
 * - Phone must be valid format (10-15 digits)
 *
 * @example
 * ```typescript
 * const customer = Customer.create({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+1234567890'
 * });
 *
 * if (customer.isSuccess) {
 *   const c = customer.value;
 *   console.log(c.email.value); // 'john@example.com'
 * }
 * ```
 */
export class Customer {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _email: Email,
    private _phone: Phone,
    public readonly createdAt: Date
  ) {}

  /**
   * Factory method to create a Customer instance with validation
   *
   * @param props - Customer properties
   * @returns Result containing Customer instance or DomainError
   *
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  static create(props: CustomerProps): Result<Customer, DomainError> {
    // Validate name is non-empty (Requirement 3.1)
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(
        new ValidationError('Customer name is required', {
          name: props.name,
        })
      );
    }

    // Validate email format (Requirement 3.2)
    const emailResult: Result<Email, DomainError> = props.email instanceof Email 
      ? Result.ok(props.email)
      : Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error as DomainError);
    }

    // Validate phone format (Requirement 3.3)
    const phoneResult: Result<Phone, DomainError> = props.phone instanceof Phone
      ? Result.ok(props.phone)
      : Phone.create(props.phone);
    if (phoneResult.isFailure) {
      return Result.fail(phoneResult.error as DomainError);
    }

    return Result.ok(
      new Customer(
        props.id || generateId(),
        props.name.trim(),
        emailResult.value,
        phoneResult.value,
        props.createdAt || new Date()
      )
    );
  }

  /**
   * Gets the customer name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the customer email
   */
  get email(): Email {
    return this._email;
  }

  /**
   * Gets the customer phone
   */
  get phone(): Phone {
    return this._phone;
  }
}
