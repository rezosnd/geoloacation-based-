const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipe() {
  try {
    const result = await prisma.customer.deleteMany({});
    console.log(`Successfully deleted ${result.count} customer records from the database.`);
  } catch (err) {
    console.error("Error wiping data:", err);
  }
}

wipe().finally(() => prisma.$disconnect());
