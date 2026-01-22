export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/* Enums */
export type user_role = "chief_admin" | "shop_rep" | "developer" | "customer";
export type order_status =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type finance_type = "income" | "expense";
export type finance_source = "online" | "manual";

/* Table row types */
export interface ProfilesRow {
  id: string; // uuid
  email: string;
  name: string;
  phone: string | null;
  role: user_role;
  permissions: Json | null;
  created_at: string | null; // timestamptz ISO
  updated_at: string | null; // timestamptz ISO
}

export interface ProductsRow {
  id: string;
  name: string;
  slug: string;
  price: string; // numeric stored as string
  vat_rate: string | null; // numeric
  stock: number;
  images: string[] | null;
  description: string | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrdersRow {
  id: string;
  user_id: string;
  status: order_status;
  items: Json;
  payment_ref: string | null;
  total_amount: string;
  address: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FinanceEntriesRow {
  id: string;
  type: finance_type;
  amount: string;
  source: finance_source;
  description: string | null;
  order_id: string | null;
  created_by: string | null;
  created_at: string | null;
}

export interface AuditLogsRow {
  id: string;
  table_name: string;
  operation: string;
  record_id: string;
  old_data: Json | null;
  new_data: Json | null;
  changed_by: string | null;
  changed_at: string | null;
}

export interface ErrorLogsRow {
  id: string;
  message: string;
  stack: string | null;
  context: Json | null;
  created_at: string | null;
}

export interface ComplaintsRow {
  id: string;
  order_id: string | null;
  user_id: string | null;
  description: string;
  status: string | null;
  created_at: string | null;
}

/* Insert types (what you'd supply when inserting) */
export type ProfilesInsert = {
  id?: string; // DB generates uuid by linking to auth.users on insert;
  email: string;
  name: string;
  phone?: string | null;
  role?: user_role;
  permissions?: Json | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProfilesUpdate = Partial<ProfilesRow>;

export type ProductsInsert = {
  id?: string;
  name: string;
  slug: string;
  price: string;
  vat_rate?: string | null;
  stock?: number;
  images?: string[] | null;
  description?: string | null;
  is_active?: boolean | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProductsUpdate = Partial<ProductsRow>;

export type OrdersInsert = {
  id?: string;
  user_id: string;
  status?: order_status;
  items: Json;
  payment_ref?: string | null;
  total_amount: string;
  address?: Json | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type OrdersUpdate = Partial<OrdersRow>;

export type FinanceEntriesInsert = {
  id?: string;
  type: finance_type;
  amount: string;
  source: finance_source;
  description?: string | null;
  order_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};

export type FinanceEntriesUpdate = Partial<FinanceEntriesRow>;

export type AuditLogsInsert = {
  id?: string;
  table_name: string;
  operation: string;
  record_id: string;
  old_data?: Json | null;
  new_data?: Json | null;
  changed_by?: string | null;
  changed_at?: string | null;
};
export type AuditLogsUpdate = Partial<AuditLogsRow>;

export type ErrorLogsInsert = {
  id?: string;
  message: string;
  stack?: string | null;
  context?: Json | null;
  created_at?: string | null;
};
export type ErrorLogsUpdate = Partial<ErrorLogsRow>;

export type ComplaintsInsert = {
  id?: string;
  order_id?: string | null;
  user_id?: string | null;
  description: string;
  status?: string | null;
  created_at?: string | null;
};
export type ComplaintsUpdate = Partial<ComplaintsRow>;

/* Database interface for supabase-js */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
      };
      products: {
        Row: ProductsRow;
        Insert: ProductsInsert;
        Update: ProductsUpdate;
      };
      orders: {
        Row: OrdersRow;
        Insert: OrdersInsert;
        Update: OrdersUpdate;
      };
      finance_entries: {
        Row: FinanceEntriesRow;
        Insert: FinanceEntriesInsert;
        Update: FinanceEntriesUpdate;
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: AuditLogsInsert;
        Update: AuditLogsUpdate;
      };
      error_logs: {
        Row: ErrorLogsRow;
        Insert: ErrorLogsInsert;
        Update: ErrorLogsUpdate;
      };
      complaints: {
        Row: ComplaintsRow;
        Insert: ComplaintsInsert;
        Update: ComplaintsUpdate;
      };
    };
    Enums: {
      user_role: user_role;
      order_status: order_status;
      finance_type: finance_type;
      finance_source: finance_source;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
