/*
  # Fix Project Participant ID Checks in RLS Policies
  
  ## Overview
  This migration fixes critical bugs in RLS policies where municipality_id and 
  integrator_id were incorrectly compared to auth.uid().
  
  ## The Problem
  
  The original policies had:
  ```sql
  projects.municipality_id = auth.uid()  -- WRONG!
  projects.integrator_id = auth.uid()    -- WRONG!
  ```
  
  This is incorrect because:
  - projects.municipality_id is a UUID referencing municipalities.id
  - projects.integrator_id is a UUID referencing integrators.id
  - auth.uid() returns a UUID referencing profiles.id
  
  These are DIFFERENT IDs and should never match (except by random chance).
  
  ## The Fix
  
  Replace direct comparisons with proper subqueries:
  ```sql
  EXISTS (SELECT 1 FROM municipalities WHERE id = projects.municipality_id AND profile_id = auth.uid())
  EXISTS (SELECT 1 FROM integrators WHERE id = projects.integrator_id AND profile_id = auth.uid())
  ```
  
  ## Affected Tables
  - project_tasks
  - project_milestones
  - project_documents
  - project_comments
  - project_activity_log
  - task_comments
  - compliance_assessments (already fixed in previous migration)
*/

-- ============================================================
-- Helper function to check if user is a project participant
-- This centralizes the logic and makes policies cleaner
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_project_participant(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = p_project_id
    AND (
      p.developer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM municipalities m 
        WHERE m.id = p.municipality_id 
        AND m.profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM integrators i 
        WHERE i.id = p.integrator_id 
        AND i.profile_id = auth.uid()
      )
    )
  );
$$;

-- ============================================================
-- PART 1: Fix project_tasks policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view tasks for their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can create tasks for their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks for their projects" ON project_tasks;

CREATE POLICY "Users can view tasks for their projects"
  ON project_tasks FOR SELECT
  TO authenticated
  USING (public.is_project_participant(project_id));

CREATE POLICY "Users can create tasks for their projects"
  ON project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_project_participant(project_id));

CREATE POLICY "Users can update tasks for their projects"
  ON project_tasks FOR UPDATE
  TO authenticated
  USING (public.is_project_participant(project_id))
  WITH CHECK (public.is_project_participant(project_id));

-- ============================================================
-- PART 2: Fix project_milestones policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can create milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can update milestones for their projects" ON project_milestones;

CREATE POLICY "Users can view milestones for their projects"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (public.is_project_participant(project_id));

CREATE POLICY "Users can create milestones for their projects"
  ON project_milestones FOR INSERT
  TO authenticated
  WITH CHECK (public.is_project_participant(project_id));

CREATE POLICY "Users can update milestones for their projects"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (public.is_project_participant(project_id))
  WITH CHECK (public.is_project_participant(project_id));

-- ============================================================
-- PART 3: Fix project_documents policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view documents for their projects or public documents" ON project_documents;
DROP POLICY IF EXISTS "Users can upload documents to their projects" ON project_documents;

CREATE POLICY "Users can view documents for their projects or public documents"
  ON project_documents FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR public.is_project_participant(project_id)
  );

CREATE POLICY "Users can upload documents to their projects"
  ON project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.is_project_participant(project_id)
  );

-- ============================================================
-- PART 4: Fix project_comments policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view comments for their projects" ON project_comments;
DROP POLICY IF EXISTS "Users can create comments for their projects" ON project_comments;

CREATE POLICY "Users can view comments for their projects"
  ON project_comments FOR SELECT
  TO authenticated
  USING (public.is_project_participant(project_id));

CREATE POLICY "Users can create comments for their projects"
  ON project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_project_participant(project_id)
  );

-- ============================================================
-- PART 5: Fix project_activity_log policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view activity log for their projects" ON project_activity_log;

CREATE POLICY "Users can view activity log for their projects"
  ON project_activity_log FOR SELECT
  TO authenticated
  USING (public.is_project_participant(project_id));

-- ============================================================
-- PART 6: Fix task_comments policies
-- ============================================================

-- Helper function for task participant check
CREATE OR REPLACE FUNCTION public.is_task_participant(p_task_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_tasks pt
    JOIN projects p ON p.id = pt.project_id
    WHERE pt.id = p_task_id
    AND (
      p.developer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM municipalities m 
        WHERE m.id = p.municipality_id 
        AND m.profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM integrators i 
        WHERE i.id = p.integrator_id 
        AND i.profile_id = auth.uid()
      )
    )
  );
$$;

DROP POLICY IF EXISTS "Users can view comments for tasks they can access" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON task_comments;

CREATE POLICY "Users can view comments for tasks they can access"
  ON task_comments FOR SELECT
  TO authenticated
  USING (public.is_task_participant(task_id));

CREATE POLICY "Users can create comments on accessible tasks"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_task_participant(task_id)
  );

-- ============================================================
-- PART 7: Additional security - ensure DELETE policies are correct
-- ============================================================

-- project_tasks DELETE already checks created_by = auth.uid() - OK
-- project_documents DELETE already checks uploaded_by = auth.uid() - OK
-- project_comments DELETE already checks user_id = auth.uid() - OK
-- task_comments DELETE already checks user_id = auth.uid() - OK

-- ============================================================
-- PART 8: Grant execute on helper functions
-- ============================================================

GRANT EXECUTE ON FUNCTION public.is_project_participant TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_task_participant TO authenticated;

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON FUNCTION public.is_project_participant IS 
  'Checks if the current user is a participant in the given project (as developer, municipality, or integrator)';

COMMENT ON FUNCTION public.is_task_participant IS 
  'Checks if the current user has access to the given task through project participation';

