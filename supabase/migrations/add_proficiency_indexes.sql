-- ============================================================================
-- Performance Indexes for Division Proficiency Report
-- Run this ONCE in Supabase SQL Editor to improve query performance
-- ============================================================================

-- Index for grades table - critical for quarter lookups
CREATE INDEX IF NOT EXISTS idx_grades_school_student 
ON grades(school_id, student_id);

CREATE INDEX IF NOT EXISTS idx_grades_learning_area 
ON grades(learning_area_id);

-- Index for students table - for enrollment filtering
CREATE INDEX IF NOT EXISTS idx_students_school_section 
ON students(school_id, section_id) 
WHERE deleted_at IS NULL AND enrollment_status = 'enrolled';

-- Index for schools table - for division filtering
CREATE INDEX IF NOT EXISTS idx_schools_division 
ON schools(division_id) 
WHERE deleted_at IS NULL;

-- Index for learning_areas table
CREATE INDEX IF NOT EXISTS idx_learning_areas_school 
ON learning_areas(school_id, code) 
WHERE is_active = true;

-- Index for sections table
CREATE INDEX IF NOT EXISTS idx_sections_grade_level 
ON sections(id, grade_level);

-- Analyze tables to update statistics
ANALYZE grades;
ANALYZE students;
ANALYZE schools;
ANALYZE learning_areas;
ANALYZE sections;
