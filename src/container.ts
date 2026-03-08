import { PrismaService } from './infrastructure/database/prisma.service';
import { ProductRepositoryAdapter } from './infrastructure/repositories/product.repository.adapter';
import { CustomerRepositoryAdapter } from './infrastructure/repositories/customer.repository.adapter';
import { DeliveryRepositoryAdapter } from './infrastructure/repositories/delivery.repository.adapter';
import { TransactionRepositoryAdapter } from './infrastructure/repositories/transaction.repository.adapter';
import { DatabaseTransactionAdapter } from './infrastructure/repositories/database-transaction.adapter';
import { WompiPaymentAdapter } from './infrastructure/payment/wompi-payment.adapter';
import { GetAllProductsUseCase } from './application/use-cases/get-all-products.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from './application/use-cases/get-transaction-by-id.use-case';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { ProductController } from './interfaces/controllers/product.controller';
import { TransactionController } from './interfaces/controllers/transaction.controller';
import { PaymentController } from './interfaces/controllers/payment.controller';
import { HealthController } from './interfaces/controllers/health.controller';
import { config } from './config';

/**
 * Dependency Injection Container
 *
 * Manages the lifecycle and dependencies of all application components.
 * Follows the singleton pattern to ensure single instances across the application.
 *
 * **Validates: Requirements 19.1**
 */
export class Container {
  private static instance: Container;

  // Infrastructure
  public readonly prismaService: PrismaService;
  public readonly productRepository: ProductRepositoryAdapter;
  public readonly customerRepository: CustomerRepositoryAdapter;
  public readonly deliveryRepository: DeliveryRepositoryAdapter;
  public readonly transactionRepository: TransactionRepositoryAdapter;
  public readonly databaseTransactionAdapter: DatabaseTransactionAdapter;
  public readonly paymentGateway: WompiPaymentAdapter;

  // Use Cases
  public readonly getAllProductsUseCase: GetAllProductsUseCase;
  public readonly getProductByIdUseCase: GetProductByIdUseCase;
  public readonly createTransactionUseCase: CreateTransactionUseCase;
  public readonly getTransactionByIdUseCase: GetTransactionByIdUseCase;
  public readonly processPaymentUseCase: ProcessPaymentUseCase;

  // Controllers
  public readonly productController: ProductController;
  public readonly transactionController: TransactionController;
  public readonly paymentController: PaymentController;
  public readonly healthController: HealthController;

  private constructor() {
    // Initialize infrastructure layer
    this.prismaService = PrismaService.getInstance();

    // Initialize repositories
    this.productRepository = new ProductRepositoryAdapter(this.prismaService);
    this.customerRepository = new CustomerRepositoryAdapter(this.prismaService);
    this.deliveryRepository = new DeliveryRepositoryAdapter(this.prismaService);
    this.transactionRepository = new TransactionRepositoryAdapter(this.prismaService);
    this.databaseTransactionAdapter = new DatabaseTransactionAdapter(this.prismaService);

    // Initialize payment gateway with configuration
    this.paymentGateway = new WompiPaymentAdapter({
      baseUrl: config.wompi.baseUrl,
      publicKey: config.wompi.publicKey,
      privateKey: config.wompi.privateKey,
      integrityKey: config.wompi.integrityKey,
    });

    // Initialize use cases
    this.getAllProductsUseCase = new GetAllProductsUseCase(this.productRepository);

    this.getProductByIdUseCase = new GetProductByIdUseCase(this.productRepository);

    this.createTransactionUseCase = new CreateTransactionUseCase(
      this.transactionRepository,
      this.productRepository,
      this.customerRepository,
      this.deliveryRepository
    );

    this.getTransactionByIdUseCase = new GetTransactionByIdUseCase(this.transactionRepository);

    this.processPaymentUseCase = new ProcessPaymentUseCase(
      this.transactionRepository,
      this.productRepository,
      this.paymentGateway
    );

    // Initialize controllers
    this.productController = new ProductController(
      this.getAllProductsUseCase,
      this.getProductByIdUseCase
    );

    this.transactionController = new TransactionController(
      this.createTransactionUseCase,
      this.getTransactionByIdUseCase
    );

    this.paymentController = new PaymentController(this.processPaymentUseCase);

    this.healthController = new HealthController(this.prismaService);
  }

  /**
   * Gets the singleton instance of the container
   *
   * @returns The container instance
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Initializes the container and connects to the database
   */
  public async initialize(): Promise<void> {
    await this.prismaService.connect();
  }

  /**
   * Cleans up resources and disconnects from the database
   */
  public async cleanup(): Promise<void> {
    await this.prismaService.disconnect();
  }
}

/**
 * Export singleton instance for easy access
 */
export const container = Container.getInstance();
