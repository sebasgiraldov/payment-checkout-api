import { Result } from '../../shared/result';
import { RepositoryError } from '../errors/repository.error';
import { Product } from '../entities/product.entity';

/**
 * Product Repository Interface (Port)
 *
 * Defines the contract for product data persistence operations.
 * This is a port in the hexagonal architecture - the infrastructure layer
 * provides the adapter implementation.
 *
 * **Validates: Requirements 1.1, 1.2, 2.2**
 */
export interface IProductRepository {
  /**
   * Finds a product by its unique identifier
   *
   * @param id - The product UUID
   * @returns Result containing the Product or RepositoryError if not found or database error
   *
   * **Validates: Requirements 1.2**
   */
  findById(id: string): Promise<Result<Product, RepositoryError>>;

  /**
   * Retrieves all products from the catalog
   *
   * @returns Result containing array of Products or RepositoryError on database error
   *
   * **Validates: Requirements 1.1**
   */
  findAll(): Promise<Result<Product[], RepositoryError>>;

  /**
   * Persists a new product to the database
   *
   * @param product - The Product entity to save
   * @returns Result containing the saved Product or RepositoryError on database error
   */
  save(product: Product): Promise<Result<Product, RepositoryError>>;

  /**
   * Updates an existing product in the database
   *
   * @param product - The Product entity with updated values
   * @returns Result containing the updated Product or RepositoryError on database error
   */
  update(product: Product): Promise<Result<Product, RepositoryError>>;

  /**
   * Updates the stock level for a specific product
   *
   * @param productId - The product UUID
   * @param newStock - The new stock quantity (must be non-negative)
   * @returns Result indicating success or RepositoryError on database error
   *
   * **Validates: Requirements 2.2**
   */
  updateStock(productId: string, newStock: number): Promise<Result<void, RepositoryError>>;
}
