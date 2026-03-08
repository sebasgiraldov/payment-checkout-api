import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Database Seed Script
 * 
 * Seeds the database with sample products for development and testing.
 * This script is idempotent - it checks if products already exist before inserting.
 * 
 * Run with: npx prisma db seed
 */

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if products already exist
  const existingProducts = await prisma.product.count();
  
  if (existingProducts > 0) {
    console.log(`ℹ️  Database already contains ${existingProducts} products. Skipping seed.`);
    return;
  }

  // Seed products
  const products = [
    {
      name: 'Laptop Pro 15"',
      description: 'High-performance laptop with 16GB RAM, 512GB SSD, and Intel i7 processor',
      price: 5499900,
      currency: 'COP',
      stock: 25,
    },
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with precision tracking and long battery life',
      price: 129900,
      currency: 'COP',
      stock: 150,
    },
    {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with Cherry MX switches and aluminum frame',
      price: 649900,
      currency: 'COP',
      stock: 75,
    },
    {
      name: 'USB-C Hub',
      description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and power delivery',
      price: 219900,
      currency: 'COP',
      stock: 200,
    },
    {
      name: '27" 4K Monitor',
      description: 'Ultra HD 4K monitor with IPS panel, HDR support, and 60Hz refresh rate',
      price: 1699900,
      currency: 'COP',
      stock: 40,
    },
  ];

  console.log(`📦 Creating ${products.length} products...`);

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
    console.log(`  ✅ Created: ${product.name}`);
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
