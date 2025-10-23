export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      hackathon_sponsors: {
        Row: {
          created_at: string
          hackathon_id: string
          id: string
          prize_amount: number | null
          sponsor_id: string
          tier: string | null
        }
        Insert: {
          created_at?: string
          hackathon_id: string
          id?: string
          prize_amount?: number | null
          sponsor_id: string
          tier?: string | null
        }
        Update: {
          created_at?: string
          hackathon_id?: string
          id?: string
          prize_amount?: number | null
          sponsor_id?: string
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_sponsors_hackathon_id_hackathons_id_fk"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_sponsors_sponsor_id_sponsors_id_fk"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathons: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          start_date: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          start_date?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          start_date?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          content_preview: string | null
          file_name: string
          file_size: number | null
          id: string
          indexed_at: string
          project_id: string
        }
        Insert: {
          content_preview?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          indexed_at?: string
          project_id: string
        }
        Update: {
          content_preview?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          indexed_at?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_projects_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          collection_name: string
          created_at: string
          description: string | null
          document_count: number | null
          domain: string | null
          id: string
          is_active: boolean
          keywords: string[] | null
          last_indexed_at: string | null
          name: string
          tags: string[] | null
          tech_stack: string[] | null
          updated_at: string
        }
        Insert: {
          collection_name: string
          created_at?: string
          description?: string | null
          document_count?: number | null
          domain?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          last_indexed_at?: string | null
          name: string
          tags?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string
        }
        Update: {
          collection_name?: string
          created_at?: string
          description?: string | null
          document_count?: number | null
          domain?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          last_indexed_at?: string | null
          name?: string
          tags?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      sponsor_documents: {
        Row: {
          content_preview: string | null
          file_name: string
          file_size: number | null
          id: string
          indexed_at: string
          sponsor_id: string
        }
        Insert: {
          content_preview?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          indexed_at?: string
          sponsor_id: string
        }
        Update: {
          content_preview?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          indexed_at?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_documents_sponsor_id_sponsors_id_fk"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          category: string | null
          collection_name: string
          created_at: string
          description: string | null
          doc_url: string | null
          document_count: number | null
          id: string
          is_active: boolean
          last_indexed_at: string | null
          logo: string | null
          name: string
          tags: string[] | null
          tech_stack: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string | null
          collection_name: string
          created_at?: string
          description?: string | null
          doc_url?: string | null
          document_count?: number | null
          id?: string
          is_active?: boolean
          last_indexed_at?: string | null
          logo?: string | null
          name: string
          tags?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string | null
          collection_name?: string
          created_at?: string
          description?: string | null
          doc_url?: string | null
          document_count?: number | null
          id?: string
          is_active?: boolean
          last_indexed_at?: string | null
          logo?: string | null
          name?: string
          tags?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
