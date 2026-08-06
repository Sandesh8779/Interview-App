import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const filePath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
if (!fs.existsSync(filePath)) {
  console.error(`Schema file not found at ${filePath}`);
  process.exit(1);
}

const sql = fs.readFileSync(filePath, 'utf8');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Please set the DATABASE_URL environment variable to your Supabase DB connection string.');
  console.error('You can find it in the Supabase project Settings → Database → Connection string.');
  process.exit(1);
}

async function apply() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log('Applying schema from', filePath);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Schema applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to apply schema:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

apply();
