import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// Tabla de proyectos
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  collectionName: text('collection_name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('name_idx').on(table.name),
  collectionNameIdx: uniqueIndex('collection_name_idx').on(table.collectionName),
}));

// Tabla de documentos (opcional, para tracking)
export const projectDocuments = pgTable('project_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  indexedAt: timestamp('indexed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: uniqueIndex('project_id_idx').on(table.projectId),
  uniqueFilePerProject: uniqueIndex('unique_file_per_project').on(table.projectId, table.filePath),
}));

// NOTA: Los tipos se generan automáticamente desde Supabase
// Usa: npm run types:generate
// Los tipos estarán disponibles en: lib/types/database.types.ts
