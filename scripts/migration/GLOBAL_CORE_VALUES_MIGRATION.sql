-- ==========================================
-- MIGRATION: Make Core Values Global (Not Per-School)
-- ==========================================
-- Purpose: Remove school_id dependency from core_values table
-- Benefit: New schools automatically have access to DepEd core values
-- Date: January 10, 2026
-- ==========================================

-- STEP 1: Backup current data (run SELECT first to verify)
-- SELECT * FROM core_values;

-- STEP 2: Check for duplicates across schools
SELECT code, COUNT(*) as count, array_agg(school_id) as school_ids
FROM core_values 
GROUP BY code 
ORDER BY code;

-- STEP 3: Keep only one canonical set of core values (the most complete one)
-- First, identify which school has the best data
SELECT school_id, COUNT(*) as cv_count, 
       SUM(CASE WHEN indicators IS NOT NULL AND array_length(indicators, 1) > 0 THEN 1 ELSE 0 END) as with_indicators
FROM core_values 
GROUP BY school_id;

-- STEP 4: Delete duplicates, keeping the first complete set
-- This keeps core values that have indicators populated
DELETE FROM core_values 
WHERE id NOT IN (
  SELECT DISTINCT ON (code) id 
  FROM core_values 
  WHERE indicators IS NOT NULL AND array_length(indicators, 1) > 0
  ORDER BY code, created_at ASC
);

-- STEP 5: Verify we have exactly 4 core values
SELECT * FROM core_values ORDER BY display_order;

-- STEP 6: Make school_id nullable (for backward compatibility)
ALTER TABLE core_values ALTER COLUMN school_id DROP NOT NULL;

-- STEP 7: Set school_id to NULL for global core values
UPDATE core_values SET school_id = NULL;

-- STEP 8: Add unique constraint on code (prevents duplicates)
ALTER TABLE core_values DROP CONSTRAINT IF EXISTS core_values_code_unique;
ALTER TABLE core_values ADD CONSTRAINT core_values_code_unique UNIQUE (code);

-- STEP 9: Update the indicators to DepEd standard (ensure consistency)
UPDATE core_values SET 
  name = 'MAKA-DIYOS',
  description = 'Demonstrates spirituality and faith',
  indicators = ARRAY[
    'Expresses one''s spiritual beliefs while respecting the spiritual beliefs of others',
    'Shows adherence to ethical principles by upholding truth'
  ]
WHERE code = 'MAKADIYOS';

UPDATE core_values SET 
  name = 'MAKATAO',
  description = 'Shows respect and care for others',
  indicators = ARRAY[
    'Is sensitive to individual, social, and cultural differences',
    'Demonstrates contributions toward solidarity'
  ]
WHERE code = 'MAKATAO';

UPDATE core_values SET 
  name = 'MAKAKALIKASAN',
  description = 'Cares for the environment',
  indicators = ARRAY[
    'Cares for the environment and utilizes resources wisely, judiciously, and economically'
  ]
WHERE code = 'MAKAKALIKASAN';

UPDATE core_values SET 
  name = 'MAKABANSA',
  description = 'Demonstrates patriotism and nationalism',
  indicators = ARRAY[
    'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
    'Demonstrates appropriate behavior in civic engagement activities in the school, community, and country'
  ]
WHERE code = 'MAKABANSA';

-- STEP 10: Final verification
SELECT id, code, name, school_id, indicators, display_order 
FROM core_values 
ORDER BY display_order;

-- ==========================================
-- ROLLBACK (if needed)
-- ==========================================
-- To rollback, you would need to:
-- 1. Re-add school_id values
-- 2. Remove the unique constraint
-- 3. Make school_id NOT NULL again
-- 
-- ALTER TABLE core_values DROP CONSTRAINT core_values_code_unique;
-- UPDATE core_values SET school_id = 'your-school-id' WHERE school_id IS NULL;
-- ALTER TABLE core_values ALTER COLUMN school_id SET NOT NULL;
