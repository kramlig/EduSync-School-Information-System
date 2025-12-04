-- ============================================================================
-- SEED KINDERGARTEN DATA FOR SF5-K TESTING
-- ============================================================================
-- Creates a Kindergarten section with students and proficiency records
-- for testing the SF5-K (Kindergarten Proficiency Report)
-- ============================================================================

-- Get the school_id (assuming first school in database)
DO $$
DECLARE
  v_school_id UUID;
  v_section_id UUID;
  v_student_ids UUID[];
  v_student_id UUID;
  v_counter INTEGER := 0;
BEGIN
  -- Get first school
  SELECT id INTO v_school_id FROM schools LIMIT 1;
  
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'No school found. Please seed school data first.';
  END IF;

  RAISE NOTICE 'Using school_id: %', v_school_id;

  -- Create Kindergarten section
  INSERT INTO sections (school_id, name, grade_level, capacity, school_year)
  VALUES (v_school_id, 'Kinder - Sampaguita', 0, 25, '2024-2025')
  RETURNING id INTO v_section_id;

  RAISE NOTICE 'Created Kindergarten section: %', v_section_id;

  -- Create 15 Kindergarten students
  FOR v_counter IN 1..15 LOOP
    INSERT INTO students (
      school_id,
      section_id,
      lrn,
      first_name,
      middle_name,
      last_name,
      gender,
      birth_date,
      grade_level,
      enrollment_status,
      school_year
    ) VALUES (
      v_school_id,
      v_section_id,
      '10' || LPAD(v_counter::TEXT, 10, '0'),
      CASE v_counter % 10
        WHEN 0 THEN 'Sofia'
        WHEN 1 THEN 'Miguel'
        WHEN 2 THEN 'Isabella'
        WHEN 3 THEN 'Gabriel'
        WHEN 4 THEN 'Mia'
        WHEN 5 THEN 'Lucas'
        WHEN 6 THEN 'Emma'
        WHEN 7 THEN 'Noah'
        WHEN 8 THEN 'Olivia'
        ELSE 'Liam'
      END,
      CASE v_counter % 5
        WHEN 0 THEN 'Santos'
        WHEN 1 THEN 'Reyes'
        WHEN 2 THEN 'Cruz'
        WHEN 3 THEN 'Garcia'
        ELSE 'Lopez'
      END,
      CASE v_counter % 10
        WHEN 0 THEN 'Dela Cruz'
        WHEN 1 THEN 'Rivera'
        WHEN 2 THEN 'Ramos'
        WHEN 3 THEN 'Torres'
        WHEN 4 THEN 'Gonzales'
        WHEN 5 THEN 'Flores'
        WHEN 6 THEN 'Mendoza'
        WHEN 7 THEN 'Castro'
        WHEN 8 THEN 'Aquino'
        ELSE 'Fernandez'
      END,
      CASE WHEN v_counter % 2 = 0 THEN 'Male' ELSE 'Female' END,
      CURRENT_DATE - INTERVAL '5 years' - (v_counter || ' months')::INTERVAL,
      0, -- Grade level 0 for Kindergarten
      'enrolled',
      '2024-2025'
    ) RETURNING id INTO v_student_id;
    
    v_student_ids := array_append(v_student_ids, v_student_id);
  END LOOP;

  RAISE NOTICE 'Created % Kindergarten students', array_length(v_student_ids, 1);

  -- Create SF5-K proficiency records for each student
  FOREACH v_student_id IN ARRAY v_student_ids LOOP
    INSERT INTO promotion_records (
      school_id,
      student_id,
      section_id,
      school_year,
      grading_period,
      current_grade_level,
      promotion_status,
      next_grade_level,
      -- SF5-K Proficiency Levels (4 Developmental Domains)
      socio_emotional_dev,
      physical_motor_dev,
      cognitive_dev,
      language_literacy_dev
    ) VALUES (
      v_school_id,
      v_student_id,
      v_section_id,
      '2024-2025',
      'final',
      0, -- Kindergarten
      'promoted', -- All kindergartners are promoted based on proficiency
      1, -- Next grade level is Grade 1
      -- Random proficiency levels (Advanced, Proficient, Developing, Beginning)
      (ARRAY['Advanced', 'Proficient', 'Developing'])[floor(random() * 3 + 1)],
      (ARRAY['Advanced', 'Proficient', 'Developing'])[floor(random() * 3 + 1)],
      (ARRAY['Advanced', 'Proficient', 'Developing'])[floor(random() * 3 + 1)],
      (ARRAY['Advanced', 'Proficient', 'Developing'])[floor(random() * 3 + 1)]
    );
  END LOOP;

  RAISE NOTICE 'Created % SF5-K proficiency records', array_length(v_student_ids, 1);
  RAISE NOTICE '✅ Kindergarten data seeding completed successfully!';
  RAISE NOTICE 'Section ID: %', v_section_id;
  RAISE NOTICE 'Navigate to /reports/sf5k to test the SF5-K report';

END $$;
