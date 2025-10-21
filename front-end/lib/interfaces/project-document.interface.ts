import { Database } from '../types/database.types';

// Tipos de la tabla project_documents desde Supabase
export type ProjectDocumentRow = Database['public']['Tables']['project_documents']['Row'];
export type ProjectDocumentInsert = Database['public']['Tables']['project_documents']['Insert'];
export type ProjectDocumentUpdate = Database['public']['Tables']['project_documents']['Update'];


