import { Customer } from '../../../src/domain/entities/customer.entity';
import { Email } from '../../../src/domain/value-objects/email.value-object';
import { Phone } from '../../../src/domain/value-objects/phone.value-object';

/**
 * Unit tests for Customer Entity
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */
describe('Customer Entity', () => {
  describe('create', () => {
    it('should create a valid customer with all required fields', () => {
      // Arrange
      const emailResult = Email.create('john.doe@example.com');
      const phoneResult = Phone.create('+573001234567');

      expect(emailResult.isSuccess).toBe(true);
      expect(phoneResult.isSuccess).toBe(true);

      // Act
      const result = Customer.create({
        name: 'John Doe',
        email: emailResult.value,
        phone: phoneResult.value,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('John Doe');
      expect(result.value.email.value).toBe('john.doe@example.com');
      expect(result.value.phone.value).toBe('+573001234567');
      expect(result.value.id).toBeDefined();
      expect(result.value.createdAt).toBeInstanceOf(Date);
    });

    it('should fail when name is empty', () => {
      // Arrange
      const emailResult = Email.create('john.doe@example.com');
      const phoneResult = Phone.create('+573001234567');

      // Act
      const result = Customer.create({
        name: '',
        email: emailResult.value,
        phone: phoneResult.value,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('name');
    });

    it('should fail when name is only whitespace', () => {
      // Arrange
      const emailResult = Email.create('john.doe@example.com');
      const phoneResult = Phone.create('+573001234567');

      // Act
      const result = Customer.create({
        name: '   ',
        email: emailResult.value,
        phone: phoneResult.value,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('name');
    });

    it('should generate unique IDs for different customers', () => {
      // Arrange
      const emailResult = Email.create('john.doe@example.com');
      const phoneResult = Phone.create('+573001234567');

      // Act
      const customer1 = Customer.create({
        name: 'John Doe',
        email: emailResult.value,
        phone: phoneResult.value,
      });

      const customer2 = Customer.create({
        name: 'Jane Smith',
        email: emailResult.value,
        phone: phoneResult.value,
      });

      // Assert
      expect(customer1.value.id).not.toBe(customer2.value.id);
    });

    it('should accept custom ID when provided', () => {
      // Arrange
      const customId = '123e4567-e89b-12d3-a456-426614174000';
      const emailResult = Email.create('john.doe@example.com');
      const phoneResult = Phone.create('+573001234567');

      // Act
      const result = Customer.create({
        id: customId,
        name: 'John Doe',
        email: emailResult.value,
        phone: phoneResult.value,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(customId);
    });

    it('should accept custom timestamps when provided', () => {
      // Arrange
      const customDate = new Date('2024-01-01');
      const emailResult = Email.create('john.doe@example.com');
      const phoneResult = Phone.create('+573001234567');

      // Act
      const result = Customer.create({
        name: 'John Doe',
        email: emailResult.value,
        phone: phoneResult.value,
        createdAt: customDate,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.createdAt).toBe(customDate);
    });
  });
});
