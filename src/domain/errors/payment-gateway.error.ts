import { PaymentError } from './payment.error';

/**
 * PaymentGatewayError represents a failure in communication with the payment gateway
 * or an error response from the gateway
 */
export class PaymentGatewayError extends PaymentError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Payment gateway error: ${message}`, context);
  }
}
