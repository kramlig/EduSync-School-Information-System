-- ============================================================================
-- SEED 39,000+ STUDENTS FOR SF7 SCHOOLS
-- Generates realistic Filipino student data for Division of City of Mati
-- ~700-800 students per school across 53 elementary schools
-- ============================================================================

-- First, clear existing students for Mati schools
DELETE FROM students WHERE school_id IN (
  SELECT id FROM schools WHERE division = 'Division of City of Mati'
);

DO $$
DECLARE
  v_school RECORD;
  v_students_per_school INTEGER;
  v_total_students INTEGER := 0;
  v_lrn_counter BIGINT := 100000000001; -- Starting LRN
  v_first_names TEXT[] := ARRAY[
    'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia',
    'Gabriel', 'Isabella', 'Rafael', 'Camila', 'Antonio', 'Valentina', 'Francisco', 'Lucia', 'Manuel', 'Carmen',
    'Andres', 'Angela', 'Diego', 'Patricia', 'Fernando', 'Teresa', 'Ricardo', 'Beatriz', 'Eduardo', 'Gloria',
    'Roberto', 'Cristina', 'Alejandro', 'Daniela', 'Javier', 'Andrea', 'Luis', 'Paula', 'Daniel', 'Gabriela',
    'Marco', 'Nicole', 'Adrian', 'Jasmine', 'Bryan', 'Kimberly', 'Kevin', 'Ashley', 'Christian', 'Michelle',
    'Joshua', 'Samantha', 'Mark', 'Jennifer', 'John', 'Jessica', 'James', 'Sarah', 'Michael', 'Emily',
    'Kenneth', 'Katherine', 'Raymond', 'Stephanie', 'Patrick', 'Christine', 'Vincent', 'Melissa', 'Jerome', 'Angelica',
    'Reymart', 'Jessa', 'Jayson', 'Alyssa', 'Aldrin', 'Princess', 'Arjay', 'Lovely', 'Justine', 'Angel'
  ];
  v_last_names TEXT[] := ARRAY[
    'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Gonzales', 'Ramos', 'Bautista',
    'Villanueva', 'Fernandez', 'Lopez', 'Martinez', 'Rodriguez', 'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Morales',
    'Castro', 'Dela Cruz', 'Rivera', 'Aquino', 'Navarro', 'Diaz', 'Pascual', 'Salazar', 'Valdez', 'Domingo',
    'Aguilar', 'Soriano', 'Mercado', 'Del Rosario', 'Ocampo', 'Manalo', 'Castillo', 'Francisco', 'Tolentino', 'Salvador',
    'Panganiban', 'Corpuz', 'Antonio', 'Ignacio', 'De Guzman', 'David', 'Jimenez', 'Padilla', 'Magno', 'Espinosa',
    'Vizconde', 'Rabat', 'Almario', 'Lopez', 'Dawang', 'Malintad', 'Genon', 'Rodriguez', 'Ytac', 'Perez'
  ];
  v_middle_names TEXT[] := ARRAY[
    'Aquino', 'Bautista', 'Corpuz', 'Delos Santos', 'Enriquez', 'Franco', 'Galang', 'Herrera', 'Ilagan', 'Javier',
    'Kapunan', 'Lacson', 'Magpayo', 'Natividad', 'Ocampo', 'Ponce', 'Quizon', 'Reyes', 'Santiago', 'Tan',
    'Uy', 'Velasco', 'Wong', 'Ximenes', 'Yap', 'Zamora', 'Alba', 'Balao', 'Cabal', 'Dagsa'
  ];
  v_barangays TEXT[] := ARRAY[
    'Badas', 'Baso', 'Belsonda', 'BLISS', 'Bobon', 'Buso', 'Cabubuanan', 'Cangusan', 'Catmonan',
    'Culian', 'Dahican', 'Dawan', 'Don Enrique Lopez', 'Don Martin Marundan', 'Langka', 'Lawigan',
    'Libudon', 'Licop', 'Luban', 'Macambol', 'Magsaysay', 'Magum', 'Matiao', 'Mayo', 'Sainz',
    'Sanghay', 'Sinayawan', 'Sudlon', 'Tagabakid', 'Tagawisan', 'Tagbinonga', 'Tagbobolo', 'Taguibo',
    'Tamia', 'Tamisan', 'Tinagacan', 'Wagon', 'Cabuaya', 'Lanca', 'Talucanga', 'Sta. Cruz', 'Calapagan'
  ];
  v_i INTEGER;
  v_fname TEXT;
  v_mname TEXT;
  v_lname TEXT;
  v_gender TEXT;
  v_grade INTEGER;
  v_birth_year INTEGER;
  v_birth_month INTEGER;
  v_birth_day INTEGER;
  v_address TEXT;
BEGIN
  RAISE NOTICE 'Starting student seeding for Division of City of Mati...';
  
  -- Loop through each SF7 school
  FOR v_school IN 
    SELECT id, name, school_id_number, district
    FROM schools 
    WHERE division = 'Division of City of Mati' 
      AND school_id_number IS NOT NULL
    ORDER BY school_id_number
  LOOP
    -- Vary students per school (600-900 range for realism)
    v_students_per_school := 600 + floor(random() * 300)::INTEGER;
    
    RAISE NOTICE 'Seeding % students for % (%)', v_students_per_school, v_school.name, v_school.school_id_number;
    
    FOR v_i IN 1..v_students_per_school LOOP
      -- Random names
      v_fname := v_first_names[1 + floor(random() * array_length(v_first_names, 1))::INTEGER];
      v_mname := v_middle_names[1 + floor(random() * array_length(v_middle_names, 1))::INTEGER];
      v_lname := v_last_names[1 + floor(random() * array_length(v_last_names, 1))::INTEGER];
      
      -- Random gender
      v_gender := CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END;
      
      -- Random grade (1-6 for elementary)
      v_grade := 1 + floor(random() * 6)::INTEGER;
      
      -- Birth year based on grade (approximate age)
      v_birth_year := 2025 - (v_grade + 5 + floor(random() * 2)::INTEGER);
      v_birth_month := 1 + floor(random() * 12)::INTEGER;
      v_birth_day := 1 + floor(random() * 28)::INTEGER;
      
      -- Random barangay address
      v_address := v_barangays[1 + floor(random() * array_length(v_barangays, 1))::INTEGER] || ', City of Mati, Davao Oriental';
      
      -- Insert student
      INSERT INTO students (
        id, school_id, lrn, name, first_name, middle_name, last_name,
        gender, date_of_birth, grade_level, address, enrollment_status,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        v_school.id,
        v_lrn_counter::TEXT,
        v_fname || ' ' || substring(v_mname, 1, 1) || '. ' || v_lname,
        v_fname,
        v_mname,
        v_lname,
        v_gender::gender_type,
        make_date(v_birth_year, v_birth_month, v_birth_day),
        v_grade,
        v_address,
        'enrolled',
        NOW(),
        NOW()
      );
      
      v_lrn_counter := v_lrn_counter + 1;
      v_total_students := v_total_students + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STUDENT SEEDING COMPLETE!';
  RAISE NOTICE 'Total Students: %', v_total_students;
  RAISE NOTICE 'Schools: 53';
  RAISE NOTICE 'Average per school: %', v_total_students / 53;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Total count
SELECT COUNT(*) as total_students FROM students WHERE deleted_at IS NULL;

-- By district
SELECT s.district, COUNT(st.id) as students
FROM schools s
JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- By grade level
SELECT grade_level, COUNT(*) as count
FROM students WHERE deleted_at IS NULL
GROUP BY grade_level ORDER BY grade_level;

-- Top schools by enrollment
SELECT s.school_id_number, s.name, COUNT(st.id) as students
FROM schools s
JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
WHERE s.division = 'Division of City of Mati'
GROUP BY s.id, s.school_id_number, s.name
ORDER BY students DESC
LIMIT 10;
