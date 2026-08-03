import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

try {
  await pool.query('CREATE SCHEMA IF NOT EXISTS "quillify"');
} finally {
  await pool.end();
}
