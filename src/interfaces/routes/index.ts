import { Application } from 'express';
import { productRoutes } from './product.routes';
import { transactionRoutes } from './transaction.routes';
import { paymentRoutes } from './payment.routes';
import { healthRoutes } from './health.routes';

/**
 * Route Registration
 *
 * Centralizes all route registration and mounting for the application.
 * Routes are organized by domain and versioned appropriately.
 *
 * **Validates: Requirements 15.1**
 */

/**
 * Registers all application routes with the Express app
 *
 * Routes are mounted at the following paths:
 * - /api/v1/products - Product management endpoints
 * - /api/v1/transactions - Transaction management endpoints
 * - /api/v1/payments - Payment processing endpoints
 * - /health - Health check endpoint
 *
 * @param app - Express application instance
 */
export function registerRoutes(app: Application): void {
  // API v1 routes
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/transactions', transactionRoutes);
  app.use('/api/v1/payments', paymentRoutes);

  // Health check route (not versioned)
  app.use('/health', healthRoutes);
}

/**
 * Export individual route modules for testing purposes
 */
export { productRoutes, transactionRoutes, paymentRoutes, healthRoutes };
