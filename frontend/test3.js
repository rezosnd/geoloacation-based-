const { PrismaClient } = require('@prisma/client');

// Using the exact URL provided originally by the user
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_FNCsXhHl38bf@ep-twilight-wildflower-ain2rofc-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function main() {
  try {
    const data = await prisma.locationDictionary.findMany();
    console.log("Success with original URL! Count:", data.length);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
