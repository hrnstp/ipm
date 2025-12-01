/*
  # Optimize RLS Performance
  
  ## Overview
  This migration optimizes all RLS policies by replacing auth.uid() calls with 
  (select auth.uid()) to enable caching and prevent re-evaluation for each row.
  
  Also combines duplicate permissive policies for better performance.
  
  ## Changes
  - Replace auth.uid() with (select auth.uid()) in all RLS policies
  - Combine duplicate permissive policies for municipality_benchmarks and solution_adoption_metrics
  
  ## Performance Impact
  - Significant improvement for tables with many rows
  - auth.uid() is now evaluated once per query instead of once per row
*/

-- ============================================================
-- PART 1: profiles table
-- ============================================================

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================
-- PART 2: smart_solutions table
-- ============================================================

DROP POLICY IF EXISTS "Solutions are viewable by authenticated users" ON smart_solutions;
DROP POLICY IF EXISTS "Developers can insert solutions" ON smart_solutions;
DROP POLICY IF EXISTS "Developers can update own solutions" ON smart_solutions;
DROP POLICY IF EXISTS "Developers can delete own solutions" ON smart_solutions;

CREATE POLICY "Solutions are viewable by authenticated users"
  ON smart_solutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Developers can insert solutions"
  ON smart_solutions FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = developer_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'developer')
  );

CREATE POLICY "Developers can update own solutions"
  ON smart_solutions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = developer_id)
  WITH CHECK ((select auth.uid()) = developer_id);

CREATE POLICY "Developers can delete own solutions"
  ON smart_solutions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = developer_id);

-- ============================================================
-- PART 3: municipalities table
-- ============================================================

DROP POLICY IF EXISTS "Municipalities are viewable by authenticated users" ON municipalities;
DROP POLICY IF EXISTS "Municipality users can insert their profile" ON municipalities;
DROP POLICY IF EXISTS "Municipality users can update own profile" ON municipalities;

CREATE POLICY "Municipalities are viewable by authenticated users"
  ON municipalities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Municipality users can insert their profile"
  ON municipalities FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Municipality users can update own profile"
  ON municipalities FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

-- ============================================================
-- PART 4: integrators table
-- ============================================================

DROP POLICY IF EXISTS "Integrators are viewable by authenticated users" ON integrators;
DROP POLICY IF EXISTS "Integrator users can insert their profile" ON integrators;
DROP POLICY IF EXISTS "Integrator users can update own profile" ON integrators;

CREATE POLICY "Integrators are viewable by authenticated users"
  ON integrators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Integrator users can insert their profile"
  ON integrators FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Integrator users can update own profile"
  ON integrators FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

-- ============================================================
-- PART 5: connections table
-- ============================================================

DROP POLICY IF EXISTS "Users can view their connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Recipients can update connection status" ON connections;
DROP POLICY IF EXISTS "Users can delete own initiated connections" ON connections;

CREATE POLICY "Users can view their connections"
  ON connections FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = initiator_id OR (select auth.uid()) = recipient_id);

CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = initiator_id);

CREATE POLICY "Recipients can update connection status"
  ON connections FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = recipient_id)
  WITH CHECK ((select auth.uid()) = recipient_id);

CREATE POLICY "Users can delete own initiated connections"
  ON connections FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = initiator_id);

-- ============================================================
-- PART 6: projects table
-- ============================================================

DROP POLICY IF EXISTS "Users can view projects they participate in" ON projects;
DROP POLICY IF EXISTS "Developers and municipalities can create projects" ON projects;
DROP POLICY IF EXISTS "Project participants can update projects" ON projects;

CREATE POLICY "Users can view projects they participate in"
  ON projects FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM integrators WHERE id = integrator_id AND profile_id = (select auth.uid()))
  );

CREATE POLICY "Developers and municipalities can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = (select auth.uid()))
  );

CREATE POLICY "Project participants can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM integrators WHERE id = integrator_id AND profile_id = (select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = developer_id OR
    EXISTS (SELECT 1 FROM municipalities WHERE id = municipality_id AND profile_id = (select auth.uid())) OR
    EXISTS (SELECT 1 FROM integrators WHERE id = integrator_id AND profile_id = (select auth.uid()))
  );

-- ============================================================
-- PART 7: technology_transfers table
-- ============================================================

DROP POLICY IF EXISTS "Project participants can view technology transfers" ON technology_transfers;
DROP POLICY IF EXISTS "Project participants can create technology transfers" ON technology_transfers;
DROP POLICY IF EXISTS "Project participants can update technology transfers" ON technology_transfers;

CREATE POLICY "Project participants can view technology transfers"
  ON technology_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        (select auth.uid()) = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = (select auth.uid())) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = (select auth.uid()))
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
        (select auth.uid()) = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = (select auth.uid())) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = (select auth.uid()))
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
        (select auth.uid()) = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = (select auth.uid())) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        (select auth.uid()) = p.developer_id OR
        EXISTS (SELECT 1 FROM municipalities WHERE id = p.municipality_id AND profile_id = (select auth.uid())) OR
        EXISTS (SELECT 1 FROM integrators WHERE id = p.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

-- ============================================================
-- PART 8: messages table
-- ============================================================

DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Recipients can update message read status" ON messages;

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = sender_id OR (select auth.uid()) = recipient_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "Recipients can update message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = recipient_id)
  WITH CHECK ((select auth.uid()) = recipient_id);

-- ============================================================
-- PART 9: budget_estimates table
-- ============================================================

DROP POLICY IF EXISTS "Users can view budget estimates for their projects" ON budget_estimates;
DROP POLICY IF EXISTS "Project participants can create budget estimates" ON budget_estimates;
DROP POLICY IF EXISTS "Creator can update their budget estimates" ON budget_estimates;
DROP POLICY IF EXISTS "Creator can delete their budget estimates" ON budget_estimates;

CREATE POLICY "Users can view budget estimates for their projects"
  ON budget_estimates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = budget_estimates.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
        )
        OR projects.integrator_id IN (
          SELECT id FROM integrators WHERE profile_id = (select auth.uid())
        )
      )
    )
    OR created_by = (select auth.uid())
  );

CREATE POLICY "Project participants can create budget estimates"
  ON budget_estimates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Creator can update their budget estimates"
  ON budget_estimates FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Creator can delete their budget estimates"
  ON budget_estimates FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- ============================================================
-- PART 10: payment_milestones table
-- ============================================================

DROP POLICY IF EXISTS "Project participants can view payment milestones" ON payment_milestones;
DROP POLICY IF EXISTS "Project participants can create payment milestones" ON payment_milestones;
DROP POLICY IF EXISTS "Project participants can update payment milestones" ON payment_milestones;
DROP POLICY IF EXISTS "Project participants can delete payment milestones" ON payment_milestones;

CREATE POLICY "Project participants can view payment milestones"
  ON payment_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_milestones.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
        )
        OR projects.integrator_id IN (
          SELECT id FROM integrators WHERE profile_id = (select auth.uid())
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
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
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
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = payment_milestones.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
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
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
        )
      )
    )
  );

-- ============================================================
-- PART 11: financial_transactions table
-- ============================================================

DROP POLICY IF EXISTS "Project participants can view financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Project participants can record financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Recorder can update their financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Recorder can delete their financial transactions" ON financial_transactions;

CREATE POLICY "Project participants can view financial transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = financial_transactions.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
        )
        OR projects.integrator_id IN (
          SELECT id FROM integrators WHERE profile_id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Project participants can record financial transactions"
  ON financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = financial_transactions.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR projects.municipality_id IN (
          SELECT id FROM municipalities WHERE profile_id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Recorder can update their financial transactions"
  ON financial_transactions FOR UPDATE
  TO authenticated
  USING (recorded_by = (select auth.uid()))
  WITH CHECK (recorded_by = (select auth.uid()));

CREATE POLICY "Recorder can delete their financial transactions"
  ON financial_transactions FOR DELETE
  TO authenticated
  USING (recorded_by = (select auth.uid()));

-- ============================================================
-- PART 12: rfp_requests table
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view published RFPs" ON rfp_requests;
DROP POLICY IF EXISTS "Municipality users can create RFPs" ON rfp_requests;
DROP POLICY IF EXISTS "Creator can update their RFPs" ON rfp_requests;
DROP POLICY IF EXISTS "Creator can delete their RFPs" ON rfp_requests;

CREATE POLICY "Anyone can view published RFPs"
  ON rfp_requests FOR SELECT
  TO authenticated
  USING (status = 'published' OR created_by = (select auth.uid()));

CREATE POLICY "Municipality users can create RFPs"
  ON rfp_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'municipality'
    )
  );

CREATE POLICY "Creator can update their RFPs"
  ON rfp_requests FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Creator can delete their RFPs"
  ON rfp_requests FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- ============================================================
-- PART 13: bids table
-- ============================================================

DROP POLICY IF EXISTS "RFP creator and bidder can view bids" ON bids;
DROP POLICY IF EXISTS "Developers can create bids" ON bids;
DROP POLICY IF EXISTS "Bidder can update their bids" ON bids;
DROP POLICY IF EXISTS "Bidder can delete their bids" ON bids;

CREATE POLICY "RFP creator and bidder can view bids"
  ON bids FOR SELECT
  TO authenticated
  USING (
    developer_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM rfp_requests
      WHERE rfp_requests.id = bids.rfp_id
      AND rfp_requests.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Developers can create bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (
    developer_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'developer'
    )
  );

CREATE POLICY "Bidder can update their bids"
  ON bids FOR UPDATE
  TO authenticated
  USING (developer_id = (select auth.uid()))
  WITH CHECK (developer_id = (select auth.uid()));

CREATE POLICY "Bidder can delete their bids"
  ON bids FOR DELETE
  TO authenticated
  USING (developer_id = (select auth.uid()));

-- ============================================================
-- PART 14: vendor_ratings table
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view vendor ratings" ON vendor_ratings;
DROP POLICY IF EXISTS "Municipality users can create ratings" ON vendor_ratings;
DROP POLICY IF EXISTS "Rater can update their ratings" ON vendor_ratings;
DROP POLICY IF EXISTS "Rater can delete their ratings" ON vendor_ratings;

CREATE POLICY "Anyone can view vendor ratings"
  ON vendor_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Municipality users can create ratings"
  ON vendor_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    rated_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'municipality'
    )
  );

CREATE POLICY "Rater can update their ratings"
  ON vendor_ratings FOR UPDATE
  TO authenticated
  USING (rated_by = (select auth.uid()))
  WITH CHECK (rated_by = (select auth.uid()));

CREATE POLICY "Rater can delete their ratings"
  ON vendor_ratings FOR DELETE
  TO authenticated
  USING (rated_by = (select auth.uid()));

-- ============================================================
-- PART 15: contract_templates table
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view public contract templates" ON contract_templates;
DROP POLICY IF EXISTS "Authenticated users can create contract templates" ON contract_templates;
DROP POLICY IF EXISTS "Creator can update their contract templates" ON contract_templates;
DROP POLICY IF EXISTS "Creator can delete their contract templates" ON contract_templates;

CREATE POLICY "Anyone can view public contract templates"
  ON contract_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = (select auth.uid()));

CREATE POLICY "Authenticated users can create contract templates"
  ON contract_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Creator can update their contract templates"
  ON contract_templates FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Creator can delete their contract templates"
  ON contract_templates FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- ============================================================
-- PART 16: service_marketplace table
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active services" ON service_marketplace;
DROP POLICY IF EXISTS "Users can create service listings" ON service_marketplace;
DROP POLICY IF EXISTS "Provider can update their services" ON service_marketplace;
DROP POLICY IF EXISTS "Provider can delete their services" ON service_marketplace;

CREATE POLICY "Anyone can view active services"
  ON service_marketplace FOR SELECT
  TO authenticated
  USING (status = 'active' OR provider_id = (select auth.uid()));

CREATE POLICY "Users can create service listings"
  ON service_marketplace FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = (select auth.uid()));

CREATE POLICY "Provider can update their services"
  ON service_marketplace FOR UPDATE
  TO authenticated
  USING (provider_id = (select auth.uid()))
  WITH CHECK (provider_id = (select auth.uid()));

CREATE POLICY "Provider can delete their services"
  ON service_marketplace FOR DELETE
  TO authenticated
  USING (provider_id = (select auth.uid()));

-- ============================================================
-- PART 17: platform_analytics table
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view aggregated analytics" ON platform_analytics;
DROP POLICY IF EXISTS "Users can record analytics" ON platform_analytics;

CREATE POLICY "Anyone can view aggregated analytics"
  ON platform_analytics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can record analytics"
  ON platform_analytics FOR INSERT
  TO authenticated
  WITH CHECK (recorded_by = (select auth.uid()));

-- ============================================================
-- PART 18: solution_adoption_metrics table (combine policies)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view solution adoption metrics" ON solution_adoption_metrics;
DROP POLICY IF EXISTS "System can manage adoption metrics" ON solution_adoption_metrics;
DROP POLICY IF EXISTS "View solution adoption metrics" ON solution_adoption_metrics;
DROP POLICY IF EXISTS "System manages adoption metrics" ON solution_adoption_metrics;

-- Single SELECT policy for better performance
CREATE POLICY "View solution adoption metrics"
  ON solution_adoption_metrics FOR SELECT
  TO authenticated
  USING (true);

-- System management via functions only (no direct write access)
-- Using separate policies for INSERT, UPDATE, DELETE to avoid conflict with SELECT policy
CREATE POLICY "No direct insert to adoption metrics"
  ON solution_adoption_metrics FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No direct update to adoption metrics"
  ON solution_adoption_metrics FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No direct delete from adoption metrics"
  ON solution_adoption_metrics FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================
-- PART 19: municipality_benchmarks table (combine policies)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view municipality benchmarks" ON municipality_benchmarks;
DROP POLICY IF EXISTS "Municipality can manage their benchmarks" ON municipality_benchmarks;

-- Combined single SELECT policy for better performance
CREATE POLICY "View municipality benchmarks"
  ON municipality_benchmarks FOR SELECT
  TO authenticated
  USING (true);

-- Separate write policies for municipality owners
CREATE POLICY "Municipality can insert their benchmarks"
  ON municipality_benchmarks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM municipalities
      WHERE municipalities.id = municipality_benchmarks.municipality_id
      AND municipalities.profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Municipality can update their benchmarks"
  ON municipality_benchmarks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM municipalities
      WHERE municipalities.id = municipality_benchmarks.municipality_id
      AND municipalities.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM municipalities
      WHERE municipalities.id = municipality_benchmarks.municipality_id
      AND municipalities.profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Municipality can delete their benchmarks"
  ON municipality_benchmarks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM municipalities
      WHERE municipalities.id = municipality_benchmarks.municipality_id
      AND municipalities.profile_id = (select auth.uid())
    )
  );

-- ============================================================
-- PART 20: project_tasks table
-- ============================================================

DROP POLICY IF EXISTS "Users can view tasks for their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can create tasks for their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks for their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON project_tasks;

CREATE POLICY "Users can view tasks for their projects"
  ON project_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can create tasks for their projects"
  ON project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can update tasks for their projects"
  ON project_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can delete their own tasks"
  ON project_tasks FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- ============================================================
-- PART 21: project_milestones table
-- ============================================================

DROP POLICY IF EXISTS "Users can view milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can create milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can update milestones for their projects" ON project_milestones;

CREATE POLICY "Users can view milestones for their projects"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can create milestones for their projects"
  ON project_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can update milestones for their projects"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

-- ============================================================
-- PART 22: project_documents table
-- ============================================================

DROP POLICY IF EXISTS "Users can view documents for their projects or public documents" ON project_documents;
DROP POLICY IF EXISTS "Users can upload documents to their projects" ON project_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON project_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON project_documents;

CREATE POLICY "Users can view documents for their projects or public documents"
  ON project_documents FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can upload documents to their projects"
  ON project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can update their own documents"
  ON project_documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = (select auth.uid()))
  WITH CHECK (uploaded_by = (select auth.uid()));

CREATE POLICY "Users can delete their own documents"
  ON project_documents FOR DELETE
  TO authenticated
  USING (uploaded_by = (select auth.uid()));

-- ============================================================
-- PART 23: project_comments table
-- ============================================================

DROP POLICY IF EXISTS "Users can view comments for their projects" ON project_comments;
DROP POLICY IF EXISTS "Users can create comments for their projects" ON project_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON project_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON project_comments;

CREATE POLICY "Users can view comments for their projects"
  ON project_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can create comments for their projects"
  ON project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON project_comments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own comments"
  ON project_comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- PART 24: project_activity_log table
-- ============================================================

DROP POLICY IF EXISTS "Users can view activity log for their projects" ON project_activity_log;
DROP POLICY IF EXISTS "System can insert activity log entries" ON project_activity_log;

CREATE POLICY "Users can view activity log for their projects"
  ON project_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_activity_log.project_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "System can insert activity log entries"
  ON project_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- PART 25: workflow_templates table
-- ============================================================

DROP POLICY IF EXISTS "Users can view public workflow templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can create workflow templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can update their own workflow templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can delete their own workflow templates" ON workflow_templates;

CREATE POLICY "Users can view public workflow templates"
  ON workflow_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = (select auth.uid()));

CREATE POLICY "Users can create workflow templates"
  ON workflow_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update their own workflow templates"
  ON workflow_templates FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can delete their own workflow templates"
  ON workflow_templates FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- ============================================================
-- PART 26: task_comments table
-- ============================================================

DROP POLICY IF EXISTS "Users can view comments for tasks they can access" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own task comments" ON task_comments;

CREATE POLICY "Users can view comments for tasks they can access"
  ON task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN projects ON projects.id = project_tasks.project_id
      WHERE project_tasks.id = task_comments.task_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can create comments on accessible tasks"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN projects ON projects.id = project_tasks.project_id
      WHERE project_tasks.id = task_comments.task_id
      AND (
        projects.developer_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Users can update their own task comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own task comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- PART 27: security_audit_logs table
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own audit logs" ON security_audit_logs;

CREATE POLICY "Users can view their own audit logs"
  ON security_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Note: INSERT policy uses SECURITY DEFINER function, no direct auth.uid() needed

-- ============================================================
-- PART 28: compliance_assessments table
-- ============================================================

DROP POLICY IF EXISTS "Users can view assessments for their projects" ON compliance_assessments;
DROP POLICY IF EXISTS "Users can create compliance assessments" ON compliance_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON compliance_assessments;

CREATE POLICY "Users can view assessments for their projects"
  ON compliance_assessments FOR SELECT
  TO authenticated
  USING (
    assessed_by = (select auth.uid())
    OR project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = compliance_assessments.project_id
      AND (
        p.developer_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM municipalities m 
          WHERE m.id = p.municipality_id 
          AND m.profile_id = (select auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM integrators i 
          WHERE i.id = p.integrator_id 
          AND i.profile_id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can create compliance assessments"
  ON compliance_assessments FOR INSERT
  TO authenticated
  WITH CHECK (assessed_by = (select auth.uid()));

CREATE POLICY "Users can update their own assessments"
  ON compliance_assessments FOR UPDATE
  TO authenticated
  USING (assessed_by = (select auth.uid()))
  WITH CHECK (assessed_by = (select auth.uid()));

-- ============================================================
-- PART 29: data_privacy_requests table
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own privacy requests" ON data_privacy_requests;
DROP POLICY IF EXISTS "Users can create their own privacy requests" ON data_privacy_requests;
DROP POLICY IF EXISTS "Designated handlers can update privacy requests" ON data_privacy_requests;

CREATE POLICY "Users can view their own privacy requests"
  ON data_privacy_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR handled_by = (select auth.uid()));

CREATE POLICY "Users can create their own privacy requests"
  ON data_privacy_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND requester_email = (SELECT email FROM profiles WHERE id = (select auth.uid()))
  );

CREATE POLICY "Designated handlers can update privacy requests"
  ON data_privacy_requests FOR UPDATE
  TO authenticated
  USING (handled_by = (select auth.uid()))
  WITH CHECK (handled_by = (select auth.uid()));

-- ============================================================
-- PART 30: security_incidents table
-- ============================================================

DROP POLICY IF EXISTS "Users can view security incidents they reported or are assigned" ON security_incidents;
DROP POLICY IF EXISTS "Users can view security incidents they reported or are assigned to" ON security_incidents;
DROP POLICY IF EXISTS "Users can create security incidents" ON security_incidents;
DROP POLICY IF EXISTS "Assigned users can update incidents" ON security_incidents;

CREATE POLICY "Users can view security incidents they reported or are assigned"
  ON security_incidents FOR SELECT
  TO authenticated
  USING (reported_by = (select auth.uid()) OR assigned_to = (select auth.uid()));

CREATE POLICY "Users can create security incidents"
  ON security_incidents FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = (select auth.uid()));

CREATE POLICY "Assigned users can update incidents"
  ON security_incidents FOR UPDATE
  TO authenticated
  USING (assigned_to = (select auth.uid()))
  WITH CHECK (assigned_to = (select auth.uid()));

-- ============================================================
-- PART 31: access_control_policies table
-- ============================================================

DROP POLICY IF EXISTS "Everyone can view active access control policies" ON access_control_policies;
DROP POLICY IF EXISTS "Policy creators can update their policies" ON access_control_policies;

CREATE POLICY "Everyone can view active access control policies"
  ON access_control_policies FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Policy creators can update their policies"
  ON access_control_policies FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- ============================================================
-- PART 32: data_retention_policies table
-- ============================================================

DROP POLICY IF EXISTS "Everyone can view active retention policies" ON data_retention_policies;
DROP POLICY IF EXISTS "Policy creators can update their policies" ON data_retention_policies;

CREATE POLICY "Everyone can view active retention policies"
  ON data_retention_policies FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Policy creators can update their policies"
  ON data_retention_policies FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- ============================================================
-- PART 33: Add missing foreign key indexes
-- ============================================================

-- These indexes improve performance for JOIN operations and 
-- CASCADE DELETE/UPDATE operations on foreign key relationships

-- access_control_policies.created_by
CREATE INDEX IF NOT EXISTS idx_access_control_policies_created_by 
  ON access_control_policies(created_by);

-- bids.solution_id
CREATE INDEX IF NOT EXISTS idx_bids_solution_id 
  ON bids(solution_id);

-- compliance_assessments.assessed_by
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_assessed_by 
  ON compliance_assessments(assessed_by);

-- contract_templates.created_by
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_by 
  ON contract_templates(created_by);

-- data_privacy_requests.handled_by
CREATE INDEX IF NOT EXISTS idx_data_privacy_requests_handled_by 
  ON data_privacy_requests(handled_by);

-- data_retention_policies.created_by
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_created_by 
  ON data_retention_policies(created_by);

-- financial_transactions.recorded_by
CREATE INDEX IF NOT EXISTS idx_financial_transactions_recorded_by 
  ON financial_transactions(recorded_by);

-- messages.project_id
CREATE INDEX IF NOT EXISTS idx_messages_project_id 
  ON messages(project_id);

-- platform_analytics.recorded_by
CREATE INDEX IF NOT EXISTS idx_platform_analytics_recorded_by 
  ON platform_analytics(recorded_by);

-- project_activity_log.user_id
CREATE INDEX IF NOT EXISTS idx_project_activity_log_user_id 
  ON project_activity_log(user_id);

-- project_comments.user_id
CREATE INDEX IF NOT EXISTS idx_project_comments_user_id 
  ON project_comments(user_id);

-- project_documents.uploaded_by
CREATE INDEX IF NOT EXISTS idx_project_documents_uploaded_by 
  ON project_documents(uploaded_by);

-- project_tasks.created_by
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_by 
  ON project_tasks(created_by);

-- projects.integrator_id
CREATE INDEX IF NOT EXISTS idx_projects_integrator_id 
  ON projects(integrator_id);

-- projects.solution_id
CREATE INDEX IF NOT EXISTS idx_projects_solution_id 
  ON projects(solution_id);

-- rfp_requests.created_by
CREATE INDEX IF NOT EXISTS idx_rfp_requests_created_by 
  ON rfp_requests(created_by);

-- security_incidents.reported_by
CREATE INDEX IF NOT EXISTS idx_security_incidents_reported_by 
  ON security_incidents(reported_by);

-- task_comments.user_id
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id 
  ON task_comments(user_id);

-- technology_transfers.project_id
CREATE INDEX IF NOT EXISTS idx_technology_transfers_project_id 
  ON technology_transfers(project_id);

-- vendor_ratings.rated_by
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_rated_by 
  ON vendor_ratings(rated_by);

-- workflow_templates.created_by
CREATE INDEX IF NOT EXISTS idx_workflow_templates_created_by 
  ON workflow_templates(created_by);

-- ============================================================
-- Done
-- ============================================================

COMMENT ON SCHEMA public IS 'RLS policies optimized for performance with (select auth.uid()) pattern';

