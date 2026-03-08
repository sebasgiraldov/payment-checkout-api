import { DomainError } from './domain.error';

/**
 * InsufficientStockError represents a situation where product stock is insufficient
 * for the requested quantity
 */
export class InsufficientStockError extends DomainError {
  constructor(
    public readonly productId: string,
    public readonly availableStock: number,
    public readonly requestedQuantity: number
  ) {
    super(
      `Insufficient stock for product ${productId}. Available: ${availableStock}, Requested: ${requestedQuantity}`,
      {
        productId,
        availableStock,
        requestedQuantity,
      }
    );
  }
}
