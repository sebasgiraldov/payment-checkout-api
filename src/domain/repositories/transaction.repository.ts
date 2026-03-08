import { Result } from '../../shared/result';
import { RepositoryError } from '../errors/repository.error';
import { Transaction } from '../entities/transaction.entity';

/**
 * Transaction Repository Interface (Port)
 *
 * Defines the contract for transaction data persistence operations.
 * This is a port in the hexagonal architecture - the infrastructure layer
 * provides the adapter implementation.
 *
 * **Validates: Requirements 5.1, 6.7, 7.2, 8.5**
 */
export interface ITransactionRepository {
  /**
   * Finds a transaction by its unique identifier
   *
   * @param id - The transaction UUID
   * @returns Result containing the Transaction or RepositoryError if not found or database error
   *
   * **Validates: Requirements 5.1**
   */
  findById(id: string): Promise<Result<Transaction, RepositoryError>>;

  /**
   * Persists a new transaction to the database
   *
   * @param transaction - The Transaction entity to save
   * @returns Result containing the saved Transaction or RepositoryError on database error
   *
   * **Validates: Requirements 5.1**
   */
  save(transaction: Transaction): Promise<Result<Transaction, RepositoryError>>;

  /**
   * Updates an existing transaction in the database
   *
   * @param transaction - The Transaction entity with updated values
   * @returns Result containing the updated Transaction or RepositoryError on database error
   *
   * **Validates: Requirements 8.5**
   */
  update(transaction: Transaction): Promise<Result<Transaction, RepositoryError>>;

  /**
   * Finds a transaction by its external payment gateway ID
   *
   * This method supports idempotency by allowing lookup of transactions
   * that have already been processed by the payment gateway.
   *
   * @param externalId - The external payment gateway transaction ID
   * @returns Result containing the Transaction or null if not found, or RepositoryError on database error
   *
   * **Validates: Requirements 6.7, 7.2**
   */
  findByExternalPaymentId(externalId: string): Promise<Result<Transaction | null, RepositoryError>>;
}
