import { ProcessPaymentUseCase } from '../../../src/application/use-cases/process-payment.use-case';
import { ITransactionRepository } from '../../../src/domain/repositories/transaction.repository';
import { IProductRepository } from '../../../src/domain/repositories/product.repository';
import { IPaymentGateway, PaymentResponse } from '../../../src/domain/services/payment-gateway.interface';
import { Transaction } from '../../../src/domain/entities/transaction.entity';
import { Product } from '../../../src/domain/entities/product.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Result } from '../../../src/shared/result';
import { ProcessPaymentDto } from '../../../src/application/dtos/transaction.dto';
import { RepositoryError } from '../../../src/domain/errors/repository.error';

/**
 * Unit tests for ProcessPaymentUseCase
 * 
 * **Validates: Requirements 6.1, 6.2, 6.4, 6.5, 6.6, 7.1, 7.2**
 */
describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let mockTransactionRepository: jest.Mocked<ITransactionRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;

  beforeEach(() => {
    mockTransactionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByExternalPaymentId: jest.fn(),
    };

    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      updateStock: jest.fn(),
      reserveStock: jest.fn(),
    };

    mockPaymentGateway = {
      processPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
    };

    useCase = new ProcessPaymentUseCase(
      mockTransactionRepository,
      mockProductRepository,
      mockPaymentGateway
    );
  });

  describe('execute', () => {
    it('should process payment successfully when approved', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'transaction-id',
        cardNumber: '4111111111111111',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        customerEmail: 'john@example.com',
        idempotencyKey: 'idempotency-key',
      };

      const moneyResult = Money.create(100, 'USD');
      const baseFeeResult = Money.create(5, 'USD');
      const deliveryFeeResult = Money.create(10, 'USD');

      const transactionResult = Transaction.create({
        id: dto.transactionId,
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

      const productResult = Product.create({
        id: 'product-id',
        name: 'Test Product',
        description: 'Test Description',
        price: moneyResult.value,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const paymentResponse: PaymentResponse = {
        transactionId: 'external-payment-id',
        status: 'APPROVED',
        message: 'Payment approved',
      };

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transactionResult.value));
      mockProductRepository.findById.mockResolvedValue(Result.ok(productResult.value));
      mockPaymentGateway.processPayment.mockResolvedValue(Result.ok(paymentResponse));
      mockTransactionRepository.update.mockResolvedValue(Result.ok(transactionResult.value));
      mockProductRepository.update.mockResolvedValue(Result.ok(productResult.value));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('APPROVED');
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(dto.transactionId);
      expect(mockPaymentGateway.processPayment).toHaveBeenCalled();
      expect(mockTransactionRepository.update).toHaveBeenCalled();
      expect(mockProductRepository.update).toHaveBeenCalled();
    });

    it('should handle declined payment without decreasing stock', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'transaction-id',
        cardNumber: '4111111111111111',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        customerEmail: 'john@example.com',
        idempotencyKey: 'idempotency-key',
      };

      const moneyResult = Money.create(100, 'USD');
      const baseFeeResult = Money.create(5, 'USD');
      const deliveryFeeResult = Money.create(10, 'USD');

      const transactionResult = Transaction.create({
        id: dto.transactionId,
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

      const productResult = Product.create({
        id: 'product-id',
        name: 'Test Product',
        description: 'Test Description',
        price: moneyResult.value,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const paymentResponse: PaymentResponse = {
        transactionId: 'external-payment-id',
        status: 'DECLINED',
        message: 'Insufficient funds',
      };

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transactionResult.value));
      mockProductRepository.findById.mockResolvedValue(Result.ok(productResult.value));
      mockPaymentGateway.processPayment.mockResolvedValue(Result.ok(paymentResponse));
      mockTransactionRepository.update.mockResolvedValue(Result.ok(transactionResult.value));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('DECLINED');
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(dto.transactionId);
      expect(mockPaymentGateway.processPayment).toHaveBeenCalled();
      expect(mockTransactionRepository.update).toHaveBeenCalled();
      expect(mockProductRepository.update).not.toHaveBeenCalled(); // Stock should not be updated
    });

    it('should return error when transaction not found', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'non-existent-id',
        cardNumber: '4111111111111111',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        customerEmail: 'john@example.com',
        idempotencyKey: 'idempotency-key',
      };

      mockTransactionRepository.findById.mockResolvedValue(
        Result.fail(new RepositoryError('Transaction not found'))
      );

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('not found');
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(dto.transactionId);
      expect(mockPaymentGateway.processPayment).not.toHaveBeenCalled();
    });

    it('should handle idempotency - return existing result for non-pending transaction', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'transaction-id',
        cardNumber: '4111111111111111',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        customerEmail: 'john@example.com',
        idempotencyKey: 'idempotency-key',
      };

      const moneyResult = Money.create(100, 'USD');
      const baseFeeResult = Money.create(5, 'USD');
      const deliveryFeeResult = Money.create(10, 'USD');

      const transactionResult = Transaction.create({
        id: dto.transactionId,
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

      // Approve the transaction first
      transactionResult.value.approve('external-payment-id');

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transactionResult.value));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('APPROVED');
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(dto.transactionId);
      expect(mockPaymentGateway.processPayment).not.toHaveBeenCalled(); // Should not process again
    });

    it('should fail when product has insufficient stock', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'transaction-id',
        cardNumber: '4111111111111111',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        customerEmail: 'john@example.com',
        idempotencyKey: 'idempotency-key',
      };

      const moneyResult = Money.create(100, 'USD');
      const baseFeeResult = Money.create(5, 'USD');
      const deliveryFeeResult = Money.create(10, 'USD');

      const transactionResult = Transaction.create({
        id: dto.transactionId,
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

      const productResult = Product.create({
        id: 'product-id',
        name: 'Test Product',
        description: 'Test Description',
        price: moneyResult.value,
        stock: 0, // No stock
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transactionResult.value));
      mockProductRepository.findById.mockResolvedValue(Result.ok(productResult.value));
      mockTransactionRepository.update.mockResolvedValue(Result.ok(transactionResult.value));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('out of stock');
      expect(mockPaymentGateway.processPayment).not.toHaveBeenCalled();
    });
  });
});
