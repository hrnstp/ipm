import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
