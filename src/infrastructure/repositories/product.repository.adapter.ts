import { Prisma } from '@prisma/client';
import { Result } from '../../shared/result';
import { RepositoryError } from '../../domain/errors/repository.error';
import { Product } from '../../domain/entities/product.entity';
import { Money } from '../../domain/value-objects/money.value-object';
import { IProductRepository } from '../../domain/repositories/product.repository';
import { PrismaService } from '../database/prisma.service';

/**
 * Product Repository Adapter (Prisma Implementation)
 *
 * Implements the IProductRepository port using Prisma ORM.
 * Handles mapping between Prisma models and domain entities.
 *
 * **Validates: Requirements 1.1, 1.2, 2.2, 18.5**
 */
export class ProductRepositoryAdapter implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a product by its unique identifier
   *
   * @param id - The product UUID
   * @returns Result containing the Product or RepositoryError
   */
  async findById(id: string): Promise<Result<Product, RepositoryError>> {
    try {
      const productModel = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!productModel) {
        return Result.fail(new RepositoryError(`Product with id ${id} not found`, { id }));
      }

      return this.mapToDomain(productModel);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find product: ${(error as Error).message}`, {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Retrieves all products from the catalog
   *
   * @returns Result containing array of Products or RepositoryError
   */
  async findAll(): Promise<Result<Product[], RepositoryError>> {
    try {
      const productModels = await this.prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const products: Product[] = [];
      for (const model of productModels) {
        const productResult = this.mapToDomain(model);
        if (productResult.isFailure) {
          return Result.fail(productResult.error);
        }
        products.push(productResult.value);
      }

      return Result.ok(products);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find all products: ${(error as Error).message}`, {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Persists a new product to the database
   *
   * @param product - The Product entity to save
   * @returns Result containing the saved Product or RepositoryError
   */
  async save(product: Product): Promise<Result<Product, RepositoryError>> {
    try {
      const productModel = await this.prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: new Prisma.Decimal(product.price.amount),
          currency: product.price.currency,
          stock: product.stock,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });

      return this.mapToDomain(productModel);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to save product: ${(error as Error).message}`, {
          productId: product.id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Updates an existing product in the database
   *
   * @param product - The Product entity with updated values
   * @returns Result containing the updated Product or RepositoryError
   */
  async update(product: Product): Promise<Result<Product, RepositoryError>> {
    try {
      const productModel = await this.prisma.product.update({
        where: { id: product.id },
        data: {
          name: product.name,
          description: product.description,
          price: new Prisma.Decimal(product.price.amount),
          currency: product.price.currency,
          stock: product.stock,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(productModel);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return Result.fail(
            new RepositoryError(`Product with id ${product.id} not found`, {
              productId: product.id,
            })
          );
        }
      }

      return Result.fail(
        new RepositoryError(`Failed to update product: ${(error as Error).message}`, {
          productId: product.id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Updates the stock level for a specific product atomically
   *
   * @param productId - The product UUID
   * @param newStock - The new stock quantity
   * @returns Result indicating success or RepositoryError
   */
  async updateStock(productId: string, newStock: number): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
          updatedAt: new Date(),
        },
      });

      return Result.ok(null as any);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return Result.fail(
            new RepositoryError(`Product with id ${productId} not found`, {
              productId,
            })
          );
        }
      }

      return Result.fail(
        new RepositoryError(`Failed to update product stock: ${(error as Error).message}`, {
          productId,
          newStock,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Atomically reserves stock for a product using database-level conditional update
   * Prevents race conditions and overselling by using Prisma's atomic operations
   *
   * @param productId - The product UUID
   * @param quantity - The quantity to reserve
   * @returns Result indicating success or RepositoryError if insufficient stock
   *
   * **Validates: Requirements 2.2, 2.3**
   */
  async reserveStock(productId: string, quantity: number): Promise<Result<void, RepositoryError>> {
    try {
      // Atomic update: only succeeds if stock >= quantity
      await this.prisma.product.update({
        where: {
          id: productId,
          stock: {
            gte: quantity,
          },
        },
        data: {
          stock: {
            decrement: quantity,
          },
          updatedAt: new Date(),
        },
      });

      return Result.ok(null as any);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found - either product doesn't exist or stock is insufficient
          return Result.fail(
            new RepositoryError(
              `Cannot reserve stock: Product ${productId} not found or insufficient stock`,
              {
                productId,
                requestedQuantity: quantity,
              }
            )
          );
        }
      }

      return Result.fail(
        new RepositoryError(`Failed to reserve product stock: ${(error as Error).message}`, {
          productId,
          quantity,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Maps a Prisma Product model to a domain Product entity
   *
   * @param model - The Prisma product model
   * @returns Result containing Product entity or RepositoryError
   */
  private mapToDomain(model: {
    id: string;
    name: string;
    description: string;
    price: Prisma.Decimal;
    currency: string;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
  }): Result<Product, RepositoryError> {
    // Convert Prisma Decimal to number
    const priceAmount = model.price.toNumber();

    // Create Money value object
    const moneyResult = Money.create(priceAmount, model.currency);
    if (moneyResult.isFailure) {
      return Result.fail(
        new RepositoryError(`Failed to create Money value object: ${moneyResult.error.message}`, {
          productId: model.id,
          price: priceAmount,
          currency: model.currency,
        })
      );
    }

    // Create Product entity
    const productResult = Product.create({
      id: model.id,
      name: model.name,
      description: model.description,
      price: moneyResult.value,
      stock: model.stock,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });

    if (productResult.isFailure) {
      return Result.fail(
        new RepositoryError(`Failed to create Product entity: ${productResult.error.message}`, {
          productId: model.id,
        })
      );
    }

    return Result.ok(productResult.value);
  }
}
