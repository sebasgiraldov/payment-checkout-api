import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test data helpers for seeding and cleaning test database
 */

export interface TestProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
}

export interface TestCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/**
 * Cleans all test data from the database
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.transaction.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
}

/**
 * Seeds test products into the database
 */
export async function seedTestProducts(prisma: PrismaService): Promise<TestProduct[]> {
  const products: TestProduct[] = [
    {
      id: uuidv4(),
      name: 'Test Product 1',
      description: 'Description for test product 1',
      price: 100,
      currency: 'USD',
      stock: 10,
    },
    {
      id: uuidv4(),
      name: 'Test Product 2',
      description: 'Description for test product 2',
      price: 200,
      currency: 'USD',
      stock: 5,
    },
    {
      id: uuidv4(),
      name: 'Out of Stock Product',
      description: 'This product has no stock',
      price: 150,
      currency: 'USD',
      stock: 0,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        stock: product.stock,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return products;
}

/**
 * Seeds a test customer into the database
 */
export async function seedTestCustomer(prisma: PrismaService): Promise<TestCustomer> {
  const customer: TestCustomer = {
    id: uuidv4(),
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '1234567890',
  };

  await prisma.customer.create({
    data: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: new Date(),
    },
  });

  return customer;
}

/**
 * Creates a test transaction in the database
 */
export async function createTestTransaction(
  prisma: PrismaService,
  productId: string,
  customerId: string
): Promise<string> {
  const deliveryId = uuidv4();
  
  // Create delivery first
  await prisma.delivery.create({
    data: {
      id: deliveryId,
      customerId: customerId,
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      country: 'Test Country',
      postalCode: '12345',
      deliveryFee: 10,
      currency: 'USD',
      createdAt: new Date(),
    },
  });

  // Create transaction
  const transactionId = uuidv4();
  await prisma.transaction.create({
    data: {
      id: transactionId,
      productId: productId,
      customerId: customerId,
      deliveryId: deliveryId,
      amount: 100,
      baseFee: 5,
      deliveryFee: 10,
      totalAmount: 115,
      currency: 'USD',
      status: 'PENDING',
      paymentMethod: 'CARD',
      externalPaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return transactionId;
}
