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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description_ar: string | null
          id: string
          image_url: string | null
          name_ar: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          name_ar: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          name_ar?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name_ar: string
          quantity: number
          specs_ar: string | null
          unit_ar: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name_ar: string
          quantity?: number
          specs_ar?: string | null
          unit_ar?: string
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name_ar?: string
          quantity?: number
          specs_ar?: string | null
          unit_ar?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_code: string
          company_name: string | null
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string
          id: string
          national_address: string | null
          notes: string | null
          order_number: string
          payment_id: string | null
          status: string
          total: number
          updated_at: string
          user_id: string | null
          vat_number: string | null
          vat_rate: number
        }
        Insert: {
          access_code: string
          company_name?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          national_address?: string | null
          notes?: string | null
          order_number: string
          payment_id?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          vat_number?: string | null
          vat_rate?: number
        }
        Update: {
          access_code?: string
          company_name?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          national_address?: string | null
          notes?: string | null
          order_number?: string
          payment_id?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          vat_number?: string | null
          vat_rate?: number
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          in_stock: boolean
          label_ar: string
          price: number
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          in_stock?: boolean
          label_ar: string
          price?: number
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          in_stock?: boolean
          label_ar?: string
          price?: number
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description_ar: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          is_active: boolean
          name_ar: string
          price: number
          sort_order: number
          specs_ar: string | null
          unit_ar: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          name_ar: string
          price?: number
          sort_order?: number
          specs_ar?: string | null
          unit_ar?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          name_ar?: string
          price?: number
          sort_order?: number
          specs_ar?: string | null
          unit_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      admin_delete_order: { Args: { _order_id: string }; Returns: undefined }
      admin_set_order_status: {
        Args: { _order_id: string; _status: string }
        Returns: undefined
      }
      admin_set_setting: {
        Args: { _key: string; _value: string }
        Returns: undefined
      }
      admin_update_order_item: {
        Args: { _item_id: string; _quantity: number; _unit_price: number }
        Returns: undefined
      }
      create_order: {
        Args: {
          _address?: string
          _company?: string
          _items: Json
          _name: string
          _national_address?: string
          _notes?: string
          _phone: string
          _user_id?: string
          _vat?: string
        }
        Returns: {
          access_code: string
          order_id: string
          order_number: string
          total: number
        }[]
      }
      get_order_customer: {
        Args: { _access_code: string; _order_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_order_to_user: {
        Args: { _access_code: string; _order_id: string }
        Returns: undefined
      }
      set_order_paid: {
        Args: { _access_code: string; _order_id: string }
        Returns: undefined
      }
      set_payment_id: {
        Args: { _access_code: string; _order_id: string; _payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
