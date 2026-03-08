import { ProcessPaymentUseCase } from '../../../src/application/use-cases/process-payment.use-case';
import { ProcessPaymentDto } from '../../../src/application/dtos/transaction.dto';
import { Transaction, TransactionStatus } from '../../../src/domain/entities/transaction.entity';
import { Product } from '../../../src/domain/entities/product.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Result } from '../../../src/shared/result';

/**
 * Comprehensive unit tests for ProcessPaymentUseCase
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 13.1, 13.2, 13.3, 2.2, 2.3**
 */
describe('ProcessPaymentUseCase - Complete Tests', () => {
  let useCase: ProcessPaymentUseCase;
  let mockTransactionRepository: any;
  let mockProductRepository: any;
  let mockPaymentGateway: any;

  beforeEach(() => {
    // Mock repositories and gateway
    mockTransactionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByExternalPaymentId: jest.fn(),
    };

    mockProductRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      updateStock: jest.fn(),
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

  describe('execute - Successful Payment with Stock Update', () => {
    it('should process approved payment and decrease product stock', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      const product = Product.create({
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test Description',
        price: amount,
        stock: 10,
      }).value;

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transaction));
      mockProductRepository.findById.mockResolvedValue(Result.ok(product));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.ok({
          transactionId: 'wompi-123',
          status: 'APPROVED',
          authorizationCode: 'AUTH-123',
          message: 'Payment approved',
        })
      );
      mockTransactionRepository.update.mockResolvedValue(Result.ok(transaction));
      mockProductRepository.update.mockResolvedValue(Result.ok(product));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith('trans-123');
      expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-123');
      expect(mockPaymentGateway.processPayment).toHaveBeenCalled();
      expect(mockProductRepository.update).toHaveBeenCalled();
      expect(mockTransactionRepository.update).toHaveBeenCalled();

      // Verify stock was decreased
      const updatedProduct = mockProductRepository.update.mock.calls[0][0];
      expect(updatedProduct.stock).toBe(9); // 10 - 1 = 9
    });

    it('should not decrease stock when payment is declined', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      const product = Product.create({
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test Description',
        price: amount,
        stock: 10,
      }).value;

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transaction));
      mockProductRepository.findById.mockResolvedValue(Result.ok(product));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.ok({
          transactionId: 'wompi-123',
          status: 'DECLINED',
          authorizationCode: null,
          message: 'Payment declined',
        })
      );
      mockTransactionRepository.update.mockResolvedValue(Result.ok(transaction));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockProductRepository.update).not.toHaveBeenCalled(); // Stock should NOT be updated
      expect(mockTransactionRepository.update).toHaveBeenCalled();
    });

    it('should not decrease stock when payment is pending', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      const product = Product.create({
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test Description',
        price: amount,
        stock: 10,
      }).value;

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transaction));
      mockProductRepository.findById.mockResolvedValue(Result.ok(product));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.ok({
          transactionId: 'wompi-123',
          status: 'PENDING',
          authorizationCode: null,
          message: 'Payment pending',
        })
      );
      mockTransactionRepository.update.mockResolvedValue(Result.ok(transaction));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockProductRepository.update).not.toHaveBeenCalled(); // Stock should NOT be updated
      expect(mockTransactionRepository.update).toHaveBeenCalled();
    });
  });

  describe('execute - Error Scenarios', () => {
    it('should fail when transaction not found', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-999',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      mockTransactionRepository.findById.mockResolvedValue(
        Result.fail(new Error('Transaction not found'))
      );

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('not found');
    });

    it('should fail when product not found', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-999',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transaction));
      mockProductRepository.findById.mockResolvedValue(
        Result.fail(new Error('Product not found'))
      );

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('not found');
    });

    it('should fail when product is out of stock', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      const product = Product.create({
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test Description',
        price: amount,
        stock: 0, // Out of stock
      }).value;

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transaction));
      mockProductRepository.findById.mockResolvedValue(Result.ok(product));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('out of stock');
      expect(mockPaymentGateway.processPayment).not.toHaveBeenCalled();
    });

    it('should fail when transaction is not in PENDING status', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Approve transaction to change status
      transaction.approve('wompi-123');

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transaction));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('state');
    });

    it('should fail when payment gateway returns error', async () => {
      // Arrange
      const dto: ProcessPaymentDto = {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
      };

      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      const product = Product.create({
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test Description',
        price: amount,
        stock: 10,
      }).value;

      mockTransactionRepository.findById.mockResolvedValue(Result.ok(transaction));
      mockProductRepository.findById.mockResolvedValue(Result.ok(product));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.fail(new Error('Payment gateway error'))
      );
      mockTransactionRepository.update.mockResolvedValue(Result.ok(transaction));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('failed');
      expect(mockTransactionRepository.update).toHaveBeenCalled(); // Transaction should be marked as FAILED
    });
  });
});
