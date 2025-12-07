-- Cleanup Duplicate Teachers
-- Created: December 7, 2025
-- Purpose: Remove duplicate teacher records, keeping only the oldest record per user

-- =====================================================
-- DIAGNOSTIC: Check duplicates before cleanup
-- =====================================================

DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT user_id, school_id, COUNT(*) as cnt
    FROM teachers
    GROUP BY user_id, school_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'Found % duplicate teacher groups', duplicate_count;
END $$;

-- =====================================================
-- CLEANUP: Remove duplicate teachers
-- =====================================================

-- Strategy: Keep the oldest record (smallest ID) for each user_id + school_id combination
-- Delete all newer duplicates

WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, school_id ORDER BY created_at ASC, id ASC) as row_num
  FROM teachers
)
DELETE FROM teachers
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1
);

-- =====================================================
-- VERIFICATION: Check if duplicates are gone
-- =====================================================

DO $$
DECLARE
  remaining_duplicates INTEGER;
  total_teachers INTEGER;
BEGIN
  -- Check remaining duplicates
  SELECT COUNT(*)
  INTO remaining_duplicates
  FROM (
    SELECT user_id, school_id, COUNT(*) as cnt
    FROM teachers
    GROUP BY user_id, school_id
    HAVING COUNT(*) > 1
  ) dups;
  
  -- Count total teachers
  SELECT COUNT(*) INTO total_teachers FROM teachers;
  
  RAISE NOTICE '✅ Cleanup complete!';
  RAISE NOTICE 'Total teachers remaining: %', total_teachers;
  RAISE NOTICE 'Remaining duplicates: %', remaining_duplicates;
  
  IF remaining_duplicates > 0 THEN
    RAISE WARNING 'Still have % duplicate groups - manual review needed', remaining_duplicates;
  END IF;
END $$;

-- =====================================================
-- PREVENT FUTURE DUPLICATES: Add unique constraint
-- =====================================================

-- Add unique constraint to prevent future duplicates
-- This ensures one teacher record per user per school
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_teacher_per_user_per_school'
  ) THEN
    ALTER TABLE teachers 
    ADD CONSTRAINT unique_teacher_per_user_per_school 
    UNIQUE (user_id, school_id);
    
    RAISE NOTICE '✅ Added unique constraint: unique_teacher_per_user_per_school';
  ELSE
    RAISE NOTICE 'ℹ️  Unique constraint already exists';
  END IF;
END $$;
