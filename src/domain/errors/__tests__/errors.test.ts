import {
  DomainError,
  ValidationError,
  InsufficientStockError,
  InvalidStateTransitionError,
  ApplicationError,
  ProductNotFoundError,
  TransactionNotFoundError,
  CustomerCreationError,
  DeliveryCreationError,
  TransactionCreationError,
  TransactionUpdateError,
  StockUpdateError,
  PaymentProcessingError,
  RepositoryError,
  PaymentError,
  PaymentGatewayError,
} from '../index';

describe('Error Classes', () => {
  describe('Domain Errors', () => {
    it('should create ValidationError with message and context', () => {
      const error = new ValidationError('Invalid email format', {
        field: 'email',
        value: 'invalid',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid email format');
      expect(error.context).toEqual({ field: 'email', value: 'invalid' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create InsufficientStockError with product details', () => {
      const error = new InsufficientStockError('product-123', 5, 10);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('InsufficientStockError');
      expect(error.productId).toBe('product-123');
      expect(error.availableStock).toBe(5);
      expect(error.requestedQuantity).toBe(10);
      expect(error.message).toContain('product-123');
      expect(error.message).toContain('5');
      expect(error.message).toContain('10');
    });

    it('should create InvalidStateTransitionError with state details', () => {
      const error = new InvalidStateTransitionError('PENDING', 'APPROVED');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('InvalidStateTransitionError');
      expect(error.currentState).toBe('PENDING');
      expect(error.targetState).toBe('APPROVED');
      expect(error.message).toContain('PENDING');
      expect(error.message).toContain('APPROVED');
    });

    it('should serialize domain error to JSON', () => {
      const error = new ValidationError('Test error', { test: 'value' });
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'ValidationError');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('context', { test: 'value' });
      expect(json).toHaveProperty('stack');
    });
  });

  describe('Application Errors', () => {
    it('should create ProductNotFoundError with product ID', () => {
      const error = new ProductNotFoundError('product-456');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('ProductNotFoundError');
      expect(error.productId).toBe('product-456');
      expect(error.message).toContain('product-456');
    });

    it('should create TransactionNotFoundError with transaction ID', () => {
      const error = new TransactionNotFoundError('txn-789');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('TransactionNotFoundError');
      expect(error.transactionId).toBe('txn-789');
      expect(error.message).toContain('txn-789');
    });

    it('should create CustomerCreationError with message', () => {
      const error = new CustomerCreationError('Database connection failed');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('CustomerCreationError');
      expect(error.message).toContain('Failed to create customer');
      expect(error.message).toContain('Database connection failed');
    });

    it('should create DeliveryCreationError with message', () => {
      const error = new DeliveryCreationError('Invalid address');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('DeliveryCreationError');
      expect(error.message).toContain('Failed to create delivery');
    });

    it('should create TransactionCreationError with message', () => {
      const error = new TransactionCreationError('Validation failed');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('TransactionCreationError');
    });

    it('should create TransactionUpdateError with message', () => {
      const error = new TransactionUpdateError('State transition invalid');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('TransactionUpdateError');
    });

    it('should create StockUpdateError with message', () => {
      const error = new StockUpdateError('Concurrent modification');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('StockUpdateError');
    });

    it('should create PaymentProcessingError with message', () => {
      const error = new PaymentProcessingError('Gateway timeout');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('PaymentProcessingError');
      expect(error.message).toContain('Payment processing failed');
    });

    it('should serialize application error to JSON', () => {
      const error = new ProductNotFoundError('test-id');
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'ProductNotFoundError');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('context');
      expect(json).toHaveProperty('stack');
    });
  });

  describe('Infrastructure Errors', () => {
    it('should create RepositoryError with message', () => {
      const error = new RepositoryError('Database query failed', {
        query: 'SELECT * FROM products',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('RepositoryError');
      expect(error.message).toBe('Database query failed');
      expect(error.context).toEqual({ query: 'SELECT * FROM products' });
    });

    it('should create PaymentError with message', () => {
      const error = new PaymentError('Payment service unavailable');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PaymentError');
      expect(error.message).toBe('Payment service unavailable');
    });

    it('should create PaymentGatewayError with message', () => {
      const error = new PaymentGatewayError('Connection timeout');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PaymentError);
      expect(error.name).toBe('PaymentGatewayError');
      expect(error.message).toContain('Payment gateway error');
      expect(error.message).toContain('Connection timeout');
    });

    it('should serialize infrastructure error to JSON', () => {
      const error = new RepositoryError('Test error', { db: 'postgres' });
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'RepositoryError');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('context', { db: 'postgres' });
      expect(json).toHaveProperty('stack');
    });
  });

  describe('Error Hierarchy', () => {
    it('should maintain proper inheritance chain for domain errors', () => {
      const error = new ValidationError('test');

      expect(error instanceof ValidationError).toBe(true);
      expect(error instanceof DomainError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should maintain proper inheritance chain for application errors', () => {
      const error = new ProductNotFoundError('test-id');

      expect(error instanceof ProductNotFoundError).toBe(true);
      expect(error instanceof ApplicationError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should maintain proper inheritance chain for payment errors', () => {
      const error = new PaymentGatewayError('test');

      expect(error instanceof PaymentGatewayError).toBe(true);
      expect(error instanceof PaymentError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});
