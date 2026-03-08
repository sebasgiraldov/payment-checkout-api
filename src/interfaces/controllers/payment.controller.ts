import { Request, Response, NextFunction } from 'express';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { ProcessPaymentDto } from '../../application/dtos/transaction.dto';
import { logger } from '../../shared/utils/logger';

/**
 * Payment Controller
 *
 * Handles HTTP requests for payment processing operations.
 * Maps use case results to appropriate HTTP responses.
 *
 * **Validates: Requirements 6.1, 6.2, 11.3**
 */
export class PaymentController {
  constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) {}

  /**
   * POST /payments/process
   *
   * Processes a payment for an existing transaction.
   * Returns payment result even for declined payments (200 status).
   *
   * @param req - Express request object with ProcessPaymentDto in body
   * @param res - Express response object
   * @param next - Express next function
   *
   * **Validates: Requirements 6.1, 6.2, 11.3**
   */
  async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: ProcessPaymentDto = req.body;

      // Mask sensitive card information for logging
      const maskedCardNumber = dto.cardNumber
        ? `****-****-****-${dto.cardNumber.slice(-4)}`
        : 'undefined';

      logger.info({
        correlationId: req.correlationId,
        transactionId: dto.transactionId,
        cardNumber: maskedCardNumber,
        cardHolder: dto.cardHolder,
        customerEmail: dto.customerEmail,
        idempotencyKey: dto.idempotencyKey,
        method: req.method,
        path: req.path,
      }, 'Processing payment');

      const result = await this.processPaymentUseCase.execute(dto);

      if (result.isFailure) {
        logger.error({
          correlationId: req.correlationId,
          transactionId: dto.transactionId,
          cardNumber: maskedCardNumber,
          customerEmail: dto.customerEmail,
          error: result.error.message,
          errorType: result.error.constructor.name,
          errorDetails: result.error,
          stack: result.error.stack,
        }, 'Payment processing failed');
        return next(result.error);
      }

      const paymentResult = result.value;

      // Log payment result (success or decline)
      if (paymentResult.status === 'APPROVED') {
        logger.info('Payment approved successfully', {
          correlationId: req.correlationId,
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          externalPaymentId: paymentResult.externalPaymentId,
        });
      } else {
        logger.warn('Payment declined or failed', {
          correlationId: req.correlationId,
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          message: paymentResult.message,
          externalPaymentId: paymentResult.externalPaymentId,
        });
      }

      // Return 200 for both approved and declined payments
      // Only errors (gateway unavailable, etc.) should return error status codes
      res.status(200).json({
        success: true,
        data: paymentResult,
        message: getPaymentStatusMessage(paymentResult.status),
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Unexpected error in processPayment', {
        correlationId: req.correlationId,
        transactionId: req.body?.transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }
}

/**
 * Gets appropriate message for payment status
 *
 * @param status - Payment status
 * @returns User-friendly status message
 */
function getPaymentStatusMessage(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Payment processed successfully';
    case 'DECLINED':
      return 'Payment was declined by the payment provider';
    case 'FAILED':
      return 'Payment processing failed';
    case 'PENDING':
      return 'Payment is being processed';
    default:
      return 'Payment status unknown';
  }
}

export default PaymentController;
