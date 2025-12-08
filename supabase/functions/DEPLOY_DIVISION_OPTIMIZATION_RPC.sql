-- ============================================================
-- Division Module Performance Optimization - RPC Functions
-- Created: December 8, 2025
-- ============================================================
-- 
-- This file contains all RPC functions for optimized division 
-- module data fetching. Deploy to Supabase SQL Editor.
--
-- Performance Improvements:
-- - DivisionDashboard: 3+ API calls → 1 RPC call
-- - DivisionSchools: 144+ API calls → 1 RPC call  
-- - DivisionPersonnel summary: 4 API calls → 1 RPC call
-- - DivisionEnrollment summary: 4 API calls → 1 RPC call
-- ============================================================

-- ============================================================
-- 1. DIVISION DASHBOARD STATS
-- Purpose: Single API call for dashboard overview stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_division_dashboard_stats(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  student_stats AS (
    SELECT 
      COUNT(*) as total_students,
      COUNT(*) FILTER (WHERE gender = 'Male') as male_count,
      COUNT(*) FILTER (WHERE gender = 'Female') as female_count,
      COUNT(*) FILTER (WHERE enrollment_status = 'enrolled') as enrolled_count
    FROM students
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL
  ),
  teacher_stats AS (
    SELECT 
      COUNT(*) as total_teachers,
      COUNT(*) FILTER (WHERE employment_status = 'permanent') as permanent_count,
      COUNT(*) FILTER (WHERE employment_status = 'temporary') as temporary_count
    FROM teachers
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL
  ),
  school_summaries AS (
    SELECT 
      fs.id as school_id,
      fs.name as school_name,
      fs.district,
      COALESCE(
        (SELECT COUNT(*) FROM students WHERE school_id = fs.id AND deleted_at IS NULL AND enrollment_status = 'enrolled'),
        0
      ) as student_count,
      COALESCE(
        (SELECT COUNT(*) FROM teachers WHERE school_id = fs.id AND deleted_at IS NULL),
        0
      ) as teacher_count
    FROM filtered_schools fs
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM filtered_schools),
    'total_students', COALESCE((SELECT total_students FROM student_stats), 0),
    'total_male', COALESCE((SELECT male_count FROM student_stats), 0),
    'total_female', COALESCE((SELECT female_count FROM student_stats), 0),
    'enrolled_count', COALESCE((SELECT enrolled_count FROM student_stats), 0),
    'total_teachers', COALESCE((SELECT total_teachers FROM teacher_stats), 0),
    'permanent_teachers', COALESCE((SELECT permanent_count FROM teacher_stats), 0),
    'temporary_teachers', COALESCE((SELECT temporary_count FROM teacher_stats), 0),
    'total_districts', (SELECT COUNT(DISTINCT district) FROM filtered_schools WHERE district IS NOT NULL),
    'schools', (
      SELECT json_agg(
        json_build_object(
          'school_id', school_id,
          'school_name', school_name,
          'district', district,
          'student_count', student_count,
          'teacher_count', teacher_count
        )
        ORDER BY school_name
      )
      FROM school_summaries
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_division_dashboard_stats(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_dashboard_stats(UUID, UUID[]) TO anon;

-- ============================================================
-- 2. DIVISION SCHOOLS STATS
-- Purpose: School cards with student/teacher counts
-- ============================================================
CREATE OR REPLACE FUNCTION get_division_schools_stats(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id, name, school_id_number, district, address, principal_name
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  student_counts AS (
    SELECT 
      school_id,
      COUNT(*) as student_count
    FROM students
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL
      AND enrollment_status = 'enrolled'
    GROUP BY school_id
  ),
  teacher_counts AS (
    SELECT 
      school_id,
      COUNT(*) as teacher_count
    FROM teachers
    WHERE school_id IN (SELECT id FROM filtered_schools)
      AND deleted_at IS NULL
    GROUP BY school_id
  ),
  school_stats AS (
    SELECT 
      fs.id as school_id,
      fs.name,
      fs.school_id_number,
      fs.district,
      fs.address,
      fs.principal_name,
      COALESCE(sc.student_count, 0) as student_count,
      COALESCE(tc.teacher_count, 0) as teacher_count
    FROM filtered_schools fs
    LEFT JOIN student_counts sc ON fs.id = sc.school_id
    LEFT JOIN teacher_counts tc ON fs.id = tc.school_id
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM filtered_schools),
    'total_students', (SELECT COALESCE(SUM(student_count), 0) FROM student_counts),
    'total_teachers', (SELECT COALESCE(SUM(teacher_count), 0) FROM teacher_counts),
    'total_districts', (SELECT COUNT(DISTINCT district) FROM filtered_schools WHERE district IS NOT NULL),
    'schools', (
      SELECT json_agg(
        json_build_object(
          'school_id', school_id,
          'name', name,
          'school_id_number', school_id_number,
          'district', district,
          'address', address,
          'principal_name', principal_name,
          'student_count', student_count,
          'teacher_count', teacher_count
        )
        ORDER BY name
      )
      FROM school_stats
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_division_schools_stats(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_schools_stats(UUID, UUID[]) TO anon;

-- ============================================================
-- 3. DIVISION PERSONNEL COUNTS
-- Purpose: Summary card counts for personnel page
-- ============================================================
CREATE OR REPLACE FUNCTION get_division_personnel_counts(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  )
  SELECT json_build_object(
    'total', (
      SELECT COUNT(*) 
      FROM teachers 
      WHERE school_id IN (SELECT id FROM filtered_schools) 
        AND deleted_at IS NULL
    ),
    'permanent', (
      SELECT COUNT(*) 
      FROM teachers 
      WHERE school_id IN (SELECT id FROM filtered_schools) 
        AND deleted_at IS NULL 
        AND employment_status = 'permanent'
    ),
    'temporary', (
      SELECT COUNT(*) 
      FROM teachers 
      WHERE school_id IN (SELECT id FROM filtered_schools) 
        AND deleted_at IS NULL 
        AND employment_status = 'temporary'
    ),
    'school_count', (SELECT COUNT(*) FROM filtered_schools)
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_division_personnel_counts(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_personnel_counts(UUID, UUID[]) TO anon;

-- ============================================================
-- 4. DIVISION ENROLLMENT COUNTS
-- Purpose: Summary card counts for enrollment page
-- ============================================================
CREATE OR REPLACE FUNCTION get_division_enrollment_counts(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  )
  SELECT json_build_object(
    'total', (
      SELECT COUNT(*) 
      FROM students 
      WHERE school_id IN (SELECT id FROM filtered_schools) 
        AND deleted_at IS NULL
    ),
    'male', (
      SELECT COUNT(*) 
      FROM students 
      WHERE school_id IN (SELECT id FROM filtered_schools) 
        AND deleted_at IS NULL 
        AND gender = 'Male'
    ),
    'female', (
      SELECT COUNT(*) 
      FROM students 
      WHERE school_id IN (SELECT id FROM filtered_schools) 
        AND deleted_at IS NULL 
        AND gender = 'Female'
    ),
    'enrolled', (
      SELECT COUNT(*) 
      FROM students 
      WHERE school_id IN (SELECT id FROM filtered_schools) 
        AND deleted_at IS NULL 
        AND enrollment_status = 'enrolled'
    ),
    'school_count', (SELECT COUNT(*) FROM filtered_schools)
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_division_enrollment_counts(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_enrollment_counts(UUID, UUID[]) TO anon;

-- ============================================================
-- 5. DIVISION PERSONNEL SUMMARY (for SF7)
-- Purpose: Full personnel summary with aggregation by position/status
-- ============================================================
CREATE OR REPLACE FUNCTION get_division_personnel_summary(
  p_division_id UUID,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_schools AS (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  personnel_data AS (
    SELECT 
      t.school_id,
      fs.name as school_name,
      fs.district,
      COALESCE(t.position, 'other') as position,
      COALESCE(t.employment_status, 'permanent') as employment_status
    FROM teachers t
    JOIN filtered_schools fs ON t.school_id = fs.id
    WHERE t.deleted_at IS NULL
  ),
  position_counts AS (
    SELECT position, COUNT(*) as count
    FROM personnel_data
    GROUP BY position
  ),
  status_counts AS (
    SELECT employment_status as status, COUNT(*) as count
    FROM personnel_data
    GROUP BY employment_status
  ),
  district_counts AS (
    SELECT 
      COALESCE(district, 'Unassigned') as district,
      COUNT(DISTINCT school_id) as schools,
      COUNT(*) as personnel
    FROM personnel_data
    GROUP BY COALESCE(district, 'Unassigned')
  ),
  school_summaries AS (
    SELECT 
      school_id,
      school_name,
      district,
      COUNT(*) as total_personnel,
      json_object_agg(position, pos_count) as by_position,
      json_object_agg(status, stat_count) as by_status
    FROM (
      SELECT 
        pd.school_id,
        pd.school_name,
        pd.district,
        pd.position,
        pd.employment_status as status,
        COUNT(*) FILTER (WHERE TRUE) OVER (PARTITION BY pd.school_id, pd.position) as pos_count,
        COUNT(*) FILTER (WHERE TRUE) OVER (PARTITION BY pd.school_id, pd.employment_status) as stat_count
      FROM personnel_data pd
    ) sub
    GROUP BY school_id, school_name, district
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM filtered_schools),
    'total_personnel', (SELECT COUNT(*) FROM personnel_data),
    'by_position', (SELECT json_object_agg(position, count) FROM position_counts),
    'by_status', (SELECT json_object_agg(status, count) FROM status_counts),
    'by_district', (
      SELECT json_object_agg(
        district, 
        json_build_object('schools', schools, 'personnel', personnel)
      ) FROM district_counts
    ),
    'schools', (
      SELECT json_agg(
        json_build_object(
          'school_id', school_id,
          'school_name', school_name,
          'district', district,
          'total_personnel', total_personnel,
          'by_position', by_position,
          'by_status', by_status
        )
        ORDER BY school_name
      )
      FROM school_summaries
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_division_personnel_summary(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_personnel_summary(UUID, UUID[]) TO anon;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these after deployment to verify functions are available:
--
-- SELECT proname FROM pg_proc WHERE proname LIKE 'get_division%';
-- 
-- Test with:
-- SELECT get_division_dashboard_stats('your-division-id');
-- SELECT get_division_schools_stats('your-division-id');
-- SELECT get_division_personnel_counts('your-division-id');
-- SELECT get_division_enrollment_counts('your-division-id');
-- SELECT get_division_personnel_summary('your-division-id');
