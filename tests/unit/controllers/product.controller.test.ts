import { Request, Response, NextFunction } from 'express';
import { ProductController } from '../../../src/interfaces/controllers/product.controller';
import { GetAllProductsUseCase } from '../../../src/application/use-cases/get-all-products.use-case';
import { GetProductByIdUseCase } from '../../../src/application/use-cases/get-product-by-id.use-case';
import { Result } from '../../../src/shared/result';
import { ProductDto } from '../../../src/application/dtos/product.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let mockGetAllUseCase: jest.Mocked<GetAllProductsUseCase>;
  let mockGetByIdUseCase: jest.Mocked<GetProductByIdUseCase>;
  let mockRequest: Partial<Request> & { correlationId?: string };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockGetAllUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetByIdUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new ProductController(mockGetAllUseCase, mockGetByIdUseCase);

    mockRequest = {
      correlationId: 'test-correlation-id',
      method: 'GET',
      path: '/api/v1/products',
      params: {},
      headers: {} as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('getAllProducts', () => {
    it('should return all products successfully', async () => {
      const mockProducts: ProductDto[] = [
        {
          id: 'prod-1',
          name: 'Product 1',
          description: 'Test',
          price: 100,
          currency: 'COP',
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetAllUseCase.execute.mockResolvedValue(Result.ok(mockProducts));

      await controller.getAllProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProducts,
          count: 1,
        })
      );
    });

    it('should handle use case failure', async () => {
      mockGetAllUseCase.execute.mockResolvedValue(
        Result.fail({ message: 'Database error' } as any)
      );

      await controller.getAllProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Database error' }));
    });

    it('should handle unexpected errors', async () => {
      mockGetAllUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      await controller.getAllProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getProductById', () => {
    it('should return product by id successfully', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      const mockProduct: ProductDto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Product 1',
        description: 'Test',
        price: 100,
        currency: 'COP',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetByIdUseCase.execute.mockResolvedValue(Result.ok(mockProduct));

      await controller.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProduct,
        })
      );
    });

    it('should return 400 for invalid UUID format', async () => {
      mockRequest.params = { id: 'invalid-uuid' };

      await controller.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bad Request',
        })
      );
    });

    it('should handle use case failure', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockGetByIdUseCase.execute.mockResolvedValue(
        Result.fail({ message: 'Product not found' } as any)
      );

      await controller.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockGetByIdUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      await controller.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
