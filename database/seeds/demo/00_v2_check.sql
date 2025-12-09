-- Check what the V2 service query should return
-- This mimics the Supabase query with joins

SELECT 
  g.school_id,
  g.student_id,
  g.q1, g.q2,
  st.section_id,
  st.enrollment_status,
  st.deleted_at,
  la.code as la_code
FROM grades g
JOIN students st ON g.student_id = st.id
JOIN learning_areas la ON g.learning_area_id = la.id
JOIN schools s ON g.school_id = s.id
WHERE s.division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5'
  AND st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
LIMIT 20;
