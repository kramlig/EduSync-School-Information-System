-- Check grades table structure and learning_area_id values
SELECT 
  g.learning_area_id,
  la.code as la_code,
  la.name as la_name,
  la.school_id = g.school_id as same_school,
  COUNT(*) as grade_count
FROM grades g
LEFT JOIN learning_areas la ON g.learning_area_id = la.id
WHERE g.school_id IN (
  SELECT s.id FROM schools s 
  WHERE s.division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5'
  LIMIT 3
)
GROUP BY g.learning_area_id, la.code, la.name, same_school
ORDER BY la_code
LIMIT 50;
