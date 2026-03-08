# Utility Functions

This directory contains shared utility functions used throughout the application.

## generateId()

Generates a unique identifier using UUID v4.

**Usage:**
```typescript
import { generateId } from './shared/utils';

const id = generateId();
console.log(id); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

**Requirements:** 17.1

## Logger

Structured logging utility using Pino with environment-based configuration.

**Features:**
- JSON format for production environments
- Human-readable format with pretty printing for development
- Configurable log levels (error, warn, info, debug)
- Support for child loggers with additional context

**Usage:**
```typescript
import { logger, createLogger } from './shared/utils';

// Basic logging
logger.info('Application started');
logger.error('An error occurred', { error: err });

// Create a child logger with context
const serviceLogger = createLogger({ service: 'payment-service' });
serviceLogger.info('Processing payment', { transactionId: '123' });
```

**Configuration:**
- `NODE_ENV`: Set to 'production' for JSON format, otherwise uses pretty printing
- `LOG_LEVEL`: Set log level (default: 'info')

**Requirements:** 17.2, 17.4

## Correlation ID Middleware

Express middleware that generates or extracts correlation IDs from request headers for request tracing.

**Features:**
- Extracts correlation ID from `x-correlation-id` header if present
- Generates a new UUID v4 if not present
- Adds correlation ID to response headers
- Attaches correlation ID to request object for use in logging

**Usage:**
```typescript
import express from 'express';
import { correlationIdMiddleware, RequestWithCorrelationId } from './interfaces/middleware';
import { logger } from './shared/utils';

const app = express();

// Add correlation ID middleware
app.use(correlationIdMiddleware);

// Use correlation ID in route handlers
app.get('/api/example', (req, res) => {
  const correlationId = (req as RequestWithCorrelationId).correlationId;
  
  logger.info('Processing request', { correlationId });
  
  res.json({ message: 'Success', correlationId });
});
```

**Requirements:** 17.1, 17.4

## Integration Example

Here's how these utilities work together:

```typescript
import express from 'express';
import { correlationIdMiddleware, RequestWithCorrelationId } from './interfaces/middleware';
import { logger, createLogger } from './shared/utils';

const app = express();

// Add correlation ID middleware
app.use(correlationIdMiddleware);

// Add request logging middleware
app.use((req, res, next) => {
  const correlationId = (req as RequestWithCorrelationId).correlationId;
  const requestLogger = createLogger({ correlationId });
  
  requestLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
  });
  
  next();
});

// Your routes here
app.get('/api/products', (req, res) => {
  const correlationId = (req as RequestWithCorrelationId).correlationId;
  const requestLogger = createLogger({ correlationId });
  
  requestLogger.info('Fetching products');
  
  // Your business logic here
  
  res.json({ products: [] });
});

app.listen(3000, () => {
  logger.info('Server started', { port: 3000 });
});
```

This ensures all logs for a specific request can be traced using the correlation ID, making debugging and monitoring much easier.
