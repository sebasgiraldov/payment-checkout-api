import { Router } from 'express';
import { validateDto } from '../middleware/validation.middleware';
import { strictPaymentRateLimiter } from '../middleware/rate-limit.middleware';
import { ProcessPaymentDto } from '../../application/dtos/transaction.dto';
import { container } from '../../container';

/**
 * Payment Routes
 *
 * Defines HTTP routes for payment processing operations.
 *
 * **Validates: Requirements 6.1, 6.2, 11.3**
 */
const router = Router();

// Get controller from container
const paymentController = container.paymentController;

/**
 * POST /api/v1/payments/process
 *
 * Processes a payment for an existing transaction.
 * Returns payment result for both approved and declined payments (200 status).
 * Only returns error status codes for system failures.
 *
 * Body: ProcessPaymentDto (validated)
 *
 * Response: 200 OK with PaymentResultDto (for both approved/declined)
 * Error: 400 Bad Request (validation/insufficient stock), 404 Not Found (transaction),
 *        503 Service Unavailable (payment gateway), 500 Internal Server Error
 *
 * **Validates: Requirements 6.1, 6.2, 11.3, 14.6**
 */
router.post(
  '/process',
  strictPaymentRateLimiter,
  validateDto(ProcessPaymentDto),
  (req, res, next) => paymentController.processPayment(req, res, next)
);

export { router as paymentRoutes };
export default router;
