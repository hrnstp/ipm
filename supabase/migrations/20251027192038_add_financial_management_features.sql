/*
  # Financial Management Features

  1. New Tables
    - `funding_opportunities`
      - `id` (uuid, primary key)
      - `title` (text) - Name of funding opportunity
      - `provider` (text) - Organization providing funding
      - `type` (text) - grant, loan, subsidy, etc.
      - `amount_min` (numeric) - Minimum funding amount
      - `amount_max` (numeric) - Maximum funding amount
      - `currency` (text) - Currency code
      - `eligible_regions` (text[]) - Regions eligible for funding
      - `eligible_categories` (text[]) - Solution categories eligible
      - `description` (text) - Full description
      - `requirements` (text[]) - Application requirements
      - `deadline` (timestamptz) - Application deadline
      - `application_url` (text) - Link to apply
      - `status` (text) - active, expired, closed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `budget_estimates`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `municipality_id` (uuid, foreign key to municipalities)
      - `solution_id` (uuid, foreign key to smart_solutions)
      - `created_by` (uuid, foreign key to profiles)
      - `total_estimate` (numeric) - Total estimated cost
      - `currency` (text) - Currency code
      - `breakdown` (jsonb) - Cost breakdown by category
      - `implementation_cost` (numeric)
      - `hardware_cost` (numeric)
      - `software_cost` (numeric)
      - `training_cost` (numeric)
      - `maintenance_annual` (numeric) - Annual maintenance cost
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `payment_milestones`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `title` (text) - Milestone name
      - `description` (text)
      - `amount` (numeric) - Payment amount
      - `currency` (text)
      - `due_date` (timestamptz)
      - `status` (text) - pending, paid, overdue, cancelled
      - `paid_date` (timestamptz)
      - `payment_reference` (text)
      - `notes` (text)
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `financial_transactions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `milestone_id` (uuid, foreign key to payment_milestones)
      - `transaction_type` (text) - payment, refund, adjustment
      - `amount` (numeric)
      - `currency` (text)
      - `description` (text)
      - `category` (text) - hardware, software, services, etc.
      - `transaction_date` (timestamptz)
      - `recorded_by` (uuid, foreign key to profiles)
      - `receipt_url` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to read funding opportunities
    - Add policies for project participants to manage budgets and payments
    - Add policies for authorized users to record transactions

  3. Indexes
    - Add indexes for foreign keys and commonly queried fields
    - Add indexes for date-based queries
*/

-- Funding Opportunities Table
CREATE TABLE IF NOT EXISTS funding_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  provider text NOT NULL,
  type text NOT NULL,
  amount_min numeric,
  amount_max numeric,
  currency text DEFAULT 'USD',
  eligible_regions text[] DEFAULT '{}',
  eligible_categories text[] DEFAULT '{}',
  description text,
  requirements text[] DEFAULT '{}',
  deadline timestamptz,
  application_url text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE funding_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active funding opportunities"
  ON funding_opportunities FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Only admins can insert funding opportunities"
  ON funding_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only admins can update funding opportunities"
  ON funding_opportunities FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Only admins can delete funding opportunities"
  ON funding_opportunities FOR DELETE
  TO authenticated
  USING (false);

-- Budget Estimates Table
CREATE TABLE IF NOT EXISTS budget_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  municipality_id uuid REFERENCES municipalities(id) ON DELETE CASCADE,
  solution_id uuid REFERENCES smart_solutions(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  total_estimate numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  breakdown jsonb DEFAULT '{}',
  implementation_cost numeric DEFAULT 0,
  hardware_cost numeric DEFAULT 0,
  software_cost numeric DEFAULT 0,
  training_cost numeric DEFAULT 0,
  maintenance_annual numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget estimates for their projects"
  ON budget_estimates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = budget_estimates.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
        OR projects.integrator_id IN (
          SELECT id FROM integrators WHERE profile_id = auth.uid()
        )
      )
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Project participants can create budget estimates"
  ON budget_estimates FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Creator can update their budget estimates"
  ON budget_estimates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator can delete their budget estimates"
  ON budget_estimates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Payment Milestones Table
CREATE TABLE IF NOT EXISTS payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  due_date timestamptz,
  status text DEFAULT 'pending',
  paid_date timestamptz,
  payment_reference text,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project participants can view payment milestones"
  ON payment_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_milestones.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
        OR projects.integrator_id IN (
          SELECT id FROM integrators WHERE profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project participants can create payment milestones"
  ON payment_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_milestones.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project participants can update payment milestones"
  ON payment_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_milestones.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_milestones.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project participants can delete payment milestones"
  ON payment_milestones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_milestones.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
      )
    )
  );

-- Financial Transactions Table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id uuid REFERENCES payment_milestones(id) ON DELETE SET NULL,
  transaction_type text DEFAULT 'payment',
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  description text NOT NULL,
  category text,
  transaction_date timestamptz DEFAULT now(),
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project participants can view financial transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = financial_transactions.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
        OR projects.integrator_id IN (
          SELECT id FROM integrators WHERE profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project participants can record financial transactions"
  ON financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = financial_transactions.project_id
      AND (
        projects.developer_id = auth.uid()
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Recorder can update their financial transactions"
  ON financial_transactions FOR UPDATE
  TO authenticated
  USING (recorded_by = auth.uid())
  WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "Recorder can delete their financial transactions"
  ON financial_transactions FOR DELETE
  TO authenticated
  USING (recorded_by = auth.uid());

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_funding_opportunities_status ON funding_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_funding_opportunities_deadline ON funding_opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_funding_opportunities_regions ON funding_opportunities USING GIN(eligible_regions);

CREATE INDEX IF NOT EXISTS idx_budget_estimates_project ON budget_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_estimates_municipality ON budget_estimates(municipality_id);
CREATE INDEX IF NOT EXISTS idx_budget_estimates_solution ON budget_estimates(solution_id);
CREATE INDEX IF NOT EXISTS idx_budget_estimates_created_by ON budget_estimates(created_by);

CREATE INDEX IF NOT EXISTS idx_payment_milestones_project ON payment_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_status ON payment_milestones(status);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_due_date ON payment_milestones(due_date);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_project ON financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_milestone ON financial_transactions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);

-- Insert Sample Funding Opportunities
INSERT INTO funding_opportunities (title, provider, type, amount_min, amount_max, currency, eligible_regions, eligible_categories, description, requirements, deadline, application_url, status) VALUES
('Smart Cities Innovation Grant', 'World Bank', 'grant', 50000, 500000, 'USD', 
  ARRAY['Sub-Saharan Africa', 'South Asia', 'Latin America & Caribbean'], 
  ARRAY['Traffic Management', 'Energy & Utilities', 'Water Management'],
  'Funding for innovative smart city solutions in developing regions focusing on sustainable urban development.',
  ARRAY['Detailed project proposal', 'Budget breakdown', 'Municipal endorsement letter', 'Implementation timeline'],
  (now() + interval '3 months')::timestamptz,
  'https://worldbank.org/smart-cities-grant',
  'active'),
  
('Climate Resilience Technology Fund', 'Green Climate Fund', 'grant', 100000, 1000000, 'USD',
  ARRAY['Sub-Saharan Africa', 'Southeast Asia', 'Latin America & Caribbean'],
  ARRAY['Environmental Monitoring', 'Water Management', 'Infrastructure'],
  'Support for climate-adaptive smart city technologies that enhance urban resilience to climate change impacts.',
  ARRAY['Climate impact assessment', 'Technology specification', 'Community engagement plan', 'Monitoring & evaluation framework'],
  (now() + interval '6 months')::timestamptz,
  'https://greenclimate.fund/resilience',
  'active'),
  
('Digital Infrastructure Loan Program', 'African Development Bank', 'loan', 200000, 5000000, 'USD',
  ARRAY['Sub-Saharan Africa'],
  ARRAY['Traffic Management', 'Public Safety', 'Citizen Services'],
  'Low-interest loans for municipalities implementing digital infrastructure and smart city services.',
  ARRAY['Credit assessment', 'Collateral documentation', 'Implementation plan', 'Revenue projection'],
  (now() + interval '4 months')::timestamptz,
  'https://afdb.org/digital-infrastructure',
  'active'),
  
('Energy Efficiency Subsidy', 'Asian Infrastructure Investment Bank', 'subsidy', 30000, 300000, 'USD',
  ARRAY['South Asia', 'Southeast Asia'],
  ARRAY['Energy & Utilities', 'Environmental Monitoring'],
  'Subsidies for energy-efficient smart city solutions reducing carbon emissions and energy consumption.',
  ARRAY['Energy audit report', 'Solution specifications', 'Expected savings calculation'],
  (now() + interval '2 months')::timestamptz,
  'https://aiib.org/energy-subsidy',
  'active'),
  
('Urban Mobility Innovation Prize', 'Inter-American Development Bank', 'grant', 75000, 400000, 'USD',
  ARRAY['Latin America & Caribbean'],
  ARRAY['Traffic Management', 'Public Safety'],
  'Competitive grants for innovative urban mobility solutions addressing traffic congestion and public transport.',
  ARRAY['Innovation proposal', 'Pilot project plan', 'Scalability assessment', 'Public engagement strategy'],
  (now() + interval '5 months')::timestamptz,
  'https://iadb.org/mobility-prize',
  'active');
