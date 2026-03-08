import { Result } from '../../shared/result';
import { RepositoryError } from '../errors/repository.error';
import { Customer, CustomerProps } from '../entities/customer.entity';

/**
 * Customer Repository Interface (Port)
 *
 * Defines the contract for customer data persistence operations.
 * This is a port in the hexagonal architecture - the infrastructure layer
 * provides the adapter implementation.
 *
 * **Validates: Requirements 3.1, 3.4, 3.5**
 */
export interface ICustomerRepository {
  /**
   * Finds a customer by their unique identifier
   *
   * @param id - The customer UUID
   * @returns Result containing the Customer or RepositoryError if not found or database error
   *
   * **Validates: Requirements 3.1**
   */
  findById(id: string): Promise<Result<Customer, RepositoryError>>;

  /**
   * Finds a customer by their email address
   *
   * @param email - The customer email
   * @returns Result containing the Customer or null if not found, or RepositoryError on database error
   *
   * **Validates: Requirements 3.4**
   */
  findByEmail(email: string): Promise<Result<Customer | null, RepositoryError>>;

  /**
   * Persists a new customer to the database
   *
   * @param customer - The Customer entity to save
   * @returns Result containing the saved Customer or RepositoryError on database error
   *
   * **Validates: Requirements 3.5**
   */
  save(customer: Customer): Promise<Result<Customer, RepositoryError>>;

  /**
   * Finds an existing customer by email or creates a new one if not found
   *
   * This method implements the find-or-create pattern for the checkout flow,
   * ensuring idempotent customer creation based on email address.
   *
   * @param props - Customer properties for creation if not found
   * @returns Result containing the found or created Customer or RepositoryError on database error
   *
   * **Validates: Requirements 3.4, 3.5**
   */
  findOrCreate(props: CustomerProps): Promise<Result<Customer, RepositoryError>>;
}
