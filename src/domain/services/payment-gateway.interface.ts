import { Result } from '../../shared/result';
import { PaymentError } from '../errors/payment.error';

/**
 * Payment Gateway Interface
 *
 * Defines the contract for payment gateway adapters.
 * Implementations handle tokenization, payment processing, and status retrieval.
 *
 * **Validates: Requirements 6.1, 6.2, 13.1, 13.2**
 */
export interface IPaymentGateway {
  /**
   * Processes a payment through the gateway
   *
   * @param request - Payment request details including card information
   * @returns Result containing payment response or payment error
   *
   * **Validates: Requirements 6.1, 6.2, 13.1, 13.2**
   */
  processPayment(request: PaymentRequest): Promise<Result<PaymentResponse, PaymentError>>;

  /**
   * Retrieves the current status of a payment transaction
   *
   * @param transactionId - The external payment transaction ID
   * @returns Result containing payment status or payment error
   *
   * **Validates: Requirements 13.1, 13.2**
   */
  getPaymentStatus(transactionId: string): Promise<Result<PaymentStatus, PaymentError>>;
}

/**
 * Payment Request
 *
 * Contains all information needed to process a payment
 *
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */
export interface PaymentRequest {
  /** Amount in the base currency unit (e.g., dollars, not cents) */
  amount: number;

  /** ISO 4217 currency code (e.g., USD, COP, EUR) */
  currency: string;

  /** Full credit card number */
  cardNumber: string;

  /** Cardholder name as it appears on the card */
  cardHolder: string;

  /** Card expiry month (01-12) */
  expiryMonth: string;

  /** Card expiry year (e.g., 2025) */
  expiryYear: string;

  /** Card verification value (CVV/CVC) */
  cvv: string;

  /** Customer email address */
  customerEmail: string;

  /** Unique reference for this payment (typically transaction ID) */
  reference: string;

  /** Idempotency key to prevent duplicate charges */
  idempotencyKey: string;
}

/**
 * Payment Response
 *
 * Contains the result of a payment processing attempt
 *
 * **Validates: Requirements 6.4, 6.5, 6.7, 13.3**
 */
export interface PaymentResponse {
  /** External payment gateway transaction ID */
  transactionId: string;

  /** Payment status */
  status: 'APPROVED' | 'DECLINED' | 'PENDING';

  /** Authorization code from the payment gateway (if approved) */
  authorizationCode?: string;

  /** Human-readable message describing the payment result */
  message: string;
}

/**
 * Payment Status
 *
 * Contains the current status of a payment transaction
 *
 * **Validates: Requirements 13.3**
 */
export interface PaymentStatus {
  /** Current payment status */
  status: 'APPROVED' | 'DECLINED' | 'PENDING';

  /** Human-readable status message */
  message: string;
}
