import { DatabaseTransactionAdapter } from '../../../src/infrastructure/repositories/database-transaction.adapter';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

jest.mock('../../../src/infrastructure/database/prisma.service');

describe('DatabaseTransactionAdapter', () => {
  let adapter: DatabaseTransactionAdapter;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockPrismaService = {
      $transaction: jest.fn(),
    } as any;
    
    adapter = new DatabaseTransactionAdapter(mockPrismaService);
  });

  it('should execute callback within transaction', async () => {
    const mockCallback = jest.fn().mockResolvedValue('result');
    mockPrismaService.$transaction.mockImplementation((cb: any) => cb(mockPrismaService));

    const result = await adapter.execute(mockCallback);

    expect(result).toBe('result');
    expect(mockPrismaService.$transaction).toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should handle transaction errors', async () => {
    const mockCallback = jest.fn().mockRejectedValue(new Error('Transaction failed'));
    mockPrismaService.$transaction.mockImplementation((cb: any) => cb(mockPrismaService));

    await expect(adapter.execute(mockCallback)).rejects.toThrow('Transaction failed');
  });

  it('should rollback on error', async () => {
    const mockCallback = jest.fn().mockImplementation(() => {
      throw new Error('Rollback test');
    });
    mockPrismaService.$transaction.mockImplementation((cb: any) => cb(mockPrismaService));

    await expect(adapter.execute(mockCallback)).rejects.toThrow('Rollback test');
  });
});
