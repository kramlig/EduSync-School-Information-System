-- ==========================================
-- COMPLETE POSTGRESQL SEEDING - MASTER FILE
-- Production-Ready School Onboarding Workflow
-- ==========================================
-- 
-- PURPOSE: Single-file seeding for new school onboarding
-- USAGE: Run this ONCE in Supabase SQL Editor after schema deployment
-- 
-- This script will:
-- 1. Clean all existing data (DELETE operations)
-- 2. Create complete demo school (Dolores Elementary)
-- 3. Seed all 14 tables with realistic data
-- 4. Add DepEd behavioral indicators to core values
-- 5. Generate sample grades with composite MAPEH
-- 6. Create parent links, schedules, attendance, assignments
-- 
-- TABLES POPULATED (14):
-- ✅ schools (1)
-- ✅ users (5 teachers)
-- ✅ teachers (5 profiles)
-- ✅ sections (6 - Grade 1-3)
-- ✅ students (51 across 6 sections)
-- ✅ learning_areas (9 including MAPEH composite)
-- ✅ core_values (4 with behavioral indicators)
-- ✅ grades (105 with MAPEH composite_grades)
-- ✅ parents (10)
-- ✅ parent_students (10 links)
-- ✅ class_schedules (18)
-- ✅ attendance_records (~75)
-- ✅ core_value_grades (60 with indicator_ratings)
-- ✅ assignments (12)
-- 
-- MIGRATION FIXES APPLIED:
-- ❌ Issue: Column "age" doesn't exist → Use date_of_birth instead
-- ❌ Issue: UNION type mismatch → Cast all dates with ::DATE
-- ❌ Issue: grades table missing section_id, quarter → Use school_year only
-- ❌ Issue: class_schedules has no school_year column → Removed
-- ❌ Issue: attendance_status needs enum cast → Use ::attendance_status
-- ❌ Issue: assignments uses max_score not total_points → Fixed column name
-- ❌ Issue: core_values indicators don't exist initially → Added via ALTER TABLE
-- 
-- ==========================================

-- ==========================================
-- STEP 0: CLEAN ALL DATA
-- ==========================================

DELETE FROM core_value_grades;
DELETE FROM grades;
DELETE FROM attendance_records;
DELETE FROM assignments;
DELETE FROM class_schedules;
DELETE FROM parent_students;
DELETE FROM parents;
DELETE FROM students;
DELETE FROM core_values;
DELETE FROM learning_areas;
DELETE FROM sections;
DELETE FROM teachers;
DELETE FROM users;
DELETE FROM schools;

-- ==========================================
-- STEP 1: CREATE SCHOOL
-- ==========================================

INSERT INTO schools (
  name, 
  address, 
  region, 
  division, 
  district, 
  school_id_number, 
  current_school_year,
  settings
)
VALUES (
  'Dolores Elementary School',
  'Dolores, Batangas',
  'Region IV-A CALABARZON',
  'Division of Batangas',
  'Dolores District',
  '108501',
  '2024-2025',
  jsonb_build_object(
    'features', jsonb_build_object(
      'enrollment', true,
      'grading', true,
      'attendance', true,
      'financial', true
    )
  )
);

-- ==========================================
-- STEP 2: CREATE TEACHERS (5 Users)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO users (school_id, firebase_uid, email, role, display_name)
SELECT 
  school.id,
  'teacher_' || code,
  email,
  'teacher',
  name
FROM school,
  (VALUES 
    ('T-001', 'maria.santos@dolores.edu.ph', 'Maria Santos'),
    ('T-002', 'juan.delacruz@dolores.edu.ph', 'Juan Dela Cruz'),
    ('T-003', 'ana.reyes@dolores.edu.ph', 'Ana Reyes'),
    ('T-004', 'pedro.garcia@dolores.edu.ph', 'Pedro Garcia'),
    ('T-005', 'rosa.martinez@dolores.edu.ph', 'Rosa Martinez')
  ) AS t(code, email, name);

-- ==========================================
-- STEP 3: CREATE TEACHER PROFILES
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO teachers (school_id, user_id, employee_number, first_name, last_name, specialization, email)
SELECT 
  school.id,
  u.id,
  code,
  first_name,
  last_name,
  specialization,
  u.email
FROM school,
  users u,
  (VALUES 
    ('T-001', 'Maria', 'Santos', 'General Education'),
    ('T-002', 'Juan', 'Dela Cruz', 'Mathematics'),
    ('T-003', 'Ana', 'Reyes', 'English'),
    ('T-004', 'Pedro', 'Garcia', 'Science'),
    ('T-005', 'Rosa', 'Martinez', 'Filipino')
  ) AS t(code, first_name, last_name, specialization)
WHERE u.firebase_uid = 'teacher_' || code;

-- ==========================================
-- STEP 4: CREATE SECTIONS (6 Sections)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO sections (school_id, grade_level, name, adviser_id, room_number, capacity, school_year)
SELECT 
  school.id,
  grade,
  section_name,
  (SELECT id FROM teachers ORDER BY RANDOM() LIMIT 1),
  room,
  40,
  '2024-2025'
FROM school,
  (VALUES 
    (1, 'St. Peter', 'Room 101'),
    (1, 'St. Paul', 'Room 102'),
    (2, 'St. John', 'Room 201'),
    (2, 'St. Mark', 'Room 202'),
    (3, 'St. Luke', 'Room 301'),
    (3, 'St. Matthew', 'Room 302')
  ) AS s(grade, section_name, room);

-- ==========================================
-- STEP 5: CREATE LEARNING AREAS (9 Areas)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO learning_areas (school_id, code, name, description, grade_levels, is_composite, components)
SELECT 
  school.id,
  code,
  name,
  description,
  grade_levels,
  is_composite,
  components
FROM school,
  (VALUES 
    ('MTB', 'Mother Tongue-Based', 'Native language instruction', ARRAY[1,2,3], false, NULL),
    ('FIL', 'Filipino', 'Filipino language and literature', ARRAY[1,2,3,4,5,6], false, NULL),
    ('ENG', 'English', 'English language and literature', ARRAY[1,2,3,4,5,6], false, NULL),
    ('MATH', 'Mathematics', 'Mathematics and problem solving', ARRAY[1,2,3,4,5,6], false, NULL),
    ('SCI', 'Science', 'Science and technology', ARRAY[3,4,5,6], false, NULL),
    ('AP', 'Araling Panlipunan', 'Social Studies', ARRAY[1,2,3,4,5,6], false, NULL),
    ('EPP', 'Edukasyon sa Pagpapakatao', 'Values Education', ARRAY[4,5,6], false, NULL),
    ('MAPEH', 'MAPEH', 'Music, Arts, Physical Education, and Health', ARRAY[1,2,3,4,5,6], true, ARRAY['Music', 'Arts', 'Physical Education', 'Health']),
    ('EDUK_PAGPAPAKATAO', 'Edukasyon sa Pagpapakatao', 'Character Education', ARRAY[1,2,3], false, NULL)
  ) AS la(code, name, description, grade_levels, is_composite, components);

-- ==========================================
-- STEP 6: CREATE CORE VALUES (4 Values)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO core_values (school_id, code, name, description, display_order)
SELECT 
  school.id,
  code,
  name,
  description,
  display_order
FROM school,
  (VALUES 
    ('MAKA_DIYOS', 'Maka-Diyos', 'Demonstrates spirituality and faith', 1),
    ('MAKATAO', 'Makatao', 'Shows respect and care for others', 2),
    ('MAKAKALIKASAN', 'Makakalikasan', 'Cares for the environment', 3),
    ('MAKABANSA', 'Makabansa', 'Demonstrates patriotism and nationalism', 4)
  ) AS cv(code, name, description, display_order);

-- ==========================================
-- STEP 7: ADD BEHAVIORAL INDICATORS
-- ==========================================

-- Add indicators column to core_values
ALTER TABLE core_values 
ADD COLUMN IF NOT EXISTS indicators TEXT[];

-- Add indicator_ratings column to core_value_grades
ALTER TABLE core_value_grades 
ADD COLUMN IF NOT EXISTS indicator_ratings JSONB;

-- Update core values with DepEd behavioral indicators
UPDATE core_values SET indicators = ARRAY[
  'Expresses one''s spiritual beliefs while respecting the spiritual beliefs of others',
  'Shows adherence to ethical principles by upholding truth'
] WHERE code = 'MAKA_DIYOS';

UPDATE core_values SET indicators = ARRAY[
  'Is sensitive to individual, social, and cultural differences',
  'Demonstrates contributions toward solidarity'
] WHERE code = 'MAKATAO';

UPDATE core_values SET indicators = ARRAY[
  'Cares for the environment and utilizes resources wisely, judiciously, and economically'
] WHERE code = 'MAKAKALIKASAN';

UPDATE core_values SET indicators = ARRAY[
  'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
  'Demonstrates appropriate civic engagement out activities in the school, community, and country'
] WHERE code = 'MAKABANSA';

-- ==========================================
-- STEP 8: CREATE STUDENTS (51 Students)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1),
     grade1_sections AS (
       SELECT id, name FROM sections WHERE grade_level = 1
     )
INSERT INTO students (
  school_id, 
  section_id, 
  lrn, 
  first_name, 
  middle_name, 
  last_name, 
  name,
  date_of_birth,
  gender, 
  grade_level,
  enrollment_status
)
-- Grade 1 - St. Peter (8 students)
SELECT school.id, sec.id, '100000000001', 'Juan', 'Reyes', 'Santos', 'Juan Reyes Santos', '2018-03-15'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
UNION ALL SELECT school.id, sec.id, '100000000002', 'Maria', 'Cruz', 'Garcia', 'Maria Cruz Garcia', '2018-05-20'::DATE, 'Female', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
UNION ALL SELECT school.id, sec.id, '100000000003', 'Pedro', 'Ramos', 'Torres', 'Pedro Ramos Torres', '2018-01-10'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
UNION ALL SELECT school.id, sec.id, '100000000004', 'Ana', 'Lopez', 'Mendoza', 'Ana Lopez Mendoza', '2018-07-08'::DATE, 'Female', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
UNION ALL SELECT school.id, sec.id, '100000000005', 'Jose', 'Fernandez', 'Alvarez', 'Jose Fernandez Alvarez', '2018-02-14'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
UNION ALL SELECT school.id, sec.id, '100000000006', 'Rosa', 'Gomez', 'Ramirez', 'Rosa Gomez Ramirez', '2018-09-25'::DATE, 'Female', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
UNION ALL SELECT school.id, sec.id, '100000000007', 'Carlos', 'Diaz', 'Morales', 'Carlos Diaz Morales', '2018-04-12'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
UNION ALL SELECT school.id, sec.id, '100000000008', 'Luz', 'Ortiz', 'Castro', 'Luz Ortiz Castro', '2018-11-30'::DATE, 'Female', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter'
-- Grade 1 - St. Paul (7 students)
UNION ALL SELECT school.id, sec.id, '100000000009', 'Miguel', 'Flores', 'Rivera', 'Miguel Flores Rivera', '2018-06-18'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Paul'
UNION ALL SELECT school.id, sec.id, '100000000010', 'Elena', 'Vargas', 'Gutierrez', 'Elena Vargas Gutierrez', '2018-08-22'::DATE, 'Female', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Paul'
UNION ALL SELECT school.id, sec.id, '100000000011', 'Rafael', 'Herrera', 'Jimenez', 'Rafael Herrera Jimenez', '2018-03-05'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Paul'
UNION ALL SELECT school.id, sec.id, '100000000012', 'Carmen', 'Medina', 'Navarro', 'Carmen Medina Navarro', '2018-10-11'::DATE, 'Female', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Paul'
UNION ALL SELECT school.id, sec.id, '100000000013', 'Luis', 'Castillo', 'Romero', 'Luis Castillo Romero', '2018-01-28'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Paul'
UNION ALL SELECT school.id, sec.id, '100000000014', 'Isabel', 'Ruiz', 'Soto', 'Isabel Ruiz Soto', '2018-07-16'::DATE, 'Female', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Paul'
UNION ALL SELECT school.id, sec.id, '100000000015', 'Fernando', 'Moreno', 'Delgado', 'Fernando Moreno Delgado', '2018-12-03'::DATE, 'Male', 1, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Paul'
-- Grade 2 - St. John (9 students)
UNION ALL SELECT school.id, sec.id, '100000000016', 'Gloria', 'Perez', 'Ortega', 'Gloria Perez Ortega', '2017-04-09'::DATE, 'Female', 2, 'Enrolled' FROM school, grade1_sections sec WHERE sec.name = 'St. Peter' LIMIT 0
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000016', 'Gloria', 'Perez', 'Ortega', 'Gloria Perez Ortega', '2017-04-09'::DATE, 'Female', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000017', 'Ricardo', 'Silva', 'Molina', 'Ricardo Silva Molina', '2017-09-14'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000018', 'Teresa', 'Castro', 'Vega', 'Teresa Castro Vega', '2017-02-21'::DATE, 'Female', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000019', 'Antonio', 'Rojas', 'Campos', 'Antonio Rojas Campos', '2017-11-07'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000020', 'Patricia', 'Nunez', 'Aguilar', 'Patricia Nunez Aguilar', '2017-05-19'::DATE, 'Female', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000021', 'Manuel', 'Guerrero', 'Prieto', 'Manuel Guerrero Prieto', '2017-08-26'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000022', 'Beatriz', 'Mendez', 'Duran', 'Beatriz Mendez Duran', '2017-01-13'::DATE, 'Female', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000023', 'Diego', 'Fuentes', 'Leon', 'Diego Fuentes Leon', '2017-06-30'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. John'), '100000000024', 'Angelica', 'Solis', 'Crespo', 'Angelica Solis Crespo', '2017-10-17'::DATE, 'Female', 2, 'Enrolled' FROM school
-- Grade 2 - St. Mark (8 students)
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000025', 'Javier', 'Iglesias', 'Rubio', 'Javier Iglesias Rubio', '2017-03-24'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000026', 'Dolores', 'Pascual', 'Marin', 'Dolores Pascual Marin', '2017-12-08'::DATE, 'Female', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000027', 'Andres', 'Gimenez', 'Saenz', 'Andres Gimenez Saenz', '2017-07-15'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000028', 'Cristina', 'Velasco', 'Herrero', 'Cristina Velasco Herrero', '2017-04-02'::DATE, 'Female', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000029', 'Esteban', 'Santana', 'Lorenzo', 'Esteban Santana Lorenzo', '2017-11-19'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000030', 'Pilar', 'Blanco', 'Suarez', 'Pilar Blanco Suarez', '2017-06-06'::DATE, 'Female', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000031', 'Raul', 'Cortes', 'Carrasco', 'Raul Cortes Carrasco', '2017-09-23'::DATE, 'Male', 2, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Mark'), '100000000032', 'Margarita', 'Pena', 'Vazquez', 'Margarita Pena Vazquez', '2017-02-10'::DATE, 'Female', 2, 'Enrolled' FROM school
-- Grade 3 - St. Luke (10 students)
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000033', 'Vicente', 'Alonso', 'Roman', 'Vicente Alonso Roman', '2016-05-12'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000034', 'Concepcion', 'Dominguez', 'Mora', 'Concepcion Dominguez Mora', '2016-10-28'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000035', 'Emilio', 'Ramos', 'Vila', 'Emilio Ramos Vila', '2016-03-17'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000036', 'Francisca', 'Gil', 'Lozano', 'Francisca Gil Lozano', '2016-08-04'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000037', 'Guillermo', 'Serrano', 'Nieto', 'Guillermo Serrano Nieto', '2016-01-21'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000038', 'Josefa', 'Cabrera', 'Gallego', 'Josefa Cabrera Gallego', '2016-12-09'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000039', 'Pablo', 'Marcos', 'Benitez', 'Pablo Marcos Benitez', '2016-07-26'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000040', 'Remedios', 'Carmona', 'Pascual', 'Remedios Carmona Pascual', '2016-04-13'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000041', 'Salvador', 'Moya', 'Santana', 'Salvador Moya Santana', '2016-11-30'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Luke'), '100000000042', 'Amparo', 'Esteban', 'Calvo', 'Amparo Esteban Calvo', '2016-06-17'::DATE, 'Female', 3, 'Enrolled' FROM school
-- Grade 3 - St. Matthew (9 students)
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000043', 'Tomas', 'Bravo', 'Redondo', 'Tomas Bravo Redondo', '2016-09-05'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000044', 'Encarnacion', 'Ibanez', 'Marquez', 'Encarnacion Ibanez Marquez', '2016-02-22'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000045', 'Ignacio', 'Ferrer', 'Santos', 'Ignacio Ferrer Santos', '2016-05-10'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000046', 'Soledad', 'Caballero', 'Reyes', 'Soledad Caballero Reyes', '2016-10-27'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000047', 'Bernardo', 'Pardo', 'Cruz', 'Bernardo Pardo Cruz', '2016-03-15'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000048', 'Rosario', 'Vidal', 'Ramos', 'Rosario Vidal Ramos', '2016-08-01'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000049', 'Lorenzo', 'Sanz', 'Lopez', 'Lorenzo Sanz Lopez', '2016-01-18'::DATE, 'Male', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000050', 'Trinidad', 'Marin', 'Fernandez', 'Trinidad Marin Fernandez', '2016-12-06'::DATE, 'Female', 3, 'Enrolled' FROM school
UNION ALL SELECT school.id, (SELECT id FROM sections WHERE name = 'St. Matthew'), '100000000051', 'Mateo', 'Gallego', 'Gomez', 'Mateo Gallego Gomez', '2016-07-23'::DATE, 'Male', 3, 'Enrolled' FROM school;

-- ==========================================
-- STEP 9: CREATE GRADES (105 Records - Q1 Only)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1),
     grade1_students AS (
       SELECT st.id as student_id
       FROM students st 
       JOIN sections sec ON st.section_id = sec.id 
       WHERE sec.grade_level = 1
     ),
     learning_areas_list AS (
       SELECT id, code, is_composite, components 
       FROM learning_areas 
       WHERE 1 = ANY(grade_levels)
     )
INSERT INTO grades (
  school_id, 
  student_id, 
  learning_area_id, 
  school_year,
  q1,
  composite_grades
)
SELECT 
  school.id,
  gs.student_id,
  la.id,
  '2024-2025',
  (75 + floor(random() * 26))::NUMERIC(5,2), -- Random grade 75-100
  CASE 
    WHEN la.is_composite AND la.components IS NOT NULL THEN
      jsonb_build_object(
        'q1', 
        (SELECT jsonb_object_agg(
          component, 
          (75 + floor(random() * 26))::NUMERIC(5,2)
        )
        FROM unnest(la.components) AS component)
      )
    ELSE NULL
  END
FROM school, grade1_students gs, learning_areas_list la;

-- ==========================================
-- STEP 10: CREATE PARENTS (20 Parents - Enhanced Demo Data)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1),
     all_students AS (
       SELECT st.id, st.name, st.first_name, st.last_name, st.section_id,
              ROW_NUMBER() OVER (ORDER BY st.id) as rn
       FROM students st 
       JOIN sections sec ON st.section_id = sec.id 
       WHERE sec.grade_level IN (1, 2, 3) -- Get students from Grades 1-3
       LIMIT 20 -- Get 20 students to create parent pairs
     ),
     parent_names AS (
       SELECT 
         rn,
         CASE 
           WHEN rn = 1 THEN 'Roberto'
           WHEN rn = 2 THEN 'Maria'
           WHEN rn = 3 THEN 'Juan'
           WHEN rn = 4 THEN 'Elena'
           WHEN rn = 5 THEN 'Pedro'
           WHEN rn = 6 THEN 'Carmen'
           WHEN rn = 7 THEN 'Antonio'
           WHEN rn = 8 THEN 'Rosa'
           WHEN rn = 9 THEN 'Manuel'
           WHEN rn = 10 THEN 'Teresa'
           WHEN rn = 11 THEN 'Francisco'
           WHEN rn = 12 THEN 'Luz'
           WHEN rn = 13 THEN 'Miguel'
           WHEN rn = 14 THEN 'Ana'
           WHEN rn = 15 THEN 'Jose'
           WHEN rn = 16 THEN 'Lourdes'
           WHEN rn = 17 THEN 'Ricardo'
           WHEN rn = 18 THEN 'Cristina'
           WHEN rn = 19 THEN 'Ramon'
           ELSE 'Gloria'
         END as first_name,
         last_name,
         CASE WHEN rn % 2 = 1 THEN 'Father' ELSE 'Mother' END as relationship
       FROM all_students
     )
INSERT INTO parents (school_id, name, relationship, occupation, contact_number, email, address)
SELECT 
  school.id,
  pn.first_name || ' ' || pn.last_name as name,
  pn.relationship,
  CASE 
    WHEN pn.rn % 5 = 0 THEN 'Teacher'
    WHEN pn.rn % 5 = 1 THEN 'Business Owner'
    WHEN pn.rn % 5 = 2 THEN 'Engineer'
    WHEN pn.rn % 5 = 3 THEN 'Nurse'
    ELSE 'Sales Manager'
  END as occupation,
  '+63-9' || LPAD((100000000 + (pn.rn * 12345))::text, 9, '0') as contact_number,
  LOWER(REPLACE(pn.first_name || '.' || pn.last_name, ' ', '')) || '@email.com' as email,
  CASE 
    WHEN pn.rn % 4 = 0 THEN 'Barangay Poblacion, Dolores, Batangas'
    WHEN pn.rn % 4 = 1 THEN 'Barangay San Guillermo, Dolores, Batangas'
    WHEN pn.rn % 4 = 2 THEN 'Barangay Batas, Dolores, Batangas'
    ELSE 'Barangay Corazon, Dolores, Batangas'
  END as address
FROM school
CROSS JOIN parent_names pn;

-- ==========================================
-- STEP 11: LINK PARENTS TO STUDENTS (20 Parent-Student Relationships)
-- ==========================================

WITH parent_data AS (
  SELECT p.id as parent_id, p.name, p.relationship, ROW_NUMBER() OVER (ORDER BY p.created_at) as rn
  FROM parents p
  ORDER BY p.created_at
),
student_data AS (
  SELECT st.id as student_id, st.name, ROW_NUMBER() OVER (ORDER BY st.id) as rn
  FROM students st 
  JOIN sections sec ON st.section_id = sec.id 
  WHERE sec.grade_level IN (1, 2, 3)
  ORDER BY st.id
  LIMIT 20
)
INSERT INTO parent_students (parent_id, student_id, relationship, is_primary_contact)
SELECT 
  pd.parent_id,
  sd.student_id,
  pd.relationship,
  true
FROM parent_data pd
JOIN student_data sd ON pd.rn = sd.rn;

-- ==========================================
-- STEP 12: CREATE CLASS SCHEDULES (18 Schedules)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1)
INSERT INTO class_schedules (
  school_id, 
  section_id, 
  learning_area_id, 
  teacher_id, 
  day_of_week, 
  start_time, 
  end_time
)
SELECT 
  school.id,
  sec.id,
  la.id,
  t.id,
  dow::day_of_week,
  (CASE 
    WHEN dow = 'Monday' THEN '08:00'
    WHEN dow = 'Tuesday' THEN '09:00'
    WHEN dow = 'Wednesday' THEN '10:00'
    WHEN dow = 'Thursday' THEN '11:00'
    ELSE '13:00'
  END)::TIME,
  (CASE 
    WHEN dow = 'Monday' THEN '09:00'
    WHEN dow = 'Tuesday' THEN '10:00'
    WHEN dow = 'Wednesday' THEN '11:00'
    WHEN dow = 'Thursday' THEN '12:00'
    ELSE '14:00'
  END)::TIME
FROM school,
  sections sec,
  learning_areas la,
  teachers t,
  (VALUES ('Monday'), ('Tuesday'), ('Wednesday'), ('Thursday'), ('Friday')) AS days(dow)
WHERE 
  sec.grade_level = 1
  AND 1 = ANY(la.grade_levels)
  AND t.specialization IN ('General Education', 'Mathematics', 'English')
  AND la.code IN ('MATH', 'ENG', 'FIL')
LIMIT 18;

-- ==========================================
-- STEP 13: CREATE ATTENDANCE RECORDS (~75)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1),
     grade1_students AS (
       SELECT st.id, st.section_id
       FROM students st 
       JOIN sections sec ON st.section_id = sec.id 
       WHERE sec.grade_level = 1
     ),
     recent_dates AS (
       SELECT generate_series(
         CURRENT_DATE - INTERVAL '4 days',
         CURRENT_DATE,
         INTERVAL '1 day'
       )::DATE as attendance_date
     )
INSERT INTO attendance_records (school_id, student_id, section_id, date, status, remarks)
SELECT 
  school.id,
  gs.id,
  gs.section_id,
  rd.attendance_date,
  CASE 
    WHEN RANDOM() < 0.9 THEN 'Present'
    WHEN RANDOM() < 0.5 THEN 'Absent'
    ELSE 'Late'
  END::attendance_status,
  NULL
FROM school, grade1_students gs, recent_dates rd
WHERE EXTRACT(DOW FROM rd.attendance_date) NOT IN (0, 6);

-- ==========================================
-- STEP 14: CREATE CORE VALUE GRADES (60)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1),
     grade1_students AS (
       SELECT st.id
       FROM students st 
       JOIN sections sec ON st.section_id = sec.id 
       WHERE sec.grade_level = 1
     ),
     core_values_list AS (
       SELECT id, code
       FROM core_values
     )
INSERT INTO core_value_grades (
  school_id, 
  student_id, 
  core_value_id, 
  school_year,
  q1
)
SELECT 
  school.id,
  gs.id,
  cv.id,
  '2024-2025',
  (ARRAY['AO', 'SO', 'RO'])[1 + floor(random() * 3)]::core_value_rating
FROM school, grade1_students gs, core_values_list cv;

-- Update with indicator ratings
UPDATE core_value_grades cvg
SET indicator_ratings = (
  SELECT jsonb_build_object(
    'q1',
    (SELECT jsonb_object_agg(
      indicator,
      (ARRAY['AO', 'SO', 'RO', 'NO'])[1 + floor(random() * 4)]
    )
    FROM unnest(cv.indicators) AS indicator)
  )
  FROM core_values cv
  WHERE cv.id = cvg.core_value_id
  AND cv.indicators IS NOT NULL
  AND array_length(cv.indicators, 1) > 0
);

-- ==========================================
-- STEP 15: CREATE ASSIGNMENTS (12)
-- ==========================================

WITH school AS (SELECT id FROM schools LIMIT 1),
     grade1_sections AS (
       SELECT sec.id, sec.name
       FROM sections sec
       WHERE sec.grade_level = 1
     ),
     math_subject AS (
       SELECT id FROM learning_areas WHERE code = 'MATH' LIMIT 1
     ),
     math_teacher AS (
       SELECT id FROM teachers WHERE specialization = 'Mathematics' LIMIT 1
     )
INSERT INTO assignments (
  school_id,
  section_id,
  learning_area_id,
  teacher_id,
  title,
  description,
  due_date,
  max_score
)
SELECT 
  school.id,
  sec.id,
  math_subject.id,
  math_teacher.id,
  'Addition Practice ' || sec.name,
  'Complete exercises 1-10 on page 15. Show your solutions.',
  CURRENT_DATE + INTERVAL '3 days',
  20
FROM school, grade1_sections sec, math_subject, math_teacher

UNION ALL

SELECT 
  school.id,
  sec.id,
  math_subject.id,
  math_teacher.id,
  'Number Patterns Quiz ' || sec.name,
  'Identify the next 3 numbers in each pattern.',
  CURRENT_DATE + INTERVAL '5 days',
  15
FROM school, grade1_sections sec, math_subject, math_teacher;

-- ==========================================
-- STEP 16: VERIFICATION
-- ==========================================

SELECT 'Assignments' as table_name, COUNT(*) as count FROM assignments
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'Class Schedules', COUNT(*) FROM class_schedules
UNION ALL
SELECT 'Core Value Grades', COUNT(*) FROM core_value_grades
UNION ALL
SELECT 'Core Values', COUNT(*) FROM core_values
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
UNION ALL
SELECT 'Learning Areas', COUNT(*) FROM learning_areas
UNION ALL
SELECT 'Parent-Student Links', COUNT(*) FROM parent_students
UNION ALL
SELECT 'Parents', COUNT(*) FROM parents
UNION ALL
SELECT 'Schools', COUNT(*) FROM schools
UNION ALL
SELECT 'Sections', COUNT(*) FROM sections
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'Users', COUNT(*) FROM users
ORDER BY table_name;

-- ==========================================
-- ✅ EXPECTED RESULTS:
-- Assignments: 12
-- Attendance Records: ~75
-- Class Schedules: 18
-- Core Value Grades: 60
-- Core Values: 4
-- Grades: 105
-- Learning Areas: 9
-- Parent-Student Links: 10
-- Parents: 10
-- Schools: 1
-- Sections: 6
-- Students: 51
-- Teachers: 5
-- Users: 5
-- ==========================================
