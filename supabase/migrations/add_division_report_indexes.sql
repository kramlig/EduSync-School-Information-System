-- ============================================================================
-- Indexes for Division Report Functions
-- These indexes optimize the RPC functions for SF5/SF6 dashboards
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Index for SF6 (Enrollment Summary) - students table queries
-- Covers: WHERE school_id IN (...) AND deleted_at IS NULL AND enrollment_status = 'enrolled'
-- Includes columns used in aggregation: grade_level, gender
CREATE INDEX IF NOT EXISTS idx_students_division_enrollment 
ON students (school_id, enrollment_status) 
WHERE deleted_at IS NULL;

-- Composite index for student stats aggregation
CREATE INDEX IF NOT EXISTS idx_students_school_grade_gender 
ON students (school_id, grade_level, gender) 
WHERE deleted_at IS NULL AND enrollment_status = 'enrolled';

-- Index for SF5 (Promotion Summary) - promotion_records table queries
-- Covers: WHERE school_id IN (...) AND school_year = ? AND grading_period = ?
CREATE INDEX IF NOT EXISTS idx_promotion_records_division_summary 
ON promotion_records (school_id, school_year, grading_period);

-- Composite index for promotion stats aggregation
CREATE INDEX IF NOT EXISTS idx_promotion_records_school_grade_status 
ON promotion_records (school_id, current_grade_level, promotion_status, school_year, grading_period);

-- Index for schools by division (used by both functions)
CREATE INDEX IF NOT EXISTS idx_schools_division_active 
ON schools (division_id) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- Analyze tables to update statistics for query planner
-- ============================================================================
ANALYZE students;
ANALYZE promotion_records;
ANALYZE schools;
