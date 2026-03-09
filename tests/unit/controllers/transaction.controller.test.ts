import { Request, Response, NextFunction } from 'express';
import { TransactionController } from '../../../src/interfaces/controllers/transaction.controller';
import { CreateTransactionUseCase } from '../../../src/application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from '../../../src/application/use-cases/get-transaction-by-id.use-case';
import { Result } from '../../../src/shared/result';
import { TransactionDto } from '../../../src/application/dtos/transaction.dto';
import { TransactionStatus } from '../../../src/domain/entities/transaction.entity';

describe('TransactionController', () => {
  let controller: TransactionController;
  let mockCreateUseCase: jest.Mocked<CreateTransactionUseCase>;
  let mockGetByIdUseCase: jest.Mocked<GetTransactionByIdUseCase>;
  let mockRequest: Partial<Request> & { correlationId?: string };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockCreateUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetByIdUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new TransactionController(mockCreateUseCase, mockGetByIdUseCase);

    mockRequest = {
      correlationId: 'test-correlation-id',
      method: 'POST',
      path: '/api/v1/transactions',
      body: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should return 201 when transaction is created successfully', async () => {
      const transactionDto: TransactionDto = {
        id: 'trans-123',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        totalAmount: 115000,
        currency: 'COP',
        status: TransactionStatus.PENDING,
        paymentMethod: 'CARD',
        externalPaymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateUseCase.execute.mockResolvedValue(Result.ok(transactionDto));

      await controller.createTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: transactionDto,
          message: 'Transaction created successfully',
        })
      );
    });

    it('should call next with error when use case fails', async () => {
      const error = new Error('Failed to create transaction');

      mockCreateUseCase.execute.mockResolvedValue(Result.fail(error as any));

      await controller.createTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      mockCreateUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      await controller.createTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getTransactionById', () => {
    it('should return 200 with transaction data', async () => {
      const transactionDto: TransactionDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        productId: 'prod-123',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        amount: 100000,
        baseFee: 5000,
        deliveryFee: 10000,
        totalAmount: 115000,
        currency: 'COP',
        status: TransactionStatus.PENDING,
        paymentMethod: 'CARD',
        externalPaymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockGetByIdUseCase.execute.mockResolvedValue(Result.ok(transactionDto));

      await controller.getTransactionById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: transactionDto,
        })
      );
    });

    it('should return 400 for invalid UUID format', async () => {
      mockRequest.params = { id: 'invalid-uuid' };

      await controller.getTransactionById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bad Request',
          message: expect.stringContaining('Invalid transaction ID format'),
        })
      );
    });

    it('should call next with error when transaction not found', async () => {
      const error = new Error('Transaction not found');
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      mockGetByIdUseCase.execute.mockResolvedValue(Result.fail(error as any));

      await controller.getTransactionById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle unexpected errors', async () => {
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockGetByIdUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      await controller.getTransactionById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
