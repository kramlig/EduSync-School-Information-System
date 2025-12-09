-- ============================================================================
-- SEED LEARNING AREAS (SUBJECTS) FOR ALL MATI DIVISION SCHOOLS
-- Creates standard DepEd learning areas for each school
-- Run AFTER schools are seeded
-- ============================================================================

DO $$
DECLARE
  v_school RECORD;
  v_areas_created INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting learning areas seeding for Division of City of Mati...';
  
  -- Clear existing grades first (FK dependency)
  DELETE FROM grades WHERE school_id IN (
    SELECT id FROM schools WHERE division = 'Division of City of Mati'
  );
  RAISE NOTICE 'Cleared existing grades';
  
  -- Clear existing learning areas for Mati schools
  DELETE FROM learning_areas WHERE school_id IN (
    SELECT id FROM schools WHERE division = 'Division of City of Mati'
  );
  RAISE NOTICE 'Cleared existing learning areas';
  
  -- Loop through each school
  FOR v_school IN 
    SELECT s.id, s.name, s.school_id_number,
           CASE 
             WHEN s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' OR s.name ILIKE '%Arts%' 
                  OR s.name ILIKE '%Voc%' OR s.name ILIKE '%Science High%' OR s.name ILIKE '%Comprehensive%'
             THEN 'Secondary'
             WHEN s.name ILIKE '%Integrated%' OR s.name ILIKE '% IS'
             THEN 'Integrated'
             ELSE 'Elementary'
           END as school_type
    FROM schools s
    WHERE s.division = 'Division of City of Mati'
      AND s.school_id_number IS NOT NULL
    ORDER BY s.school_id_number
  LOOP
    
    -- ===============================
    -- ELEMENTARY Learning Areas (Grades 1-6)
    -- ===============================
    IF v_school.school_type IN ('Elementary', 'Integrated') THEN
      
      -- Language (Grades 1-3) - As per Division Report
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'LANG', 'Language', ARRAY[1,2,3], 1, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- Mother Tongue (Grades 1-3 only)
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'MTB', 'Mother Tongue', ARRAY[1,2,3], 2, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- Reading & Literacy (Grades 1-6) - As per Division Report
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'READ', 'Reading & Literacy', ARRAY[1,2,3,4,5,6], 3, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- English
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'ENG', 'English', ARRAY[1,2,3,4,5,6], 4, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- Mathematics
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'MATH', 'Mathematics', ARRAY[1,2,3,4,5,6], 5, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- Science (Grades 3-6)
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'SCI', 'Science', ARRAY[3,4,5,6], 6, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- Filipino
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'FIL', 'Filipino', ARRAY[1,2,3,4,5,6], 7, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- Araling Panlipunan / Makabansa
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'AP', 'Makabansa / Araling Panlipunan', ARRAY[1,2,3,4,5,6], 8, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- Edukasyon sa Pagpapakatao / GMRC
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'ESP', 'EsP / GMRC', ARRAY[1,2,3,4,5,6], 9, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- EPP/TLE (Grades 4-6)
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'EPP', 'EPP/TLE', ARRAY[4,5,6], 10, true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
      -- MAPEH (Music, Arts, Physical Education, Health) - Composite subject
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_composite, components, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'MAPEH', 'MAPEH', ARRAY[1,2,3,4,5,6], 11, true, ARRAY['Music', 'Arts', 'Physical Education', 'Health'], true, NOW(), NOW());
      v_areas_created := v_areas_created + 1;
      
    END IF;
    
    -- ===============================
    -- SECONDARY Learning Areas (Grades 7-12)
    -- ===============================
    IF v_school.school_type IN ('Secondary', 'Integrated') THEN
      
      -- Filipino (JHS & SHS)
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'FIL-SEC', 'Filipino', ARRAY[7,8,9,10,11,12], 1, true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
      -- English
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'ENG-SEC', 'English', ARRAY[7,8,9,10,11,12], 2, true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
      -- Mathematics
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'MATH-SEC', 'Mathematics', ARRAY[7,8,9,10,11,12], 3, true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
      -- Science
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'SCI-SEC', 'Science', ARRAY[7,8,9,10,11,12], 4, true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
      -- Araling Panlipunan
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'AP-SEC', 'Araling Panlipunan', ARRAY[7,8,9,10], 5, true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
      -- Edukasyon sa Pagpapakatao
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'ESP-SEC', 'Edukasyon sa Pagpapakatao', ARRAY[7,8,9,10], 6, true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
      -- MAPEH (JHS only)
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_composite, components, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'MAPEH-SEC', 'Music, Arts, Physical Education, and Health', ARRAY[7,8,9,10], 7, true, ARRAY['Music', 'Arts', 'Physical Education', 'Health'], true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
      -- TLE (Technology and Livelihood Education)
      INSERT INTO learning_areas (id, school_id, code, name, grade_levels, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_school.id, 'TLE', 'Technology and Livelihood Education', ARRAY[7,8,9,10], 8, true, NOW(), NOW())
      ON CONFLICT (school_id, code) DO NOTHING;
      v_areas_created := v_areas_created + 1;
      
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LEARNING AREAS SEEDING COMPLETE!';
  RAISE NOTICE 'Total Learning Areas Created: %', v_areas_created;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Learning areas by school type
SELECT 
  CASE 
    WHEN s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' THEN 'Secondary'
    WHEN s.name ILIKE '%Integrated%' THEN 'Integrated'
    ELSE 'Elementary'
  END as school_type,
  COUNT(DISTINCT s.id) as schools,
  COUNT(la.id) as total_subjects
FROM schools s
LEFT JOIN learning_areas la ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY 1
ORDER BY 1;

-- Sample learning areas
SELECT la.code, la.name, s.name as school_name
FROM learning_areas la
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
ORDER BY s.name, la.display_order
LIMIT 20;
