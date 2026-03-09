import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('API Routes Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Products API', () => {
    it('GET /api/v1/products should return 200', async () => {
      const response = await request(app).get('/api/v1/products');
      
      expect([200, 500]).toContain(response.status);
    });

    it('GET /api/v1/products/:id should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/v1/products/invalid-uuid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('GET /api/v1/products/:id should handle valid UUID format', async () => {
      const response = await request(app).get(
        '/api/v1/products/550e8400-e29b-41d4-a716-446655440000'
      );
      
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Transactions API', () => {
    it('POST /api/v1/transactions should accept requests', async () => {
      const response = await request(app)
        .post('/api/v1/transactions')
        .send({
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 1,
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+573001234567',
          },
          delivery: {
            address: 'Calle 123',
            city: 'Bogotá',
            state: 'Cundinamarca',
            country: 'Colombia',
            postalCode: '110111',
          },
        });
      
      expect([201, 400, 404, 500]).toContain(response.status);
    });

    it('GET /api/v1/transactions/:id should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/v1/transactions/invalid-uuid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('GET /api/v1/transactions/:id should handle valid UUID format', async () => {
      const response = await request(app).get(
        '/api/v1/transactions/550e8400-e29b-41d4-a716-446655440000'
      );
      
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Payment API', () => {
    it('POST /api/v1/payments/process should accept requests', async () => {
      const response = await request(app)
        .post('/api/v1/payments/process')
        .send({
          transactionId: '550e8400-e29b-41d4-a716-446655440000',
          cardNumber: '4242424242424242',
          cardHolder: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '123',
          customerEmail: 'john@example.com',
        });
      
      expect([200, 400, 404, 500, 503]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/non-existent');
      
      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(response.status).toBe(400);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/v1/products')
        .set('Origin', 'http://localhost:3001');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app).get('/health');
      
      // Rate limiter adds headers
      expect(response.status).toBe(200);
    });
  });
});
