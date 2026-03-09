import { CustomerRepositoryAdapter } from '../../../src/infrastructure/repositories/customer.repository.adapter';
import { Customer } from '../../../src/domain/entities/customer.entity';
import { Email } from '../../../src/domain/value-objects/email.value-object';
import { Phone } from '../../../src/domain/value-objects/phone.value-object';
import { Prisma } from '@prisma/client';

describe('CustomerRepositoryAdapter', () => {
  let repository: CustomerRepositoryAdapter;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    
    repository = new CustomerRepositoryAdapter(mockPrismaService);
  });

  describe('findById', () => {
    it('should find customer by id', async () => {
      const mockCustomer = {
        id: 'cust-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+573001234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await repository.findById('cust-123');

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe('cust-123');
    });

    it('should return error when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      const result = await repository.findById('cust-123');

      expect(result.isFailure).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPrismaService.customer.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await repository.findById('cust-123');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('save', () => {
    it('should save customer', async () => {
      const email = Email.create('john@example.com').value;
      const phone = Phone.create('+573001234567').value;
      const customer = Customer.create({
        name: 'John Doe',
        email,
        phone,
      }).value;

      const mockSaved = {
        id: customer.id,
        name: customer.name,
        email: 'john@example.com',
        phone: '+573001234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.customer.create.mockResolvedValue(mockSaved);

      const result = await repository.save(customer);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle save errors', async () => {
      const email = Email.create('john@example.com').value;
      const phone = Phone.create('+573001234567').value;
      const customer = Customer.create({
        name: 'John Doe',
        email,
        phone,
      }).value;

      mockPrismaService.customer.create.mockRejectedValue(new Error('DB error'));

      const result = await repository.save(customer);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      const email = Email.create('john@example.com').value;
      const phone = Phone.create('+573001234567').value;
      const customer = Customer.create({
        id: 'cust-123',
        name: 'John Doe',
        email,
        phone,
      }).value;

      const mockUpdated = {
        id: customer.id,
        name: customer.name,
        email: 'john@example.com',
        phone: '+573001234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.customer.update.mockResolvedValue(mockUpdated);

      const result = await repository.update(customer);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle update errors', async () => {
      const email = Email.create('john@example.com').value;
      const phone = Phone.create('+573001234567').value;
      const customer = Customer.create({
        id: 'cust-123',
        name: 'John Doe',
        email,
        phone,
      }).value;

      mockPrismaService.customer.update.mockRejectedValue(new Error('DB error'));

      const result = await repository.update(customer);

      expect(result.isFailure).toBe(true);
    });
  });
});
