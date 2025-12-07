-- =====================================================
-- Demo Accounts Sync Migration (PostgreSQL)
-- Generated: 2025-12-06T09:53:31.502Z
-- =====================================================
-- 
-- Run this in Supabase SQL Editor after Firebase accounts are created
--
-- =====================================================

-- Get the school ID to use for demo accounts
DO $$
DECLARE
    v_school_id UUID;
BEGIN
    SELECT id INTO v_school_id FROM schools WHERE deleted_at IS NULL LIMIT 1;
    
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No school found. Please create a school first.';
    END IF;
    
    RAISE NOTICE 'Using school_id: %', v_school_id;
END $$;

-- =====================================================
-- TEACHERS (Admins + Teachers)
-- =====================================================

-- Dr. Maria Clara Santos (admin)
INSERT INTO teachers (
    id, school_id, firebase_uid, email, name, first_name, last_name, 
    role, position, employee_number, phone, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'ZuUiQuKfRUSaN1AoLIMXxDNCiwF3',
    'principal.demo@edusync.edu.ph',
    'Dr. Maria Clara Santos',
    'Maria Clara',
    'Santos',
    'admin',
    'School Principal',
    'DEMO-001',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM teachers WHERE email = 'principal.demo@edusync.edu.ph' OR firebase_uid = 'ZuUiQuKfRUSaN1AoLIMXxDNCiwF3'
);

-- Update existing teacher if firebase_uid changed
UPDATE teachers 
SET firebase_uid = 'ZuUiQuKfRUSaN1AoLIMXxDNCiwF3',
    role = 'admin',
    updated_at = NOW()
WHERE email = 'principal.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'ZuUiQuKfRUSaN1AoLIMXxDNCiwF3');

-- Juan Carlos Reyes (registrar)
INSERT INTO teachers (
    id, school_id, firebase_uid, email, name, first_name, last_name, 
    role, position, employee_number, phone, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'zuuWMYpjJtOeavsWxQ1UtPTJdmf2',
    'registrar.demo@edusync.edu.ph',
    'Juan Carlos Reyes',
    'Juan Carlos',
    'Reyes',
    'registrar',
    'School Registrar',
    'DEMO-002',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM teachers WHERE email = 'registrar.demo@edusync.edu.ph' OR firebase_uid = 'zuuWMYpjJtOeavsWxQ1UtPTJdmf2'
);

-- Update existing teacher if firebase_uid changed
UPDATE teachers 
SET firebase_uid = 'zuuWMYpjJtOeavsWxQ1UtPTJdmf2',
    role = 'registrar',
    updated_at = NOW()
WHERE email = 'registrar.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'zuuWMYpjJtOeavsWxQ1UtPTJdmf2');

-- Ana Marie Cruz (teacher)
INSERT INTO teachers (
    id, school_id, firebase_uid, email, name, first_name, last_name, 
    role, position, employee_number, phone, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'MEOhX1jPv3amPZjpieCXNue6M6Z2',
    'teacher1.demo@edusync.edu.ph',
    'Ana Marie Cruz',
    'Ana Marie',
    'Cruz',
    'teacher',
    'Teacher I',
    'DEMO-101',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM teachers WHERE email = 'teacher1.demo@edusync.edu.ph' OR firebase_uid = 'MEOhX1jPv3amPZjpieCXNue6M6Z2'
);

-- Update existing teacher if firebase_uid changed
UPDATE teachers 
SET firebase_uid = 'MEOhX1jPv3amPZjpieCXNue6M6Z2',
    role = 'teacher',
    updated_at = NOW()
WHERE email = 'teacher1.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'MEOhX1jPv3amPZjpieCXNue6M6Z2');

-- Roberto Garcia (teacher)
INSERT INTO teachers (
    id, school_id, firebase_uid, email, name, first_name, last_name, 
    role, position, employee_number, phone, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'sGjJyXGRwtVBwHxH9yMXzYOLvWw1',
    'teacher2.demo@edusync.edu.ph',
    'Roberto Garcia',
    'Roberto',
    'Garcia',
    'teacher',
    'Teacher II',
    'DEMO-102',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM teachers WHERE email = 'teacher2.demo@edusync.edu.ph' OR firebase_uid = 'sGjJyXGRwtVBwHxH9yMXzYOLvWw1'
);

-- Update existing teacher if firebase_uid changed
UPDATE teachers 
SET firebase_uid = 'sGjJyXGRwtVBwHxH9yMXzYOLvWw1',
    role = 'teacher',
    updated_at = NOW()
WHERE email = 'teacher2.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'sGjJyXGRwtVBwHxH9yMXzYOLvWw1');

-- Elena Fernandez (teacher)
INSERT INTO teachers (
    id, school_id, firebase_uid, email, name, first_name, last_name, 
    role, position, employee_number, phone, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'QSgOgql3PNcaI7KT0KyBKIoPDCH2',
    'teacher3.demo@edusync.edu.ph',
    'Elena Fernandez',
    'Elena',
    'Fernandez',
    'teacher',
    'Teacher III',
    'DEMO-103',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM teachers WHERE email = 'teacher3.demo@edusync.edu.ph' OR firebase_uid = 'QSgOgql3PNcaI7KT0KyBKIoPDCH2'
);

-- Update existing teacher if firebase_uid changed
UPDATE teachers 
SET firebase_uid = 'QSgOgql3PNcaI7KT0KyBKIoPDCH2',
    role = 'teacher',
    updated_at = NOW()
WHERE email = 'teacher3.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'QSgOgql3PNcaI7KT0KyBKIoPDCH2');

-- Michael Villanueva (teacher)
INSERT INTO teachers (
    id, school_id, firebase_uid, email, name, first_name, last_name, 
    role, position, employee_number, phone, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'Mh3DBvgzA5T6q86g45G0ieHgGjH3',
    'teacher4.demo@edusync.edu.ph',
    'Michael Villanueva',
    'Michael',
    'Villanueva',
    'teacher',
    'Master Teacher I',
    'DEMO-104',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM teachers WHERE email = 'teacher4.demo@edusync.edu.ph' OR firebase_uid = 'Mh3DBvgzA5T6q86g45G0ieHgGjH3'
);

-- Update existing teacher if firebase_uid changed
UPDATE teachers 
SET firebase_uid = 'Mh3DBvgzA5T6q86g45G0ieHgGjH3',
    role = 'teacher',
    updated_at = NOW()
WHERE email = 'teacher4.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'Mh3DBvgzA5T6q86g45G0ieHgGjH3');


-- =====================================================
-- STUDENTS
-- =====================================================

-- Sofia Dela Cruz (Grade 1)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'AvtIkgM8LPXIGBTE2T7vnKW0Rtu1',
    'student1.demo@edusync.edu.ph',
    'Sofia',
    'Dela Cruz',
    '100000000001',
    1,
    'Female',
    '2017-03-15',
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE email = 'student1.demo@edusync.edu.ph' OR firebase_uid = 'AvtIkgM8LPXIGBTE2T7vnKW0Rtu1' OR lrn = '100000000001'
);

-- Update existing student if firebase_uid changed
UPDATE students 
SET firebase_uid = 'AvtIkgM8LPXIGBTE2T7vnKW0Rtu1',
    updated_at = NOW()
WHERE email = 'student1.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'AvtIkgM8LPXIGBTE2T7vnKW0Rtu1');

-- Miguel Santos (Grade 1)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'cETAzxKOwvQzBwMcCew7eZsKvA62',
    'student2.demo@edusync.edu.ph',
    'Miguel',
    'Santos',
    '100000000002',
    1,
    'Male',
    '2017-06-22',
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE email = 'student2.demo@edusync.edu.ph' OR firebase_uid = 'cETAzxKOwvQzBwMcCew7eZsKvA62' OR lrn = '100000000002'
);

-- Update existing student if firebase_uid changed
UPDATE students 
SET firebase_uid = 'cETAzxKOwvQzBwMcCew7eZsKvA62',
    updated_at = NOW()
WHERE email = 'student2.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'cETAzxKOwvQzBwMcCew7eZsKvA62');

-- Isabella Reyes (Grade 3)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'IEa7iD92zpShBznCmmpmEM7wDPC3',
    'student3.demo@edusync.edu.ph',
    'Isabella',
    'Reyes',
    '100000000003',
    3,
    'Female',
    '2015-09-10',
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE email = 'student3.demo@edusync.edu.ph' OR firebase_uid = 'IEa7iD92zpShBznCmmpmEM7wDPC3' OR lrn = '100000000003'
);

-- Update existing student if firebase_uid changed
UPDATE students 
SET firebase_uid = 'IEa7iD92zpShBznCmmpmEM7wDPC3',
    updated_at = NOW()
WHERE email = 'student3.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'IEa7iD92zpShBznCmmpmEM7wDPC3');

-- Gabriel Garcia (Grade 6)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'CKwtVvZ8rmXDVgouUGbnf8kwMZ93',
    'student4.demo@edusync.edu.ph',
    'Gabriel',
    'Garcia',
    '100000000004',
    6,
    'Male',
    '2012-01-28',
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE email = 'student4.demo@edusync.edu.ph' OR firebase_uid = 'CKwtVvZ8rmXDVgouUGbnf8kwMZ93' OR lrn = '100000000004'
);

-- Update existing student if firebase_uid changed
UPDATE students 
SET firebase_uid = 'CKwtVvZ8rmXDVgouUGbnf8kwMZ93',
    updated_at = NOW()
WHERE email = 'student4.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'CKwtVvZ8rmXDVgouUGbnf8kwMZ93');


-- =====================================================
-- PARENTS
-- =====================================================

-- Rosa Dela Cruz (Mother)
INSERT INTO parents (
    id, school_id, firebase_uid, email, name, contact_number, relationship, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'j3rYEN6qcib2jX9scG3oLVezVNg2',
    'parent1.demo@edusync.edu.ph',
    'Rosa Dela Cruz',
    '09171234567',
    'Mother',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM parents WHERE email = 'parent1.demo@edusync.edu.ph' OR firebase_uid = 'j3rYEN6qcib2jX9scG3oLVezVNg2'
);

-- Update existing parent if firebase_uid changed
UPDATE parents 
SET firebase_uid = 'j3rYEN6qcib2jX9scG3oLVezVNg2',
    updated_at = NOW()
WHERE email = 'parent1.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'j3rYEN6qcib2jX9scG3oLVezVNg2');

-- Pedro Santos (Father)
INSERT INTO parents (
    id, school_id, firebase_uid, email, name, contact_number, relationship, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'XfXUNYVWulWsrxBPFasTELceaID3',
    'parent2.demo@edusync.edu.ph',
    'Pedro Santos',
    '09181234568',
    'Father',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM parents WHERE email = 'parent2.demo@edusync.edu.ph' OR firebase_uid = 'XfXUNYVWulWsrxBPFasTELceaID3'
);

-- Update existing parent if firebase_uid changed
UPDATE parents 
SET firebase_uid = 'XfXUNYVWulWsrxBPFasTELceaID3',
    updated_at = NOW()
WHERE email = 'parent2.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'XfXUNYVWulWsrxBPFasTELceaID3');

-- Carmen Reyes (Mother)
INSERT INTO parents (
    id, school_id, firebase_uid, email, name, contact_number, relationship, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'mxw7CVvzR1VfCcLwc910cVoznhv2',
    'parent3.demo@edusync.edu.ph',
    'Carmen Reyes',
    '09191234569',
    'Mother',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM parents WHERE email = 'parent3.demo@edusync.edu.ph' OR firebase_uid = 'mxw7CVvzR1VfCcLwc910cVoznhv2'
);

-- Update existing parent if firebase_uid changed
UPDATE parents 
SET firebase_uid = 'mxw7CVvzR1VfCcLwc910cVoznhv2',
    updated_at = NOW()
WHERE email = 'parent3.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'mxw7CVvzR1VfCcLwc910cVoznhv2');

-- Jose Garcia (Father)
INSERT INTO parents (
    id, school_id, firebase_uid, email, name, contact_number, relationship, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'mdVWjGuodkNBs0wAfGEaw5XWLIj1',
    'parent4.demo@edusync.edu.ph',
    'Jose Garcia',
    '09201234570',
    'Father',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM parents WHERE email = 'parent4.demo@edusync.edu.ph' OR firebase_uid = 'mdVWjGuodkNBs0wAfGEaw5XWLIj1'
);

-- Update existing parent if firebase_uid changed
UPDATE parents 
SET firebase_uid = 'mdVWjGuodkNBs0wAfGEaw5XWLIj1',
    updated_at = NOW()
WHERE email = 'parent4.demo@edusync.edu.ph' AND (firebase_uid IS NULL OR firebase_uid != 'mdVWjGuodkNBs0wAfGEaw5XWLIj1');


-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Demo Teachers' as type, COUNT(*) as count FROM teachers WHERE email LIKE '%demo@edusync%';
SELECT 'Demo Students' as type, COUNT(*) as count FROM students WHERE email LIKE '%demo@edusync%';
SELECT 'Demo Parents' as type, COUNT(*) as count FROM parents WHERE email LIKE '%demo@edusync%';

-- Test the login function with a demo account
-- SELECT * FROM get_user_by_firebase_uid('paste_firebase_uid_here');
