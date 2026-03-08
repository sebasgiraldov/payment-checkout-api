import { GetTransactionByIdUseCase } from '../../../src/application/use-cases/get-transaction-by-id.use-case';
import { ITransactionRepository } from '../../../src/domain/repositories/transaction.repository';
import { Transaction, TransactionStatus } from '../../../src/domain/entities/transaction.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Result } from '../../../src/shared/result';
import { RepositoryError } from '../../../src/domain/errors/repository.error';
import { TransactionNotFoundError } from '../../../src/application/errors/application.error';

/**
 * Unit tests for GetTransactionByIdUseCase
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 */
describe('GetTransactionByIdUseCase', () => {
  let useCase: GetTransactionByIdUseCase;
  let mockTransactionRepository: jest.Mocked<ITransactionRepository>;

  beforeEach(() => {
    mockTransactionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByExternalPaymentId: jest.fn(),
    };

    useCase = new GetTransactionByIdUseCase(mockTransactionRepository);
  });

  describe('execute', () => {
    it('should return transaction when it exists', async () => {
      // Arrange
      const transactionId = '123e4567-e89b-12d3-a456-426614174000';
      const moneyResult = Money.create(100, 'USD');
      const baseFeeResult = Money.create(5, 'USD');
      const deliveryFeeResult = Money.create(10, 'USD');

      const transactionResult = Transaction.create({
        id: transactionId,
        productId: 'product-id',
        customerId: 'customer-id',
        deliveryId: 'delivery-id',
        amount: moneyResult.value,
        baseFee: baseFeeResult.value,
        deliveryFee: deliveryFeeResult.value,
        paymentMethod: 'CARD',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(transactionResult.isSuccess).toBe(true);
      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transactionResult.value));

      // Act
      const result = await useCase.execute(transactionId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(transactionId);
      expect(result.value.status).toBe('PENDING');
      expect(result.value.productId).toBe('product-id');
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(transactionId);
      expect(mockTransactionRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return TransactionNotFoundError when transaction does not exist', async () => {
      // Arrange
      const transactionId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new RepositoryError('Transaction not found');
      mockTransactionRepository.findById.mockResolvedValue(Result.fail(error));

      // Act
      const result = await useCase.execute(transactionId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(TransactionNotFoundError);
      expect(result.error.message).toContain(transactionId);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(transactionId);
      expect(mockTransactionRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const transactionId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new RepositoryError('Database connection lost');
      mockTransactionRepository.findById.mockResolvedValue(Result.fail(error));

      // Act
      const result = await useCase.execute(transactionId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(TransactionNotFoundError);
      expect(mockTransactionRepository.findById).toHaveBeenCalledTimes(1);
    });
  });
});
