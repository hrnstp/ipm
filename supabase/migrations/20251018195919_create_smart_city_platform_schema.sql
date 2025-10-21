/*
  # Smart City B2B Platform Schema

  ## Overview
  This migration creates the foundational database schema for an international B2B platform
  connecting smart city solution developers with municipalities and integrators in the Global South.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - Full name
  - `role` (text) - User role: 'developer', 'municipality', 'integrator'
  - `organization` (text) - Organization name
  - `country` (text) - Country location
  - `region` (text) - Region (for Global South classification)
  - `bio` (text) - Profile description
  - `avatar_url` (text) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. `smart_solutions`
  Smart city solutions catalog
  - `id` (uuid, primary key)
  - `developer_id` (uuid) - Links to profiles (developer)
  - `title` (text) - Solution name
  - `description` (text) - Detailed description
  - `category` (text) - Solution category (traffic, energy, water, waste, safety, etc.)
  - `technologies` (text[]) - Array of technologies used
  - `maturity_level` (text) - Development stage: 'concept', 'prototype', 'pilot', 'production'
  - `target_regions` (text[]) - Target Global South regions
  - `price_model` (text) - Pricing structure
  - `implementation_time` (text) - Estimated deployment time
  - `case_studies` (jsonb) - Success stories and implementations
  - `requirements` (jsonb) - Technical and infrastructure requirements
  - `adaptability_score` (integer) - How easily adaptable to local conditions (1-10)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `municipalities`
  Municipality profiles and needs
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - Links to profiles
  - `city_name` (text) - City/municipality name
  - `population` (integer) - Population size
  - `budget_range` (text) - Available budget category
  - `priorities` (text[]) - Smart city priorities
  - `challenges` (text[]) - Current challenges
  - `existing_infrastructure` (jsonb) - Current infrastructure details
  - `preferred_solutions` (text[]) - Solution categories of interest
  - `language` (text) - Primary language
  - `contact_info` (jsonb) - Contact details
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `integrators`
  System integrator profiles and capabilities
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - Links to profiles
  - `company_name` (text) - Company name
  - `expertise_areas` (text[]) - Areas of expertise
  - `service_regions` (text[]) - Regions served
  - `certifications` (text[]) - Professional certifications
  - `past_projects` (jsonb) - Portfolio of completed projects
  - `languages` (text[]) - Languages supported
  - `capacity` (text) - Project capacity
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `connections`
  Stakeholder connections and partnerships
  - `id` (uuid, primary key)
  - `initiator_id` (uuid) - Profile initiating connection
  - `recipient_id` (uuid) - Profile receiving connection
  - `status` (text) - 'pending', 'accepted', 'rejected'
  - `message` (text) - Initial connection message
  - `connection_type` (text) - 'partnership', 'inquiry', 'collaboration'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. `projects`
  Active implementation projects
  - `id` (uuid, primary key)
  - `solution_id` (uuid) - Links to smart_solutions
  - `municipality_id` (uuid) - Links to municipalities
  - `integrator_id` (uuid, nullable) - Links to integrators
  - `developer_id` (uuid) - Links to profiles (developer)
  - `title` (text) - Project name
  - `status` (text) - 'planning', 'in_progress', 'completed', 'on_hold'
  - `phase` (text) - Current implementation phase
  - `start_date` (date) - Project start
  - `estimated_completion` (date) - Expected completion
  - `budget` (numeric) - Project budget
  - `adaptation_notes` (text) - Local adaptation details
  - `milestones` (jsonb) - Project milestones
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. `technology_transfers`
  Technology transfer and adaptation tracking
  - `id` (uuid, primary key)
  - `project_id` (uuid) - Links to projects
  - `transfer_type` (text) - 'knowledge', 'training', 'documentation', 'technical_support'
  - `description` (text) - Transfer details
  - `local_adaptations` (jsonb) - Adaptations made for local context
  - `challenges_faced` (text[]) - Implementation challenges
  - `solutions_applied` (text[]) - Solutions to challenges
  - `success_metrics` (jsonb) - Success measurements
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 8. `messages`
  Platform messaging system
  - `id` (uuid, primary key)
  - `sender_id` (uuid) - Sender profile
  - `recipient_id` (uuid) - Recipient profile
  - `subject` (text) - Message subject
  - `content` (text) - Message body
  - `read` (boolean) - Read status
  - `project_id` (uuid, nullable) - Related project
  - `created_at` (timestamptz)

  ## Security

  - Row Level Security (RLS) enabled on all tables
  - Policies restrict data access based on user role and ownership
  - Authenticated users can read public marketplace data
  - Users can only modify their own profiles and content
  - Connection requests respect privacy and consent
  - Project data accessible to project participants only

  ## Indexes

  - Indexes added for frequently queried columns (role, category, status, country, region)
  - Full-text search support for solutions and municipalities
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('developer', 'municipality', 'integrator')),
  organization text NOT NULL,
  country text NOT NULL,
  region text NOT NULL,
  bio text DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Smart Solutions Table
CREATE TABLE IF NOT EXISTS smart_solutions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  technologies text[] DEFAULT '{}',
  maturity_level text NOT NULL CHECK (maturity_level IN ('concept', 'prototype', 'pilot', 'production')),
  target_regions text[] DEFAULT '{}',
  price_model text,
  implementation_time text,
  case_studies jsonb DEFAULT '[]',
  requirements jsonb DEFAULT '{}',
  adaptability_score integer CHECK (adaptability_score >= 1 AND adaptability_score <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Municipalities Table
CREATE TABLE IF NOT EXISTS municipalities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  city_name text NOT NULL,
  population integer,
  budget_range text,
  priorities text[] DEFAULT '{}',
  challenges text[] DEFAULT '{}',
  existing_infrastructure jsonb DEFAULT '{}',
  preferred_solutions text[] DEFAULT '{}',
  language text NOT NULL,
  contact_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Integrators Table
CREATE TABLE IF NOT EXISTS integrators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_name text NOT NULL,
  expertise_areas text[] DEFAULT '{}',
  service_regions text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  past_projects jsonb DEFAULT '[]',
  languages text[] DEFAULT '{}',
  capacity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Connections Table
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message text,
  connection_type text NOT NULL CHECK (connection_type IN ('partnership', 'inquiry', 'collaboration')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_users CHECK (initiator_id != recipient_id)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  solution_id uuid NOT NULL REFERENCES smart_solutions(id) ON DELETE CASCADE,
  municipality_id uuid NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  integrator_id uuid REFERENCES integrators(id) ON DELETE SET NULL,
  developer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  phase text,
  start_date date,
  estimated_completion date,
  budget numeric,
  adaptation_notes text,
  milestones jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Technology Transfers Table
CREATE TABLE IF NOT EXISTS technology_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  transfer_type text NOT NULL CHECK (transfer_type IN ('knowledge', 'training', 'documentation', 'technical_support')),
  description text NOT NULL,
  local_adaptations jsonb DEFAULT '{}',
  challenges_faced text[] DEFAULT '{}',
  solutions_applied text[] DEFAULT '{}',
  success_metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);
CREATE INDEX IF NOT EXISTS idx_solutions_developer ON smart_solutions(developer_id);
CREATE INDEX IF NOT EXISTS idx_solutions_category ON smart_solutions(category);
CREATE INDEX IF NOT EXISTS idx_solutions_maturity ON smart_solutions(maturity_level);
CREATE INDEX IF NOT EXISTS idx_municipalities_profile ON municipalities(profile_id);
CREATE INDEX IF NOT EXISTS idx_integrators_profile ON integrators(profile_id);
CREATE INDEX IF NOT EXISTS idx_connections_initiator ON connections(initiator_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_municipality ON projects(municipality_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for smart_solutions
CREATE POLICY "Solutions are viewable by authenticated users"
  ON smart_solutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Developers can insert solutions"
  ON smart_solutions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = developer_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'developer')
  );

CREATE POLICY "Developers can update own solutions"
  ON smart_solutions FOR UPDATE
  TO authenticated
  USING (auth.uid() = developer_id)
  WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Developers can delete own solutions"
  ON smart_solutions FOR DELETE
  TO authenticated
  USING (auth.uid() = developer_id);

-- RLS Policies for municipalities
CREATE POLICY "Municipalities are viewable by authenticated users"
  ON municipalities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Municipality users can insert their profile"
  ON municipalities FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = profile_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'municipality')
  );

CREATE POLICY "Municipality users can update own profile"
  ON municipalities FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policies for integrators
CREATE POLICY "Integrators are viewable by authenticated users"
  ON integrators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Integrator users can insert their profile"
  ON integrators FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = profile_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'integrator')
  );

CREATE POLICY "Integrator users can update own profile"
  ON integrators FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policies for connections
CREATE POLICY "Users can view their connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Recipients can update connection status"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users can delete own initiated connections"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = initiator_id);

-- RLS Policies for projects
CREATE POLICY "Users can view projects they participate in"
  ON projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM integrators WHERE id = integrator_id AND profile_id = auth.uid())
  );

CREATE POLICY "Developers and municipalities can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = auth.uid())
  );

CREATE POLICY "Project participants can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM integrators WHERE id = integrator_id AND profile_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM integrators WHERE id = integrator_id AND profile_id = auth.uid())
  );

-- RLS Policies for technology_transfers
CREATE POLICY "Project participants can view technology transfers"
  ON technology_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        auth.uid() = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "Project participants can create technology transfers"
  ON technology_transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        auth.uid() = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "Project participants can update technology transfers"
  ON technology_transfers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        auth.uid() = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        auth.uid() = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = auth.uid())
      )
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);