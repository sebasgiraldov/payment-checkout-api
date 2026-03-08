import 'dotenv/config';
import { Server } from 'http';
import { config } from './config';
import { container } from './container';
import { createApp } from './app';
import { logger } from './shared/utils/logger';

/**
 * Main application entry point
 *
 * Initializes the dependency injection container, connects to the database,
 * creates the Express application, and starts the HTTP server.
 *
 * **Validates: Requirements 19.1**
 */

let server: Server | null = null;

async function bootstrap(): Promise<void> {
  try {
    logger.info('🚀 Starting Payment Checkout API...');
    logger.info(`📝 Environment: ${config.nodeEnv}`);
    logger.info(`🔌 Port: ${config.port}`);
    logger.info(`📊 API Version: ${config.apiVersion}`);
    logger.info(`💳 Payment Gateway: ${config.wompi.baseUrl}`);
    logger.info('✅ Configuration loaded successfully');

    // Initialize container and connect to database
    logger.info('🔌 Connecting to database...');
    await container.initialize();
    logger.info('✅ Database connection established');

    // Create Express app with wired dependencies
    logger.info('🔧 Initializing Express application...');
    const app = createApp();
    logger.info('✅ Express application initialized');

    // Start HTTP server
    // Bind to 0.0.0.0 to accept connections from outside the container
    const baseUrl = config.baseUrl || `http://localhost:${config.port}`;
    server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`✅ Server is running on port ${config.port}`);
      logger.info(`🌐 Health check: ${baseUrl}/health`);
      logger.info(`🌐 API endpoint: ${baseUrl}/api/${config.apiVersion}`);
      logger.info('🎉 Payment Checkout API is ready to accept requests');
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${config.port} is already in use`);
      } else {
        logger.error('❌ Server error', { error: error.message, stack: error.stack });
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start application', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 *
 * Closes the HTTP server and disconnects from the database
 * when the process receives termination signals.
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            logger.error('❌ Error closing server', { error: err.message, stack: err.stack });
            reject(err);
          } else {
            logger.info('✅ HTTP server closed');
            resolve();
          }
        });
      });
    }

    // Disconnect from database
    logger.info('🔌 Disconnecting from database...');
    await container.cleanup();
    logger.info('✅ Database connection closed');

    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Uncaught exception', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('❌ Unhandled promise rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the application
bootstrap().catch((error) => {
  logger.error('❌ Unhandled error during bootstrap', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
