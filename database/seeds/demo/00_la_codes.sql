-- Check what learning area codes exist in the database
-- This will tell us what codes we need to match in the service

SELECT DISTINCT 
  la.code,
  la.name,
  array_agg(DISTINCT la.grade_levels::text) as grade_levels_samples,
  COUNT(DISTINCT la.school_id) as school_count,
  COUNT(DISTINCT g.id) as grade_records
FROM learning_areas la
JOIN schools s ON la.school_id = s.id
LEFT JOIN grades g ON g.learning_area_id = la.id
WHERE s.division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5'
GROUP BY la.code, la.name
ORDER BY la.code;
