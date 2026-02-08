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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_settings: {
        Row: {
          auto_confirm: boolean
          buffer_time: number
          business_hours_end: string
          business_hours_start: string
          created_at: string
          id: string
          slot_duration: number
          timezone: string
          updated_at: string
          user_id: string | null
          voice_persona: string
        }
        Insert: {
          auto_confirm?: boolean
          buffer_time?: number
          business_hours_end?: string
          business_hours_start?: string
          created_at?: string
          id?: string
          slot_duration?: number
          timezone?: string
          updated_at?: string
          user_id?: string | null
          voice_persona?: string
        }
        Update: {
          auto_confirm?: boolean
          buffer_time?: number
          business_hours_end?: string
          business_hours_start?: string
          created_at?: string
          id?: string
          slot_duration?: number
          timezone?: string
          updated_at?: string
          user_id?: string | null
          voice_persona?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          day: number
          duration: number
          id: string
          status: string
          time: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          day?: number
          duration?: number
          id?: string
          status?: string
          time: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          day?: number
          duration?: number
          id?: string
          status?: string
          time?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          caller_name: string
          created_at: string
          date: string
          duration: string
          id: string
          intent: string
          outcome: string
          status: string
          summary: string | null
          transcript: string | null
          user_id: string | null
        }
        Insert: {
          caller_name: string
          created_at?: string
          date?: string
          duration?: string
          id?: string
          intent?: string
          outcome?: string
          status?: string
          summary?: string | null
          transcript?: string | null
          user_id?: string | null
        }
        Update: {
          caller_name?: string
          created_at?: string
          date?: string
          duration?: string
          id?: string
          intent?: string
          outcome?: string
          status?: string
          summary?: string | null
          transcript?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      live_call_events: {
        Row: {
          call_id: string
          confidence: number | null
          content: string
          created_at: string
          detail: string | null
          event_type: string
          id: string
          speaker: string | null
        }
        Insert: {
          call_id?: string
          confidence?: number | null
          content: string
          created_at?: string
          detail?: string | null
          event_type: string
          id?: string
          speaker?: string | null
        }
        Update: {
          call_id?: string
          confidence?: number | null
          content?: string
          created_at?: string
          detail?: string | null
          event_type?: string
          id?: string
          speaker?: string | null
        }
        Relationships: []
      }
      meeting_bookings: {
        Row: {
          caller_name: string
          created_at: string
          duration_minutes: number
          id: string
          meeting_date: string
          meeting_time: string
          meeting_title: string
          notes: string | null
          script_content: string | null
          script_id: string | null
          status: string
          transcript_summary: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          caller_name: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_date: string
          meeting_time: string
          meeting_title: string
          notes?: string | null
          script_content?: string | null
          script_id?: string | null
          status?: string
          transcript_summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          caller_name?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_date?: string
          meeting_time?: string
          meeting_title?: string
          notes?: string | null
          script_content?: string | null
          script_id?: string | null
          status?: string
          transcript_summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          theme_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          theme_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          theme_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          last_contact: string
          name: string
          preferences: string[]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_contact?: string
          name: string
          preferences?: string[]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_contact?: string
          name?: string
          preferences?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      voice_profiles: {
        Row: {
          created_at: string
          elevenlabs_voice_id: string | null
          energy: number
          expressiveness: number
          id: string
          is_business_voice: boolean
          is_cloned: boolean
          is_default: boolean
          last_used_at: string | null
          name: string
          professionalism: number
          quality_score: number
          speed: number
          user_id: string | null
          warmth: number
        }
        Insert: {
          created_at?: string
          elevenlabs_voice_id?: string | null
          energy?: number
          expressiveness?: number
          id?: string
          is_business_voice?: boolean
          is_cloned?: boolean
          is_default?: boolean
          last_used_at?: string | null
          name: string
          professionalism?: number
          quality_score?: number
          speed?: number
          user_id?: string | null
          warmth?: number
        }
        Update: {
          created_at?: string
          elevenlabs_voice_id?: string | null
          energy?: number
          expressiveness?: number
          id?: string
          is_business_voice?: boolean
          is_cloned?: boolean
          is_default?: boolean
          last_used_at?: string | null
          name?: string
          professionalism?: number
          quality_score?: number
          speed?: number
          user_id?: string | null
          warmth?: number
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
