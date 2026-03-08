import { Result } from '../../shared/result';
import { IProductRepository } from '../../domain/repositories/product.repository';
import { ProductDto } from '../dtos/product.dto';
import { ApplicationError } from '../errors/application.error';

/**
 * GetAllProductsUseCase
 *
 * Retrieves all products from the catalog.
 *
 * **Validates: Requirements 1.1**
 */
export class GetAllProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * Executes the use case to retrieve all products
   *
   * @returns Result containing array of ProductDto or ApplicationError
   *
   * **Validates: Requirements 1.1**
   */
  async execute(): Promise<Result<ProductDto[], ApplicationError>> {
    const productsResult = await this.productRepository.findAll();

    if (productsResult.isFailure) {
      return Result.fail(productsResult.error);
    }

    const products = productsResult.value;
    const productDtos = products.map((product) => ProductDto.fromEntity(product));

    return Result.ok(productDtos);
  }
}
