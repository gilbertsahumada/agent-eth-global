import { pgTable, uuid, text, timestamp, uniqueIndex, integer, index, boolean } from 'drizzle-orm/pg-core';

// Tabla de proyectos
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  collectionName: text('collection_name').notNull().unique(),
  description: text('description'),

  // Metadata for intelligent routing and search
  techStack: text('tech_stack').array(),  // e.g., ['Solidity', 'Hardhat', 'OpenZeppelin']
  domain: text('domain'),  // e.g., 'DeFi', 'NFT', 'Gaming', 'Infrastructure'
  tags: text('tags').array(),  // e.g., ['smart-contracts', 'testing', 'deployment']
  keywords: text('keywords').array(),  // For quick routing: ['deploy', 'compile', 'test']
  documentCount: integer('document_count').default(0),
  lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),

  // Status
  isActive: boolean('is_active').default(true).notNull(),  // Enable/disable project from search

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('name_idx').on(table.name),
  collectionNameIdx: uniqueIndex('collection_name_idx').on(table.collectionName),
  domainIdx: index('domain_idx').on(table.domain),  // For faster domain queries
  isActiveIdx: index('is_active_idx').on(table.isActive),  // For filtering active projects
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
