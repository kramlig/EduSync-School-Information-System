-- Check if grades have learning_area_ids that match learning_areas for the SAME school
-- This is the KEY diagnostic - grades.learning_area_id should match learning_areas.id for the same school

WITH sample_school AS (
  SELECT id FROM schools 
  WHERE division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5' 
  LIMIT 1
),
school_grades AS (
  SELECT 
    g.id as grade_id,
    g.student_id,
    g.school_id as grade_school_id,
    g.learning_area_id,
    la.id as la_id,
    la.school_id as la_school_id,
    la.code as la_code,
    la.name as la_name,
    CASE WHEN g.school_id = la.school_id THEN 'SAME' ELSE 'DIFFERENT' END as school_match
  FROM grades g
  LEFT JOIN learning_areas la ON g.learning_area_id = la.id
  WHERE g.school_id = (SELECT id FROM sample_school)
)
SELECT 
  la_code,
  la_name,
  school_match,
  COUNT(*) as grade_count
FROM school_grades
GROUP BY la_code, la_name, school_match
ORDER BY la_code;
