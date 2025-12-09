-- ============================================================================
-- DIAGNOSTIC: Check what data exists in the database
-- Run this FIRST to understand the current state
-- ============================================================================

-- 1. Check if we have schools
SELECT '1. Schools in Division' as check_point;
SELECT COUNT(*) as school_count FROM schools WHERE division = 'Division of City of Mati';

-- 2. Check if we have students
SELECT '2. Students in Division' as check_point;
SELECT COUNT(*) as student_count 
FROM students st
JOIN schools s ON st.school_id = s.id
WHERE s.division = 'Division of City of Mati';

-- 3. Check if students have sections assigned
SELECT '3. Students WITH sections' as check_point;
SELECT COUNT(*) as students_with_sections
FROM students st
JOIN schools s ON st.school_id = s.id
WHERE s.division = 'Division of City of Mati'
  AND st.section_id IS NOT NULL;

-- 4. Check if learning areas exist
SELECT '4. Learning Areas in Division' as check_point;
SELECT COUNT(*) as learning_area_count
FROM learning_areas la
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati';

-- 5. Check learning areas by code
SELECT '5. Learning Areas by Code' as check_point;
SELECT la.code, COUNT(*) as count
FROM learning_areas la
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY la.code
ORDER BY la.code;

-- 6. Check if grades exist AT ALL
SELECT '6. Total Grades in Division' as check_point;
SELECT COUNT(*) as grade_count
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati';

-- 7. Check grades by learning area code
SELECT '7. Grades by Subject Code' as check_point;
SELECT la.code, COUNT(g.id) as grade_count
FROM learning_areas la
LEFT JOIN grades g ON g.learning_area_id = la.id
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY la.code
ORDER BY grade_count DESC, la.code;

-- 8. Sample: Check one school's data
SELECT '8. Sample School Data' as check_point;
SELECT 
  s.name as school_name,
  (SELECT COUNT(*) FROM students WHERE school_id = s.id) as students,
  (SELECT COUNT(*) FROM students WHERE school_id = s.id AND section_id IS NOT NULL) as students_with_sections,
  (SELECT COUNT(*) FROM learning_areas WHERE school_id = s.id) as learning_areas,
  (SELECT COUNT(*) FROM grades WHERE school_id = s.id) as grades
FROM schools s
WHERE s.division = 'Division of City of Mati'
LIMIT 5;
