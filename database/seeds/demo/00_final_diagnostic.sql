-- FINAL DIAGNOSTIC: Check grades by learning area CODE
-- This should match what the service queries

SELECT 
  la.code,
  la.name,
  COUNT(DISTINCT g.student_id) as students_with_grades,
  COUNT(g.id) as total_grades,
  ROUND(AVG(g.q2), 2) as avg_q2
FROM learning_areas la
JOIN grades g ON g.learning_area_id = la.id
JOIN schools s ON la.school_id = s.id
WHERE s.division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5'
  AND g.school_year = '2024-2025'
  AND g.q2 IS NOT NULL
GROUP BY la.code, la.name
ORDER BY la.code;

-- Also check elementary only (grades 1-6)
SELECT 'Elementary Students by Grade' as check_point;
SELECT 
  sec.grade_level,
  COUNT(DISTINCT st.id) as student_count
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN schools s ON st.school_id = s.id
WHERE s.division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5'
  AND st.enrollment_status = 'enrolled'
  AND st.deleted_at IS NULL
  AND sec.grade_level BETWEEN 1 AND 6
GROUP BY sec.grade_level
ORDER BY sec.grade_level;
