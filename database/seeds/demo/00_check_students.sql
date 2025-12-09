-- Check student enrollment statuses
SELECT enrollment_status, COUNT(*) as count
FROM students st
JOIN schools s ON st.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY enrollment_status;

-- Check if students have sections via section_id
SELECT 
  CASE WHEN section_id IS NULL THEN 'No Section' ELSE 'Has Section' END as status,
  COUNT(*) as count
FROM students st
JOIN schools s ON st.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY CASE WHEN section_id IS NULL THEN 'No Section' ELSE 'Has Section' END;

-- Check sections table - do sections have grade_level?
SELECT sec.grade_level, COUNT(*) as section_count
FROM sections sec
JOIN schools s ON sec.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY sec.grade_level
ORDER BY sec.grade_level;
