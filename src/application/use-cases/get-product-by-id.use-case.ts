import { Result } from '../../shared/result';
import { IProductRepository } from '../../domain/repositories/product.repository';
import { ProductDto } from '../dtos/product.dto';
import { ApplicationError, ProductNotFoundError } from '../errors/application.error';

/**
 * GetProductByIdUseCase
 *
 * Retrieves a specific product by its ID.
 *
 * **Validates: Requirements 1.2, 1.3**
 */
export class GetProductByIdUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * Executes the use case to retrieve a product by ID
   *
   * @param productId - The product UUID
   * @returns Result containing ProductDto or ApplicationError
   *
   * **Validates: Requirements 1.2, 1.3**
   */
  async execute(productId: string): Promise<Result<ProductDto, ApplicationError>> {
    const productResult = await this.productRepository.findById(productId);

    if (productResult.isFailure) {
      return Result.fail(new ProductNotFoundError(productId));
    }

    const product = productResult.value;
    return Result.ok(ProductDto.fromEntity(product));
  }
}
