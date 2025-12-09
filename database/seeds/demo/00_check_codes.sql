-- Check EXACT learning area codes in database
SELECT DISTINCT la.code, la.name
FROM learning_areas la
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
ORDER BY la.code;
