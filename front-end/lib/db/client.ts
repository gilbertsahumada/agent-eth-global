import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.SUPABASE_PASSWORD) {
  throw new Error('SUPABASE_PASSWORD is not set in environment variables');
}

const { SUPABASE_PASSWORD: password } = process.env;
const connectionString = `postgresql://postgres:${password}@db.your-project-ref.supabase.co:5432/postgres`;
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export { schema };
