import { Product } from '../../../src/domain/entities/product.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';

describe('Product Entity', () => {
  describe('create', () => {
    it('should create a valid product', () => {
      const price = Money.create(100, 'COP').value;
      const result = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 10,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Test Product');
      expect(result.value.description).toBe('Test Description');
      expect(result.value.price).toEqual(price);
      expect(result.value.stock).toBe(10);
    });

    it('should fail when name is empty', () => {
      const price = Money.create(100, 'COP').value;
      const result = Product.create({
        name: '',
        description: 'Test Description',
        price,
        stock: 10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Product name is required');
    });

    it('should fail when stock is negative', () => {
      const price = Money.create(100, 'COP').value;
      const result = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: -1,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Stock cannot be negative');
    });
  });

  describe('hasStock', () => {
    it('should return true when stock is sufficient', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 10,
      }).value;

      expect(product.hasStock(5)).toBe(true);
      expect(product.hasStock(10)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 5,
      }).value;

      expect(product.hasStock(6)).toBe(false);
      expect(product.hasStock(10)).toBe(false);
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock successfully', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 10,
      }).value;

      const result = product.decreaseStock(3);

      expect(result.isSuccess).toBe(true);
      expect(product.stock).toBe(7);
    });

    it('should fail when quantity is zero', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 10,
      }).value;

      const result = product.decreaseStock(0);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Quantity must be positive');
    });

    it('should fail when quantity is negative', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 10,
      }).value;

      const result = product.decreaseStock(-1);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Quantity must be positive');
    });

    it('should fail when insufficient stock', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 5,
      }).value;

      const result = product.decreaseStock(10);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Insufficient stock');
    });
  });

  describe('increaseStock', () => {
    it('should increase stock successfully', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 10,
      }).value;

      const result = product.increaseStock(5);

      expect(result.isSuccess).toBe(true);
      expect(product.stock).toBe(15);
    });

    it('should fail when quantity is zero', () => {
      const price = Money.create(100, 'COP').value;
      const product = Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price,
        stock: 10,
      }).value;

      const result = product.increaseStock(0);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Quantity must be positive');
    });
  });
});
