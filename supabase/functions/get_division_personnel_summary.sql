-- RPC Function for Division Personnel Summary (SF7)
-- Created: December 8, 2025
-- Purpose: Server-side aggregation for fast SF7 loading (single API call)

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
  teacher_data AS (
    SELECT 
      t.school_id,
      COALESCE(t.position, 'other') as position,
      COALESCE(t.employment_status, 'unknown') as employment_status
    FROM teachers t
    INNER JOIN filtered_schools fs ON t.school_id = fs.id
    WHERE t.deleted_at IS NULL
  ),
  -- Aggregate by position
  position_agg AS (
    SELECT 
      position,
      COUNT(*) as count
    FROM teacher_data
    GROUP BY position
  ),
  -- Aggregate by status
  status_agg AS (
    SELECT 
      employment_status,
      COUNT(*) as count
    FROM teacher_data
    GROUP BY employment_status
  ),
  -- Aggregate by district
  district_agg AS (
    SELECT 
      COALESCE(fs.district, 'Unassigned') as district,
      COUNT(DISTINCT fs.id) as school_count,
      COUNT(td.school_id) as personnel_count
    FROM filtered_schools fs
    LEFT JOIN teacher_data td ON fs.id = td.school_id
    GROUP BY COALESCE(fs.district, 'Unassigned')
  ),
  -- Per-school summaries
  school_summaries AS (
    SELECT 
      fs.id as school_id,
      fs.name as school_name,
      fs.district,
      COUNT(td.school_id) as total_personnel,
      jsonb_object_agg(
        COALESCE(td.position, 'other'), 
        COALESCE(position_counts.cnt, 0)
      ) FILTER (WHERE td.position IS NOT NULL) as by_position,
      jsonb_object_agg(
        COALESCE(td.employment_status, 'unknown'), 
        COALESCE(status_counts.cnt, 0)
      ) FILTER (WHERE td.employment_status IS NOT NULL) as by_status
    FROM filtered_schools fs
    LEFT JOIN teacher_data td ON fs.id = td.school_id
    LEFT JOIN (
      SELECT school_id, position, COUNT(*) as cnt
      FROM teacher_data
      GROUP BY school_id, position
    ) position_counts ON fs.id = position_counts.school_id AND td.position = position_counts.position
    LEFT JOIN (
      SELECT school_id, employment_status, COUNT(*) as cnt
      FROM teacher_data
      GROUP BY school_id, employment_status
    ) status_counts ON fs.id = status_counts.school_id AND td.employment_status = status_counts.employment_status
    GROUP BY fs.id, fs.name, fs.district
  ),
  -- Simpler per-school calculation
  school_data AS (
    SELECT 
      fs.id as school_id,
      fs.name as school_name,
      fs.district,
      (SELECT COUNT(*) FROM teacher_data WHERE school_id = fs.id) as total_personnel,
      (
        SELECT jsonb_object_agg(position, cnt)
        FROM (
          SELECT position, COUNT(*) as cnt
          FROM teacher_data
          WHERE school_id = fs.id
          GROUP BY position
        ) pos_sub
      ) as by_position,
      (
        SELECT jsonb_object_agg(employment_status, cnt)
        FROM (
          SELECT employment_status, COUNT(*) as cnt
          FROM teacher_data
          WHERE school_id = fs.id
          GROUP BY employment_status
        ) status_sub
      ) as by_status
    FROM filtered_schools fs
  )
  SELECT json_build_object(
    'total_schools', (SELECT COUNT(*) FROM filtered_schools),
    'total_personnel', (SELECT COUNT(*) FROM teacher_data),
    'by_position', (SELECT json_object_agg(position, count) FROM position_agg),
    'by_status', (SELECT json_object_agg(employment_status, count) FROM status_agg),
    'by_district', (
      SELECT json_object_agg(
        district, 
        json_build_object('schools', school_count, 'personnel', personnel_count)
      ) 
      FROM district_agg
    ),
    'schools', (
      SELECT json_agg(
        json_build_object(
          'school_id', school_id,
          'school_name', school_name,
          'district', district,
          'total_personnel', total_personnel,
          'by_position', COALESCE(by_position, '{}'::jsonb),
          'by_status', COALESCE(by_status, '{}'::jsonb)
        )
      )
      FROM school_data
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_division_personnel_summary(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_division_personnel_summary(UUID, UUID[]) TO anon;

-- Test the function
-- SELECT get_division_personnel_summary('your-division-id-here');
