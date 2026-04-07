-- ============================================================================
-- Migration 008: MATATAG Curriculum Update for Elementary Schools
-- Date: April 6, 2026
--
-- Updates learning areas for ALL existing elementary/integrated schools
-- to match the MATATAG curriculum confirmed by DepEd teachers.
--
-- Changes:
--   1. REMOVE Mother Tongue (MTB)
--   2. RENAME ESP → GMRC (all grades 1-6)
--   3. ADD MAKABANSA (Grades 1-3) — replaces AP for lower grades
--   4. NARROW AP to Grades 4-6 only
--   5. ADD Language (Grade 1 only)
--   6. ADD Reading and Literacy (Grade 1 only)
--   7. NARROW Filipino to Grades 2-6
--   8. NARROW English to Grades 2-6
--   9. NARROW MAPEH to Grades 4-6
--  10. SPLIT EPP/TLE → EPP (4-5) + TLE (6)
-- ============================================================================

-- =====================================================
-- 1. REMOVE Mother Tongue (MTB) — mark inactive
-- =====================================================
UPDATE learning_areas
SET is_active = false, updated_at = NOW()
WHERE code = 'MTB'
  AND (SELECT school_type FROM schools WHERE id = school_id) IN ('elementary', 'integrated')
      OR (SELECT school_type FROM schools WHERE id = school_id) IS NULL;

-- =====================================================
-- 2. RENAME ESP → GMRC
-- =====================================================
UPDATE learning_areas
SET code = 'GMRC',
    name = 'GMRC',
    updated_at = NOW()
WHERE code = 'ESP'
  AND grade_levels && ARRAY[1,2,3,4,5,6]
  AND NOT grade_levels && ARRAY[7,8,9,10];

-- =====================================================
-- 3. ADD MAKABANSA (Grades 1-3)
-- =====================================================
INSERT INTO learning_areas (school_id, code, name, grade_levels, category, display_order, is_active, is_composite, components)
SELECT s.id, 'MKBS', 'MAKABANSA', ARRAY[1,2,3], 'core', 7, true, false, NULL
FROM schools s
WHERE (s.school_type IS NULL OR s.school_type IN ('elementary', 'integrated'))
  AND NOT EXISTS (
    SELECT 1 FROM learning_areas la WHERE la.school_id = s.id AND la.code = 'MKBS'
  );

-- =====================================================
-- 4. NARROW AP to Grades 4-6 only
-- =====================================================
UPDATE learning_areas
SET grade_levels = ARRAY[4,5,6],
    updated_at = NOW()
WHERE code = 'AP'
  AND grade_levels && ARRAY[1,2,3]
  AND NOT grade_levels && ARRAY[7,8,9,10];

-- =====================================================
-- 5. ADD Language (Grade 1 only)
-- =====================================================
INSERT INTO learning_areas (school_id, code, name, grade_levels, category, display_order, is_active, is_composite, components)
SELECT s.id, 'LANG', 'Language', ARRAY[1], 'core', 1, true, false, NULL
FROM schools s
WHERE (s.school_type IS NULL OR s.school_type IN ('elementary', 'integrated'))
  AND NOT EXISTS (
    SELECT 1 FROM learning_areas la WHERE la.school_id = s.id AND la.code = 'LANG'
  );

-- =====================================================
-- 6. ADD Reading and Literacy (Grade 1 only)
-- =====================================================
INSERT INTO learning_areas (school_id, code, name, grade_levels, category, display_order, is_active, is_composite, components)
SELECT s.id, 'RL', 'Reading and Literacy', ARRAY[1], 'core', 2, true, false, NULL
FROM schools s
WHERE (s.school_type IS NULL OR s.school_type IN ('elementary', 'integrated'))
  AND NOT EXISTS (
    SELECT 1 FROM learning_areas la WHERE la.school_id = s.id AND la.code = 'RL'
  );

-- =====================================================
-- 7. NARROW Filipino to Grades 2-6
-- =====================================================
UPDATE learning_areas
SET grade_levels = ARRAY[2,3,4,5,6],
    updated_at = NOW()
WHERE code = 'FIL'
  AND 1 = ANY(grade_levels)
  AND NOT grade_levels && ARRAY[7,8,9,10];

-- =====================================================
-- 8. NARROW English to Grades 2-6
-- =====================================================
UPDATE learning_areas
SET grade_levels = ARRAY[2,3,4,5,6],
    updated_at = NOW()
WHERE code = 'ENG'
  AND 1 = ANY(grade_levels)
  AND NOT grade_levels && ARRAY[7,8,9,10];

-- =====================================================
-- 9. NARROW MAPEH to Grades 4-6
-- =====================================================
UPDATE learning_areas
SET grade_levels = ARRAY[4,5,6],
    updated_at = NOW()
WHERE code = 'MAPEH'
  AND grade_levels && ARRAY[1,2,3]
  AND NOT grade_levels && ARRAY[7,8,9,10];

-- =====================================================
-- 10. SPLIT EPP/TLE → EPP (4-5) + TLE (6)
-- =====================================================

-- 10a. Update existing EPP/TLE → EPP (Grades 4-5 only)
UPDATE learning_areas
SET code = 'EPP',
    name = 'EPP',
    grade_levels = ARRAY[4,5],
    updated_at = NOW()
WHERE code = 'EPP'
  AND name = 'EPP/TLE'
  AND NOT grade_levels && ARRAY[7,8,9,10];

-- 10b. Add TLE (Grade 6) as separate entry
INSERT INTO learning_areas (school_id, code, name, grade_levels, category, display_order, is_active, is_composite, components)
SELECT s.id, 'TLE', 'TLE', ARRAY[6], 'tle', 11, true, false, NULL
FROM schools s
WHERE (s.school_type IS NULL OR s.school_type IN ('elementary', 'integrated'))
  AND NOT EXISTS (
    SELECT 1 FROM learning_areas la WHERE la.school_id = s.id AND la.code = 'TLE'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  school_rec RECORD;
  subject_count INTEGER;
BEGIN
  FOR school_rec IN 
    SELECT id, name FROM schools 
    WHERE school_type IS NULL OR school_type IN ('elementary', 'integrated')
    LIMIT 10
  LOOP
    SELECT COUNT(*) INTO subject_count 
    FROM learning_areas 
    WHERE school_id = school_rec.id AND is_active = true;
    
    RAISE NOTICE 'School: % — % active subjects', school_rec.name, subject_count;
  END LOOP;
END $$;
