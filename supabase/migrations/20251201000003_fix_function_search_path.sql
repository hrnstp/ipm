/*
  # Fix Function Search Path Security

  ## Problem
  Functions without a fixed search_path are vulnerable to schema-based attacks.
  An attacker could create malicious objects in another schema and trick the
  function into using them.

  ## Solution
  Set a fixed search_path for all affected functions to prevent search path
  manipulation attacks.

  ## Affected Functions
  - handle_new_user()
  - check_profile_update()
  - is_task_participant(uuid)
  - is_project_participant(uuid)
*/

-- Fix search_path for all functions that have mutable search_path
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.check_profile_update() SET search_path = public;
ALTER FUNCTION public.is_task_participant(uuid) SET search_path = public;
ALTER FUNCTION public.is_project_participant(uuid) SET search_path = public;

