-- ============================================================================
-- Seed Zamboanga City Districts and Schools
-- Run this SQL in Supabase Dashboard SQL Editor
-- ============================================================================

-- Division ID for Zamboanga City
-- Get from: SELECT id FROM divisions WHERE name ILIKE '%zamboanga%';
-- Using the ID from the previous seeding: 00e59346-6eb1-4184-8215-d8f05118987e

DO $$
DECLARE
  zamboanga_division_id UUID := '00e59346-6eb1-4184-8215-d8f05118987e';
  west_district_id UUID;
  east_district_id UUID;
  north_district_id UUID;
  south_district_id UUID;
  central_district_id UUID;
BEGIN
  -- ========================================
  -- INSERT DISTRICTS
  -- ========================================
  
  -- West District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    zamboanga_division_id,
    'ZC-WEST',
    'Zamboanga City West District',
    'Dr. Esperanza Santos',
    '0917-123-4567',
    ARRAY['Canelar', 'Sta. Maria', 'San Jose Cawa-Cawa', 'Rio Hondo']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    psds_contact = EXCLUDED.psds_contact,
    barangays = EXCLUDED.barangays
  RETURNING id INTO west_district_id;
  
  -- East District  
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    zamboanga_division_id,
    'ZC-EAST',
    'Zamboanga City East District',
    'Dr. Ricardo Maglasang',
    '0918-234-5678',
    ARRAY['Tetuan', 'Divisoria', 'Tumaga', 'Pasonanca']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    psds_contact = EXCLUDED.psds_contact,
    barangays = EXCLUDED.barangays
  RETURNING id INTO east_district_id;
  
  -- North District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    zamboanga_division_id,
    'ZC-NORTH',
    'Zamboanga City North District',
    'Dr. Maria Luz Gonzales',
    '0919-345-6789',
    ARRAY['Culianan', 'Sinunuc', 'Limpapa', 'Mercedes']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    psds_contact = EXCLUDED.psds_contact,
    barangays = EXCLUDED.barangays
  RETURNING id INTO north_district_id;
  
  -- South District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    zamboanga_division_id,
    'ZC-SOUTH',
    'Zamboanga City South District',
    'Dr. Fernando Reyes',
    '0920-456-7890',
    ARRAY['Ayala', 'San Roque', 'Taluksangay', 'Sta. Catalina']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    psds_contact = EXCLUDED.psds_contact,
    barangays = EXCLUDED.barangays
  RETURNING id INTO south_district_id;
  
  -- Central District
  INSERT INTO districts (division_id, code, name, psds_name, psds_contact, barangays, is_active)
  VALUES (
    zamboanga_division_id,
    'ZC-CENTRAL',
    'Zamboanga City Central District',
    'Dr. Josephine dela Cruz',
    '0921-567-8901',
    ARRAY['Zone I', 'Zone II', 'Zone III', 'Zone IV']
  , true)
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    psds_name = EXCLUDED.psds_name,
    psds_contact = EXCLUDED.psds_contact,
    barangays = EXCLUDED.barangays
  RETURNING id INTO central_district_id;
  
  RAISE NOTICE 'Districts inserted successfully!';
  RAISE NOTICE 'West: %, East: %, North: %, South: %, Central: %', 
    west_district_id, east_district_id, north_district_id, south_district_id, central_district_id;

  -- ========================================
  -- INSERT SCHOOLS (linked to districts)
  -- Required: name, school_id_number, division, region, current_school_year
  -- ========================================
  
  -- Zamboanga City National High School (West District)
  INSERT INTO schools (name, school_id_number, division, region, current_school_year, division_id, district_id, address, principal_name)
  VALUES (
    'Zamboanga City National High School',
    '317267',
    'Division of Zamboanga City',
    'Region IX - Zamboanga Peninsula',
    '2024-2025',
    zamboanga_division_id,
    west_district_id,
    'Gov. Camins Ave., Sta. Maria, Zamboanga City',
    'Dr. Juan Carlos M. Reyes'
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    division = EXCLUDED.division,
    region = EXCLUDED.region,
    current_school_year = EXCLUDED.current_school_year,
    division_id = EXCLUDED.division_id,
    district_id = EXCLUDED.district_id,
    address = EXCLUDED.address,
    principal_name = EXCLUDED.principal_name;
  
  -- Zamboanga City Central Elementary School (Central District)
  INSERT INTO schools (name, school_id_number, division, region, current_school_year, division_id, district_id, address, principal_name)
  VALUES (
    'Zamboanga City Central Elementary School',
    '317001',
    'Division of Zamboanga City',
    'Region IX - Zamboanga Peninsula',
    '2024-2025',
    zamboanga_division_id,
    central_district_id,
    'Pilar St., Zone II, Zamboanga City',
    'Mrs. Rosalinda Santos'
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    division = EXCLUDED.division,
    region = EXCLUDED.region,
    current_school_year = EXCLUDED.current_school_year,
    division_id = EXCLUDED.division_id,
    district_id = EXCLUDED.district_id,
    address = EXCLUDED.address,
    principal_name = EXCLUDED.principal_name;
  
  -- Tetuan Central School (East District)
  INSERT INTO schools (name, school_id_number, division, region, current_school_year, division_id, district_id, address, principal_name)
  VALUES (
    'Tetuan Central School',
    '317045',
    'Division of Zamboanga City',
    'Region IX - Zamboanga Peninsula',
    '2024-2025',
    zamboanga_division_id,
    east_district_id,
    'Tetuan Road, Tetuan, Zamboanga City',
    'Mr. Roberto Hernandez'
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    division = EXCLUDED.division,
    region = EXCLUDED.region,
    current_school_year = EXCLUDED.current_school_year,
    division_id = EXCLUDED.division_id,
    district_id = EXCLUDED.district_id,
    address = EXCLUDED.address,
    principal_name = EXCLUDED.principal_name;
  
  -- Sta. Maria Elementary School (North District)
  INSERT INTO schools (name, school_id_number, division, region, current_school_year, division_id, district_id, address, principal_name)
  VALUES (
    'Sta. Maria Elementary School',
    '317089',
    'Division of Zamboanga City',
    'Region IX - Zamboanga Peninsula',
    '2024-2025',
    zamboanga_division_id,
    north_district_id,
    'Sta. Maria Road, Zamboanga City',
    'Mrs. Elena Garcia'
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    division = EXCLUDED.division,
    region = EXCLUDED.region,
    current_school_year = EXCLUDED.current_school_year,
    division_id = EXCLUDED.division_id,
    district_id = EXCLUDED.district_id,
    address = EXCLUDED.address,
    principal_name = EXCLUDED.principal_name;
  
  -- Ayala National High School (South District)
  INSERT INTO schools (name, school_id_number, division, region, current_school_year, division_id, district_id, address, principal_name)
  VALUES (
    'Ayala National High School',
    '317112',
    'Division of Zamboanga City',
    'Region IX - Zamboanga Peninsula',
    '2024-2025',
    zamboanga_division_id,
    south_district_id,
    'Ayala Road, Ayala, Zamboanga City',
    'Dr. Antonio Martinez'
  )
  ON CONFLICT (school_id_number) DO UPDATE SET
    name = EXCLUDED.name,
    division = EXCLUDED.division,
    region = EXCLUDED.region,
    current_school_year = EXCLUDED.current_school_year,
    division_id = EXCLUDED.division_id,
    district_id = EXCLUDED.district_id,
    address = EXCLUDED.address,
    principal_name = EXCLUDED.principal_name;
  
  RAISE NOTICE 'Schools inserted and linked to districts!';

END $$;

-- ========================================
-- Verify Districts
-- ========================================
SELECT id, code, name, psds_name FROM districts WHERE division_id = '00e59346-6eb1-4184-8215-d8f05118987e';

-- ========================================
-- Verify Schools with District Links
-- ========================================
SELECT 
  s.name AS school_name,
  s.school_id_number,
  d.name AS district_name,
  s.principal_name
FROM schools s
LEFT JOIN districts d ON s.district_id = d.id
WHERE s.division_id = '00e59346-6eb1-4184-8215-d8f05118987e'
ORDER BY d.name, s.name;
