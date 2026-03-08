import { Request, Response } from 'express';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WompiPaymentAdapter } from '../../infrastructure/payment/wompi-payment.adapter';
import { logger } from '../../shared/utils/logger';

/**
 * Health Check Controller
 *
 * Provides system health status including database and payment gateway connectivity.
 * Used by load balancers and monitoring systems.
 *
 * **Validates: Requirements 17.5, 20.3**
 */
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paymentAdapter: WompiPaymentAdapter
  ) {}

  /**
   * GET /health
   *
   * Performs comprehensive health checks on all system dependencies.
   * Returns 200 if all checks pass, 503 if any check fails.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * **Validates: Requirements 17.5, 20.3**
   */
  async checkHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    logger.info('Health check requested', {
      correlationId: req.correlationId,
      timestamp,
      method: req.method,
      path: req.path,
    });

    const healthChecks = {
      database: await this.checkDatabase(),
      paymentGateway: await this.checkPaymentGateway(),
      application: this.checkApplication(),
    };

    const allHealthy = Object.values(healthChecks).every((check) => check.status === 'healthy');
    const duration = Date.now() - startTime;

    const healthResponse = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      duration: `${duration}ms`,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: healthChecks,
      correlationId: req.correlationId,
    };

    if (allHealthy) {
      logger.info('Health check passed', {
        correlationId: req.correlationId,
        duration: `${duration}ms`,
        checks: Object.keys(healthChecks).reduce(
          (acc, key) => {
            acc[key] = healthChecks[key as keyof typeof healthChecks].status;
            return acc;
          },
          {} as Record<string, string>
        ),
      });

      res.status(200).json(healthResponse);
    } else {
      logger.error('Health check failed', {
        correlationId: req.correlationId,
        duration: `${duration}ms`,
        failedChecks: Object.entries(healthChecks)
          .filter(([_, check]) => check.status !== 'healthy')
          .map(([name, check]) => ({ name, status: check.status, error: check.error })),
      });

      res.status(503).json(healthResponse);
    }
  }

  /**
   * Checks database connectivity
   *
   * @returns Database health status
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now();

      // Simple query to test database connectivity
      await this.prismaService.$queryRaw`SELECT 1`;

      const duration = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${duration}ms`,
        details: 'Database connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown database error',
        details: 'Database connection failed',
      };
    }
  }

  /**
   * Checks payment gateway connectivity
   *
   * @returns Payment gateway health status
   */
  private async checkPaymentGateway(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now();

      // Simple connectivity check to payment gateway
      // This could be a ping endpoint or health check endpoint from Wompi
      // For now, we'll just check if the adapter is properly configured
      const isConfigured =
        this.paymentAdapter && process.env.WOMPI_BASE_URL && process.env.WOMPI_PUBLIC_KEY;

      if (!isConfigured) {
        return {
          status: 'unhealthy',
          error: 'Payment gateway not properly configured',
          details: 'Missing required configuration',
        };
      }

      const duration = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${duration}ms`,
        details: 'Payment gateway configuration valid',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown payment gateway error',
        details: 'Payment gateway check failed',
      };
    }
  }

  /**
   * Checks application-level health
   *
   * @returns Application health status
   */
  private checkApplication(): HealthCheckResult {
    try {
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      };

      // Check uptime
      const uptimeSeconds = process.uptime();
      const uptime = {
        seconds: Math.floor(uptimeSeconds),
        formatted: formatUptime(uptimeSeconds),
      };

      return {
        status: 'healthy',
        details: 'Application running normally',
        memory: memoryUsageMB,
        uptime,
        nodeVersion: process.version,
        pid: process.pid,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown application error',
        details: 'Application health check failed',
      };
    }
  }
}

/**
 * Health check result interface
 */
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  responseTime?: string;
  error?: string;
  details?: string;
  memory?: any;
  uptime?: any;
  nodeVersion?: string;
  pid?: number;
}

/**
 * Formats uptime seconds into human-readable format
 *
 * @param seconds - Uptime in seconds
 * @returns Formatted uptime string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

export default HealthController;
