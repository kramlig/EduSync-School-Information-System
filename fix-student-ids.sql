-- Fix: Update PostgreSQL data to use Firestore document IDs
-- This script maps PostgreSQL UUIDs to Firestore document IDs

-- Step 1: Check current mismatches
SELECT 
    pg_students.id as pg_id,
    pg_students.name,
    COUNT(grades.id) as grade_count
FROM students pg_students
LEFT JOIN grades ON grades.student_id = pg_students.id
GROUP BY pg_students.id, pg_students.name
ORDER BY pg_students.name
LIMIT 10;

-- Step 2: You need to identify the mapping between:
-- - Firestore student document IDs (what the app expects)
-- - PostgreSQL student UUIDs (what's currently in the database)

-- Example fix (you'll need to run this for each student):
-- UPDATE students 
-- SET id = '4e870a38-ba07-4d3b-b7d0-d20c75b929b6'  -- Firestore ID
-- WHERE id = 'current-postgres-uuid';

-- UPDATE grades
-- SET student_id = '4e870a38-ba07-4d3b-b7d0-d20c75b929b6'  -- Firestore ID  
-- WHERE student_id = 'current-postgres-uuid';

-- BETTER SOLUTION: Re-run migration with explicit ID mapping
-- See migration script that preserves Firestore document IDs
