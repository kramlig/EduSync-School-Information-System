-- ==========================================
-- SEED CLEAN POSTGRESQL DATABASE
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. INSERT SCHOOL
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

-- Copy the school ID from above and replace YOUR_SCHOOL_ID below

-- 2. INSERT TEACHERS (replace YOUR_SCHOOL_ID with actual ID)
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

-- 3. CREATE TEACHER PROFILES
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

-- 4. CREATE SECTIONS
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

-- 5. CREATE LEARNING AREAS (ONE MAPEH, not 5!)
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

-- 6. CREATE DEPED CORE VALUES
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

-- 7. VERIFY SEEDING
SELECT 'Schools' as table_name, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'Sections', COUNT(*) FROM sections
UNION ALL
SELECT 'Learning Areas', COUNT(*) FROM learning_areas
UNION ALL
SELECT 'Core Values', COUNT(*) FROM core_values
ORDER BY table_name;

-- ==========================================
-- EXPECTED RESULTS:
-- Schools: 1
-- Users: 5 (teachers)
-- Teachers: 5
-- Sections: 6 (Grade 1-3, 2 sections each)
-- Learning Areas: 9 (including 1 MAPEH composite)
-- Core Values: 4
-- ==========================================
