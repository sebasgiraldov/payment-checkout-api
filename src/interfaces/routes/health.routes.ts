import { Router } from 'express';
import { container } from '../../container';

/**
 * Health Check Routes
 *
 * Defines HTTP routes for system health monitoring.
 *
 * **Validates: Requirements 17.5, 20.3**
 */
const router = Router();

// Get controller from container (singleton pattern)
const healthController = container.healthController;

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
router.get('/', (req, res) => healthController.checkHealth(req, res));

export { router as healthRoutes };
export default router;
