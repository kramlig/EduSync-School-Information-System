-- ============================================================================
-- REDISTRIBUTE 70 STUDENTS TO SF7 SCHOOLS (SIMPLE EVEN DISTRIBUTION)
-- ============================================================================

-- Check current state
SELECT 'Current students:' as info, COUNT(*) as count FROM students WHERE deleted_at IS NULL;

-- Preview distribution (70 students ÷ 53 schools = ~1-2 per school)
WITH numbered AS (
  SELECT id, name, address, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM students WHERE deleted_at IS NULL
),
schools_numbered AS (
  SELECT id, name as school_name, school_id_number, district,
         ROW_NUMBER() OVER (ORDER BY school_id_number) as school_num
  FROM schools 
  WHERE division = 'Division of City of Mati' AND school_id_number IS NOT NULL
)
SELECT 
  sn.school_id_number,
  sn.school_name,
  sn.district,
  COUNT(n.id) as students_assigned
FROM schools_numbered sn
LEFT JOIN numbered n ON ((n.rn - 1) % 53) + 1 = sn.school_num
GROUP BY sn.school_id_number, sn.school_name, sn.district
ORDER BY sn.district, sn.school_id_number;

-- ============================================================================
-- DO THE UPDATE
-- ============================================================================

DO $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Redistributing students across 53 SF7 schools...';
  
  WITH numbered_students AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM students WHERE deleted_at IS NULL
  ),
  school_list AS (
    SELECT id as school_id, ROW_NUMBER() OVER (ORDER BY school_id_number) as school_num
    FROM schools 
    WHERE division = 'Division of City of Mati' AND school_id_number IS NOT NULL
  )
  UPDATE students s
  SET school_id = sl.school_id,
      section_id = NULL,
      updated_at = NOW()
  FROM numbered_students ns
  JOIN school_list sl ON ((ns.rn - 1) % 53) + 1 = sl.school_num
  WHERE s.id = ns.id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % students', v_updated;
END $$;

-- ============================================================================
-- VERIFY
-- ============================================================================

-- By district
SELECT s.district, COUNT(st.id) as students
FROM schools s
LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- Schools with students
SELECT s.school_id_number, s.name, s.district, COUNT(st.id) as students
FROM schools s
LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.id, s.school_id_number, s.name, s.district
HAVING COUNT(st.id) > 0
ORDER BY s.district, s.school_id_number;

-- Total
SELECT COUNT(*) as total_students FROM students WHERE deleted_at IS NULL;
