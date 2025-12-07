-- Seed SF7 Personnel Data for Testing
-- Created: December 7, 2025
-- Purpose: Add realistic teacher data with teaching assignments and ancillary responsibilities

-- =====================================================
-- STEP 1: Get school_id and school_year
-- =====================================================

DO $$
DECLARE
  v_school_id UUID;
  v_school_year TEXT;
  v_user_id UUID;
  v_teacher_id UUID;
  v_section_id UUID;
  teacher_counter INTEGER := 1;
BEGIN
  -- Get the first school
  SELECT id INTO v_school_id FROM schools LIMIT 1;
  
  -- Set current school year
  v_school_year := '2024-2025';
  
  RAISE NOTICE 'Seeding for school_id: %', v_school_id;
  RAISE NOTICE 'School year: %', v_school_year;

  -- =====================================================
  -- STEP 2: Create sample teachers with SF7 data
  -- =====================================================

  -- Teacher 1: Maria Santos - Mathematics Teacher, Grade 7 Adviser
  -- Check if user exists first
  SELECT id INTO v_user_id FROM users WHERE email = 'maria.santos@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_maria_santos_001', 'maria.santos@school.edu', 'Maria P. Santos', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name, 
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone, prc_license_number,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Maria P. Santos',
      'Maria', 'Perez', 'Santos',
      'T-2018-001', 'teacher_ii', 'permanent',
      'Mathematics', 'Mathematics Education',
      'masters', '2018-06-15',
      'maria.santos@school.edu', '+63-917-123-4567', 'PRC-123456',
      NOW(), NOW()
    ) RETURNING id INTO v_teacher_id;
    
    -- Add teaching assignments
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 7, 'Mathematics', 6, true),
      (v_teacher_id, v_school_id, v_school_year, 8, 'Mathematics', 6, false);
    
    -- Add ancillary responsibility
    INSERT INTO ancillary_responsibilities (
      teacher_id, school_id, school_year, responsibility, 
      description, hours_per_week
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 'Math Coordinator', 
       'Coordinates mathematics curriculum across all grade levels', 3);
    
    RAISE NOTICE 'Created: Maria Santos (Math Teacher, Grade 7 Adviser)';
  END IF;

  -- Teacher 2: Juan Dela Cruz - Science Teacher
  SELECT id INTO v_user_id FROM users WHERE email = 'juan.delacruz@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_juan_delacruz_002', 'juan.delacruz@school.edu', 'Juan M. Dela Cruz', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone, prc_license_number
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Juan M. Dela Cruz',
      'Juan', 'Martinez', 'Dela Cruz',
      'T-2019-015', 'teacher_i', 'permanent',
      'Science', 'Biology Education',
      'bachelors', '2019-08-20',
      'juan.delacruz@school.edu', '+63-917-234-5678', 'PRC-234567'
    ) RETURNING id INTO v_teacher_id;
    
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 8, 'Science', 6, true),
      (v_teacher_id, v_school_id, v_school_year, 9, 'Science', 4, false);
    
    RAISE NOTICE 'Created: Juan Dela Cruz (Science Teacher, Grade 8 Adviser)';
  END IF;

  -- Teacher 3: Ana Reyes - English Teacher
  SELECT id INTO v_user_id FROM users WHERE email = 'ana.reyes@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_ana_reyes_003', 'ana.reyes@school.edu', 'Ana L. Reyes', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone, prc_license_number
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Ana L. Reyes',
      'Ana', 'Lopez', 'Reyes',
      'T-2015-008', 'teacher_iii', 'permanent',
      'English', 'English Literature',
      'doctorate', '2015-06-10',
      'ana.reyes@school.edu', '+63-917-345-6789', 'PRC-345678'
    ) RETURNING id INTO v_teacher_id;
    
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 9, 'English', 5, true),
      (v_teacher_id, v_school_id, v_school_year, 10, 'English', 5, false);
    
    INSERT INTO ancillary_responsibilities (
      teacher_id, school_id, school_year, responsibility, 
      description, hours_per_week
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 'Reading Program Coordinator', 
       'Manages school reading program and literacy initiatives', 4);
    
    RAISE NOTICE 'Created: Ana Reyes (English Teacher, Grade 9 Adviser, PhD)';
  END IF;

  -- Teacher 4: Pedro Garcia - Filipino Teacher
  SELECT id INTO v_user_id FROM users WHERE email = 'pedro.garcia@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_pedro_garcia_004', 'pedro.garcia@school.edu', 'Pedro R. Garcia', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Pedro R. Garcia',
      'Pedro', 'Ramos', 'Garcia',
      'T-2020-025', 'teacher_i', 'permanent',
      'Filipino', 'Filipino Literature',
      'bachelors', '2020-10-05',
      'pedro.garcia@school.edu', '+63-917-456-7890'
    ) RETURNING id INTO v_teacher_id;
    
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 7, 'Filipino', 5, false),
      (v_teacher_id, v_school_id, v_school_year, 8, 'Filipino', 5, false);
    
    RAISE NOTICE 'Created: Pedro Garcia (Filipino Teacher)';
  END IF;

  -- Teacher 5: Rosa Mendoza - Master Teacher, TLE
  SELECT id INTO v_user_id FROM users WHERE email = 'rosa.mendoza@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_rosa_mendoza_005', 'rosa.mendoza@school.edu', 'Rosa T. Mendoza', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone, prc_license_number
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Rosa T. Mendoza',
      'Rosa', 'Torres', 'Mendoza',
      'T-2010-003', 'master_teacher_i', 'permanent',
      'TLE', 'Technology and Livelihood Education',
      'masters', '2010-06-15',
      'rosa.mendoza@school.edu', '+63-917-567-8901', 'PRC-456789'
    ) RETURNING id INTO v_teacher_id;
    
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 10, 'TLE - Cookery', 6, true);
    
    INSERT INTO ancillary_responsibilities (
      teacher_id, school_id, school_year, responsibility, 
      description, hours_per_week
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 'TLE Department Head', 
       'Supervises TLE curriculum and instructional materials', 5);
    
    RAISE NOTICE 'Created: Rosa Mendoza (Master Teacher, TLE, Grade 10 Adviser)';
  END IF;

  -- Teacher 6: Carlos Fernandez - MAPEH Teacher
  SELECT id INTO v_user_id FROM users WHERE email = 'carlos.fernandez@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_carlos_fernandez_006', 'carlos.fernandez@school.edu', 'Carlos J. Fernandez', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Carlos J. Fernandez',
      'Carlos', 'Jose', 'Fernandez',
      'T-2021-030', 'teacher_i', 'temporary',
      'MAPEH', 'Physical Education',
      'bachelors', '2021-06-20',
      'carlos.fernandez@school.edu', '+63-917-678-9012'
    ) RETURNING id INTO v_teacher_id;
    
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 7, 'MAPEH', 4, false),
      (v_teacher_id, v_school_id, v_school_year, 8, 'MAPEH', 4, false),
      (v_teacher_id, v_school_id, v_school_year, 9, 'MAPEH', 4, false);
    
    INSERT INTO ancillary_responsibilities (
      teacher_id, school_id, school_year, responsibility, 
      description, hours_per_week
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 'Sports Coordinator', 
       'Organizes intramurals and sports activities', 2);
    
    RAISE NOTICE 'Created: Carlos Fernandez (MAPEH Teacher, Temporary)';
  END IF;

  -- Teacher 7: Linda Bautista - Araling Panlipunan
  SELECT id INTO v_user_id FROM users WHERE email = 'linda.bautista@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_linda_bautista_007', 'linda.bautista@school.edu', 'Linda C. Bautista', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone, prc_license_number
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Linda C. Bautista',
      'Linda', 'Cruz', 'Bautista',
      'T-2017-012', 'teacher_ii', 'permanent',
      'Araling Panlipunan', 'Social Studies',
      'masters', '2017-08-01',
      'linda.bautista@school.edu', '+63-917-789-0123', 'PRC-567890'
    ) RETURNING id INTO v_teacher_id;
    
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 7, 'Araling Panlipunan', 5, false),
      (v_teacher_id, v_school_id, v_school_year, 9, 'Araling Panlipunan', 5, false);
    
    RAISE NOTICE 'Created: Linda Bautista (Araling Panlipunan Teacher)';
  END IF;

  -- Teacher 8: Roberto Villanueva - Mathematics (Contract)
  SELECT id INTO v_user_id FROM users WHERE email = 'roberto.villanueva@school.edu';
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_school_id, 'sf7_seed_roberto_villanueva_008', 'roberto.villanueva@school.edu', 'Roberto S. Villanueva', 'teacher', NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO teachers (
      id, school_id, user_id, name,
      first_name, middle_name, last_name,
      employee_number, position, employment_status,
      specialization, major_specialization,
      highest_education, date_hired,
      email, phone
    ) VALUES (
      gen_random_uuid(), v_school_id, v_user_id, 'Roberto S. Villanueva',
      'Roberto', 'Santos', 'Villanueva',
      'T-2023-045', 'teacher_i', 'contract',
      'Mathematics', 'Statistics',
      'bachelors', '2023-08-15',
      'roberto.villanueva@school.edu', '+63-917-890-1234'
    ) RETURNING id INTO v_teacher_id;
    
    INSERT INTO teaching_assignments (
      teacher_id, school_id, school_year, grade_level, subject, 
      hours_per_week, is_advisory
    ) VALUES
      (v_teacher_id, v_school_id, v_school_year, 10, 'Mathematics', 6, false);
    
    RAISE NOTICE 'Created: Roberto Villanueva (Math Teacher, Contract)';
  END IF;

  -- =====================================================
  -- STEP 3: Summary
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ SF7 SEEDING COMPLETE';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Created 8 sample teachers with:';
  RAISE NOTICE '  - Diverse positions (Teacher I-III, Master Teacher)';
  RAISE NOTICE '  - Various employment statuses (Permanent, Temporary, Contract)';
  RAISE NOTICE '  - Multiple subjects and grade levels';
  RAISE NOTICE '  - Teaching hours (4-6 hours per subject)';
  RAISE NOTICE '  - Advisory roles (5 class advisers)';
  RAISE NOTICE '  - Ancillary responsibilities (4 coordinators)';
  RAISE NOTICE '  - Educational qualifications (Bachelors, Masters, Doctorate)';
  RAISE NOTICE '';
  RAISE NOTICE 'Refresh SF7 Dashboard to see the data!';
  RAISE NOTICE '==============================================';
  
END $$;
