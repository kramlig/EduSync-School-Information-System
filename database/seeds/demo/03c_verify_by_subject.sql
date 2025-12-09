-- ============================================================================
-- VERIFY GRADES BY SUBJECT (Learning Area)
-- Run this to check if all subjects have grades
-- ============================================================================

-- Count grades by learning area code
SELECT 
  la.code,
  la.name,
  ARRAY_TO_STRING(la.grade_levels, ',') as applicable_grades,
  COUNT(g.id) as grade_count,
  COUNT(DISTINCT g.student_id) as students_with_grades,
  ROUND(AVG(g.q2), 2) as avg_q2
FROM learning_areas la
LEFT JOIN grades g ON g.learning_area_id = la.id
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY la.code, la.name, la.grade_levels
ORDER BY la.code;

-- Summary: which subjects have grades vs don't
SELECT 
  CASE WHEN COUNT(g.id) > 0 THEN 'HAS GRADES' ELSE 'NO GRADES' END as status,
  la.code,
  la.name,
  COUNT(g.id) as grade_count
FROM learning_areas la
LEFT JOIN grades g ON g.learning_area_id = la.id
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY la.code, la.name
ORDER BY grade_count DESC, la.code;
