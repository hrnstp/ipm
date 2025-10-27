/*
  # Advanced Analytics and Insights Features

  1. New Tables
    - `platform_analytics`
      - `id` (uuid, primary key)
      - `metric_type` (text) - solution_view, project_created, connection_made, etc.
      - `metric_category` (text) - engagement, adoption, financial, etc.
      - `entity_id` (uuid) - Related entity (solution, project, etc.)
      - `entity_type` (text) - solution, project, municipality, developer
      - `value` (numeric) - Metric value
      - `metadata` (jsonb) - Additional context
      - `recorded_at` (timestamptz)
      - `recorded_by` (uuid, foreign key to profiles)
    
    - `solution_adoption_metrics`
      - `id` (uuid, primary key)
      - `solution_id` (uuid, foreign key to smart_solutions)
      - `period_start` (date)
      - `period_end` (date)
      - `implementations` (integer) - Number of implementations
      - `success_count` (integer)
      - `failure_count` (integer)
      - `avg_implementation_time` (integer) - Days
      - `total_investment` (numeric)
      - `regions` (jsonb) - Adoption by region
      - `created_at` (timestamptz)
    
    - `municipality_benchmarks`
      - `id` (uuid, primary key)
      - `municipality_id` (uuid, foreign key to municipalities)
      - `period_start` (date)
      - `period_end` (date)
      - `total_projects` (integer)
      - `completed_projects` (integer)
      - `total_investment` (numeric)
      - `avg_project_duration` (integer) - Days
      - `technology_categories` (jsonb) - Adoption by category
      - `success_rate` (numeric)
      - `citizen_satisfaction` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Platform analytics visible to authenticated users
    - Aggregated data publicly viewable
    - Detailed metrics restricted to relevant parties

  3. Indexes
    - Add indexes for metric types and date ranges
    - Add indexes for entity lookups
*/

-- Platform Analytics Table
CREATE TABLE IF NOT EXISTS platform_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_category text NOT NULL,
  entity_id uuid,
  entity_type text,
  value numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamptz DEFAULT now(),
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view aggregated analytics"
  ON platform_analytics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can record analytics"
  ON platform_analytics FOR INSERT
  TO authenticated
  WITH CHECK (recorded_by = auth.uid());

-- Solution Adoption Metrics Table
CREATE TABLE IF NOT EXISTS solution_adoption_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid REFERENCES smart_solutions(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  implementations integer DEFAULT 0,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  avg_implementation_time integer DEFAULT 0,
  total_investment numeric DEFAULT 0,
  regions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE solution_adoption_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view solution adoption metrics"
  ON solution_adoption_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage adoption metrics"
  ON solution_adoption_metrics FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Municipality Benchmarks Table
CREATE TABLE IF NOT EXISTS municipality_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_projects integer DEFAULT 0,
  completed_projects integer DEFAULT 0,
  total_investment numeric DEFAULT 0,
  avg_project_duration integer DEFAULT 0,
  technology_categories jsonb DEFAULT '{}',
  success_rate numeric DEFAULT 0,
  citizen_satisfaction numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE municipality_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view municipality benchmarks"
  ON municipality_benchmarks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Municipality can manage their benchmarks"
  ON municipality_benchmarks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM municipalities
      WHERE municipalities.id = municipality_benchmarks.municipality_id
      AND municipalities.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM municipalities
      WHERE municipalities.id = municipality_benchmarks.municipality_id
      AND municipalities.profile_id = auth.uid()
    )
  );

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_platform_analytics_type ON platform_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_category ON platform_analytics(metric_category);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_entity ON platform_analytics(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_solution_adoption_solution ON solution_adoption_metrics(solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_adoption_period ON solution_adoption_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_municipality_benchmarks_municipality ON municipality_benchmarks(municipality_id);
CREATE INDEX IF NOT EXISTS idx_municipality_benchmarks_period ON municipality_benchmarks(period_start, period_end);

-- Create view for trend analysis
CREATE OR REPLACE VIEW solution_trends AS
SELECT 
  ss.id,
  ss.title,
  ss.category,
  ss.maturity_level,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT p.municipality_id) as municipality_count,
  AVG(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as success_rate,
  SUM(p.budget) as total_investment,
  ss.created_at
FROM smart_solutions ss
LEFT JOIN projects p ON p.solution_id = ss.id
GROUP BY ss.id, ss.title, ss.category, ss.maturity_level, ss.created_at;

-- Create view for category performance
CREATE OR REPLACE VIEW category_performance AS
SELECT 
  ss.category,
  COUNT(DISTINCT ss.id) as solution_count,
  COUNT(DISTINCT p.id) as project_count,
  AVG(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as avg_success_rate,
  SUM(p.budget) as total_investment,
  COUNT(DISTINCT p.municipality_id) as municipality_count
FROM smart_solutions ss
LEFT JOIN projects p ON p.solution_id = ss.id
GROUP BY ss.category;
