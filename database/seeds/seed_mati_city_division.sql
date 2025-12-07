-- ============================================================================
-- Seed Division of City of Mati - Complete Dataset
-- Run this SQL in Supabase Dashboard SQL Editor
-- ============================================================================
-- Division of City of Mati covers all schools in Mati City, Davao Oriental
-- Total Schools: 72 (including elementary and secondary schools)
-- Barangays: 26
-- ============================================================================

DO $$
DECLARE
  -- Division and District IDs
  mati_division_id UUID;
  mati_central_district_id UUID;
  mati_north_district_id UUID;
  mati_south_district_id UUID;
  mati_east_district_id UUID;
  
  -- Counter for loops
  i INT;
  j INT;
  
  -- School IDs (will store dynamically)
  current_school_id UUID;
  
  -- Arrays to store barangays per district
  central_barangays TEXT[] := ARRAY['Central', 'Sainz', 'Matiao', 'Dahican'];
  north_barangays TEXT[] := ARRAY['Badas', 'Bobon', 'Dawan', 'Don Enrique Lopez', 'Don Martin Marundan', 'Lawigan', 'Macambol'];
  south_barangays TEXT[] := ARRAY['Buso', 'Tamisan', 'Taguibo', 'Tagabakid', 'Tagbinonga', 'Mayo'];
  east_barangays TEXT[] := ARRAY['Cabuaya', 'Culian', 'Danao', 'Don Salvador Lopez Sr', 'Langka', 'Libudon', 'Luban', 'Mamali', 'Sanghay'];
  
  -- Sample names for variety
  school_types TEXT[] := ARRAY['Elementary School', 'National High School', 'Integrated School'];
  teacher_firstnames TEXT[] := ARRAY['Maria', 'Juan', 'Ana', 'Pedro', 'Rosa', 'Jose', 'Carmen', 'Luis', 'Teresa', 'Miguel', 
    'Elena', 'Carlos', 'Sofia', 'Ricardo', 'Isabella', 'Fernando', 'Gabriela', 'Antonio', 'Lucia', 'Manuel'];
  teacher_lastnames TEXT[] := ARRAY['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Gonzales', 'Rodriguez', 'Flores', 
    'Martinez', 'Torres', 'Rivera', 'Ramos', 'Mendoza', 'Castillo', 'Morales', 'Aquino', 'Valdez', 'Santiago', 'Pascual', 'Mercado'];
  student_firstnames TEXT[] := ARRAY['John', 'Mary', 'Mark', 'Sarah', 'James', 'Angela', 'Robert', 'Patricia', 'Michael', 'Linda',
    'David', 'Barbara', 'William', 'Elizabeth', 'Richard', 'Jennifer', 'Joseph', 'Susan', 'Thomas', 'Jessica'];
  
BEGIN
  -- ========================================
  -- PART 1: CREATE DIVISION OF MATI CITY
  -- ========================================
  
  INSERT INTO divisions (code, name, region, region_code, address, city, province, 
    contact_email, contact_phone, superintendent_name, asst_superintendent_name, is_active)
  VALUES (
    'DIV-MATI-CITY',
    'Division of City of Mati',
    'Region XI - Davao Region',
    'REG-XI',
    'Provincial Capitol Complex, Mati City',
    'Mati City',
    'Davao Oriental',
    'mati.city@deped.gov.ph',
    '(087) 811-5000',
    'Dr. Amelia R. Gutierrez',
    'Dr. Carlos M. Villanueva',
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    region_code = EXCLUDED.region_code,
    superintendent_name = EXCLUDED.superintendent_name
  RETURNING id INTO mati_division_id;

  RAISE NOTICE 'Created Division of City of Mati: %', mati_division_id;

  -- ========================================
  -- PART 2: CREATE DISTRICTS
  -- ========================================
  
  -- Mati Central District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    mati_division_id,
    'MATI-CENTRAL',
    'Mati Central District',
    'Dr. Roberto P. Salazar',
    '0917-811-0001',
    central_barangays,
    true
  )
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    barangays = EXCLUDED.barangays
  RETURNING id INTO mati_central_district_id;
  
  -- Mati North District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    mati_division_id,
    'MATI-NORTH',
    'Mati North District',
    'Dr. Marissa L. Aquino',
    '0918-811-0002',
    north_barangays,
    true
  )
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    barangays = EXCLUDED.barangays
  RETURNING id INTO mati_north_district_id;
  
  -- Mati South District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    mati_division_id,
    'MATI-SOUTH',
    'Mati South District',
    'Dr. Ferdinand T. Reyes',
    '0919-811-0003',
    south_barangays,
    true
  )
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    barangays = EXCLUDED.barangays
  RETURNING id INTO mati_south_district_id;
  
  -- Mati East District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    mati_division_id,
    'MATI-EAST',
    'Mati East District',
    'Dr. Lourdes C. Magpantay',
    '0920-811-0004',
    east_barangays,
    true
  )
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    barangays = EXCLUDED.barangays
  RETURNING id INTO mati_east_district_id;

  RAISE NOTICE 'Created 4 districts for Mati City';

  -- ========================================
  -- PART 3: CREATE 72 SCHOOLS
  -- ========================================
  
  -- Central District Schools (18 schools)
  INSERT INTO schools (name, school_id_number, address, district_id, division_id, principal_name, division, region, current_school_year)
  VALUES
    ('Mati City National High School', '500101', 'Central, Mati City', mati_central_district_id, mati_division_id, 'Dr. Juan P. dela Cruz', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Central Elementary School', '500102', 'Poblacion, Central, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Maria S. Santos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mati Pilot Elementary School', '500103', 'Central, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Rosa T. Garcia', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mati Community College Integrated School', '500104', 'Central, Mati City', mati_central_district_id, mati_division_id, 'Dr. Carlos M. Reyes', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Sainz Elementary School', '500105', 'Sainz, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Ana L. Cruz', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Sainz National High School', '500106', 'Sainz, Mati City', mati_central_district_id, mati_division_id, 'Mr. Pedro R. Bautista', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Matiao Elementary School', '500107', 'Matiao, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Teresa M. Gonzales', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Matiao National High School', '500108', 'Matiao, Mati City', mati_central_district_id, mati_division_id, 'Mr. Luis F. Rodriguez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Matiao Integrated School', '500109', 'Matiao, Mati City', mati_central_district_id, mati_division_id, 'Dr. Carmen P. Flores', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Dahican Elementary School', '500110', 'Dahican, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Elena R. Martinez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Dahican National High School', '500111', 'Dahican, Mati City', mati_central_district_id, mati_division_id, 'Mr. Jose T. Torres', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Dahican Coastal Elementary School', '500112', 'Dahican Beach Area, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Sofia L. Rivera', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Sergio Osmena Sr. National High School', '500113', 'Central, Mati City', mati_central_district_id, mati_division_id, 'Dr. Miguel A. Ramos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mati City Science High School', '500114', 'Sainz, Mati City', mati_central_district_id, mati_division_id, 'Dr. Isabella C. Mendoza', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Pujada Bay Elementary School', '500115', 'Sainz, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Gabriela M. Castillo', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Matiao Annex Elementary School', '500116', 'Matiao Proper, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Lucia P. Morales', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Sainz Annex Elementary School', '500117', 'Upper Sainz, Mati City', mati_central_district_id, mati_division_id, 'Mr. Ricardo F. Aquino', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Central Annex High School', '500118', 'Zone 3, Central, Mati City', mati_central_district_id, mati_division_id, 'Mrs. Patricia S. Valdez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025')
  ON CONFLICT (school_id_number) DO UPDATE SET name = EXCLUDED.name, district_id = EXCLUDED.district_id;

  -- North District Schools (21 schools)
  INSERT INTO schools (name, school_id_number, address, district_id, division_id, principal_name, division, region, current_school_year)
  VALUES
    ('Badas Elementary School', '500201', 'Badas, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Jennifer L. Santiago', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Badas National High School', '500202', 'Badas, Mati City', mati_north_district_id, mati_division_id, 'Mr. Fernando R. Pascual', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Badas Coastal Elementary School', '500203', 'Badas Shoreline, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Susan M. Mercado', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Bobon Elementary School', '500204', 'Bobon, Mati City', mati_north_district_id, mati_division_id, 'Mr. Antonio T. Villanueva', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Bobon National High School', '500205', 'Bobon, Mati City', mati_north_district_id, mati_division_id, 'Dr. Manuel C. Lopez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Bobon Integrated School', '500206', 'Bobon Proper, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Elizabeth P. Diaz', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Dawan Elementary School', '500207', 'Dawan, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Barbara S. Navarro', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Dawan National High School', '500208', 'Dawan, Mati City', mati_north_district_id, mati_division_id, 'Mr. Thomas R. Salazar', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Enrique Lopez Elementary School', '500209', 'Don Enrique Lopez, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Jessica M. Ramos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Enrique Lopez National High School', '500210', 'Don Enrique Lopez, Mati City', mati_north_district_id, mati_division_id, 'Dr. Christopher L. Santos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Martin Marundan Elementary School', '500211', 'Don Martin Marundan, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Nancy T. Garcia', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Martin Marundan National High School', '500212', 'Don Martin Marundan, Mati City', mati_north_district_id, mati_division_id, 'Mr. Daniel F. Cruz', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Lawigan Elementary School', '500213', 'Lawigan, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Sandra P. Bautista', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Lawigan National High School', '500214', 'Lawigan, Mati City', mati_north_district_id, mati_division_id, 'Mr. Paul R. Gonzales', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Macambol Elementary School', '500215', 'Macambol, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Karen M. Rodriguez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Macambol National High School', '500216', 'Macambol, Mati City', mati_north_district_id, mati_division_id, 'Dr. Steven T. Flores', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Macambol Integrated School', '500217', 'Macambol Proper, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Michelle L. Martinez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Badas Annex Elementary School', '500218', 'Upper Badas, Mati City', mati_north_district_id, mati_division_id, 'Mr. Kenneth C. Torres', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Dawan Coastal Elementary School', '500219', 'Dawan Shoreline, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Lisa P. Rivera', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Enrique Lopez Annex School', '500220', 'Lower Don Enrique Lopez, Mati City', mati_north_district_id, mati_division_id, 'Mr. Brian S. Ramos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Lawigan Annex Elementary School', '500221', 'Lawigan Sitio 1, Mati City', mati_north_district_id, mati_division_id, 'Mrs. Angela R. Mendoza', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025')
  ON CONFLICT (school_id_number) DO UPDATE SET name = EXCLUDED.name, district_id = EXCLUDED.district_id;

  -- South District Schools (18 schools)
  INSERT INTO schools (name, school_id_number, address, district_id, division_id, principal_name, division, region, current_school_year)
  VALUES
    ('Buso Elementary School', '500301', 'Buso, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Nicole M. Castillo', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Buso National High School', '500302', 'Buso, Mati City', mati_south_district_id, mati_division_id, 'Mr. Jason T. Morales', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Buso Integrated School', '500303', 'Buso Proper, Mati City', mati_south_district_id, mati_division_id, 'Dr. Dorothy L. Aquino', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tamisan Elementary School', '500304', 'Tamisan, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Sharon P. Valdez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tamisan National High School', '500305', 'Tamisan, Mati City', mati_south_district_id, mati_division_id, 'Mr. Timothy R. Santiago', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tamisan Annex Elementary School', '500306', 'Lower Tamisan, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Cynthia M. Pascual', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Taguibo Elementary School', '500307', 'Taguibo, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Kathleen S. Mercado', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Taguibo National High School', '500308', 'Taguibo, Mati City', mati_south_district_id, mati_division_id, 'Mr. Gregory T. Villanueva', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tagabakid Elementary School', '500309', 'Tagabakid, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Deborah L. Lopez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tagabakid National High School', '500310', 'Tagabakid, Mati City', mati_south_district_id, mati_division_id, 'Dr. Ronald P. Diaz', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tagbinonga Elementary School', '500311', 'Tagbinonga, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Laura M. Navarro', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tagbinonga National High School', '500312', 'Tagbinonga, Mati City', mati_south_district_id, mati_division_id, 'Mr. Kevin R. Salazar', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mayo Elementary School', '500313', 'Mayo, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Amy S. Ramos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mayo National High School', '500314', 'Mayo, Mati City', mati_south_district_id, mati_division_id, 'Mr. Jeffrey T. Santos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mayo Bay Elementary School', '500315', 'Mayo Bay Area, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Shirley L. Garcia', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Buso Annex Elementary School', '500316', 'Upper Buso, Mati City', mati_south_district_id, mati_division_id, 'Mr. Gary P. Cruz', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Tamisan Integrated School', '500317', 'Tamisan Central, Mati City', mati_south_district_id, mati_division_id, 'Dr. Carolyn M. Bautista', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mayo Coastal Elementary School', '500318', 'Mayo Shoreline, Mati City', mati_south_district_id, mati_division_id, 'Mrs. Diana R. Gonzales', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025')
  ON CONFLICT (school_id_number) DO UPDATE SET name = EXCLUDED.name, district_id = EXCLUDED.district_id;

  -- East District Schools (15 schools)
  INSERT INTO schools (name, school_id_number, address, district_id, division_id, principal_name, division, region, current_school_year)
  VALUES
    ('Cabuaya Elementary School', '500401', 'Cabuaya, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Virginia T. Rodriguez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Cabuaya National High School', '500402', 'Cabuaya, Mati City', mati_east_district_id, mati_division_id, 'Mr. Harold L. Flores', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Culian Elementary School', '500403', 'Culian, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Theresa P. Martinez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Culian National High School', '500404', 'Culian, Mati City', mati_east_district_id, mati_division_id, 'Dr. Arthur M. Torres', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Danao Elementary School', '500405', 'Danao, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Pamela S. Rivera', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Salvador Lopez Sr. Elementary School', '500406', 'Don Salvador Lopez Sr., Mati City', mati_east_district_id, mati_division_id, 'Mrs. Martha R. Ramos', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Don Salvador Lopez Sr. National High School', '500407', 'Don Salvador Lopez Sr., Mati City', mati_east_district_id, mati_division_id, 'Mr. Roy T. Mendoza', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Langka Elementary School', '500408', 'Langka, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Joyce L. Castillo', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Libudon Elementary School', '500409', 'Libudon, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Evelyn P. Morales', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Libudon National High School', '500410', 'Libudon, Mati City', mati_east_district_id, mati_division_id, 'Mr. Albert M. Aquino', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Luban Elementary School', '500411', 'Luban, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Frances S. Valdez', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mamali Elementary School', '500412', 'Mamali, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Gloria T. Santiago', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Mamali National High School', '500413', 'Mamali, Mati City', mati_east_district_id, mati_division_id, 'Mr. Dennis L. Pascual', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Sanghay Elementary School', '500414', 'Sanghay, Mati City', mati_east_district_id, mati_division_id, 'Mrs. Catherine P. Mercado', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025'),
    ('Sanghay National High School', '500415', 'Sanghay, Mati City', mati_east_district_id, mati_division_id, 'Mr. Ralph M. Villanueva', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025')
  ON CONFLICT (school_id_number) DO UPDATE SET name = EXCLUDED.name, district_id = EXCLUDED.district_id;

  RAISE NOTICE 'Created 72 schools for Division of City of Mati';

  -- ========================================
  -- PART 4: CREATE DIVISION USERS
  -- ========================================
  
  -- Division Administrator
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    mati_division_id,
    'div.admin@mati.deped.gov.ph',
    'Dr. Amelia R. Gutierrez',
    'division_admin',
    'PLACEHOLDER_MATI_ADMIN_UID',
    true
  );
  
  -- Division Supervisor
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    mati_division_id,
    'supervisor@mati.deped.gov.ph',
    'Dr. Carlos M. Villanueva',
    'division_supervisor',
    'PLACEHOLDER_MATI_SUPERVISOR_UID',
    true
  );
  
  -- PSDS for Central District
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, assigned_district_id, is_active)
  VALUES (
    mati_division_id,
    'psds.central@mati.deped.gov.ph',
    'Dr. Roberto P. Salazar',
    'psds',
    'PLACEHOLDER_MATI_PSDS_CENTRAL_UID',
    mati_central_district_id,
    true
  );
  
  -- PSDS for North District
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, assigned_district_id, is_active)
  VALUES (
    mati_division_id,
    'psds.north@mati.deped.gov.ph',
    'Dr. Marissa L. Aquino',
    'psds',
    'PLACEHOLDER_MATI_PSDS_NORTH_UID',
    mati_north_district_id,
    true
  );
  
  -- PSDS for South District
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, assigned_district_id, is_active)
  VALUES (
    mati_division_id,
    'psds.south@mati.deped.gov.ph',
    'Dr. Ferdinand T. Reyes',
    'psds',
    'PLACEHOLDER_MATI_PSDS_SOUTH_UID',
    mati_south_district_id,
    true
  );
  
  -- PSDS for East District
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, assigned_district_id, is_active)
  VALUES (
    mati_division_id,
    'psds.east@mati.deped.gov.ph',
    'Dr. Lourdes C. Magpantay',
    'psds',
    'PLACEHOLDER_MATI_PSDS_EAST_UID',
    mati_east_district_id,
    true
  );
  
  -- Division Data Manager
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    mati_division_id,
    'data.manager@mati.deped.gov.ph',
    'Mrs. Regina T. Santos',
    'division_data_manager',
    'PLACEHOLDER_MATI_DATA_MANAGER_UID',
    true
  );
  
  -- EPS for Mathematics
  INSERT INTO division_users (division_id, email, name, role, firebase_uid, is_active)
  VALUES (
    mati_division_id,
    'eps.math@mati.deped.gov.ph',
    'Dr. Jonathan P. Reyes',
    'eps',
    'PLACEHOLDER_MATI_EPS_MATH_UID',
    true
  );

  RAISE NOTICE 'Created 8 division users for Mati City';

  -- ========================================
  -- SUMMARY
  -- ========================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIVISION OF CITY OF MATI SEEDING COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Division: 1 (Division of City of Mati)';
  RAISE NOTICE 'Districts: 4 (Central, North, South, East)';
  RAISE NOTICE 'Schools: 72';
  RAISE NOTICE '  - Central District: 18 schools';
  RAISE NOTICE '  - North District: 21 schools';
  RAISE NOTICE '  - South District: 18 schools';
  RAISE NOTICE '  - East District: 15 schools';
  RAISE NOTICE 'Division Users: 8';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create Firebase Auth accounts for division users';
  RAISE NOTICE '2. Update firebase_uid in division_users table with real UIDs';
  RAISE NOTICE '3. Optionally seed teachers, students, and parents for schools';
  RAISE NOTICE '4. Test division login at /division';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run separately after the seed)
-- ============================================================================

-- Check division
-- SELECT id, code, name, region, superintendent_name FROM divisions WHERE code = 'DIV-MATI-CITY';

-- Check districts
-- SELECT d.name as district, d.code, d.psds_name, array_length(d.barangays, 1) as barangay_count
-- FROM districts d 
-- JOIN divisions div ON d.division_id = div.id 
-- WHERE div.code = 'DIV-MATI-CITY' 
-- ORDER BY d.name;

-- Check schools per district
-- SELECT d.name as district, COUNT(s.id) as school_count
-- FROM districts d
-- JOIN divisions div ON d.division_id = div.id
-- LEFT JOIN schools s ON s.district_id = d.id
-- WHERE div.code = 'DIV-MATI-CITY'
-- GROUP BY d.id, d.name
-- ORDER BY d.name;

-- Check all schools
-- SELECT s.name, s.school_id_number, d.name as district, s.principal_name
-- FROM schools s
-- LEFT JOIN districts d ON s.district_id = d.id
-- LEFT JOIN divisions div ON s.division_id = div.id
-- WHERE div.code = 'DIV-MATI-CITY'
-- ORDER BY d.name, s.name;

-- Check division users
-- SELECT du.email, du.name, du.role, d.name as division, dist.name as assigned_district
-- FROM division_users du
-- JOIN divisions d ON du.division_id = d.id
-- LEFT JOIN districts dist ON du.assigned_district_id = dist.id
-- WHERE d.code = 'DIV-MATI-CITY'
-- ORDER BY du.role, du.name;
