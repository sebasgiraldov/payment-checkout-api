import { GetAllProductsUseCase } from '../../../src/application/use-cases/get-all-products.use-case';
import { IProductRepository } from '../../../src/domain/repositories/product.repository';
import { Product } from '../../../src/domain/entities/product.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Result } from '../../../src/shared/result';
import { RepositoryError } from '../../../src/domain/errors/repository.error';

/**
 * Unit tests for GetAllProductsUseCase
 * 
 * **Validates: Requirements 1.1**
 */
describe('GetAllProductsUseCase', () => {
  let useCase: GetAllProductsUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    // Create mock repository
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      updateStock: jest.fn(),
      reserveStock: jest.fn(),
    };

    useCase = new GetAllProductsUseCase(mockProductRepository);
  });

  describe('execute', () => {
    it('should return all products successfully', async () => {
      // Arrange
      const moneyResult = Money.create(100, 'USD');
      expect(moneyResult.isSuccess).toBe(true);
      const money = moneyResult.value;

      const product1Result = Product.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Product 1',
        description: 'Description 1',
        price: money,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(product1Result.isSuccess).toBe(true);

      const product2Result = Product.create({
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Product 2',
        description: 'Description 2',
        price: money,
        stock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(product2Result.isSuccess).toBe(true);

      const products = [product1Result.value, product2Result.value];
      mockProductRepository.findAll.mockResolvedValue(Result.ok(products));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].name).toBe('Product 1');
      expect(result.value[1].name).toBe('Product 2');
      expect(mockProductRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      // Arrange
      mockProductRepository.findAll.mockResolvedValue(Result.ok([]));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(0);
      expect(mockProductRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return error when repository fails', async () => {
      // Arrange
      const error = new RepositoryError('Database connection failed');
      mockProductRepository.findAll.mockResolvedValue(Result.fail(error));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Database connection failed');
      expect(mockProductRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
