import { Delivery } from '../../../src/domain/entities/delivery.entity';
import { Address } from '../../../src/domain/value-objects/address.value-object';
import { Money } from '../../../src/domain/value-objects/money.value-object';

/**
 * Unit tests for Delivery Entity
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */
describe('Delivery Entity', () => {
  describe('create', () => {
    it('should create a valid delivery with all required fields', () => {
      // Arrange
      const addressResult = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      });

      const deliveryFeeResult = Money.create(10000, 'COP');

      expect(addressResult.isSuccess).toBe(true);
      expect(deliveryFeeResult.isSuccess).toBe(true);

      // Act
      const result = Delivery.create({
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        address: addressResult.value.street,
        city: addressResult.value.city,
        state: addressResult.value.state,
        country: addressResult.value.country,
        postalCode: addressResult.value.postalCode,
        deliveryFee: deliveryFeeResult.value,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.customerId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.value.address).toBe('Carrera 7 #32-16');
      expect(result.value.city).toBe('Bogota');
      expect(result.value.deliveryFee.amount).toBe(10000);
      expect(result.value.deliveryFee.currency).toBe('COP');
      expect(result.value.id).toBeDefined();
      expect(result.value.createdAt).toBeInstanceOf(Date);
    });

    it('should fail when customer ID is empty', () => {
      // Arrange
      const addressResult = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      });

      const deliveryFeeResult = Money.create(10000, 'COP');

      // Act
      const result = Delivery.create({
        customerId: '',
        address: addressResult.value.street,
        city: addressResult.value.city,
        state: addressResult.value.state,
        country: addressResult.value.country,
        postalCode: addressResult.value.postalCode,
        deliveryFee: deliveryFeeResult.value,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Customer ID');
    });

    it('should fail when address is empty', () => {
      // Arrange
      const deliveryFeeResult = Money.create(10000, 'COP');

      // Act
      const result = Delivery.create({
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        address: '',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
        deliveryFee: deliveryFeeResult.value,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('address');
    });

    it('should fail when city is empty', () => {
      // Arrange
      const deliveryFeeResult = Money.create(10000, 'COP');

      // Act
      const result = Delivery.create({
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        address: 'Carrera 7 #32-16',
        city: '',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
        deliveryFee: deliveryFeeResult.value,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('city');
    });

    it('should fail when country is empty', () => {
      // Arrange
      const deliveryFeeResult = Money.create(10000, 'COP');

      // Act
      const result = Delivery.create({
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        address: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: '',
        postalCode: '110231',
        deliveryFee: deliveryFeeResult.value,
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('country');
    });

    it('should allow empty state (optional field)', () => {
      // Arrange
      const deliveryFeeResult = Money.create(10000, 'COP');

      // Act
      const result = Delivery.create({
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        address: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: '',
        country: 'Colombia',
        postalCode: '110231',
        deliveryFee: deliveryFeeResult.value,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.state).toBe('');
    });

    it('should generate unique IDs for different deliveries', () => {
      // Arrange
      const deliveryFeeResult = Money.create(10000, 'COP');

      // Act
      const delivery1 = Delivery.create({
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        address: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
        deliveryFee: deliveryFeeResult.value,
      });

      const delivery2 = Delivery.create({
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        address: 'Calle 100 #15-20',
        city: 'Medellin',
        state: 'Antioquia',
        country: 'Colombia',
        postalCode: '050001',
        deliveryFee: deliveryFeeResult.value,
      });

      // Assert
      expect(delivery1.value.id).not.toBe(delivery2.value.id);
    });
  });
});
