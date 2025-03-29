export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          order_id: string
          photo_file_id: string | null
          quantity: number
          selected_options: Json | null
          service_id: string
          subtotal: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          order_id: string
          photo_file_id?: string | null
          quantity: number
          selected_options?: Json | null
          service_id: string
          subtotal?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          order_id?: string
          photo_file_id?: string | null
          quantity?: number
          selected_options?: Json | null
          service_id?: string
          subtotal?: number | null
          unit_price?: number
          updated_at?: string
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
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "photo_services"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advance_payment: number | null
          comments: string | null
          created_at: string
          customer_id: string
          delivery_format: Database["public"]["Enums"]["delivery_format"]
          folio: string
          id: string
          remaining_payment: number | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          advance_payment?: number | null
          comments?: string | null
          created_at?: string
          customer_id: string
          delivery_format: Database["public"]["Enums"]["delivery_format"]
          folio: string
          id?: string
          remaining_payment?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          advance_payment?: number | null
          comments?: string | null
          created_at?: string
          customer_id?: string
          delivery_format?: Database["public"]["Enums"]["delivery_format"]
          folio?: string
          id?: string
          remaining_payment?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          filename: string
          id: string
          metadata: Json | null
          order_id: string
          original_filename: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          order_id: string
          original_filename?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          original_filename?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_services: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          description: string
          id: string
          type: Database["public"]["Enums"]["photo_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price: number
          created_at?: string
          description: string
          id?: string
          type: Database["public"]["Enums"]["photo_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          description?: string
          id?: string
          type?: Database["public"]["Enums"]["photo_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_attributes: {
        Row: {
          attribute_key: string
          created_at: string
          id: string
          price_modifier: number
          service_id: string | null
          updated_at: string
        }
        Insert: {
          attribute_key: string
          created_at?: string
          id?: string
          price_modifier: number
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          attribute_key?: string
          created_at?: string
          id?: string
          price_modifier?: number
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_attributes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "photo_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_options: {
        Row: {
          choices: Json | null
          created_at: string
          id: string
          option_name: string
          option_type: string
          required: boolean | null
          service_id: string | null
          updated_at: string
        }
        Insert: {
          choices?: Json | null
          created_at?: string
          id?: string
          option_name: string
          option_type: string
          required?: boolean | null
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          choices?: Json | null
          created_at?: string
          id?: string
          option_name?: string
          option_type?: string
          required?: boolean | null
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_options_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "photo_services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      delivery_format: "impresa" | "digital" | "ambos"
      order_status:
        | "pendiente"
        | "en_proceso"
        | "completado"
        | "entregado"
        | "cancelado"
      photo_type:
        | "infantil"
        | "ovalada"
        | "credencial"
        | "pasaporte"
        | "familiar"
        | "individual"
        | "grupal"
        | "evento"
        | "restauracion"
        | "otro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
