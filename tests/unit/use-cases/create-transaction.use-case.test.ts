import { CreateTransactionUseCase } from '../../../src/application/use-cases/create-transaction.use-case';
import { ITransactionRepository } from '../../../src/domain/repositories/transaction.repository';
import { IProductRepository } from '../../../src/domain/repositories/product.repository';
import { ICustomerRepository } from '../../../src/domain/repositories/customer.repository';
import { IDeliveryRepository } from '../../../src/domain/repositories/delivery.repository';
import { Product } from '../../../src/domain/entities/product.entity';
import { Customer } from '../../../src/domain/entities/customer.entity';
import { Delivery } from '../../../src/domain/entities/delivery.entity';
import { Transaction } from '../../../src/domain/entities/transaction.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Email } from '../../../src/domain/value-objects/email.value-object';
import { Phone } from '../../../src/domain/value-objects/phone.value-object';
import { Address } from '../../../src/domain/value-objects/address.value-object';
import { Result } from '../../../src/shared/result';
import { CreateTransactionDto } from '../../../src/application/dtos/transaction.dto';
import { ProductNotFoundError } from '../../../src/application/errors/application.error';

/**
 * Unit tests for CreateTransactionUseCase
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */
describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let mockTransactionRepository: jest.Mocked<ITransactionRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockCustomerRepository: jest.Mocked<ICustomerRepository>;
  let mockDeliveryRepository: jest.Mocked<IDeliveryRepository>;

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
    };

    mockCustomerRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      findOrCreate: jest.fn(),
    };

    mockDeliveryRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByCustomerId: jest.fn(),
    };

    useCase = new CreateTransactionUseCase(
      mockTransactionRepository,
      mockProductRepository,
      mockCustomerRepository,
      mockDeliveryRepository
    );
  });

  describe('execute', () => {
    it('should create transaction successfully with valid data', async () => {
      // Arrange
      const dto: CreateTransactionDto = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        deliveryAddress: '123 Main St',
        deliveryCity: 'New York',
        deliveryState: 'NY',
        deliveryCountry: 'USA',
        deliveryPostalCode: '10001',
        deliveryFee: 10,
        baseFee: 5,
        currency: 'USD',
        paymentMethod: 'CARD',
      };

      const moneyResult = Money.create(100, 'USD');
      const productResult = Product.create({
        id: dto.productId,
        name: 'Test Product',
        description: 'Test Description',
        price: moneyResult.value,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const emailResult = Email.create(dto.customerEmail);
      const phoneResult = Phone.create(dto.customerPhone);
      const customerResult = Customer.create({
        id: 'customer-id',
        name: dto.customerName,
        email: emailResult.value.value,
        phone: phoneResult.value.value,
        createdAt: new Date(),
      });

      const addressResult = Address.create({
        street: dto.deliveryAddress,
        city: dto.deliveryCity,
        state: dto.deliveryState,
        country: dto.deliveryCountry,
        postalCode: dto.deliveryPostalCode,
      });

      const deliveryFeeResult = Money.create(dto.deliveryFee, dto.currency);
      const deliveryResult = Delivery.create({
        id: 'delivery-id',
        customerId: customerResult.value.id,
        address: dto.deliveryAddress,
        city: dto.deliveryCity,
        state: dto.deliveryState,
        country: dto.deliveryCountry,
        postalCode: dto.deliveryPostalCode,
        deliveryFee: deliveryFeeResult.value,
        createdAt: new Date(),
      });

      const baseFeeResult = Money.create(dto.baseFee, dto.currency);
      const transactionResult = Transaction.create({
        id: 'transaction-id',
        productId: dto.productId,
        customerId: customerResult.value.id,
        deliveryId: deliveryResult.value.id,
        amount: moneyResult.value,
        baseFee: baseFeeResult.value,
        deliveryFee: deliveryFeeResult.value,
        paymentMethod: dto.paymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findById.mockResolvedValue(Result.ok(productResult.value));
      mockCustomerRepository.findOrCreate.mockResolvedValue(Result.ok(customerResult.value));
      mockDeliveryRepository.save.mockResolvedValue(Result.ok(deliveryResult.value));
      mockTransactionRepository.save.mockResolvedValue(Result.ok(transactionResult.value));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.productId).toBe(dto.productId);
      expect(result.value.status).toBe('PENDING');
      expect(mockProductRepository.findById).toHaveBeenCalledWith(dto.productId);
      expect(mockCustomerRepository.findOrCreate).toHaveBeenCalled();
      expect(mockDeliveryRepository.save).toHaveBeenCalled();
      expect(mockTransactionRepository.save).toHaveBeenCalled();
    });

    it('should fail when product does not exist', async () => {
      // Arrange
      const dto: CreateTransactionDto = {
        productId: 'non-existent-id',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        deliveryAddress: '123 Main St',
        deliveryCity: 'New York',
        deliveryState: 'NY',
        deliveryCountry: 'USA',
        deliveryPostalCode: '10001',
        deliveryFee: 10,
        baseFee: 5,
        currency: 'USD',
        paymentMethod: 'CARD',
      };

      mockProductRepository.findById.mockResolvedValue(
        Result.fail(new Error('Product not found'))
      );

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ProductNotFoundError);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(dto.productId);
      expect(mockCustomerRepository.findOrCreate).not.toHaveBeenCalled();
    });

    it('should fail when product has insufficient stock', async () => {
      // Arrange
      const dto: CreateTransactionDto = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        deliveryAddress: '123 Main St',
        deliveryCity: 'New York',
        deliveryState: 'NY',
        deliveryCountry: 'USA',
        deliveryPostalCode: '10001',
        deliveryFee: 10,
        baseFee: 5,
        currency: 'USD',
        paymentMethod: 'CARD',
      };

      const moneyResult = Money.create(100, 'USD');
      const productResult = Product.create({
        id: dto.productId,
        name: 'Test Product',
        description: 'Test Description',
        price: moneyResult.value,
        stock: 0, // No stock
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findById.mockResolvedValue(Result.ok(productResult.value));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('insufficient stock');
      expect(mockProductRepository.findById).toHaveBeenCalledWith(dto.productId);
      expect(mockCustomerRepository.findOrCreate).not.toHaveBeenCalled();
    });
  });
});
