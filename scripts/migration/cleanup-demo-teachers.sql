-- ==========================================
-- CLEANUP: DELETE ALL DEMO TEACHERS
-- Run this FIRST before running seed-demo-teachers.sql
-- ==========================================

BEGIN;

-- Delete all teachers with @demo.edu.ph emails
DELETE FROM teachers 
WHERE email LIKE '%@demo.edu.ph';

-- Verify deletion
SELECT COUNT(*) as remaining_demo_teachers 
FROM teachers 
WHERE email LIKE '%@demo.edu.ph';

SELECT '✅ Deleted all demo teachers. You can now run seed-demo-teachers.sql' as message;

COMMIT;
