import { Database } from '../types/database.types';

// Tipos de la tabla projects desde Supabase
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Interfaces adicionales para la lógica de negocio
export interface ProjectWithDocuments extends ProjectRow {
  documents?: ProjectDocumentRow[];
  documentCount?: number;
}

export interface CreateProjectDTO {
  name: string;
  collectionName: string;
  description?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
}

// Para respuestas de API
export interface ProjectApiResponse {
  project: ProjectRow;
  message?: string;
}

export interface ProjectListApiResponse {
  projects: ProjectRow[];
  count: number;
}

// Re-export para compatibilidad
import type { ProjectDocumentRow } from './project-document.interface';
