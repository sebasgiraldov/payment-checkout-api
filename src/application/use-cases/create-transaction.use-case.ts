import { Result } from '../../shared/result';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository';
import { IProductRepository } from '../../domain/repositories/product.repository';
import { ICustomerRepository } from '../../domain/repositories/customer.repository';
import { IDeliveryRepository } from '../../domain/repositories/delivery.repository';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Delivery } from '../../domain/entities/delivery.entity';
import { Money } from '../../domain/value-objects/money.value-object';
import { InsufficientStockError } from '../../domain/errors/insufficient-stock.error';
import { CreateTransactionDto, TransactionDto } from '../dtos/transaction.dto';
import {
  ApplicationError,
  ProductNotFoundError,
  CustomerCreationError,
  DeliveryCreationError,
  TransactionCreationError,
} from '../errors/application.error';

/**
 * CreateTransactionUseCase
 *
 * Creates a new transaction with customer and delivery information.
 * Validates product exists and has stock before creating the transaction.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly productRepository: IProductRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly deliveryRepository: IDeliveryRepository
  ) {}

  /**
   * Executes the use case to create a new transaction
   *
   * @param dto - Transaction creation data
   * @returns Result containing TransactionDto or ApplicationError
   *
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
   */
  async execute(dto: CreateTransactionDto): Promise<Result<TransactionDto, ApplicationError>> {
    // 1. Validate product exists and has stock (Requirements 5.3, 5.4)
    const productResult = await this.productRepository.findById(dto.productId);
    if (productResult.isFailure) {
      return Result.fail(new ProductNotFoundError(dto.productId));
    }

    const product = productResult.value;
    if (!product.hasStock(1)) {
      return Result.fail(
        new InsufficientStockError(
          product.id,
          product.stock,
          1
        )
      );
    }

    // 2. Create or get customer (Requirement 5.1)
    const customerResult = await this.customerRepository.findOrCreate({
      name: dto.customerName,
      email: dto.customerEmail,
      phone: dto.customerPhone,
    });

    if (customerResult.isFailure) {
      return Result.fail(new CustomerCreationError(customerResult.error.message));
    }

    const customer = customerResult.value;

    // 3. Create delivery fee Money object
    const deliveryFeeResult = Money.create(dto.deliveryFee, dto.currency);
    if (deliveryFeeResult.isFailure) {
      return Result.fail(new DeliveryCreationError(deliveryFeeResult.error.message));
    }

    // 4. Create delivery (Requirement 5.1)
    const deliveryResult = Delivery.create({
      customerId: customer.id,
      address: dto.deliveryAddress,
      city: dto.deliveryCity,
      state: dto.deliveryState || '',
      country: dto.deliveryCountry,
      postalCode: dto.deliveryPostalCode,
      deliveryFee: deliveryFeeResult.value,
    });

    if (deliveryResult.isFailure) {
      return Result.fail(new DeliveryCreationError(deliveryResult.error.message));
    }

    const savedDeliveryResult = await this.deliveryRepository.save(deliveryResult.value);
    if (savedDeliveryResult.isFailure) {
      return Result.fail(new DeliveryCreationError(savedDeliveryResult.error.message));
    }

    const delivery = savedDeliveryResult.value;

    // 5. Create base fee Money object
    const baseFeeResult = Money.create(dto.baseFee, dto.currency);
    if (baseFeeResult.isFailure) {
      return Result.fail(new TransactionCreationError(baseFeeResult.error.message));
    }

    // 6. Create transaction (Requirements 5.1, 5.2, 5.6)
    const transactionResult = Transaction.create({
      productId: product.id,
      customerId: customer.id,
      deliveryId: delivery.id,
      amount: product.price,
      baseFee: baseFeeResult.value,
      deliveryFee: deliveryFeeResult.value,
      paymentMethod: dto.paymentMethod,
    });

    if (transactionResult.isFailure) {
      return Result.fail(new TransactionCreationError(transactionResult.error.message));
    }

    // 7. Save transaction
    const savedTransactionResult = await this.transactionRepository.save(transactionResult.value);
    if (savedTransactionResult.isFailure) {
      return Result.fail(new TransactionCreationError(savedTransactionResult.error.message));
    }

    return Result.ok(TransactionDto.fromEntity(savedTransactionResult.value));
  }
}
