/**
 * Base class for all application layer errors
 * Application errors represent use case execution failures
 */
export abstract class ApplicationError extends Error {
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializes the error for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when a product is not found
 */
export class ProductNotFoundError extends ApplicationError {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`, { productId });
  }
}

/**
 * Error thrown when a transaction is not found
 */
export class TransactionNotFoundError extends ApplicationError {
  constructor(transactionId: string) {
    super(`Transaction with ID ${transactionId} not found`, { transactionId });
  }
}

/**
 * Error thrown when transaction creation fails
 */
export class TransactionCreationError extends ApplicationError {
  constructor(reason: string) {
    super(`Failed to create transaction: ${reason}`, { reason });
  }
}

/**
 * Error thrown when transaction update fails
 */
export class TransactionUpdateError extends ApplicationError {
  constructor(reason: string) {
    super(`Failed to update transaction: ${reason}`, { reason });
  }
}

/**
 * Error thrown when customer creation fails
 */
export class CustomerCreationError extends ApplicationError {
  constructor(reason: string) {
    super(`Failed to create customer: ${reason}`, { reason });
  }
}

/**
 * Error thrown when delivery creation fails
 */
export class DeliveryCreationError extends ApplicationError {
  constructor(reason: string) {
    super(`Failed to create delivery: ${reason}`, { reason });
  }
}

/**
 * Error thrown when payment processing fails
 */
export class PaymentProcessingError extends ApplicationError {
  constructor(reason: string) {
    super(`Payment processing failed: ${reason}`, { reason });
  }
}

/**
 * Error thrown when stock update fails
 */
export class StockUpdateError extends ApplicationError {
  constructor(reason: string) {
    super(`Failed to update stock: ${reason}`, { reason });
  }
}
