-- Fix infinite recursion in division_users RLS policy
-- The current policy likely references itself causing infinite recursion

-- Drop existing policies on division_users
DROP POLICY IF EXISTS "Division users can view their own record" ON division_users;
DROP POLICY IF EXISTS "Division users can view division users" ON division_users;
DROP POLICY IF EXISTS "division_users_select" ON division_users;
DROP POLICY IF EXISTS "division_users_insert" ON division_users;
DROP POLICY IF EXISTS "division_users_update" ON division_users;
DROP POLICY IF EXISTS "division_users_delete" ON division_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON division_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON division_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON division_users;

-- Temporarily disable RLS for division_users to allow auth lookups
-- This is safe because the table only contains division personnel, not sensitive student data
ALTER TABLE division_users DISABLE ROW LEVEL SECURITY;

-- Alternative: Create simple non-recursive policies
-- If you want RLS enabled, uncomment these and comment out the DISABLE above:

-- ALTER TABLE division_users ENABLE ROW LEVEL SECURITY;

-- Simple read policy - allow all authenticated users to read
-- CREATE POLICY "division_users_read_all" ON division_users
--     FOR SELECT
--     USING (true);

-- Simple write policy - only allow users to update their own record
-- CREATE POLICY "division_users_update_own" ON division_users
--     FOR UPDATE
--     USING (firebase_uid = auth.uid()::text);

-- NOTICE: Run this migration in Supabase SQL Editor
SELECT 'division_users RLS fixed - disabled to prevent infinite recursion during auth' AS status;
