-- ============================================================================
-- Seed Region XI (Davao Region) - Divisions, Districts, Schools, Personnel
-- Run this SQL in Supabase Dashboard SQL Editor
-- ============================================================================
-- Region XI - Davao Region includes:
-- 1. Division of Davao City
-- 2. Division of Davao del Norte
-- 3. Division of Davao del Sur
-- 4. Division of Davao Oriental
-- 5. Division of Davao de Oro (formerly Compostela Valley)
-- 6. Division of Davao Occidental
-- ============================================================================

DO $$
DECLARE
  -- Division IDs
  davao_city_division_id UUID;
  davao_norte_division_id UUID;
  davao_sur_division_id UUID;
  davao_oriental_division_id UUID;
  davao_oro_division_id UUID;
  davao_occidental_division_id UUID;
  
  -- District IDs for Davao City
  dc_north_district_id UUID;
  dc_south_district_id UUID;
  dc_east_district_id UUID;
  dc_west_district_id UUID;
  dc_central_district_id UUID;
  
  -- District IDs for Davao del Norte
  dn_tagum_district_id UUID;
  dn_panabo_district_id UUID;
  dn_samal_district_id UUID;
  
  -- School IDs
  school_1_id UUID;
  school_2_id UUID;
  school_3_id UUID;
  school_4_id UUID;
  school_5_id UUID;
  school_6_id UUID;
  school_7_id UUID;
  school_8_id UUID;
  
  -- User IDs for teachers
  user_teacher_1 UUID;
  user_teacher_2 UUID;
  user_teacher_3 UUID;
  user_teacher_4 UUID;
  user_teacher_5 UUID;
  user_teacher_6 UUID;
  user_teacher_7 UUID;
  user_teacher_8 UUID;
  
  -- Teacher IDs
  teacher_1_id UUID;
  teacher_2_id UUID;
  teacher_3_id UUID;
  teacher_4_id UUID;
  teacher_5_id UUID;
  teacher_6_id UUID;
  teacher_7_id UUID;
  teacher_8_id UUID;
  
  -- Section IDs
  section_1_id UUID;
  section_2_id UUID;
  section_3_id UUID;
  section_4_id UUID;
  section_5_id UUID;
  section_6_id UUID;
  section_7_id UUID;
  section_8_id UUID;
  
  -- Parent User IDs
  parent_user_1 UUID;
  parent_user_2 UUID;
  parent_user_3 UUID;
  parent_user_4 UUID;
  
  -- Parent IDs
  parent_1_id UUID;
  parent_2_id UUID;
  parent_3_id UUID;
  parent_4_id UUID;
  
  -- Student IDs
  student_1_id UUID;
  student_2_id UUID;
  student_3_id UUID;
  student_4_id UUID;
  student_5_id UUID;
  student_6_id UUID;
  student_7_id UUID;
  student_8_id UUID;
  
BEGIN
  -- ========================================
  -- PART 1: CREATE DIVISIONS
  -- ========================================
  
  -- Division of Davao City
  INSERT INTO divisions (code, name, region, region_code, address, city, province, 
    contact_email, contact_phone, superintendent_name, asst_superintendent_name, is_active)
  VALUES (
    'DIV-DAVAO-CITY',
    'Division of Davao City',
    'Region XI - Davao Region',
    'REG-XI',
    'Elpidio Quirino Avenue, Davao City',
    'Davao City',
    'Davao del Sur',
    'davao.city@deped.gov.ph',
    '(082) 227-5893',
    'Dr. Maria Elena Samson',
    'Dr. Roberto Cruz Jr.',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    region_code = EXCLUDED.region_code
  RETURNING id INTO davao_city_division_id;
  
  -- Division of Davao del Norte
  INSERT INTO divisions (code, name, region, region_code, address, city, province,
    contact_email, contact_phone, superintendent_name, asst_superintendent_name, is_active)
  VALUES (
    'DIV-DAVAO-NORTE',
    'Division of Davao del Norte',
    'Region XI - Davao Region',
    'REG-XI',
    'Apokon Road, Tagum City',
    'Tagum City',
    'Davao del Norte',
    'davao.norte@deped.gov.ph',
    '(084) 216-2456',
    'Dr. Josephine Lacson',
    'Dr. Fernando Villanueva',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region
  RETURNING id INTO davao_norte_division_id;
  
  -- Division of Davao del Sur
  INSERT INTO divisions (code, name, region, region_code, address, city, province,
    contact_email, contact_phone, superintendent_name, asst_superintendent_name, is_active)
  VALUES (
    'DIV-DAVAO-SUR',
    'Division of Davao del Sur',
    'Region XI - Davao Region',
    'REG-XI',
    'City Hall Complex, Digos City',
    'Digos City',
    'Davao del Sur',
    'davao.sur@deped.gov.ph',
    '(082) 553-2891',
    'Dr. Ricardo Mendoza',
    'Dr. Lilia Santos',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region
  RETURNING id INTO davao_sur_division_id;
  
  -- Division of Davao Oriental
  INSERT INTO divisions (code, name, region, region_code, address, city, province,
    contact_email, contact_phone, superintendent_name, asst_superintendent_name, is_active)
  VALUES (
    'DIV-DAVAO-ORIENTAL',
    'Division of Davao Oriental',
    'Region XI - Davao Region',
    'REG-XI',
    'Provincial Capitol Complex, Mati City',
    'Mati City',
    'Davao Oriental',
    'davao.oriental@deped.gov.ph',
    '(087) 811-2345',
    'Dr. Amelia Gutierrez',
    'Dr. Carlos Reyes',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region
  RETURNING id INTO davao_oriental_division_id;
  
  -- Division of Davao de Oro
  INSERT INTO divisions (code, name, region, region_code, address, city, province,
    contact_email, contact_phone, superintendent_name, asst_superintendent_name, is_active)
  VALUES (
    'DIV-DAVAO-ORO',
    'Division of Davao de Oro',
    'Region XI - Davao Region',
    'REG-XI',
    'Provincial Capitol, Nabunturan',
    'Nabunturan',
    'Davao de Oro',
    'davao.oro@deped.gov.ph',
    '(084) 376-5678',
    'Dr. Benjamin Aquino',
    'Dr. Patricia Ramos',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region
  RETURNING id INTO davao_oro_division_id;
  
  -- Division of Davao Occidental
  INSERT INTO divisions (code, name, region, region_code, address, city, province,
    contact_email, contact_phone, superintendent_name, asst_superintendent_name, is_active)
  VALUES (
    'DIV-DAVAO-OCCIDENTAL',
    'Division of Davao Occidental',
    'Region XI - Davao Region',
    'REG-XI',
    'Provincial Capitol, Malita',
    'Malita',
    'Davao Occidental',
    'davao.occidental@deped.gov.ph',
    '(082) 855-1234',
    'Dr. Gloria Fernandez',
    'Dr. Antonio Martinez',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region
  RETURNING id INTO davao_occidental_division_id;

  RAISE NOTICE 'Created 6 divisions for Region XI';

  -- ========================================
  -- PART 2: CREATE DISTRICTS FOR DAVAO CITY
  -- ========================================
  
  -- Davao City North District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_city_division_id,
    'DC-NORTH',
    'Davao City North District',
    'Dr. Elena Maglasang',
    '0917-123-4561',
    ARRAY['Buhangin', 'Cabantian', 'Panacan', 'Sasa', 'Bunawan']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dc_north_district_id;
  
  -- Davao City South District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_city_division_id,
    'DC-SOUTH',
    'Davao City South District',
    'Dr. Ricardo Macasaet',
    '0918-234-5672',
    ARRAY['Toril', 'Bago Aplaya', 'Talomo', 'Mintal', 'Catalunan Grande']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dc_south_district_id;
  
  -- Davao City East District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_city_division_id,
    'DC-EAST',
    'Davao City East District',
    'Dr. Margarita Santos',
    '0919-345-6783',
    ARRAY['Paquibato', 'Calinan', 'Marilog', 'Baguio']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dc_east_district_id;
  
  -- Davao City West District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_city_division_id,
    'DC-WEST',
    'Davao City West District',
    'Dr. Antonio Valdez',
    '0920-456-7894',
    ARRAY['Agdao', 'Centro', 'Bangkal', 'Matina', 'Bajada']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dc_west_district_id;
  
  -- Davao City Central District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_city_division_id,
    'DC-CENTRAL',
    'Davao City Central District',
    'Dr. Lourdes Padilla',
    '0921-567-8905',
    ARRAY['Poblacion', 'San Pedro', 'Talomo Proper', 'Langub']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dc_central_district_id;

  -- ========================================
  -- PART 3: CREATE DISTRICTS FOR DAVAO DEL NORTE
  -- ========================================
  
  -- Tagum City District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_norte_division_id,
    'DN-TAGUM',
    'Tagum City District',
    'Dr. Francisco Lumayag',
    '0922-678-9016',
    ARRAY['Magugpo North', 'Magugpo South', 'Mankilam', 'Apokon', 'Visayan Village']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dn_tagum_district_id;
  
  -- Panabo City District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_norte_division_id,
    'DN-PANABO',
    'Panabo City District',
    'Dr. Cristina Dabao',
    '0923-789-0127',
    ARRAY['Gredu', 'San Francisco', 'New Pandan', 'Dapco', 'San Vicente']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dn_panabo_district_id;
  
  -- Island Garden City of Samal District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    davao_norte_division_id,
    'DN-SAMAL',
    'Island Garden City of Samal District',
    'Dr. Roberto Camiguin',
    '0924-890-1238',
    ARRAY['Peñaplata', 'Babak', 'Kaputian', 'San Isidro']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name
  RETURNING id INTO dn_samal_district_id;

  RAISE NOTICE 'Created 8 districts for Davao City and Davao del Norte';

  -- ========================================
  -- PART 4: CREATE SCHOOLS FOR DAVAO CITY
  -- ========================================
  
  -- School 1: Davao City National High School (Central District)
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id, 
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Davao City National High School',
    '500001',
    'F. Torres Street, Poblacion, Davao City',
    dc_central_district_id,
    davao_city_division_id,
    'Dr. Juan dela Cruz',
    'Division of Davao City',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id,
    division_id = EXCLUDED.division_id
  RETURNING id INTO school_1_id;
  
  -- School 2: Buhangin National High School (North District)
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id,
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Buhangin National High School',
    '500002',
    'Cabaguio Avenue, Buhangin, Davao City',
    dc_north_district_id,
    davao_city_division_id,
    'Mrs. Ana Maria Santos',
    'Division of Davao City',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id
  RETURNING id INTO school_2_id;
  
  -- School 3: Toril National High School (South District)
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id,
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Toril National High School',
    '500003',
    'Toril Proper, Davao City',
    dc_south_district_id,
    davao_city_division_id,
    'Mr. Pedro Reyes',
    'Division of Davao City',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id
  RETURNING id INTO school_3_id;
  
  -- School 4: Agdao National High School (West District)
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id,
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Agdao National High School',
    '500004',
    'San Juan Street, Agdao, Davao City',
    dc_west_district_id,
    davao_city_division_id,
    'Dr. Carmelita Gonzales',
    'Division of Davao City',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id
  RETURNING id INTO school_4_id;

  -- ========================================
  -- PART 5: CREATE SCHOOLS FOR DAVAO DEL NORTE
  -- ========================================
  
  -- School 5: Tagum City National High School
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id,
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Tagum City National High School',
    '500005',
    'Apokon Road, Tagum City, Davao del Norte',
    dn_tagum_district_id,
    davao_norte_division_id,
    'Dr. Miguel Bautista',
    'Division of Davao del Norte',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id
  RETURNING id INTO school_5_id;
  
  -- School 6: Panabo National High School
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id,
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Panabo National High School',
    '500006',
    'Quezon Street, Panabo City, Davao del Norte',
    dn_panabo_district_id,
    davao_norte_division_id,
    'Mrs. Rosalinda Aquino',
    'Division of Davao del Norte',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id
  RETURNING id INTO school_6_id;
  
  -- School 7: Samal National High School
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id,
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Samal National High School',
    '500007',
    'Peñaplata, Island Garden City of Samal',
    dn_samal_district_id,
    davao_norte_division_id,
    'Mr. Jose Villanueva',
    'Division of Davao del Norte',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id
  RETURNING id INTO school_7_id;
  
  -- School 8: Magugpo National High School (Tagum)
  INSERT INTO schools (
    name, school_id_number, address, district_id, division_id,
    principal_name, division, region, current_school_year, is_active
  )
  VALUES (
    'Magugpo National High School',
    '500008',
    'Magugpo Poblacion, Tagum City, Davao del Norte',
    dn_tagum_district_id,
    davao_norte_division_id,
    'Mrs. Elena Macapagal',
    'Division of Davao del Norte',
    'Region XI - Davao Region',
    '2024-2025',
    true
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    district_id = EXCLUDED.district_id
  RETURNING id INTO school_8_id;

  RAISE NOTICE 'Created 8 schools for Region XI';

  -- ========================================
  -- PART 6: CREATE USERS FOR TEACHERS
  -- ========================================
  
  -- Teacher 1 - School 1
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher1.dcnhs@deped.gov.ph', 'Maria Clara Reyes', 'teacher', school_1_id, 'teacher1_dcnhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_1;
  
  -- Teacher 2 - School 1
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher2.dcnhs@deped.gov.ph', 'Jose Rizal Santos', 'teacher', school_1_id, 'teacher2_dcnhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_2;
  
  -- Teacher 3 - School 2
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher1.bnhs@deped.gov.ph', 'Andres Bonifacio Cruz', 'teacher', school_2_id, 'teacher1_bnhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_3;
  
  -- Teacher 4 - School 3
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher1.tnhs@deped.gov.ph', 'Emilio Aguinaldo Reyes', 'teacher', school_3_id, 'teacher1_tnhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_4;
  
  -- Teacher 5 - School 5
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher1.tcnhs@deped.gov.ph', 'Gabriela Silang Magat', 'teacher', school_5_id, 'teacher1_tcnhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_5;
  
  -- Teacher 6 - School 5
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher2.tcnhs@deped.gov.ph', 'Melchora Aquino Bautista', 'teacher', school_5_id, 'teacher2_tcnhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_6;
  
  -- Teacher 7 - School 6
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher1.pnhs@deped.gov.ph', 'Apolinario Mabini Luna', 'teacher', school_6_id, 'teacher1_pnhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_7;
  
  -- Teacher 8 - School 7
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('teacher1.snhs@deped.gov.ph', 'Diego Silang Magtanggol', 'teacher', school_7_id, 'teacher1_snhs_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO user_teacher_8;

  RAISE NOTICE 'Created 8 teacher users';

  -- ========================================
  -- PART 7: CREATE TEACHERS
  -- ========================================
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_1_id, user_teacher_1, 'Maria Clara Reyes', 'T-DC-001', 'Mathematics', 'Math Department')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_1_id;
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_1_id, user_teacher_2, 'Jose Rizal Santos', 'T-DC-002', 'Science', 'Science Department')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_2_id;
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_2_id, user_teacher_3, 'Andres Bonifacio Cruz', 'T-DC-003', 'English', 'English Department')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_3_id;
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_3_id, user_teacher_4, 'Emilio Aguinaldo Reyes', 'T-DC-004', 'Filipino', 'Filipino Department')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_4_id;
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_5_id, user_teacher_5, 'Gabriela Silang Magat', 'T-DN-001', 'Araling Panlipunan', 'Social Studies')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_5_id;
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_5_id, user_teacher_6, 'Melchora Aquino Bautista', 'T-DN-002', 'MAPEH', 'MAPEH Department')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_6_id;
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_6_id, user_teacher_7, 'Apolinario Mabini Luna', 'T-DN-003', 'TLE', 'TLE Department')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_7_id;
  
  INSERT INTO teachers (school_id, user_id, name, employee_number, specialization, department)
  VALUES (school_7_id, user_teacher_8, 'Diego Silang Magtanggol', 'T-DN-004', 'Values Education', 'Values Department')
  ON CONFLICT (school_id, user_id) DO NOTHING
  RETURNING id INTO teacher_8_id;

  RAISE NOTICE 'Created 8 teachers';

  -- ========================================
  -- PART 8: CREATE SECTIONS
  -- ========================================
  
  -- Sections for School 1 (Davao City National High School)
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_1_id, 'Narra', 7, '2024-2025', teacher_1_id, 'Room 101', 45)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_1_id;
  
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_1_id, 'Molave', 8, '2024-2025', teacher_2_id, 'Room 102', 45)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_2_id;
  
  -- Sections for School 2 (Buhangin NHS)
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_2_id, 'Sampaguita', 7, '2024-2025', teacher_3_id, 'Room 201', 40)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_3_id;
  
  -- Sections for School 3 (Toril NHS)
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_3_id, 'Ilang-Ilang', 9, '2024-2025', teacher_4_id, 'Room 301', 42)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_4_id;
  
  -- Sections for School 5 (Tagum City NHS)
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_5_id, 'Mabini', 7, '2024-2025', teacher_5_id, 'Room 101', 45)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_5_id;
  
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_5_id, 'Rizal', 8, '2024-2025', teacher_6_id, 'Room 102', 45)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_6_id;
  
  -- Sections for School 6 (Panabo NHS)
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_6_id, 'Bonifacio', 10, '2024-2025', teacher_7_id, 'Room 201', 40)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_7_id;
  
  -- Sections for School 7 (Samal NHS)
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id, room_number, capacity)
  VALUES (school_7_id, 'Silang', 11, '2024-2025', teacher_8_id, 'Room 301', 38)
  ON CONFLICT (school_id, grade_level, name, school_year) DO NOTHING
  RETURNING id INTO section_8_id;

  RAISE NOTICE 'Created 8 sections';

  -- ========================================
  -- PART 9: CREATE STUDENTS
  -- ========================================
  
  -- Students for School 1, Section 1 (Davao City NHS - Narra)
  INSERT INTO students (school_id, lrn, name, first_name, middle_name, last_name, gender, date_of_birth, 
    section_id, grade_level, enrollment_status, address)
  VALUES 
    (school_1_id, '135700010001', 'Juan Carlos dela Cruz', 'Juan Carlos', 'Mendez', 'dela Cruz', 'Male', '2011-03-15', 
     section_1_id, 7, 'enrolled', 'Poblacion, Davao City'),
    (school_1_id, '135700010002', 'Maria Angela Santos', 'Maria Angela', 'Reyes', 'Santos', 'Female', '2011-05-22', 
     section_1_id, 7, 'enrolled', 'San Pedro, Davao City'),
    (school_1_id, '135700010003', 'Pedro Miguel Gonzales', 'Pedro Miguel', 'Cruz', 'Gonzales', 'Male', '2011-01-10', 
     section_1_id, 7, 'enrolled', 'Bajada, Davao City')
  ON CONFLICT (lrn) DO NOTHING;
  
  -- Students for School 1, Section 2 (Davao City NHS - Molave)
  INSERT INTO students (school_id, lrn, name, first_name, middle_name, last_name, gender, date_of_birth, 
    section_id, grade_level, enrollment_status, address)
  VALUES 
    (school_1_id, '135700010004', 'Ana Patricia Reyes', 'Ana Patricia', 'Luna', 'Reyes', 'Female', '2010-08-18', 
     section_2_id, 8, 'enrolled', 'Matina, Davao City'),
    (school_1_id, '135700010005', 'Jose Manuel Aquino', 'Jose Manuel', 'Bautista', 'Aquino', 'Male', '2010-11-25', 
     section_2_id, 8, 'enrolled', 'Agdao, Davao City')
  ON CONFLICT (lrn) DO NOTHING;
  
  -- Students for School 5, Section 5 (Tagum City NHS - Mabini)
  INSERT INTO students (school_id, lrn, name, first_name, middle_name, last_name, gender, date_of_birth, 
    section_id, grade_level, enrollment_status, address)
  VALUES 
    (school_5_id, '135700050001', 'Gabriel Luis Magat', 'Gabriel Luis', 'Santos', 'Magat', 'Male', '2011-07-12', 
     section_5_id, 7, 'enrolled', 'Apokon, Tagum City'),
    (school_5_id, '135700050002', 'Sofia Marie Villanueva', 'Sofia Marie', 'Cruz', 'Villanueva', 'Female', '2011-09-05', 
     section_5_id, 7, 'enrolled', 'Magugpo, Tagum City'),
    (school_5_id, '135700050003', 'Miguel Antonio Bautista', 'Miguel Antonio', 'Reyes', 'Bautista', 'Male', '2011-02-28', 
     section_5_id, 7, 'enrolled', 'Mankilam, Tagum City')
  ON CONFLICT (lrn) DO NOTHING;
  
  -- Get student IDs for parent linking
  SELECT id INTO student_1_id FROM students WHERE lrn = '135700010001';
  SELECT id INTO student_2_id FROM students WHERE lrn = '135700010002';
  SELECT id INTO student_3_id FROM students WHERE lrn = '135700010003';
  SELECT id INTO student_4_id FROM students WHERE lrn = '135700010004';
  SELECT id INTO student_5_id FROM students WHERE lrn = '135700050001';
  SELECT id INTO student_6_id FROM students WHERE lrn = '135700050002';
  SELECT id INTO student_7_id FROM students WHERE lrn = '135700050003';

  RAISE NOTICE 'Created 8 students';

  -- ========================================
  -- PART 10: CREATE PARENT USERS
  -- ========================================
  
  -- Parent 1 - For student 1
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('parent.delacruz@gmail.com', 'Roberto dela Cruz', 'parent', school_1_id, 'parent_delacruz_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO parent_user_1;
  
  -- Parent 2 - For student 2
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('parent.santos@gmail.com', 'Carmen Santos', 'parent', school_1_id, 'parent_santos_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO parent_user_2;
  
  -- Parent 3 - For student 5
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('parent.magat@gmail.com', 'Ricardo Magat', 'parent', school_5_id, 'parent_magat_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO parent_user_3;
  
  -- Parent 4 - For student 6
  INSERT INTO users (email, name, role, school_id, firebase_uid)
  VALUES ('parent.villanueva@gmail.com', 'Elena Villanueva', 'parent', school_5_id, 'parent_villanueva_uid')
  ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id
  RETURNING id INTO parent_user_4;

  RAISE NOTICE 'Created 4 parent users';

  -- ========================================
  -- PART 11: CREATE PARENTS
  -- ========================================
  
  INSERT INTO parents (school_id, user_id, name, relationship, occupation, contact_number, email, address)
  VALUES (school_1_id, parent_user_1, 'Roberto dela Cruz', 'Father', 'Engineer', '0917-111-2222', 'parent.delacruz@gmail.com', 'Poblacion, Davao City')
  ON CONFLICT DO NOTHING
  RETURNING id INTO parent_1_id;
  
  INSERT INTO parents (school_id, user_id, name, relationship, occupation, contact_number, email, address)
  VALUES (school_1_id, parent_user_2, 'Carmen Santos', 'Mother', 'Teacher', '0918-222-3333', 'parent.santos@gmail.com', 'San Pedro, Davao City')
  ON CONFLICT DO NOTHING
  RETURNING id INTO parent_2_id;
  
  INSERT INTO parents (school_id, user_id, name, relationship, occupation, contact_number, email, address)
  VALUES (school_5_id, parent_user_3, 'Ricardo Magat', 'Father', 'Business Owner', '0919-333-4444', 'parent.magat@gmail.com', 'Apokon, Tagum City')
  ON CONFLICT DO NOTHING
  RETURNING id INTO parent_3_id;
  
  INSERT INTO parents (school_id, user_id, name, relationship, occupation, contact_number, email, address)
  VALUES (school_5_id, parent_user_4, 'Elena Villanueva', 'Mother', 'Nurse', '0920-444-5555', 'parent.villanueva@gmail.com', 'Magugpo, Tagum City')
  ON CONFLICT DO NOTHING
  RETURNING id INTO parent_4_id;

  -- Get parent IDs if they weren't returned (in case of existing records)
  IF parent_1_id IS NULL THEN
    SELECT id INTO parent_1_id FROM parents WHERE email = 'parent.delacruz@gmail.com' LIMIT 1;
  END IF;
  IF parent_2_id IS NULL THEN
    SELECT id INTO parent_2_id FROM parents WHERE email = 'parent.santos@gmail.com' LIMIT 1;
  END IF;
  IF parent_3_id IS NULL THEN
    SELECT id INTO parent_3_id FROM parents WHERE email = 'parent.magat@gmail.com' LIMIT 1;
  END IF;
  IF parent_4_id IS NULL THEN
    SELECT id INTO parent_4_id FROM parents WHERE email = 'parent.villanueva@gmail.com' LIMIT 1;
  END IF;

  RAISE NOTICE 'Created 4 parents';

  -- ========================================
  -- PART 12: LINK PARENTS TO STUDENTS
  -- ========================================
  
  -- Parent 1 (Roberto dela Cruz) -> Student 1 (Juan Carlos dela Cruz)
  IF parent_1_id IS NOT NULL AND student_1_id IS NOT NULL THEN
    INSERT INTO parent_students (parent_id, student_id, relationship, is_primary_contact)
    VALUES (parent_1_id, student_1_id, 'Father', true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Parent 2 (Carmen Santos) -> Student 2 (Maria Angela Santos)
  IF parent_2_id IS NOT NULL AND student_2_id IS NOT NULL THEN
    INSERT INTO parent_students (parent_id, student_id, relationship, is_primary_contact)
    VALUES (parent_2_id, student_2_id, 'Mother', true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Parent 3 (Ricardo Magat) -> Student 5 (Gabriel Luis Magat)
  IF parent_3_id IS NOT NULL AND student_5_id IS NOT NULL THEN
    INSERT INTO parent_students (parent_id, student_id, relationship, is_primary_contact)
    VALUES (parent_3_id, student_5_id, 'Father', true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Parent 4 (Elena Villanueva) -> Student 6 (Sofia Marie Villanueva)
  IF parent_4_id IS NOT NULL AND student_6_id IS NOT NULL THEN
    INSERT INTO parent_students (parent_id, student_id, relationship, is_primary_contact)
    VALUES (parent_4_id, student_6_id, 'Mother', true)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Linked parents to students';

  -- ========================================
  -- PART 13: CREATE DIVISION USERS FOR REGION XI
  -- ========================================
  
  -- Division Admin for Davao City
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    davao_city_division_id,
    'div.admin@davaocity.deped.gov.ph',
    'Dr. Ramon Magsaysay',
    'division_admin',
    'PLACEHOLDER_DAVAO_CITY_ADMIN_UID',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    division_id = EXCLUDED.division_id,
    name = EXCLUDED.name;
  
  -- Division Supervisor for Davao City
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    davao_city_division_id,
    'supervisor@davaocity.deped.gov.ph',
    'Mrs. Josefa Laurel',
    'division_supervisor',
    'PLACEHOLDER_DAVAO_CITY_SUPERVISOR_UID',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    division_id = EXCLUDED.division_id,
    name = EXCLUDED.name;
  
  -- PSDS for Davao City North District
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, assigned_district_id, is_active)
  VALUES (
    davao_city_division_id,
    'psds.north@davaocity.deped.gov.ph',
    'Dr. Elena Maglasang',
    'psds',
    'PLACEHOLDER_DAVAO_CITY_PSDS_NORTH_UID',
    dc_north_district_id,
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    division_id = EXCLUDED.division_id,
    assigned_district_id = EXCLUDED.assigned_district_id;
  
  -- Division Admin for Davao del Norte
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    davao_norte_division_id,
    'div.admin@davaonorte.deped.gov.ph',
    'Dr. Sergio Osmena III',
    'division_admin',
    'PLACEHOLDER_DAVAO_NORTE_ADMIN_UID',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    division_id = EXCLUDED.division_id,
    name = EXCLUDED.name;
  
  -- Division Data Manager for Davao del Norte
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    davao_norte_division_id,
    'data.manager@davaonorte.deped.gov.ph',
    'Mr. Carlos Garcia Jr.',
    'division_data_manager',
    'PLACEHOLDER_DAVAO_NORTE_DATA_MANAGER_UID',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    division_id = EXCLUDED.division_id,
    name = EXCLUDED.name;

  RAISE NOTICE 'Created 5 division users for Region XI';

  -- ========================================
  -- SUMMARY
  -- ========================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REGION XI SEEDING COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Divisions: 6 (Davao City, del Norte, del Sur, Oriental, de Oro, Occidental)';
  RAISE NOTICE 'Districts: 8 (5 in Davao City, 3 in Davao del Norte)';
  RAISE NOTICE 'Schools: 8 (4 in Davao City, 4 in Davao del Norte)';
  RAISE NOTICE 'Teachers: 8';
  RAISE NOTICE 'Sections: 8';
  RAISE NOTICE 'Students: 8';
  RAISE NOTICE 'Parents: 4';
  RAISE NOTICE 'Division Users: 5';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create Firebase Auth accounts for division users';
  RAISE NOTICE '2. Update firebase_uid in division_users table with real UIDs';
  RAISE NOTICE '3. Test division login at /division';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run separately after the seed)
-- ============================================================================

-- Check divisions
-- SELECT id, code, name, region FROM divisions WHERE region ILIKE '%XI%' ORDER BY name;

-- Check districts
-- SELECT d.name as district, div.name as division 
-- FROM districts d 
-- JOIN divisions div ON d.division_id = div.id 
-- WHERE div.region ILIKE '%XI%' 
-- ORDER BY div.name, d.name;

-- Check schools
-- SELECT s.name, s.school_id_number, d.name as district, div.name as division
-- FROM schools s
-- LEFT JOIN districts d ON s.district_id = d.id
-- LEFT JOIN divisions div ON s.division_id = div.id
-- WHERE div.region ILIKE '%XI%'
-- ORDER BY div.name, s.name;

-- Check student counts per school
-- SELECT s.name, COUNT(st.id) as student_count
-- FROM schools s
-- LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
-- LEFT JOIN divisions div ON s.division_id = div.id
-- WHERE div.region ILIKE '%XI%'
-- GROUP BY s.id, s.name
-- ORDER BY s.name;

-- Check division users
-- SELECT du.email, du.name, du.role, d.name as division
-- FROM division_users du
-- JOIN divisions d ON du.division_id = d.id
-- WHERE d.region ILIKE '%XI%'
-- ORDER BY d.name, du.role;
