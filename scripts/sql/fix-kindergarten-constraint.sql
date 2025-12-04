-- ============================================================================
-- FIX: Allow Kindergarten (Grade Level 0) in Sections Table
-- ============================================================================
-- The current CHECK constraint only allows grades 1-12
-- This migration updates it to allow grades 0-12 (0 = Kindergarten)
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_grade_level_check;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_grade_level_check;

-- Add new constraint that includes Kindergarten (grade_level = 0)
ALTER TABLE sections ADD CONSTRAINT sections_grade_level_check 
CHECK (grade_level BETWEEN 0 AND 12);

ALTER TABLE students ADD CONSTRAINT students_grade_level_check 
CHECK (grade_level BETWEEN 0 AND 12);

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Updated sections.grade_level constraint to allow Kindergarten (0-12)';
  RAISE NOTICE '✅ Updated students.grade_level constraint to allow Kindergarten (0-12)';
END $$;
