import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { registerRoutes } from './interfaces/routes';
import {
  correlationIdMiddleware,
  requestLoggingMiddleware,
  errorHandlerMiddleware,
  generalRateLimiter,
} from './interfaces/middleware';
import { container } from './container';

/**
 * Creates and configures the Express application
 *
 * Sets up middleware, routes, and error handling.
 * Uses the dependency injection container for all controllers and services.
 *
 * **Validates: Requirements 15.1, 16.1, 17.1, 19.1**
 *
 * @returns Configured Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request processing middleware
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(generalRateLimiter);

  // Register all application routes
  registerRoutes(app, container);

  // Error handling middleware (must be last)
  app.use(errorHandlerMiddleware);

  return app;
}
