import { Product } from '../../domain/entities/product.entity';

/**
 * Product Data Transfer Object
 *
 * Represents product data for API responses.
 * Maps from Product domain entity to a plain object suitable for JSON serialization.
 *
 * **Validates: Requirements 1.1, 1.5**
 */
export class ProductDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly stock: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Maps a Product domain entity to a ProductDto
   *
   * @param product - The Product entity to map
   * @returns ProductDto instance
   *
   * **Validates: Requirements 1.1, 1.5**
   */
  static fromEntity(product: Product): ProductDto {
    return new ProductDto(
      product.id,
      product.name,
      product.description,
      product.price.amount,
      product.price.currency,
      product.stock,
      product.createdAt,
      product.updatedAt
    );
  }
}
