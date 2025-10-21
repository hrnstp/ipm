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

export interface SmartSolution {
  id: string;
  developer_id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  maturity_level: 'concept' | 'prototype' | 'pilot' | 'production';
  target_regions: string[];
  price_model?: string;
  implementation_time?: string;
  case_studies: any[];
  requirements: any;
  adaptability_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Municipality {
  id: string;
  profile_id: string;
  city_name: string;
  population?: number;
  budget_range?: string;
  priorities: string[];
  challenges: string[];
  existing_infrastructure: any;
  preferred_solutions: string[];
  language: string;
  contact_info: any;
  created_at: string;
  updated_at: string;
}

export interface Integrator {
  id: string;
  profile_id: string;
  company_name: string;
  expertise_areas: string[];
  service_regions: string[];
  certifications: string[];
  past_projects: any[];
  languages: string[];
  capacity?: string;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  initiator_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  connection_type: 'partnership' | 'inquiry' | 'collaboration';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  solution_id: string;
  municipality_id: string;
  integrator_id?: string;
  developer_id: string;
  title: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  phase?: string;
  start_date?: string;
  estimated_completion?: string;
  budget?: number;
  adaptation_notes?: string;
  milestones: any[];
  created_at: string;
  updated_at: string;
}
