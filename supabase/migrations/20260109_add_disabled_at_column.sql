-- Add disabled_at column to teachers and students tables
-- This allows admins to disable/enable user accounts without deleting them

-- Add disabled_at to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ DEFAULT NULL;

-- Add disabled_at to students table  
ALTER TABLE students ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_teachers_disabled_at ON teachers(disabled_at) WHERE disabled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_disabled_at ON students(disabled_at) WHERE disabled_at IS NOT NULL;

-- Comment explaining the column
COMMENT ON COLUMN teachers.disabled_at IS 'Timestamp when account was disabled. NULL means account is active.';
COMMENT ON COLUMN students.disabled_at IS 'Timestamp when account was disabled. NULL means account is active.';
