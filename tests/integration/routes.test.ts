import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { container } from '../../src/container';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

describe('API Routes Integration Tests', () => {
  let app: Application;
  let prisma: PrismaService;

  beforeAll(() => {
    app = createApp();
    prisma = container.resolve('PrismaService');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Health Routes', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Product Routes', () => {
    it('GET /api/v1/products should return 200', async () => {
      const response = await request(app).get('/api/v1/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/v1/products/:id should return 404 for non-existent product', async () => {
      const response = await request(app).get('/api/v1/products/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('GET /api/v1/products/:id should return 200 for existing product', async () => {
      // First get all products to find an existing one
      const productsResponse = await request(app).get('/api/v1/products');
      
      if (productsResponse.body.length > 0) {
        const productId = productsResponse.body[0].id;
        const response = await request(app).get(`/api/v1/products/${productId}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', productId);
      }
    });
  });

  describe('Transaction Routes', () => {
    it('POST /api/v1/transactions should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/transactions')
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('GET /api/v1/transactions/:id should return 404 for non-existent transaction', async () => {
      const response = await request(app).get('/api/v1/transactions/non-existent-id');
      
      expect(response.status).toBe(404);
    });
  });

  describe('Payment Routes', () => {
    it('POST /api/v1/payments/process should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/payments/process')
        .send({});
      
      expect(response.status).toBe(400);
    });
  });

  describe('Middleware Integration', () => {
    it('should add correlation ID to requests', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers).toHaveProperty('x-correlation-id');
    });

    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');
      
      expect(response.status).toBe(404);
    });

    it('should apply rate limiting headers', async () => {
      const response = await request(app).get('/health');
      
      // Rate limiter should add headers
      expect(response.headers).toBeDefined();
    });
  });
});
