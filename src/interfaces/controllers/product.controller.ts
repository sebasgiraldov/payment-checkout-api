import { Request, Response, NextFunction } from 'express';
import { GetAllProductsUseCase } from '../../application/use-cases/get-all-products.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { ProductDto } from '../../application/dtos/product.dto';
import { logger } from '../../shared/utils/logger';

/**
 * Product Controller
 *
 * Handles HTTP requests for product-related operations.
 * Maps use case results to appropriate HTTP responses.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
export class ProductController {
  constructor(
    private readonly getAllProductsUseCase: GetAllProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase
  ) {}

  /**
   * GET /products
   *
   * Retrieves all available products with their details and stock information.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * **Validates: Requirements 1.1**
   */
  async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Getting all products', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
      });

      const result = await this.getAllProductsUseCase.execute();

      if (result.isFailure) {
        logger.error('Failed to get all products', {
          correlationId: req.correlationId,
          error: result.error.message,
        });
        return next(result.error);
      }

      const products = result.value;

      logger.info('Successfully retrieved all products', {
        correlationId: req.correlationId,
        productCount: products.length,
      });

      res.status(200).json({
        success: true,
        data: products,
        count: products.length,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Unexpected error in getAllProducts', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  /**
   * GET /products/:id
   *
   * Retrieves a specific product by its ID.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   *
   * **Validates: Requirements 1.2, 1.3**
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id;

      logger.info('Getting product by ID', {
        correlationId: req.correlationId,
        productId,
        method: req.method,
        path: req.path,
      });

      // Basic UUID validation
      if (!productId || !isValidUUID(productId)) {
        logger.warn('Invalid product ID format', {
          correlationId: req.correlationId,
          productId,
        });

        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Invalid product ID format. Must be a valid UUID.',
          timestamp: new Date().toISOString(),
          correlationId: req.correlationId,
        });
        return;
      }

      const result = await this.getProductByIdUseCase.execute(productId);

      if (result.isFailure) {
        logger.error('Failed to get product by ID', {
          correlationId: req.correlationId,
          productId,
          error: result.error.message,
        });
        return next(result.error);
      }

      const product = result.value;

      logger.info('Successfully retrieved product', {
        correlationId: req.correlationId,
        productId: product.id,
        productName: product.name,
      });

      res.status(200).json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Unexpected error in getProductById', {
        correlationId: req.correlationId,
        productId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }
}

/**
 * Validates if a string is a valid UUID format
 *
 * @param uuid - String to validate
 * @returns True if valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default ProductController;
