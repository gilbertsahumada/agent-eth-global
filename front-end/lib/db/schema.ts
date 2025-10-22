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

// Tabla de documentos (para tracking de archivos procesados)
// Serverless-compatible: No guarda archivos, solo metadata
export const projectDocuments = pgTable('project_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // Size in bytes
  contentPreview: text('content_preview'), // First 500 chars for preview
  indexedAt: timestamp('indexed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('project_id_idx').on(table.projectId),
  uniqueFilePerProject: uniqueIndex('unique_file_per_project').on(table.projectId, table.fileName),
}));

// Tabla de hackathons de ETH Global
export const hackathons = pgTable('hackathons', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  location: text('location'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  description: text('description'),
  website: text('website'),

  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('hackathon_name_idx').on(table.name),
  isActiveHackathonIdx: index('is_active_hackathon_idx').on(table.isActive),
}));

// Tabla de sponsors
export const sponsors = pgTable('sponsors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  collectionName: text('collection_name').notNull().unique(), // Para qdrant
  description: text('description'),
  website: text('website'),
  logo: text('logo'), // URL del logo

  // Metadata de la documentación
  docUrl: text('doc_url'), // URL de la documentación
  techStack: text('tech_stack').array(),
  category: text('category'), // e.g., 'Infrastructure', 'DeFi', 'Tools'
  tags: text('tags').array(),
  documentCount: integer('document_count').default(0),
  lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),

  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('sponsor_name_idx').on(table.name),
  collectionNameSponsorIdx: uniqueIndex('collection_name_sponsor_idx').on(table.collectionName),
  categoryIdx: index('category_idx').on(table.category),
  isActiveSponsorIdx: index('is_active_sponsor_idx').on(table.isActive),
}));

// Tabla de relación many-to-many entre hackathons y sponsors
export const hackathonSponsors = pgTable('hackathon_sponsors', {
  id: uuid('id').defaultRandom().primaryKey(),
  hackathonId: uuid('hackathon_id').notNull().references(() => hackathons.id, { onDelete: 'cascade' }),
  sponsorId: uuid('sponsor_id').notNull().references(() => sponsors.id, { onDelete: 'cascade' }),
  tier: text('tier'), // e.g., 'Gold', 'Silver', 'Bronze', 'Partner'
  prizeAmount: integer('prize_amount'), // Amount in USD

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  hackathonSponsorHackathonIdIdx: index('hackathon_sponsor_hackathon_id_idx').on(table.hackathonId),
  hackathonSponsorSponsorIdIdx: index('hackathon_sponsor_sponsor_id_idx').on(table.sponsorId),
  uniqueHackathonSponsor: uniqueIndex('unique_hackathon_sponsor').on(table.hackathonId, table.sponsorId),
}));

// Tabla de documentos de sponsors (para tracking de archivos procesados)
export const sponsorDocuments = pgTable('sponsor_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  sponsorId: uuid('sponsor_id').notNull().references(() => sponsors.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // Size in bytes
  contentPreview: text('content_preview'), // First 500 chars for preview
  indexedAt: timestamp('indexed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sponsorDocSponsorIdIdx: index('sponsor_doc_sponsor_id_idx').on(table.sponsorId),
  uniqueFilePerSponsor: uniqueIndex('unique_file_per_sponsor').on(table.sponsorId, table.fileName),
}));

// NOTA: Los tipos se generan automáticamente desde Supabase
// Usa: npm run types:generate
// Los tipos estarán disponibles en: lib/types/database.types.ts
