-- ==========================================
-- PRODUCTION-READY SEED SCRIPT
-- One authoritative source of truth for test data
-- Run this in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- STEP 1: CLEAN SLATE - Delete all data
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Cleaning database...';
END $$;

DELETE FROM core_value_grades;
DELETE FROM grades;
DELETE FROM class_schedules;
DELETE FROM students;
DELETE FROM sections;
DELETE FROM learning_areas;
DELETE FROM core_values;
DELETE FROM teachers;
DELETE FROM users;
DELETE FROM schools;

-- ==========================================
-- STEP 2: INSERT SCHOOL
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Creating school...';
END $$;

INSERT INTO schools (id, name, school_id_number, division, region, current_school_year)
VALUES (
  gen_random_uuid(),
  'Default School',
  'SCH-001',
  'Test Division',
  'Test Region',
  '2023-2024'
);

-- ==========================================
-- STEP 3: INSERT LEARNING AREAS (8 subjects)
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Creating learning areas...';
END $$;

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO learning_areas (id, school_id, name, code, grade_levels, is_composite, components)
SELECT 
  gen_random_uuid(),
  school.id,
  name,
  code,
  grade_levels,
  is_composite,
  components
FROM school, (VALUES
  ('Filipino', 'FIL', ARRAY[1,2,3,4,5,6], false, NULL),
  ('English', 'ENG', ARRAY[1,2,3,4,5,6], false, NULL),
  ('Mathematics', 'MATH', ARRAY[1,2,3,4,5,6], false, NULL),
  ('Science', 'SCI', ARRAY[3,4,5,6], false, NULL),
  ('Araling Panlipunan', 'AP', ARRAY[1,2,3,4,5,6], false, NULL),
  ('Edukasyon sa Pagpapakatao', 'ESP', ARRAY[1,2,3,4,5,6], false, NULL),
  ('MAPEH', 'MAPEH', ARRAY[1,2,3,4,5,6], true, ARRAY['Music', 'Arts', 'Physical Education', 'Health']),
  ('Mother Tongue', 'MTB', ARRAY[1,2,3], false, NULL)
) AS la(name, code, grade_levels, is_composite, components);

-- ==========================================
-- STEP 4: INSERT CORE VALUES (4 values)
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Creating core values...';
END $$;

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO core_values (id, school_id, name, code, indicators)
SELECT 
  gen_random_uuid(),
  school.id,
  name,
  code,
  indicators
FROM school, (VALUES
  ('Maka-Diyos', 'MAKADIYOS', ARRAY['Expresses one''s spiritual beliefs', 'Shows adherence to ethical principles']),
  ('Makatao', 'MAKATAO', ARRAY['Demonstrates acts of caring', 'Shows respect for others']),
  ('Makakalikasan', 'MAKAKALIKASAN', ARRAY['Cares for the environment', 'Practices waste management']),
  ('Makabansa', 'MAKABANSA', ARRAY['Demonstrates pride in being a Filipino', 'Participates in school/community activities'])
) AS cv(name, code, indicators);

-- ==========================================
-- STEP 5: INSERT SECTIONS (6 sections total)
-- Grade 1: St. Peter, St. Paul
-- Grade 2: St. John, St. Mark  
-- Grade 3: St. Luke, St. Matthew
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Creating sections...';
END $$;

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO sections (id, school_id, name, grade_level, school_year, room_number)
SELECT 
  gen_random_uuid(),
  school.id,
  name,
  grade_level,
  '2023-2024',
  room_number
FROM school, (VALUES
  ('St. Peter', 1, '101'),
  ('St. Paul', 1, '102'),
  ('St. John', 2, '201'),
  ('St. Mark', 2, '202'),
  ('St. Luke', 3, '301'),
  ('St. Matthew', 3, '302')
) AS s(name, grade_level, room_number);

-- ==========================================
-- STEP 6: INSERT STUDENTS (48 unique students)
-- 6 sections × 8 students = 48 students
-- Each student has unique name and LRN
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Creating students...';
END $$;

WITH school AS (SELECT id FROM schools LIMIT 1),
     section_list AS (
       SELECT 
         id, 
         name, 
         grade_level,
         ROW_NUMBER() OVER (ORDER BY grade_level, name) as section_num
       FROM sections
     ),
     student_data AS (
       SELECT 
         section_num,
         student_num,
         first_names[((section_num - 1) * 8 + student_num - 1) % 48 + 1] as first_name,
         last_names[((section_num - 1) * 8 + student_num - 1) % 25 + 1] as last_name,
         CASE WHEN ((section_num - 1) * 8 + student_num) % 2 = 1 THEN 'Male' ELSE 'Female' END as gender
       FROM 
         section_list,
         generate_series(1, 8) as student_num,
         (SELECT ARRAY['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Carmen', 'Luis', 'Sofia', 
                       'Miguel', 'Isabella', 'Carlos', 'Gabriela', 'Diego', 'Valentina', 'Rafael', 'Camila',
                       'Fernando', 'Lucia', 'Antonio', 'Elena', 'Manuel', 'Victoria', 'Ricardo', 'Natalia',
                       'Pablo', 'Daniela', 'Jorge', 'Andrea', 'Roberto', 'Laura', 'Alejandro', 'Patricia',
                       'Javier', 'Rosa', 'Raul', 'Teresa', 'Sergio', 'Monica', 'Andres', 'Sandra',
                       'Alberto', 'Veronica', 'Francisco', 'Beatriz', 'Ernesto', 'Cristina', 'Guillermo', 'Angela'] as first_names) fn,
         (SELECT ARRAY['Dela Cruz', 'Reyes', 'Lopez', 'Cruz', 'Santos', 'Garcia', 'Mendoza', 'Torres',
                       'Rivera', 'Hernandez', 'Martinez', 'Gonzales', 'Ramos', 'Castillo', 'Morales', 'Aquino',
                       'Flores', 'Villanueva', 'Pascual', 'Domingo', 'Castro', 'Diaz', 'Navarro', 'Santiago', 'Suarez'] as last_names) ln
     )
INSERT INTO students (
  id,
  school_id,
  section_id,
  lrn,
  name,
  first_name,
  last_name,
  gender,
  date_of_birth,
  grade_level,
  address,
  email,
  enrollment_status
)
SELECT 
  gen_random_uuid(),
  school.id,
  sl.id,
  '106200000' || LPAD(((sl.section_num - 1) * 8 + sd.student_num)::text, 3, '0'),
  sd.first_name || ' ' || sd.last_name,
  sd.first_name,
  sd.last_name,
  sd.gender::gender_type,
  ('2018-01-01'::date - ((sl.grade_level - 1) * 365) - (sd.student_num * 10 || ' days')::interval)::date,
  sl.grade_level,
  'Batangas City',
  LOWER(sd.first_name || '.' || sd.last_name || '@student.edusync.local'),
  'enrolled'
FROM school, section_list sl, student_data sd
WHERE sl.section_num = sd.section_num;

-- ==========================================
-- STEP 7: INSERT GRADES
-- For each student: 8 learning areas × 1 grade record = 8 records per student
-- Total: 48 students × 8 subjects = 384 grade records
-- Each grade has Q1-Q4 data
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Creating grades...';
END $$;

WITH school AS (SELECT id FROM schools LIMIT 1),
     student_list AS (
       SELECT id, grade_level FROM students
     ),
     subject_list AS (
       SELECT id, is_composite, components FROM learning_areas
     )
INSERT INTO grades (
  id,
  school_id,
  student_id,
  learning_area_id,
  school_year,
  q1,
  q2,
  q3,
  q4,
  composite_grades
)
SELECT 
  gen_random_uuid(),
  school.id,
  st.id,
  subj.id,
  '2023-2024',
  -- Q1: Simple grade or NULL for composite
  CASE WHEN subj.is_composite THEN NULL ELSE 75 + floor(random() * 26)::int END,
  -- Q2: Simple grade or NULL for composite
  CASE WHEN subj.is_composite THEN NULL ELSE 75 + floor(random() * 26)::int END,
  -- Q3: Simple grade or NULL for composite
  CASE WHEN subj.is_composite THEN NULL ELSE 75 + floor(random() * 26)::int END,
  -- Q4: Simple grade or NULL for composite
  CASE WHEN subj.is_composite THEN NULL ELSE 75 + floor(random() * 26)::int END,
  -- Composite grades for MAPEH only
  CASE 
    WHEN subj.is_composite THEN 
      jsonb_build_object(
        'q1', jsonb_build_object(
          'Music', 75 + floor(random() * 26)::int,
          'Arts', 75 + floor(random() * 26)::int,
          'Physical Education', 75 + floor(random() * 26)::int,
          'Health', 75 + floor(random() * 26)::int
        ),
        'q2', jsonb_build_object(
          'Music', 75 + floor(random() * 26)::int,
          'Arts', 75 + floor(random() * 26)::int,
          'Physical Education', 75 + floor(random() * 26)::int,
          'Health', 75 + floor(random() * 26)::int
        ),
        'q3', jsonb_build_object(
          'Music', 75 + floor(random() * 26)::int,
          'Arts', 75 + floor(random() * 26)::int,
          'Physical Education', 75 + floor(random() * 26)::int,
          'Health', 75 + floor(random() * 26)::int
        ),
        'q4', jsonb_build_object(
          'Music', 75 + floor(random() * 26)::int,
          'Arts', 75 + floor(random() * 26)::int,
          'Physical Education', 75 + floor(random() * 26)::int,
          'Health', 75 + floor(random() * 26)::int
        )
      )
    ELSE NULL
  END
FROM school, student_list st, subject_list subj;

-- ==========================================
-- STEP 8: INSERT CORE VALUE GRADES
-- For each student: 4 core values × 1 record = 4 records per student
-- Total: 48 students × 4 values = 192 records
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE 'Creating core value grades...';
END $$;

WITH school AS (SELECT id FROM schools LIMIT 1),
     student_list AS (
       SELECT id FROM students
     ),
     core_value_list AS (
       SELECT id, indicators FROM core_values
     ),
     ratings AS (
       SELECT unnest(ARRAY['AO', 'SO', 'RO', 'NO']) as rating
     )
INSERT INTO core_value_grades (
  id,
  school_id,
  student_id,
  core_value_id,
  school_year,
  indicator_ratings
)
SELECT 
  gen_random_uuid(),
  school.id,
  st.id,
  cv.id,
  '2023-2024',
  -- Use actual indicator text as keys instead of indicator1, indicator2
  jsonb_build_object(
    'q1', jsonb_build_object(
      cv.indicators[1], (SELECT rating FROM ratings ORDER BY random() LIMIT 1),
      cv.indicators[2], (SELECT rating FROM ratings ORDER BY random() LIMIT 1)
    ),
    'q2', jsonb_build_object(
      cv.indicators[1], (SELECT rating FROM ratings ORDER BY random() LIMIT 1),
      cv.indicators[2], (SELECT rating FROM ratings ORDER BY random() LIMIT 1)
    ),
    'q3', jsonb_build_object(
      cv.indicators[1], (SELECT rating FROM ratings ORDER BY random() LIMIT 1),
      cv.indicators[2], (SELECT rating FROM ratings ORDER BY random() LIMIT 1)
    ),
    'q4', jsonb_build_object(
      cv.indicators[1], (SELECT rating FROM ratings ORDER BY random() LIMIT 1),
      cv.indicators[2], (SELECT rating FROM ratings ORDER BY random() LIMIT 1)
    )
  )
FROM school, student_list st, core_value_list cv;

-- ==========================================
-- VERIFICATION QUERIES
-- These MUST show the expected counts
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE - Check results below';
  RAISE NOTICE '========================================';
END $$;

-- Count checks
SELECT 'Schools' as entity, COUNT(*) as actual, 1 as expected, 
       CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as status 
FROM schools
UNION ALL
SELECT 'Learning Areas', COUNT(*), 8,
       CASE WHEN COUNT(*) = 8 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM learning_areas
UNION ALL
SELECT 'Core Values', COUNT(*), 4,
       CASE WHEN COUNT(*) = 4 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM core_values
UNION ALL
SELECT 'Sections', COUNT(*), 6,
       CASE WHEN COUNT(*) = 6 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM sections
UNION ALL
SELECT 'Students', COUNT(*), 48,
       CASE WHEN COUNT(*) = 48 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM students
UNION ALL
SELECT 'Grades', COUNT(*), 384,
       CASE WHEN COUNT(*) = 384 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM grades
UNION ALL
SELECT 'Core Value Grades', COUNT(*), 192,
       CASE WHEN COUNT(*) = 192 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM core_value_grades;

-- Check for duplicate students (MUST be 0 rows)
SELECT 'DUPLICATE CHECK' as check_type, name, COUNT(*) as duplicate_count
FROM students 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Check foreign key integrity (MUST be 0 rows)
SELECT 'FK INTEGRITY - Grades' as check_type, COUNT(*) as orphaned_records
FROM grades 
WHERE student_id NOT IN (SELECT id FROM students)
UNION ALL
SELECT 'FK INTEGRITY - Core Values', COUNT(*)
FROM core_value_grades
WHERE student_id NOT IN (SELECT id FROM students);

-- Sample data check - show first 5 students with their grades
SELECT 
  s.name as student_name,
  s.lrn,
  sec.name as section,
  COUNT(g.id) as grade_count
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN grades g ON s.id = g.student_id
GROUP BY s.id, s.name, s.lrn, sec.name
ORDER BY s.name
LIMIT 5;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED SCRIPT COMPLETED SUCCESSFULLY';
  RAISE NOTICE 'All data created and verified';
  RAISE NOTICE '========================================';
END $$;
