-- ============================================================================
-- SEED DEMO GRADES (Q1 & Q2) - REALISTIC DIVISION VARIANCE VERSION
-- Based on actual DepEd Division of City of Mati Q2 Proficiency data
-- 
-- ACTUAL DATA SHOWS:
--   - Wide variance between schools (40-90% MPS)
--   - Some schools performing low (20-40% passing)
--   - Some schools performing high (80-95% passing)
--   - Urban schools tend to perform differently than rural
--
-- This version creates realistic per-school variance
-- ============================================================================

-- Clear existing grades for Mati schools
DELETE FROM grades WHERE school_id IN (
  SELECT id FROM schools WHERE division = 'Division of City of Mati'
);

-- Create a temporary table with school performance profiles
-- Based on actual Division data patterns
CREATE TEMP TABLE school_performance AS
SELECT 
  s.id as school_id,
  s.name,
  s.district,
  -- Assign performance tier based on school characteristics
  -- This mirrors actual Division data variance
  CASE 
    -- High performers (similar to Onotan Daganio, Tagabakid, Don Enrique Lopez)
    WHEN s.name ILIKE '%Central%' OR s.name ILIKE '%Don Enrique%' OR s.name ILIKE '%Tagabakid%' 
         OR s.name ILIKE '%Onotan%' OR s.name ILIKE '%Culian%' THEN 'high'
    -- Medium performers (similar to Mayor Santiago, Baso, etc.)
    WHEN s.name ILIKE '%Mayor%' OR s.name ILIKE '%Memorial%' OR s.name ILIKE '%Integrated%' THEN 'medium'
    -- Lower performers (similar to some rural schools)
    WHEN s.name ILIKE '%Buso%' OR s.name ILIKE '%Bobon%' OR s.name ILIKE '%Matiao%' THEN 'low'
    -- Random distribution for others
    ELSE (ARRAY['low', 'medium', 'medium', 'high'])[1 + floor(random() * 4)::int]
  END as performance_tier,
  -- Add some randomness within tier
  random() as school_seed
FROM schools s
WHERE s.division = 'Division of City of Mati'
  AND s.school_id_number IS NOT NULL;

-- Insert grades with realistic per-school variance
-- NOTE: grades table has CHECK constraint: q1/q2 must be 60-100
INSERT INTO grades (id, school_id, student_id, learning_area_id, school_year, q1, q2, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  st.school_id,
  st.id as student_id,
  la.id as learning_area_id,
  '2024-2025' as school_year,
  -- Q1 grade based on school performance tier (60-100 range enforced with LEAST/GREATEST)
  LEAST(100, GREATEST(60, ROUND((
    CASE sp.performance_tier
      WHEN 'high' THEN
        -- High performers: 75-98 range, most 80+
        CASE 
          WHEN random() < 0.10 THEN 72 + (random() * 8)    -- 10% at 72-80
          WHEN random() < 0.30 THEN 78 + (random() * 5)    -- 20% at 78-83
          WHEN random() < 0.60 THEN 82 + (random() * 6)    -- 30% at 82-88
          WHEN random() < 0.85 THEN 86 + (random() * 6)    -- 25% at 86-92
          ELSE 90 + (random() * 7)                          -- 15% at 90-97
        END
      WHEN 'medium' THEN
        -- Medium performers: 65-88 range, most 72-82
        CASE 
          WHEN random() < 0.15 THEN 62 + (random() * 8)    -- 15% at 62-70
          WHEN random() < 0.35 THEN 68 + (random() * 7)    -- 20% at 68-75
          WHEN random() < 0.65 THEN 75 + (random() * 5)    -- 30% at 75-80
          WHEN random() < 0.85 THEN 80 + (random() * 5)    -- 20% at 80-85
          ELSE 85 + (random() * 8)                          -- 15% at 85-93
        END
      ELSE -- 'low'
        -- Low performers: 60-78 range, most 62-72
        CASE 
          WHEN random() < 0.25 THEN 60 + (random() * 5)    -- 25% at 60-65
          WHEN random() < 0.55 THEN 64 + (random() * 6)    -- 30% at 64-70
          WHEN random() < 0.80 THEN 68 + (random() * 6)    -- 25% at 68-74
          WHEN random() < 0.92 THEN 74 + (random() * 4)    -- 12% at 74-78
          ELSE 78 + (random() * 6)                          -- 8% at 78-84
        END
    END + (sp.school_seed * 4 - 2)
  )::NUMERIC, 2))) as q1,
  -- Q2 grade (slight improvement from Q1, 60-100 range enforced)
  LEAST(100, GREATEST(60, ROUND((
    CASE sp.performance_tier
      WHEN 'high' THEN
        CASE 
          WHEN random() < 0.08 THEN 74 + (random() * 6)
          WHEN random() < 0.25 THEN 78 + (random() * 5)
          WHEN random() < 0.55 THEN 82 + (random() * 6)
          WHEN random() < 0.82 THEN 86 + (random() * 6)
          ELSE 91 + (random() * 6)
        END
      WHEN 'medium' THEN
        CASE 
          WHEN random() < 0.12 THEN 64 + (random() * 6)
          WHEN random() < 0.32 THEN 70 + (random() * 5)
          WHEN random() < 0.62 THEN 75 + (random() * 5)
          WHEN random() < 0.85 THEN 80 + (random() * 5)
          ELSE 85 + (random() * 8)
        END
      ELSE
        CASE 
          WHEN random() < 0.22 THEN 60 + (random() * 5)
          WHEN random() < 0.52 THEN 64 + (random() * 6)
          WHEN random() < 0.78 THEN 69 + (random() * 6)
          WHEN random() < 0.92 THEN 75 + (random() * 4)
          ELSE 79 + (random() * 6)
        END
    END + (sp.school_seed * 4 - 2)
  )::NUMERIC, 2))) as q2,
  NOW() as created_at,
  NOW() as updated_at
FROM students st
JOIN schools s ON st.school_id = s.id
JOIN learning_areas la ON la.school_id = st.school_id
JOIN school_performance sp ON sp.school_id = st.school_id
WHERE s.division = 'Division of City of Mati'
  AND st.grade_level = ANY(la.grade_levels);

-- Cleanup temp table
DROP TABLE school_performance;

-- Verification
SELECT 'Grade records created' as status, COUNT(*) as count 
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati';
