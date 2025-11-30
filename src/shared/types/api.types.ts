// Типы для API ответов и запросов

import { PostgrestError } from '@supabase/supabase-js';

export interface ApiResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectFilters extends FilterOptions {
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  developer_id?: string;
  municipality_id?: string;
  integrator_id?: string;
}

export interface SolutionFilters extends FilterOptions {
  category?: string;
  maturity_level?: 'concept' | 'prototype' | 'pilot' | 'production';
  target_regions?: string[];
  developer_id?: string;
}

export interface RFPFilters extends FilterOptions {
  status?: 'draft' | 'published' | 'closed' | 'awarded';
  category?: string;
  municipality_id?: string;
}

export interface ConnectionFilters extends FilterOptions {
  status?: 'pending' | 'accepted' | 'rejected';
  connection_type?: 'partnership' | 'inquiry' | 'collaboration';
  user_id?: string;
}

