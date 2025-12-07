-- =====================================================
-- SYNC DEMO TEACHERS TO POSTGRESQL
-- Run this in Supabase SQL Editor
-- Created: December 6, 2025
-- 
-- This script:
-- 1. Ensures firebase_uid column exists
-- 2. Creates/updates demo teachers with Firebase UIDs
-- =====================================================

-- =====================================================
-- STEP 1: Ensure firebase_uid column exists
-- =====================================================
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

CREATE INDEX IF NOT EXISTS idx_teachers_firebase_uid ON teachers(firebase_uid);

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'teachers_email_unique'
  ) THEN
    ALTER TABLE teachers ADD CONSTRAINT teachers_email_unique UNIQUE (email);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists
  WHEN others THEN
    RAISE NOTICE 'Could not add unique constraint, will use UPDATE approach';
END $$;

-- =====================================================
-- STEP 2: Get the school_id and upsert teachers
-- =====================================================
DO $$
DECLARE
  v_school_id UUID;
  v_existing_id UUID;
BEGIN
  -- Get the first school
  SELECT id INTO v_school_id FROM schools LIMIT 1;
  
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'No school found. Please create a school first.';
  END IF;
  
  RAISE NOTICE 'Using school_id: %', v_school_id;

  -- =====================================================
  -- Teacher 1: Maria Santos - Mathematics
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'maria.santos@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'gZfnO8iIJXRJIEoXJzOSv2X43uL2',
      name = 'Maria P. Santos',
      first_name = 'Maria',
      middle_name = 'Perez',
      last_name = 'Santos',
      position = 'teacher_ii',
      specialization = 'Mathematics',
      major_specialization = 'Mathematics Education',
      highest_education = 'masters',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Maria Santos UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Maria P. Santos', 'maria.santos@school.edu', 'gZfnO8iIJXRJIEoXJzOSv2X43uL2', 'teacher',
      'Maria', 'Perez', 'Santos',
      'T-2018-001', 'teacher_ii', 'permanent',
      'Mathematics', 'Mathematics Education',
      'masters', '+63-917-123-4567',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Maria Santos CREATED';
  END IF;

  -- =====================================================
  -- Teacher 2: Juan Dela Cruz - Science
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'juan.delacruz@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'SwFJl2Tu6QeXKLUGOSCLPC4wAcA2',
      name = 'Juan M. Dela Cruz',
      first_name = 'Juan',
      middle_name = 'Martinez',
      last_name = 'Dela Cruz',
      position = 'teacher_i',
      specialization = 'Science',
      major_specialization = 'Biology Education',
      highest_education = 'bachelors',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Juan Dela Cruz UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Juan M. Dela Cruz', 'juan.delacruz@school.edu', 'SwFJl2Tu6QeXKLUGOSCLPC4wAcA2', 'teacher',
      'Juan', 'Martinez', 'Dela Cruz',
      'T-2019-015', 'teacher_i', 'permanent',
      'Science', 'Biology Education',
      'bachelors', '+63-917-234-5678',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Juan Dela Cruz CREATED';
  END IF;

  -- =====================================================
  -- Teacher 3: Ana Reyes - English
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'ana.reyes@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'z5DL7ZQwHPN3Zq3OLb1gCx6s20Y2',
      name = 'Ana L. Reyes',
      first_name = 'Ana',
      middle_name = 'Lopez',
      last_name = 'Reyes',
      position = 'teacher_iii',
      specialization = 'English',
      major_specialization = 'English Literature',
      highest_education = 'doctorate',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Ana Reyes UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Ana L. Reyes', 'ana.reyes@school.edu', 'z5DL7ZQwHPN3Zq3OLb1gCx6s20Y2', 'teacher',
      'Ana', 'Lopez', 'Reyes',
      'T-2015-008', 'teacher_iii', 'permanent',
      'English', 'English Literature',
      'doctorate', '+63-917-345-6789',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Ana Reyes CREATED';
  END IF;

  -- =====================================================
  -- Teacher 4: Pedro Garcia - Filipino
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'pedro.garcia@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'uMRZoMnhtpeeYB5tGyUUaJgx9rI3',
      name = 'Pedro R. Garcia',
      first_name = 'Pedro',
      middle_name = 'Ramos',
      last_name = 'Garcia',
      position = 'teacher_i',
      specialization = 'Filipino',
      major_specialization = 'Filipino Literature',
      highest_education = 'bachelors',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Pedro Garcia UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Pedro R. Garcia', 'pedro.garcia@school.edu', 'uMRZoMnhtpeeYB5tGyUUaJgx9rI3', 'teacher',
      'Pedro', 'Ramos', 'Garcia',
      'T-2020-025', 'teacher_i', 'permanent',
      'Filipino', 'Filipino Literature',
      'bachelors', '+63-917-456-7890',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Pedro Garcia CREATED';
  END IF;

  -- =====================================================
  -- Teacher 5: Rosa Mendoza - TLE (Master Teacher)
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'rosa.mendoza@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'GjbNJ8TzV4ONe4QL2cvK5wCfj383',
      name = 'Rosa T. Mendoza',
      first_name = 'Rosa',
      middle_name = 'Torres',
      last_name = 'Mendoza',
      position = 'master_teacher_i',
      specialization = 'TLE',
      major_specialization = 'Home Economics',
      highest_education = 'masters',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Rosa Mendoza UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Rosa T. Mendoza', 'rosa.mendoza@school.edu', 'GjbNJ8TzV4ONe4QL2cvK5wCfj383', 'teacher',
      'Rosa', 'Torres', 'Mendoza',
      'T-2010-003', 'master_teacher_i', 'permanent',
      'TLE', 'Home Economics',
      'masters', '+63-917-567-8901',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Rosa Mendoza CREATED';
  END IF;

  -- =====================================================
  -- Teacher 6: Carlos Villanueva - MAPEH
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'carlos.villanueva@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'am17hBof3SXWFTMmaRls6J1nHw92',
      name = 'Carlos A. Villanueva',
      first_name = 'Carlos',
      middle_name = 'Andres',
      last_name = 'Villanueva',
      position = 'teacher_i',
      specialization = 'MAPEH',
      major_specialization = 'Music Education',
      highest_education = 'bachelors',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Carlos Villanueva UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Carlos A. Villanueva', 'carlos.villanueva@school.edu', 'am17hBof3SXWFTMmaRls6J1nHw92', 'teacher',
      'Carlos', 'Andres', 'Villanueva',
      'T-2021-010', 'teacher_i', 'permanent',
      'MAPEH', 'Music Education',
      'bachelors', '+63-917-678-9012',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Carlos Villanueva CREATED';
  END IF;

  -- =====================================================
  -- Teacher 7: Elena Fernandez - Araling Panlipunan
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'elena.fernandez@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'u4aabtzYs3UxtPa0cvthy0ZXU4X2',
      name = 'Elena S. Fernandez',
      first_name = 'Elena',
      middle_name = 'Santos',
      last_name = 'Fernandez',
      position = 'teacher_ii',
      specialization = 'Araling Panlipunan',
      major_specialization = 'History',
      highest_education = 'masters',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Elena Fernandez UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Elena S. Fernandez', 'elena.fernandez@school.edu', 'u4aabtzYs3UxtPa0cvthy0ZXU4X2', 'teacher',
      'Elena', 'Santos', 'Fernandez',
      'T-2017-012', 'teacher_ii', 'permanent',
      'Araling Panlipunan', 'History',
      'masters', '+63-917-789-0123',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Elena Fernandez CREATED';
  END IF;

  -- =====================================================
  -- Teacher 8: Miguel Aquino - Values Education
  -- =====================================================
  SELECT id INTO v_existing_id FROM teachers WHERE email = 'miguel.aquino@school.edu';
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE teachers SET
      firebase_uid = 'eTY6U5VwL1VPqmuwM1frmyAmCN93',
      name = 'Miguel C. Aquino',
      first_name = 'Miguel',
      middle_name = 'Cruz',
      last_name = 'Aquino',
      position = 'teacher_i',
      specialization = 'Values Education',
      major_specialization = 'Religious Education',
      highest_education = 'bachelors',
      updated_at = NOW()
    WHERE id = v_existing_id;
    RAISE NOTICE '✅ Miguel Aquino UPDATED';
  ELSE
    INSERT INTO teachers (
      school_id, name, email, firebase_uid, role,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, contact_number,
      created_at, updated_at
    ) VALUES (
      v_school_id, 'Miguel C. Aquino', 'miguel.aquino@school.edu', 'eTY6U5VwL1VPqmuwM1frmyAmCN93', 'teacher',
      'Miguel', 'Cruz', 'Aquino',
      'T-2022-005', 'teacher_i', 'permanent',
      'Values Education', 'Religious Education',
      'bachelors', '+63-917-890-1234',
      NOW(), NOW()
    );
    RAISE NOTICE '✅ Miguel Aquino CREATED';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 All 8 demo teachers synced successfully!';

END $$;

-- =====================================================
-- STEP 4: Verify the sync
-- =====================================================
SELECT 
  name,
  email,
  firebase_uid,
  role,
  position,
  specialization
FROM teachers
WHERE firebase_uid IS NOT NULL
ORDER BY name;

-- Count check
SELECT 
  '✅ Total teachers with Firebase UID: ' || COUNT(*)::TEXT as status
FROM teachers 
WHERE firebase_uid IS NOT NULL;
