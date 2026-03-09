import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = PrismaService.getInstance();
  });

  it('should return singleton instance', () => {
    const instance1 = PrismaService.getInstance();
    const instance2 = PrismaService.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should have $connect method', () => {
    expect(prismaService.$connect).toBeDefined();
    expect(typeof prismaService.$connect).toBe('function');
  });

  it('should have $disconnect method', () => {
    expect(prismaService.$disconnect).toBeDefined();
    expect(typeof prismaService.$disconnect).toBe('function');
  });

  it('should have $transaction method', () => {
    expect(prismaService.$transaction).toBeDefined();
    expect(typeof prismaService.$transaction).toBe('function');
  });

  it('should have product model', () => {
    expect(prismaService.product).toBeDefined();
  });

  it('should have customer model', () => {
    expect(prismaService.customer).toBeDefined();
  });

  it('should have delivery model', () => {
    expect(prismaService.delivery).toBeDefined();
  });

  it('should have transaction model', () => {
    expect(prismaService.transaction).toBeDefined();
  });
});
