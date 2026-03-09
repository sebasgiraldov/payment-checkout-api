# Payment Checkout API

A production-grade backend API for e-commerce payment processing with Wompi payment gateway integration. Built with TypeScript, Express, and Hexagonal Architecture principles.

## Features

- **Product Catalog Management**: Browse products with real-time stock information
- **Transaction Processing**: Create and manage payment transactions with full lifecycle tracking
- **Payment Gateway Integration**: Secure payment processing through Wompi payment gateway
- **Idempotent Operations**: Safe payment retries with idempotency key support
- **Stock Management**: Automatic inventory updates with concurrency protection
- **Customer & Delivery Management**: Complete customer information and delivery address handling
- **Type-Safe**: Full TypeScript implementation with strict type checking
- **Clean Architecture**: Hexagonal architecture with clear separation of concerns
- **Comprehensive Testing**: Unit tests, integration tests, and property-based testing
- **Production Ready**: Docker support, health checks, and structured logging

## Architecture

This project implements **Hexagonal Architecture** (Ports and Adapters) with Domain-Driven Design principles:

```
src/
├── domain/           # Business logic and entities
│   ├── entities/     # Domain entities (Product, Transaction, Customer, Delivery)
│   ├── value-objects/# Value objects (Money, Email, Phone, Address)
│   ├── repositories/ # Repository interfaces (ports)
│   └── errors/       # Domain-specific errors
├── application/      # Use cases and application logic
│   ├── use-cases/    # Business use cases
│   └── dtos/         # Data transfer objects
├── infrastructure/   # External adapters
│   ├── database/     # Database implementation (Prisma)
│   ├── payment/      # Payment gateway adapter (Wompi)
│   └── logging/      # Logging implementation
├── interfaces/       # API layer
│   ├── http/         # HTTP controllers and routes
│   └── middleware/   # Express middleware
└── shared/           # Shared utilities
    └── result/       # Result/Either pattern for error handling
```

### Key Design Patterns

- **Repository Pattern**: Abstracts data access logic
- **Dependency Injection**: Loose coupling between components
- **Result/Either Pattern**: Explicit error handling without exceptions
- **Value Objects**: Encapsulate validation logic for domain concepts
- **Domain Events**: Track important business events

## Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher
- **npm**: v9 or higher

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sebasgiraldov/payment-checkout-api.git
cd payment-checkout-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see Environment Variables section below).

## Quick Start

### Option 1: Local Development (Recommended)

1. **Start PostgreSQL** (if not already running):
```bash
# Using Docker
docker run --name postgres-payment \
  -e POSTGRES_USER=payment_user \
  -e POSTGRES_PASSWORD=payment_password \
  -e POSTGRES_DB=payment_checkout_db \
  -p 5432:5432 \
  -d postgres:15

# Or use your local PostgreSQL installation
```

2. **Update DATABASE_URL in .env**:
```bash
DATABASE_URL=postgresql://payment_user:payment_password@localhost:5432/payment_checkout_db
```

3. **Run database migrations**:
```bash
npx prisma migrate dev
```

4. **Seed the database** (optional):
```bash
npm run db:seed
```

5. **Start the development server**:
```bash
npm run dev
```

6. **Test the API**:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/products
```

### Option 2: Docker Compose (Easiest)

1. **Start everything with one command**:
```bash
docker-compose up -d
```

This starts both PostgreSQL and the API automatically.

2. **View logs**:
```bash
docker-compose logs -f
```

3. **Stop everything**:
```bash
docker-compose down
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payment_checkout

# Payment Gateway (Wompi Sandbox)
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_EVENTS_KEY=test_events_xxxxx
WOMPI_INTEGRITY_KEY=test_integrity_xxxxx

# Logging
LOG_LEVEL=info
```

### Getting Wompi API Keys

1. Sign up at [Wompi Sandbox](https://comercios.wompi.co/signup)
2. Navigate to Settings → API Keys
3. Copy your test keys to the `.env` file

## Database Setup

### Database Scripts

The project includes several npm scripts for database management:

```bash
# Run migrations (production)
npm run db:migrate

# Run migrations (development with prompts)
npm run db:migrate:dev

# Seed database with sample products
npm run db:seed

# Reset database (WARNING: deletes all data)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Initial Setup

1. Create a PostgreSQL database:
```bash
createdb payment_checkout
```

2. Run database migrations:
```bash
npx prisma migrate deploy
```

3. (Optional) Seed the database with sample data:
```bash
npx prisma db seed
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

## Running the Application

### Development Mode

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Mode

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Using Docker

1. Build and start with Docker Compose:
```bash
docker-compose up -d
```

This will start both the API and PostgreSQL database.

2. Stop the containers:
```bash
docker-compose down
```

## API Usage / Testing the API

This section provides working curl commands to test the API locally. The API runs at `http://localhost:3000` by default.

### Complete Payment Flow

The typical payment flow consists of 5 steps:

1. **Health Check** - Verify API is running
2. **Get Products** - Browse available products
3. **Create Transaction** - Create a transaction for a product
4. **Process Payment** - Process payment through Wompi gateway
5. **Check Transaction Status** - Verify payment was processed

### 1. Health Check

Verify the API is running and healthy:

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-07T12:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

### 2. Get All Products

Retrieve the list of available products:

```bash
curl http://localhost:3000/api/v1/products
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid-1",
      "name": "27\" 4K Monitor",
      "description": "High-resolution 4K monitor with HDR support",
      "price": 1699900,
      "currency": "COP",
      "stock": 15,
      "createdAt": "2024-03-07T12:00:00.000Z",
      "updatedAt": "2024-03-07T12:00:00.000Z"
    }
  ]
}
```

### 3. Get Product by ID

Retrieve details for a specific product:

```bash
# Replace {product-id} with an actual product ID from step 2
curl http://localhost:3000/api/v1/products/{product-id}
```

**Example:**
```bash
curl http://localhost:3000/api/v1/products/01234567-89ab-cdef-0123-456789abcdef
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "name": "27\" 4K Monitor",
    "description": "High-resolution 4K monitor with HDR support",
    "price": 1699900,
    "currency": "COP",
    "stock": 15,
    "createdAt": "2024-03-07T12:00:00.000Z",
    "updatedAt": "2024-03-07T12:00:00.000Z"
  }
}
```

### 4. Create Transaction

Create a transaction for a product purchase:

```bash
curl --location 'http://localhost:3000/api/v1/transactions' \
--header 'Content-Type: application/json' \
--data-raw '{
  "productId": "01234567-89ab-cdef-0123-456789abcdef",
  "customerName": "Jane Smith",
  "customerEmail": "jane.smith@example.com",
  "customerPhone": "+573009876543",
  "deliveryAddress": "Carrera 7 #32-16",
  "deliveryCity": "Bogota",
  "deliveryState": "Cundinamarca",
  "deliveryCountry": "Colombia",
  "deliveryPostalCode": "110231",
  "baseFee": 5.00,
  "deliveryFee": 10.00,
  "currency": "COP",
  "paymentMethod": "CARD"
}'
```

**Important Notes:**
- Replace `productId` with an actual product ID from step 2
- `baseFee` and `deliveryFee` are in the same currency as the product
- `currency` must match the product currency (use "COP" for seeded products)
- Total amount = product price + baseFee + deliveryFee

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "productId": "product-uuid",
    "customerId": "customer-uuid",
    "deliveryId": "delivery-uuid",
    "amount": 1699900,
    "baseFee": 5,
    "deliveryFee": 10,
    "totalAmount": 1699915,
    "currency": "COP",
    "status": "PENDING",
    "paymentMethod": "CARD",
    "externalPaymentId": null,
    "createdAt": "2024-03-07T12:00:00.000Z",
    "updatedAt": "2024-03-07T12:00:00.000Z"
  }
}
```

### 5. Process Payment

Process payment for the transaction using Wompi sandbox:

```bash
curl --location 'http://localhost:3000/api/v1/payments/process' \
--header 'Content-Type: application/json' \
--data-raw '{
  "transactionId": "transaction-uuid-from-step-4",
  "cardNumber": "4242424242424242",
  "cardHolder": "Jane Smith",
  "expiryMonth": "12",
  "expiryYear": "2028",
  "cvv": "123",
  "customerEmail": "jane.smith@example.com"
}'
```

**Important Notes:**
- Replace `transactionId` with the transaction ID from step 4
- Use Wompi sandbox test card: `4242424242424242`
- Expiry date must be in the future (e.g., 12/2028)
- CVV can be any 3 digits (e.g., 123)
- `customerEmail` should match the email from step 4

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "status": "PENDING",
    "externalPaymentId": "12048563-1772944117-91664",
    "totalAmount": 1699915,
    "currency": "COP",
    "message": "Payment is pending"
  }
}
```

**Payment Status Values:**
- `PENDING` - Payment is being processed (typical for Wompi sandbox)
- `APPROVED` - Payment was successful
- `DECLINED` - Payment was declined
- `FAILED` - Payment processing failed

### 6. Get Transaction Status

Check the updated transaction status after payment:

```bash
# Replace {transaction-id} with the transaction ID from step 4
curl http://localhost:3000/api/v1/transactions/{transaction-id}
```

**Example:**
```bash
curl http://localhost:3000/api/v1/transactions/3e01e5aa-8e40-4903-82f4-2304a3e39e45
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "productId": "product-uuid",
    "customerId": "customer-uuid",
    "deliveryId": "delivery-uuid",
    "amount": 1699900,
    "baseFee": 5,
    "deliveryFee": 10,
    "totalAmount": 1699915,
    "currency": "COP",
    "status": "PENDING",
    "paymentMethod": "CARD",
    "externalPaymentId": "12048563-1772944117-91664",
    "createdAt": "2024-03-07T12:00:00.000Z",
    "updatedAt": "2024-03-07T12:00:00.000Z"
  }
}
```

### Wompi Payment Integration

This API integrates with the Wompi payment gateway for secure payment processing. The integration follows Wompi's 3-step flow:

1. **Card Tokenization** - Securely tokenize card details
2. **Payment Source Creation** - Create a payment source from the token
3. **Transaction Creation** - Create and process the transaction

**Wompi Sandbox Environment:**
- Base URL: `https://sandbox.wompi.co/v1`
- Test Card: `4242424242424242`
- Expiry: Any future date (e.g., 12/2028)
- CVV: Any 3 digits (e.g., 123)
- Currency: COP (Colombian Peso) only

**Payment Flow:**
```
Client → API → Wompi Gateway
  ↓       ↓         ↓
Create  Process  Tokenize Card
Trans.  Payment  Create Source
                 Create Transaction
```

**Security Features:**
- Integrity signature validation using SHA256
- Idempotency key support to prevent duplicate charges
- Secure card tokenization (card details never stored)
- Acceptance token validation

**Webhook Support:**
Wompi sends webhook events for transaction updates. To implement webhook handling:

```bash
POST /api/v1/webhooks/wompi
```

The webhook endpoint should:
1. Validate the event signature using `WOMPI_EVENTS_SECRET`
2. Update transaction status based on the event
3. Return 200 OK to acknowledge receipt

### Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common Error Codes:**

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 404 | PRODUCT_NOT_FOUND | Product does not exist |
| 404 | TRANSACTION_NOT_FOUND | Transaction does not exist |
| 409 | INSUFFICIENT_STOCK | Product out of stock |
| 422 | INVALID_STATE_TRANSITION | Invalid transaction state change |
| 500 | PAYMENT_GATEWAY_ERROR | Wompi gateway error |
| 500 | REPOSITORY_ERROR | Database error |

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with id abc123 not found",
    "details": {
      "productId": "abc123"
    }
  }
}
```

### Testing with PowerShell

A complete test script is provided in `test-payment-flow.ps1`:

```powershell
# Run the complete payment flow test
./test-payment-flow.ps1
```

This script tests all endpoints in sequence and displays the results.

## Testing

This project includes comprehensive test coverage with unit tests, integration tests, and property-based tests.

### Test Coverage

![Test Coverage](./CoverageReport.png)

Current coverage metrics:
- **Statements**: 68%+
- **Branches**: 50%+
- **Functions**: 68%+
- **Lines**: 68%+

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

Unit tests verify individual components in isolation:
```bash
npm run test:unit
```

### Run Integration Tests Only

Integration tests verify the complete API flow with database:
```bash
npm run test:integration
```

### Generate Coverage Report

Generate a detailed coverage report (target: 80%+):
```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in your browser to view the detailed report.

![Coverage Report](./coverage/lcov-report/index.html)

### Watch Mode (Development)

Run tests in watch mode for rapid feedback:
```bash
npm run test:watch
```

### Test Structure

```
tests/
├── unit/              # Unit tests for domain logic
│   ├── entities/      # Entity tests
│   ├── value-objects/ # Value object tests
│   ├── use-cases/     # Use case tests
│   ├── middleware/    # Middleware tests
│   ├── controllers/   # Controller tests
│   └── infrastructure/# Infrastructure adapter tests
├── integration/       # Integration tests
│   ├── api/           # API endpoint tests
│   └── database/      # Database integration tests
└── helpers/           # Test utilities and fixtures
```

### Property-Based Testing

This project uses property-based testing with `fast-check` to verify correctness properties:

- Stock never goes negative
- Transaction amounts are always correct
- State transitions are always valid
- Payment operations are idempotent

### Test Coverage Details

To view detailed coverage by file:

1. Run tests with coverage:
   ```bash
   npm run test:coverage
   ```

2. Open the HTML report:
   ```bash
   # Windows
   start coverage/index.html
   
   # macOS
   open coverage/index.html
   
   # Linux
   xdg-open coverage/index.html
   ```

The coverage report shows:
- Line-by-line coverage highlighting
- Uncovered branches and statements
- Function coverage statistics
- File-by-file breakdown

## Code Quality

### Linting

Check for code issues:
```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint:fix
```

### Formatting

Check code formatting:
```bash
npm run format:check
```

Format code automatically:
```bash
npm run format
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t payment-checkout-api .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/dbname \
  -e WOMPI_PUBLIC_KEY=your_key \
  -e WOMPI_PRIVATE_KEY=your_key \
  payment-checkout-api
```

### Docker Compose

The `docker-compose.yml` file includes:
- API service
- PostgreSQL database
- Automatic migrations on startup

```bash
docker-compose up -d
```

## Deployment

### Supported Platforms

This application can be deployed to:

- **Railway**: One-click deployment with PostgreSQL
- **Render**: Web service + PostgreSQL
- **AWS**: ECS, Lambda, or EC2
- **Google Cloud**: Cloud Run or GKE
- **Azure**: App Service or Container Instances
- **Heroku**: With Heroku Postgres
- **DigitalOcean**: App Platform

### Environment Configuration

Ensure all environment variables are set in your deployment platform:

1. Database connection string
2. Wompi API keys
3. Node environment (production)
4. Port configuration

### Health Checks

Configure your load balancer or platform to use the health check endpoint:

```
GET /health
```

Expected response: `200 OK` with status "healthy"

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `psql -l`
4. Check firewall rules and network connectivity

### Payment Gateway Errors

**Problem**: Payment processing fails with gateway error

**Solution**:
1. Verify Wompi API keys are correct
2. Check you're using sandbox keys for testing
3. Ensure WOMPI_BASE_URL points to sandbox environment
4. Check Wompi service status

### Migration Errors

**Problem**: Prisma migrations fail

**Solution**:
1. Reset database: `npx prisma migrate reset`
2. Generate client: `npx prisma generate`
3. Run migrations: `npx prisma migrate deploy`

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**:
1. Change PORT in `.env` file
2. Or kill the process using port 3000:
   ```bash
   # Find process
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

### TypeScript Compilation Errors

**Problem**: Build fails with TypeScript errors

**Solution**:
1. Clean build directory: `rm -rf dist`
2. Reinstall dependencies: `npm ci`
3. Rebuild: `npm run build`

## Project Structure

```
payment-checkout-api/
├── src/
│   ├── application/       # Use cases and DTOs
│   ├── config/            # Configuration management
│   ├── domain/            # Domain entities and business logic
│   ├── infrastructure/    # External adapters (DB, payment gateway)
│   ├── interfaces/        # HTTP controllers and routes
│   ├── shared/            # Shared utilities
│   ├── app.ts             # Express app configuration
│   ├── container.ts       # Dependency injection container
│   └── index.ts           # Application entry point
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── helpers/           # Test utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── .env.example           # Environment variables template
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker image definition
├── jest.config.js         # Jest test configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies and scripts
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Run linting and formatting before committing
- Update documentation as needed
- Ensure all tests pass

## License

ISC License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/sebasgiraldov/payment-checkout-api/issues)
- Check existing documentation
- Review troubleshooting section

## Acknowledgments

- Built with [Express](https://expressjs.com/)
- Database ORM: [Prisma](https://www.prisma.io/)
- Payment processing: [Wompi](https://wompi.com/)
- Testing: [Jest](https://jestjs.io/) and [fast-check](https://fast-check.dev/)
