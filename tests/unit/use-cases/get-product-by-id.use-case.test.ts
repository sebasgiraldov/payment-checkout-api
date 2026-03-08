import { GetProductByIdUseCase } from '../../../src/application/use-cases/get-product-by-id.use-case';
import { IProductRepository } from '../../../src/domain/repositories/product.repository';
import { Product } from '../../../src/domain/entities/product.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Result } from '../../../src/shared/result';
import { RepositoryError } from '../../../src/domain/errors/repository.error';
import { ProductNotFoundError } from '../../../src/application/errors/application.error';

/**
 * Unit tests for GetProductByIdUseCase
 * 
 * **Validates: Requirements 1.2, 1.3**
 */
describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      updateStock: jest.fn(),
    };

    useCase = new GetProductByIdUseCase(mockProductRepository);
  });

  describe('execute', () => {
    it('should return product when it exists', async () => {
      // Arrange
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const moneyResult = Money.create(100, 'USD');
      expect(moneyResult.isSuccess).toBe(true);

      const productResult = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'Test Description',
        price: moneyResult.value,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(productResult.isSuccess).toBe(true);

      mockProductRepository.findById.mockResolvedValue(Result.ok(productResult.value));

      // Act
      const result = await useCase.execute(productId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(productId);
      expect(result.value.name).toBe('Test Product');
      expect(result.value.stock).toBe(10);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return ProductNotFoundError when product does not exist', async () => {
      // Arrange
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new RepositoryError('Product not found');
      mockProductRepository.findById.mockResolvedValue(Result.fail(error));

      // Act
      const result = await useCase.execute(productId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ProductNotFoundError);
      expect(result.error.message).toContain(productId);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new RepositoryError('Database connection lost');
      mockProductRepository.findById.mockResolvedValue(Result.fail(error));

      // Act
      const result = await useCase.execute(productId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ProductNotFoundError);
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(1);
    });
  });
});
