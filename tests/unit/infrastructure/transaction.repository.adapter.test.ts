import { TransactionRepositoryAdapter } from '../../../src/infrastructure/repositories/transaction.repository.adapter';
import { Transaction, TransactionStatus } from '../../../src/domain/entities/transaction.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';
import { Prisma } from '@prisma/client';

describe('TransactionRepositoryAdapter', () => {
  let repository: TransactionRepositoryAdapter;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      transaction: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    
    repository = new TransactionRepositoryAdapter(mockPrismaService);
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      const mockTransaction = {
        id: 'trans-123',
        productId: 'prod-123',
        quantity: 1,
        unitPrice: new Prisma.Decimal(100000),
        currency: 'COP',
        totalAmount: new Prisma.Decimal(100000),
        status: 'PENDING',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        externalPaymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await repository.findById('trans-123');

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe('trans-123');
    });

    it('should return error when transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.findById('trans-123');

      expect(result.isFailure).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPrismaService.transaction.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await repository.findById('trans-123');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('save', () => {
    it('should save transaction', async () => {
      const money = Money.create(100000, 'COP').value;
      const transaction = Transaction.create({
        productId: 'prod-123',
        quantity: 1,
        unitPrice: money,
        totalAmount: money,
        status: TransactionStatus.PENDING,
        customerId: 'cust-123',
        deliveryId: 'del-123',
      }).value;

      const mockSaved = {
        id: transaction.id,
        productId: 'prod-123',
        quantity: 1,
        unitPrice: new Prisma.Decimal(100000),
        currency: 'COP',
        totalAmount: new Prisma.Decimal(100000),
        status: 'PENDING',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        externalPaymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockSaved);

      const result = await repository.save(transaction);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle save errors', async () => {
      const money = Money.create(100000, 'COP').value;
      const transaction = Transaction.create({
        productId: 'prod-123',
        quantity: 1,
        unitPrice: money,
        totalAmount: money,
        status: TransactionStatus.PENDING,
        customerId: 'cust-123',
        deliveryId: 'del-123',
      }).value;

      mockPrismaService.transaction.create.mockRejectedValue(new Error('DB error'));

      const result = await repository.save(transaction);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('update', () => {
    it('should update transaction', async () => {
      const money = Money.create(100000, 'COP').value;
      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        quantity: 1,
        unitPrice: money,
        totalAmount: money,
        status: TransactionStatus.APPROVED,
        customerId: 'cust-123',
        deliveryId: 'del-123',
        externalPaymentId: 'wompi-123',
      }).value;

      const mockUpdated = {
        id: 'trans-123',
        productId: 'prod-123',
        quantity: 1,
        unitPrice: new Prisma.Decimal(100000),
        currency: 'COP',
        totalAmount: new Prisma.Decimal(100000),
        status: 'APPROVED',
        customerId: 'cust-123',
        deliveryId: 'del-123',
        externalPaymentId: 'wompi-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.transaction.update.mockResolvedValue(mockUpdated);

      const result = await repository.update(transaction);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle update errors', async () => {
      const money = Money.create(100000, 'COP').value;
      const transaction = Transaction.create({
        id: 'trans-123',
        productId: 'prod-123',
        quantity: 1,
        unitPrice: money,
        totalAmount: money,
        status: TransactionStatus.APPROVED,
        customerId: 'cust-123',
        deliveryId: 'del-123',
      }).value;

      mockPrismaService.transaction.update.mockRejectedValue(new Error('DB error'));

      const result = await repository.update(transaction);

      expect(result.isFailure).toBe(true);
    });
  });
});
