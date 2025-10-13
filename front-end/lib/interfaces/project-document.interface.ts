import { Database } from '../types/database.types';

// Tipos de la tabla project_documents desde Supabase
export type ProjectDocumentRow = Database['public']['Tables']['project_documents']['Row'];
export type ProjectDocumentInsert = Database['public']['Tables']['project_documents']['Insert'];
export type ProjectDocumentUpdate = Database['public']['Tables']['project_documents']['Update'];

// Interfaces adicionales para la lógica de negocio
export interface CreateProjectDocumentDTO {
  projectId: string;
  filePath: string;
  fileName: string;
}

export interface ProjectDocumentWithProject extends ProjectDocumentRow {
  project?: {
    id: string;
    name: string;
    collectionName: string;
  };
}

// Para respuestas de API
export interface ProjectDocumentApiResponse {
  document: ProjectDocumentRow;
  message?: string;
}

export interface ProjectDocumentListApiResponse {
  documents: ProjectDocumentRow[];
  count: number;
}
