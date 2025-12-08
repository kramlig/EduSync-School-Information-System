-- ============================================================================
-- Seed Students, Sections, and SF5 Promotion Records for Division of City of Mati
-- Run this SQL in Supabase Dashboard SQL Editor AFTER running seed_mati_city_division.sql
-- ============================================================================
-- This script creates:
-- 1. Sections for all grades (1-12) for each school
-- 2. Students distributed across sections
-- 3. Promotion records for SY 2024-2025 and 2025-2026
-- ============================================================================
-- Expected data volume:
-- - Sections: ~500-600 (about 8-10 per school)
-- - Students: ~6,000-8,000 (about 80-120 per school)
-- - Promotion Records: ~12,000-16,000 (2 school years)
-- ============================================================================

DO $$
DECLARE
  -- Division ID
  mati_division_id UUID;
  
  -- Loop variables
  school_rec RECORD;
  section_rec RECORD;
  grade INT;
  section_num INT;
  student_num INT;
  
  -- Generated IDs
  new_section_id UUID;
  new_student_id UUID;
  
  -- Counters
  total_sections INT := 0;
  total_students INT := 0;
  total_promotions INT := 0;
  
  -- Section names by grade level category
  elem_section_names TEXT[] := ARRAY['Sampaguita', 'Rose', 'Dahlia', 'Sunflower', 'Orchid', 'Jasmine', 'Lily', 'Tulip'];
  jhs_section_names TEXT[] := ARRAY['Rizal', 'Bonifacio', 'Mabini', 'Luna', 'Del Pilar', 'Jacinto', 'Silang', 'Aguinaldo'];
  shs_section_names TEXT[] := ARRAY['Einstein', 'Newton', 'Darwin', 'Curie', 'Hawking', 'Tesla', 'Edison', 'Galileo'];
  
  -- Student name arrays
  male_firstnames TEXT[] := ARRAY['Juan', 'Pedro', 'Jose', 'Carlos', 'Miguel', 'Luis', 'Antonio', 'Ricardo', 'Fernando', 'Manuel',
    'Gabriel', 'Rafael', 'Daniel', 'David', 'Mark', 'John', 'James', 'Michael', 'Robert', 'William',
    'Emmanuel', 'Christian', 'Angelo', 'Francis', 'Kenneth', 'Bryan', 'Kevin', 'Ryan', 'Jerome', 'Vincent'];
  female_firstnames TEXT[] := ARRAY['Maria', 'Ana', 'Rosa', 'Carmen', 'Teresa', 'Elena', 'Sofia', 'Isabella', 'Lucia', 'Gabriela',
    'Patricia', 'Angela', 'Jennifer', 'Jessica', 'Sarah', 'Mary', 'Elizabeth', 'Linda', 'Barbara', 'Susan',
    'Michelle', 'Nicole', 'Christine', 'Katherine', 'Stephanie', 'Andrea', 'Melissa', 'Amanda', 'Ashley', 'Rachel'];
  lastnames TEXT[] := ARRAY['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Gonzales', 'Rodriguez', 'Flores', 'Martinez', 'Torres',
    'Rivera', 'Ramos', 'Mendoza', 'Castillo', 'Morales', 'Aquino', 'Valdez', 'Santiago', 'Pascual', 'Mercado',
    'Villanueva', 'Fernando', 'Lopez', 'Perez', 'Hernandez', 'Ramirez', 'Diaz', 'Aguilar', 'Navarro', 'Salazar'];
  
  -- Random variables
  rand_gender TEXT;
  rand_firstname TEXT;
  rand_lastname TEXT;
  rand_status TEXT;
  rand_average DECIMAL(5,2);
  students_per_section INT;
  school_type TEXT;
  min_grade INT;
  max_grade INT;
  lrn_counter BIGINT := 300000000001; -- Start LRN counter for Mati

BEGIN
  -- ========================================
  -- PART 0: GET DIVISION ID
  -- ========================================
  
  SELECT id INTO mati_division_id 
  FROM divisions 
  WHERE code = 'DIV-MATI-CITY';
  
  IF mati_division_id IS NULL THEN
    RAISE EXCEPTION 'Division of City of Mati not found! Run seed_mati_city_division.sql first.';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seeding Students & SF5 for Division of City of Mati';
  RAISE NOTICE 'Division ID: %', mati_division_id;
  RAISE NOTICE '========================================';

  -- ========================================
  -- PART 1: CREATE SECTIONS FOR ALL SCHOOLS
  -- ========================================
  
  RAISE NOTICE 'Creating sections for all schools...';
  
  FOR school_rec IN 
    SELECT id, name, school_id_number 
    FROM schools 
    WHERE division_id = mati_division_id 
      AND deleted_at IS NULL
    ORDER BY name
  LOOP
    -- Determine school type based on name
    IF school_rec.name ILIKE '%National High School%' OR school_rec.name ILIKE '%NHS%' THEN
      school_type := 'secondary';
      min_grade := 7;
      max_grade := 12;
    ELSIF school_rec.name ILIKE '%Integrated%' THEN
      school_type := 'integrated';
      min_grade := 1;
      max_grade := 12;
    ELSE
      school_type := 'elementary';
      min_grade := 1;
      max_grade := 6;
    END IF;
    
    -- Create sections for each applicable grade level
    FOR grade IN min_grade..max_grade LOOP
      -- 1-2 sections per grade for smaller schools
      FOR section_num IN 1..GREATEST(1, LEAST(2, CEIL(random() * 2)::INT)) LOOP
        -- Choose section name based on grade level
        IF grade <= 6 THEN
          INSERT INTO sections (school_id, name, grade_level, school_year, capacity)
          VALUES (
            school_rec.id,
            elem_section_names[((grade - 1) * 2 + section_num - 1) % 8 + 1],
            grade,
            '2025-2026',
            40
          )
          ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
          RETURNING id INTO new_section_id;
        ELSIF grade <= 10 THEN
          INSERT INTO sections (school_id, name, grade_level, school_year, capacity)
          VALUES (
            school_rec.id,
            jhs_section_names[((grade - 7) * 2 + section_num - 1) % 8 + 1],
            grade,
            '2025-2026',
            45
          )
          ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
          RETURNING id INTO new_section_id;
        ELSE
          INSERT INTO sections (school_id, name, grade_level, school_year, capacity)
          VALUES (
            school_rec.id,
            shs_section_names[((grade - 11) * 2 + section_num - 1) % 8 + 1],
            grade,
            '2025-2026',
            50
          )
          ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
          RETURNING id INTO new_section_id;
        END IF;
        
        IF new_section_id IS NOT NULL THEN
          total_sections := total_sections + 1;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created % sections', total_sections;

  -- ========================================
  -- PART 2: CREATE STUDENTS FOR ALL SECTIONS
  -- ========================================
  
  RAISE NOTICE 'Creating students for all sections...';
  
  FOR section_rec IN 
    SELECT s.id as section_id, s.school_id, s.grade_level, s.name as section_name, sch.name as school_name
    FROM sections s
    JOIN schools sch ON s.school_id = sch.id
    WHERE sch.division_id = mati_division_id 
      AND s.school_year = '2025-2026'
      AND s.deleted_at IS NULL
    ORDER BY sch.name, s.grade_level
  LOOP
    -- 20-35 students per section
    students_per_section := 20 + floor(random() * 16)::INT;
    
    FOR student_num IN 1..students_per_section LOOP
      -- Random gender
      IF random() < 0.5 THEN
        rand_gender := 'Male';
        rand_firstname := male_firstnames[floor(random() * 30 + 1)::INT];
      ELSE
        rand_gender := 'Female';
        rand_firstname := female_firstnames[floor(random() * 30 + 1)::INT];
      END IF;
      
      rand_lastname := lastnames[floor(random() * 30 + 1)::INT];
      
      -- Insert student
      INSERT INTO students (
        school_id,
        lrn,
        name,
        first_name,
        last_name,
        gender,
        date_of_birth,
        section_id,
        grade_level,
        enrollment_status
      ) VALUES (
        section_rec.school_id,
        lrn_counter::TEXT,
        rand_firstname || ' ' || rand_lastname,
        rand_firstname,
        rand_lastname,
        rand_gender::gender_type,
        CURRENT_DATE - ((section_rec.grade_level + 5) * 365 + floor(random() * 365)::INT) * INTERVAL '1 day',
        section_rec.section_id,
        section_rec.grade_level,
        'enrolled'
      )
      ON CONFLICT (school_id, lrn) DO NOTHING
      RETURNING id INTO new_student_id;
      
      IF new_student_id IS NOT NULL THEN
        total_students := total_students + 1;
        lrn_counter := lrn_counter + 1;
        
        -- ========================================
        -- PART 3: CREATE PROMOTION RECORDS
        -- ========================================
        
        -- Determine promotion status with realistic distribution
        -- 85% promoted, 8% conditionally promoted, 5% retained, 2% transferred
        IF random() < 0.85 THEN
          rand_status := 'promoted';
          rand_average := 80 + (random() * 20)::DECIMAL(5,2); -- 80-100
        ELSIF random() < 0.93 THEN
          rand_status := 'conditionally_promoted';
          rand_average := 74 + (random() * 6)::DECIMAL(5,2); -- 74-80
        ELSIF random() < 0.98 THEN
          rand_status := 'retained';
          rand_average := 65 + (random() * 9)::DECIMAL(5,2); -- 65-74
        ELSE
          rand_status := 'transferred';
          rand_average := 75 + (random() * 15)::DECIMAL(5,2);
        END IF;
        
        -- SY 2024-2025 (Completed - final records)
        INSERT INTO promotion_records (
          school_id,
          student_id,
          section_id,
          school_year,
          grading_period,
          current_grade_level,
          general_average,
          promotion_status,
          next_grade_level,
          attendance_days_present,
          attendance_days_absent
        ) VALUES (
          section_rec.school_id,
          new_student_id,
          section_rec.section_id,
          '2024-2025',
          'final',
          GREATEST(1, section_rec.grade_level - 1), -- Previous grade level
          rand_average,
          rand_status,
          CASE WHEN rand_status = 'promoted' THEN section_rec.grade_level ELSE NULL END,
          180 + floor(random() * 20)::INT, -- 180-200 days present
          floor(random() * 15)::INT -- 0-15 days absent
        )
        ON CONFLICT (student_id, school_year, grading_period) DO NOTHING;
        
        total_promotions := total_promotions + 1;
        
        -- SY 2025-2026 (Current - in progress, some final for early finishers)
        -- Only create for ~60% of students (some haven't finished yet)
        IF random() < 0.6 THEN
          -- Re-randomize status for current year
          IF random() < 0.88 THEN
            rand_status := 'promoted';
            rand_average := 82 + (random() * 18)::DECIMAL(5,2);
          ELSIF random() < 0.95 THEN
            rand_status := 'conditionally_promoted';
            rand_average := 75 + (random() * 7)::DECIMAL(5,2);
          ELSE
            rand_status := 'retained';
            rand_average := 68 + (random() * 7)::DECIMAL(5,2);
          END IF;
          
          INSERT INTO promotion_records (
            school_id,
            student_id,
            section_id,
            school_year,
            grading_period,
            current_grade_level,
            general_average,
            promotion_status,
            next_grade_level,
            attendance_days_present,
            attendance_days_absent
          ) VALUES (
            section_rec.school_id,
            new_student_id,
            section_rec.section_id,
            '2025-2026',
            'final',
            section_rec.grade_level,
            rand_average,
            rand_status,
            CASE WHEN rand_status = 'promoted' AND section_rec.grade_level < 12 
                 THEN section_rec.grade_level + 1 
                 WHEN rand_status = 'promoted' AND section_rec.grade_level = 12 
                 THEN NULL -- Graduated
                 ELSE NULL 
            END,
            120 + floor(random() * 40)::INT, -- Partial year
            floor(random() * 10)::INT
          )
          ON CONFLICT (student_id, school_year, grading_period) DO NOTHING;
          
          total_promotions := total_promotions + 1;
        END IF;
      END IF;
    END LOOP;
    
    -- Progress indicator every 50 sections
    IF total_sections % 50 = 0 THEN
      RAISE NOTICE 'Progress: % students created...', total_students;
    END IF;
  END LOOP;

  -- ========================================
  -- SUMMARY
  -- ========================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Division: City of Mati';
  RAISE NOTICE 'Sections Created: %', total_sections;
  RAISE NOTICE 'Students Created: %', total_students;
  RAISE NOTICE 'Promotion Records Created: %', total_promotions;
  RAISE NOTICE '';
  RAISE NOTICE 'School Years with Data:';
  RAISE NOTICE '  - 2024-2025 (completed year)';
  RAISE NOTICE '  - 2025-2026 (current year, partial)';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test:';
  RAISE NOTICE '  - Division SF5 Dashboard: /division/reports/sf5';
  RAISE NOTICE '  - Division SF6 Enrollment: /division/reports/sf6';
  RAISE NOTICE '  - Division Enrollment: /division/enrollment';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run separately after the seed)
-- ============================================================================

-- Check section counts by grade
-- SELECT 
--   s.grade_level,
--   COUNT(DISTINCT sec.id) as section_count,
--   COUNT(DISTINCT st.id) as student_count
-- FROM schools s
-- JOIN sections sec ON sec.school_id = s.id
-- LEFT JOIN students st ON st.section_id = sec.id
-- WHERE s.division_id = (SELECT id FROM divisions WHERE code = 'DIV-MATI-CITY')
-- GROUP BY s.grade_level
-- ORDER BY s.grade_level;

-- Check promotion records by school year
-- SELECT 
--   pr.school_year,
--   pr.promotion_status,
--   COUNT(*) as count,
--   ROUND(AVG(pr.general_average), 2) as avg_grade
-- FROM promotion_records pr
-- JOIN schools s ON pr.school_id = s.id
-- WHERE s.division_id = (SELECT id FROM divisions WHERE code = 'DIV-MATI-CITY')
-- GROUP BY pr.school_year, pr.promotion_status
-- ORDER BY pr.school_year, pr.promotion_status;

-- Check total counts
-- SELECT 
--   (SELECT COUNT(*) FROM sections sec JOIN schools s ON sec.school_id = s.id 
--    WHERE s.division_id = (SELECT id FROM divisions WHERE code = 'DIV-MATI-CITY')) as total_sections,
--   (SELECT COUNT(*) FROM students st JOIN schools s ON st.school_id = s.id 
--    WHERE s.division_id = (SELECT id FROM divisions WHERE code = 'DIV-MATI-CITY')) as total_students,
--   (SELECT COUNT(*) FROM promotion_records pr JOIN schools s ON pr.school_id = s.id 
--    WHERE s.division_id = (SELECT id FROM divisions WHERE code = 'DIV-MATI-CITY')) as total_promotions;
