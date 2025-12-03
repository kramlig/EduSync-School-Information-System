-- ============================================================================
-- Migration 010: Fix Enrollment Applications RLS Policy
-- Description: Allow public (unauthenticated) users to submit enrollment applications
-- Created: December 2, 2025
-- ============================================================================

-- First, check what policies exist and drop them
DO $$ 
BEGIN
    -- Drop ALL possible existing policies (including old ones)
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_insert_policy ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_select_own ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_admin_all ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_public_insert ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_view_own ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_view_by_email ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_update_own ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_applications_authenticated_all ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_public_insert ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_authenticated_all ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_anon_select ON enrollment_applications';
    -- Drop old admin policies that are interfering
    EXECUTE 'DROP POLICY IF EXISTS enrollent_admin_delete ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollent_admin_insert ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollent_admin_update ON enrollment_applications';
    EXECUTE 'DROP POLICY IF EXISTS enrollent_admin_view ON enrollment_applications';
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if policies don't exist
END $$;

-- FIREBASE AUTH COMPATIBLE RLS POLICIES
-- Since we're using Firebase Auth (not Supabase Auth), all users connect with 'anon' or 'public' role
-- We cannot use 'authenticated' role - it only works with Supabase Auth

-- Policy 1: Allow public role ALL operations (for Firebase authenticated users)
-- This works because Firebase users still connect via the anon key
CREATE POLICY enrollment_public_all ON enrollment_applications
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Add helpful comment
COMMENT ON POLICY enrollment_public_all ON enrollment_applications IS 
    'Allow all operations for public role (Firebase Auth users connect via anon key, so they use public role)';
