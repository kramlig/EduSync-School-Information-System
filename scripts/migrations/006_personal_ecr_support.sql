-- Migration: Personal Workspace ECR Support
-- Date: March 26, 2026
-- Purpose: Enable self-assignment of teaching_assignments for personal workspace
--          so ECR (Electronic Class Record) can be used in personal workspace.
--
-- Changes:
--   1. Update create_personal_workspace RPC to also create default teaching_assignments
--   2. Add helper RPC for personal workspace self-assignment management
--   3. Upgrade subscription tiers to distinguish ECR access

-- =====================================================
-- 1. RPC: Auto-create teaching assignments for personal workspace sections
-- =====================================================
-- When a personal workspace owner adds a section + subject, 
-- auto-create a teaching_assignment row. This keeps the data model
-- identical to institutional workspaces.

CREATE OR REPLACE FUNCTION create_personal_teaching_assignment(
  p_school_id UUID,
  p_teacher_id UUID,
  p_section_id UUID,
  p_learning_area_id UUID,
  p_grade_level INT DEFAULT 6,
  p_is_advisory BOOLEAN DEFAULT false,
  p_school_year TEXT DEFAULT '2025-2026'
) RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
  v_subject_name TEXT;
  v_section_name TEXT;
  v_tier TEXT;
  v_max_sections INT;
  v_current_count INT;
BEGIN
  -- Get subject name for backward-compat 'subject' column
  SELECT name INTO v_subject_name FROM learning_areas WHERE id = p_learning_area_id;
  SELECT name INTO v_section_name FROM sections WHERE id = p_section_id;

  -- Check tier limits (teaching sections)
  SELECT s.tier INTO v_tier FROM schools s WHERE s.id = p_school_id;
  SELECT COALESCE(sub.max_teaching_sections, 1) INTO v_max_sections
    FROM subscriptions sub
    JOIN schools sch ON sub.user_id = sch.owner_uid
    WHERE sch.id = p_school_id AND sub.status = 'active'
    LIMIT 1;

  -- Count existing distinct section assignments
  SELECT COUNT(DISTINCT section_id) INTO v_current_count
    FROM teaching_assignments
    WHERE school_id = p_school_id AND is_active = true AND deleted_at IS NULL;

  -- If free tier, enforce section limit (skip if just adding a subject to existing section)
  IF v_tier = 'free' THEN
    IF NOT EXISTS (
      SELECT 1 FROM teaching_assignments 
      WHERE school_id = p_school_id AND section_id = p_section_id 
        AND is_active = true AND deleted_at IS NULL
    ) AND v_current_count >= v_max_sections THEN
      RAISE EXCEPTION 'Section limit reached for free tier. Upgrade to Pro for unlimited sections.';
    END IF;
  END IF;

  -- Upsert: avoid duplicate assignment for same teacher+section+subject+year
  INSERT INTO teaching_assignments (
    school_id, teacher_id, section_id, learning_area_id, 
    subject, section_name, grade_level, is_advisory, 
    is_active, school_year
  )
  VALUES (
    p_school_id, p_teacher_id, p_section_id, p_learning_area_id,
    COALESCE(v_subject_name, 'Unknown'), v_section_name, p_grade_level, p_is_advisory,
    true, p_school_year
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_assignment_id;

  -- If no insert happened (duplicate), fetch the existing one
  IF v_assignment_id IS NULL THEN
    SELECT id INTO v_assignment_id FROM teaching_assignments
    WHERE school_id = p_school_id 
      AND teacher_id = p_teacher_id 
      AND section_id = p_section_id 
      AND learning_area_id = p_learning_area_id
      AND school_year = p_school_year
      AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 2. RPC: Bulk self-assign all learning areas to a section
-- =====================================================
-- For personal workspace: when teacher creates a section,
-- auto-assign all active learning areas for that grade level.

CREATE OR REPLACE FUNCTION auto_assign_personal_section(
  p_school_id UUID,
  p_teacher_id UUID,
  p_section_id UUID,
  p_grade_level INT DEFAULT 6,
  p_school_year TEXT DEFAULT '2025-2026'
) RETURNS INT AS $$
DECLARE
  v_area RECORD;
  v_count INT := 0;
BEGIN
  FOR v_area IN
    SELECT id, name FROM learning_areas
    WHERE school_id = p_school_id AND is_active = true
      AND (grade_levels @> ARRAY[p_grade_level] OR grade_levels IS NULL OR array_length(grade_levels, 1) IS NULL)
  LOOP
    INSERT INTO teaching_assignments (
      school_id, teacher_id, section_id, learning_area_id,
      subject, grade_level, is_advisory, is_active, school_year
    )
    VALUES (
      p_school_id, p_teacher_id, p_section_id, v_area.id,
      v_area.name, p_grade_level, false, true, p_school_year
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  -- Also set the advisory assignment
  INSERT INTO teaching_assignments (
    school_id, teacher_id, section_id, learning_area_id,
    subject, grade_level, is_advisory, is_active, school_year
  )
  VALUES (
    p_school_id, p_teacher_id, p_section_id, NULL,
    'Advisory', p_grade_level, true, true, p_school_year
  )
  ON CONFLICT DO NOTHING;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 3. Update free tier: Add ECR flag to subscriptions
-- =====================================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ecr_enabled BOOLEAN DEFAULT false;

-- Pro tier gets ECR by default
UPDATE subscriptions SET ecr_enabled = true WHERE tier IN ('pro', 'school');

-- Free tier: ECR disabled by default (Quick Grade only)
-- Can be toggled via admin or upgrade

COMMENT ON COLUMN subscriptions.ecr_enabled IS 
  'Whether ECR (Electronic Class Record) with WW/PT/QA component entry is enabled. Free tier uses Quick Grade only.';
