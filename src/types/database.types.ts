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
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          group_id?: string
          package_id?: string
          selected_options: string[]
          total_price: number
          advance_payment: number
          status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          priority: 'normal' | 'urgente'
          delivery_format: 'impresa' | 'digital' | 'ambos'
          comments: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          group_id?: string
          package_id?: string
          selected_options?: string[]
          total_price: number
          advance_payment?: number
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          priority?: 'normal' | 'urgente'
          delivery_format?: 'impresa' | 'digital' | 'ambos'
          comments?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          group_id?: string
          package_id?: string
          selected_options?: string[]
          total_price?: number
          advance_payment?: number
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          priority?: 'normal' | 'urgente'
          delivery_format?: 'impresa' | 'digital' | 'ambos'
          comments?: string
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          institution: string
          delivery_date: string
          status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          comments?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          institution: string
          delivery_date: string
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          comments?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          institution?: string
          delivery_date?: string
          status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'
          comments?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          customer_id: string
          created_at: string
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
      }
      photo_packages: {
        Row: {
          id: string
          name: string
          description: string
          base_price: number
          options: {
            id: string
            name: string
            price_increment: number
          }[]
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          base_price: number
          options?: {
            id: string
            name: string
            price_increment: number
          }[]
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          base_price?: number
          options?: {
            id: string
            name: string
            price_increment: number
          }[]
          active?: boolean
          created_at?: string
          updated_at?: string
        }
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Tipos específicos para cada tabla
export type Customer = Tables<'customers'>
export type Order = Tables<'orders'>
export type Groups = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type PhotoPackage = Tables<'photo_packages'> 