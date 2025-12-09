-- ============================================================================
-- Seed Learning Areas and Grades for Division of City of Mati
-- This enables the Division Proficiency Report to show data
-- 
-- Run this in Supabase SQL Editor
-- Estimated: ~160,000 grade records for ~40,000 students
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Learning Areas for all schools that don't have them
-- ============================================================================

-- First, let's see which schools need learning areas
-- SELECT s.id, s.name, COUNT(la.id) as la_count
-- FROM schools s
-- LEFT JOIN learning_areas la ON s.id = la.school_id
-- WHERE s.deleted_at IS NULL
-- GROUP BY s.id, s.name
-- HAVING COUNT(la.id) = 0
-- LIMIT 10;

-- Insert Filipino (Language) for all schools without learning areas
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'Filipino',
  'FIL',
  'Filipino Language Arts',
  ARRAY[1,2,3,4,5,6]::integer[],
  false,
  true,
  1,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'FIL'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- Insert English for all schools
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'English',
  'ENG',
  'English Language Arts',
  ARRAY[1,2,3,4,5,6]::integer[],
  false,
  true,
  2,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'ENG'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- Insert Mother Tongue (MTB-MLE) for Grades 1-3
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'Mother Tongue Based-Multilingual Education',
  'MTB',
  'Mother Tongue (MTB-MLE) for Grades 1-3',
  ARRAY[1,2,3]::integer[],
  false,
  true,
  3,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'MTB'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- Insert Mathematics
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'Mathematics',
  'MATH',
  'Mathematics',
  ARRAY[1,2,3,4,5,6]::integer[],
  false,
  true,
  4,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'MATH'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- Insert Science
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'Science',
  'SCI',
  'Science',
  ARRAY[3,4,5,6]::integer[],
  false,
  true,
  5,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'SCI'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- Insert Araling Panlipunan
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'Araling Panlipunan',
  'AP',
  'Social Studies',
  ARRAY[1,2,3,4,5,6]::integer[],
  false,
  true,
  6,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'AP'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- Insert ESP (Edukasyon sa Pagpapakatao)
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'Edukasyon sa Pagpapakatao',
  'ESP',
  'Values Education',
  ARRAY[1,2,3,4,5,6]::integer[],
  false,
  true,
  7,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'ESP'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- Insert MAPEH (Composite)
INSERT INTO learning_areas (id, school_id, name, code, description, grade_levels, is_composite, components, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'MAPEH',
  'MAPEH',
  'Music, Arts, Physical Education, Health',
  ARRAY[1,2,3,4,5,6]::integer[],
  true,
  ARRAY['Music', 'Arts', 'PE', 'Health']::varchar[],
  true,
  8,
  NOW(),
  NOW()
FROM schools s
LEFT JOIN learning_areas la ON s.id = la.school_id AND la.code = 'MAPEH'
WHERE s.deleted_at IS NULL
  AND la.id IS NULL;

-- ============================================================================
-- STEP 2: Create Grades for all students (Filipino - Language subject)
-- Uses random realistic grades between 75-98
-- ============================================================================

-- Filipino grades for all students (Grades 1-6)
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2025-2026',
  -- Q1: Random grade 75-98
  75 + (random() * 23)::int,
  -- Q2: Random grade 75-98
  75 + (random() * 23)::int,
  -- Q3: Random grade 75-98  
  75 + (random() * 23)::int,
  -- Q4: Random grade 75-98
  75 + (random() * 23)::int,
  -- Final: Average of Q1-Q4 (will calculate)
  NULL,
  NOW(),
  NOW()
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON st.school_id = la.school_id AND la.code = 'FIL'
LEFT JOIN grades g ON st.id = g.student_id AND la.id = g.learning_area_id
WHERE st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
  AND sec.grade_level BETWEEN 1 AND 6
  AND g.id IS NULL;  -- Don't duplicate if already exists

-- English grades for all students (Grades 1-6)
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2025-2026',
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  NULL,
  NOW(),
  NOW()
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON st.school_id = la.school_id AND la.code = 'ENG'
LEFT JOIN grades g ON st.id = g.student_id AND la.id = g.learning_area_id
WHERE st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
  AND sec.grade_level BETWEEN 1 AND 6
  AND g.id IS NULL;

-- Mother Tongue grades for Grades 1-3 only
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2025-2026',
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  NULL,
  NOW(),
  NOW()
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON st.school_id = la.school_id AND la.code = 'MTB'
LEFT JOIN grades g ON st.id = g.student_id AND la.id = g.learning_area_id
WHERE st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
  AND sec.grade_level BETWEEN 1 AND 3  -- MTB only for Grades 1-3
  AND g.id IS NULL;

-- Mathematics grades
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2025-2026',
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  NULL,
  NOW(),
  NOW()
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON st.school_id = la.school_id AND la.code = 'MATH'
LEFT JOIN grades g ON st.id = g.student_id AND la.id = g.learning_area_id
WHERE st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
  AND sec.grade_level BETWEEN 1 AND 6
  AND g.id IS NULL;

-- Science grades (Grades 3-6)
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2025-2026',
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  NULL,
  NOW(),
  NOW()
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON st.school_id = la.school_id AND la.code = 'SCI'
LEFT JOIN grades g ON st.id = g.student_id AND la.id = g.learning_area_id
WHERE st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
  AND sec.grade_level BETWEEN 3 AND 6
  AND g.id IS NULL;

-- Araling Panlipunan grades
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2025-2026',
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  NULL,
  NOW(),
  NOW()
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON st.school_id = la.school_id AND la.code = 'AP'
LEFT JOIN grades g ON st.id = g.student_id AND la.id = g.learning_area_id
WHERE st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
  AND sec.grade_level BETWEEN 1 AND 6
  AND g.id IS NULL;

-- ESP grades
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2025-2026',
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  75 + (random() * 23)::int,
  NULL,
  NOW(),
  NOW()
FROM students st
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON st.school_id = la.school_id AND la.code = 'ESP'
LEFT JOIN grades g ON st.id = g.student_id AND la.id = g.learning_area_id
WHERE st.deleted_at IS NULL
  AND st.enrollment_status = 'enrolled'
  AND sec.grade_level BETWEEN 1 AND 6
  AND g.id IS NULL;

-- ============================================================================
-- STEP 3: Update final grades (average of Q1-Q4)
-- ============================================================================

UPDATE grades
SET final_grade = ROUND((COALESCE(q1, 0) + COALESCE(q2, 0) + COALESCE(q3, 0) + COALESCE(q4, 0)) / 
  NULLIF(
    (CASE WHEN q1 IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN q2 IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN q3 IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN q4 IS NOT NULL THEN 1 ELSE 0 END), 0
  ), 2)
WHERE final_grade IS NULL
  AND (q1 IS NOT NULL OR q2 IS NOT NULL OR q3 IS NOT NULL OR q4 IS NOT NULL);

-- ============================================================================
-- STEP 4: Verify the seeding
-- ============================================================================

-- Check learning areas count by school
SELECT 'Learning Areas' as metric, COUNT(*) as count FROM learning_areas;

-- Check grades count
SELECT 'Total Grades' as metric, COUNT(*) as count FROM grades;

-- Check grades by subject
SELECT la.code, COUNT(g.id) as grade_count
FROM learning_areas la
LEFT JOIN grades g ON la.id = g.learning_area_id
GROUP BY la.code
ORDER BY grade_count DESC;

-- Check proficiency data availability
SELECT 
  d.name as division,
  COUNT(DISTINCT s.id) as schools,
  COUNT(DISTINCT st.id) as students,
  COUNT(DISTINCT g.id) as grades,
  COUNT(DISTINCT la.id) as learning_areas
FROM divisions d
JOIN schools s ON s.division_id = d.id
LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
LEFT JOIN grades g ON g.school_id = s.id
LEFT JOIN learning_areas la ON la.school_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY d.id, d.name
ORDER BY students DESC;
