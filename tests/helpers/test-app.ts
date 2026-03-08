import express, { Express, Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { ProductRepositoryAdapter } from '../../src/infrastructure/repositories/product.repository.adapter';
import { TransactionRepositoryAdapter } from '../../src/infrastructure/repositories/transaction.repository.adapter';
import { CustomerRepositoryAdapter } from '../../src/infrastructure/repositories/customer.repository.adapter';
import { DeliveryRepositoryAdapter } from '../../src/infrastructure/repositories/delivery.repository.adapter';
import { DatabaseTransactionAdapter } from '../../src/infrastructure/repositories/database-transaction.adapter';
import { GetAllProductsUseCase } from '../../src/application/use-cases/get-all-products.use-case';
import { GetProductByIdUseCase } from '../../src/application/use-cases/get-product-by-id.use-case';
import { CreateTransactionUseCase } from '../../src/application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from '../../src/application/use-cases/get-transaction-by-id.use-case';
import { ProcessPaymentUseCase } from '../../src/application/use-cases/process-payment.use-case';
import { ProductController } from '../../src/interfaces/controllers/product.controller';
import { TransactionController } from '../../src/interfaces/controllers/transaction.controller';
import { PaymentController } from '../../src/interfaces/controllers/payment.controller';
import { HealthController } from '../../src/interfaces/controllers/health.controller';
import { IPaymentGateway } from '../../src/domain/services/payment-gateway.interface';
import { ApplicationError, ProductNotFoundError, TransactionNotFoundError } from '../../src/application/errors/application.error';

/**
 * Creates a test Express application with all dependencies wired
 * 
 * @param mockPaymentGateway - Optional mock payment gateway for testing
 * @returns Express application instance
 */
export function createTestApp(mockPaymentGateway?: IPaymentGateway): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add correlation ID for testing
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.correlationId = req.headers['x-correlation-id'] as string || 'test-correlation-id';
    next();
  });

  // Initialize repositories
  const prismaService = new PrismaService();
  const productRepository = new ProductRepositoryAdapter(prismaService);
  const transactionRepository = new TransactionRepositoryAdapter(prismaService);
  const customerRepository = new CustomerRepositoryAdapter(prismaService);
  const deliveryRepository = new DeliveryRepositoryAdapter(prismaService);
  const databaseTransaction = new DatabaseTransactionAdapter(prismaService);

  // Initialize use cases
  const getAllProductsUseCase = new GetAllProductsUseCase(productRepository);
  const getProductByIdUseCase = new GetProductByIdUseCase(productRepository);
  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionRepository,
    productRepository,
    customerRepository,
    deliveryRepository
  );
  const getTransactionByIdUseCase = new GetTransactionByIdUseCase(transactionRepository);

  // Initialize controllers
  const productController = new ProductController(getAllProductsUseCase, getProductByIdUseCase);
  const transactionController = new TransactionController(createTransactionUseCase, getTransactionByIdUseCase);
  const healthController = new HealthController(prismaService, mockPaymentGateway);

  // Product routes
  app.get('/api/v1/products', (req, res, next) => productController.getAllProducts(req, res, next));
  app.get('/api/v1/products/:id', (req, res, next) => productController.getProductById(req, res, next));

  // Transaction routes
  app.post('/api/v1/transactions', (req, res, next) => transactionController.createTransaction(req, res, next));
  app.get('/api/v1/transactions/:id', (req, res, next) => transactionController.getTransactionById(req, res, next));

  // Payment routes (only if payment gateway is provided)
  if (mockPaymentGateway) {
    const processPaymentUseCase = new ProcessPaymentUseCase(
      transactionRepository,
      productRepository,
      mockPaymentGateway,
      databaseTransaction
    );
    const paymentController = new PaymentController(processPaymentUseCase);
    app.post('/api/v1/payments/process', (req, res, next) => paymentController.processPayment(req, res, next));
  }

  // Health route
  app.get('/health', (req, res, next) => healthController.checkHealth(req, res, next));

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ProductNotFoundError) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: err.message,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }

    if (err instanceof TransactionNotFoundError) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: err.message,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }

    if (err instanceof ApplicationError) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: err.message,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  });

  return app;
}

/**
 * Gets a Prisma service instance for test database operations
 */
export function getTestPrismaService(): PrismaService {
  return new PrismaService();
}
