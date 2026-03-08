import { Request, Response, NextFunction } from 'express';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from '../../application/use-cases/get-transaction-by-id.use-case';
import { CreateTransactionDto } from '../../application/dtos/transaction.dto';
import { logger } from '../../shared/utils/logger';

/**
 * Transaction Controller
 *
 * Handles HTTP requests for transaction-related operations.
 * Maps use case results to appropriate HTTP responses.
 *
 * **Validates: Requirements 5.1, 9.1, 9.2, 9.3**
 */
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase
  ) {}

  /**
   * POST /transactions
   *
   * Creates a new transaction with customer and delivery information.
   *
   * @param req - Express request object with CreateTransactionDto in body
   * @param res - Express response object
   * @param next - Express next function
   *
   * **Validates: Requirements 5.1**
   */
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateTransactionDto = req.body;

      logger.info('Creating new transaction', {
        correlationId: req.correlationId,
        productId: dto.productId,
        customerEmail: dto.customerEmail,
        paymentMethod: dto.paymentMethod,
        method: req.method,
        path: req.path,
      });

      const result = await this.createTransactionUseCase.execute(dto);

      if (result.isFailure) {
        logger.error('Failed to create transaction', {
          correlationId: req.correlationId,
          productId: dto.productId,
          customerEmail: dto.customerEmail,
          error: result.error.message,
        });
        return next(result.error);
      }

      const transaction = result.value;

      logger.info('Successfully created transaction', {
        correlationId: req.correlationId,
        transactionId: transaction.id,
        productId: transaction.productId,
        customerId: transaction.customerId,
        totalAmount: transaction.totalAmount,
        currency: transaction.currency,
        status: transaction.status,
      });

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Unexpected error in createTransaction', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  /**
   * GET /transactions/:id
   *
   * Retrieves a specific transaction by its ID.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactionId = req.params.id;

      logger.info('Getting transaction by ID', {
        correlationId: req.correlationId,
        transactionId,
        method: req.method,
        path: req.path,
      });

      // Basic UUID validation
      if (!transactionId || !isValidUUID(transactionId)) {
        logger.warn('Invalid transaction ID format', {
          correlationId: req.correlationId,
          transactionId,
        });

        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Invalid transaction ID format. Must be a valid UUID.',
          timestamp: new Date().toISOString(),
          correlationId: req.correlationId,
        });
        return;
      }

      const result = await this.getTransactionByIdUseCase.execute(transactionId);

      if (result.isFailure) {
        logger.error('Failed to get transaction by ID', {
          correlationId: req.correlationId,
          transactionId,
          error: result.error.message,
        });
        return next(result.error);
      }

      const transaction = result.value;

      logger.info('Successfully retrieved transaction', {
        correlationId: req.correlationId,
        transactionId: transaction.id,
        status: transaction.status,
        totalAmount: transaction.totalAmount,
        currency: transaction.currency,
      });

      res.status(200).json({
        success: true,
        data: transaction,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Unexpected error in getTransactionById', {
        correlationId: req.correlationId,
        transactionId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }
}

/**
 * Validates if a string is a valid UUID format
 *
 * @param uuid - String to validate
 * @returns True if valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default TransactionController;
