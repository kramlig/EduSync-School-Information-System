-- ==========================================
-- FIXED SEED SCRIPT - Proper ID References
-- Run this in Supabase SQL Editor
-- ==========================================

-- STEP 1: CLEAN EXISTING DATA
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

-- STEP 2: INSERT SCHOOL
INSERT INTO schools (name, school_id_number, division, region, current_school_year)
VALUES ('Default School', 'SCH-001', 'Test Division', 'Test Region', '2023-2024')
RETURNING id;

-- STEP 3: INSERT CORE VALUES
WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO core_values (school_id, name, code, indicators)
SELECT school.id, name, code, indicators::text[]
FROM school, (VALUES
  ('Maka-Diyos', 'MAKADIYOS', ARRAY['Expresses one''s spiritual beliefs', 'Shows adherence to ethical principles']),
  ('Makatao', 'MAKATAO', ARRAY['Demonstrates acts of caring', 'Shows respect for others']),
  ('Makakalikasan', 'MAKAKALIKASAN', ARRAY['Cares for the environment', 'Practices waste management']),
  ('Makabansa', 'MAKABANSA', ARRAY['Demonstrates pride in being a Filipino', 'Participates in school/community activities'])
) AS cv(name, code, indicators);

-- STEP 4: INSERT LEARNING AREAS
WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO learning_areas (school_id, name, code, grade_levels, is_composite, components)
SELECT school.id, name, code, grade_levels::int[], is_composite, components::text[]
FROM school, (VALUES
  ('Mother Tongue', 'MTB', ARRAY[1,2,3], false, NULL),
  ('Filipino', 'FIL', ARRAY[1,2,3,4,5,6], false, NULL),
  ('English', 'ENG', ARRAY[1,2,3,4,5,6], false, NULL),
  ('Mathematics', 'MATH', ARRAY[1,2,3,4,5,6], false, NULL),
  ('Science', 'SCI', ARRAY[3,4,5,6], false, NULL),
  ('Araling Panlipunan', 'AP', ARRAY[1,2,3,4,5,6], false, NULL),
  ('Edukasyon sa Pagpapakatao', 'ESP', ARRAY[1,2,3,4,5,6], false, NULL),
  ('MAPEH', 'MAPEH', ARRAY[1,2,3,4,5,6], true, ARRAY['Music', 'Arts', 'Physical Education', 'Health'])
) AS la(name, code, grade_levels, is_composite, components);

-- STEP 5: CREATE SECTIONS WITH TEACHERS
WITH school AS (SELECT id FROM schools LIMIT 1),
     teacher_data AS (
       INSERT INTO users (school_id, firebase_uid, email, role, name)
       SELECT school.id, 'teacher_' || n, 'teacher' || n || '@test.com', 'teacher'::user_role, 'Teacher ' || n
       FROM school, generate_series(1, 6) n
       RETURNING id, name
     ),
     teacher_profiles AS (
       INSERT INTO teachers (school_id, user_id, name, employee_number)
       SELECT school.id, td.id, td.name, 'T-' || LPAD(ROW_NUMBER() OVER ()::text, 3, '0')
       FROM school, teacher_data td
       RETURNING id
     )
INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
SELECT 
  school.id,
  CASE 
    WHEN grade = 1 AND sect = 1 THEN 'St. Peter'
    WHEN grade = 1 AND sect = 2 THEN 'St. Paul'
    WHEN grade = 2 AND sect = 1 THEN 'St. John'
    WHEN grade = 2 AND sect = 2 THEN 'St. Mark'
    WHEN grade = 3 AND sect = 1 THEN 'St. Luke'
    WHEN grade = 3 AND sect = 2 THEN 'St. Matthew'
  END,
  grade,
  '2023-2024',
  (SELECT id FROM teacher_profiles OFFSET (grade-1)*2 + (sect-1) LIMIT 1),
  'Room ' || grade || '0' || sect,
  40
FROM school, 
     LATERAL generate_series(1, 3) grade,
     LATERAL generate_series(1, 2) sect;

-- STEP 6: INSERT STUDENTS (unique names per section)
WITH school AS (SELECT id FROM schools LIMIT 1),
     sections_map AS (
       SELECT id, name, grade_level, ROW_NUMBER() OVER (ORDER BY grade_level, name) as section_index
       FROM sections
     ),
     first_names AS (
       SELECT unnest(ARRAY['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Carmen', 'Luis', 'Sofia', 'Miguel', 'Isabella', 'Carlos', 'Gabriela', 'Diego', 'Valentina', 'Rafael', 'Camila', 'Fernando', 'Lucia', 'Antonio', 'Elena', 'Manuel', 'Victoria', 'Ricardo', 'Natalia', 'Pablo', 'Daniela', 'Jorge', 'Andrea', 'Roberto', 'Laura', 'Alejandro', 'Patricia', 'Javier', 'Rosa', 'Raul', 'Teresa', 'Sergio', 'Monica', 'Andres', 'Sandra', 'Alberto', 'Veronica', 'Francisco', 'Beatriz', 'Ernesto', 'Cristina', 'Guillermo', 'Angela']) as name, ROW_NUMBER() OVER () as id
     ),
     last_names AS (
       SELECT unnest(ARRAY['Dela Cruz', 'Reyes', 'Lopez', 'Cruz', 'Santos', 'Garcia', 'Mendoza', 'Torres', 'Rivera', 'Hernandez', 'Martinez', 'Gonzales', 'Ramos', 'Castillo', 'Morales', 'Aquino', 'Flores', 'Villanueva', 'Pascual', 'Domingo', 'Castro', 'Diaz', 'Navarro', 'Santiago', 'Suarez']) as name, ROW_NUMBER() OVER () as id
     )
INSERT INTO students (school_id, section_id, lrn, name, first_name, last_name, gender, date_of_birth, grade_level, address, enrollment_status)
SELECT 
  school.id,
  sm.id,
  '106200000' || LPAD(((sm.section_index - 1) * 10 + n)::text, 3, '0'),
  fn.name || ' ' || ln.name,
  fn.name,
  ln.name,
  CASE WHEN (sm.section_index * 100 + n) % 2 = 1 THEN 'Male' ELSE 'Female' END::gender_type,
  ('2018-01-01'::date - ((sm.grade_level - 1) * 365) - (n * 10 || ' days')::interval)::date,
  sm.grade_level,
  'Batangas',
  'enrolled'
FROM school, 
     sections_map sm,
     generate_series(1, 8) n,
     LATERAL (SELECT name FROM first_names WHERE id = ((sm.section_index - 1) * 8 + n - 1) % 48 + 1) fn,
     LATERAL (SELECT name FROM last_names WHERE id = ((sm.section_index - 1) * 8 + n - 1) % 25 + 1) ln
RETURNING id, name, grade_level;

-- STEP 7: INSERT GRADES (FIXED - using actual student IDs)
WITH school AS (SELECT id FROM schools LIMIT 1),
     student_ids AS (
       SELECT s.id as student_id, s.grade_level
       FROM students s
     ),
     subject_ids AS (
       SELECT la.id as subject_id, la.is_composite, la.components
       FROM learning_areas la
     )
INSERT INTO grades (school_id, student_id, learning_area_id, school_year, q1, q2, composite_grades)
SELECT 
  school.id,
  st.student_id,  -- ✅ FIXED: Using actual student UUID from students table
  subj.subject_id,
  '2023-2024',
  CASE 
    WHEN subj.is_composite THEN NULL
    ELSE 75 + (RANDOM() * 25)::int
  END,
  CASE 
    WHEN subj.is_composite THEN NULL
    ELSE 75 + (RANDOM() * 25)::int
  END,
  CASE 
    WHEN subj.is_composite THEN 
      jsonb_build_object(
        'q1', jsonb_build_object(
          'Music', 75 + (RANDOM() * 25)::int,
          'Arts', 75 + (RANDOM() * 25)::int,
          'Physical Education', 75 + (RANDOM() * 25)::int,
          'Health', 75 + (RANDOM() * 25)::int
        ),
        'q2', jsonb_build_object(
          'Music', 75 + (RANDOM() * 25)::int,
          'Arts', 75 + (RANDOM() * 25)::int,
          'Physical Education', 75 + (RANDOM() * 25)::int,
          'Health', 75 + (RANDOM() * 25)::int
        )
      )
    ELSE NULL
  END
FROM school, student_ids st, subject_ids subj
WHERE st.grade_level >= 1; -- All students get all applicable subjects

-- STEP 8: INSERT CORE VALUE GRADES (FIXED - using actual student IDs)
WITH school AS (SELECT id FROM schools LIMIT 1),
     student_ids AS (
       SELECT s.id as student_id FROM students s
     ),
     core_value_ids AS (
       SELECT cv.id as cv_id FROM core_values cv
     )
INSERT INTO core_value_grades (school_id, student_id, core_value_id, school_year, indicator_ratings)
SELECT 
  school.id,
  st.student_id,  -- ✅ FIXED: Using actual student UUID
  cv.cv_id,
  '2023-2024',
  jsonb_build_object(
    'q1', jsonb_build_object(
      'indicator1', (ARRAY['AO', 'SO', 'RO', 'NO'])[1 + floor(random() * 4)::int],
      'indicator2', (ARRAY['AO', 'SO', 'RO', 'NO'])[1 + floor(random() * 4)::int]
    ),
    'q2', jsonb_build_object(
      'indicator1', (ARRAY['AO', 'SO', 'RO', 'NO'])[1 + floor(random() * 4)::int],
      'indicator2', (ARRAY['AO', 'SO', 'RO', 'NO'])[1 + floor(random() * 4)::int]
    )
  )
FROM school, student_ids st, core_value_ids cv;

-- VERIFICATION
SELECT 
  'Students' as entity, COUNT(*) as count FROM students
UNION ALL
SELECT 'Sections', COUNT(*) FROM sections
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
UNION ALL
SELECT 'Core Value Grades', COUNT(*) FROM core_value_grades
UNION ALL
SELECT 'Learning Areas', COUNT(*) FROM learning_areas
UNION ALL
SELECT 'Core Values', COUNT(*) FROM core_values;

-- Verify grade relationships
SELECT 
  s.id as student_id,
  s.name,
  COUNT(g.id) as grade_count
FROM students s
LEFT JOIN grades g ON g.student_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name
LIMIT 10;
