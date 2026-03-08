import { Router } from 'express';
import { container } from '../../container';

/**
 * Product Routes
 *
 * Defines HTTP routes for product-related operations.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
const router = Router();

// Get controller from container (singleton pattern)
const productController = container.productController;

/**
 * GET /api/v1/products
 *
 * Retrieves all available products with their details and stock information.
 *
 * Response: 200 OK with array of ProductDto
 * Error: 500 Internal Server Error
 *
 * **Validates: Requirements 1.1**
 */
router.get('/', (req, res, next) => productController.getAllProducts(req, res, next));

/**
 * GET /api/v1/products/:id
 *
 * Retrieves a specific product by its ID.
 *
 * Parameters:
 * - id: Product UUID
 *
 * Response: 200 OK with ProductDto
 * Error: 400 Bad Request (invalid UUID), 404 Not Found, 500 Internal Server Error
 *
 * **Validates: Requirements 1.2, 1.3**
 */
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));

export { router as productRoutes };
export default router;
