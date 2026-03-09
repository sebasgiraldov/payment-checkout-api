import { Request, Response, NextFunction } from 'express';
import { errorHandlerMiddleware } from '../../../src/interfaces/middleware/error-handler.middleware';
import {
  ValidationError,
  InsufficientStockError,
  InvalidStateTransitionError,
  ProductNotFoundError,
  TransactionNotFoundError,
  PaymentGatewayError,
  RepositoryError,
  ApplicationError,
  DomainError,
} from '../../../src/domain/errors';

describe('ErrorHandlerMiddleware', () => {
  let mockRequest: Partial<Request> & { correlationId?: string };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      correlationId: 'test-correlation-id',
      method: 'POST',
      path: '/api/test',
      headers: {} as any,
    };
    
    mockResponse = {
      status: statusMock,
    };
    
    mockNext = jest.fn();
  });

  it('should handle ValidationError with 400 status', () => {
    const error = new ValidationError('Validation failed', { field: 'test' });

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Bad Request',
        message: 'Validation failed',
        correlationId: 'test-correlation-id',
      })
    );
  });

  it('should handle InsufficientStockError with 400 status', () => {
    const error = new InsufficientStockError('prod-123', 5, 10);

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Bad Request',
        details: expect.objectContaining({
          productId: 'prod-123',
          availableStock: 5,
          requestedQuantity: 10,
        }),
      })
    );
  });

  it('should handle InvalidStateTransitionError with 400 status', () => {
    const error = new InvalidStateTransitionError('PENDING', 'APPROVED');

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Bad Request',
      })
    );
  });

  it('should handle ProductNotFoundError with 404 status', () => {
    const error = new ProductNotFoundError('prod-123');

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Not Found',
      })
    );
  });

  it('should handle TransactionNotFoundError with 404 status', () => {
    const error = new TransactionNotFoundError('trans-123');

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('should handle PaymentGatewayError with 503 status', () => {
    const error = new PaymentGatewayError('Gateway timeout');

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(503);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Service Unavailable',
      })
    );
  });

  it('should handle RepositoryError with 500 status', () => {
    const error = new RepositoryError('Database connection failed');

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('should handle ApplicationError with 500 status', () => {
    const error = new ProductNotFoundError('prod-123');
    // Force it to be treated as ApplicationError by changing prototype
    Object.setPrototypeOf(error, ApplicationError.prototype);

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal Server Error',
      })
    );
  });

  it('should handle DomainError with 500 status', () => {
    const error = new ValidationError('Domain validation error');
    // Force it to be treated as DomainError by changing prototype
    Object.setPrototypeOf(error, DomainError.prototype);

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal Server Error',
      })
    );
  });

  it('should handle SyntaxError with 400 status', () => {
    const error = new SyntaxError('Invalid JSON');
    (error as any).body = true;

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid JSON in request body',
      })
    );
  });

  it('should handle generic Error with 500 status', () => {
    const error = new Error('Unknown error');

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal Server Error',
      })
    );
  });

  it('should use "unknown" as correlationId when not present', () => {
    mockRequest.correlationId = undefined;
    const error = new Error('Test error');

    errorHandlerMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'unknown',
      })
    );
  });
});
