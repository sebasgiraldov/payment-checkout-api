/**
 * Repository Interfaces (Ports)
 *
 * This module exports all repository interfaces that define contracts
 * for data persistence operations in the domain layer.
 *
 * These are ports in the hexagonal architecture - the infrastructure layer
 * provides concrete adapter implementations.
 */

export { IProductRepository } from './product.repository';
export { ICustomerRepository } from './customer.repository';
export { IDeliveryRepository } from './delivery.repository';
export { ITransactionRepository } from './transaction.repository';
export { IDatabaseTransaction } from './database-transaction.repository';
