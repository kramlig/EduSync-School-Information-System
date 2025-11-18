-- ==========================================
-- CLEAN SEED POSTGRESQL DATABASE
-- This version clears existing data first
-- Run this in Supabase SQL Editor
-- ==========================================

-- STEP 1: CLEAN EXISTING DATA (in reverse dependency order)
DELETE FROM core_value_grades;
DELETE FROM grades;
DELETE FROM class_schedules;
DELETE FROM attendance_records;
DELETE FROM assignments;
DELETE FROM core_values;
DELETE FROM learning_areas;
DELETE FROM sections;
DELETE FROM teachers;
DELETE FROM parent_students;
DELETE FROM parents;
DELETE FROM students;
DELETE FROM users;
DELETE FROM schools;

-- STEP 2: INSERT SCHOOL
INSERT INTO schools (name, school_id_number, division, region, address, contact_email, contact_phone, principal_name, current_school_year, settings)
VALUES (
  'Dolores Elementary School',
  'DepEd-123456',
  'Batangas',
  'Region IV-A (CALABARZON)',
  'Dolores, Batangas',
  'dolores.es@deped.gov.ph',
  '+63-123-456-7890',
  'Principal Name',
  '2024-2025',
  '{"features": {"enrollment": {"enabled": true}, "grading": {"enabled": true}, "attendance": {"enabled": true}, "reports": {"enabled": true}, "financial": {"enabled": false}}, "grading": {"passingGrade": 75, "quarters": 4}}'::jsonb
)
RETURNING id, name;

-- STEP 3: INSERT TEACHERS
WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO users (school_id, firebase_uid, email, role, name, is_active)
SELECT 
  school.id,
  'teacher_' || emp_no,
  email,
  'teacher'::user_role,
  name,
  true
FROM school, (VALUES
  ('T-001', 'maria.santos@school.edu.ph', 'Ms. Maria Santos'),
  ('T-002', 'juan.delacruz@school.edu.ph', 'Mr. Juan Dela Cruz'),
  ('T-003', 'ana.reyes@school.edu.ph', 'Ms. Ana Reyes'),
  ('T-004', 'pedro.garcia@school.edu.ph', 'Mr. Pedro Garcia'),
  ('T-005', 'rosa.martinez@school.edu.ph', 'Ms. Rosa Martinez')
) AS t(emp_no, email, name)
RETURNING id, name, email;

-- STEP 4: CREATE TEACHER PROFILES
WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
SELECT 
  school.id,
  u.id,
  u.name,
  CASE 
    WHEN u.email LIKE 'maria.santos%' THEN 'T-001'
    WHEN u.email LIKE 'juan.delacruz%' THEN 'T-002'
    WHEN u.email LIKE 'ana.reyes%' THEN 'T-003'
    WHEN u.email LIKE 'pedro.garcia%' THEN 'T-004'
    WHEN u.email LIKE 'rosa.martinez%' THEN 'T-005'
  END,
  CASE 
    WHEN u.email LIKE 'maria.santos%' THEN 'General Education'
    WHEN u.email LIKE 'juan.delacruz%' THEN 'Mathematics'
    WHEN u.email LIKE 'ana.reyes%' THEN 'English'
    WHEN u.email LIKE 'pedro.garcia%' THEN 'Science'
    WHEN u.email LIKE 'rosa.martinez%' THEN 'Filipino'
  END,
  'Elementary'
FROM school, users u
WHERE u.role = 'teacher'
RETURNING id, name, employee_number;

-- STEP 5: CREATE SECTIONS
WITH school AS (SELECT id FROM schools LIMIT 1),
     teachers_list AS (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM teachers)
INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
SELECT 
  school.id,
  section_name,
  grade,
  '2024-2025',
  t.id,
  room,
  40
FROM school, (VALUES
  ('St. Peter', 1, 'Room 101'),
  ('St. Paul', 1, 'Room 102'),
  ('St. John', 2, 'Room 201'),
  ('St. Mark', 2, 'Room 202'),
  ('St. Luke', 3, 'Room 301'),
  ('St. Matthew', 3, 'Room 302')
) AS s(section_name, grade, room),
teachers_list t
WHERE t.rn = ((ASCII(section_name) % 5) + 1)
RETURNING id, name, grade_level, room_number;

-- STEP 6: CREATE LEARNING AREAS (ONE MAPEH, not 5!)
WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO learning_areas (school_id, code, name, description, grade_levels, is_composite, components, display_order, is_active)
SELECT 
  school.id,
  la.code,
  la.name,
  la.description,
  la.grade_levels,
  la.is_composite,
  la.components,
  la.display_order,
  la.is_active
FROM school, (VALUES
  ('MTB', 'Mother Tongue', 'Mother Tongue-Based Multilingual Education', ARRAY[1,2,3], false, NULL, 1, true),
  ('FIL', 'Filipino', 'Wika at Pagbasa', ARRAY[1,2,3,4,5,6], false, NULL, 2, true),
  ('ENG', 'English', 'Language and Reading', ARRAY[1,2,3,4,5,6], false, NULL, 3, true),
  ('MATH', 'Mathematics', 'Numbers, Patterns, Geometry', ARRAY[1,2,3,4,5,6], false, NULL, 4, true),
  ('SCI', 'Science', 'Araling Panlipunan at Science', ARRAY[3,4,5,6], false, NULL, 5, true),
  ('AP', 'Araling Panlipunan', 'Social Studies', ARRAY[1,2,3,4,5,6], false, NULL, 6, true),
  ('EPP', 'Edukasyon sa Pagpapakatao (EPP/TLE)', 'Values Education and Livelihood', ARRAY[4,5,6], false, NULL, 7, true),
  ('MAPEH', 'MAPEH', 'Music, Arts, Physical Education, Health', ARRAY[1,2,3,4,5,6], true, ARRAY['Music', 'Arts', 'Physical Education', 'Health'], 8, true),
  ('EDUK_PAGPAPAKATAO', 'Edukasyon sa Pagpapakatao', 'Values Education', ARRAY[1,2,3], false, NULL, 9, true)
) AS la(code, name, description, grade_levels, is_composite, components, display_order, is_active)
RETURNING id, code, name, is_composite;

-- STEP 7: CREATE DEPED CORE VALUES
WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO core_values (school_id, code, name, description, display_order)
SELECT 
  school.id,
  cv.code,
  cv.name,
  cv.description,
  cv.display_order
FROM school, (VALUES
  ('MAKA_DIYOS', 'Maka-Diyos', 'Demonstrates spirituality and faith', 1),
  ('MAKATAO', 'Makatao', 'Demonstrates care and respect for others', 2),
  ('MAKAKALIKASAN', 'Makakalikasan', 'Demonstrates care for the environment', 3),
  ('MAKABANSA', 'Makabansa', 'Demonstrates love of country', 4)
) AS cv(code, name, description, display_order)
RETURNING id, name;

-- STEP 8: CREATE STUDENTS (realistic enrollment - 5-10 per section)
WITH school AS (SELECT id FROM schools LIMIT 1),
     sections_data AS (
       SELECT s.id, s.name, s.grade_level, ROW_NUMBER() OVER (ORDER BY s.grade_level, s.name) as section_num
       FROM sections s
     )
INSERT INTO students (school_id, section_id, lrn, name, first_name, middle_name, last_name, gender, date_of_birth, grade_level, address, enrollment_status)
SELECT 
  school.id,
  sd.id,
  '1062' || LPAD((sd.section_num * 10 + student_num)::text, 8, '0'), -- Unique LRN
  first_name || ' ' || middle_name || ' ' || last_name, -- Full name
  first_name,
  middle_name,
  last_name,
  gender::gender_type,
  date_of_birth::DATE,
  sd.grade_level,
  'Dolores, Batangas',
  'enrolled'
FROM school, sections_data sd,
LATERAL (VALUES
  -- Grade 1 - St. Peter (8 students)
  (1, 'Juan', 'Perez', 'Dela Cruz', 'Male', '2018-03-15'),
  (2, 'Maria', 'Santos', 'Reyes', 'Female', '2018-05-20'),
  (3, 'Pedro', 'Garcia', 'Lopez', 'Male', '2018-07-10'),
  (4, 'Ana', 'Martinez', 'Cruz', 'Female', '2018-02-28'),
  (5, 'Jose', 'Rodriguez', 'Santos', 'Male', '2018-08-12'),
  (6, 'Carmen', 'Fernandez', 'Garcia', 'Female', '2018-04-05'),
  (7, 'Luis', 'Gonzales', 'Mendoza', 'Male', '2018-06-18'),
  (8, 'Sofia', 'Ramos', 'Torres', 'Female', '2018-01-25')
) AS students(student_num, first_name, middle_name, last_name, gender, date_of_birth)
WHERE sd.section_num = 1

UNION ALL

SELECT 
  school.id,
  sd.id,
  '1062' || LPAD((sd.section_num * 10 + student_num)::text, 8, '0'),
  first_name || ' ' || middle_name || ' ' || last_name,
  first_name,
  middle_name,
  last_name,
  gender::gender_type,
  date_of_birth::DATE,
  sd.grade_level,
  'Dolores, Batangas',
  'enrolled'
FROM school, sections_data sd,
LATERAL (VALUES
  -- Grade 1 - St. Paul (7 students)
  (1, 'Miguel', 'Castro', 'Aquino', 'Male', '2018-09-08'),
  (2, 'Isabella', 'Morales', 'Diaz', 'Female', '2018-03-22'),
  (3, 'Carlos', 'Jimenez', 'Vargas', 'Male', '2018-11-30'),
  (4, 'Gabriela', 'Ortiz', 'Silva', 'Female', '2018-05-14'),
  (5, 'Diego', 'Navarro', 'Ramos', 'Male', '2018-07-19'),
  (6, 'Valeria', 'Herrera', 'Flores', 'Female', '2018-02-11'),
  (7, 'Andres', 'Mendez', 'Gutierrez', 'Male', '2018-10-03')
) AS students(student_num, first_name, middle_name, last_name, gender, date_of_birth)
WHERE sd.section_num = 2

UNION ALL

SELECT 
  school.id,
  sd.id,
  '1062' || LPAD((sd.section_num * 10 + student_num)::text, 8, '0'),
  first_name || ' ' || middle_name || ' ' || last_name,
  first_name,
  middle_name,
  last_name,
  gender::gender_type,
  date_of_birth::DATE,
  sd.grade_level,
  'Dolores, Batangas',
  'enrolled'
FROM school, sections_data sd,
LATERAL (VALUES
  -- Grade 2 - St. John (9 students)
  (1, 'Rafael', 'Salazar', 'Ramirez', 'Male', '2017-04-12'),
  (2, 'Camila', 'Mendoza', 'Cruz', 'Female', '2017-06-25'),
  (3, 'Daniel', 'Torres', 'Gomez', 'Male', '2017-08-30'),
  (4, 'Lucia', 'Castillo', 'Reyes', 'Female', '2017-03-17'),
  (5, 'Javier', 'Romero', 'Santos', 'Male', '2017-09-05'),
  (6, 'Elena', 'Aguilar', 'Lopez', 'Female', '2017-01-20'),
  (7, 'Fernando', 'Ruiz', 'Perez', 'Male', '2017-07-08'),
  (8, 'Paula', 'Dominguez', 'Garcia', 'Female', '2017-11-14'),
  (9, 'Ricardo', 'Vega', 'Martinez', 'Male', '2017-05-28')
) AS students(student_num, first_name, middle_name, last_name, gender, date_of_birth)
WHERE sd.section_num = 3

UNION ALL

SELECT 
  school.id,
  sd.id,
  '1062' || LPAD((sd.section_num * 10 + student_num)::text, 8, '0'),
  first_name || ' ' || middle_name || ' ' || last_name,
  first_name,
  middle_name,
  last_name,
  gender::gender_type,
  date_of_birth::DATE,
  sd.grade_level,
  'Dolores, Batangas',
  'enrolled'
FROM school, sections_data sd,
LATERAL (VALUES
  -- Grade 2 - St. Mark (8 students)
  (1, 'Antonio', 'Soto', 'Fernandez', 'Male', '2017-02-09'),
  (2, 'Natalia', 'Iglesias', 'Rodriguez', 'Female', '2017-10-16'),
  (3, 'Enrique', 'Marquez', 'Gonzales', 'Male', '2017-12-22'),
  (4, 'Adriana', 'Guerrero', 'Morales', 'Female', '2017-04-07'),
  (5, 'Manuel', 'Nunez', 'Castro', 'Male', '2017-06-13'),
  (6, 'Beatriz', 'Medina', 'Ortiz', 'Female', '2017-08-19'),
  (7, 'Roberto', 'Sandoval', 'Navarro', 'Male', '2017-03-26'),
  (8, 'Victoria', 'Campos', 'Herrera', 'Female', '2017-09-11')
) AS students(student_num, first_name, middle_name, last_name, gender, date_of_birth)
WHERE sd.section_num = 4

UNION ALL

SELECT 
  school.id,
  sd.id,
  '1062' || LPAD((sd.section_num * 10 + student_num)::text, 8, '0'),
  first_name || ' ' || middle_name || ' ' || last_name,
  first_name,
  middle_name,
  last_name,
  gender::gender_type,
  date_of_birth::DATE,
  sd.grade_level,
  'Dolores, Batangas',
  'enrolled'
FROM school, sections_data sd,
LATERAL (VALUES
  -- Grade 3 - St. Luke (10 students)
  (1, 'Alberto', 'Pena', 'Jimenez', 'Male', '2016-05-15'),
  (2, 'Cristina', 'Rios', 'Vargas', 'Female', '2016-07-22'),
  (3, 'Eduardo', 'Molina', 'Silva', 'Male', '2016-09-28'),
  (4, 'Daniela', 'Paredes', 'Ramos', 'Female', '2016-02-14'),
  (5, 'Francisco', 'Delgado', 'Flores', 'Male', '2016-11-03'),
  (6, 'Alicia', 'Cortez', 'Gutierrez', 'Female', '2016-04-18'),
  (7, 'Guillermo', 'Rojas', 'Ramirez', 'Male', '2016-06-25'),
  (8, 'Monica', 'Luna', 'Gomez', 'Female', '2016-08-30'),
  (9, 'Sergio', 'Bravo', 'Reyes', 'Male', '2016-01-12'),
  (10, 'Laura', 'Cordova', 'Santos', 'Female', '2016-10-07')
) AS students(student_num, first_name, middle_name, last_name, gender, date_of_birth)
WHERE sd.section_num = 5

UNION ALL

SELECT 
  school.id,
  sd.id,
  '1062' || LPAD((sd.section_num * 10 + student_num)::text, 8, '0'),
  first_name || ' ' || middle_name || ' ' || last_name,
  first_name,
  middle_name,
  last_name,
  gender::gender_type,
  date_of_birth::DATE,
  sd.grade_level,
  'Dolores, Batangas',
  'enrolled'
FROM school, sections_data sd,
LATERAL (VALUES
  -- Grade 3 - St. Matthew (9 students)
  (1, 'Oscar', 'Figueroa', 'Lopez', 'Male', '2016-03-09'),
  (2, 'Patricia', 'Cabrera', 'Perez', 'Female', '2016-12-16'),
  (3, 'Hector', 'Leon', 'Garcia', 'Male', '2016-05-23'),
  (4, 'Sandra', 'Espinoza', 'Martinez', 'Female', '2016-07-29'),
  (5, 'Raul', 'Fuentes', 'Cruz', 'Male', '2016-09-04'),
  (6, 'Angela', 'Carrillo', 'Aquino', 'Female', '2016-02-19'),
  (7, 'Jorge', 'Duran', 'Diaz', 'Male', '2016-11-25'),
  (8, 'Rosa', 'Lara', 'Morales', 'Female', '2016-04-11'),
  (9, 'Marco', 'Valencia', 'Castro', 'Male', '2016-08-17')
) AS students(student_num, first_name, middle_name, last_name, gender, date_of_birth)
WHERE sd.section_num = 6;

-- STEP 9: CREATE SAMPLE GRADES (Q1 only - realistic scenario)
-- Generate grades for Grade 1 students in basic subjects
WITH school AS (SELECT id FROM schools LIMIT 1),
     grade1_students AS (
       SELECT st.id
       FROM students st 
       JOIN sections sec ON st.section_id = sec.id 
       WHERE sec.grade_level = 1
     ),
     grade1_subjects AS (
       SELECT id, code, is_composite, components
       FROM learning_areas 
       WHERE 1 = ANY(grade_levels) AND code IN ('MTB', 'FIL', 'ENG', 'MATH', 'AP', 'MAPEH', 'EDUK_PAGPAPAKATAO')
     )
INSERT INTO grades (school_id, student_id, learning_area_id, school_year, q1, composite_grades)
SELECT 
  school.id,
  gs.id,
  subj.id,
  '2024-2025',
  CASE 
    WHEN subj.is_composite THEN NULL -- MAPEH uses composite_grades
    ELSE 75 + (RANDOM() * 25)::int -- Random grade 75-100
  END,
  CASE 
    WHEN subj.is_composite THEN 
      jsonb_build_object(
        'q1', jsonb_build_object(
          'Music', 75 + (RANDOM() * 25)::int,
          'Arts', 75 + (RANDOM() * 25)::int,
          'Physical Education', 75 + (RANDOM() * 25)::int,
          'Health', 75 + (RANDOM() * 25)::int
        )
      )
    ELSE NULL
  END
FROM school, grade1_students gs, grade1_subjects subj;

-- STEP 10: VERIFY COMPLETE SEEDING
SELECT 'Core Values' as table_name, COUNT(*) as count FROM core_values
UNION ALL
SELECT 'Learning Areas', COUNT(*) FROM learning_areas
UNION ALL
SELECT 'Schools', COUNT(*) FROM schools
UNION ALL
SELECT 'Sections', COUNT(*) FROM sections
UNION ALL
SELECT 'Teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
ORDER BY table_name;

-- ==========================================
-- ✅ EXPECTED RESULTS (Real School Onboarding):
-- Core Values: 4 (DepEd standard)
-- Grades: 105 (7 subjects × 15 Grade 1 students)
-- Learning Areas: 9 (including 1 MAPEH composite)
-- Schools: 1 (Dolores Elementary)
-- Sections: 6 (Grade 1-3, 2 sections each)
-- Students: 51 (realistic class sizes: 7-10 per section)
-- Teachers: 5 (subject specialists)
-- Users: 5 (all teachers, students don't login yet)
--
-- GRADE DISTRIBUTION:
-- Grade 1: 15 students (St. Peter: 8, St. Paul: 7)
-- Grade 2: 17 students (St. John: 9, St. Mark: 8)  
-- Grade 3: 19 students (St. Luke: 10, St. Matthew: 9)
--
-- DATA COMPLETENESS:
-- ✅ All students enrolled in sections
-- ✅ All sections have advisers
-- ✅ Grade 1 students have Q1 grades (7 subjects each)
-- ✅ MAPEH has composite grades (Music/Arts/PE/Health)
-- ✅ Realistic names, LRNs, birthdates
-- ==========================================
