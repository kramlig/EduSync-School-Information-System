-- Migration: Add district and tin columns to schools table
-- Date: November 27, 2025
-- Reason: District is a fundamental DepEd organizational unit and should be a dedicated column
--         TIN is required for BIR-compliant receipts
-- Impact: Improves query performance, data integrity, and schema consistency

-- ==========================================
-- STEP 1: Add new columns
-- ==========================================

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS tin VARCHAR(20);

-- ==========================================
-- STEP 2: Migrate existing data from JSONB
-- ==========================================

-- Migrate district from settings JSONB to column
UPDATE schools 
SET district = settings->>'district' 
WHERE settings ? 'district' 
  AND district IS NULL;

-- Migrate tin from settings JSONB to column
UPDATE schools 
SET tin = settings->>'tin' 
WHERE settings ? 'tin' 
  AND tin IS NULL;

-- ==========================================
-- STEP 3: Verify migration
-- ==========================================

-- Check how many records have district/tin
DO $$
DECLARE
  district_count INT;
  tin_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM schools WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO district_count FROM schools WHERE district IS NOT NULL AND deleted_at IS NULL;
  SELECT COUNT(*) INTO tin_count FROM schools WHERE tin IS NOT NULL AND deleted_at IS NULL;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total schools: %', total_count;
  RAISE NOTICE '  Schools with district: %', district_count;
  RAISE NOTICE '  Schools with TIN: %', tin_count;
END $$;

-- ==========================================
-- STEP 4: Optional - Clean up JSONB
-- (Uncomment after verifying migration)
-- ==========================================

-- Remove district and tin from settings JSONB since they're now columns
-- UPDATE schools 
-- SET settings = settings - 'district' - 'tin'
-- WHERE settings ? 'district' OR settings ? 'tin';

-- ==========================================
-- STEP 5: Add index for district queries
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district) WHERE deleted_at IS NULL;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- View all schools with new columns
-- SELECT id, name, region, division, district, tin, settings 
-- FROM schools 
-- WHERE deleted_at IS NULL
-- ORDER BY name;

-- Check for schools missing district
-- SELECT id, name, region, division, settings
-- FROM schools 
-- WHERE district IS NULL AND deleted_at IS NULL;
