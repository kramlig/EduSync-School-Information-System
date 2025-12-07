-- =====================================================
-- Fix: Insert Demo Students
-- The previous migration may have failed due to missing columns
-- =====================================================

-- First, clean up any partial/failed inserts from previous attempts
DELETE FROM students WHERE lrn IN ('100000000001', '100000000002', '100000000003', '100000000004');
DELETE FROM students WHERE email LIKE '%demo@edusync.edu.ph';

-- Sofia Dela Cruz (Grade 1)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name, name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'AvtIkgM8LPXIGBTE2T7vnKW0Rtu1',
    'student1.demo@edusync.edu.ph',
    'Sofia',
    'Dela Cruz',
    'Sofia Dela Cruz',
    '100000000001',
    1,
    'Female',
    '2017-03-15'::DATE,
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE firebase_uid = 'AvtIkgM8LPXIGBTE2T7vnKW0Rtu1'
);

-- Miguel Santos (Grade 1)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name, name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'cETAzxKOwvQzBwMcCew7eZsKvA62',
    'student2.demo@edusync.edu.ph',
    'Miguel',
    'Santos',
    'Miguel Santos',
    '100000000002',
    1,
    'Male',
    '2017-06-22'::DATE,
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE firebase_uid = 'cETAzxKOwvQzBwMcCew7eZsKvA62'
);

-- Isabella Reyes (Grade 3)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name, name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'IEa7iD92zpShBznCmmpmEM7wDPC3',
    'student3.demo@edusync.edu.ph',
    'Isabella',
    'Reyes',
    'Isabella Reyes',
    '100000000003',
    3,
    'Female',
    '2015-09-10'::DATE,
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE firebase_uid = 'IEa7iD92zpShBznCmmpmEM7wDPC3'
);

-- Gabriel Garcia (Grade 6)
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name, name,
    lrn, grade_level, gender, date_of_birth, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    'CKwtVvZ8rmXDVgouUGbnf8kwMZ93',
    'student4.demo@edusync.edu.ph',
    'Gabriel',
    'Garcia',
    'Gabriel Garcia',
    '100000000004',
    6,
    'Male',
    '2012-01-28'::DATE,
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE firebase_uid = 'CKwtVvZ8rmXDVgouUGbnf8kwMZ93'
);

-- Verify
SELECT 'Demo Students' as type, COUNT(*) as count FROM students WHERE email LIKE '%demo@edusync%';
SELECT email, firebase_uid, first_name, last_name, grade_level FROM students WHERE email LIKE '%demo@edusync%';
