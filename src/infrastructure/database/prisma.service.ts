import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service Wrapper
 *
 * Extends PrismaClient to provide connection lifecycle management
 * and graceful shutdown handling.
 *
 * This service acts as a singleton to ensure a single database connection
 * pool is shared across the application.
 *
 * **Validates: Requirements 16.5, 20.5**
 *
 * @example
 * ```typescript
 * const prisma = PrismaService.getInstance();
 * await prisma.product.findMany();
 * ```
 */
export class PrismaService extends PrismaClient {
  private static instance: PrismaService;
  private isConnected = false;

  private constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  /**
   * Gets the singleton instance of PrismaService
   *
   * @returns The PrismaService instance
   */
  static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Connects to the database
   *
   * This method is idempotent - calling it multiple times is safe.
   *
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.$connect();
      this.isConnected = true;
      console.log('Database connected successfully');
    }
  }

  /**
   * Disconnects from the database gracefully
   *
   * This should be called during application shutdown to ensure
   * all pending operations complete and connections are closed properly.
   *
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.$disconnect();
      this.isConnected = false;
      console.log('Database disconnected successfully');
    }
  }

  /**
   * Sets up graceful shutdown handlers
   *
   * Registers handlers for SIGINT and SIGTERM signals to ensure
   * the database connection is closed properly on application shutdown.
   */
  setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`${signal} received, closing database connection...`);
      await this.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Export singleton instance
export const prisma = PrismaService.getInstance();
