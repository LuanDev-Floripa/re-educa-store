/**
 * Tipos TypeScript para APIs RE-EDUCA Store
 * 
 * Define interfaces e tipos para comunicação com o backend.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  subtotal: number;
  discount_amount?: number;
  shipping_cost?: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  shipping_address?: Address;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}
