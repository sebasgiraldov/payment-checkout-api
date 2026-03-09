import { Request, Response, NextFunction } from 'express';
import { requestLoggingMiddleware } from '../../../src/interfaces/middleware/request-logging.middleware';
import { logger } from '../../../src/shared/utils/logger';

jest.mock('../../../src/shared/utils/logger');

describe('RequestLoggingMiddleware', () => {
  let mockRequest: Partial<Request> & { correlationId?: string };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      correlationId: 'test-id',
      ip: '127.0.0.1',
      query: {},
      get: jest.fn().mockReturnValue('test-agent'),
      connection: { remoteAddress: '127.0.0.1' } as any,
      headers: {} as any,
    };
    
    mockResponse = {
      statusCode: 200,
      get: jest.fn().mockReturnValue('100'),
      end: jest.fn(function(this: any) {
        return this;
      }) as any,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  it('should log incoming request', () => {
    requestLoggingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(logger.info).toHaveBeenCalledWith(
      'Incoming request',
      expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        correlationId: 'test-id',
      })
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log response when res.end is called', () => {
    requestLoggingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Call the overridden end method
    (mockResponse.end as any)();
    
    expect(logger.info).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({
        statusCode: 200,
        method: 'GET',
        path: '/api/test',
        correlationId: 'test-id',
      })
    );
  });

  it('should handle missing correlationId', () => {
    mockRequest.correlationId = undefined;
    
    requestLoggingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(logger.info).toHaveBeenCalledWith(
      'Incoming request',
      expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        correlationId: undefined,
      })
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should measure request duration', () => {
    jest.useFakeTimers();
    
    requestLoggingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Advance time by 100ms
    jest.advanceTimersByTime(100);
    
    // Call the overridden end method
    (mockResponse.end as any)();
    
    expect(logger.info).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({
        duration: expect.stringContaining('ms'),
      })
    );
    
    jest.useRealTimers();
  });
});
