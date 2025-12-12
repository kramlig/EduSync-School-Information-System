-- Migration: Enhance teaching_assignments to be the unified source of truth
-- Date: December 12, 2025
-- Purpose: Add missing fields to support both Teacher Management UI and SF7 reporting
-- Decision: teaching_assignments is the SOURCE OF TRUTH, SF7 forms are REPORTS that read from it

-- ============================================================================
-- ADD MISSING COLUMNS
-- ============================================================================

-- Add learning_area_id foreign key (replaces TEXT subject for relational integrity)
ALTER TABLE teaching_assignments 
ADD COLUMN IF NOT EXISTS learning_area_id UUID REFERENCES learning_areas(id) ON DELETE SET NULL;

-- Add soft delete support
ALTER TABLE teaching_assignments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add active status flag
ALTER TABLE teaching_assignments 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add audit fields
ALTER TABLE teaching_assignments 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Add date range support
ALTER TABLE teaching_assignments 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add notes field
ALTER TABLE teaching_assignments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- BACKFILL learning_area_id FROM subject TEXT
-- ============================================================================

-- Match subject names to learning_areas table and populate learning_area_id
UPDATE teaching_assignments ta
SET learning_area_id = la.id
FROM learning_areas la
WHERE ta.learning_area_id IS NULL
  AND ta.subject IS NOT NULL
  AND (
    LOWER(ta.subject) = LOWER(la.name)
    OR LOWER(ta.subject) = LOWER(la.code)
  );

-- ============================================================================
-- CREATE NEW INDEXES
-- ============================================================================

-- Index for learning_area_id lookups
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_learning_area 
  ON teaching_assignments(learning_area_id) 
  WHERE deleted_at IS NULL;

-- Index for active assignments
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_active_flag 
  ON teaching_assignments(teacher_id, is_active) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Index for soft deletes
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_deleted 
  ON teaching_assignments(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- UPDATE RLS POLICIES TO HANDLE deleted_at
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view teaching assignments from their school" ON teaching_assignments;
DROP POLICY IF EXISTS "Admins and principals can insert teaching assignments" ON teaching_assignments;
DROP POLICY IF EXISTS "Admins and principals can update teaching assignments" ON teaching_assignments;
DROP POLICY IF EXISTS "Admins and principals can delete teaching assignments" ON teaching_assignments;

-- Create new policies with deleted_at support
CREATE POLICY "Users can view active teaching assignments from their school"
  ON teaching_assignments FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      school_id::text = current_setting('app.current_school_id', true)
      OR current_setting('app.current_user_role', true) = 'superadmin'
    )
  );

CREATE POLICY "Teachers can view their own assignments"
  ON teaching_assignments FOR SELECT
  USING (
    deleted_at IS NULL
    AND teacher_id = (current_setting('app.current_user_id', true))::uuid
  );

CREATE POLICY "Admins can manage teaching assignments"
  ON teaching_assignments FOR ALL
  USING (
    deleted_at IS NULL
    AND school_id::text = current_setting('app.current_school_id', true)
    AND current_setting('app.current_user_role', true) IN ('admin', 'principal', 'superadmin')
  )
  WITH CHECK (
    school_id::text = current_setting('app.current_school_id', true)
    AND current_setting('app.current_user_role', true) IN ('admin', 'principal', 'superadmin')
  );

-- ============================================================================
-- UPDATE COMMENTS
-- ============================================================================

COMMENT ON TABLE teaching_assignments IS 
  'Source of truth for teacher assignments. Supports both section adviser (is_advisory=true) and subject teacher roles. Used by Teacher Management UI and SF7 reporting.';

COMMENT ON COLUMN teaching_assignments.learning_area_id IS 
  'Foreign key to learning_areas table. Replaces subject TEXT field for relational integrity. NULL means assignment uses legacy subject field.';

COMMENT ON COLUMN teaching_assignments.subject IS 
  'Legacy TEXT field for subject name. New assignments should use learning_area_id instead.';

COMMENT ON COLUMN teaching_assignments.is_advisory IS 
  'TRUE if teacher is section adviser. Used for Section Adviser assignments. Can be combined with subject teaching.';

COMMENT ON COLUMN teaching_assignments.hours_per_week IS 
  'Teaching hours per week. Required for SF7 reporting. Default 0 for adviser-only assignments.';

COMMENT ON COLUMN teaching_assignments.deleted_at IS 
  'Soft delete timestamp. Assignments are archived, not deleted. NULL = active.';

COMMENT ON COLUMN teaching_assignments.is_active IS 
  'Active status flag. false = temporarily inactive (e.g., on leave), deleted_at = permanently archived.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Run: node scripts/migrate-teacher-assignments-to-teaching-table.mjs
--    This will migrate sections.adviser_id -> teaching_assignments
-- 2. Update frontend to use teaching_assignments table
-- 3. SF7 forms already query this table - no changes needed!
