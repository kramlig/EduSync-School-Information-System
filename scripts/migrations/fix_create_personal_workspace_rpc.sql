-- =====================================================
-- FIX: Create/update create_personal_workspace RPC
-- Run this in Supabase SQL Editor (production) to fix signup
-- Date: 2026-04-01
-- Issue: Function doesn't exist in production schema cache
-- =====================================================

-- Drop any existing versions to avoid overload ambiguity
DROP FUNCTION IF EXISTS create_personal_workspace(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_personal_workspace(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_personal_workspace(
  p_firebase_uid TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_school_name TEXT,
  p_school_id_number TEXT,
  p_division TEXT,
  p_region TEXT,
  p_district TEXT DEFAULT NULL,
  p_grade_level INT DEFAULT 6,
  p_school_type TEXT DEFAULT 'elementary',
  p_section_name TEXT DEFAULT 'My Class',
  p_school_year TEXT DEFAULT '2025-2026'
) RETURNS JSONB AS $$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
  v_teacher_id UUID;
  v_section_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Check if user already has a personal workspace
  IF EXISTS (SELECT 1 FROM schools WHERE owner_uid = p_firebase_uid AND type = 'personal') THEN
    RAISE EXCEPTION 'User already has a personal workspace';
  END IF;

  -- Derive school_type from grade level if not provided
  -- Grade 1-6 = elementary, 7-10 = high_school, 11-12 = senior_high

  -- 1. Create virtual school
  INSERT INTO schools (name, school_id_number, division, region, district, type, owner_uid, tier, current_school_year, school_type)
  VALUES (
    p_school_name,
    NULLIF(p_school_id_number, ''),
    p_division,
    p_region,
    p_district,
    'personal',
    p_firebase_uid,
    'free',
    p_school_year,
    CASE
      WHEN p_grade_level <= 6 THEN 'elementary'
      WHEN p_grade_level <= 10 THEN 'high_school'
      ELSE 'senior_high'
    END
  )
  RETURNING id INTO v_school_id;

  -- 2. Create user record (required FK for teachers)
  INSERT INTO users (school_id, firebase_uid, email, role, name)
  VALUES (v_school_id, p_firebase_uid, p_email, 'admin', p_full_name)
  RETURNING id INTO v_user_id;

  -- 3. Create teacher record
  INSERT INTO teachers (school_id, user_id, firebase_uid, email, name, role, workspace_type, tier)
  VALUES (v_school_id, v_user_id, p_firebase_uid, p_email, p_full_name, 'admin', 'personal', 'free')
  RETURNING id INTO v_teacher_id;

  -- 4. Create default section
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id)
  VALUES (v_school_id, p_section_name, p_grade_level, p_school_year, v_teacher_id)
  RETURNING id INTO v_section_id;

  -- 5. Create free subscription
  INSERT INTO subscriptions (user_id, tier, status, max_students, max_teaching_sections, max_advisory_sections, max_downloads_per_day)
  VALUES (p_firebase_uid, 'free', 'active', 50, 1, 1, 10)
  RETURNING id INTO v_subscription_id;

  -- 6. Try seeding default learning areas (non-fatal if function doesn't exist)
  BEGIN
    PERFORM seed_default_learning_areas(v_school_id,
      CASE
        WHEN p_grade_level <= 6 THEN 'elementary'
        WHEN p_grade_level <= 10 THEN 'high_school'
        ELSE 'senior_high'
      END
    );
  EXCEPTION WHEN undefined_function OR OTHERS THEN
    -- Learning areas can be seeded later by the frontend
    NULL;
  END;

  -- Return all created IDs
  RETURN jsonb_build_object(
    'school_id', v_school_id,
    'teacher_id', v_teacher_id,
    'section_id', v_section_id,
    'subscription_id', v_subscription_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
