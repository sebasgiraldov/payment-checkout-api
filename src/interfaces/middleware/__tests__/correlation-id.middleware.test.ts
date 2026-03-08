import { Request, Response, NextFunction } from 'express';
import {
  correlationIdMiddleware,
  RequestWithCorrelationId,
  CORRELATION_ID_HEADER,
} from '../correlation-id.middleware';

// Mock uuid module
jest.mock('../../shared/utils/generate-id', () => ({
  generateId: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('correlationIdMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should generate a correlation ID if not present in headers', () => {
    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    const req = mockRequest as RequestWithCorrelationId;
    expect(req.correlationId).toBeDefined();
    expect(typeof req.correlationId).toBe('string');
    expect(req.correlationId).toHaveLength(36); // UUID v4 length
    expect(mockResponse.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.correlationId);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should use existing correlation ID from headers', () => {
    const existingId = 'existing-correlation-id-123';
    mockRequest.headers = {
      [CORRELATION_ID_HEADER]: existingId,
    };

    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    const req = mockRequest as RequestWithCorrelationId;
    expect(req.correlationId).toBe(existingId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, existingId);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should add correlation ID to response headers', () => {
    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, expect.any(String));
  });

  it('should call next function', () => {
    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
  });
});
