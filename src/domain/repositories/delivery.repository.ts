import { Result } from '../../shared/result';
import { RepositoryError } from '../errors/repository.error';
import { Delivery } from '../entities/delivery.entity';

/**
 * Delivery Repository Interface (Port)
 *
 * Defines the contract for delivery data persistence operations.
 * This is a port in the hexagonal architecture - the infrastructure layer
 * provides the adapter implementation.
 *
 * **Validates: Requirements 4.1, 4.3, 4.5**
 */
export interface IDeliveryRepository {
  /**
   * Finds a delivery by its unique identifier
   *
   * @param id - The delivery UUID
   * @returns Result containing the Delivery or RepositoryError if not found or database error
   *
   * **Validates: Requirements 4.1**
   */
  findById(id: string): Promise<Result<Delivery, RepositoryError>>;

  /**
   * Persists a new delivery to the database
   *
   * @param delivery - The Delivery entity to save
   * @returns Result containing the saved Delivery or RepositoryError on database error
   *
   * **Validates: Requirements 4.5**
   */
  save(delivery: Delivery): Promise<Result<Delivery, RepositoryError>>;

  /**
   * Finds all deliveries associated with a specific customer
   *
   * @param customerId - The customer UUID
   * @returns Result containing array of Deliveries or RepositoryError on database error
   *
   * **Validates: Requirements 4.3**
   */
  findByCustomerId(customerId: string): Promise<Result<Delivery[], RepositoryError>>;
}
