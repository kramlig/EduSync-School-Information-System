-- =====================================================
-- OPTION A: Role-Centric Auth Architecture Migration
-- Date: January 9, 2026
-- 
-- This migration implements Option A (Role-Centric) where each
-- role table (teachers, students, parents, division_users, superadmins)
-- is self-contained with its own firebase_uid for authentication.
-- 
-- Benefits:
-- - Fast single-table lookups (no joins)
-- - Simple architecture
-- - Self-contained role tables
-- =====================================================

-- =====================================================
-- 1. CREATE SUPERADMINS TABLE
-- Platform-level administrators
-- =====================================================

CREATE TABLE IF NOT EXISTS superadmins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_superadmins_firebase_uid ON superadmins(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_superadmins_email ON superadmins(email);

COMMENT ON TABLE superadmins IS 'Platform-level superadministrators with full system access';

-- =====================================================
-- 2. ADD AUTH COLUMNS TO TEACHERS TABLE
-- Add firebase_uid, email, role for direct auth lookup
-- =====================================================

-- Add firebase_uid column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teachers' AND column_name = 'firebase_uid') THEN
        ALTER TABLE teachers ADD COLUMN firebase_uid VARCHAR(128);
    END IF;
END $$;

-- Add email column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teachers' AND column_name = 'email') THEN
        ALTER TABLE teachers ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Add role column if not exists (admin, principal, registrar, teacher)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teachers' AND column_name = 'role') THEN
        ALTER TABLE teachers ADD COLUMN role VARCHAR(50) DEFAULT 'teacher';
    END IF;
END $$;

-- Add phone column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teachers' AND column_name = 'phone') THEN
        ALTER TABLE teachers ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Add position column if not exists  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teachers' AND column_name = 'position') THEN
        ALTER TABLE teachers ADD COLUMN position VARCHAR(100);
    END IF;
END $$;

-- Add first_name column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teachers' AND column_name = 'first_name') THEN
        ALTER TABLE teachers ADD COLUMN first_name VARCHAR(100);
    END IF;
END $$;

-- Add last_name column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teachers' AND column_name = 'last_name') THEN
        ALTER TABLE teachers ADD COLUMN last_name VARCHAR(100);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teachers_firebase_uid ON teachers(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);

-- Make user_id nullable since we're moving away from users table dependency
DO $$
BEGIN
    -- Check if the column is NOT NULL and alter it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' 
        AND column_name = 'user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE teachers ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;

-- =====================================================
-- 3. MIGRATE DATA FROM USERS TABLE TO TEACHERS
-- Copy firebase_uid and email from users to teachers
-- =====================================================

-- Update teachers with data from linked users table
UPDATE teachers t
SET 
    firebase_uid = u.firebase_uid,
    email = u.email,
    role = COALESCE(u.role::VARCHAR, t.role, 'teacher')
FROM users u
WHERE t.user_id = u.id
AND t.firebase_uid IS NULL;

-- =====================================================
-- 4. CREATE/UPDATE RPC FUNCTION FOR AUTH LOOKUP
-- Check tables in order: superadmins → division_users → teachers → students → parents
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_by_firebase_uid(p_firebase_uid VARCHAR(128))
RETURNS TABLE (
    user_id UUID,
    user_type VARCHAR(20),
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    school_id UUID,
    school_name VARCHAR(255),
    division_id UUID,
    division_name VARCHAR(255),
    grade_level INTEGER,
    section_id UUID,
    contact_number VARCHAR(20),
    employee_number VARCHAR(50),
    user_position VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
) AS $$
BEGIN
    -- 1. Check superadmins first (platform level)
    RETURN QUERY
    SELECT 
        sa.id AS user_id,
        'superadmin'::VARCHAR(20) AS user_type,
        sa.email,
        sa.name,
        'superadmin'::VARCHAR(50) AS role,
        NULL::UUID AS school_id,
        NULL::VARCHAR(255) AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        NULL::VARCHAR(20) AS contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        NULL::VARCHAR(100) AS first_name,
        NULL::VARCHAR(100) AS last_name
    FROM superadmins sa
    WHERE sa.firebase_uid = p_firebase_uid
    AND sa.deleted_at IS NULL
    AND sa.is_active = true
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;

    -- 2. Check division_users (division level)
    RETURN QUERY
    SELECT 
        du.id AS user_id,
        'division_user'::VARCHAR(20) AS user_type,
        du.email,
        du.name,
        du.role::VARCHAR(50),
        NULL::UUID AS school_id,
        NULL::VARCHAR(255) AS school_name,
        du.division_id,
        d.name AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        NULL::VARCHAR(20) AS contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        NULL::VARCHAR(100) AS first_name,
        NULL::VARCHAR(100) AS last_name
    FROM division_users du
    LEFT JOIN divisions d ON d.id = du.division_id
    WHERE du.firebase_uid = p_firebase_uid
    AND du.deleted_at IS NULL
    AND du.is_active = true
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
    
    -- 3. Check teachers (school staff: admin, principal, registrar, teacher)
    RETURN QUERY
    SELECT 
        t.id AS user_id,
        'teacher'::VARCHAR(20) AS user_type,
        t.email,
        t.name,
        COALESCE(t.role, 'teacher')::VARCHAR(50) AS role,
        t.school_id,
        s.name AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        t.phone AS contact_number,
        t.employee_number,
        t.position AS user_position,
        t.first_name::VARCHAR(100),
        t.last_name::VARCHAR(100)
    FROM teachers t
    JOIN schools s ON s.id = t.school_id
    WHERE t.firebase_uid = p_firebase_uid
    AND t.deleted_at IS NULL
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
    
    -- 4. Check students
    RETURN QUERY
    SELECT 
        st.id AS user_id,
        'student'::VARCHAR(20) AS user_type,
        st.email,
        CONCAT(st.first_name, ' ', st.last_name)::VARCHAR(255) AS name,
        'student'::VARCHAR(50) AS role,
        st.school_id,
        s.name AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        st.grade_level,
        st.section_id,
        st.contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        st.first_name::VARCHAR(100),
        st.last_name::VARCHAR(100)
    FROM students st
    JOIN schools s ON s.id = st.school_id
    WHERE st.firebase_uid = p_firebase_uid
    AND st.deleted_at IS NULL
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
    
    -- 5. Check parents
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        'parent'::VARCHAR(20) AS user_type,
        p.email,
        p.name,
        'parent'::VARCHAR(50) AS role,
        p.school_id,
        s.name AS school_name,
        NULL::UUID AS division_id,
        NULL::VARCHAR(255) AS division_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        p.contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        NULL::VARCHAR(100) AS first_name,
        NULL::VARCHAR(100) AS last_name
    FROM parents p
    JOIN schools s ON s.id = p.school_id
    WHERE p.firebase_uid = p_firebase_uid
    AND p.deleted_at IS NULL
    LIMIT 1;
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_by_firebase_uid IS 
'Option A Role-Centric Auth: Checks superadmins → division_users → teachers → students → parents in order';

-- =====================================================
-- 5. RLS POLICIES FOR SUPERADMINS
-- =====================================================

ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY superadmins_service_all ON superadmins
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Ensure the authenticated role can read superadmins for auth
GRANT SELECT ON superadmins TO authenticated;
GRANT SELECT ON superadmins TO anon;

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Check if columns were added to teachers
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'teachers' 
-- ORDER BY ordinal_position;

-- Check if superadmins table exists
-- SELECT * FROM superadmins;

-- Test the RPC function
-- SELECT * FROM get_user_by_firebase_uid('test_firebase_uid');

-- Check how many teachers now have firebase_uid populated
-- SELECT COUNT(*) FROM teachers WHERE firebase_uid IS NOT NULL;
