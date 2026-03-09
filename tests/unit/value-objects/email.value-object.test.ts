import { Email } from '../../../src/domain/value-objects/email.value-object';

/**
 * Unit tests for Email Value Object
 */
describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      // Act
      const result = Email.create('john.doe@example.com');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('john.doe@example.com');
    });

    it('should accept email with subdomain', () => {
      // Act
      const result = Email.create('user@mail.example.com');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('user@mail.example.com');
    });

    it('should accept email with plus sign', () => {
      // Act
      const result = Email.create('user+tag@example.com');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('user+tag@example.com');
    });

    it('should accept email with numbers', () => {
      // Act
      const result = Email.create('user123@example.com');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('user123@example.com');
    });

    it('should accept email with dots', () => {
      // Act
      const result = Email.create('john.doe.smith@example.com');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('john.doe.smith@example.com');
    });

    it('should fail when email is empty', () => {
      // Act
      const result = Email.create('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid email');
    });

    it('should fail when email is only whitespace', () => {
      // Act
      const result = Email.create('   ');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid email');
    });

    it('should fail when email has no @ symbol', () => {
      // Act
      const result = Email.create('invalidemail.com');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid email');
    });

    it('should fail when email has no domain', () => {
      // Act
      const result = Email.create('user@');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid email');
    });

    it('should fail when email has no local part', () => {
      // Act
      const result = Email.create('@example.com');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid email');
    });

    it('should fail when email has multiple @ symbols', () => {
      // Act
      const result = Email.create('user@@example.com');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid email');
    });

    it('should fail when email has spaces', () => {
      // Act
      const result = Email.create('user name@example.com');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Invalid email');
    });
  });

  describe('equals', () => {
    it('should return true for same email values', () => {
      // Arrange
      const email1 = Email.create('john.doe@example.com').value;
      const email2 = Email.create('john.doe@example.com').value;

      // Act & Assert
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different email values', () => {
      // Arrange
      const email1 = Email.create('john.doe@example.com').value;
      const email2 = Email.create('jane.smith@example.com').value;

      // Act & Assert
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
