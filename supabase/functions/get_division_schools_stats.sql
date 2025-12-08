-- RPC Function for Division Schools Summary
-- Created: December 8, 2025
-- Purpose: Server-side aggregation for school stats (single API call)

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_division_schools_stats(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_schools_stats(UUID, UUID[]) TO anon;

-- Test the function
-- SELECT get_division_schools_stats('your-division-id-here');
