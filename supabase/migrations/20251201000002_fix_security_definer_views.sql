/*
  # Fix Security Definer Views

  ## Problem
  4 views were created without explicit SECURITY INVOKER, causing them to run
  as SECURITY DEFINER. This bypasses RLS policies on underlying tables.

  ## Solution
  Set security_invoker = on for all affected views so that:
  - Views execute with the permissions of the querying user
  - RLS policies on underlying tables are properly enforced
  - Users only see data they have access to according to RLS

  ## Affected Views
  - rfp_workflow_view
  - project_context_view
  - solution_trends
  - category_performance
*/

-- Fix SECURITY DEFINER views to use SECURITY INVOKER
-- This ensures RLS policies on underlying tables are enforced

ALTER VIEW public.rfp_workflow_view SET (security_invoker = on);
ALTER VIEW public.project_context_view SET (security_invoker = on);
ALTER VIEW public.solution_trends SET (security_invoker = on);
ALTER VIEW public.category_performance SET (security_invoker = on);

