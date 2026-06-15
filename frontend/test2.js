const { PrismaClient } = require('@prisma/client');

// Using the direct Neon URL by removing "-pooler" and removing pgbouncer=true
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_FNCsXhHl38bf@ep-twilight-wildflower-ain2rofc.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  try {
    const data = await prisma.locationDictionary.findMany();
    console.log("Success with DIRECT URL! Count:", data.length);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
