import { Result } from '../../shared/result';
import { DomainError } from '../errors/domain.error';
import { ValidationError } from '../errors/validation.error';
import { InsufficientStockError } from '../errors/insufficient-stock.error';
import { Money } from '../value-objects/money.value-object';
import { generateId } from '../../shared/utils/generate-id';

/**
 * Props for creating a Product entity
 */
export interface ProductProps {
  id?: string;
  name: string;
  description: string;
  price: Money;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Product Entity
 *
 * Represents a product in the catalog with inventory management.
 * Enforces business rules:
 * - Product name is required
 * - Stock must be non-negative
 * - Stock operations maintain consistency
 *
 * @example
 * ```typescript
 * const price = Money.create(100, 'USD').value;
 * const product = Product.create({
 *   name: 'Laptop',
 *   description: 'High-performance laptop',
 *   price,
 *   stock: 10
 * });
 *
 * if (product.isSuccess) {
 *   const p = product.value;
 *   p.decreaseStock(1); // Reduces stock to 9
 * }
 * ```
 */
export class Product {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    private _price: Money,
    private _stock: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Factory method to create a Product instance with validation
   *
   * @param props - Product properties
   * @returns Result containing Product instance or DomainError
   *
   * **Validates: Requirements 1.1, 2.1**
   */
  static create(props: ProductProps): Result<Product, DomainError> {
    // Validate product name is required (Requirement 1.1)
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(
        new ValidationError('Product name is required', {
          name: props.name,
        })
      );
    }

    // Validate stock is non-negative (Requirement 2.1)
    if (props.stock < 0) {
      return Result.fail(
        new ValidationError('Stock cannot be negative', {
          stock: props.stock,
        })
      );
    }

    return Result.ok(
      new Product(
        props.id || generateId(),
        props.name,
        props.description,
        props.price,
        props.stock,
        props.createdAt || new Date(),
        props.updatedAt || new Date()
      )
    );
  }

  /**
   * Gets the product price
   */
  get price(): Money {
    return this._price;
  }

  /**
   * Gets the current stock level
   */
  get stock(): number {
    return this._stock;
  }

  /**
   * Checks if the product has sufficient stock for the requested quantity
   *
   * @param quantity - The quantity to check
   * @returns true if stock is sufficient, false otherwise
   *
   * **Validates: Requirements 1.4, 2.4**
   */
  hasStock(quantity: number): boolean {
    return this._stock >= quantity;
  }

  /**
   * Decreases the product stock by the specified quantity
   *
   * @param quantity - The quantity to decrease (must be positive)
   * @returns Result indicating success or error
   *
   * **Validates: Requirements 2.2, 2.4**
   */
  decreaseStock(quantity: number): Result<void, DomainError> {
    // Validate quantity is positive
    if (quantity <= 0) {
      return Result.fail(
        new ValidationError('Quantity must be positive', {
          quantity,
        })
      );
    }

    // Check if sufficient stock is available (Requirement 2.4)
    if (!this.hasStock(quantity)) {
      return Result.fail(new InsufficientStockError(this.id, this._stock, quantity));
    }

    // Decrease stock (Requirement 2.2)
    this._stock -= quantity;
    return Result.ok(null as any);
  }

  /**
   * Increases the product stock by the specified quantity
   *
   * @param quantity - The quantity to increase (must be positive)
   * @returns Result indicating success or error
   */
  increaseStock(quantity: number): Result<void, DomainError> {
    // Validate quantity is positive
    if (quantity <= 0) {
      return Result.fail(
        new ValidationError('Quantity must be positive', {
          quantity,
        })
      );
    }

    // Increase stock
    this._stock += quantity;
    return Result.ok(null as any);
  }
}
