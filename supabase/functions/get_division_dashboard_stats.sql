-- RPC Function for Division Dashboard Stats
-- Created: December 8, 2025
-- Purpose: Server-side aggregation for dashboard overview (single API call)

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_division_dashboard_stats(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_dashboard_stats(UUID, UUID[]) TO anon;

-- Test the function
-- SELECT get_division_dashboard_stats('your-division-id-here');
