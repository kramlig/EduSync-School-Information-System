-- ============================================================================
-- SEED DEMO GRADES (Q1 & Q2) - BATCH INSERT VERSION
-- Run AFTER: 03a_assign_sections.sql
-- This uses a single INSERT...SELECT for maximum performance
-- ============================================================================

-- Clear existing grades for Mati schools
DELETE FROM grades WHERE school_id IN (
  SELECT id FROM schools WHERE division = 'Division of City of Mati'
);

-- Insert all grades in one batch using set-based operations
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2024-2025' as school_year,
  -- Q1 grade with realistic distribution
  ROUND(
    CASE 
      WHEN random() < 0.05 THEN 60 + (random() * 14)  -- DNME: 60-74 (5%)
      WHEN random() < 0.25 THEN 75 + (random() * 4)   -- FS: 75-79 (20%)
      WHEN random() < 0.60 THEN 80 + (random() * 4)   -- S: 80-84 (35%)
      WHEN random() < 0.85 THEN 85 + (random() * 4)   -- VS: 85-89 (25%)
      ELSE 90 + (random() * 10)                        -- O: 90-100 (15%)
    END::NUMERIC, 2
  ) as q1,
  -- Q2 grade (similar distribution, slightly higher tendency)
  ROUND(
    CASE 
      WHEN random() < 0.04 THEN 62 + (random() * 12)  -- DNME: 62-74 (4%)
      WHEN random() < 0.22 THEN 75 + (random() * 4)   -- FS: 75-79 (18%)
      WHEN random() < 0.55 THEN 80 + (random() * 4)   -- S: 80-84 (33%)
      WHEN random() < 0.82 THEN 85 + (random() * 4)   -- VS: 85-89 (27%)
      ELSE 90 + (random() * 10)                        -- O: 90-100 (18%)
    END::NUMERIC, 2
  ) as q2,
  NOW() as created_at,
  NOW() as updated_at
FROM students st
JOIN schools s ON st.school_id = s.id
JOIN learning_areas la ON la.school_id = st.school_id
WHERE s.division = 'Division of City of Mati'
  AND st.grade_level = ANY(la.grade_levels);

-- Verification: Total grades created
SELECT 'Total grade records created' as status, COUNT(*) as count FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati';
