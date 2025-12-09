-- ============================================================================
-- Supabase RPC Function for Division Proficiency Report
-- Aggregates quarterly proficiency data across all schools in a division
-- Run this in Supabase SQL Editor
-- ============================================================================

CREATE OR REPLACE FUNCTION get_division_proficiency_summary(
  p_division_id UUID,
  p_quarter TEXT DEFAULT 'Q2',
  p_school_year TEXT DEFAULT NULL,
  p_school_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  quarter_column TEXT;
BEGIN
  -- Determine which quarter column to use
  quarter_column := CASE p_quarter
    WHEN 'Q1' THEN 'q1'
    WHEN 'Q2' THEN 'q2'
    WHEN 'Q3' THEN 'q3'
    WHEN 'Q4' THEN 'q4'
    ELSE 'q2'
  END;

  WITH school_list AS MATERIALIZED (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
      AND (p_school_ids IS NULL OR id = ANY(p_school_ids))
  ),
  -- Get enrolled students with their grade level from sections
  enrolled_students AS MATERIALIZED (
    SELECT 
      s.id as student_id,
      s.school_id,
      s.gender,
      sec.grade_level
    FROM students s
    JOIN sections sec ON s.section_id = sec.id
    WHERE s.school_id IN (SELECT id FROM school_list)
      AND s.deleted_at IS NULL
      AND s.enrollment_status = 'enrolled'
  ),
  -- Get learning areas with their subject category mapping
  learning_area_mapping AS MATERIALIZED (
    SELECT 
      la.id as learning_area_id,
      la.school_id,
      la.name,
      la.code,
      la.grade_levels,
      CASE 
        WHEN LOWER(la.name) LIKE '%filipino%' OR LOWER(la.code) LIKE '%fil%' THEN 'language'
        WHEN LOWER(la.name) LIKE '%mother tongue%' OR LOWER(la.code) LIKE '%mt%' OR LOWER(la.code) LIKE '%mtb%' THEN 'mother_tongue'
        WHEN LOWER(la.name) LIKE '%reading%' OR LOWER(la.name) LIKE '%literacy%' THEN 'reading_literacy'
        WHEN LOWER(la.name) LIKE '%english%' OR LOWER(la.code) LIKE '%eng%' THEN 'english'
        ELSE NULL
      END as subject_category
    FROM learning_areas la
    WHERE la.school_id IN (SELECT id FROM school_list)
      AND la.is_active = true
  ),
  -- Get grades for the specified quarter
  -- Note: q1-q4 are NUMERIC columns, composite_grades is JSONB for MAPEH
  grade_data AS MATERIALIZED (
    SELECT 
      g.student_id,
      g.school_id,
      g.learning_area_id,
      es.grade_level,
      lam.subject_category,
      CASE p_quarter
        WHEN 'Q1' THEN COALESCE(
          g.q1,
          -- For composite subjects like MAPEH, average the sub-grades
          CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q1' IS NOT NULL 
            THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q1'))
            ELSE NULL
          END
        )
        WHEN 'Q2' THEN COALESCE(
          g.q2,
          CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q2' IS NOT NULL 
            THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q2'))
            ELSE NULL
          END
        )
        WHEN 'Q3' THEN COALESCE(
          g.q3,
          CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q3' IS NOT NULL 
            THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q3'))
            ELSE NULL
          END
        )
        WHEN 'Q4' THEN COALESCE(
          g.q4,
          CASE WHEN g.composite_grades IS NOT NULL AND g.composite_grades->'q4' IS NOT NULL 
            THEN (SELECT AVG(value::numeric) FROM jsonb_each_text(g.composite_grades->'q4'))
            ELSE NULL
          END
        )
      END as grade_value
    FROM grades g
    JOIN enrolled_students es ON g.student_id = es.student_id
    LEFT JOIN learning_area_mapping lam ON g.learning_area_id = lam.learning_area_id
    WHERE g.school_id IN (SELECT id FROM school_list)
  ),
  -- Aggregate proficiency by school, grade level, and subject
  school_proficiency AS (
    SELECT 
      gd.school_id,
      sl.name as school_name,
      sl.district,
      gd.grade_level,
      gd.subject_category,
      COUNT(DISTINCT gd.student_id) as total_students,
      AVG(gd.grade_value) as mean_percentage_score,
      COUNT(DISTINCT gd.student_id) FILTER (WHERE gd.grade_value >= 75) as students_75_above
    FROM grade_data gd
    JOIN school_list sl ON gd.school_id = sl.id
    WHERE gd.grade_value IS NOT NULL
      AND gd.grade_value > 0
      AND gd.subject_category IS NOT NULL
    GROUP BY gd.school_id, sl.name, sl.district, gd.grade_level, gd.subject_category
  ),
  -- Aggregate by district
  district_proficiency AS (
    SELECT 
      COALESCE(district, 'Unassigned') as district_name,
      grade_level,
      subject_category,
      SUM(total_students)::int as total_students,
      CASE 
        WHEN SUM(total_students) > 0 
        THEN SUM(mean_percentage_score * total_students) / SUM(total_students)
        ELSE 0 
      END as mean_percentage_score,
      SUM(students_75_above)::int as students_75_above
    FROM school_proficiency
    GROUP BY COALESCE(district, 'Unassigned'), grade_level, subject_category
  ),
  -- Division-wide totals
  division_totals AS (
    SELECT 
      SUM(total_students)::int as total_students,
      CASE 
        WHEN SUM(total_students) > 0 
        THEN SUM(mean_percentage_score * total_students) / SUM(total_students)
        ELSE 0 
      END as overall_mps,
      CASE 
        WHEN SUM(total_students) > 0 
        THEN (SUM(students_75_above)::float / SUM(total_students) * 100)
        ELSE 0 
      END as passing_rate
    FROM school_proficiency
  )
  SELECT json_build_object(
    'quarter', p_quarter,
    'school_year', COALESCE(p_school_year, to_char(CURRENT_DATE, 'YYYY') || '-' || to_char(CURRENT_DATE + interval '1 year', 'YYYY')),
    'summary', json_build_object(
      'total_schools', (SELECT COUNT(*) FROM school_list),
      'total_districts', (SELECT COUNT(DISTINCT COALESCE(district, 'Unassigned')) FROM school_list),
      'total_students_elementary', COALESCE((SELECT total_students FROM division_totals), 0),
      'overall_mps_elementary', COALESCE(ROUND((SELECT overall_mps FROM division_totals)::numeric, 2), 0),
      'overall_passing_rate', COALESCE(ROUND((SELECT passing_rate FROM division_totals)::numeric, 2), 0)
    ),
    'schools', COALESCE((
      SELECT json_agg(
        json_build_object(
          'school_id', sp.school_id,
          'school_name', sp.school_name,
          'district', sp.district,
          'grade_level', sp.grade_level,
          'subject_category', sp.subject_category,
          'total_students', sp.total_students,
          'mean_percentage_score', ROUND(sp.mean_percentage_score::numeric, 2),
          'students_75_above', sp.students_75_above,
          'percent_75_above', CASE 
            WHEN sp.total_students > 0 
            THEN ROUND((sp.students_75_above::float / sp.total_students * 100)::numeric, 2)
            ELSE 0 
          END
        )
      )
      FROM school_proficiency sp
    ), '[]'::json),
    'by_district', COALESCE((
      SELECT json_object_agg(
        district_name,
        (
          SELECT json_agg(
            json_build_object(
              'grade_level', dp2.grade_level,
              'subject_category', dp2.subject_category,
              'total_students', dp2.total_students,
              'mean_percentage_score', ROUND(dp2.mean_percentage_score::numeric, 2),
              'students_75_above', dp2.students_75_above,
              'percent_75_above', CASE 
                WHEN dp2.total_students > 0 
                THEN ROUND((dp2.students_75_above::float / dp2.total_students * 100)::numeric, 2)
                ELSE 0 
              END
            )
          )
          FROM district_proficiency dp2
          WHERE dp2.district_name = dp.district_name
        )
      )
      FROM (SELECT DISTINCT district_name FROM district_proficiency) dp
    ), '{}'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_division_proficiency_summary(UUID, TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_proficiency_summary(UUID, TEXT, TEXT, UUID[]) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_division_proficiency_summary IS 'Aggregates quarterly proficiency data (MPS, passing rates) for all schools in a division. Used for Division Q2 Proficiency Level Report.';
