-- ============================================================================
-- REDISTRIBUTE STUDENTS TO SF7 SCHOOLS
-- Assigns existing students to the 53 official Mati schools
-- ============================================================================

-- First, let's see current state
SELECT 'Current student distribution:' as info;
SELECT 
  COUNT(*) as total_students,
  COUNT(DISTINCT school_id) as schools_with_students
FROM students 
WHERE deleted_at IS NULL;

-- Get SF7 school IDs
WITH sf7_schools AS (
  SELECT id, name, school_id_number, district,
         ROW_NUMBER() OVER (ORDER BY school_id_number) as school_num
  FROM schools 
  WHERE division = 'Division of City of Mati'
    AND school_id_number IS NOT NULL
  ORDER BY school_id_number
),
-- Number all students
numbered_students AS (
  SELECT id as student_id, 
         ROW_NUMBER() OVER (ORDER BY id) as student_num
  FROM students 
  WHERE deleted_at IS NULL
)
-- Show distribution plan
SELECT 
  s.name as school_name,
  s.school_id_number,
  s.district,
  COUNT(ns.student_id) as planned_students
FROM sf7_schools s
LEFT JOIN numbered_students ns ON (ns.student_num % 53) + 1 = s.school_num
GROUP BY s.id, s.name, s.school_id_number, s.district
ORDER BY s.district, s.school_id_number;

-- ============================================================================
-- ACTUAL UPDATE - Run this after reviewing the plan above
-- ============================================================================

DO $$
DECLARE
  v_total_students INTEGER;
  v_total_schools INTEGER;
  v_updated INTEGER := 0;
BEGIN
  -- Count students and schools
  SELECT COUNT(*) INTO v_total_students FROM students WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_total_schools FROM schools WHERE division = 'Division of City of Mati' AND school_id_number IS NOT NULL;
  
  RAISE NOTICE 'Redistributing % students across % SF7 schools...', v_total_students, v_total_schools;
  
  -- Create temp table with school assignments
  CREATE TEMP TABLE school_assignments AS
  SELECT id as school_id, ROW_NUMBER() OVER (ORDER BY school_id_number) as school_num
  FROM schools 
  WHERE division = 'Division of City of Mati' AND school_id_number IS NOT NULL;
  
  -- Create temp table with student numbers
  CREATE TEMP TABLE student_numbers AS
  SELECT id as student_id, ROW_NUMBER() OVER (ORDER BY id) as student_num
  FROM students WHERE deleted_at IS NULL;
  
  -- Update students to new schools using modulo distribution
  UPDATE students s
  SET school_id = sa.school_id,
      section_id = NULL,  -- Clear old section since schools changed
      updated_at = NOW()
  FROM student_numbers sn
  JOIN school_assignments sa ON ((sn.student_num - 1) % v_total_schools) + 1 = sa.school_num
  WHERE s.id = sn.student_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- Cleanup
  DROP TABLE school_assignments;
  DROP TABLE student_numbers;
  
  RAISE NOTICE '✅ Updated % students', v_updated;
  RAISE NOTICE '📊 Average per school: % students', v_updated / v_total_schools;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check distribution by district
SELECT 
  s.district,
  COUNT(st.id) as student_count
FROM schools s
LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- Check distribution per school
SELECT 
  s.school_id_number,
  s.name,
  s.district,
  COUNT(st.id) as student_count
FROM schools s
LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.id, s.school_id_number, s.name, s.district
ORDER BY s.district, s.school_id_number;

-- Total students
SELECT COUNT(*) as total_students FROM students WHERE deleted_at IS NULL;
