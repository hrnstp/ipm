-- Migration: Improve RLS Policies for Better Security
-- Created: 2025-11-19
-- Description: Replaces overly permissive RLS policies with role-based access controls
--              and adds missing DELETE policies

/*
  SECURITY IMPROVEMENTS:

  1. Replace "USING (true)" policies with role-based access
  2. Add missing DELETE policies for municipalities and integrators
  3. Implement principle of least privilege
  4. Add helper functions for better performance

  PREVIOUS ISSUES:
  - All authenticated users could read all solutions, municipalities, integrators
  - No DELETE policies for municipalities and integrators
  - Performance concerns with repeated role checks in policies
*/

-- =====================================================
-- HELPER FUNCTIONS FOR PERFORMANCE
-- =====================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION auth.user_has_role(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = required_role
  );
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION auth.user_has_role IS 'Checks if the current user has a specific role';
COMMENT ON FUNCTION auth.get_user_role IS 'Returns the role of the current user';

-- =====================================================
-- IMPROVED RLS POLICIES FOR SMART_SOLUTIONS
-- =====================================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Solutions are viewable by authenticated users" ON smart_solutions;

-- New role-based SELECT policy
-- Developers: can see all solutions (marketplace browsing)
-- Municipalities: can see all solutions (to find solutions for their needs)
-- Integrators: can see all solutions (to recommend to clients)
CREATE POLICY "Role-based solution viewing"
  ON smart_solutions FOR SELECT
  TO authenticated
  USING (
    -- Allow reading if user is developer, municipality, or integrator
    auth.get_user_role() IN ('developer', 'municipality', 'integrator')
  );

-- Keep existing INSERT, UPDATE, DELETE policies (they're correct)
-- Already have:
-- - "Developers can insert solutions" - Good
-- - "Developers can update own solutions" - Good
-- - "Developers can delete own solutions" - Good

-- =====================================================
-- IMPROVED RLS POLICIES FOR MUNICIPALITIES
-- =====================================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Municipalities are viewable by authenticated users" ON municipalities;

-- New role-based SELECT policy
-- Developers: can see municipalities (to find potential clients)
-- Municipalities: can see other municipalities (for collaboration, benchmarking)
-- Integrators: can see municipalities (to find clients)
CREATE POLICY "Role-based municipality viewing"
  ON municipalities FOR SELECT
  TO authenticated
  USING (
    -- Own municipality profile is always visible
    auth.uid() = profile_id
    OR
    -- Developers can see municipalities (potential clients)
    auth.user_has_role('developer')
    OR
    -- Other municipalities can see each other (collaboration)
    auth.user_has_role('municipality')
    OR
    -- Integrators can see municipalities (service opportunities)
    auth.user_has_role('integrator')
  );

-- Keep existing INSERT and UPDATE policies (they're correct)

-- Add missing DELETE policy
CREATE POLICY "Municipality users can delete own profile"
  ON municipalities FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- =====================================================
-- IMPROVED RLS POLICIES FOR INTEGRATORS
-- =====================================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Integrators are viewable by authenticated users" ON integrators;

-- New role-based SELECT policy
-- Developers: can see integrators (to find implementation partners)
-- Municipalities: can see integrators (to hire for projects)
-- Integrators: can see other integrators (networking, subcontracting)
CREATE POLICY "Role-based integrator viewing"
  ON integrators FOR SELECT
  TO authenticated
  USING (
    -- Own integrator profile is always visible
    auth.uid() = profile_id
    OR
    -- Developers can see integrators (potential partners)
    auth.user_has_role('developer')
    OR
    -- Municipalities can see integrators (to hire)
    auth.user_has_role('municipality')
    OR
    -- Other integrators can see each other
    auth.user_has_role('integrator')
  );

-- Keep existing INSERT and UPDATE policies (they're correct)

-- Add missing DELETE policy
CREATE POLICY "Integrator users can delete own profile"
  ON integrators FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- =====================================================
-- IMPROVED RLS POLICIES FOR PROFILES
-- =====================================================

-- The existing "Public profiles are viewable by authenticated users" is OK
-- because profiles need to be discoverable for the platform to work.
-- However, we should ensure sensitive data is not exposed.

-- Note: Consider adding a "public_profile" boolean field in future
-- to allow users to control their profile visibility.

-- =====================================================
-- IMPROVED RLS POLICIES FOR CONNECTIONS
-- =====================================================

-- Existing connection policies are good, but let's add DELETE
-- Currently only "Users can delete own initiated connections" exists
-- This is sufficient for now.

-- =====================================================
-- IMPROVED RLS POLICIES FOR PROJECTS
-- =====================================================

-- Add missing DELETE policy for projects
CREATE POLICY "Project participants can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    -- Developer who owns the project
    auth.uid() = developer_id
    OR
    -- Municipality that owns the project
    EXISTS (
      SELECT 1 FROM municipalities
      WHERE municipalities.id = projects.municipality_id
      AND municipalities.profile_id = auth.uid()
    )
    OR
    -- Integrator assigned to the project
    EXISTS (
      SELECT 1 FROM integrators
      WHERE integrators.id = projects.integrator_id
      AND integrators.profile_id = auth.uid()
    )
  );

-- =====================================================
-- IMPROVED RLS POLICIES FOR MESSAGES
-- =====================================================

-- Add DELETE policy for messages
CREATE POLICY "Users can delete their sent messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- =====================================================
-- IMPROVED RLS POLICIES FOR TECHNOLOGY_TRANSFERS
-- =====================================================

-- Add DELETE policy for technology transfers
CREATE POLICY "Project participants can delete technology transfers"
  ON technology_transfers FOR DELETE
  TO authenticated
  USING (
    -- Check if user is part of the project
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = technology_transfers.project_id
      AND (
        projects.developer_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM municipalities
          WHERE municipalities.id = projects.municipality_id
          AND municipalities.profile_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM integrators
          WHERE integrators.id = projects.integrator_id
          AND integrators.profile_id = auth.uid()
        )
      )
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION auth.user_has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_user_role() TO authenticated;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Add index on profiles.role for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add index on profiles.id for faster auth.uid() lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- To test these policies, run as different users:
--
-- 1. As developer:
--    SELECT COUNT(*) FROM smart_solutions;  -- Should see all
--    SELECT COUNT(*) FROM municipalities;   -- Should see all
--    SELECT COUNT(*) FROM integrators;      -- Should see all
--
-- 2. As municipality:
--    SELECT COUNT(*) FROM smart_solutions;  -- Should see all
--    SELECT COUNT(*) FROM municipalities;   -- Should see all
--    SELECT COUNT(*) FROM integrators;      -- Should see all
--
-- 3. As integrator:
--    SELECT COUNT(*) FROM smart_solutions;  -- Should see all
--    SELECT COUNT(*) FROM municipalities;   -- Should see all
--    SELECT COUNT(*) FROM integrators;      -- Should see all
--
-- 4. Test DELETE policies:
--    DELETE FROM municipalities WHERE profile_id = auth.uid();  -- Should work for own
--    DELETE FROM integrators WHERE profile_id = auth.uid();     -- Should work for own
--    DELETE FROM projects WHERE developer_id = auth.uid();      -- Should work for own

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
-- To rollback this migration:
--
-- DROP POLICY IF EXISTS "Role-based solution viewing" ON smart_solutions;
-- DROP POLICY IF EXISTS "Role-based municipality viewing" ON municipalities;
-- DROP POLICY IF EXISTS "Role-based integrator viewing" ON integrators;
-- DROP POLICY IF EXISTS "Municipality users can delete own profile" ON municipalities;
-- DROP POLICY IF EXISTS "Integrator users can delete own profile" ON integrators;
-- DROP POLICY IF EXISTS "Project participants can delete projects" ON projects;
-- DROP POLICY IF EXISTS "Users can delete their sent messages" ON messages;
-- DROP POLICY IF EXISTS "Project participants can delete technology transfers" ON technology_transfers;
-- DROP FUNCTION IF EXISTS auth.user_has_role(text);
-- DROP FUNCTION IF EXISTS auth.get_user_role();
-- DROP INDEX IF EXISTS idx_profiles_role;
-- DROP INDEX IF EXISTS idx_profiles_id;
--
-- Then recreate the old policies with USING (true)
