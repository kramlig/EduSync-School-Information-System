-- ============================================================================
-- SEED STUDENTS FOR MATI DIVISION (STORED PROCEDURE VERSION)
-- Generates ~38,804 students dynamically - no huge INSERT statements
-- Run this in Supabase SQL Editor - it will work!
-- ============================================================================

-- First, clean existing students for Mati schools
DELETE FROM students WHERE school_id IN (
  SELECT id FROM schools WHERE division = 'Division of City of Mati'
);

DO $$
DECLARE
  v_school RECORD;
  v_grade INTEGER;
  v_section INTEGER;
  v_student_num INTEGER;
  v_students_per_grade INTEGER;
  v_lrn_counter BIGINT := 100000000001;
  v_total_students INTEGER := 0;
  v_first_names TEXT[] := ARRAY[
    'Juan', 'Pedro', 'Jose', 'Antonio', 'Francisco', 'Manuel', 'Carlos', 'Miguel', 'Rafael', 'Eduardo',
    'Maria', 'Ana', 'Rosa', 'Carmen', 'Teresa', 'Isabel', 'Luz', 'Elena', 'Gloria', 'Patricia',
    'Andrei', 'Jasper', 'Kyle', 'Mark', 'James', 'John', 'Paul', 'Peter', 'Christian', 'Angelo',
    'Angel', 'Princess', 'Jasmine', 'Nicole', 'Kristine', 'Joy', 'Grace', 'Faith', 'Hope', 'Mae',
    'Bryan', 'Ryan', 'Jayson', 'Kevin', 'Aldrin', 'Arjay', 'Rodel', 'Joel', 'Jaymark', 'Marvin',
    'Maricel', 'Maricris', 'Maribel', 'Marissa', 'Cherry', 'Apple', 'Honey', 'Baby', 'Lovely', 'Divine',
    'Joshua', 'Jericho', 'Jerome', 'Jeffrey', 'Joseph', 'Jonathan', 'Jerald', 'Jessie', 'Jomar', 'Jobert',
    'Michelle', 'Michaela', 'Mia', 'Mika', 'Mikaela', 'Marjorie', 'Melody', 'Mylene', 'Mayumi', 'Marian',
    'Carlo', 'Carlito', 'Carmelo', 'Crisanto', 'Criselda', 'Cynthia', 'Czarina', 'Czar', 'Cyrus', 'Cedric',
    'Danica', 'Daniela', 'Donna', 'Dianne', 'Diana', 'Desiree', 'Denise', 'Dorothy', 'Dolores', 'Dulce'
  ];
  v_middle_names TEXT[] := ARRAY[
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrade',
    'Ramos', 'Aquino', 'Castro', 'Rivera', 'Gonzales', 'Lopez', 'Martinez', 'Hernandez', 'Perez', 'Sanchez',
    'Villanueva', 'Dela Cruz', 'Delos Santos', 'Delos Reyes', 'Del Rosario', 'De Guzman', 'De Leon', 'De Jesus', 'De Vera', 'De Castro'
  ];
  v_last_names TEXT[] := ARRAY[
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Ramos', 'Aquino',
    'Dela Cruz', 'Delos Santos', 'Villanueva', 'Fernandez', 'Gonzales', 'Lopez', 'Martinez', 'Rodriguez', 'Hernandez', 'Perez',
    'Castillo', 'Morales', 'Aguilar', 'Navarro', 'Pascual', 'Salvador', 'Soriano', 'Tolentino', 'Valencia', 'Velasco',
    'Almonte', 'Bello', 'Cabrera', 'Dagohoy', 'Enriquez', 'Feliciano', 'Galang', 'Hilario', 'Ignacio', 'Javier',
    'Lacson', 'Magno', 'Natividad', 'Ong', 'Panganiban', 'Quizon', 'Regalado', 'Salazar', 'Tan', 'Umali',
    'Valdez', 'Yap', 'Zarate', 'Abalos', 'Bueno', 'Corpuz', 'Dimaculangan', 'Evangelista', 'Fajardo', 'Guerrero'
  ];
  v_first_name TEXT;
  v_middle_name TEXT;
  v_last_name TEXT;
  v_gender TEXT;
  v_birth_year INTEGER;
  v_birth_month INTEGER;
  v_birth_day INTEGER;
  v_is_secondary BOOLEAN;
  v_min_grade INTEGER;
  v_max_grade INTEGER;
BEGIN
  RAISE NOTICE 'Starting student generation for Division of City of Mati...';
  RAISE NOTICE 'Target: ~38,000 students across 71 schools';
  
  -- Loop through each school
  FOR v_school IN 
    SELECT s.id, s.name, s.school_id_number,
           CASE 
             WHEN s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' OR s.name ILIKE '%Arts%' 
                  OR s.name ILIKE '%Voc%' OR s.name ILIKE '%Science High%' OR s.name ILIKE '%Comprehensive%'
             THEN true
             ELSE false
           END as is_secondary
    FROM schools s
    WHERE s.division = 'Division of City of Mati'
      AND s.school_id_number IS NOT NULL
    ORDER BY s.school_id_number
  LOOP
    -- Determine grade range based on school type
    IF v_school.is_secondary THEN
      v_min_grade := 7;
      v_max_grade := 12;
      v_students_per_grade := 90; -- ~540 per secondary school
    ELSE
      v_min_grade := 1;
      v_max_grade := 6;
      v_students_per_grade := 90; -- ~540 per elementary school
    END IF;
    
    -- Generate students for each grade
    FOR v_grade IN v_min_grade..v_max_grade LOOP
      FOR v_student_num IN 1..v_students_per_grade LOOP
        -- Random name selection
        v_first_name := v_first_names[1 + floor(random() * array_length(v_first_names, 1))::int];
        v_middle_name := v_middle_names[1 + floor(random() * array_length(v_middle_names, 1))::int];
        v_last_name := v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int];
        
        -- Random gender (based on first name patterns)
        IF v_first_name IN ('Maria', 'Ana', 'Rosa', 'Carmen', 'Teresa', 'Isabel', 'Luz', 'Elena', 'Gloria', 'Patricia',
                           'Angel', 'Princess', 'Jasmine', 'Nicole', 'Kristine', 'Joy', 'Grace', 'Faith', 'Hope', 'Mae',
                           'Maricel', 'Maricris', 'Maribel', 'Marissa', 'Cherry', 'Apple', 'Honey', 'Baby', 'Lovely', 'Divine',
                           'Michelle', 'Michaela', 'Mia', 'Mika', 'Mikaela', 'Marjorie', 'Melody', 'Mylene', 'Mayumi', 'Marian',
                           'Criselda', 'Cynthia', 'Czarina', 'Danica', 'Daniela', 'Donna', 'Dianne', 'Diana', 'Desiree', 'Denise', 'Dorothy', 'Dolores', 'Dulce') THEN
          v_gender := 'Female';
        ELSE
          v_gender := 'Male';
        END IF;
        
        -- Calculate birth year based on grade (age = grade + 5 or 6)
        v_birth_year := 2025 - (v_grade + 5 + floor(random() * 2)::int);
        v_birth_month := 1 + floor(random() * 12)::int;
        v_birth_day := 1 + floor(random() * 28)::int;
        
        -- Insert student
        INSERT INTO students (
          id, school_id, lrn, name, first_name, middle_name, last_name,
          gender, date_of_birth, grade_level, enrollment_status,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          v_school.id,
          v_lrn_counter::TEXT,
          v_first_name || ' ' || v_middle_name || ' ' || v_last_name,
          v_first_name,
          v_middle_name,
          v_last_name,
          v_gender::gender_type,
          make_date(v_birth_year, v_birth_month, v_birth_day),
          v_grade,
          'enrolled',
          NOW(),
          NOW()
        );
        
        v_lrn_counter := v_lrn_counter + 1;
        v_total_students := v_total_students + 1;
        
      END LOOP;
    END LOOP;
    
    -- Progress update every 10 schools
    IF v_total_students % 5000 < 600 THEN
      RAISE NOTICE 'Generated % students so far... (School: %)', v_total_students, v_school.name;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STUDENT GENERATION COMPLETE!';
  RAISE NOTICE 'Total Students Created: %', v_total_students;
  RAISE NOTICE '========================================';
END $$;

-- Verification
SELECT 
  CASE 
    WHEN s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' THEN 'Secondary'
    ELSE 'Elementary'
  END as school_type,
  COUNT(DISTINCT s.id) as schools,
  COUNT(st.id) as students
FROM schools s
LEFT JOIN students st ON st.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY 1
ORDER BY 1;

-- Students by grade level
SELECT grade_level, COUNT(*) as count
FROM students st
JOIN schools s ON st.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY grade_level
ORDER BY grade_level;
