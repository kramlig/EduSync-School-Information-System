-- =====================================================
-- Option A: Clean Denormalized Architecture
-- Created: December 6, 2025
-- Purpose: Remove users table dependency, use firebase_uid directly in role tables
-- =====================================================
-- 
-- ARCHITECTURE DECISION:
-- Firebase Auth → teachers/students/parents.firebase_uid (direct lookup)
-- NO centralized users table for authentication
--
-- This is a valid and common pattern used by:
-- - Many SaaS applications
-- - Role-based systems where users have ONE role
-- - Systems prioritizing query performance over normalization
--
-- =====================================================

-- =====================================================
-- STEP 1: Ensure firebase_uid columns exist with proper indexes
-- =====================================================

-- Teachers: Add firebase_uid if not exists
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_firebase_uid ON teachers(firebase_uid) WHERE firebase_uid IS NOT NULL;

-- Students: Add firebase_uid if not exists  
ALTER TABLE students ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_firebase_uid ON students(firebase_uid) WHERE firebase_uid IS NOT NULL;

-- Parents: Add firebase_uid if not exists
ALTER TABLE parents ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS idx_parents_firebase_uid ON parents(firebase_uid) WHERE firebase_uid IS NOT NULL;

-- =====================================================
-- STEP 2: Ensure email columns exist in all role tables
-- =====================================================

-- Teachers: email should exist
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- Students: email should exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Parents: email should exist
ALTER TABLE parents ADD COLUMN IF NOT EXISTS email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);

-- =====================================================
-- STEP 3: Ensure role column exists in teachers table
-- =====================================================

-- Role for admin/principal/registrar/teacher distinction
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'teacher';
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);

-- =====================================================
-- STEP 4: Make user_id nullable (deprecate, don't remove yet)
-- =====================================================

-- We keep user_id for backwards compatibility but make it nullable
-- and add a comment explaining it's deprecated

DO $$ 
BEGIN
    -- Make user_id nullable in teachers
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'user_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE teachers ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'Made teachers.user_id nullable';
    END IF;
    
    -- Make user_id nullable in students (should already be)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'user_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE students ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'Made students.user_id nullable';
    END IF;
    
    -- Make user_id nullable in parents (should already be)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parents' AND column_name = 'user_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE parents ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'Made parents.user_id nullable';
    END IF;
END $$;

-- Add deprecation comments
COMMENT ON COLUMN teachers.user_id IS 'DEPRECATED: Use firebase_uid directly. This column will be removed in a future migration.';
COMMENT ON COLUMN students.user_id IS 'DEPRECATED: Use firebase_uid directly. This column will be removed in a future migration.';
COMMENT ON COLUMN parents.user_id IS 'DEPRECATED: Use firebase_uid directly. This column will be removed in a future migration.';

-- =====================================================
-- STEP 5: Update receipts.voided_by to reference teachers instead of users
-- =====================================================

-- First check if voided_by references users table
DO $$
BEGIN
    -- Drop the old foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'receipts_voided_by_fkey' 
        AND table_name = 'receipts'
    ) THEN
        ALTER TABLE receipts DROP CONSTRAINT receipts_voided_by_fkey;
        RAISE NOTICE 'Dropped old receipts_voided_by_fkey constraint';
    END IF;
END $$;

-- Add comment explaining voided_by now stores teacher ID
COMMENT ON COLUMN receipts.voided_by IS 'Teacher/Admin ID who voided the receipt (references teachers.id)';

-- =====================================================
-- STEP 6: Create/Update the optimized user lookup function
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
    grade_level INTEGER,
    section_id UUID,
    contact_number VARCHAR(20),
    employee_number VARCHAR(50),
    user_position VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
) AS $$
BEGIN
    -- Try teachers first (most common for staff login)
    RETURN QUERY
    SELECT 
        t.id AS user_id,
        'teacher'::VARCHAR(20) AS user_type,
        t.email::VARCHAR(255),
        t.name::VARCHAR(255),
        COALESCE(t.role, 'teacher')::VARCHAR(50) AS role,
        t.school_id,
        s.name::VARCHAR(255) AS school_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        t.phone::VARCHAR(20) AS contact_number,
        t.employee_number::VARCHAR(50),
        t.position::VARCHAR(50) AS user_position,
        t.first_name::VARCHAR(100),
        t.last_name::VARCHAR(100)
    FROM teachers t
    JOIN schools s ON s.id = t.school_id
    WHERE t.firebase_uid = p_firebase_uid
    AND t.deleted_at IS NULL
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
    
    -- Try students
    RETURN QUERY
    SELECT 
        st.id AS user_id,
        'student'::VARCHAR(20) AS user_type,
        st.email::VARCHAR(255),
        CONCAT(st.first_name, ' ', st.last_name)::VARCHAR(255) AS name,
        'student'::VARCHAR(50) AS role,
        st.school_id,
        s.name::VARCHAR(255) AS school_name,
        st.grade_level::INTEGER,
        st.section_id,
        st.contact_number::VARCHAR(20),
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
    
    -- Try parents
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        'parent'::VARCHAR(20) AS user_type,
        p.email::VARCHAR(255),
        p.name::VARCHAR(255),
        'parent'::VARCHAR(50) AS role,
        p.school_id,
        s.name::VARCHAR(255) AS school_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        p.contact_number::VARCHAR(20),
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

COMMENT ON FUNCTION get_user_by_firebase_uid IS 'Option A: Direct lookup of user by firebase_uid across role tables (teachers, students, parents). No users table involved.';

-- =====================================================
-- STEP 7: Create helper function to get teacher by firebase_uid
-- =====================================================

CREATE OR REPLACE FUNCTION get_teacher_by_firebase_uid(p_firebase_uid VARCHAR(128))
RETURNS TABLE (
    id UUID,
    school_id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    employee_number VARCHAR(50),
    user_position VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.school_id,
        t.email::VARCHAR(255),
        t.name::VARCHAR(255),
        COALESCE(t.role, 'teacher')::VARCHAR(50),
        t.employee_number::VARCHAR(50),
        t.position::VARCHAR(50) AS user_position
    FROM teachers t
    WHERE t.firebase_uid = p_firebase_uid
    AND t.deleted_at IS NULL
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_teacher_by_firebase_uid IS 'Get teacher record by firebase_uid. Used for operations that need teacher ID.';

-- =====================================================
-- STEP 8: Deprecate users table (add warning, don't drop)
-- =====================================================

-- Add deprecation notice to users table
COMMENT ON TABLE users IS 'DEPRECATED: This table is no longer used for authentication. Use firebase_uid directly in teachers/students/parents tables. Will be removed in future migration.';

-- =====================================================
-- STEP 9: Document the architecture decision
-- =====================================================

-- Create a documentation comment
DO $$
BEGIN
    RAISE NOTICE '
    =====================================================
    AUTHENTICATION ARCHITECTURE (Option A)
    =====================================================
    
    Firebase Auth (email/password)
           │
           │ firebase_uid
           │
           ├──────────────────┬──────────────────┐
           ▼                  ▼                  ▼
      teachers           students           parents
      (firebase_uid)     (firebase_uid)     (firebase_uid)
      (email)            (email)            (email)
      (role)             
      
    LOGIN FLOW:
    1. Firebase Auth validates credentials
    2. Get firebase_uid from Firebase
    3. Call get_user_by_firebase_uid(firebase_uid)
    4. Returns user data from appropriate role table
    
    BENEFITS:
    • Single query lookup (no JOINs)
    • Clear role separation
    • Simple maintenance
    • Fast performance
    
    =====================================================
    ';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (run manually to verify)
-- =====================================================

-- Uncomment to run verification:
/*
-- Check teachers with firebase_uid
SELECT COUNT(*) AS teachers_with_firebase_uid 
FROM teachers 
WHERE firebase_uid IS NOT NULL;

-- Check students with firebase_uid
SELECT COUNT(*) AS students_with_firebase_uid 
FROM students 
WHERE firebase_uid IS NOT NULL;

-- Check parents with firebase_uid
SELECT COUNT(*) AS parents_with_firebase_uid 
FROM parents 
WHERE firebase_uid IS NOT NULL;

-- Test the lookup function
SELECT * FROM get_user_by_firebase_uid('test_uid_here');
*/
