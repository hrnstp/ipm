// Строгие типы для базы данных
// Заменяют все any в интерфейсах

export interface CaseStudy {
  title: string;
  location: string;
  description: string;
  results?: string;
  year?: number;
}

export interface SolutionRequirements {
  infrastructure?: string[];
  technical?: string[];
  regulatory?: string[];
  budget_min?: number;
  budget_max?: number;
  timeline?: string;
}

export interface ExistingInfrastructure {
  connectivity?: string;
  sensors?: string[];
  platforms?: string[];
  other?: Record<string, unknown>;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  social?: Record<string, string>;
}

export interface PastProject {
  name: string;
  location: string;
  description: string;
  year?: number;
  budget?: number;
  technologies?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
}

// Обновленные интерфейсы с строгими типами
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
  case_studies: CaseStudy[];
  requirements: SolutionRequirements;
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
  existing_infrastructure: ExistingInfrastructure;
  preferred_solutions: string[];
  language: string;
  contact_info: ContactInfo;
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
  past_projects: PastProject[];
  languages: string[];
  capacity?: string;
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
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface VendorRating {
  id: string;
  vendor_id: string;
  rater_id: string;
  rating: number;
  comment?: string;
  categories: {
    quality?: number;
    delivery?: number;
    support?: number;
    price?: number;
  };
  created_at: string;
}

export interface RFPRequirements {
  technical?: string[];
  functional?: string[];
  compliance?: string[];
  timeline?: string;
  budget?: string;
}

export interface EvaluationCriteria {
  technical_score?: number;
  price_score?: number;
  experience_score?: number;
  timeline_score?: number;
  total_weight?: number;
}

export interface RFP {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline: string;
  requirements: RFPRequirements;
  evaluation_criteria: EvaluationCriteria;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  published_at?: string;
  created_at: string;
  created_by: string;
  municipality_id?: string;
  project_id?: string;
  selected_bid_id?: string;
  bid_count?: number;
  municipality?: {
    city_name: string;
    profile_id: string;
  };
  project?: {
    title: string;
    status: string;
  };
}

export interface Bid {
  id: string;
  rfp_id: string;
  developer_id: string;
  solution_id: string;
  proposal_text: string;
  price: number;
  currency: string;
  timeline: string;
  status: 'pending' | 'accepted' | 'rejected';
  submitted_at: string;
  developer?: {
    id: string;
    full_name: string;
    organization: string;
  };
  solution?: {
    id: string;
    title: string;
  };
}

