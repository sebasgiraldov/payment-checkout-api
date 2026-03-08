import { Result } from '../../shared/result';
import { ProcessPaymentDto, PaymentResultDto } from '../dtos/transaction.dto';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository';
import { IPaymentGateway, PaymentRequest } from '../../domain/services/payment-gateway.interface';
import { TransactionStatus } from '../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import { PaymentProcessingError } from '../../domain/errors/payment-processing.error';
import { InvalidStateTransitionError } from '../../domain/errors/invalid-state-transition.error';
import { ApplicationError } from '../../domain/errors/application.error';
import { generateId } from '../../shared/utils/generate-id';

/**
 * Process Payment Use Case
 *
 * Handles payment processing for an existing transaction.
 * Integrates with payment gateway and updates transaction status.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 13.1, 13.2, 13.3**
 */
export class ProcessPaymentUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  /**
   * Executes payment processing
   *
   * @param dto - Payment processing data
   * @returns Result containing payment result or error
   *
   * **Validates: Requirements 6.1, 6.2, 6.3, 13.1, 13.2, 13.3**
   */
  async execute(dto: ProcessPaymentDto): Promise<Result<PaymentResultDto, ApplicationError>> {
    try {
      // 1. Retrieve transaction
      const transactionResult = await this.transactionRepository.findById(dto.transactionId);

      if (transactionResult.isFailure) {
        return Result.fail(
          new TransactionNotFoundError(`Transaction ${dto.transactionId} not found`)
        );
      }

      const transaction = transactionResult.value;

      // 2. Validate transaction state
      if (transaction.status !== TransactionStatus.PENDING) {
        return Result.fail(
          new InvalidStateTransitionError(transaction.status, TransactionStatus.PENDING)
        );
      }

      // 3. Prepare payment request
      const paymentRequest: PaymentRequest = {
        amount: transaction.totalAmount.amount,
        currency: transaction.totalAmount.currency,
        cardNumber: dto.cardNumber,
        cardHolder: dto.cardHolder,
        expiryMonth: dto.expiryMonth,
        expiryYear: dto.expiryYear,
        cvv: dto.cvv,
        customerEmail: dto.customerEmail,
        reference: transaction.id,
        idempotencyKey: dto.idempotencyKey || generateId(),
      };

      // 4. Process payment through gateway
      const paymentResult = await this.paymentGateway.processPayment(paymentRequest);

      if (paymentResult.isFailure) {
        // Update transaction to FAILED status
        const failResult = transaction.fail('Payment gateway error');
        if (failResult.isFailure) {
          return Result.fail(
            new PaymentProcessingError(
              `Failed to mark transaction as failed: ${failResult.error.message}`,
              { transactionId: transaction.id }
            )
          );
        }
        await this.transactionRepository.update(transaction);

        return Result.fail(
          new PaymentProcessingError(`Payment processing failed: ${paymentResult.error.message}`, {
            transactionId: transaction.id,
            error: paymentResult.error,
          })
        );
      }

      const payment = paymentResult.value;

      // 5. Update transaction based on payment status
      if (payment.status === 'APPROVED') {
        const approveResult = transaction.approve(payment.transactionId);
        if (approveResult.isFailure) {
          return Result.fail(
            new PaymentProcessingError(
              `Failed to approve transaction: ${approveResult.error.message}`,
              { transactionId: transaction.id, paymentId: payment.transactionId }
            )
          );
        }
      } else if (payment.status === 'DECLINED') {
        const declineResult = transaction.decline(payment.transactionId);
        if (declineResult.isFailure) {
          return Result.fail(
            new PaymentProcessingError(
              `Failed to decline transaction: ${declineResult.error.message}`,
              { transactionId: transaction.id, paymentId: payment.transactionId }
            )
          );
        }
      } else {
        // PENDING status - keep transaction as pending but store external payment ID
        const setIdResult = transaction.setExternalPaymentId(payment.transactionId);
        if (setIdResult.isFailure) {
          return Result.fail(
            new PaymentProcessingError(
              `Failed to set external payment ID: ${setIdResult.error.message}`,
              { transactionId: transaction.id, paymentId: payment.transactionId }
            )
          );
        }
      }

      // 6. Save updated transaction
      const updateResult = await this.transactionRepository.update(transaction);

      if (updateResult.isFailure) {
        return Result.fail(
          new PaymentProcessingError(
            `Failed to update transaction after payment: ${updateResult.error.message}`,
            { transactionId: transaction.id, paymentId: payment.transactionId }
          )
        );
      }

      // 7. Return payment result
      return Result.ok(PaymentResultDto.fromEntity(transaction));
    } catch (error) {
      const err = error as Error;
      return Result.fail(
        new PaymentProcessingError(`Unexpected error during payment processing: ${err.message}`, {
          error: err.message,
          stack: err.stack,
        })
      );
    }
  }
}
