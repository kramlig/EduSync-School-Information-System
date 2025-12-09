-- Check how students relate to sections
SELECT 
  st.id as student_id,
  st.section_id,
  sec.id as section_id_from_join,
  sec.grade_level
FROM students st
LEFT JOIN sections sec ON st.section_id = sec.id
JOIN schools s ON st.school_id = s.id
WHERE s.division_id = '36212308-a915-4ffb-84b5-e9e9900b3bc5'
  AND st.enrollment_status = 'enrolled'
  AND st.deleted_at IS NULL
LIMIT 5;
