
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "categories": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"name": string,"slug": string
                  }
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"comments": {
                  Row: {
                    "author_email": string,"author_name": string,"content": string,"created_at": string,"id": string,"parent_id": string | null,"post_id": string,"status": string
                  }
                  Insert: {
                    "author_email": string,"author_name": string,"content": string,"created_at"?: string,"id"?: string,"parent_id"?: string | null,"post_id": string,"status"?: string
                  }
                  Update: {
                    "author_email"?: string,"author_name"?: string,"content"?: string,"created_at"?: string,"id"?: string,"parent_id"?: string | null,"post_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"newsletter_subscribers": {
                  Row: {
                    "created_at": string,"email": string,"id": string
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"id"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"post_tags": {
                  Row: {
                    "post_id": string,"tag_id": string
                  }
                  Insert: {
                    "post_id": string,"tag_id": string
                  }
                  Update: {
                    "post_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_tags_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"post_views": {
                  Row: {
                    "id": number,"post_id": string,"referrer": string | null,"viewed_at": string,"visitor_id": string
                  }
                  Insert: {
                    "id"?: never,"post_id": string,"referrer"?: string | null,"viewed_at"?: string,"visitor_id": string
                  }
                  Update: {
                    "id"?: never,"post_id"?: string,"referrer"?: string | null,"viewed_at"?: string,"visitor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_views_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string | null,"category_id": string | null,"content": string,"cover_image_url": string | null,"created_at": string,"excerpt": string | null,"featured": boolean,"id": string,"meta_description": string | null,"meta_title": string | null,"published_at": string | null,"reading_time": number,"search_vector": unknown,"slug": string,"status": string,"title": string,"updated_at": string,"views": number
                  }
                  Insert: {
                    "author_id"?: string | null,"category_id"?: string | null,"content"?: string,"cover_image_url"?: string | null,"created_at"?: string,"excerpt"?: string | null,"featured"?: boolean,"id"?: string,"meta_description"?: string | null,"meta_title"?: string | null,"published_at"?: string | null,"reading_time"?: number,"search_vector"?: never,"slug": string,"status"?: string,"title": string,"updated_at"?: string,"views"?: number
                  }
                  Update: {
                    "author_id"?: string | null,"category_id"?: string | null,"content"?: string,"cover_image_url"?: string | null,"created_at"?: string,"excerpt"?: string | null,"featured"?: boolean,"id"?: string,"meta_description"?: string | null,"meta_title"?: string | null,"published_at"?: string | null,"reading_time"?: number,"search_vector"?: never,"slug"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"views"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string,"full_name": string | null,"id": string,"role": string,"updated_at": string,"username": string | null
                  }
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"full_name"?: string | null,"id": string,"role"?: string,"updated_at"?: string,"username"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"full_name"?: string | null,"id"?: string,"role"?: string,"updated_at"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "id": number,"logo_url": string | null,"posts_per_page": number,"site_description": string | null,"site_name": string,"social_links": NonNullable<Json>,"updated_at": string
                  }
                  Insert: {
                    "id"?: number,"logo_url"?: string | null,"posts_per_page"?: number,"site_description"?: string | null,"site_name"?: string,"social_links"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "id"?: number,"logo_url"?: string | null,"posts_per_page"?: number,"site_description"?: string | null,"site_name"?: string,"social_links"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tags": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"slug": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "increment_post_views":
{ Args: { "post_slug": string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"search_posts":
{ Args: { "page_limit"?: number,"page_offset"?: number,"search_query": string }; Returns: {
              "author_id": string,"category_id": string,"cover_image_url": string,"excerpt": string,"headline": string,"id": string,"published_at": string,"rank": number,"reading_time": number,"slug": string,"title": string,"total_count": number
            }[]
                           },
"track_post_view":
{ Args: { "post_slug": string,"referrer_host"?: string,"visitor": string }; Returns: undefined
                           },
"visitor_daily":
{ Args: { "from_ts": string,"to_ts": string }; Returns: {
              "day": string,"views": number,"visitors": number
            }[]
                           },
"visitor_referrers":
{ Args: { "from_ts": string,"max_rows"?: number,"to_ts": string }; Returns: {
              "referrer": string,"views": number,"visitors": number
            }[]
                           },
"visitor_top_posts":
{ Args: { "from_ts": string,"max_rows"?: number,"to_ts": string }; Returns: {
              "post_id": string,"slug": string,"title": string,"views": number,"visitors": number
            }[]
                           },
"visitor_totals":
{ Args: { "from_ts": string,"to_ts": string }; Returns: {
              "stories": number,"views": number,"visitors": number
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

