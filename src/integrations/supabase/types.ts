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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          inquiry_type: string
          internal_notes: string | null
          ip_address: string | null
          is_spam: boolean
          message: string
          name: string
          organisation: string | null
          referrer: string | null
          spam_score: number
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string
          internal_notes?: string | null
          ip_address?: string | null
          is_spam?: boolean
          message: string
          name: string
          organisation?: string | null
          referrer?: string | null
          spam_score?: number
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          internal_notes?: string | null
          ip_address?: string | null
          is_spam?: boolean
          message?: string
          name?: string
          organisation?: string | null
          referrer?: string | null
          spam_score?: number
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      film_credits: {
        Row: {
          bio: string | null
          character_name: string | null
          created_at: string
          credit_type: string
          film_id: string
          id: string
          name: string
          photo_url: string | null
          role: string
          sort_order: number
        }
        Insert: {
          bio?: string | null
          character_name?: string | null
          created_at?: string
          credit_type?: string
          film_id: string
          id?: string
          name: string
          photo_url?: string | null
          role: string
          sort_order?: number
        }
        Update: {
          bio?: string | null
          character_name?: string | null
          created_at?: string
          credit_type?: string
          film_id?: string
          id?: string
          name?: string
          photo_url?: string | null
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "film_credits_film_id_fkey"
            columns: ["film_id"]
            isOneToOne: false
            referencedRelation: "films"
            referencedColumns: ["id"]
          },
        ]
      }
      film_gallery: {
        Row: {
          caption: string | null
          created_at: string
          film_id: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          film_id: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          film_id?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "film_gallery_film_id_fkey"
            columns: ["film_id"]
            isOneToOne: false
            referencedRelation: "films"
            referencedColumns: ["id"]
          },
        ]
      }
      films: {
        Row: {
          country: string | null
          created_at: string
          featured: boolean
          genre: string | null
          hero_image_url: string | null
          id: string
          language: string | null
          logline: string | null
          poster_url: string | null
          published: boolean
          release_year: number | null
          runtime_minutes: number | null
          slug: string
          sort_order: number
          status: string
          synopsis: string | null
          tagline: string | null
          title: string
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          featured?: boolean
          genre?: string | null
          hero_image_url?: string | null
          id?: string
          language?: string | null
          logline?: string | null
          poster_url?: string | null
          published?: boolean
          release_year?: number | null
          runtime_minutes?: number | null
          slug: string
          sort_order?: number
          status?: string
          synopsis?: string | null
          tagline?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          featured?: boolean
          genre?: string | null
          hero_image_url?: string | null
          id?: string
          language?: string | null
          logline?: string | null
          poster_url?: string | null
          published?: boolean
          release_year?: number | null
          runtime_minutes?: number | null
          slug?: string
          sort_order?: number
          status?: string
          synopsis?: string | null
          tagline?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      form_rate_limits: {
        Row: {
          bucket_key: string
          created_at: string
          form_name: string
          hits: number
          id: string
          window_start: string
        }
        Insert: {
          bucket_key: string
          created_at?: string
          form_name: string
          hits?: number
          id?: string
          window_start?: string
        }
        Update: {
          bucket_key?: string
          created_at?: string
          form_name?: string
          hits?: number
          id?: string
          window_start?: string
        }
        Relationships: []
      }
      homepage_content: {
        Row: {
          created_at: string
          hero_cta_label: string | null
          hero_eyebrow: string | null
          hero_image_url: string | null
          hero_logline: string | null
          hero_title: string | null
          id: string
          news_eyebrow: string | null
          news_heading: string | null
          newsletter_body: string | null
          newsletter_heading: string | null
          partner_body: string | null
          partner_cta_label: string | null
          partner_heading: string | null
          show_laurels: boolean
          show_news: boolean
          show_newsletter: boolean
          show_partner: boolean
          show_quotes: boolean
          singleton: boolean
          slate_eyebrow: string | null
          slate_heading: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_cta_label?: string | null
          hero_eyebrow?: string | null
          hero_image_url?: string | null
          hero_logline?: string | null
          hero_title?: string | null
          id?: string
          news_eyebrow?: string | null
          news_heading?: string | null
          newsletter_body?: string | null
          newsletter_heading?: string | null
          partner_body?: string | null
          partner_cta_label?: string | null
          partner_heading?: string | null
          show_laurels?: boolean
          show_news?: boolean
          show_newsletter?: boolean
          show_partner?: boolean
          show_quotes?: boolean
          singleton?: boolean
          slate_eyebrow?: string | null
          slate_heading?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_cta_label?: string | null
          hero_eyebrow?: string | null
          hero_image_url?: string | null
          hero_logline?: string | null
          hero_title?: string | null
          id?: string
          news_eyebrow?: string | null
          news_heading?: string | null
          newsletter_body?: string | null
          newsletter_heading?: string | null
          partner_body?: string | null
          partner_cta_label?: string | null
          partner_heading?: string | null
          show_laurels?: boolean
          show_news?: boolean
          show_newsletter?: boolean
          show_partner?: boolean
          show_quotes?: boolean
          singleton?: boolean
          slate_eyebrow?: string | null
          slate_heading?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          ip_address: string | null
          is_spam: boolean
          referrer: string | null
          source: string | null
          spam_score: number
          unsubscribed: boolean
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          is_spam?: boolean
          referrer?: string | null
          source?: string | null
          spam_score?: number
          unsubscribed?: boolean
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          is_spam?: boolean
          referrer?: string | null
          source?: string | null
          spam_score?: number
          unsubscribed?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: string | null
          body: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      press_items: {
        Row: {
          created_at: string
          film_id: string | null
          id: string
          kind: string
          link_url: string | null
          outlet: string | null
          published: boolean
          quote: string | null
          sort_order: number
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string
          film_id?: string | null
          id?: string
          kind?: string
          link_url?: string | null
          outlet?: string | null
          published?: boolean
          quote?: string | null
          sort_order?: number
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string
          film_id?: string | null
          id?: string
          kind?: string
          link_url?: string | null
          outlet?: string | null
          published?: boolean
          quote?: string | null
          sort_order?: number
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "press_items_film_id_fkey"
            columns: ["film_id"]
            isOneToOne: false
            referencedRelation: "films"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          connected: boolean
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          notes: string | null
          platform: string
          updated_at: string
        }
        Insert: {
          connected?: boolean
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          notes?: string | null
          platform: string
          updated_at?: string
        }
        Update: {
          connected?: boolean
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          notes?: string | null
          platform?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          attempts: number
          caption: string
          created_at: string
          error: string | null
          external_id: string | null
          external_url: string | null
          id: string
          link_url: string | null
          media_url: string | null
          platform: string
          posted_at: string | null
          scheduled_for: string | null
          source_id: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          caption?: string
          created_at?: string
          error?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          platform: string
          posted_at?: string | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          caption?: string
          created_at?: string
          error?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          platform?: string
          posted_at?: string | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "editor"
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
    Enums: {
      app_role: ["admin", "editor"],
    },
  },
} as const
