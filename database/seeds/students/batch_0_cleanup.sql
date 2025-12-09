-- ============================================================================
-- BATCH 0: CLEANUP - Delete all existing students
-- Run this FIRST before any student batches
-- ============================================================================

-- Delete all students for Mati Division schools
DELETE FROM students WHERE school_id IN (
  SELECT id FROM schools WHERE division = 'Division of City of Mati'
);

-- Verify cleanup
SELECT COUNT(*) as remaining_students FROM students 
WHERE school_id IN (SELECT id FROM schools WHERE division = 'Division of City of Mati');

SELECT 'Cleanup complete. Ready for student seeding.' as status;
