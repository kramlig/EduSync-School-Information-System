-- Check how divisions work
SELECT '1. Divisions table' as check_point;
SELECT id, name FROM divisions LIMIT 5;

-- Check schools - do they have division_id or division text?
SELECT '2. Sample schools with division info' as check_point;
SELECT id, name, division, division_id
FROM schools
WHERE division = 'Division of City of Mati'
LIMIT 3;

-- Check if division_id is set
SELECT '3. Schools with division_id' as check_point;
SELECT 
  CASE WHEN division_id IS NULL THEN 'No division_id' ELSE 'Has division_id' END as status,
  COUNT(*) as count
FROM schools
WHERE division = 'Division of City of Mati'
GROUP BY CASE WHEN division_id IS NULL THEN 'No division_id' ELSE 'Has division_id' END;
