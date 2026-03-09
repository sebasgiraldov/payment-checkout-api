import { ProcessPaymentUseCase } from '../../../src/application/use-cases/process-payment.use-case';
import { ITransactionRepository } from '../../../src/domain/repositories/transaction.repository';
import { IProductRepository } from '../../../src/domain/repositories/product.repository';
import { IPaymentGateway } from '../../../src/domain/services/payment-gateway.interface';
import { Transaction, TransactionStatus } from '../../../src/domain/entities/transaction.entity';
import { Product } from '../../../src/domain/entities/product.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Result } from '../../../src/shared/result';
import { ProcessPaymentDto } from '../../../src/application/dtos/transaction.dto';

describe('ProcessPaymentUseCase - Stock Logic', () => {
  let useCase: ProcessPaymentUseCase;
  let mockTransactionRepo: jest.Mocked<ITransactionRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let mockTransaction: Transaction;
  let mockProduct: Product;

  beforeEach(() => {
    // Create mock repositories
    mockTransactionRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
    } as any;

    mockProductRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      updateStock: jest.fn(),
    } as any;

    mockPaymentGateway = {
      processPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
    } as any;

    useCase = new ProcessPaymentUseCase(
      mockTransactionRepo,
      mockProductRepo,
      mockPaymentGateway
    );

    // Create mock product with stock
    const money = Money.create(100000, 'COP').value;
    mockProduct = Product.create({
      id: 'prod-123',
      name: 'Test Product',
      description: 'Test',
      price: money,
      stock: 10,
    }).value;

    // Create mock transaction
    mockTransaction = Transaction.create({
      id: 'trans-123',
      productId: 'prod-123',
      quantity: 1,
      unitPrice: money,
      totalAmount: money,
      status: TransactionStatus.PENDING,
      customerId: 'cust-123',
      deliveryId: 'del-123',
    }).value;
  });

  describe('Stock reduction logic', () => {
    const paymentDto: ProcessPaymentDto = {
      transactionId: 'trans-123',
      cardNumber: '4242424242424242',
      cardHolder: 'John Doe',
      expiryMonth: '12',
      expiryYear: '2028',
      cvv: '123',
      customerEmail: 'john@example.com',
      idempotencyKey: 'idem-123',
    };

    it('should decrease stock when payment is APPROVED', async () => {
      mockTransactionRepo.findById.mockResolvedValue(Result.ok(mockTransaction));
      mockProductRepo.findById.mockResolvedValue(Result.ok(mockProduct));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.ok({
          status: 'APPROVED',
          transactionId: 'wompi-123',
          message: 'Payment approved',
        })
      );
      mockProductRepo.update.mockResolvedValue(Result.ok(mockProduct));
      mockTransactionRepo.update.mockResolvedValue(Result.ok(mockTransaction));

      const initialStock = mockProduct.stock;

      const result = await useCase.execute(paymentDto);

      expect(result.isSuccess).toBe(true);
      expect(mockProduct.stock).toBe(initialStock - 1);
      expect(mockProductRepo.update).toHaveBeenCalledWith(mockProduct);
    });

    it('should NOT decrease stock when payment is PENDING', async () => {
      mockTransactionRepo.findById.mockResolvedValue(Result.ok(mockTransaction));
      mockProductRepo.findById.mockResolvedValue(Result.ok(mockProduct));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.ok({
          status: 'PENDING',
          transactionId: 'wompi-123',
          message: 'Payment pending',
        })
      );
      mockTransactionRepo.update.mockResolvedValue(Result.ok(mockTransaction));

      const initialStock = mockProduct.stock;

      const result = await useCase.execute(paymentDto);

      expect(result.isSuccess).toBe(true);
      expect(mockProduct.stock).toBe(initialStock);
      expect(mockProductRepo.update).not.toHaveBeenCalled();
    });

    it('should NOT decrease stock when payment is DECLINED', async () => {
      mockTransactionRepo.findById.mockResolvedValue(Result.ok(mockTransaction));
      mockProductRepo.findById.mockResolvedValue(Result.ok(mockProduct));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.ok({
          status: 'DECLINED',
          transactionId: 'wompi-123',
          message: 'Payment declined',
        })
      );
      mockTransactionRepo.update.mockResolvedValue(Result.ok(mockTransaction));

      const initialStock = mockProduct.stock;

      const result = await useCase.execute(paymentDto);

      expect(result.isSuccess).toBe(true);
      expect(mockProduct.stock).toBe(initialStock);
      expect(mockProductRepo.update).not.toHaveBeenCalled();
    });

    it('should NOT decrease stock when payment fails', async () => {
      mockTransactionRepo.findById.mockResolvedValue(Result.ok(mockTransaction));
      mockProductRepo.findById.mockResolvedValue(Result.ok(mockProduct));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.fail({
          message: 'Payment gateway error',
        } as any)
      );
      mockTransactionRepo.update.mockResolvedValue(Result.ok(mockTransaction));

      const initialStock = mockProduct.stock;

      const result = await useCase.execute(paymentDto);

      expect(result.isFailure).toBe(true);
      expect(mockProduct.stock).toBe(initialStock);
      expect(mockProductRepo.update).not.toHaveBeenCalled();
    });

    it('should handle stock update failure after approved payment', async () => {
      mockTransactionRepo.findById.mockResolvedValue(Result.ok(mockTransaction));
      mockProductRepo.findById.mockResolvedValue(Result.ok(mockProduct));
      mockPaymentGateway.processPayment.mockResolvedValue(
        Result.ok({
          status: 'APPROVED',
          transactionId: 'wompi-123',
          message: 'Payment approved',
        })
      );
      mockProductRepo.update.mockResolvedValue(
        Result.fail({ message: 'Database error' } as any)
      );

      const result = await useCase.execute(paymentDto);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Failed to persist stock update');
    });
  });
});
