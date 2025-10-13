import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Usar DATABASE_URL directamente
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });

// Crear instancia de Drizzle
export const db = drizzle(client, { schema });

// Export schema for queries
export { schema };
