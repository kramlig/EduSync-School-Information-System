-- ============================================================================
-- FIX MISSING GRADES FOR NON-LITERACY SUBJECTS
-- This script adds grades for Math, Science, Filipino, AP, ESP, EPP, MAPEH
-- ============================================================================

-- First, verify what learning areas exist
SELECT 'Learning Areas per School (sample)' as check_type;
SELECT la.code, la.name, ARRAY_TO_STRING(la.grade_levels, ',') as grades, COUNT(*) as school_count
FROM learning_areas la
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY la.code, la.name, la.grade_levels
ORDER BY la.code;

-- Check current grade counts by subject
SELECT 'Current Grades by Subject' as check_type;
SELECT la.code, COUNT(g.id) as grade_count
FROM learning_areas la
LEFT JOIN grades g ON g.learning_area_id = la.id
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY la.code
ORDER BY la.code;

-- ============================================================================
-- INSERT MISSING GRADES FOR ALL SUBJECTS
-- ============================================================================

-- Create temp table for school performance profiles (same as original seed)
DROP TABLE IF EXISTS school_performance_fix;
CREATE TEMP TABLE school_performance_fix AS
SELECT 
  s.id as school_id,
  s.name,
  s.district,
  CASE 
    WHEN s.name ILIKE '%Central%' OR s.name ILIKE '%Don Enrique%' OR s.name ILIKE '%Tagabakid%' 
         OR s.name ILIKE '%Onotan%' OR s.name ILIKE '%Culian%' THEN 'high'
    WHEN s.name ILIKE '%Mayor%' OR s.name ILIKE '%Memorial%' OR s.name ILIKE '%Integrated%' THEN 'medium'
    WHEN s.name ILIKE '%Buso%' OR s.name ILIKE '%Bobon%' OR s.name ILIKE '%Matiao%' THEN 'low'
    ELSE (ARRAY['low', 'medium', 'medium', 'high'])[1 + floor(random() * 4)::int]
  END as performance_tier,
  random() as school_seed
FROM schools s
WHERE s.division = 'Division of City of Mati'
  AND s.school_id_number IS NOT NULL;

-- Insert grades for subjects that don't have grades yet
-- Only insert where no grade exists for that student + learning_area combination
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2024-2025' as school_year,
  -- Q1 grade
  LEAST(100, GREATEST(60, ROUND((
    CASE sp.performance_tier
      WHEN 'high' THEN 80 + (random() * 15)
      WHEN 'medium' THEN 72 + (random() * 15)
      ELSE 65 + (random() * 15)
    END + (sp.school_seed * 4 - 2)
  )::NUMERIC, 2))) as q1,
  -- Q2 grade (slightly better than Q1)
  LEAST(100, GREATEST(60, ROUND((
    CASE sp.performance_tier
      WHEN 'high' THEN 82 + (random() * 14)
      WHEN 'medium' THEN 74 + (random() * 14)
      ELSE 67 + (random() * 14)
    END + (sp.school_seed * 4 - 2)
  )::NUMERIC, 2))) as q2,
  NOW() as created_at,
  NOW() as updated_at
FROM students st
JOIN schools s ON st.school_id = s.id
JOIN sections sec ON st.section_id = sec.id
JOIN learning_areas la ON la.school_id = st.school_id
JOIN school_performance_fix sp ON sp.school_id = st.school_id
WHERE s.division = 'Division of City of Mati'
  AND sec.grade_level = ANY(la.grade_levels)
  -- Only insert for subjects that DON'T already have grades for this student
  AND NOT EXISTS (
    SELECT 1 FROM grades g 
    WHERE g.student_id = st.id 
    AND g.learning_area_id = la.id
    AND g.school_year = '2024-2025'
  );

DROP TABLE IF EXISTS school_performance_fix;

-- Verify the fix
SELECT 'After Fix - Grades by Subject' as check_type;
SELECT la.code, COUNT(g.id) as grade_count
FROM learning_areas la
LEFT JOIN grades g ON g.learning_area_id = la.id
JOIN schools s ON la.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY la.code
ORDER BY la.code;

SELECT 'Fix complete!' as status;
