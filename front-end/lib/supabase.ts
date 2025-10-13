import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente de Supabase con tipos generados automáticamente
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// El cliente ya tiene tipos completos para todas las queries
// Ejemplo de uso:
// const { data, error } = await supabase.from('projects').select('*');
// data tendrá el tipo ProjectRow[] automáticamente
