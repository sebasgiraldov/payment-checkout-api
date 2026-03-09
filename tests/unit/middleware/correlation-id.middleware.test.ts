import { Request, Response, NextFunction } from 'express';
import { correlationIdMiddleware, CORRELATION_ID_HEADER } from '../../../src/interfaces/middleware/correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    setHeaderMock = jest.fn();
    
    mockRequest = {
      headers: {},
    };
    
    mockResponse = {
      setHeader: setHeaderMock,
    };
    
    mockNext = jest.fn();
  });

  it('should generate correlation ID when not present in headers', () => {
    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect((mockRequest as any).correlationId).toBeDefined();
    expect(typeof (mockRequest as any).correlationId).toBe('string');
    expect(setHeaderMock).toHaveBeenCalledWith(CORRELATION_ID_HEADER, (mockRequest as any).correlationId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing correlation ID from headers', () => {
    const existingId = 'existing-correlation-id-123';
    mockRequest.headers = {
      [CORRELATION_ID_HEADER]: existingId,
    };
    
    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect((mockRequest as any).correlationId).toBe(existingId);
    expect(setHeaderMock).toHaveBeenCalledWith(CORRELATION_ID_HEADER, existingId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should add correlation ID to response headers', () => {
    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(setHeaderMock).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      expect.any(String)
    );
  });

  it('should call next middleware', () => {
    correlationIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
