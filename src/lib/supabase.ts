import { createClient } from '@supabase/supabase-js';

// Валидация переменных окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверка наличия обязательных переменных окружения
if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is not defined. ' +
    'Please create a .env file with VITE_SUPABASE_URL=your_supabase_url'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not defined. ' +
    'Please create a .env file with VITE_SUPABASE_ANON_KEY=your_anon_key'
  );
}

// Проверка формата URL (базовая валидация)
try {
  new URL(supabaseUrl);
} catch {
  throw new Error(
    `VITE_SUPABASE_URL is not a valid URL: ${supabaseUrl}`
  );
}

// ВАЖНО: VITE_SUPABASE_ANON_KEY - это ПУБЛИЧНЫЙ ключ, предназначенный для клиента.
// Он безопасен для использования в браузере, так как все операции ограничены RLS политиками.
// НИКОГДА не используйте SERVICE_ROLE_KEY на клиенте!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'developer' | 'municipality' | 'integrator';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization: string;
  country: string;
  region: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

// Re-export types from shared/types for backward compatibility
export type {
  SmartSolution,
  Municipality,
  Integrator,
  Project,
  Connection,
  CaseStudy,
  SolutionRequirements,
  ExistingInfrastructure,
  ContactInfo,
  PastProject,
  Milestone,
  RFP,
  Bid,
  RFPRequirements,
  EvaluationCriteria,
  VendorRating,
} from '../shared/types/database.types';
