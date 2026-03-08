# Quick Start Guide - Payment Checkout API

This guide provides the exact commands needed to run the Payment Checkout API from scratch.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed (or Docker)
- Git installed

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Express, Prisma, TypeScript
- Testing frameworks (Jest)
- Logging utilities (Pino)
- Payment gateway dependencies

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update these critical variables:

```bash
# Database - Update with your PostgreSQL credentials
DATABASE_URL=postgresql://payment_user:payment_password@localhost:5432/payment_checkout_db

# Wompi Payment Gateway - Get from https://comercios.wompi.co
WOMPI_PUBLIC_KEY=pub_test_your_actual_key_here
WOMPI_PRIVATE_KEY=prv_test_your_actual_key_here
WOMPI_INTEGRITY_KEY=test_integrity_your_actual_key_here
```

### 3. Start PostgreSQL Database

**Option A: Using Docker (Recommended)**
```bash
docker run --name postgres-payment \
  -e POSTGRES_USER=payment_user \
  -e POSTGRES_PASSWORD=payment_password \
  -e POSTGRES_DB=payment_checkout_db \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: Using Docker Compose (Easiest)**
```bash
docker-compose up -d postgres
```

**Option C: Local PostgreSQL**
```bash
# Create database
createdb payment_checkout_db

# Update DATABASE_URL in .env accordingly
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

This creates all tables (products, customers, deliveries, transactions) with proper relationships and constraints.

### 5. Seed Database (Optional but Recommended)

```bash
npm run db:seed
```

This creates 5 sample products:
- Laptop Pro 15" ($1,299.99)
- Wireless Mouse ($29.99)
- Mechanical Keyboard ($149.99)
- USB-C Hub ($49.99)
- 27" 4K Monitor ($399.99)

### 6. Start the Development Server

```bash
npm run dev
```

You should see:
```
🚀 Starting Payment Checkout API...
📝 Environment: development
🔌 Port: 3000
✅ Database connection established
✅ Server is running on port 3000
🎉 Payment Checkout API is ready to accept requests
```

### 7. Test the API

Open a new terminal and run:

```bash
# Health check
curl http://localhost:3000/health

# Get all products
curl http://localhost:3000/api/v1/products

# Get specific product
curl http://localhost:3000/api/v1/products/{product-id}
```

Expected response from `/health`:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": { "status": "up" }
  }
}
```

Expected response from `/products`:
```json
[
  {
    "id": "uuid-here",
    "name": "Laptop Pro 15\"",
    "description": "High-performance laptop...",
    "price": 1299.99,
    "currency": "USD",
    "stock": 25
  },
  ...
]
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Generate Coverage Report
```bash
npm run test:coverage
```

Open `coverage/lcov-report/index.html` to view the detailed coverage report.

## Complete Flow Example

Here's a complete example of creating a transaction and processing a payment:

### 1. Get Available Products
```bash
curl http://localhost:3000/api/v1/products
```

Copy a product ID from the response.

### 2. Create a Transaction
```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "your-product-id-here",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "1234567890",
    "deliveryAddress": "123 Main St",
    "deliveryCity": "New York",
    "deliveryState": "NY",
    "deliveryCountry": "USA",
    "deliveryPostalCode": "10001",
    "baseFee": 5.00,
    "deliveryFee": 10.00,
    "paymentMethod": "CARD"
  }'
```

Copy the transaction ID from the response.

### 3. Process Payment
```bash
curl -X POST http://localhost:3000/api/v1/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "your-transaction-id-here",
    "cardNumber": "4242424242424242",
    "cardHolder": "JOHN DOE",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "customerEmail": "john@example.com",
    "idempotencyKey": "unique-key-123"
  }'
```

### 4. Check Transaction Status
```bash
curl http://localhost:3000/api/v1/transactions/your-transaction-id-here
```

## Docker Quick Start

If you prefer to use Docker for everything:

```bash
# Start entire stack (PostgreSQL + API)
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
docker-compose ps

# View logs
docker-compose logs -f payment-checkout-api

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/products

# Stop everything
docker-compose down
```

## Troubleshooting

### Prisma Client Not Generated

If you see "Cannot find module '@prisma/client'":
```bash
npx prisma generate
```

### Database Connection Failed

If you see "Can't reach database server":
1. Verify PostgreSQL is running: `docker ps` or `pg_isready`
2. Check DATABASE_URL in `.env` matches your database credentials
3. Ensure the database exists: `psql -l`

### Port Already in Use

If port 3000 is already in use:
1. Change PORT in `.env` to another port (e.g., 3001)
2. Or stop the process using port 3000

### Migration Errors

If migrations fail:
```bash
# Reset and start fresh
npm run db:reset

# Then run migrations again
npx prisma migrate dev
```

## Next Steps

Once the API is running:

1. ✅ Test all endpoints with the curl examples above
2. ✅ Run the test suite: `npm test`
3. ✅ Generate coverage report: `npm run test:coverage`
4. ✅ Explore the database: `npm run db:studio`
5. ✅ Review the architecture in `src/` directory
6. ✅ Check logs for any warnings or errors

## Support

For issues:
- Check the main README.md for detailed documentation
- Review the troubleshooting section
- Open an issue on GitHub

Happy coding! 🚀
