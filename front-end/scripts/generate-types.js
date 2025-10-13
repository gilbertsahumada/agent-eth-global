#!/usr/bin/env node

const { execSync } = require('child_process');
const { config } = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde .env.local
config({ path: path.resolve(__dirname, '../.env.local') });

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error('❌ Error: SUPABASE_PROJECT_ID no está configurado en .env.local');
  process.exit(1);
}

console.log('🔄 Generando tipos desde Supabase...');
console.log('📦 Project ID:', projectId);

try {
  const command = `npx supabase gen types typescript --project-id "${projectId}" --schema public > lib/types/database.types.ts`;
  execSync(command, { stdio: 'inherit' });
  console.log('✅ Tipos generados exitosamente en lib/types/database.types.ts');
} catch (error) {
  console.error('❌ Error al generar tipos:', error.message);
  process.exit(1);
}
