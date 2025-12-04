-- Populate Q2, Q3, Q4 grades based on existing Q1 grades
-- This creates realistic quarterly progression for testing promotion calculation
-- 
-- USAGE: Run this in Supabase SQL Editor or via psql
-- 
-- IMPORTANT: This will only update records that have Q1 but missing Q2/Q3/Q4

-- Update Q2 (slight improvement from Q1)
UPDATE grades
SET 
  q2 = LEAST(100, q1 + FLOOR(RANDOM() * 5 - 1)),  -- Q1 ± 1 to +4
  updated_at = NOW()
WHERE q1 IS NOT NULL 
  AND q2 IS NULL
  AND deleted_at IS NULL;

-- Update Q3 (maintain or slight improvement)
UPDATE grades
SET 
  q3 = LEAST(100, GREATEST(60, q2 + FLOOR(RANDOM() * 4 - 2))),  -- Q2 ± 2 to +2
  updated_at = NOW()
WHERE q2 IS NOT NULL 
  AND q3 IS NULL
  AND deleted_at IS NULL;

-- Update Q4 (final push, usually higher)
UPDATE grades
SET 
  q4 = LEAST(100, GREATEST(60, q3 + FLOOR(RANDOM() * 6 - 1))),  -- Q3 ± 1 to +5
  updated_at = NOW()
WHERE q3 IS NOT NULL 
  AND q4 IS NULL
  AND deleted_at IS NULL;

-- Calculate final_grade and remarks
UPDATE grades
SET 
  final_grade = ROUND((q1 + q2 + q3 + q4) / 4.0, 2),
  remarks = CASE 
    WHEN ROUND((q1 + q2 + q3 + q4) / 4.0, 2) >= 75 THEN 'Passed'
    ELSE 'Failed'
  END,
  updated_at = NOW()
WHERE q1 IS NOT NULL 
  AND q2 IS NOT NULL 
  AND q3 IS NOT NULL 
  AND q4 IS NOT NULL
  AND final_grade IS NULL
  AND deleted_at IS NULL;

-- Show summary
SELECT 
  COUNT(*) as total_grades,
  COUNT(q1) as with_q1,
  COUNT(q2) as with_q2,
  COUNT(q3) as with_q3,
  COUNT(q4) as with_q4,
  COUNT(CASE WHEN q1 IS NOT NULL AND q2 IS NOT NULL AND q3 IS NOT NULL AND q4 IS NOT NULL THEN 1 END) as complete_quarters,
  COUNT(final_grade) as with_final_grade
FROM grades
WHERE deleted_at IS NULL;
