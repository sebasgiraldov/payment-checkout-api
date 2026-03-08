import request from 'supertest';
import { Express } from 'express';
import { createTestApp, getTestPrismaService } from '../helpers/test-app';
import { cleanDatabase, seedTestProducts, TestProduct } from '../helpers/test-data';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

/**
 * Integration tests for Payment API endpoints
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 13.1, 13.2, 13.3, 2.2, 2.3**
 */
describe('Payment API Integration Tests', () => {
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

  describe('POST /api/v1/payments/process', () => {
    it('should process payment and return payment result', async () => {
      // Arrange - Create a transaction first
      const product = testProducts[0];
      const transactionResponse = await request(app)
        .post('/api/v1/transactions')
        .send({
          productId: product.id,
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          customerPhone: '+573001234567',
          deliveryAddress: 'Carrera 7 #32-16',
          deliveryCity: 'Bogota',
          deliveryState: 'Cundinamarca',
          deliveryCountry: 'Colombia',
          deliveryPostalCode: '110231',
          baseFee: 5.0,
          deliveryFee: 10.0,
          currency: 'COP',
          paymentMethod: 'CARD',
        })
        .expect(201);

      const transactionId = transactionResponse.body.data.id;

      // Act - Process payment
      const paymentResponse = await request(app)
        .post('/api/v1/payments/process')
        .send({
          transactionId,
          cardNumber: '4242424242424242',
          cardHolder: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '123',
          customerEmail: 'john.doe@example.com',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.data).toBeDefined();
      expect(paymentResponse.body.data.id).toBe(transactionId);
      expect(paymentResponse.body.data.status).toBeDefined();
      expect(['PENDING', 'APPROVED', 'DECLINED']).toContain(paymentResponse.body.data.status);
      expect(paymentResponse.body.data.externalPaymentId).toBeDefined();
    });

    it('should return 404 when transaction does not exist', async () => {
      // Arrange
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      // Act
      const response = await request(app)
        .post('/api/v1/payments/process')
        .send({
          transactionId: nonExistentId,
          cardNumber: '4242424242424242',
          cardHolder: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '123',
          customerEmail: 'john.doe@example.com',
        })
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when required fields are missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/payments/process')
        .send({
          // Missing required fields
          cardNumber: '4242424242424242',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when card number is invalid', async () => {
      // Arrange - Create a transaction first
      const product = testProducts[0];
      const transactionResponse = await request(app)
        .post('/api/v1/transactions')
        .send({
          productId: product.id,
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          customerPhone: '+573001234567',
          deliveryAddress: 'Carrera 7 #32-16',
          deliveryCity: 'Bogota',
          deliveryState: 'Cundinamarca',
          deliveryCountry: 'Colombia',
          deliveryPostalCode: '110231',
          baseFee: 5.0,
          deliveryFee: 10.0,
          currency: 'COP',
          paymentMethod: 'CARD',
        })
        .expect(201);

      const transactionId = transactionResponse.body.data.id;

      // Act - Process payment with invalid card
      const response = await request(app)
        .post('/api/v1/payments/process')
        .send({
          transactionId,
          cardNumber: '1234', // Invalid card number
          cardHolder: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '123',
          customerEmail: 'john.doe@example.com',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle correlation ID from request header', async () => {
      // Arrange - Create a transaction first
      const product = testProducts[0];
      const transactionResponse = await request(app)
        .post('/api/v1/transactions')
        .send({
          productId: product.id,
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          customerPhone: '+573001234567',
          deliveryAddress: 'Carrera 7 #32-16',
          deliveryCity: 'Bogota',
          deliveryState: 'Cundinamarca',
          deliveryCountry: 'Colombia',
          deliveryPostalCode: '110231',
          baseFee: 5.0,
          deliveryFee: 10.0,
          currency: 'COP',
          paymentMethod: 'CARD',
        })
        .expect(201);

      const transactionId = transactionResponse.body.data.id;
      const correlationId = 'test-payment-correlation-123';

      // Act
      const response = await request(app)
        .post('/api/v1/payments/process')
        .set('x-correlation-id', correlationId)
        .send({
          transactionId,
          cardNumber: '4242424242424242',
          cardHolder: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '123',
          customerEmail: 'john.doe@example.com',
        })
        .expect(200);

      // Assert
      expect(response.body.correlationId).toBe(correlationId);
    });
  });
});
