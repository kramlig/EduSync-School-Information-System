-- ============================================================================
-- Division Proficiency Report V2 - DepEd Format with Grade Levels (Optimized)
-- Includes Kindergarten proficiency levels
-- Run this in Supabase SQL Editor to create/update the function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_division_proficiency_v2(
  p_division_id UUID,
  p_quarter TEXT DEFAULT 'Q2'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
DECLARE
  result JSON;
BEGIN
  -- Use MATERIALIZED CTEs for better performance
  WITH school_list AS MATERIALIZED (
    SELECT id, name, district
    FROM schools
    WHERE division_id = p_division_id
      AND deleted_at IS NULL
  ),
  
  -- Kindergarten proficiency from promotion_records
  -- Maps: developing=Beginning, emerging=Developing, advancing=Consistent
  kinder_data AS MATERIALIZED (
    SELECT 
      pr.school_id,
      sl.name as school_name,
      sl.district,
      COUNT(*) as total_kinder,
      -- Count each level across all 4 domains, then average
      ROUND(AVG(CASE 
        WHEN pr.socio_emotional_dev = 'developing' OR pr.physical_motor_dev = 'developing' 
          OR pr.cognitive_dev = 'developing' OR pr.language_literacy_dev = 'developing' 
        THEN 1 ELSE 0 END) * 100, 2) as beginning_pct,
      ROUND(AVG(CASE 
        WHEN pr.socio_emotional_dev = 'emerging' OR pr.physical_motor_dev = 'emerging' 
          OR pr.cognitive_dev = 'emerging' OR pr.language_literacy_dev = 'emerging' 
        THEN 1 ELSE 0 END) * 100, 2) as developing_pct,
      ROUND(AVG(CASE 
        WHEN pr.socio_emotional_dev = 'advancing' OR pr.physical_motor_dev = 'advancing' 
          OR pr.cognitive_dev = 'advancing' OR pr.language_literacy_dev = 'advancing' 
        THEN 1 ELSE 0 END) * 100, 2) as consistent_pct
    FROM promotion_records pr
    JOIN school_list sl ON pr.school_id = sl.id
    WHERE pr.current_grade_level = 0  -- Kindergarten
      AND (pr.socio_emotional_dev IS NOT NULL 
           OR pr.physical_motor_dev IS NOT NULL
           OR pr.cognitive_dev IS NOT NULL
           OR pr.language_literacy_dev IS NOT NULL)
    GROUP BY pr.school_id, sl.name, sl.district
  ),
  
  -- Get student grade levels from sections (materialized for reuse)
  student_grades AS MATERIALIZED (
    SELECT 
      st.id as student_id,
      st.school_id,
      sec.grade_level
    FROM students st
    JOIN sections sec ON st.section_id = sec.id
    WHERE st.school_id IN (SELECT id FROM school_list)
      AND st.deleted_at IS NULL
      AND st.enrollment_status = 'enrolled'
  ),
  
  -- Get grades with subject and grade level - single pass
  grade_data AS MATERIALIZED (
    SELECT 
      g.school_id,
      la.code as subject_code,
      sg.grade_level,
      CASE p_quarter
        WHEN 'Q1' THEN g.q1
        WHEN 'Q2' THEN g.q2
        WHEN 'Q3' THEN g.q3
        WHEN 'Q4' THEN g.q4
      END as grade_value
    FROM grades g
    JOIN learning_areas la ON g.learning_area_id = la.id AND la.school_id = g.school_id
    LEFT JOIN student_grades sg ON g.student_id = sg.student_id
    WHERE g.school_id IN (SELECT id FROM school_list)
  ),
  
  -- Pre-aggregate at school-subject-grade level
  school_subject_grade_stats AS MATERIALIZED (
    SELECT 
      gd.school_id,
      sl.name as school_name,
      sl.district,
      gd.subject_code,
      gd.grade_level,
      COUNT(*)::int as total_students,
      ROUND(AVG(gd.grade_value)::numeric, 2) as mps,
      SUM(CASE WHEN gd.grade_value >= 75 THEN 1 ELSE 0 END)::int as passing_count
    FROM grade_data gd
    JOIN school_list sl ON gd.school_id = sl.id
    WHERE gd.grade_value IS NOT NULL AND gd.grade_value > 0
    GROUP BY gd.school_id, sl.name, sl.district, gd.subject_code, gd.grade_level
  ),
  
  -- Aggregate by school and subject
  school_subject_stats AS MATERIALIZED (
    SELECT 
      school_id,
      school_name,
      district,
      subject_code,
      SUM(total_students)::int as total_students,
      ROUND((SUM(mps * total_students) / NULLIF(SUM(total_students), 0))::numeric, 2) as mps,
      SUM(passing_count)::int as passing_count
    FROM school_subject_grade_stats
    GROUP BY school_id, school_name, district, subject_code
  ),
  
  -- Aggregate by subject across division
  subject_totals AS MATERIALIZED (
    SELECT 
      subject_code,
      COUNT(DISTINCT school_id)::int as schools_with_data,
      SUM(total_students)::int as total_students,
      ROUND((SUM(mps * total_students) / NULLIF(SUM(total_students), 0))::numeric, 2) as avg_mps,
      SUM(passing_count)::int as total_passing
    FROM school_subject_stats
    GROUP BY subject_code
  )
  
  SELECT json_build_object(
    'quarter', p_quarter,
    'total_schools', (SELECT COUNT(*)::int FROM school_list),
    'schools_checked', (SELECT COUNT(DISTINCT school_id)::int FROM school_subject_stats),
    'total_grades', COALESCE((SELECT SUM(total_students)::int FROM subject_totals), 0),
    'overall_mps', COALESCE((
      SELECT ROUND((SUM(avg_mps * total_students) / NULLIF(SUM(total_students), 0))::numeric, 2)
      FROM subject_totals
    ), 0),
    
    -- Kindergarten summary
    'kindergarten', COALESCE((
      SELECT json_agg(json_build_object(
        'school_id', school_id,
        'school_name', school_name,
        'district', COALESCE(district, 'Unassigned'),
        'total_students', total_kinder,
        'beginning_pct', beginning_pct,
        'developing_pct', developing_pct,
        'consistent_pct', consistent_pct,
        'total_pct', ROUND(beginning_pct + developing_pct + consistent_pct, 2)
      ) ORDER BY COALESCE(district, 'ZZZ'), school_name)
      FROM kinder_data
    ), '[]'::json),
    
    -- By subject summary
    'by_subject', COALESCE((
      SELECT json_agg(json_build_object(
        'code', subject_code,
        'schools_with_data', schools_with_data,
        'total_students', total_students,
        'mps', avg_mps,
        'passing', total_passing,
        'passing_rate', CASE WHEN total_students > 0 
          THEN ROUND((total_passing::float / total_students * 100)::numeric, 2) ELSE 0 END
      ) ORDER BY subject_code)
      FROM subject_totals
    ), '[]'::json),
    
    -- School details by subject
    'school_data', COALESCE((
      SELECT json_agg(json_build_object(
        'school_id', school_id,
        'school_name', school_name,
        'district', COALESCE(district, 'Unassigned'),
        'subject_code', subject_code,
        'total_students', total_students,
        'mps', mps,
        'passing', passing_count,
        'passing_rate', CASE WHEN total_students > 0 
          THEN ROUND((passing_count::float / total_students * 100)::numeric, 2) ELSE 0 END
      ) ORDER BY COALESCE(district, 'ZZZ'), school_name, subject_code)
      FROM school_subject_stats
    ), '[]'::json),
    
    -- By grade level for DepEd format
    'by_grade_level', COALESCE((
      SELECT json_agg(json_build_object(
        'school_id', school_id,
        'school_name', school_name,
        'district', COALESCE(district, 'Unassigned'),
        'subject_code', subject_code,
        'grade_level', grade_level,
        'total_students', total_students,
        'mps', mps,
        'passing_rate', CASE WHEN total_students > 0 
          THEN ROUND((passing_count::float / total_students * 100)::numeric, 2) ELSE 0 END
      ) ORDER BY COALESCE(district, 'ZZZ'), school_name, subject_code, grade_level)
      FROM school_subject_grade_stats
    ), '[]'::json)
    
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_division_proficiency_v2(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_proficiency_v2(UUID, TEXT) TO service_role;

COMMENT ON FUNCTION get_division_proficiency_v2 IS 'Simple proficiency aggregation - returns all subjects with MPS and passing rates';
