import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { GetAllProductsUseCase } from '../../application/use-cases/get-all-products.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { ProductRepositoryAdapter } from '../../infrastructure/repositories/product.repository.adapter';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * Product Routes
 *
 * Defines HTTP routes for product-related operations.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
const router = Router();

// Initialize dependencies
const prismaService = new PrismaService();
const productRepository = new ProductRepositoryAdapter(prismaService);
const getAllProductsUseCase = new GetAllProductsUseCase(productRepository);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepository);
const productController = new ProductController(getAllProductsUseCase, getProductByIdUseCase);

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
