import request from 'supertest';
import { Express } from 'express';
import { createTestApp, getTestPrismaService } from '../helpers/test-app';
import { cleanDatabase, seedTestProducts, TestProduct } from '../helpers/test-data';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

/**
 * Integration tests for Product API endpoints
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
describe('Product API Integration Tests', () => {
  let app: Express;
  let prisma: PrismaService;
  let testProducts: TestProduct[];

  beforeAll(async () => {
    prisma = getTestPrismaService();
    await prisma.$connect();
    app = createTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testProducts = await seedTestProducts(prisma);
  });

  describe('GET /api/v1/products', () => {
    it('should return all products with 200 status', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/products')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.correlationId).toBeDefined();

      // Verify product structure
      const product = response.body.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('currency');
      expect(product).toHaveProperty('stock');
      expect(product).toHaveProperty('createdAt');
      expect(product).toHaveProperty('updatedAt');
    });

    it('should return empty array when no products exist', async () => {
      // Arrange
      await cleanDatabase(prisma);

      // Act
      const response = await request(app)
        .get('/api/v1/products')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should include stock information for each product', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      // Assert
      const products = response.body.data;
      products.forEach((product: any) => {
        expect(product.stock).toBeGreaterThanOrEqual(0);
        expect(typeof product.stock).toBe('number');
      });
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return specific product by ID with 200 status', async () => {
      // Arrange
      const productId = testProducts[0].id;

      // Act
      const response = await request(app)
        .get(`/api/v1/products/${productId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(productId);
      expect(response.body.data.name).toBe(testProducts[0].name);
      expect(response.body.data.description).toBe(testProducts[0].description);
      expect(response.body.data.price).toBe(testProducts[0].price);
      expect(response.body.data.currency).toBe(testProducts[0].currency);
      expect(response.body.data.stock).toBe(testProducts[0].stock);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
    });

    it('should return 404 when product does not exist', async () => {
      // Arrange
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      // Act
      const response = await request(app)
        .get(`/api/v1/products/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain(nonExistentId);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
    });

    it('should return 400 for invalid UUID format', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';

      // Act
      const response = await request(app)
        .get(`/api/v1/products/${invalidId}`)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid product ID format');
    });

    it('should return product with zero stock', async () => {
      // Arrange
      const outOfStockProduct = testProducts.find(p => p.stock === 0);
      expect(outOfStockProduct).toBeDefined();

      // Act
      const response = await request(app)
        .get(`/api/v1/products/${outOfStockProduct!.id}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(0);
    });

    it('should handle correlation ID from request header', async () => {
      // Arrange
      const productId = testProducts[0].id;
      const correlationId = 'test-correlation-123';

      // Act
      const response = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('x-correlation-id', correlationId)
        .expect(200);

      // Assert
      expect(response.body.correlationId).toBe(correlationId);
    });
  });
});
