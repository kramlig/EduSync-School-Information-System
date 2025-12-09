-- ============================================================================
-- REDISTRIBUTE STUDENTS TO SF7 SCHOOLS BY BARANGAY/ADDRESS
-- Matches students to schools based on location keywords
-- ============================================================================

-- Step 1: Create barangay-to-school mapping table
DO $$
BEGIN
  DROP TABLE IF EXISTS barangay_school_mapping;
  
  CREATE TEMP TABLE barangay_school_mapping (
    barangay_pattern TEXT,
    school_id UUID,
    school_name TEXT,
    district TEXT
  );
  
  -- Mati Central barangays → schools
  INSERT INTO barangay_school_mapping (barangay_pattern, school_id, school_name, district)
  SELECT 'badas', id, name, district FROM schools WHERE school_id_number = '129374' UNION ALL
  SELECT 'baso', id, name, district FROM schools WHERE school_id_number = '129375' UNION ALL
  SELECT 'belsonda', id, name, district FROM schools WHERE school_id_number = '129376' UNION ALL
  SELECT 'bliss', id, name, district FROM schools WHERE school_id_number = '129377' UNION ALL
  SELECT 'bagong lipunan', id, name, district FROM schools WHERE school_id_number = '129377' UNION ALL
  SELECT 'rabat', id, name, district FROM schools WHERE school_id_number = '129380' UNION ALL
  SELECT 'rocamora', id, name, district FROM schools WHERE school_id_number = '129380' UNION ALL
  SELECT 'poblacion', id, name, district FROM schools WHERE school_id_number = '129380' UNION ALL
  SELECT 'central', id, name, district FROM schools WHERE school_id_number = '129381' UNION ALL
  SELECT 'sudlon', id, name, district FROM schools WHERE school_id_number = '129384' UNION ALL
  SELECT 'tagawisan', id, name, district FROM schools WHERE school_id_number = '129385' UNION ALL
  SELECT 'onotan', id, name, district FROM schools WHERE school_id_number = '129386' UNION ALL
  SELECT 'daganio', id, name, district FROM schools WHERE school_id_number = '129386' UNION ALL
  SELECT 'tagbobolo', id, name, district FROM schools WHERE school_id_number = '129386' UNION ALL
  SELECT 'licop', id, name, district FROM schools WHERE school_id_number = '500454' UNION ALL
  SELECT 'culian', id, name, district FROM schools WHERE school_id_number = '501424' UNION ALL
  
  -- Mati North barangays → schools
  SELECT 'bobon', id, name, district FROM schools WHERE school_id_number = '129390' UNION ALL
  SELECT 'buso', id, name, district FROM schools WHERE school_id_number = '129391' UNION ALL
  SELECT 'cabubuanan', id, name, district FROM schools WHERE school_id_number = '129392' UNION ALL
  SELECT 'cangusan', id, name, district FROM schools WHERE school_id_number = '129393' UNION ALL
  SELECT 'dahican', id, name, district FROM schools WHERE school_id_number = '129395' UNION ALL
  SELECT 'langka', id, name, district FROM schools WHERE school_id_number = '129396' UNION ALL
  SELECT 'langilan', id, name, district FROM schools WHERE school_id_number = '129397' UNION ALL
  SELECT 'lawigan', id, name, district FROM schools WHERE school_id_number = '129398' UNION ALL
  SELECT 'libudon', id, name, district FROM schools WHERE school_id_number = '129399' UNION ALL
  SELECT 'matiao', id, name, district FROM schools WHERE school_id_number = '129400' UNION ALL
  SELECT 'mayo', id, name, district FROM schools WHERE school_id_number = '129401' UNION ALL
  SELECT 'sta. cruz', id, name, district FROM schools WHERE school_id_number = '129402' UNION ALL
  SELECT 'santa cruz', id, name, district FROM schools WHERE school_id_number = '129402' UNION ALL
  SELECT 'tagabakid', id, name, district FROM schools WHERE school_id_number = '129403' UNION ALL
  SELECT 'taguibo', id, name, district FROM schools WHERE school_id_number = '129405' UNION ALL
  SELECT 'tamia', id, name, district FROM schools WHERE school_id_number = '129406' UNION ALL
  SELECT 'tamisan', id, name, district FROM schools WHERE school_id_number = '129407' UNION ALL
  SELECT 'tinagacan', id, name, district FROM schools WHERE school_id_number = '129408' UNION ALL
  SELECT 'sainz', id, name, district FROM schools WHERE school_id_number = '129409' UNION ALL
  SELECT 'bugakan', id, name, district FROM schools WHERE school_id_number = '502726' UNION ALL
  SELECT 'tagbinonga', id, name, district FROM schools WHERE school_id_number = '502727' UNION ALL
  
  -- Mati South barangays → schools
  SELECT 'catmonan', id, name, district FROM schools WHERE school_id_number = '102157' UNION ALL
  SELECT 'talucanga', id, name, district FROM schools WHERE school_id_number = '102164' UNION ALL
  SELECT 'calapagan', id, name, district FROM schools WHERE school_id_number = '129410' UNION ALL
  SELECT 'capisan', id, name, district FROM schools WHERE school_id_number = '129412' UNION ALL
  SELECT 'dawan', id, name, district FROM schools WHERE school_id_number = '129413' UNION ALL
  SELECT 'don martin', id, name, district FROM schools WHERE school_id_number = '129414' UNION ALL
  SELECT 'macambol', id, name, district FROM schools WHERE school_id_number = '129417' UNION ALL
  SELECT 'magum', id, name, district FROM schools WHERE school_id_number = '129418' UNION ALL
  SELECT 'magsaysay', id, name, district FROM schools WHERE school_id_number = '129419' UNION ALL
  SELECT 'sanghay', id, name, district FROM schools WHERE school_id_number = '129420' UNION ALL
  SELECT 'sinayawan', id, name, district FROM schools WHERE school_id_number = '129421' UNION ALL
  SELECT 'wagon', id, name, district FROM schools WHERE school_id_number = '129422' UNION ALL
  SELECT 'cabuaya', id, name, district FROM schools WHERE school_id_number = '501085' UNION ALL
  SELECT 'lanca', id, name, district FROM schools WHERE school_id_number = '501086' UNION ALL
  SELECT 'luban', id, name, district FROM schools WHERE school_id_number = '501087';

  RAISE NOTICE 'Created barangay-school mapping table';
END $$;

-- ============================================================================
-- Step 2: Preview which students will match to which schools
-- ============================================================================

-- Show sample of address patterns
SELECT 'Sample student addresses:' as info;
SELECT DISTINCT LOWER(address) as address_pattern, COUNT(*) as count
FROM students 
WHERE address IS NOT NULL AND deleted_at IS NULL
GROUP BY LOWER(address)
ORDER BY count DESC
LIMIT 20;

-- Preview matching
SELECT 'Preview of barangay matches:' as info;
WITH matched AS (
  SELECT 
    s.id as student_id,
    s.address,
    bsm.school_name,
    bsm.district
  FROM students s
  LEFT JOIN barangay_school_mapping bsm 
    ON LOWER(s.address) LIKE '%' || bsm.barangay_pattern || '%'
  WHERE s.deleted_at IS NULL
)
SELECT 
  COALESCE(school_name, 'UNMATCHED') as school,
  district,
  COUNT(*) as student_count
FROM matched
GROUP BY school_name, district
ORDER BY student_count DESC
LIMIT 30;

-- ============================================================================
-- Step 3: UPDATE STUDENTS (Run after reviewing preview)
-- ============================================================================

DO $$
DECLARE
  v_matched INTEGER := 0;
  v_unmatched INTEGER := 0;
  v_total INTEGER := 0;
  v_fallback_schools UUID[];
BEGIN
  SELECT COUNT(*) INTO v_total FROM students WHERE deleted_at IS NULL;
  RAISE NOTICE 'Total students to process: %', v_total;
  
  -- Get array of all SF7 school IDs for fallback
  SELECT ARRAY_AGG(id ORDER BY school_id_number) INTO v_fallback_schools
  FROM schools WHERE division = 'Division of City of Mati' AND school_id_number IS NOT NULL;
  
  -- Step 3a: Update students that match by barangay
  WITH matched_students AS (
    SELECT DISTINCT ON (s.id)
      s.id as student_id,
      bsm.school_id as new_school_id
    FROM students s
    JOIN barangay_school_mapping bsm 
      ON LOWER(COALESCE(s.address, '')) LIKE '%' || bsm.barangay_pattern || '%'
    WHERE s.deleted_at IS NULL
    ORDER BY s.id, LENGTH(bsm.barangay_pattern) DESC -- Prefer longer/more specific matches
  )
  UPDATE students s
  SET school_id = ms.new_school_id,
      section_id = NULL,
      updated_at = NOW()
  FROM matched_students ms
  WHERE s.id = ms.student_id;
  
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  RAISE NOTICE 'Matched by barangay: % students', v_matched;
  
  -- Step 3b: Distribute unmatched students evenly across all schools
  v_unmatched := v_total - v_matched;
  RAISE NOTICE 'Unmatched students to distribute: %', v_unmatched;
  
  WITH unmatched_numbered AS (
    SELECT 
      s.id as student_id,
      ROW_NUMBER() OVER (ORDER BY s.id) as rn
    FROM students s
    -- Students that didn't match any barangay (still have old school_id or NULL)
    WHERE s.deleted_at IS NULL
      AND s.school_id NOT IN (
        SELECT id FROM schools WHERE division = 'Division of City of Mati' AND school_id_number IS NOT NULL
      )
  )
  UPDATE students s
  SET school_id = v_fallback_schools[((un.rn - 1) % array_length(v_fallback_schools, 1)) + 1],
      section_id = NULL,
      updated_at = NOW()
  FROM unmatched_numbered un
  WHERE s.id = un.student_id;
  
  GET DIAGNOSTICS v_unmatched = ROW_COUNT;
  RAISE NOTICE 'Distributed evenly: % students', v_unmatched;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ REDISTRIBUTION COMPLETE!';
  RAISE NOTICE 'Matched by barangay: %', v_matched;
  RAISE NOTICE 'Distributed evenly: %', v_unmatched;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Distribution by district
SELECT 
  s.district,
  COUNT(st.id) as student_count
FROM schools s
LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- Top 10 schools by student count
SELECT 
  s.school_id_number,
  s.name,
  s.district,
  COUNT(st.id) as student_count
FROM schools s
LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.id, s.school_id_number, s.name, s.district
ORDER BY student_count DESC
LIMIT 10;

-- Total verification
SELECT 
  'Total Students' as metric,
  COUNT(*) as count
FROM students 
WHERE deleted_at IS NULL;
