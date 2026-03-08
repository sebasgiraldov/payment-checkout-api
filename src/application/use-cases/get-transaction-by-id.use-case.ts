import { Result } from '../../shared/result';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository';
import { TransactionDto } from '../dtos/transaction.dto';
import { ApplicationError, TransactionNotFoundError } from '../errors/application.error';

/**
 * GetTransactionByIdUseCase
 *
 * Retrieves a specific transaction by its ID.
 *
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 */
export class GetTransactionByIdUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  /**
   * Executes the use case to retrieve a transaction by ID
   *
   * @param transactionId - The transaction UUID
   * @returns Result containing TransactionDto or ApplicationError
   *
   * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
   */
  async execute(transactionId: string): Promise<Result<TransactionDto, ApplicationError>> {
    const transactionResult = await this.transactionRepository.findById(transactionId);

    if (transactionResult.isFailure) {
      return Result.fail(new TransactionNotFoundError(transactionId));
    }

    const transaction = transactionResult.value;
    return Result.ok(TransactionDto.fromEntity(transaction));
  }
}
