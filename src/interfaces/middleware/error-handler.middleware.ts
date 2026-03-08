import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/logger';
import {
  ApplicationError,
  ProductNotFoundError,
  TransactionNotFoundError,
  DomainError,
  ValidationError,
  InsufficientStockError,
  InvalidStateTransitionError,
  RepositoryError,
  PaymentError,
  PaymentGatewayError,
} from '../../domain/errors';

/**
 * Global Error Handler Middleware
 *
 * Maps domain and application errors to appropriate HTTP status codes.
 * Returns consistent error response format and logs errors with correlation ID.
 *
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
 */
export function errorHandlerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';

  // Log the error with full context
  logger.error('Request error', {
    correlationId,
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
    errorType: error.constructor.name,
    userId: req.headers['user-id'] || 'anonymous',
  });

  // Map errors to HTTP status codes and messages
  const errorResponse = mapErrorToHttpResponse(error, correlationId);

  res.status(errorResponse.statusCode).json(errorResponse.body);
}

/**
 * Maps different error types to appropriate HTTP responses
 *
 * @param error - The error to map
 * @param correlationId - Request correlation ID
 * @returns HTTP response object
 */
function mapErrorToHttpResponse(
  error: Error,
  correlationId: string
): {
  statusCode: number;
  body: {
    error: string;
    message: string;
    timestamp: string;
    correlationId: string;
    details?: any;
  };
} {
  const timestamp = new Date().toISOString();
  const baseResponse = {
    timestamp,
    correlationId,
  };

  // Domain validation errors -> 400 Bad Request
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      body: {
        ...baseResponse,
        error: 'Bad Request',
        message: error.message,
      },
    };
  }

  // Insufficient stock -> 400 Bad Request
  if (error instanceof InsufficientStockError) {
    return {
      statusCode: 400,
      body: {
        ...baseResponse,
        error: 'Bad Request',
        message: error.message,
        details: {
          productId: error.productId,
          availableStock: error.availableStock,
          requestedQuantity: error.requestedQuantity,
        },
      },
    };
  }

  // Invalid state transitions -> 400 Bad Request
  if (error instanceof InvalidStateTransitionError) {
    return {
      statusCode: 400,
      body: {
        ...baseResponse,
        error: 'Bad Request',
        message: error.message,
        details: {
          currentState: error.currentState,
        },
      },
    };
  }

  // Not found errors -> 404 Not Found
  if (error instanceof ProductNotFoundError || error instanceof TransactionNotFoundError) {
    return {
      statusCode: 404,
      body: {
        ...baseResponse,
        error: 'Not Found',
        message: error.message,
      },
    };
  }

  // Payment gateway errors -> 503 Service Unavailable
  if (error instanceof PaymentGatewayError || error instanceof PaymentError) {
    return {
      statusCode: 503,
      body: {
        ...baseResponse,
        error: 'Service Unavailable',
        message: 'Payment service is temporarily unavailable. Please try again later.',
      },
    };
  }

  // Repository/Database errors -> 500 Internal Server Error
  if (error instanceof RepositoryError) {
    return {
      statusCode: 500,
      body: {
        ...baseResponse,
        error: 'Internal Server Error',
        message: 'A database error occurred. Please try again later.',
      },
    };
  }

  // Application layer errors -> 500 Internal Server Error
  if (error instanceof ApplicationError) {
    return {
      statusCode: 500,
      body: {
        ...baseResponse,
        error: 'Internal Server Error',
        message: 'An application error occurred. Please try again later.',
      },
    };
  }

  // Domain errors -> 500 Internal Server Error
  if (error instanceof DomainError) {
    return {
      statusCode: 500,
      body: {
        ...baseResponse,
        error: 'Internal Server Error',
        message: 'A business logic error occurred. Please try again later.',
      },
    };
  }

  // Express validation errors (from express-validator) -> 400 Bad Request
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return {
      statusCode: 400,
      body: {
        ...baseResponse,
        error: 'Bad Request',
        message: 'Request validation failed',
      },
    };
  }

  // Syntax errors (malformed JSON) -> 400 Bad Request
  if (error instanceof SyntaxError && 'body' in error) {
    return {
      statusCode: 400,
      body: {
        ...baseResponse,
        error: 'Bad Request',
        message: 'Invalid JSON in request body',
      },
    };
  }

  // Default to 500 Internal Server Error for unknown errors
  return {
    statusCode: 500,
    body: {
      ...baseResponse,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred. Please try again later.',
    },
  };
}

export default errorHandlerMiddleware;
