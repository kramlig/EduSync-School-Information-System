-- Data Migration: Populate teaching_assignments from sections.adviser_id
-- Run this in Supabase SQL Editor after running 20241212_enhance_teaching_assignments.sql
-- This bypasses RLS and directly inserts data

-- ============================================================================
-- MIGRATE SECTION ADVISERS FROM sections.adviser_id
-- ============================================================================

INSERT INTO teaching_assignments (
  school_id,
  teacher_id,
  section_id,
  grade_level,
  school_year,
  subject,
  is_advisory,
  hours_per_week,
  is_active,
  created_at,
  updated_at
)
SELECT 
  s.school_id,
  s.adviser_id,
  s.id,
  s.grade_level,
  COALESCE(s.school_year, '2024-2025'),
  'Section Adviser',
  true,
  0,
  true,
  NOW(),
  NOW()
FROM sections s
WHERE s.adviser_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show counts
SELECT 
  COUNT(*) as total_assignments,
  COUNT(*) FILTER (WHERE is_advisory = true) as section_advisers,
  COUNT(*) FILTER (WHERE is_advisory = false) as subject_teachers
FROM teaching_assignments;

-- Show sample adviser assignments
SELECT 
  ta.id,
  t.name as teacher_name,
  s.name as section_name,
  ta.grade_level,
  ta.school_year,
  ta.is_advisory
FROM teaching_assignments ta
JOIN teachers t ON t.id = ta.teacher_id
JOIN sections s ON s.id = ta.section_id
WHERE ta.is_advisory = true
LIMIT 10;
