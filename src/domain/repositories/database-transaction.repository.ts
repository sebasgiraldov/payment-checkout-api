/**
 * Database Transaction Interface (Port)
 *
 * Defines the contract for database transaction management.
 * This interface provides atomic execution of multiple database operations,
 * ensuring all operations succeed together or all fail together (ACID properties).
 *
 * This is a port in the hexagonal architecture - the infrastructure layer
 * provides the adapter implementation using the underlying database transaction mechanism.
 *
 * **Validates: Requirements 6.8, 6.9, 18.1, 18.2**
 *
 * @example
 * ```typescript
 * // Execute multiple operations atomically
 * const result = await databaseTransaction.execute(async () => {
 *   await transactionRepo.update(transaction);
 *   await productRepo.updateStock(productId, newStock);
 *   return transaction;
 * });
 *
 * // If any operation fails, all changes are rolled back
 * ```
 */
export interface IDatabaseTransaction {
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
  execute<T>(callback: () => Promise<T>): Promise<T>;
}
