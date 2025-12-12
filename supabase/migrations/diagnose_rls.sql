-- Check actual RLS policies on teaching_assignments table
-- This will show us what's ACTUALLY blocking the queries

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'teaching_assignments';

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'teaching_assignments';

-- Check what the anon role can actually see
SET ROLE anon;
SELECT COUNT(*) as anon_can_see FROM teaching_assignments;
RESET ROLE;
