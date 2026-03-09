import { Request, Response, NextFunction } from 'express';
import { validateDto } from '../../../src/interfaces/middleware/validation.middleware';
import { validate } from 'class-validator';

jest.mock('class-validator');

describe('ValidationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
      correlationId: 'test-id',
    };
    
    mockResponse = {
      status: statusMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  it('should call next() when validation passes', async () => {
    (validate as jest.Mock).mockResolvedValue([]);
    
    class TestDto {
      name!: string;
    }
    
    mockRequest.body = { name: 'test' };
    
    const middleware = validateDto(TestDto);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should return 400 when validation fails', async () => {
    const mockErrors = [
      {
        property: 'name',
        constraints: {
          isNotEmpty: 'name should not be empty',
        },
      },
    ];
    
    (validate as jest.Mock).mockResolvedValue(mockErrors);
    
    class TestDto {
      name!: string;
    }
    
    const middleware = validateDto(TestDto);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation Failed',
        message: 'Request validation failed',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle validation errors with multiple constraints', async () => {
    const mockErrors = [
      {
        property: 'email',
        constraints: {
          isEmail: 'email must be an email',
          isNotEmpty: 'email should not be empty',
        },
      },
    ];
    
    (validate as jest.Mock).mockResolvedValue(mockErrors);
    
    class TestDto {
      email!: string;
    }
    
    const middleware = validateDto(TestDto);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusMock).toHaveBeenCalledWith(400);
  });
});
