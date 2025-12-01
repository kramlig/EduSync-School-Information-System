-- ==========================================
-- SEED DEMO PARENTS FOR DEMO SCHOOL
-- Quick script to add parent data to existing database
-- Run this in Supabase SQL Editor
-- ==========================================

-- NOTE: This assumes you already have:
-- 1. School created
-- 2. Students created in Grades 1-3
-- 3. Sections created

-- ==========================================
-- STEP 1: CREATE 45 DEMO PARENTS (for pagination testing)
-- ==========================================

WITH school AS (SELECT id FROM schools WHERE name = 'Demo School' LIMIT 1),
     all_students AS (
       SELECT st.id, st.name, st.first_name, st.last_name, st.section_id,
              ROW_NUMBER() OVER (ORDER BY st.id) as rn
       FROM students st 
       JOIN sections sec ON st.section_id = sec.id 
       WHERE sec.grade_level IN (1, 2, 3, 4, 5, 6) -- Get students from Grades 1-6
       LIMIT 45 -- Get 45 students to create parent pairs
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
           WHEN rn = 20 THEN 'Gloria'
           WHEN rn = 21 THEN 'Fernando'
           WHEN rn = 22 THEN 'Lucia'
           WHEN rn = 23 THEN 'Carlos'
           WHEN rn = 24 THEN 'Isabel'
           WHEN rn = 25 THEN 'Rodrigo'
           WHEN rn = 26 THEN 'Patricia'
           WHEN rn = 27 THEN 'Eduardo'
           WHEN rn = 28 THEN 'Angelica'
           WHEN rn = 29 THEN 'Gabriel'
           WHEN rn = 30 THEN 'Beatriz'
           WHEN rn = 31 THEN 'Alfredo'
           WHEN rn = 32 THEN 'Victoria'
           WHEN rn = 33 THEN 'Rafael'
           WHEN rn = 34 THEN 'Marcela'
           WHEN rn = 35 THEN 'Leonardo'
           WHEN rn = 36 THEN 'Rosario'
           WHEN rn = 37 THEN 'Ernesto'
           WHEN rn = 38 THEN 'Josefina'
           WHEN rn = 39 THEN 'Enrique'
           WHEN rn = 40 THEN 'Dolores'
           WHEN rn = 41 THEN 'Arturo'
           WHEN rn = 42 THEN 'Remedios'
           WHEN rn = 43 THEN 'Salvador'
           WHEN rn = 44 THEN 'Concepcion'
           ELSE 'Alberto'
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
    WHEN pn.rn % 10 = 0 THEN 'Teacher'
    WHEN pn.rn % 10 = 1 THEN 'Business Owner'
    WHEN pn.rn % 10 = 2 THEN 'Engineer'
    WHEN pn.rn % 10 = 3 THEN 'Nurse'
    WHEN pn.rn % 10 = 4 THEN 'Sales Manager'
    WHEN pn.rn % 10 = 5 THEN 'Accountant'
    WHEN pn.rn % 10 = 6 THEN 'Doctor'
    WHEN pn.rn % 10 = 7 THEN 'Lawyer'
    WHEN pn.rn % 10 = 8 THEN 'Architect'
    ELSE 'Government Employee'
  END as occupation,
  '+63-9' || LPAD((100000000 + (pn.rn * 12345))::text, 9, '0') as contact_number,
  LOWER(REPLACE(pn.first_name || '.' || pn.last_name, ' ', '')) || '@email.com' as email,
  CASE 
    WHEN pn.rn % 6 = 0 THEN 'Barangay Poblacion, Dolores, Batangas'
    WHEN pn.rn % 6 = 1 THEN 'Barangay San Guillermo, Dolores, Batangas'
    WHEN pn.rn % 6 = 2 THEN 'Barangay Batas, Dolores, Batangas'
    WHEN pn.rn % 6 = 3 THEN 'Barangay Corazon, Dolores, Batangas'
    WHEN pn.rn % 6 = 4 THEN 'Barangay Burol, Dolores, Batangas'
    ELSE 'Barangay Masaguitsit, Dolores, Batangas'
  END as address
FROM school
CROSS JOIN parent_names pn;

-- ==========================================
-- STEP 2: LINK PARENTS TO STUDENTS
-- ==========================================

WITH parent_data AS (
  SELECT p.id as parent_id, p.name, p.relationship, ROW_NUMBER() OVER (ORDER BY p.created_at) as rn
  FROM parents p
  WHERE p.created_at >= NOW() - INTERVAL '1 minute' -- Only newly created parents
  ORDER BY p.created_at
),
student_data AS (
  SELECT st.id as student_id, st.name, ROW_NUMBER() OVER (ORDER BY st.id) as rn
  FROM students st 
  JOIN sections sec ON st.section_id = sec.id 
  WHERE sec.grade_level IN (1, 2, 3, 4, 5, 6)
  ORDER BY st.id
  LIMIT 45
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
-- VERIFICATION QUERIES
-- ==========================================

-- Count parents created
SELECT COUNT(*) as total_parents FROM parents;

-- Count parent-student relationships
SELECT COUNT(*) as total_relationships FROM parent_students;

-- Show sample parent data
SELECT 
  p.name,
  p.relationship,
  p.occupation,
  p.contact_number,
  p.email,
  COUNT(ps.student_id) as num_children
FROM parents p
LEFT JOIN parent_students ps ON p.id = ps.parent_id
GROUP BY p.id, p.name, p.relationship, p.occupation, p.contact_number, p.email
ORDER BY p.created_at DESC
LIMIT 10;

-- Show parent-student relationships
SELECT 
  p.name as parent_name,
  p.relationship,
  s.name as student_name,
  sec.name as section_name
FROM parents p
JOIN parent_students ps ON p.id = ps.parent_id
JOIN students s ON ps.student_id = s.id
JOIN sections sec ON s.section_id = sec.id
ORDER BY p.name, s.name
LIMIT 20;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT '✅ Demo parents seeded successfully!' as status;
