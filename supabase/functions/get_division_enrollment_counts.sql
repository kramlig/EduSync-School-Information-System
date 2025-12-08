-- RPC Function for Division Enrollment Summary Counts
-- Created: December 8, 2025
-- Purpose: Single API call for enrollment summary card counts

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_division_enrollment_counts(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_enrollment_counts(UUID, UUID[]) TO anon;
