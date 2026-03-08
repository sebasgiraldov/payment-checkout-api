import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WompiPaymentAdapter } from '../../infrastructure/payment/wompi-payment.adapter';

/**
 * Health Check Routes
 *
 * Defines HTTP routes for system health monitoring.
 *
 * **Validates: Requirements 17.5, 20.3**
 */
const router = Router();

// Initialize dependencies
const prismaService = new PrismaService();

// Initialize payment gateway adapter for health checks
const wompiConfig = {
  baseUrl: process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1',
  publicKey: process.env.WOMPI_PUBLIC_KEY || '',
  privateKey: process.env.WOMPI_PRIVATE_KEY || '',
  integrityKey: process.env.WOMPI_INTEGRITY_KEY || '',
};
const paymentAdapter = new WompiPaymentAdapter(wompiConfig);

const healthController = new HealthController(prismaService, paymentAdapter);

/**
 * GET /health
 *
 * Performs comprehensive health checks on all system dependencies.
 * Used by load balancers and monitoring systems.
 *
 * Response: 200 OK if all checks pass, 503 Service Unavailable if any check fails
 *
 * Health checks include:
 * - Database connectivity
 * - Payment gateway configuration
 * - Application status (memory, uptime)
 *
 * **Validates: Requirements 17.5, 20.3**
 */
router.get('/', (req, res, next) => healthController.checkHealth(req, res, next));

export { router as healthRoutes };
export default router;
