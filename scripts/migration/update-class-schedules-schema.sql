-- Update class_schedules Table Schema for Full ScheduleView Support
-- Date: November 30, 2025
-- Description: Add missing fields to match Firestore ClassSchedule type

-- Add missing columns to support the full ScheduleView component functionality
ALTER TABLE class_schedules 
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'academic' CHECK (type IN ('academic', 'extracurricular')),
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'section' CHECK (scope IN ('section', 'gradeLevel', 'all')),
  ADD COLUMN IF NOT EXISTS end_day_of_week day_of_week,
  ADD COLUMN IF NOT EXISTS grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12);

-- Make some FK columns nullable since they depend on scope/type
ALTER TABLE class_schedules 
  ALTER COLUMN section_id DROP NOT NULL,
  ALTER COLUMN learning_area_id DROP NOT NULL,
  ALTER COLUMN teacher_id DROP NOT NULL;

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_class_schedules_scope_section ON class_schedules(scope, section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_class_schedules_scope_grade ON class_schedules(scope, grade_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_class_schedules_type ON class_schedules(type) WHERE deleted_at IS NULL;

-- Add RLS policy (PERMISSIVE - matches other tables)
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_schedules_all_access ON class_schedules;
CREATE POLICY class_schedules_all_access ON class_schedules
    USING (true)
    WITH CHECK (true);

-- Verify schema
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'class_schedules'
ORDER BY ordinal_position;
