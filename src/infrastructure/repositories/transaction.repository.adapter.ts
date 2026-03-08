import { Prisma } from '@prisma/client';
import { Result } from '../../shared/result';
import { RepositoryError } from '../../domain/errors/repository.error';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { Money } from '../../domain/value-objects/money.value-object';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository';
import { PrismaService } from '../database/prisma.service';

/**
 * Transaction Repository Adapter (Prisma Implementation)
 *
 * Implements the ITransactionRepository port using Prisma ORM.
 * Handles mapping between Prisma models and domain entities.
 * Manages foreign key constraints for product, customer, and delivery references.
 *
 * **Validates: Requirements 5.1, 6.7, 7.2, 18.3**
 */
export class TransactionRepositoryAdapter implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a transaction by its unique identifier
   *
   * @param id - The transaction UUID
   * @returns Result containing the Transaction or RepositoryError
   */
  async findById(id: string): Promise<Result<Transaction, RepositoryError>> {
    try {
      const transactionModel = await this.prisma.transaction.findUnique({
        where: { id },
      });

      if (!transactionModel) {
        return Result.fail(new RepositoryError(`Transaction with id ${id} not found`, { id }));
      }

      return this.mapToDomain(transactionModel);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find transaction: ${(error as Error).message}`, {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Persists a new transaction to the database
   *
   * Handles foreign key constraints for product, customer, and delivery references.
   *
   * @param transaction - The Transaction entity to save
   * @returns Result containing the saved Transaction or RepositoryError
   */
  async save(transaction: Transaction): Promise<Result<Transaction, RepositoryError>> {
    try {
      const transactionModel = await this.prisma.transaction.create({
        data: {
          id: transaction.id,
          productId: transaction.productId,
          customerId: transaction.customerId,
          deliveryId: transaction.deliveryId,
          amount: new Prisma.Decimal(transaction.amount.amount),
          baseFee: new Prisma.Decimal(transaction.baseFee.amount),
          deliveryFee: new Prisma.Decimal(transaction.deliveryFee.amount),
          totalAmount: new Prisma.Decimal(transaction.totalAmount.amount),
          currency: transaction.amount.currency,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          externalPaymentId: transaction.externalPaymentId,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      });

      return this.mapToDomain(transactionModel);
    } catch (error) {
      // Handle foreign key constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          return Result.fail(
            new RepositoryError('Foreign key constraint violation: referenced entity not found', {
              transactionId: transaction.id,
              productId: transaction.productId,
              customerId: transaction.customerId,
              deliveryId: transaction.deliveryId,
            })
          );
        }
      }

      return Result.fail(
        new RepositoryError(`Failed to save transaction: ${(error as Error).message}`, {
          transactionId: transaction.id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Updates an existing transaction in the database
   *
   * @param transaction - The Transaction entity with updated values
   * @returns Result containing the updated Transaction or RepositoryError
   */
  async update(transaction: Transaction): Promise<Result<Transaction, RepositoryError>> {
    try {
      const transactionModel = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: transaction.status,
          externalPaymentId: transaction.externalPaymentId,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(transactionModel);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return Result.fail(
            new RepositoryError(`Transaction with id ${transaction.id} not found`, {
              transactionId: transaction.id,
            })
          );
        }
      }

      return Result.fail(
        new RepositoryError(`Failed to update transaction: ${(error as Error).message}`, {
          transactionId: transaction.id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Finds a transaction by its external payment gateway ID
   *
   * This method supports idempotency by allowing lookup of transactions
   * that have already been processed by the payment gateway.
   *
   * @param externalId - The external payment gateway transaction ID
   * @returns Result containing the Transaction or null if not found, or RepositoryError on database error
   */
  async findByExternalPaymentId(
    externalId: string
  ): Promise<Result<Transaction | null, RepositoryError>> {
    try {
      const transactionModel = await this.prisma.transaction.findFirst({
        where: { externalPaymentId: externalId },
      });

      if (!transactionModel) {
        return Result.ok(null);
      }

      const transactionResult = this.mapToDomain(transactionModel);
      if (transactionResult.isFailure) {
        return Result.fail(transactionResult.error);
      }

      return Result.ok(transactionResult.value);
    } catch (error) {
      return Result.fail(
        new RepositoryError(
          `Failed to find transaction by external payment ID: ${(error as Error).message}`,
          {
            externalPaymentId: externalId,
            error: error instanceof Error ? error.message : String(error),
          }
        )
      );
    }
  }

  /**
   * Maps a Prisma Transaction model to a domain Transaction entity
   *
   * @param model - The Prisma transaction model
   * @returns Result containing Transaction entity or RepositoryError
   */
  private mapToDomain(model: {
    id: string;
    productId: string;
    customerId: string;
    deliveryId: string;
    amount: Prisma.Decimal;
    baseFee: Prisma.Decimal;
    deliveryFee: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    currency: string;
    status: string;
    paymentMethod: string;
    externalPaymentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Result<Transaction, RepositoryError> {
    // Convert Prisma Decimals to numbers
    const amountValue = model.amount.toNumber();
    const baseFeeValue = model.baseFee.toNumber();
    const deliveryFeeValue = model.deliveryFee.toNumber();

    // Create Money value objects
    const amountResult = Money.create(amountValue, model.currency);
    if (amountResult.isFailure) {
      return Result.fail(
        new RepositoryError(
          `Failed to create amount Money value object: ${amountResult.error.message}`,
          {
            transactionId: model.id,
            amount: amountValue,
            currency: model.currency,
          }
        )
      );
    }

    const baseFeeResult = Money.create(baseFeeValue, model.currency);
    if (baseFeeResult.isFailure) {
      return Result.fail(
        new RepositoryError(
          `Failed to create baseFee Money value object: ${baseFeeResult.error.message}`,
          {
            transactionId: model.id,
            baseFee: baseFeeValue,
            currency: model.currency,
          }
        )
      );
    }

    const deliveryFeeResult = Money.create(deliveryFeeValue, model.currency);
    if (deliveryFeeResult.isFailure) {
      return Result.fail(
        new RepositoryError(
          `Failed to create deliveryFee Money value object: ${deliveryFeeResult.error.message}`,
          {
            transactionId: model.id,
            deliveryFee: deliveryFeeValue,
            currency: model.currency,
          }
        )
      );
    }

    // Create Transaction entity
    const transactionResult = Transaction.create({
      id: model.id,
      productId: model.productId,
      customerId: model.customerId,
      deliveryId: model.deliveryId,
      amount: amountResult.value,
      baseFee: baseFeeResult.value,
      deliveryFee: deliveryFeeResult.value,
      paymentMethod: model.paymentMethod,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });

    if (transactionResult.isFailure) {
      return Result.fail(
        new RepositoryError(
          `Failed to create Transaction entity: ${transactionResult.error.message}`,
          {
            transactionId: model.id,
          }
        )
      );
    }

    const transaction = transactionResult.value;

    // Apply status and external payment ID if different from defaults
    // (since create() always sets PENDING status and null external payment ID)
    if (model.status !== TransactionStatus.PENDING || model.externalPaymentId !== null) {
      // We need to reconstruct the transaction with the correct status and external payment ID
      // Since the entity enforces state transitions, we'll use a workaround
      // by directly setting the private fields through the constructor
      // This is acceptable in the repository layer for hydration from database
      const hydratedTransaction = Object.create(Transaction.prototype);
      Object.assign(hydratedTransaction, {
        id: transaction.id,
        productId: transaction.productId,
        customerId: transaction.customerId,
        deliveryId: transaction.deliveryId,
        _amount: transaction.amount,
        _baseFee: transaction.baseFee,
        _deliveryFee: transaction.deliveryFee,
        _totalAmount: transaction.totalAmount,
        _status: model.status as TransactionStatus,
        paymentMethod: transaction.paymentMethod,
        _externalPaymentId: model.externalPaymentId,
        createdAt: transaction.createdAt,
        _updatedAt: model.updatedAt,
      });

      return Result.ok(hydratedTransaction);
    }

    return Result.ok(transaction);
  }
}
