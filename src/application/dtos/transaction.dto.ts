import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsNumber,
  IsUUID,
  Min,
  Length,
  Matches,
  IsOptional,
} from 'class-validator';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';

/**
 * DTO for creating a new transaction
 *
 * Contains all required information to initiate a purchase transaction.
 *
 * **Validates: Requirements 5.1, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**
 */
export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsUUID('4', { message: 'Product ID must be a valid UUID' })
  productId!: string;

  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString({ message: 'Customer name must be a string' })
  customerName!: string;

  @IsNotEmpty({ message: 'Customer email is required' })
  @IsEmail({}, { message: 'Customer email must be a valid email address' })
  customerEmail!: string;

  @IsNotEmpty({ message: 'Customer phone is required' })
  @IsString({ message: 'Customer phone must be a string' })
  @Length(10, 15, { message: 'Customer phone must be between 10 and 15 digits' })
  @Matches(/^\+?[\d\s\-()]+$/, {
    message: 'Customer phone must contain only digits and valid separators',
  })
  customerPhone!: string;

  @IsNotEmpty({ message: 'Delivery address is required' })
  @IsString({ message: 'Delivery address must be a string' })
  deliveryAddress!: string;

  @IsNotEmpty({ message: 'Delivery city is required' })
  @IsString({ message: 'Delivery city must be a string' })
  deliveryCity!: string;

  @IsOptional()
  @IsString({ message: 'Delivery state must be a string' })
  deliveryState?: string;

  @IsNotEmpty({ message: 'Delivery country is required' })
  @IsString({ message: 'Delivery country must be a string' })
  deliveryCountry!: string;

  @IsNotEmpty({ message: 'Delivery postal code is required' })
  @IsString({ message: 'Delivery postal code must be a string' })
  deliveryPostalCode!: string;

  @IsNotEmpty({ message: 'Base fee is required' })
  @IsNumber({}, { message: 'Base fee must be a number' })
  @Min(0, { message: 'Base fee must be non-negative' })
  baseFee!: number;

  @IsNotEmpty({ message: 'Delivery fee is required' })
  @IsNumber({}, { message: 'Delivery fee must be a number' })
  @Min(0, { message: 'Delivery fee must be non-negative' })
  deliveryFee!: number;

  @IsNotEmpty({ message: 'Currency is required' })
  @IsString({ message: 'Currency must be a string' })
  @Length(3, 3, { message: 'Currency must be exactly 3 characters' })
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be 3 uppercase letters' })
  currency!: string;

  @IsNotEmpty({ message: 'Payment method is required' })
  @IsString({ message: 'Payment method must be a string' })
  paymentMethod!: string;
}

/**
 * DTO for transaction responses
 *
 * Represents complete transaction data including all related information.
 *
 * **Validates: Requirements 9.1, 10.5**
 */
export class TransactionDto {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly customerId: string,
    public readonly deliveryId: string,
    public readonly amount: number,
    public readonly baseFee: number,
    public readonly deliveryFee: number,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly status: TransactionStatus,
    public readonly paymentMethod: string,
    public readonly externalPaymentId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Maps a Transaction domain entity to a TransactionDto
   *
   * @param transaction - The Transaction entity to map
   * @returns TransactionDto instance
   *
   * **Validates: Requirements 9.1, 10.5**
   */
  static fromEntity(transaction: Transaction): TransactionDto {
    return new TransactionDto(
      transaction.id,
      transaction.productId,
      transaction.customerId,
      transaction.deliveryId,
      transaction.amount.amount,
      transaction.baseFee.amount,
      transaction.deliveryFee.amount,
      transaction.totalAmount.amount,
      transaction.totalAmount.currency,
      transaction.status,
      transaction.paymentMethod,
      transaction.externalPaymentId,
      transaction.createdAt,
      transaction.updatedAt
    );
  }
}

/**
 * DTO for processing payment
 *
 * Contains payment card details and transaction reference.
 *
 * **Validates: Requirements 6.1, 12.1, 12.2, 12.6**
 */
export class ProcessPaymentDto {
  @IsNotEmpty({ message: 'Transaction ID is required' })
  @IsUUID('4', { message: 'Transaction ID must be a valid UUID' })
  transactionId!: string;

  @IsNotEmpty({ message: 'Card number is required' })
  @IsString({ message: 'Card number must be a string' })
  @Matches(/^\d{13,19}$/, { message: 'Card number must be 13-19 digits' })
  cardNumber!: string;

  @IsNotEmpty({ message: 'Card holder name is required' })
  @IsString({ message: 'Card holder name must be a string' })
  cardHolder!: string;

  @IsNotEmpty({ message: 'Expiry month is required' })
  @IsString({ message: 'Expiry month must be a string' })
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Expiry month must be 01-12' })
  expiryMonth!: string;

  @IsNotEmpty({ message: 'Expiry year is required' })
  @IsString({ message: 'Expiry year must be a string' })
  @Matches(/^\d{4}$/, { message: 'Expiry year must be 4 digits' })
  expiryYear!: string;

  @IsNotEmpty({ message: 'CVV is required' })
  @IsString({ message: 'CVV must be a string' })
  @Matches(/^\d{3,4}$/, { message: 'CVV must be 3 or 4 digits' })
  cvv!: string;

  @IsNotEmpty({ message: 'Customer email is required' })
  @IsEmail({}, { message: 'Customer email must be a valid email address' })
  customerEmail!: string;

  @IsOptional()
  @IsString({ message: 'Idempotency key must be a string' })
  idempotencyKey?: string;
}

/**
 * DTO for payment processing results
 *
 * Contains the outcome of a payment processing attempt.
 *
 * **Validates: Requirements 6.1, 9.1**
 */
export class PaymentResultDto {
  constructor(
    public readonly transactionId: string,
    public readonly status: TransactionStatus,
    public readonly amount: number,
    public readonly currency: string,
    public readonly externalPaymentId: string | null,
    public readonly message: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Maps a Transaction domain entity to a PaymentResultDto
   *
   * @param transaction - The Transaction entity to map
   * @returns PaymentResultDto instance
   *
   * **Validates: Requirements 6.1, 9.1**
   */
  static fromEntity(transaction: Transaction): PaymentResultDto {
    const message = this.getStatusMessage(transaction.status);

    return new PaymentResultDto(
      transaction.id,
      transaction.status,
      transaction.totalAmount.amount,
      transaction.totalAmount.currency,
      transaction.externalPaymentId,
      message,
      transaction.createdAt,
      transaction.updatedAt
    );
  }

  /**
   * Gets a human-readable message for the transaction status
   *
   * @param status - The transaction status
   * @returns Status message
   */
  private static getStatusMessage(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.APPROVED:
        return 'Payment approved successfully';
      case TransactionStatus.DECLINED:
        return 'Payment was declined';
      case TransactionStatus.FAILED:
        return 'Payment processing failed';
      case TransactionStatus.PENDING:
        return 'Payment is pending';
      default:
        return 'Unknown payment status';
    }
  }
}
