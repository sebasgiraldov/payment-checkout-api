import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from '../../application/use-cases/get-transaction-by-id.use-case';
import { validateDto } from '../middleware/validation.middleware';
import { CreateTransactionDto } from '../../application/dtos/transaction.dto';
import { TransactionRepositoryAdapter } from '../../infrastructure/repositories/transaction.repository.adapter';
import { ProductRepositoryAdapter } from '../../infrastructure/repositories/product.repository.adapter';
import { CustomerRepositoryAdapter } from '../../infrastructure/repositories/customer.repository.adapter';
import { DeliveryRepositoryAdapter } from '../../infrastructure/repositories/delivery.repository.adapter';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * Transaction Routes
 *
 * Defines HTTP routes for transaction-related operations.
 *
 * **Validates: Requirements 5.1, 9.1, 9.2, 9.3**
 */
const router = Router();

// Initialize dependencies
const prismaService = new PrismaService();
const transactionRepository = new TransactionRepositoryAdapter(prismaService);
const productRepository = new ProductRepositoryAdapter(prismaService);
const customerRepository = new CustomerRepositoryAdapter(prismaService);
const deliveryRepository = new DeliveryRepositoryAdapter(prismaService);

const createTransactionUseCase = new CreateTransactionUseCase(
  transactionRepository,
  productRepository,
  customerRepository,
  deliveryRepository
);
const getTransactionByIdUseCase = new GetTransactionByIdUseCase(transactionRepository);

const transactionController = new TransactionController(
  createTransactionUseCase,
  getTransactionByIdUseCase
);

/**
 * POST /api/v1/transactions
 *
 * Creates a new transaction with customer and delivery information.
 *
 * Body: CreateTransactionDto (validated)
 *
 * Response: 201 Created with TransactionDto
 * Error: 400 Bad Request (validation), 404 Not Found (product), 500 Internal Server Error
 *
 * **Validates: Requirements 5.1**
 */
router.post('/', validateDto(CreateTransactionDto), (req, res, next) =>
  transactionController.createTransaction(req, res, next)
);

/**
 * GET /api/v1/transactions/:id
 *
 * Retrieves a specific transaction by its ID.
 *
 * Parameters:
 * - id: Transaction UUID
 *
 * Response: 200 OK with TransactionDto
 * Error: 400 Bad Request (invalid UUID), 404 Not Found, 500 Internal Server Error
 *
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */
router.get('/:id', (req, res, next) => transactionController.getTransactionById(req, res, next));

export { router as transactionRoutes };
export default router;
