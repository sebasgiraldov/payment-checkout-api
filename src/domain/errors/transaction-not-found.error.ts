import { ApplicationError } from './application.error';

/**
 * TransactionNotFoundError represents a situation where a requested transaction
 * does not exist in the system
 */
export class TransactionNotFoundError extends ApplicationError {
  constructor(public readonly transactionId: string) {
    super(`Transaction with id ${transactionId} not found`, {
      transactionId,
    });
  }
}
