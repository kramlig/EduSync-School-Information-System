-- Check the actual learning area codes and names in the database
SELECT DISTINCT
  code,
  name,
  UPPER(code) as code_upper,
  UPPER(name) as name_upper,
  grade_levels
FROM learning_areas la
JOIN schools s ON la.school_id = s.id
WHERE s.division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5'
ORDER BY code
LIMIT 30;
