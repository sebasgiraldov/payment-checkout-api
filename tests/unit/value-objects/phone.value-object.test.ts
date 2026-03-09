import { Phone } from '../../../src/domain/value-objects/phone.value-object';

/**
 * Unit tests for Phone Value Object
 */
describe('Phone Value Object', () => {
  describe('create', () => {
    it('should create a valid Colombian phone number', () => {
      // Act
      const result = Phone.create('+573001234567');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('573001234567'); // Cleaned (no +)
    });

    it('should create a valid US phone number', () => {
      // Act
      const result = Phone.create('+12025551234');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('12025551234'); // Cleaned (no +)
    });

    it('should create a valid international phone number', () => {
      // Act
      const result = Phone.create('+442071234567');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('442071234567'); // Cleaned (no +)
    });

    it('should fail when phone is empty', () => {
      // Act
      const result = Phone.create('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid phone');
    });

    it('should fail when phone is only whitespace', () => {
      // Act
      const result = Phone.create('   ');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid phone');
    });

    it('should accept phone without + prefix', () => {
      // Act
      const result = Phone.create('573001234567');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('573001234567');
    });

    it('should clean phone with letters and fail if too short', () => {
      // Act
      const result = Phone.create('+57300ABC4567');

      // Assert - After cleaning letters, it becomes 573004567 (9 digits, too short)
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid phone number');
    });

    it('should fail when phone is too short after cleaning', () => {
      // Act
      const result = Phone.create('+57');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid phone');
    });

    it('should accept phone with spaces (cleaned)', () => {
      // Act
      const result = Phone.create('+57 300 123 4567');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('573001234567'); // Spaces removed
    });

    it('should accept phone with special characters (cleaned)', () => {
      // Act
      const result = Phone.create('+57-300-123-4567');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('573001234567'); // Hyphens removed
    });
  });

  describe('equals', () => {
    it('should return true for same phone values', () => {
      // Arrange
      const phone1 = Phone.create('+573001234567').value;
      const phone2 = Phone.create('+573001234567').value;

      // Act & Assert
      expect(phone1.equals(phone2)).toBe(true);
    });

    it('should return false for different phone values', () => {
      // Arrange
      const phone1 = Phone.create('+573001234567').value;
      const phone2 = Phone.create('+573009876543').value;

      // Act & Assert
      expect(phone1.equals(phone2)).toBe(false);
    });
  });
});
