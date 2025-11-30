-- Optimize Class Schedules Table with Indexes
-- Date: November 30, 2025
-- Description: Add indexes to improve query performance for schedule operations

-- Index for fetching schedules by school (most common query)
CREATE INDEX IF NOT EXISTS idx_class_schedules_school_id 
ON class_schedules(school_id) 
WHERE deleted_at IS NULL;

-- Index for fetching schedules by section
CREATE INDEX IF NOT EXISTS idx_class_schedules_section_id 
ON class_schedules(section_id) 
WHERE deleted_at IS NULL;

-- Index for fetching schedules by teacher
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_id 
ON class_schedules(teacher_id) 
WHERE deleted_at IS NULL;

-- Composite index for conflict detection (day + time range)
-- This dramatically speeds up conflict checks
CREATE INDEX IF NOT EXISTS idx_class_schedules_conflict_check 
ON class_schedules(school_id, day_of_week, start_time, end_time) 
WHERE deleted_at IS NULL;

-- Index for ordering by day and time
CREATE INDEX IF NOT EXISTS idx_class_schedules_day_time 
ON class_schedules(day_of_week, start_time) 
WHERE deleted_at IS NULL;

-- Index for filtering by scope
CREATE INDEX IF NOT EXISTS idx_class_schedules_scope 
ON class_schedules(scope) 
WHERE deleted_at IS NULL;

-- Index for grade-level filtering
CREATE INDEX IF NOT EXISTS idx_class_schedules_grade_level 
ON class_schedules(grade_level) 
WHERE deleted_at IS NULL AND grade_level IS NOT NULL;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'class_schedules'
ORDER BY indexname;
