import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { Client } from 'pg';

const router = Router();

// Generic store endpoint: accepts { table: string, data: object }
// If the named table doesn't exist, create it with a JSONB `data` column.
router.post('/', async (req, res, next) => {
  try {
    const { table, data } = req.body || {};
    if (!table) return res.status(400).json({ message: 'Missing `table` in request body.' });
    if (data === undefined) return res.status(400).json({ message: 'Missing `data` in request body.' });

    // Basic sanitization for SQL identifier
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return res.status(400).json({ message: 'Invalid table name. Use letters, numbers and underscores only.' });
    }

    // Try inserting via Supabase first
    let { data: inserted, error } = await supabaseAdmin
      .from(table)
      .insert([{ data }])
      .select()
      .maybeSingle();

    // If table is missing, create it using direct Postgres connection and retry
    const missingTable = error && (String(error.message || error.details || '').includes('does not exist') || error.code === '42P01');
    if (missingTable) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) return res.status(500).json({ message: 'DATABASE_URL not configured; cannot create table.' });

      const client = new Client({ connectionString });
      await client.connect();
      try {
        const createSql = `CREATE TABLE IF NOT EXISTS "${table}" (id bigserial primary key, data jsonb, created_at timestamptz default now())`;
        await client.query(createSql);
      } finally {
        await client.end();
      }

      // Retry insert after creating table
      const retry = await supabaseAdmin
        .from(table)
        .insert([{ data }])
        .select()
        .maybeSingle();

      if (retry.error) throw retry.error;
      return res.status(201).json(retry.data);
    }

    if (error) throw error;
    return res.status(201).json(inserted);
  } catch (e) {
    next(e);
  }
});

export default router;
