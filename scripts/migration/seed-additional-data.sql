-- ==========================================
-- COMPLETE SEEDING - ALL REMAINING TABLES
-- Run this AFTER seed-clean-data-fresh.sql
-- Run this in Supabase SQL Editor
-- ==========================================

-- STEP 1: ADD PARENTS (20 parents for Grade 1 students)
WITH school AS (SELECT id FROM schools LIMIT 1),
     grade1_students AS (
       SELECT st.id, st.name, st.first_name, st.last_name, ROW_NUMBER() OVER (ORDER BY st.id) as rn
       FROM students st 
       JOIN sections sec ON st.section_id = sec.id 
       WHERE sec.grade_level = 1
       LIMIT 10 -- First 10 students get parents
     )
INSERT INTO parents (school_id, name, relationship, contact_number, email, address)
SELECT 
  school.id,
  CASE 
    WHEN (gs.rn % 2) = 1 THEN 'Mr. ' || gs.last_name
    ELSE 'Mrs. ' || gs.last_name
  END,
  CASE 
    WHEN (gs.rn % 2) = 1 THEN 'Father'
    ELSE 'Mother'
  END,
  '+63-' || LPAD((900000000 + (gs.rn * 12345))::text, 10, '0'),
  LOWER(REPLACE(gs.last_name, ' ', '.')) || '@gmail.com',
  'Dolores, Batangas'
FROM school, grade1_students gs;

-- STEP 2: LINK PARENTS TO STUDENTS
WITH parent_data AS (
  SELECT p.id as parent_id, p.name, ROW_NUMBER() OVER (ORDER BY p.id) as rn
  FROM parents p
),
student_data AS (
  SELECT st.id as student_id, st.name, ROW_NUMBER() OVER (ORDER BY st.id) as rn
  FROM students st 
  JOIN sections sec ON st.section_id = sec.id 
  WHERE sec.grade_level = 1
  LIMIT 10
)
INSERT INTO parent_students (parent_id, student_id, is_primary_contact)
SELECT 
  pd.parent_id,
  sd.student_id,
  true
FROM parent_data pd
JOIN student_data sd ON pd.rn = sd.rn;

-- STEP 3: CREATE CLASS SCHEDULES (teacher-section-subject assignments)
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
  sec.grade_level = 1 -- Only Grade 1 sections
  AND 1 = ANY(la.grade_levels) -- Only subjects for Grade 1
  AND t.specialization IN ('General Education', 'Mathematics', 'English') -- Relevant teachers
  AND la.code IN ('MATH', 'ENG', 'FIL') -- Core subjects only
LIMIT 18; -- 6 sections × 3 subjects = 18 schedules

-- STEP 4: CREATE ATTENDANCE RECORDS (last 5 days for Grade 1)
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
    WHEN RANDOM() < 0.9 THEN 'Present' -- 90% attendance rate
    WHEN RANDOM() < 0.5 THEN 'Absent'
    ELSE 'Late'
  END::attendance_status,
  NULL
FROM school, grade1_students gs, recent_dates rd
WHERE EXTRACT(DOW FROM rd.attendance_date) NOT IN (0, 6); -- Skip weekends

-- STEP 5: CREATE CORE VALUE GRADES (Q1 ratings for Grade 1)
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
  (ARRAY['AO', 'SO', 'RO'])[1 + floor(random() * 3)]::core_value_rating -- Random rating
FROM school, grade1_students gs, core_values_list cv;

-- STEP 6: CREATE ASSIGNMENTS (2 per Grade 1 section)
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

-- STEP 7: VERIFY ALL SEEDING
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
UNION ALL
SELECT 'Parents', COUNT(*) FROM parents
UNION ALL
SELECT 'Parent-Student Links', COUNT(*) FROM parent_students
UNION ALL
SELECT 'Class Schedules', COUNT(*) FROM class_schedules
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'Core Value Grades', COUNT(*) FROM core_value_grades
UNION ALL
SELECT 'Assignments', COUNT(*) FROM assignments
ORDER BY table_name;

-- ==========================================
-- ✅ EXPECTED RESULTS (Complete School Data):
-- Assignments: ~12 (2 per Grade 1 section)
-- Attendance Records: ~75 (15 students × 5 days)
-- Class Schedules: 18 (6 sections × 3 subjects)
-- Core Value Grades: 60 (15 students × 4 core values)
-- Core Values: 4 (with behavioral indicators)
-- Grades: 105 (7 subjects × 15 Grade 1 students)
-- Learning Areas: 9 (including 1 MAPEH composite)
-- Parent-Student Links: 10
-- Parents: 10 (for first 10 Grade 1 students)
-- Schools: 1 (Dolores Elementary)
-- Sections: 6 (Grade 1-3, 2 sections each)
-- Students: 51 (realistic class sizes)
-- Teachers: 5 (subject specialists)
-- Users: 5 (all teachers)
-- ==========================================
