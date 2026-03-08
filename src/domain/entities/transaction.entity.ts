import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';
import { InvalidStateTransitionError } from '../errors/invalid-state-transition.error';
import { Money } from '../value-objects/money.value-object';
import { generateId } from '../../shared/utils/generate-id';

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  FAILED = 'FAILED',
}

/**
 * Props for creating a Transaction entity
 */
export interface TransactionProps {
  id?: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  amount: Money;
  baseFee: Money;
  deliveryFee: Money;
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transaction Entity
 *
 * Represents a payment transaction with state management.
 * Enforces business rules:
 * - All required references (product, customer, delivery) must be present
 * - Total amount is calculated as amount + baseFee + deliveryFee
 * - Status starts as PENDING
 * - State transitions are only allowed from PENDING to APPROVED/DECLINED/FAILED
 * - Once in a final state (APPROVED/DECLINED/FAILED), no further transitions allowed
 *
 * @example
 * ```typescript
 * const amount = Money.create(100, 'USD').value;
 * const baseFee = Money.create(5, 'USD').value;
 * const deliveryFee = Money.create(10, 'USD').value;
 *
 * const transaction = Transaction.create({
 *   productId: 'product-uuid',
 *   customerId: 'customer-uuid',
 *   deliveryId: 'delivery-uuid',
 *   amount,
 *   baseFee,
 *   deliveryFee,
 *   paymentMethod: 'CARD'
 * });
 *
 * if (transaction.isSuccess) {
 *   const t = transaction.value;
 *   console.log(t.totalAmount); // Money(115, 'USD')
 *   t.approve('external-payment-id');
 * }
 * ```
 */
export class Transaction {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly customerId: string,
    public readonly deliveryId: string,
    private _amount: Money,
    private _baseFee: Money,
    private _deliveryFee: Money,
    private _totalAmount: Money,
    private _status: TransactionStatus,
    public readonly paymentMethod: string,
    private _externalPaymentId: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  /**
   * Factory method to create a Transaction instance with validation
   *
   * @param props - Transaction properties
   * @returns Result containing Transaction instance or DomainError
   *
   * **Validates: Requirements 5.1, 5.2, 5.6, 5.7, 5.8, 8.1**
   */
  static create(props: TransactionProps): Result<Transaction, DomainError> {
    // Validate required references (Requirement 5.1)
    if (!props.productId || props.productId.trim().length === 0) {
      return Result.fail(
        new ValidationError('Product ID is required', {
          productId: props.productId,
        })
      );
    }

    if (!props.customerId || props.customerId.trim().length === 0) {
      return Result.fail(
        new ValidationError('Customer ID is required', {
          customerId: props.customerId,
        })
      );
    }

    if (!props.deliveryId || props.deliveryId.trim().length === 0) {
      return Result.fail(
        new ValidationError('Delivery ID is required', {
          deliveryId: props.deliveryId,
        })
      );
    }

    if (!props.paymentMethod || props.paymentMethod.trim().length === 0) {
      return Result.fail(
        new ValidationError('Payment method is required', {
          paymentMethod: props.paymentMethod,
        })
      );
    }

    // Calculate total amount (Requirement 5.2)
    const totalAmount = props.amount.add(props.baseFee).add(props.deliveryFee);

    return Result.ok(
      new Transaction(
        props.id || generateId(),
        props.productId,
        props.customerId,
        props.deliveryId,
        props.amount,
        props.baseFee,
        props.deliveryFee,
        totalAmount,
        TransactionStatus.PENDING, // Always starts as PENDING (Requirement 8.1)
        props.paymentMethod,
        null, // External payment ID is null initially (Requirement 5.8)
        props.createdAt || new Date(),
        props.updatedAt || new Date()
      )
    );
  }

  /**
   * Gets the transaction status
   */
  get status(): TransactionStatus {
    return this._status;
  }

  /**
   * Gets the product amount
   */
  get amount(): Money {
    return this._amount;
  }

  /**
   * Gets the base fee
   */
  get baseFee(): Money {
    return this._baseFee;
  }

  /**
   * Gets the delivery fee
   */
  get deliveryFee(): Money {
    return this._deliveryFee;
  }

  /**
   * Gets the total amount (amount + baseFee + deliveryFee)
   */
  get totalAmount(): Money {
    return this._totalAmount;
  }

  /**
   * Gets the external payment ID
   */
  get externalPaymentId(): string | null {
    return this._externalPaymentId;
  }

  /**
   * Gets the updated timestamp
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Approves the transaction and sets the external payment ID
   *
   * @param externalPaymentId - The payment gateway transaction ID
   * @returns Result indicating success or error
   *
   * **Validates: Requirements 8.2, 8.3, 8.4**
   */
  approve(externalPaymentId: string): Result<void, DomainError> {
    // Validate state transition (Requirement 8.2, 8.3)
    if (this._status !== TransactionStatus.PENDING) {
      return Result.fail(new InvalidStateTransitionError(this._status, TransactionStatus.APPROVED));
    }

    // Validate external payment ID
    if (!externalPaymentId || externalPaymentId.trim().length === 0) {
      return Result.fail(
        new ValidationError('External payment ID is required for approval', {
          transactionId: this.id,
        })
      );
    }

    // Update state (Requirement 8.2)
    this._status = TransactionStatus.APPROVED;
    this._externalPaymentId = externalPaymentId;
    this._updatedAt = new Date();

    return Result.ok(null as any);
  }

  /**
   * Declines the transaction and sets the external payment ID
   *
   * @param externalPaymentId - The payment gateway transaction ID
   * @returns Result indicating success or error
   *
   * **Validates: Requirements 8.2, 8.3, 8.4**
   */
  decline(externalPaymentId: string): Result<void, DomainError> {
    // Validate state transition (Requirement 8.2, 8.3)
    if (this._status !== TransactionStatus.PENDING) {
      return Result.fail(new InvalidStateTransitionError(this._status, TransactionStatus.DECLINED));
    }

    // Validate external payment ID
    if (!externalPaymentId || externalPaymentId.trim().length === 0) {
      return Result.fail(
        new ValidationError('External payment ID is required for decline', {
          transactionId: this.id,
        })
      );
    }

    // Update state (Requirement 8.2)
    this._status = TransactionStatus.DECLINED;
    this._externalPaymentId = externalPaymentId;
    this._updatedAt = new Date();

    return Result.ok(null as any);
  }

  /**
   * Marks the transaction as failed with a reason
   *
   * @param reason - The failure reason
   * @returns Result indicating success or error
   *
   * **Validates: Requirements 8.2, 8.3, 8.4**
   */
  fail(_reason: string): Result<void, DomainError> {
    // Validate state transition (Requirement 8.2, 8.3)
    if (this._status !== TransactionStatus.PENDING) {
      return Result.fail(new InvalidStateTransitionError(this._status, TransactionStatus.FAILED));
    }

    // Update state (Requirement 8.2)
    this._status = TransactionStatus.FAILED;
    this._updatedAt = new Date();

    return Result.ok(null as any);
  }

  /**
   * Sets the external payment ID for a pending transaction
   * Used when payment gateway returns PENDING status with a transaction ID
   *
   * @param externalPaymentId - The payment gateway transaction ID
   * @returns Result indicating success or error
   */
  setExternalPaymentId(externalPaymentId: string): Result<void, DomainError> {
    // Validate external payment ID
    if (!externalPaymentId || externalPaymentId.trim().length === 0) {
      return Result.fail(
        new ValidationError('External payment ID cannot be empty', {
          transactionId: this.id,
        })
      );
    }

    // Set external payment ID
    this._externalPaymentId = externalPaymentId;
    this._updatedAt = new Date();

    return Result.ok(null as any);
  }

  /**
   * Checks if the transaction is in PENDING status
   *
   * @returns true if status is PENDING, false otherwise
   */
  isPending(): boolean {
    return this._status === TransactionStatus.PENDING;
  }

  /**
   * Checks if the transaction is in APPROVED status
   *
   * @returns true if status is APPROVED, false otherwise
   */
  isApproved(): boolean {
    return this._status === TransactionStatus.APPROVED;
  }
}
