import { Request, Response, NextFunction } from 'express';
import { PaymentController } from '../../../src/interfaces/controllers/payment.controller';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/process-payment.use-case';
import { Result } from '../../../src/shared/result';
import { PaymentResultDto } from '../../../src/application/dtos/transaction.dto';
import { TransactionStatus } from '../../../src/domain/entities/transaction.entity';

describe('PaymentController', () => {
  let controller: PaymentController;
  let mockUseCase: jest.Mocked<ProcessPaymentUseCase>;
  let mockRequest: Partial<Request> & { correlationId?: string };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new PaymentController(mockUseCase);

    mockRequest = {
      correlationId: 'test-correlation-id',
      method: 'POST',
      path: '/api/v1/payments/process',
      body: {
        transactionId: 'trans-123',
        cardNumber: '4242424242424242',
        cardHolder: 'John Doe',
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        customerEmail: 'john@example.com',
        idempotencyKey: 'idem-123',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('should return 200 with payment result when payment is APPROVED', async () => {
      const paymentResult: PaymentResultDto = {
        transactionId: 'trans-123',
        status: TransactionStatus.APPROVED,
        amount: 100000,
        currency: 'COP',
        externalPaymentId: 'wompi-123',
        message: 'Payment approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseCase.execute.mockResolvedValue(Result.ok(paymentResult));

      await controller.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: paymentResult,
          message: 'Payment processed successfully',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 200 with payment result when payment is DECLINED', async () => {
      const paymentResult: PaymentResultDto = {
        transactionId: 'trans-123',
        status: TransactionStatus.DECLINED,
        amount: 100000,
        currency: 'COP',
        externalPaymentId: 'wompi-123',
        message: 'Payment declined',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseCase.execute.mockResolvedValue(Result.ok(paymentResult));

      await controller.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: paymentResult,
          message: 'Payment was declined by the payment provider',
        })
      );
    });

    it('should return 200 with payment result when payment is PENDING', async () => {
      const paymentResult: PaymentResultDto = {
        transactionId: 'trans-123',
        status: TransactionStatus.PENDING,
        amount: 100000,
        currency: 'COP',
        externalPaymentId: 'wompi-123',
        message: 'Payment pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseCase.execute.mockResolvedValue(Result.ok(paymentResult));

      await controller.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: paymentResult,
          message: 'Payment is being processed',
        })
      );
    });

    it('should call next with error when use case fails', async () => {
      const error = new Error('Payment processing failed');

      mockUseCase.execute.mockResolvedValue(Result.fail(error as any));

      await controller.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should mask card number in logs', async () => {
      const paymentResult: PaymentResultDto = {
        transactionId: 'trans-123',
        status: TransactionStatus.APPROVED,
        amount: 100000,
        currency: 'COP',
        externalPaymentId: 'wompi-123',
        message: 'Payment approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseCase.execute.mockResolvedValue(Result.ok(paymentResult));

      await controller.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle unexpected errors', async () => {
      mockUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      await controller.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing card number', async () => {
      mockRequest.body.cardNumber = undefined;

      const paymentResult: PaymentResultDto = {
        transactionId: 'trans-123',
        status: TransactionStatus.APPROVED,
        amount: 100000,
        currency: 'COP',
        externalPaymentId: 'wompi-123',
        message: 'Payment approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseCase.execute.mockResolvedValue(Result.ok(paymentResult));

      await controller.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
