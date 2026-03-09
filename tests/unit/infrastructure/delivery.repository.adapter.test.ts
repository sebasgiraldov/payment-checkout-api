import { DeliveryRepositoryAdapter } from '../../../src/infrastructure/repositories/delivery.repository.adapter';
import { Delivery } from '../../../src/domain/entities/delivery.entity';
import { Address } from '../../../src/domain/value-objects/address.value-object';

describe('DeliveryRepositoryAdapter', () => {
  let repository: DeliveryRepositoryAdapter;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      delivery: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    
    repository = new DeliveryRepositoryAdapter(mockPrismaService);
  });

  describe('findById', () => {
    it('should find delivery by id', async () => {
      const mockDelivery = {
        id: 'del-123',
        address: 'Calle 123',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110111',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrismaService.delivery.findUnique.mockResolvedValue(mockDelivery);

      const result = await repository.findById('del-123');

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe('del-123');
    });

    it('should return error when delivery not found', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValue(null);

      const result = await repository.findById('del-123');

      expect(result.isFailure).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPrismaService.delivery.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await repository.findById('del-123');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('save', () => {
    it('should save delivery', async () => {
      const address = Address.create({
        address: 'Calle 123',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110111',
      }).value;
      
      const delivery = Delivery.create({ address }).value;

      const mockSaved = {
        id: delivery.id,
        address: 'Calle 123',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110111',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.delivery.create.mockResolvedValue(mockSaved);

      const result = await repository.save(delivery);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle save errors', async () => {
      const address = Address.create({
        address: 'Calle 123',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110111',
      }).value;
      
      const delivery = Delivery.create({ address }).value;

      mockPrismaService.delivery.create.mockRejectedValue(new Error('DB error'));

      const result = await repository.save(delivery);

      expect(result.isFailure).toBe(true);
    });
  });
});
