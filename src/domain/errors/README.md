# Error Classes

This directory contains all error classes used throughout the Payment Checkout API. The error hierarchy is designed to provide explicit, type-safe error handling using the Result/Either pattern (Railway Oriented Programming).

## Error Hierarchy

### Domain Errors (Business Rule Violations)

Domain errors represent violations of business rules and invariants. They are thrown when the domain logic detects invalid operations.

- **DomainError** - Base class for all domain errors
  - **ValidationError** - Invalid input data or constraint violations
  - **InsufficientStockError** - Product stock is insufficient for the requested quantity
  - **InvalidStateTransitionError** - Attempted invalid state transition (e.g., APPROVED → PENDING)

### Application Errors (Use Case Failures)

Application errors represent failures in use case execution. They indicate that a requested operation could not be completed.

- **ApplicationError** - Base class for all application errors
  - **ProductNotFoundError** - Requested product does not exist
  - **TransactionNotFoundError** - Requested transaction does not exist
  - **CustomerCreationError** - Failed to create customer record
  - **DeliveryCreationError** - Failed to create delivery record
  - **TransactionCreationError** - Failed to create transaction
  - **TransactionUpdateError** - Failed to update transaction
  - **StockUpdateError** - Failed to update product stock
  - **PaymentProcessingError** - Payment processing failed

### Infrastructure Errors (External System Failures)

Infrastructure errors represent failures in external systems like databases and payment gateways.

- **RepositoryError** - Database operation failures
- **PaymentError** - Base class for payment-related errors
  - **PaymentGatewayError** - Payment gateway communication or processing failures

## Usage Examples

### Basic Error Creation

```typescript
import { ValidationError, InsufficientStockError } from '@/domain/errors';

// Simple validation error
const error = new ValidationError('Email format is invalid', {
  field: 'email',
  value: 'invalid-email'
});

// Error with specific context
const stockError = new InsufficientStockError('product-123', 5, 10);
// Message: "Insufficient stock for product product-123. Available: 5, Requested: 10"
```

### Using with Result Pattern

```typescript
import { Result } from '@/shared/result';
import { ValidationError, InsufficientStockError } from '@/domain/errors';

class Product {
  decreaseStock(quantity: number): Result<void, DomainError> {
    if (quantity <= 0) {
      return Result.fail(new ValidationError('Quantity must be positive'));
    }
    
    if (this.stock < quantity) {
      return Result.fail(
        new InsufficientStockError(this.id, this.stock, quantity)
      );
    }
    
    this.stock -= quantity;
    return Result.ok(undefined);
  }
}
```

### Error Handling in Use Cases

```typescript
import { Result } from '@/shared/result';
import { ApplicationError, ProductNotFoundError } from '@/domain/errors';

class GetProductUseCase {
  async execute(productId: string): Promise<Result<ProductDto, ApplicationError>> {
    const productResult = await this.repository.findById(productId);
    
    if (productResult.isFailure) {
      return Result.fail(new ProductNotFoundError(productId));
    }
    
    return Result.ok(ProductDto.fromEntity(productResult.value));
  }
}
```

### Error Handling in Controllers

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductNotFoundError, ValidationError } from '@/domain/errors';

@Controller('products')
class ProductController {
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const result = await this.useCase.execute(id);
    
    if (result.isFailure) {
      const error = result.error;
      
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }
      
      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }
      
      throw new InternalServerErrorException(error.message);
    }
    
    return result.value;
  }
}
```

### Error Serialization for Logging

All error classes include a `toJSON()` method for structured logging:

```typescript
import { ValidationError } from '@/domain/errors';

const error = new ValidationError('Invalid email', { field: 'email' });

console.log(JSON.stringify(error.toJSON(), null, 2));
// Output:
// {
//   "name": "ValidationError",
//   "message": "Invalid email",
//   "timestamp": "2024-01-15T10:30:00.000Z",
//   "context": {
//     "field": "email"
//   },
//   "stack": "..."
// }
```

## Design Principles

1. **Explicit Error Handling** - All errors are explicitly typed and handled through the Result pattern
2. **No Exceptions for Control Flow** - Errors are values, not exceptions (except at the controller boundary)
3. **Rich Context** - Errors include contextual information for debugging and logging
4. **Serializable** - All errors can be serialized to JSON for logging and monitoring
5. **Type Safety** - TypeScript ensures errors are handled at compile time
6. **Clear Hierarchy** - Error types clearly indicate the layer where the failure occurred

## Testing

Error classes include comprehensive unit tests in `__tests__/errors.test.ts`. Tests verify:

- Proper inheritance hierarchy
- Correct error messages and context
- JSON serialization
- Type safety with instanceof checks

## Requirements Mapping

These error classes satisfy the following requirements:

- **Requirement 11.1** - Validation errors return 400 Bad Request
- **Requirement 11.2** - Not found errors return 404 Not Found
- **Requirement 11.3** - Gateway errors return 503 Service Unavailable
- **Requirement 11.4** - Database errors return 500 Internal Server Error
