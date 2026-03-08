import { IDatabaseTransaction } from '../../domain/repositories/database-transaction.repository';
import { PrismaService } from '../database/prisma.service';

/**
 * Database Transaction Adapter (Prisma Implementation)
 *
 * Implements the IDatabaseTransaction port using Prisma's transaction mechanism.
 * Provides atomic execution of multiple database operations with automatic rollback on errors.
 *
 * Uses Prisma's interactive transaction API ($transaction) which:
 * - Ensures all operations succeed together or all fail together (atomicity)
 * - Automatically rolls back on errors
 * - Provides isolation between concurrent transactions
 *
 * **Validates: Requirements 6.8, 6.9, 18.1, 18.2**
 *
 * @example
 * ```typescript
 * const dbTransaction = new DatabaseTransactionAdapter(prisma);
 *
 * const result = await dbTransaction.execute(async () => {
 *   await transactionRepo.update(transaction);
 *   await productRepo.updateStock(productId, newStock);
 *   return transaction;
 * });
 * ```
 */
export class DatabaseTransactionAdapter implements IDatabaseTransaction {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a callback function within a database transaction
   *
   * All database operations performed within the callback are executed atomically.
   * If the callback completes successfully, all changes are committed.
   * If the callback throws an error or returns a rejected promise, all changes are rolled back.
   *
   * @param callback - Async function containing database operations to execute atomically
   * @returns Promise resolving to the callback's return value
   * @throws Error if the transaction fails or is rolled back
   *
   * **Validates: Requirements 6.8, 6.9, 18.1, 18.2**
   */
  async execute<T>(callback: () => Promise<T>): Promise<T> {
    try {
      // Use Prisma's interactive transaction API
      // This ensures atomicity and automatic rollback on errors
      const result = await this.prisma.$transaction(async () => {
        return await callback();
      });

      return result;
    } catch (error) {
      // Transaction was rolled back due to an error
      // Re-throw the error to propagate it to the caller
      throw new Error(
        `Transaction failed and was rolled back: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
