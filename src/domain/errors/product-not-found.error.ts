import { ApplicationError } from './application.error';

/**
 * ProductNotFoundError represents a situation where a requested product
 * does not exist in the system
 */
export class ProductNotFoundError extends ApplicationError {
  constructor(public readonly productId: string) {
    super(`Product with id ${productId} not found`, {
      productId,
    });
  }
}
