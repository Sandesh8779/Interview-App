import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.warn('Supabase environment variables are missing. Copy .env.example to .env and add your keys.');
}

export const supabaseAdmin = createClient(supabaseUrl || 'http://localhost', serviceRoleKey || 'missing', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const supabaseAuth = createClient(supabaseUrl || 'http://localhost', anonKey || 'missing');
