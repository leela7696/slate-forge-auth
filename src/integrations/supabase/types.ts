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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          chain_hash: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          metadata: Json | null
          module: string
          prev_hash: string | null
          success: boolean | null
          target_id: string | null
          target_summary: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          chain_hash?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module: string
          prev_hash?: string | null
          success?: boolean | null
          target_id?: string | null
          target_summary?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          chain_hash?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string
          prev_hash?: string | null
          success?: boolean | null
          target_id?: string | null
          target_summary?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      chain_head: {
        Row: {
          id: number
          latest_hash: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          latest_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          latest_hash?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_change_requests: {
        Row: {
          attempts_left: number
          created_at: string | null
          expires_at: string
          id: string
          new_email: string | null
          new_email_otp_hash: string | null
          old_email: string
          old_email_otp_hash: string
          resend_after: string
          status: string
          user_id: string
        }
        Insert: {
          attempts_left?: number
          created_at?: string | null
          expires_at: string
          id?: string
          new_email?: string | null
          new_email_otp_hash?: string | null
          old_email: string
          old_email_otp_hash: string
          resend_after: string
          status: string
          user_id: string
        }
        Update: {
          attempts_left?: number
          created_at?: string | null
          expires_at?: string
          id?: string
          new_email?: string | null
          new_email_otp_hash?: string | null
          old_email?: string
          old_email_otp_hash?: string
          resend_after?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_requests: {
        Row: {
          attempts_left: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          name: string
          otp_hash: string
          password_hash: string
          resend_after: string
        }
        Insert: {
          attempts_left?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          name: string
          otp_hash: string
          password_hash: string
          resend_after: string
        }
        Update: {
          attempts_left?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          name?: string
          otp_hash?: string
          password_hash?: string
          resend_after?: string
        }
        Relationships: []
      }
      password_change_requests: {
        Row: {
          attempts_left: number
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_hash: string
          resend_after: string
          user_id: string
        }
        Insert: {
          attempts_left?: number
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          resend_after: string
          user_id: string
        }
        Update: {
          attempts_left?: number
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          resend_after?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: number
          module: string
          role_id: number | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: number
          module: string
          role_id?: number | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: number
          module?: string
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          external_providers: Json | null
          id: string
          is_deleted: boolean | null
          last_login_at: string | null
          name: string
          password_hash: string | null
          phone: string | null
          profile_picture_url: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          external_providers?: Json | null
          id?: string
          is_deleted?: boolean | null
          last_login_at?: string | null
          name: string
          password_hash?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          external_providers?: Json | null
          id?: string
          is_deleted?: boolean | null
          last_login_at?: string | null
          name?: string
          password_hash?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
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
