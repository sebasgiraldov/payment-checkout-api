import { Transaction, TransactionStatus } from '../../../src/domain/entities/transaction.entity';
import { Money } from '../../../src/domain/value-objects/money.value-object';

/**
 * Unit tests for Transaction Entity
 *
 * **Validates: Requirements 5.1, 5.2, 5.6, 5.7, 5.8, 8.1, 8.2, 8.3, 8.4**
 */
describe('Transaction Entity', () => {
  describe('create', () => {
    it('should create a valid transaction with all required fields', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      // Act
      const result = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.productId).toBe('product-123');
      expect(result.value.customerId).toBe('customer-123');
      expect(result.value.deliveryId).toBe('delivery-123');
      expect(result.value.status).toBe(TransactionStatus.PENDING);
      expect(result.value.totalAmount.amount).toBe(115000); // 100000 + 5000 + 10000
      expect(result.value.externalPaymentId).toBeNull();
    });

    it('should fail when product ID is empty', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      // Act
      const result = Transaction.create({
        productId: '',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Product ID');
    });

    it('should fail when customer ID is empty', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      // Act
      const result = Transaction.create({
        productId: 'product-123',
        customerId: '',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Customer ID');
    });

    it('should fail when delivery ID is empty', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      // Act
      const result = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: '',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Delivery ID');
    });

    it('should fail when payment method is empty', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      // Act
      const result = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Payment method');
    });
  });

  describe('approve', () => {
    it('should approve a pending transaction', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act
      const result = transaction.approve('external-payment-123');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(transaction.status).toBe(TransactionStatus.APPROVED);
      expect(transaction.externalPaymentId).toBe('external-payment-123');
    });

    it('should fail to approve when external payment ID is empty', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act
      const result = transaction.approve('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('External payment ID');
    });

    it('should fail to approve when transaction is already approved', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      transaction.approve('external-payment-123');

      // Act
      const result = transaction.approve('external-payment-456');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('state');
    });
  });

  describe('decline', () => {
    it('should decline a pending transaction', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act
      const result = transaction.decline('external-payment-123');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(transaction.status).toBe(TransactionStatus.DECLINED);
      expect(transaction.externalPaymentId).toBe('external-payment-123');
    });

    it('should fail to decline when external payment ID is empty', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act
      const result = transaction.decline('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('External payment ID');
    });
  });

  describe('fail', () => {
    it('should mark a pending transaction as failed', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act
      const result = transaction.fail('Payment gateway error');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(transaction.status).toBe(TransactionStatus.FAILED);
    });
  });

  describe('setExternalPaymentId', () => {
    it('should set external payment ID for pending transaction', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act
      const result = transaction.setExternalPaymentId('external-payment-123');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(transaction.externalPaymentId).toBe('external-payment-123');
    });

    it('should fail when external payment ID is empty', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act
      const result = transaction.setExternalPaymentId('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('External payment ID');
    });
  });

  describe('isPending', () => {
    it('should return true for pending transaction', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act & Assert
      expect(transaction.isPending()).toBe(true);
    });

    it('should return false for approved transaction', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      transaction.approve('external-payment-123');

      // Act & Assert
      expect(transaction.isPending()).toBe(false);
    });
  });

  describe('isApproved', () => {
    it('should return true for approved transaction', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      transaction.approve('external-payment-123');

      // Act & Assert
      expect(transaction.isApproved()).toBe(true);
    });

    it('should return false for pending transaction', () => {
      // Arrange
      const amount = Money.create(100000, 'COP').value;
      const baseFee = Money.create(5000, 'COP').value;
      const deliveryFee = Money.create(10000, 'COP').value;

      const transaction = Transaction.create({
        productId: 'product-123',
        customerId: 'customer-123',
        deliveryId: 'delivery-123',
        amount,
        baseFee,
        deliveryFee,
        paymentMethod: 'CARD',
      }).value;

      // Act & Assert
      expect(transaction.isApproved()).toBe(false);
    });
  });
});
