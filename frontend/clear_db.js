const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_FNCsXhHl38bf@ep-twilight-wildflower-ain2rofc-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function main() {
  try {
    await client.connect();
    await client.query(`TRUNCATE TABLE "Customer" RESTART IDENTITY CASCADE;`);
    await client.query(`TRUNCATE TABLE "LocationDictionary" RESTART IDENTITY CASCADE;`);
    console.log("Database perfectly cleared. Ready for fresh 100% accurate India upload!");
  } catch (err) {
    console.error("Error clearing:", err);
  } finally {
    await client.end();
  }
}

main();
