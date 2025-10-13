// Este archivo se genera automáticamente usando: npm run types:generate
// NO EDITAR MANUALMENTE - Los cambios se sobrescribirán

// Placeholder types - serán reemplazados cuando ejecutes npm run types:generate
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          collection_name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          collection_name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          collection_name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_documents: {
        Row: {
          id: string
          project_id: string
          file_path: string
          file_name: string
          indexed_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_path: string
          file_name: string
          indexed_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          file_path?: string
          file_name?: string
          indexed_at?: string
        }
      }
    }
  }
}
