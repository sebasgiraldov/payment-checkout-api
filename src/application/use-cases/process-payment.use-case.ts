import { Result } from '../../shared/result';
import { ProcessPaymentDto, PaymentResultDto } from '../dtos/transaction.dto';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository';
import { IProductRepository } from '../../domain/repositories/product.repository';
import { IPaymentGateway, PaymentRequest } from '../../domain/services/payment-gateway.interface';
import { TransactionStatus } from '../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import { PaymentProcessingError } from '../../domain/errors/payment-processing.error';
import { ApplicationError } from '../../domain/errors/application.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { StockUpdateError } from '../../domain/errors/stock-update.error';
import { generateId } from '../../shared/utils/generate-id';
import { logger } from '../../shared/utils/logger';

/**
 * Process Payment Use Case
 *
 * Handles payment processing for an existing transaction.
 * Integrates with payment gateway and updates transaction status.
 * Updates product stock after successful payment.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 13.1, 13.2, 13.3, 2.2, 2.3**
 */
export class ProcessPaymentUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly productRepository: IProductRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  /**
   * Executes payment processing
   *
   * @param dto - Payment processing data
   * @returns Result containing payment result or error
   *
   * **Validates: Requirements 6.1, 6.2, 6.3, 13.1, 13.2, 13.3, 2.2, 2.3**
   */
  async execute(dto: ProcessPaymentDto): Promise<Result<PaymentResultDto, ApplicationError>> {
    try {
      logger.info('Starting payment processing', {
        transactionId: dto.transactionId,
        customerEmail: dto.customerEmail,
      });

      // 1. Retrieve transaction
      const transactionResult = await this.transactionRepository.findById(dto.transactionId);

      if (transactionResult.isFailure) {
        logger.error('Transaction not found', { transactionId: dto.transactionId });
        return Result.fail(
          new TransactionNotFoundError(`Transaction ${dto.transactionId} not found`)
        );
      }

      const transaction = transactionResult.value;

      // 2. Check for idempotency - if transaction is not pending, return existing result
      if (transaction.status !== TransactionStatus.PENDING) {
        logger.info('Transaction already processed (idempotency)', {
          transactionId: transaction.id,
          currentStatus: transaction.status,
        });
        return Result.ok(PaymentResultDto.fromEntity(transaction));
      }

      // 3. Retrieve product to verify stock availability
      const productResult = await this.productRepository.findById(transaction.productId);
      if (productResult.isFailure) {
        logger.error('Product not found for transaction', {
          transactionId: transaction.id,
          productId: transaction.productId,
        });
        return Result.fail(new ProductNotFoundError(transaction.productId));
      }

      const product = productResult.value;

      // 4. Verify product has stock before processing payment
      if (!product.hasStock(1)) {
        logger.error('Insufficient stock for payment', {
          transactionId: transaction.id,
          productId: product.id,
          availableStock: product.stock,
        });
        return Result.fail(
          new PaymentProcessingError('Product is out of stock', {
            transactionId: transaction.id,
            productId: product.id,
            availableStock: product.stock,
          })
        );
      }

      // 5. Prepare payment request
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

      logger.info('Processing payment through gateway', {
        transactionId: transaction.id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        reference: paymentRequest.reference,
      });

      // 6. Process payment through gateway
      const paymentResult = await this.paymentGateway.processPayment(paymentRequest);

      if (paymentResult.isFailure) {
        logger.error('Payment gateway error', {
          transactionId: transaction.id,
          error: paymentResult.error.message,
        });

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

      logger.info('Payment gateway response received', {
        transactionId: transaction.id,
        paymentStatus: payment.status,
        externalPaymentId: payment.transactionId,
      });

      // 7. Update transaction based on payment status
      if (payment.status === 'APPROVED') {
        // 7a. Approve transaction
        const approveResult = transaction.approve(payment.transactionId);
        if (approveResult.isFailure) {
          logger.error('Failed to approve transaction', {
            transactionId: transaction.id,
            error: approveResult.error.message,
          });
          return Result.fail(
            new PaymentProcessingError(
              `Failed to approve transaction: ${approveResult.error.message}`,
              { transactionId: transaction.id, paymentId: payment.transactionId }
            )
          );
        }

        logger.info('Transaction approved, updating stock', {
          transactionId: transaction.id,
          productId: product.id,
          currentStock: product.stock,
        });

        // 7b. Decrease product stock (CRITICAL BUSINESS LOGIC)
        const decreaseStockResult = product.decreaseStock(1);
        if (decreaseStockResult.isFailure) {
          logger.error('Failed to decrease product stock', {
            transactionId: transaction.id,
            productId: product.id,
            error: decreaseStockResult.error.message,
          });
          return Result.fail(
            new StockUpdateError(
              `Failed to decrease stock: ${decreaseStockResult.error.message}`,
              {
                transactionId: transaction.id,
                productId: product.id,
              }
            )
          );
        }

        // 7c. Persist updated product stock
        const updateProductResult = await this.productRepository.update(product);
        if (updateProductResult.isFailure) {
          logger.error('Failed to persist stock update', {
            transactionId: transaction.id,
            productId: product.id,
            error: updateProductResult.error.message,
          });
          return Result.fail(
            new StockUpdateError(
              `Failed to persist stock update: ${updateProductResult.error.message}`,
              {
                transactionId: transaction.id,
                productId: product.id,
              }
            )
          );
        }

        logger.info('Stock updated successfully', {
          transactionId: transaction.id,
          productId: product.id,
          newStock: product.stock,
        });
      } else if (payment.status === 'DECLINED') {
        logger.info('Payment declined, stock unchanged', {
          transactionId: transaction.id,
          externalPaymentId: payment.transactionId,
        });

        const declineResult = transaction.decline(payment.transactionId);
        if (declineResult.isFailure) {
          return Result.fail(
            new PaymentProcessingError(
              `Failed to decline transaction: ${declineResult.error.message}`,
              { transactionId: transaction.id, paymentId: payment.transactionId }
            )
          );
        }
      } else if (payment.status === 'PENDING') {
        // PENDING status - reserve stock immediately to prevent overselling
        logger.info('Payment pending, reserving stock', {
          transactionId: transaction.id,
          externalPaymentId: payment.transactionId,
          productId: product.id,
          currentStock: product.stock,
        });

        // Reserve stock atomically at database level
        const reserveStockResult = await this.productRepository.reserveStock(product.id, 1);
        if (reserveStockResult.isFailure) {
          logger.error('Failed to reserve stock for pending payment', {
            transactionId: transaction.id,
            productId: product.id,
            error: reserveStockResult.error.message,
          });
          return Result.fail(
            new StockUpdateError(
              `Failed to reserve stock: ${reserveStockResult.error.message}`,
              {
                transactionId: transaction.id,
                productId: product.id,
              }
            )
          );
        }

        logger.info('Stock reserved successfully for pending payment', {
          transactionId: transaction.id,
          productId: product.id,
        });

        const setIdResult = transaction.setExternalPaymentId(payment.transactionId);
        if (setIdResult.isFailure) {
          return Result.fail(
            new PaymentProcessingError(
              `Failed to set external payment ID: ${setIdResult.error.message}`,
              { transactionId: transaction.id, paymentId: payment.transactionId }
            )
          );
        }
      } else {
        // Other statuses - keep transaction as is
        logger.info('Payment in other status, stock unchanged', {
          transactionId: transaction.id,
          externalPaymentId: payment.transactionId,
          status: payment.status,
        });

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

      // 8. Save updated transaction
      const updateResult = await this.transactionRepository.update(transaction);

      if (updateResult.isFailure) {
        logger.error('Failed to update transaction', {
          transactionId: transaction.id,
          error: updateResult.error.message,
        });
        return Result.fail(
          new PaymentProcessingError(
            `Failed to update transaction after payment: ${updateResult.error.message}`,
            { transactionId: transaction.id, paymentId: payment.transactionId }
          )
        );
      }

      logger.info('Payment processing completed successfully', {
        transactionId: transaction.id,
        status: transaction.status,
        externalPaymentId: transaction.externalPaymentId,
      });

      // 9. Return payment result
      return Result.ok(PaymentResultDto.fromEntity(transaction));
    } catch (error) {
      const err = error as Error;
      logger.error('Unexpected error during payment processing', {
        error: err.message,
        stack: err.stack,
      });
      return Result.fail(
        new PaymentProcessingError(`Unexpected error during payment processing: ${err.message}`, {
          error: err.message,
          stack: err.stack,
        })
      );
    }
  }
}
