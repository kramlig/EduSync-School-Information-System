-- ============================================================================
-- Seed Admin Account for Mati School of Arts and Trades (MSAT)
-- School ID Number: 304326
-- Run this in Supabase SQL Editor after creating Firebase Auth account
-- ============================================================================
-- 
-- IMPORTANT: This system uses "Option A: Clean Auth Architecture"
-- Admin users are stored in the TEACHERS table with role = 'admin'
-- (NOT the users table)
-- ============================================================================

DO $$
DECLARE
  v_school_id UUID;
  v_teacher_id UUID;
  v_existing_id UUID;
BEGIN
  -- Get the school UUID for MSAT
  SELECT id INTO v_school_id 
  FROM schools 
  WHERE school_id_number = '304326' 
  LIMIT 1;

  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'School with ID 304326 (Mati School of Arts and Trades) not found!';
  END IF;

  -- Check if teacher with this firebase_uid already exists
  SELECT id INTO v_existing_id
  FROM teachers
  WHERE firebase_uid = 'xlquixBeciXubr4B2odBGfStu7M2'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE teachers
    SET 
      name = 'MSAT Administrator',
      role = 'admin',
      school_id = v_school_id,
      position = 'school_administrator',
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_teacher_id;
    
    RAISE NOTICE 'Updated existing admin record: %', v_teacher_id;
  ELSE
    -- Create new admin in TEACHERS table
    INSERT INTO teachers (
      id, 
      school_id, 
      firebase_uid, 
      email, 
      name,
      first_name,
      last_name,
      role, 
      position,
      employment_status,
      created_at, 
      updated_at
    )
    VALUES (
      gen_random_uuid(), 
      v_school_id, 
      'xlquixBeciXubr4B2odBGfStu7M2',  -- Firebase UID
      'admin@msat.edu.ph', 
      'MSAT Administrator',
      'MSAT',
      'Administrator',
      'admin',  -- This makes them a school admin
      'school_administrator',
      'permanent',
      NOW(), 
      NOW()
    )
    RETURNING id INTO v_teacher_id;
    
    RAISE NOTICE 'Created new admin record: %', v_teacher_id;
  END IF;

  RAISE NOTICE 'School ID: %', v_school_id;
  RAISE NOTICE '';
  RAISE NOTICE '=== LOGIN CREDENTIALS ===';
  RAISE NOTICE 'Email:    admin@msat.edu.ph';
  RAISE NOTICE 'Password: Msat@2024!';
  RAISE NOTICE '=========================';

END $$;

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 
-- Firebase Auth account already created with UID: xlquixBeciXubr4B2odBGfStu7M2
--
-- Just run this SQL in Supabase Dashboard → SQL Editor
--
-- Login Credentials:
--   Email:    admin@msat.edu.ph
--   Password: Msat@2024!
--
-- ============================================================================

-- Verify the admin was created correctly:
-- SELECT id, school_id, email, name, role, firebase_uid 
-- FROM teachers 
-- WHERE firebase_uid = 'xlquixBeciXubr4B2odBGfStu7M2';

-- Test the lookup function:
-- SELECT * FROM get_user_by_firebase_uid('xlquixBeciXubr4B2odBGfStu7M2');
