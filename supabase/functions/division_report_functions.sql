-- ============================================================================
-- Supabase RPC Functions for Division Reports
-- These functions aggregate data on the server for better performance
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. SF6 Enrollment Summary Aggregation (OPTIMIZED)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_division_enrollment_summary(
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
  -- Use a single materialized CTE for student_stats to avoid multiple scans
  WITH school_list AS MATERIALIZED (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  student_stats AS MATERIALIZED (
    SELECT 
      s.school_id,
      s.grade_level,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE s.gender = 'Male') as male,
      COUNT(*) FILTER (WHERE s.gender = 'Female') as female
    FROM students s
    WHERE s.school_id IN (SELECT id FROM school_list)
      AND s.deleted_at IS NULL
      AND s.enrollment_status = 'enrolled'
    GROUP BY s.school_id, s.grade_level
  ),
  aggregates AS MATERIALIZED (
    SELECT 
      COALESCE(SUM(total), 0)::int as total_students,
      COALESCE(SUM(male), 0)::int as total_male,
      COALESCE(SUM(female), 0)::int as total_female
    FROM student_stats
  ),
  by_grade AS (
    SELECT 
      grade_level,
      SUM(total)::int as total,
      SUM(male)::int as male,
      SUM(female)::int as female
    FROM student_stats
    GROUP BY grade_level
  ),
  by_district AS (
    SELECT 
      COALESCE(sl.district, 'Unassigned') as district,
      COUNT(DISTINCT sl.id)::int as schools,
      COALESCE(SUM(ss.total), 0)::int as students,
      COALESCE(SUM(ss.male), 0)::int as male,
      COALESCE(SUM(ss.female), 0)::int as female
    FROM school_list sl
    LEFT JOIN student_stats ss ON sl.id = ss.school_id
    GROUP BY COALESCE(sl.district, 'Unassigned')
  ),
  by_school AS (
    SELECT 
      sl.id as school_id,
      sl.name as school_name,
      sl.district,
      COALESCE(SUM(ss.total), 0)::int as total_students,
      COALESCE(SUM(ss.male), 0)::int as male_count,
      COALESCE(SUM(ss.female), 0)::int as female_count,
      COALESCE(
        jsonb_object_agg(
          ss.grade_level::text,
          jsonb_build_object('total', ss.total, 'male', ss.male, 'female', ss.female)
        ) FILTER (WHERE ss.grade_level IS NOT NULL),
        '{}'::jsonb
      ) as by_grade
    FROM school_list sl
    LEFT JOIN student_stats ss ON sl.id = ss.school_id
    GROUP BY sl.id, sl.name, sl.district
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM school_list),
    'total_students', (SELECT total_students FROM aggregates),
    'total_male', (SELECT total_male FROM aggregates),
    'total_female', (SELECT total_female FROM aggregates),
    'by_grade', COALESCE((SELECT json_object_agg(grade_level, json_build_object('total', total, 'male', male, 'female', female)) FROM by_grade), '{}'),
    'by_district', COALESCE((SELECT json_object_agg(district, json_build_object('schools', schools, 'students', students, 'male', male, 'female', female)) FROM by_district), '{}'),
    'schools', COALESCE((SELECT json_agg(json_build_object(
      'school_id', school_id,
      'school_name', school_name,
      'district', district,
      'total_students', total_students,
      'male_count', male_count,
      'female_count', female_count,
      'by_grade', by_grade
    )) FROM by_school), '[]')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- 2. SF5 Promotion Summary Aggregation
-- ============================================================================
CREATE OR REPLACE FUNCTION get_division_promotion_summary(
  p_division_id UUID,
  p_school_year TEXT DEFAULT NULL,
  p_grading_period TEXT DEFAULT 'final',
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH school_list AS (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  promotion_stats AS (
    SELECT 
      pr.school_id,
      pr.current_grade_level,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE pr.promotion_status = 'promoted') as promoted,
      COUNT(*) FILTER (WHERE pr.promotion_status = 'retained') as retained,
      COUNT(*) FILTER (WHERE pr.promotion_status = 'conditionally_promoted') as conditionally_promoted
    FROM promotion_records pr
    JOIN school_list sl ON pr.school_id = sl.id
    WHERE (p_school_year IS NULL OR pr.school_year = p_school_year)
      AND (p_grading_period IS NULL OR pr.grading_period = p_grading_period)
    GROUP BY pr.school_id, pr.current_grade_level
  ),
  by_grade AS (
    SELECT 
      current_grade_level,
      SUM(total)::int as total,
      SUM(promoted)::int as promoted,
      SUM(retained)::int as retained,
      SUM(conditionally_promoted)::int as conditionally_promoted,
      CASE WHEN SUM(total) > 0 
        THEN ROUND(100.0 * SUM(promoted) / SUM(total), 1)
        ELSE 0 
      END as promotion_rate
    FROM promotion_stats
    GROUP BY current_grade_level
  ),
  by_district AS (
    SELECT 
      COALESCE(sl.district, 'Unassigned') as district,
      COUNT(DISTINCT sl.id)::int as schools,
      COALESCE(SUM(ps.total), 0)::int as students,
      COALESCE(SUM(ps.promoted), 0)::int as promoted,
      CASE WHEN COALESCE(SUM(ps.total), 0) > 0 
        THEN ROUND(100.0 * COALESCE(SUM(ps.promoted), 0) / COALESCE(SUM(ps.total), 1), 1)
        ELSE 0 
      END as promotion_rate
    FROM school_list sl
    LEFT JOIN promotion_stats ps ON sl.id = ps.school_id
    GROUP BY COALESCE(sl.district, 'Unassigned')
  ),
  by_school AS (
    SELECT 
      sl.id as school_id,
      sl.name as school_name,
      sl.district,
      COALESCE(SUM(ps.total), 0)::int as total_students,
      COALESCE(SUM(ps.promoted), 0)::int as promoted,
      COALESCE(SUM(ps.retained), 0)::int as retained,
      COALESCE(SUM(ps.conditionally_promoted), 0)::int as conditionally_promoted,
      CASE WHEN COALESCE(SUM(ps.total), 0) > 0 
        THEN ROUND(100.0 * COALESCE(SUM(ps.promoted), 0) / COALESCE(SUM(ps.total), 1), 1)
        ELSE 0 
      END as promotion_rate,
      jsonb_object_agg(
        COALESCE(ps.current_grade_level::text, '0'),
        jsonb_build_object(
          'total', ps.total, 
          'promoted', ps.promoted, 
          'retained', ps.retained, 
          'conditionally_promoted', ps.conditionally_promoted,
          'promotion_rate', CASE WHEN ps.total > 0 THEN ROUND(100.0 * ps.promoted / ps.total, 1) ELSE 0 END
        )
      ) FILTER (WHERE ps.current_grade_level IS NOT NULL) as by_grade
    FROM school_list sl
    LEFT JOIN promotion_stats ps ON sl.id = ps.school_id
    GROUP BY sl.id, sl.name, sl.district
  ),
  totals AS (
    SELECT 
      COALESCE(SUM(total), 0)::int as total_students,
      COALESCE(SUM(promoted), 0)::int as total_promoted,
      COALESCE(SUM(retained), 0)::int as total_retained,
      COALESCE(SUM(conditionally_promoted), 0)::int as total_conditionally_promoted
    FROM promotion_stats
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM school_list),
    'total_students', (SELECT total_students FROM totals),
    'total_promoted', (SELECT total_promoted FROM totals),
    'total_retained', (SELECT total_retained FROM totals),
    'total_conditionally_promoted', (SELECT total_conditionally_promoted FROM totals),
    'overall_promotion_rate', (SELECT CASE WHEN total_students > 0 THEN ROUND(100.0 * total_promoted / total_students, 1) ELSE 0 END FROM totals),
    'by_grade', (SELECT COALESCE(json_object_agg(current_grade_level, json_build_object(
      'total', total, 
      'promoted', promoted, 
      'retained', retained, 
      'conditionally_promoted', conditionally_promoted,
      'promotion_rate', promotion_rate
    )), '{}') FROM by_grade),
    'by_district', (SELECT COALESCE(json_object_agg(district, json_build_object(
      'schools', schools, 
      'students', students, 
      'promoted', promoted, 
      'promotion_rate', promotion_rate
    )), '{}') FROM by_district),
    'schools', (SELECT COALESCE(json_agg(json_build_object(
      'school_id', school_id,
      'school_name', school_name,
      'district', district,
      'total_students', total_students,
      'promoted', promoted,
      'retained', retained,
      'conditionally_promoted', conditionally_promoted,
      'promotion_rate', promotion_rate,
      'by_grade', COALESCE(by_grade, '{}'::jsonb)
    )), '[]') FROM by_school)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_division_enrollment_summary(UUID, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_division_promotion_summary(UUID, TEXT, TEXT, UUID[]) TO anon, authenticated;

-- ============================================================================
-- Test the functions
-- ============================================================================
-- SELECT get_division_enrollment_summary('36212308-a915-4ffb-84b5-e9e9900b3bc5'::uuid);
-- SELECT get_division_promotion_summary('36212308-a915-4ffb-84b5-e9e9900b3bc5'::uuid, '2024-2025', 'final');
