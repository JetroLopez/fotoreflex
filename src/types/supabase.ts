export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface PackageOption {
  id: string
  name: string
  price_increment: number
}

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          institution: string
          delivery_date: string
          status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          comments: string | null
          created_at: string
          updated_at: string
          group_members?: GroupMember[]
        }
        Insert: {
          id?: string
          name: string
          institution: string
          delivery_date: string
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          institution?: string
          delivery_date?: string
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["id"]
            referencedRelation: "group_members"
            referencedColumns: ["group_id"]
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          customer_id: string
          created_at: string
          customer?: Customer
        }
        Insert: {
          id?: string
          group_id: string
          customer_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          customer_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_packages: {
        Row: {
          id: string
          name: string
          description: string
          base_price: number
          options: PackageOption[]
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          base_price: number
          options?: PackageOption[]
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          base_price?: number
          options?: PackageOption[]
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          group_id: string | null
          package_id: string | null
          selected_options: string[]
          total_price: number
          advance_payment: number
          status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          priority: 'normal' | 'urgente'
          delivery_format: 'impresa' | 'digital' | 'ambos'
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          group_id?: string | null
          package_id?: string | null
          selected_options?: string[]
          total_price: number
          advance_payment?: number
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          priority?: 'normal' | 'urgente'
          delivery_format?: 'impresa' | 'digital' | 'ambos'
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          group_id?: string | null
          package_id?: string | null
          selected_options?: string[]
          total_price?: number
          advance_payment?: number
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          priority?: 'normal' | 'urgente'
          delivery_format?: 'impresa' | 'digital' | 'ambos'
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      photo_services: {
        Row: {
          id: string
          name: string
          description: string
          base_price: number
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          base_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          base_price?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_options: {
        Row: {
          id: string
          service_id: string
          label: string
          option_type: 'dropdown' | 'checkbox'
          choices: Json
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          service_id: string
          label: string
          option_type?: 'dropdown' | 'checkbox'
          choices: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          label?: string
          option_type?: 'dropdown' | 'checkbox'
          choices?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_options_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "photo_services"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos de utilidad para las tablas
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Tipos exportados para cada tabla
export type Group = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type Customer = Tables<'customers'>
export type PhotoPackage = Tables<'photo_packages'>
export type Order = Tables<'orders'>
export type PhotoService = Tables<'photo_services'>
export type ServiceOption = Tables<'service_options'>

export interface PhotoService {
  id: string;
  type?: string;
  description: string;
  base_price: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  is_customizable?: boolean;
  customization_note?: string;
} 