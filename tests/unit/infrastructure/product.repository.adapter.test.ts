import { ProductRepositoryAdapter } from '../../../src/infrastructure/repositories/product.repository.adapter';
import { Product } from '../../../src/domain/entities/product.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Prisma } from '@prisma/client';

describe('ProductRepositoryAdapter', () => {
  let repository: ProductRepositoryAdapter;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    
    repository = new ProductRepositoryAdapter(mockPrismaService);
  });

  describe('findById', () => {
    it('should find product by id', async () => {
      const mockProduct = {
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test',
        price: new Prisma.Decimal(100),
        currency: 'USD',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await repository.findById('prod-123');

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe('prod-123');
    });

    it('should return error when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      const result = await repository.findById('prod-123');

      expect(result.isFailure).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPrismaService.product.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await repository.findById('prod-123');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Product 1',
          description: 'Test',
          price: new Prisma.Decimal(100),
          currency: 'USD',
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await repository.findAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(1);
    });

    it('should handle empty result', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should save product', async () => {
      const money = Money.create(100, 'USD').value;
      const product = Product.create({
        name: 'Test',
        description: 'Test',
        price: money,
        stock: 10,
      }).value;

      const mockSaved = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(100),
        currency: 'USD',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.create.mockResolvedValue(mockSaved);

      const result = await repository.save(product);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const money = Money.create(100, 'USD').value;
      const product = Product.create({
        id: 'prod-123',
        name: 'Test',
        description: 'Test',
        price: money,
        stock: 10,
      }).value;

      const mockUpdated = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(100),
        currency: 'USD',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.update.mockResolvedValue(mockUpdated);

      const result = await repository.update(product);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('updateStock', () => {
    it('should update stock', async () => {
      const mockUpdated = {
        id: 'prod-123',
        name: 'Test',
        description: 'Test',
        price: new Prisma.Decimal(100),
        currency: 'USD',
        stock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.update.mockResolvedValue(mockUpdated);

      const result = await repository.updateStock('prod-123', 5);

      expect(result.isSuccess).toBe(true);
    });
  });
});
