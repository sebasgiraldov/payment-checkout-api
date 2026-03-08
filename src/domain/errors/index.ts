/**
 * Error classes for the Payment Checkout API
 *
 * This module exports all error types used throughout the application.
 * Errors are organized into three main categories:
 *
 * 1. Domain Errors - Business rule violations
 * 2. Application Errors - Use case failures
 * 3. Infrastructure Errors - Database and external service failures
 */

// Domain Errors (Business Rule Violations)
export { DomainError } from './domain.error';
export { ValidationError } from './validation.error';
export { InsufficientStockError } from './insufficient-stock.error';
export { InvalidStateTransitionError } from './invalid-state-transition.error';

// Application Errors (Use Case Failures)
export { ApplicationError } from './application.error';
export { ProductNotFoundError } from './product-not-found.error';
export { TransactionNotFoundError } from './transaction-not-found.error';
export { CustomerCreationError } from './customer-creation.error';
export { DeliveryCreationError } from './delivery-creation.error';
export { TransactionCreationError } from './transaction-creation.error';
export { TransactionUpdateError } from './transaction-update.error';
export { StockUpdateError } from './stock-update.error';
export { PaymentProcessingError } from './payment-processing.error';

// Infrastructure Errors (Database and External Services)
export { RepositoryError } from './repository.error';
export { PaymentError } from './payment.error';
export { PaymentGatewayError } from './payment-gateway.error';
