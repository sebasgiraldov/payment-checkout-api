# Implementation Plan: Payment Checkout API

## Overview

This implementation plan breaks down the Payment Checkout API system into discrete, actionable coding tasks. The system uses Node.js with TypeScript, Express.js for the API layer, PostgreSQL with Prisma ORM, and implements Hexagonal Architecture with Railway Oriented Programming (Result/Either pattern). Each task builds incrementally on previous work, with checkpoints to validate progress.

The implementation follows a layered approach: domain layer (entities, value objects), infrastructure layer (database, payment gateway), application layer (use cases), and interfaces layer (Express controllers and routes). Testing tasks are marked as optional with "*" to allow for faster MVP delivery while maintaining the option for comprehensive test coverage.

## Tasks

- [x] 1. Project setup and configuration
  - Initialize Node.js project with TypeScript
  - Create folder structure following hexagonal architecture
  - Configure TypeScript with strict mode
  - Set up ESLint and Prettier
  - Create .env.example file with all required variables
  - Create .gitignore file
  - _Requirements: 19.1, 19.2, 19.3_

- [x] 2. Configure Prisma and database schema
  - [x] 2.1 Install Prisma and initialize
    - Install @prisma/client and prisma as dev dependency
    - Run prisma init to create schema file
    - Configure PostgreSQL connection in .env
    - _Requirements: 18.3, 18.4, 18.5_
  
  - [x] 2.2 Define Prisma schema models
    - Create Product model with all fields and indexes
    - Create Customer model with unique email constraint
    - Create Delivery model with foreign key to Customer
    - Create Transaction model with foreign keys and indexes
    - Create TransactionStatus enum
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 8.1_
  
  - [x] 2.3 Create initial database migration
    - Generate migration with prisma migrate dev
    - Verify migration creates all tables and constraints
    - _Requirements: 20.2_


- [x] 3. Implement shared utilities and Result pattern
  - [x] 3.1 Create Result/Either pattern implementation
    - Implement Result<T, E> class with ok() and fail() methods
    - Add isSuccess, isFailure, value, and error properties
    - Add map() and mapError() methods for functional composition
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 3.2 Create custom error classes
    - Create base DomainError class
    - Create ValidationError, InsufficientStockError, InvalidStateTransitionError
    - Create ApplicationError, RepositoryError, PaymentError classes
    - Create specific error types: ProductNotFoundError, TransactionNotFoundError, etc.
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 3.3 Create utility functions
    - Implement generateId() using UUID v4
    - Create logger utility with Winston or Pino
    - Add correlation ID middleware for request tracking
    - _Requirements: 17.1, 17.2, 17.4_

- [ ] 4. Implement domain value objects
  - [x] 4.1 Create Money value object
    - Implement Money class with amount and currency
    - Add create() factory method with validation
    - Implement add(), subtract(), multiply() methods
    - Add equals() method for comparison
    - Validate amount >= 0 and currency is 3-letter code
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 12.5_
  
  - [ ] 4.2 Write property tests for Money value object
    - **Property 20: Currency Consistency**
    - **Property 21: Amount Precision**
    - Test addition commutativity
    - Test amount non-negativity
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
  
  - [x] 4.3 Create Email value object
    - Implement Email class with value property
    - Add create() factory method with regex validation
    - Normalize email to lowercase
    - _Requirements: 3.2, 12.3_
  
  - [ ] 4.4 Write unit tests for Email value object
    - Test valid email formats
    - Test invalid email formats (missing @, invalid domain)
    - Test email normalization
    - **Validates: Requirements 3.2, 12.3**
  
  - [x] 4.5 Create Phone value object
    - Implement Phone class with value property
    - Add create() factory method with digit validation
    - Validate length between 10-15 digits
    - Strip non-digit characters
    - _Requirements: 3.3, 12.4_
  
  - [ ] 4.6 Write unit tests for Phone value object
    - Test valid phone numbers
    - Test invalid lengths
    - Test non-digit character stripping
    - **Validates: Requirements 3.3, 12.4**
  
  - [x] 4.7 Create Address value object
    - Implement Address class with street, city, state, country, postalCode
    - Add create() factory method with validation
    - Validate required fields (street, city, country)
    - Add toString() method
    - _Requirements: 4.2, 14.1_


- [ ] 5. Implement domain entities
  - [x] 5.1 Create Product entity
    - Implement Product class with id, name, description, price (Money), stock
    - Add create() factory method with validation
    - Implement hasStock(quantity) method
    - Implement decreaseStock(quantity) method with validation
    - Implement increaseStock(quantity) method
    - Ensure stock never goes negative
    - _Requirements: 1.1, 1.4, 2.1, 2.4_
  
  - [ ] 5.2 Write unit tests for Product entity
    - Test product creation with valid data
    - Test decreaseStock with sufficient stock
    - Test decreaseStock with insufficient stock (should fail)
    - Test decreaseStock with negative quantity (should fail)
    - Test increaseStock with valid quantity
    - **Validates: Requirements 1.1, 2.1, 2.4**
  
  - [ ] 5.3 Write property test for Product stock management
    - **Property 2: Stock Non-Negativity**
    - Test that stock never goes negative after any sequence of operations
    - **Validates: Requirements 1.4, 2.1, 2.4**
  
  - [x] 5.4 Create Customer entity
    - Implement Customer class with id, name, email (Email), phone (Phone)
    - Add create() factory method with validation
    - Validate name is non-empty
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 5.5 Write unit tests for Customer entity
    - Test customer creation with valid data
    - Test customer creation with invalid email (should fail)
    - Test customer creation with invalid phone (should fail)
    - Test customer creation with empty name (should fail)
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [x] 5.6 Create Delivery entity
    - Implement Delivery class with id, customerId, address (Address), deliveryFee (Money)
    - Add create() factory method with validation
    - Validate customerId is non-empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.7 Create Transaction entity
    - Implement Transaction class with all fields
    - Add create() factory method that sets status to PENDING
    - Calculate totalAmount as amount + baseFee + deliveryFee
    - Implement approve(externalPaymentId) method
    - Implement decline(externalPaymentId) method
    - Implement fail(reason) method
    - Add isPending(), isApproved() helper methods
    - Validate state transitions (only from PENDING)
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 5.8, 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 5.8 Write unit tests for Transaction entity
    - Test transaction creation with valid data
    - Test totalAmount calculation
    - Test approve() from PENDING state
    - Test approve() from non-PENDING state (should fail)
    - Test decline() from PENDING state
    - Test fail() from PENDING state
    - Test invalid state transitions
    - **Validates: Requirements 5.2, 8.2, 8.3, 8.4**
  
  - [ ] 5.9 Write property tests for Transaction entity
    - **Property 1: Transaction State Consistency**
    - **Property 3: Transaction Amount Correctness**
    - **Property 6: Valid State Transitions**
    - **Validates: Requirements 5.1, 5.8, 6.7, 8.1, 8.2, 8.3, 10.1, 10.2**


- [ ] 6. Define repository ports (interfaces)
  - [x] 6.1 Create IProductRepository interface
    - Define findById(id: string) method
    - Define findAll() method
    - Define save(product: Product) method
    - Define update(product: Product) method
    - Define updateStock(productId: string, newStock: number) method
    - All methods return Promise<Result<T, RepositoryError>>
    - _Requirements: 1.1, 1.2, 2.2_
  
  - [x] 6.2 Create ICustomerRepository interface
    - Define findById(id: string) method
    - Define findByEmail(email: string) method
    - Define save(customer: Customer) method
    - Define findOrCreate(props: CustomerProps) method
    - _Requirements: 3.1, 3.4, 3.5_
  
  - [x] 6.3 Create IDeliveryRepository interface
    - Define findById(id: string) method
    - Define save(delivery: Delivery) method
    - Define findByCustomerId(customerId: string) method
    - _Requirements: 4.1, 4.3, 4.5_
  
  - [x] 6.4 Create ITransactionRepository interface
    - Define findById(id: string) method
    - Define save(transaction: Transaction) method
    - Define update(transaction: Transaction) method
    - Define findByExternalPaymentId(externalId: string) method
    - _Requirements: 5.1, 6.7, 7.2, 8.5_
  
  - [x] 6.5 Create IDatabaseTransaction interface
    - Define execute<T>(callback: () => Promise<T>) method
    - Provides transaction management for atomic operations
    - _Requirements: 6.8, 6.9, 18.1, 18.2_

- [ ] 7. Create payment gateway port and adapter
  - [x] 7.1 Define IPaymentGateway interface
    - Define PaymentRequest interface (amount, currency, card details, etc.)
    - Define PaymentResponse interface (transactionId, status, message)
    - Define processPayment(request: PaymentRequest) method
    - Define getPaymentStatus(transactionId: string) method
    - _Requirements: 6.1, 6.2, 13.1, 13.2_
  
  - [x] 7.2 Implement WompiPaymentAdapter
    - Implement tokenizeCard() private method
    - Implement createPaymentSource() private method
    - Implement createTransaction() private method
    - Implement processPayment() method orchestrating all steps
    - Implement getPaymentStatus() method
    - Implement mapStatus() to convert Wompi status to internal status
    - Load configuration from environment variables
    - Add error handling for gateway failures
    - _Requirements: 6.1, 6.2, 6.3, 13.1, 13.2, 13.3, 13.6_
  
  - [ ] 7.3 Write unit tests for WompiPaymentAdapter
    - Test processPayment with approved response
    - Test processPayment with declined response
    - Test processPayment with gateway timeout
    - Test status mapping for all Wompi statuses
    - Mock HTTP client for gateway calls
    - **Validates: Requirements 13.2, 13.3, 13.4**


- [ ] 8. Implement repository adapters with Prisma
  - [-] 8.1 Create Prisma service wrapper
    - Create PrismaService class that extends PrismaClient
    - Add connection lifecycle management
    - Add graceful shutdown handling
    - Export singleton instance
    - _Requirements: 16.5, 20.5_
  
  - [-] 8.2 Implement ProductRepository adapter
    - Implement findById() mapping Prisma model to domain entity
    - Implement findAll() with entity mapping
    - Implement save() mapping domain entity to Prisma model
    - Implement update() with optimistic locking
    - Implement updateStock() with atomic update
    - Handle Prisma errors and map to RepositoryError
    - _Requirements: 1.1, 1.2, 2.2, 18.5_
  
  - [-] 8.3 Implement CustomerRepository adapter
    - Implement findById() with entity mapping
    - Implement findByEmail() with entity mapping
    - Implement save() with entity mapping
    - Implement findOrCreate() with upsert logic
    - Handle unique constraint violations
    - _Requirements: 3.1, 3.4, 3.5, 18.4_
  
  - [-] 8.4 Implement DeliveryRepository adapter
    - Implement findById() with entity mapping
    - Implement save() with entity mapping
    - Implement findByCustomerId() with entity mapping
    - _Requirements: 4.1, 4.3, 4.5_
  
  - [x] 8.5 Implement TransactionRepository adapter
    - Implement findById() with entity mapping
    - Implement save() with entity mapping
    - Implement update() with entity mapping
    - Implement findByExternalPaymentId() with entity mapping
    - Handle foreign key constraints
    - _Requirements: 5.1, 6.7, 7.2, 18.3_
  
  - [x] 8.6 Implement DatabaseTransaction adapter
    - Implement execute() method using Prisma.$transaction()
    - Handle transaction rollback on errors
    - Ensure atomicity of operations
    - _Requirements: 6.8, 6.9, 18.1, 18.2_

- [x] 9. Checkpoint - Verify domain and infrastructure layers
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 10. Create application DTOs
  - [x] 10.1 Create Product DTOs
    - Create ProductDto with all product fields
    - Add fromEntity() static method to map from domain entity
    - _Requirements: 1.1, 1.5_
  
  - [x] 10.2 Create Transaction DTOs
    - Create CreateTransactionDto with validation decorators
    - Create TransactionDto with all transaction fields
    - Create ProcessPaymentDto with card details
    - Create PaymentResultDto for payment responses
    - Add fromEntity() methods for mapping
    - _Requirements: 5.1, 6.1, 9.1, 10.5_
  
  - [x] 10.3 Add DTO validation decorators
    - Use class-validator decorators on all DTOs
    - Add @IsNotEmpty, @IsEmail, @IsUUID, @IsNumber, etc.
    - Add custom validators for currency codes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 11. Implement use cases
  - [-] 11.1 Create GetAllProductsUseCase
    - Inject IProductRepository
    - Implement execute() method
    - Call repository.findAll()
    - Map entities to ProductDto array
    - Return Result<ProductDto[], ApplicationError>
    - _Requirements: 1.1_
  
  - [-] 11.2 Create GetProductByIdUseCase
    - Inject IProductRepository
    - Implement execute(productId: string) method
    - Call repository.findById()
    - Handle product not found error
    - Map entity to ProductDto
    - Return Result<ProductDto, ApplicationError>
    - _Requirements: 1.2, 1.3_
  
  - [ ] 11.3 Write unit tests for product use cases
    - Test GetAllProductsUseCase with mock repository
    - Test GetProductByIdUseCase with existing product
    - Test GetProductByIdUseCase with non-existent product
    - **Validates: Requirements 1.1, 1.2, 1.3**
  
  - [-] 11.4 Create CreateTransactionUseCase
    - Inject all repository interfaces
    - Implement execute(dto: CreateTransactionDto) method
    - Validate product exists and has stock
    - Create or get customer using findOrCreate
    - Create delivery record
    - Create transaction entity with PENDING status
    - Save transaction to database
    - Return Result<TransactionDto, ApplicationError>
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 11.5 Write unit tests for CreateTransactionUseCase
    - Test with valid data
    - Test with non-existent product
    - Test with insufficient stock
    - Test customer creation
    - Test delivery creation
    - Mock all repositories
    - **Validates: Requirements 5.3, 5.4, 5.5**


  - [-] 11.6 Create GetTransactionByIdUseCase
    - Inject ITransactionRepository
    - Implement execute(transactionId: string) method
    - Call repository.findById()
    - Handle transaction not found error
    - Map entity to TransactionDto
    - Return Result<TransactionDto, ApplicationError>
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [-] 11.7 Create ProcessPaymentUseCase
    - Inject ITransactionRepository, IProductRepository, IPaymentGateway, IDatabaseTransaction
    - Implement execute(dto: ProcessPaymentDto) method
    - Start database transaction for atomicity623946090937
    - Get transaction and verify it's PENDING (idempotency check)
    - Get product and verify stock availability
    - Process payment through gateway
    - If approved: update transaction to APPROVED, decrease product stock
    - If declined: update transaction to DECLINED, keep stock unchanged
    - If failed: update transaction to FAILED
    - Commit or rollback database transaction
    - Return Result<PaymentResultDto, ApplicationError>
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.8, 6.9, 7.1, 7.2, 7.5_
  
  - [ ] 11.8 Write unit tests for ProcessPaymentUseCase
    - Test with approved payment
    - Test with declined payment
    - Test with gateway failure
    - Test with insufficient stock
    - Test idempotency (processing same transaction twice)
    - Test transaction rollback on error
    - Mock all dependencies
    - **Validates: Requirements 6.4, 6.5, 6.6, 7.1, 7.2**
  
  - [ ] 11.9 Write property tests for ProcessPaymentUseCase
    - **Property 4: Payment Idempotency**
    - **Property 5: Stock Decrease Only on Approval**
    - **Property 7: Atomicity of Payment Processing**
    - **Validates: Requirements 2.2, 2.3, 6.4, 6.5, 6.8, 6.9, 7.1, 7.2, 7.4**

- [ ] 12. Implement Express.js API layer
  - [-] 12.1 Create Express application setup
    - Initialize Express app
    - Configure JSON body parser
    - Add helmet middleware for security headers
    - Add CORS middleware
    - Add request logging middleware
    - Add correlation ID middleware
    - Configure error handling middleware
    - Load environment variables with dotenv
    - _Requirements: 14.7, 14.8, 17.1, 19.1_
  
  - [ ] 12.2 Create validation middleware
    - Create validateDto middleware that uses class-validator
    - Validate request body against DTO class
    - Return 400 with validation errors if invalid
    - _Requirements: 12.1, 12.2, 12.7_
  
  - [ ] 12.3 Create error handling middleware
    - Create global error handler
    - Map domain errors to HTTP status codes
    - Return consistent error response format
    - Log errors with correlation ID
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_


  - [-] 12.4 Create ProductController
    - Create GET /products endpoint
    - Create GET /products/:id endpoint
    - Inject GetAllProductsUseCase and GetProductByIdUseCase
    - Handle Result pattern and map to HTTP responses
    - Return 200 with product data on success
    - Return 404 if product not found
    - Return 500 on internal errors
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 12.5 Create TransactionController
    - Create POST /transactions endpoint
    - Create GET /transactions/:id endpoint
    - Inject CreateTransactionUseCase and GetTransactionByIdUseCase
    - Add DTO validation middleware
    - Handle Result pattern and map to HTTP responses
    - Return 201 on transaction creation
    - Return 200 on transaction retrieval
    - Return 404 if transaction not found
    - Return 400 on validation errors
    - _Requirements: 5.1, 9.1, 9.2, 9.3_
  
  - [ ] 12.6 Create PaymentController
    - Create POST /payments/process endpoint
    - Inject ProcessPaymentUseCase
    - Add DTO validation middleware
    - Handle Result pattern and map to HTTP responses
    - Return 200 with payment result (even for declined)
    - Return 404 if transaction not found
    - Return 400 for insufficient stock
    - Return 503 if payment gateway unavailable
    - _Requirements: 6.1, 6.2, 11.3_
  
  - [ ] 12.7 Create HealthController
    - Create GET /health endpoint
    - Check database connectivity with Prisma
    - Check payment gateway connectivity
    - Return 200 with status "healthy" if all checks pass
    - Return 503 with status "unhealthy" if any check fails
    - Include timestamp and individual check results
    - _Requirements: 17.5, 20.3_
  
  - [x] 12.8 Create route registration
    - Create routes/index.ts to register all routes
    - Mount ProductController routes at /api/v1/products
    - Mount TransactionController routes at /api/v1/transactions
    - Mount PaymentController routes at /api/v1/payments
    - Mount HealthController routes at /health
    - _Requirements: 15.1_

- [ ] 13. Implement rate limiting
  - [x] 13.1 Add rate limiting middleware
    - Install express-rate-limit package
    - Create general rate limiter (100 req/min per IP)
    - Create strict rate limiter for payment endpoints (10 req/min per IP)
    - Apply general limiter to all routes
    - Apply strict limiter to POST /payments/process
    - _Requirements: 14.6, 16.6_


- [ ] 14. Create dependency injection container
  - [x] 14.1 Create container setup
    - Create container.ts file
    - Initialize all repository implementations
    - Initialize payment gateway adapter
    - Initialize all use cases with dependencies
    - Initialize all controllers with use cases
    - Export container with all dependencies
    - _Requirements: 19.1_
  
  - [x] 14.2 Wire dependencies in main application
    - Import container in main Express app
    - Pass controller instances to route handlers
    - Ensure singleton pattern for repositories and services
    - _Requirements: 19.1_

- [ ] 15. Create configuration management
  - [ ] 15.1 Create config module
    - Create config/index.ts to load environment variables
    - Validate required variables at startup
    - Export typed configuration object
    - Include database URL, payment gateway credentials, port, etc.
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [ ] 15.2 Update .env.example file
    - Document all required environment variables
    - Include example values for development
    - Add comments explaining each variable
    - _Requirements: 19.2_

- [x] 16. Checkpoint - Verify API layer and integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Create database seed data
  - [x] 17.1 Create seed script
    - Create prisma/seed.ts file
    - Add sample products with various prices and stock levels
    - Use Prisma client to insert seed data
    - Make script idempotent (check if data exists)
    - _Requirements: 1.1_
  
  - [x] 17.2 Configure seed script in package.json
    - Add "prisma.seed" configuration
    - Add npm script to run seed
    - _Requirements: 1.1_


- [ ] 18. Write integration tests
  - [ ] 18.1 Set up integration test environment
    - Configure Jest for integration tests
    - Create test database configuration
    - Create test helpers for database reset
    - Create test helpers for seeding test data
    - **Validates: Requirements 16.5**
  
  - [ ] 18.2 Write product API integration tests
    - Test GET /products returns all products
    - Test GET /products/:id returns specific product
    - Test GET /products/:id with invalid ID returns 404
    - Use supertest for HTTP requests
    - **Validates: Requirements 1.1, 1.2, 1.3**
  
  - [ ] 18.3 Write transaction API integration tests
    - Test POST /transactions creates transaction
    - Test POST /transactions with invalid product returns error
    - Test POST /transactions with insufficient stock returns error
    - Test GET /transactions/:id returns transaction
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.5, 9.1**
  
  - [ ] 18.4 Write payment API integration tests
    - Test POST /payments/process with approved payment
    - Test POST /payments/process with declined payment
    - Test POST /payments/process decreases stock on approval
    - Test POST /payments/process doesn't decrease stock on decline
    - Test idempotency (same transaction processed twice)
    - Mock payment gateway for predictable responses
    - **Validates: Requirements 6.1, 6.4, 6.5, 7.1, 7.2**
  
  - [ ] 18.5 Write health check integration test
    - Test GET /health returns healthy status
    - Test health check includes database status
    - **Validates: Requirements 17.5, 20.3**
  
  - [ ] 18.6 Write concurrent stock update tests
    - Test multiple simultaneous purchases of same product
    - Verify stock decreases correctly
    - Verify no overselling occurs
    - Use Promise.all for concurrent requests
    - **Validates: Requirements 2.2, 18.5**

- [ ] 19. Create package.json scripts
  - [ ] 19.1 Add development scripts
    - Add "dev" script with ts-node-dev for hot reload
    - Add "build" script with TypeScript compiler
    - Add "start" script to run compiled code
    - Add "lint" script with ESLint
    - Add "format" script with Prettier
    - _Requirements: 20.1_
  
  - [ ] 19.2 Add database scripts
    - Add "db:migrate" script for running migrations
    - Add "db:migrate:dev" for development migrations
    - Add "db:seed" script for seeding data
    - Add "db:reset" script to reset database
    - Add "db:studio" script to open Prisma Studio
    - _Requirements: 20.2_
  
  - [-] 19.3 Add test scripts
    - Add "test" script to run all tests
    - Add "test:unit" script for unit tests only
    - Add "test:integration" script for integration tests only
    - Add "test:coverage" script with coverage reporting
    - Add "test:watch" script for development
    - _Requirements: 16.5_


- [x] 20. Create Dockerfile and docker-compose
  - [x] 20.1 Create Dockerfile
    - Use multi-stage build (builder and production)
    - Install dependencies in builder stage
    - Generate Prisma client in builder stage
    - Build TypeScript in builder stage
    - Copy only necessary files to production stage
    - Expose port 3000
    - Run migrations and start app in CMD
    - _Requirements: 20.1_
  
  - [x] 20.2 Create docker-compose.yml
    - Define PostgreSQL service with volume
    - Define app service with build context
    - Link app to database
    - Set environment variables
    - Expose ports for local development
    - _Requirements: 20.1_
  
  - [x] 20.3 Create .dockerignore file
    - Exclude node_modules
    - Exclude .env files
    - Exclude test files
    - Exclude .git directory
    - _Requirements: 20.1_

- [ ] 21. Create API documentation
  - [ ] 21.1 Set up Swagger/OpenAPI
    - Install swagger-ui-express and swagger-jsdoc
    - Create swagger configuration
    - Define API info, servers, and security
    - Mount Swagger UI at /api-docs
    - _Requirements: 15.1, 15.2, 15.5_
  
  - [ ] 21.2 Document product endpoints
    - Add OpenAPI annotations for GET /products
    - Add OpenAPI annotations for GET /products/:id
    - Document request parameters and response schemas
    - Include example responses
    - _Requirements: 15.2, 15.3_
  
  - [ ] 21.3 Document transaction endpoints
    - Add OpenAPI annotations for POST /transactions
    - Add OpenAPI annotations for GET /transactions/:id
    - Document request body schema with validation rules
    - Document all possible error responses
    - _Requirements: 15.2, 15.3_
  
  - [ ] 21.4 Document payment endpoints
    - Add OpenAPI annotations for POST /payments/process
    - Document payment request schema
    - Document payment response schema
    - Include security warnings about sensitive data
    - Document all error scenarios
    - _Requirements: 15.2, 15.3, 15.4_


- [x] 22. Create comprehensive README
  - [x] 22.1 Write README.md
    - Add project overview and features
    - Document architecture and design patterns
    - Add prerequisites (Node.js, PostgreSQL)
    - Document installation steps
    - Document environment variable configuration
    - Add database setup instructions
    - Document how to run the application
    - Add API endpoint documentation with examples
    - Document testing instructions
    - Add Docker deployment instructions
    - Include troubleshooting section
    - Add license and contribution guidelines
    - _Requirements: 15.1, 20.4_

- [ ] 23. Add logging and monitoring
  - [ ] 23.1 Configure structured logging
    - Set up Winston or Pino logger
    - Configure JSON format for production
    - Configure human-readable format for development
    - Add log levels (error, warn, info, debug)
    - _Requirements: 17.4_
  
  - [ ] 23.2 Add request logging
    - Log all incoming requests with method, path, correlation ID
    - Log response status and duration
    - _Requirements: 17.1_
  
  - [ ] 23.3 Add payment processing logging
    - Log payment attempts with transaction ID and correlation ID
    - Log payment gateway responses (sanitize sensitive data)
    - Log stock updates
    - _Requirements: 17.1_
  
  - [ ] 23.4 Add error logging
    - Log all errors with full context and stack traces
    - Log authentication/authorization failures
    - Include correlation ID in all error logs
    - _Requirements: 17.2, 17.3_
  
  - [ ] 23.5 Add performance metrics logging
    - Log response times for all endpoints
    - Log database query times
    - Log payment gateway call times
    - _Requirements: 17.6_

- [ ] 24. Implement security hardening
  - [ ] 24.1 Add input sanitization
    - Sanitize all string inputs to prevent XSS
    - Validate and reject malicious patterns
    - Use parameterized queries (already done with Prisma)
    - _Requirements: 14.4, 14.5_
  
  - [ ] 24.2 Add security headers
    - Configure helmet middleware with strict CSP
    - Add HSTS header
    - Add X-Frame-Options
    - Add X-Content-Type-Options
    - _Requirements: 14.8_
  
  - [ ] 24.3 Implement sensitive data protection
    - Never log credit card numbers or CVV
    - Mask card numbers in responses (show last 4 digits only)
    - Ensure HTTPS in production (document requirement)
    - _Requirements: 14.2, 14.3_


- [ ] 25. Final integration and testing
  - [ ] 25.1 Create end-to-end test scenario
    - Test complete flow: get products → create transaction → process payment
    - Verify stock decreases after successful payment
    - Verify transaction status updates correctly
    - Test with both approved and declined payments
    - _Requirements: 1.1, 5.1, 6.1, 2.2_
  
  - [ ] 25.2 Test error scenarios
    - Test insufficient stock handling
    - Test payment gateway timeout
    - Test database connection failure recovery
    - Test invalid input validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 25.3 Verify idempotency
    - Test processing same payment multiple times
    - Verify identical results returned
    - Verify stock only decreases once
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [ ] 25.4 Run full test suite
    - Run all unit tests
    - Run all integration tests
    - Generate coverage report
    - Verify 80% minimum coverage
    - _Requirements: 16.5_

- [ ] 26. Deployment preparation
  - [ ] 26.1 Create deployment checklist
    - Document required environment variables
    - Document database migration steps
    - Document health check endpoint for load balancers
    - Document graceful shutdown handling
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [ ] 26.2 Test Docker build
    - Build Docker image
    - Run container locally
    - Verify migrations run automatically
    - Verify application starts correctly
    - Test health check endpoint
    - _Requirements: 20.1, 20.3_
  
  - [ ] 26.3 Test docker-compose setup
    - Run docker-compose up
    - Verify database initializes
    - Verify app connects to database
    - Test API endpoints through Docker
    - _Requirements: 20.1_

- [x] 27. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery while maintaining production quality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows with real database
- The implementation uses Express.js (NOT NestJS) as specifically requested
- All configuration uses environment variables for deployment flexibility
- Payment gateway adapter is easily replaceable by implementing IPaymentGateway interface
- Hexagonal architecture ensures domain logic is independent of infrastructure
- Railway Oriented Programming (Result pattern) provides explicit error handling
- Database transactions ensure atomicity of payment processing
- Idempotency keys prevent duplicate charges on retries
- Rate limiting protects against abuse
- Comprehensive logging enables debugging and monitoring
- Security hardening follows OWASP best practices
- Docker support enables deployment to any container platform

## Implementation Order Rationale

1. **Foundation First**: Project setup, database schema, and shared utilities establish the foundation
2. **Domain Layer**: Value objects and entities implement core business logic without dependencies
3. **Ports Definition**: Repository and gateway interfaces define contracts
4. **Infrastructure Layer**: Adapters implement ports with real database and payment gateway
5. **Application Layer**: Use cases orchestrate domain logic and infrastructure
6. **Interface Layer**: Express controllers expose HTTP API
7. **Cross-Cutting Concerns**: Rate limiting, logging, security, documentation
8. **Testing**: Unit, integration, and property-based tests validate correctness
9. **Deployment**: Docker, documentation, and deployment preparation

This order ensures each layer builds on stable foundations and minimizes rework.

