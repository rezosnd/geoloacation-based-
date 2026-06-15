const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_FNCsXhHl38bf@ep-twilight-wildflower-ain2rofc-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function enablePostGIS() {
  try {
    await client.connect();
    console.log('Connected to Neon DB');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension enabled');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

enablePostGIS();
