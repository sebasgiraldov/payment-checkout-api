import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';
import { Address } from '../value-objects/address.value-object';
import { Money } from '../value-objects/money.value-object';
import { generateId } from '../../shared/utils/generate-id';

/**
 * Props for creating a Delivery entity
 */
export interface DeliveryProps {
  id?: string;
  customerId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  deliveryFee: Money;
  createdAt?: Date;
}

/**
 * Delivery Entity
 *
 * Represents delivery information for an order.
 * Enforces business rules:
 * - Customer ID is required
 * - Address must be valid
 * - Delivery fee must be valid Money object
 *
 * @example
 * ```typescript
 * const deliveryFee = Money.create(10, 'USD').value;
 * const delivery = Delivery.create({
 *   customerId: 'customer-uuid',
 *   address: '123 Main St',
 *   city: 'New York',
 *   state: 'NY',
 *   country: 'USA',
 *   postalCode: '10001',
 *   deliveryFee
 * });
 *
 * if (delivery.isSuccess) {
 *   const d = delivery.value;
 *   console.log(d.address.toString());
 * }
 * ```
 */
export class Delivery {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    private _address: Address,
    private _deliveryFee: Money,
    public readonly createdAt: Date
  ) {}

  /**
   * Factory method to create a Delivery instance with validation
   *
   * @param props - Delivery properties
   * @returns Result containing Delivery instance or DomainError
   *
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
   */
  static create(props: DeliveryProps): Result<Delivery, DomainError> {
    // Validate customerId is non-empty (Requirement 4.1)
    if (!props.customerId || props.customerId.trim().length === 0) {
      return Result.fail(
        new ValidationError('Customer ID is required', {
          customerId: props.customerId,
        })
      );
    }

    // Validate address (Requirement 4.2)
    const addressResult = Address.create({
      street: props.address,
      city: props.city,
      state: props.state,
      country: props.country,
      postalCode: props.postalCode,
    });

    if (addressResult.isFailure) {
      return Result.fail(addressResult.error);
    }

    return Result.ok(
      new Delivery(
        props.id || generateId(),
        props.customerId,
        addressResult.value,
        props.deliveryFee,
        props.createdAt || new Date()
      )
    );
  }

  /**
   * Gets the delivery address
   */
  get address(): Address {
    return this._address;
  }

  /**
   * Gets the delivery fee
   */
  get deliveryFee(): Money {
    return this._deliveryFee;
  }
}
