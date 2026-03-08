import { Address } from '../../../src/domain/value-objects/address.value-object';

/**
 * Unit tests for Address Value Object
 */
describe('Address Value Object', () => {
  describe('create', () => {
    it('should create a valid address with all fields', () => {
      // Act
      const result = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.street).toBe('Carrera 7 #32-16');
      expect(result.value.city).toBe('Bogota');
      expect(result.value.state).toBe('Cundinamarca');
      expect(result.value.country).toBe('Colombia');
      expect(result.value.postalCode).toBe('110231');
    });

    it('should create a valid address without state', () => {
      // Act
      const result = Address.create({
        street: '123 Main St',
        city: 'New York',
        state: '',
        country: 'USA',
        postalCode: '10001',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.state).toBe('');
    });

    it('should fail when street is empty', () => {
      // Act
      const result = Address.create({
        street: '',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('street');
    });

    it('should fail when city is empty', () => {
      // Act
      const result = Address.create({
        street: 'Carrera 7 #32-16',
        city: '',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('city');
    });

    it('should fail when country is empty', () => {
      // Act
      const result = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: '',
        postalCode: '110231',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('country');
    });

    it('should fail when postal code is empty', () => {
      // Act
      const result = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('postal code');
    });

    it('should fail when street is only whitespace', () => {
      // Act
      const result = Address.create({
        street: '   ',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('street');
    });
  });

  describe('equals', () => {
    it('should return true for same address values', () => {
      // Arrange
      const address1 = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      }).value;

      const address2 = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      }).value;

      // Act & Assert
      expect(address1.equals(address2)).toBe(true);
    });

    it('should return false for different street', () => {
      // Arrange
      const address1 = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      }).value;

      const address2 = Address.create({
        street: 'Calle 100 #15-20',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      }).value;

      // Act & Assert
      expect(address1.equals(address2)).toBe(false);
    });

    it('should return false for different city', () => {
      // Arrange
      const address1 = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      }).value;

      const address2 = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Medellin',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      }).value;

      // Act & Assert
      expect(address1.equals(address2)).toBe(false);
    });
  });

  describe('getFullAddress', () => {
    it('should return formatted full address with state', () => {
      // Arrange
      const address = Address.create({
        street: 'Carrera 7 #32-16',
        city: 'Bogota',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110231',
      }).value;

      // Act
      const fullAddress = address.getFullAddress();

      // Assert
      expect(fullAddress).toBe('Carrera 7 #32-16, Bogota, Cundinamarca, Colombia, 110231');
    });

    it('should return formatted full address without state', () => {
      // Arrange
      const address = Address.create({
        street: '123 Main St',
        city: 'New York',
        state: '',
        country: 'USA',
        postalCode: '10001',
      }).value;

      // Act
      const fullAddress = address.getFullAddress();

      // Assert
      expect(fullAddress).toBe('123 Main St, New York, USA, 10001');
    });
  });
});
