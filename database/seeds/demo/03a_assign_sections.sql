-- ============================================================================
-- SEED DEMO GRADES (Q1 & Q2) FOR MATI DIVISION SCHOOLS - OPTIMIZED
-- Uses batch inserts instead of row-by-row loops for performance
-- ============================================================================

-- Step 1: Assign students to sections (fast batch update)
WITH section_assignments AS (
  SELECT 
    st.id as student_id,
    (
      SELECT sec.id 
      FROM sections sec 
      WHERE sec.school_id = st.school_id 
        AND sec.grade_level = st.grade_level
        AND sec.school_year = '2024-2025'
      ORDER BY sec.name
      LIMIT 1
    ) as section_id
  FROM students st
  JOIN schools s ON st.school_id = s.id
  WHERE s.division = 'Division of City of Mati'
    AND st.section_id IS NULL
)
UPDATE students st
SET section_id = sa.section_id, updated_at = NOW()
FROM section_assignments sa
WHERE st.id = sa.student_id
  AND sa.section_id IS NOT NULL;

-- Check assignment
SELECT 'Students assigned to sections' as status, COUNT(*) as count
FROM students st
JOIN schools s ON st.school_id = s.id
WHERE s.division = 'Division of City of Mati'
  AND st.section_id IS NOT NULL;
