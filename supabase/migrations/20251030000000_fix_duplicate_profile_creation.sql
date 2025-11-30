-- Fix duplicate profile creation issue
-- This migration updates the create_user_profile function to handle cases
-- where a profile already exists (prevents duplicate key violations)

-- Function to create profile with role-specific data (updated to handle duplicates)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_role text,
  p_organization text,
  p_country text,
  p_region text,
  p_bio text DEFAULT '',
  p_avatar_url text DEFAULT NULL,
  p_municipality_data jsonb DEFAULT NULL,
  p_integrator_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  IF v_profile_exists THEN
    -- Profile already exists, return existing ID
    SELECT id INTO v_profile_id FROM profiles WHERE id = p_user_id;
    RETURN v_profile_id;
  END IF;

  -- Insert profile with ON CONFLICT handling (extra safety)
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization,
    country,
    region,
    bio,
    avatar_url
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_role,
    p_organization,
    p_country,
    p_region,
    p_bio,
    p_avatar_url
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    organization = EXCLUDED.organization,
    country = EXCLUDED.country,
    region = EXCLUDED.region,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url
  RETURNING id INTO v_profile_id;

  -- Create role-specific records (only if they don't exist)
  IF p_role = 'municipality' THEN
    INSERT INTO municipalities (
      profile_id,
      city_name,
      population,
      budget_range,
      language,
      priorities,
      challenges,
      existing_infrastructure,
      preferred_solutions,
      contact_info
    ) VALUES (
      v_profile_id,
      COALESCE(p_municipality_data->>'city_name', p_organization),
      CASE WHEN p_municipality_data->>'population' IS NOT NULL THEN (p_municipality_data->>'population')::integer ELSE NULL END,
      p_municipality_data->>'budget_range',
      COALESCE(p_municipality_data->>'language', 'en'),
      CASE 
        WHEN p_municipality_data->'priorities' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_municipality_data->'priorities'))
        ELSE ARRAY[]::text[]
      END,
      CASE 
        WHEN p_municipality_data->'challenges' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_municipality_data->'challenges'))
        ELSE ARRAY[]::text[]
      END,
      COALESCE(p_municipality_data->'existing_infrastructure', '{}'::jsonb),
      CASE 
        WHEN p_municipality_data->'preferred_solutions' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_municipality_data->'preferred_solutions'))
        ELSE ARRAY[]::text[]
      END,
      COALESCE(p_municipality_data->'contact_info', '{}'::jsonb)
    )
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF p_role = 'integrator' THEN
    INSERT INTO integrators (
      profile_id,
      company_name,
      expertise_areas,
      service_regions,
      certifications,
      past_projects,
      languages,
      capacity
    ) VALUES (
      v_profile_id,
      COALESCE(p_integrator_data->>'company_name', p_organization),
      CASE 
        WHEN p_integrator_data->'expertise_areas' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_integrator_data->'expertise_areas'))
        ELSE ARRAY[]::text[]
      END,
      CASE 
        WHEN p_integrator_data->'service_regions' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_integrator_data->'service_regions'))
        ELSE ARRAY[]::text[]
      END,
      CASE 
        WHEN p_integrator_data->'certifications' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_integrator_data->'certifications'))
        ELSE ARRAY[]::text[]
      END,
      COALESCE(p_integrator_data->'past_projects', '[]'::jsonb),
      CASE 
        WHEN p_integrator_data->'languages' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_integrator_data->'languages'))
        ELSE ARRAY[]::text[]
      END,
      p_integrator_data->>'capacity'
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN v_profile_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

