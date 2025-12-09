-- ============================================================================
-- MATI CITY DIVISION SF7 SECONDARY SCHOOLS SEED
-- Source: DepEd Division of City of Mati SF7 Masterlist (Secondary.csv)
-- + By_Sch_Educ_Lvl_enrolment_report-10.xls for School IDs
-- 
-- Total: 18 Secondary Schools (National High Schools)
-- Note: Integrated Schools already seeded with Elementary
-- ============================================================================

DO $$
DECLARE
  v_division_mati_id UUID;
  v_district_central_id UUID;
  v_district_north_id UUID;
  v_district_south_id UUID;
BEGIN
  RAISE NOTICE 'Starting SF7 Secondary Schools seeding for Division of City of Mati...';

  -- =====================================================
  -- STEP 1: Get Division ID
  -- =====================================================
  SELECT id INTO v_division_mati_id FROM divisions 
  WHERE name ILIKE '%Mati%' OR code ILIKE '%MATI%'
  LIMIT 1;
  
  IF v_division_mati_id IS NULL THEN
    RAISE EXCEPTION 'Division of City of Mati not found!';
  END IF;
  RAISE NOTICE 'Found Division: %', v_division_mati_id;

  -- =====================================================
  -- STEP 2: Get District IDs
  -- =====================================================
  SELECT id INTO v_district_central_id FROM districts 
  WHERE (name ILIKE '%Mati Central%' OR code ILIKE '%CENTRAL%') 
    AND division_id = v_division_mati_id
  LIMIT 1;
  
  SELECT id INTO v_district_north_id FROM districts 
  WHERE (name ILIKE '%Mati North%' OR code ILIKE '%NORTH%') 
    AND division_id = v_division_mati_id
  LIMIT 1;
  
  SELECT id INTO v_district_south_id FROM districts 
  WHERE (name ILIKE '%Mati South%' OR code ILIKE '%SOUTH%') 
    AND division_id = v_division_mati_id
  LIMIT 1;

  RAISE NOTICE 'Districts - Central: %, North: %, South: %', 
    v_district_central_id, v_district_north_id, v_district_south_id;

  -- =====================================================
  -- STEP 3: Delete existing secondary schools (if any)
  -- =====================================================
  RAISE NOTICE 'Cleaning up existing secondary schools...';
  
  DELETE FROM schools WHERE school_id_number IN (
    '304303', '304305', '304313', '304314', '304318', '304325', '304326', '304327',
    '304328', '304338', '305680', '306039', '316104', '325101', '325102', '325104',
    '325105', '325106'
  );

  -- =====================================================
  -- STEP 4: Insert Secondary Schools - MATI CENTRAL
  -- =====================================================
  RAISE NOTICE 'Inserting Mati Central secondary schools...';

  INSERT INTO schools (id, school_id_number, name, address, district, division, region, current_school_year, division_id, district_id, created_at, updated_at)
  VALUES
    -- Mati Central Secondary Schools
    (gen_random_uuid(), '325104', 'Badas National High School', 'Badas, City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '305680', 'City of Mati National High School', 'Poblacion, City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '304328', 'Davao Oriental Regional Science High School', 'Dahican, City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '304325', 'Mati National Comprehensive High School', 'Sainz, City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '304326', 'Mati School of Arts and Trades', 'Matiao, City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW());

  RAISE NOTICE 'Inserted 5 Mati Central secondary schools';

  -- =====================================================
  -- STEP 5: Insert Secondary Schools - MATI NORTH
  -- =====================================================
  RAISE NOTICE 'Inserting Mati North secondary schools...';

  INSERT INTO schools (id, school_id_number, name, address, district, division, region, current_school_year, division_id, district_id, created_at, updated_at)
  VALUES
    -- Mati North Secondary Schools
    (gen_random_uuid(), '304303', 'Bobon National High School', 'Bobon, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '304305', 'Buso National High School', 'Buso, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '304314', 'Don Enrique Lopez National High School', 'Libudon, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '316104', 'Don Salvador Lopez National High School', 'Langka, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '325101', 'Doña Rosa Garcia Rabat Memorial National High School', 'Dahican, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '325102', 'Lawigan National High School', 'Lawigan, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '304318', 'Libudon National High School', 'Libudon, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '304327', 'Matiao National High School', 'Matiao, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '325106', 'Mayo National High School', 'Mayo, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '304338', 'Taguibo Agricultural Vocational High School', 'Taguibo, City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW());

  RAISE NOTICE 'Inserted 10 Mati North secondary schools';

  -- =====================================================
  -- STEP 6: Insert Secondary Schools - MATI SOUTH
  -- =====================================================
  RAISE NOTICE 'Inserting Mati South secondary schools...';

  INSERT INTO schools (id, school_id_number, name, address, district, division, region, current_school_year, division_id, district_id, created_at, updated_at)
  VALUES
    -- Mati South Secondary Schools
    (gen_random_uuid(), '304313', 'Dawan National High School', 'Dawan, City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '325105', 'Macambol National High School', 'Macambol, City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '306039', 'Sanghay National High School', 'Sanghay, City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW());

  RAISE NOTICE 'Inserted 3 Mati South secondary schools';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECONDARY SCHOOLS SEEDING COMPLETE!';
  RAISE NOTICE 'Mati Central: 5 schools';
  RAISE NOTICE 'Mati North: 10 schools';
  RAISE NOTICE 'Mati South: 3 schools';
  RAISE NOTICE 'Total: 18 Secondary Schools';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Integrated Schools (Cabuaya IS, Culian IS, Lanca IS,';
  RAISE NOTICE 'Licop IS, Luban IS) already exist from Elementary seeding.';

END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- All secondary schools
SELECT school_id_number, name, district 
FROM schools 
WHERE division = 'Division of City of Mati' 
  AND (name ILIKE '%NHS%' OR name ILIKE '%National High%' OR name ILIKE '%Arts%' OR name ILIKE '%Voc%' OR name ILIKE '%Science High%' OR name ILIKE '%Comprehensive%')
ORDER BY district, school_id_number;

-- Count by district
SELECT district, COUNT(*) as secondary_schools
FROM schools 
WHERE division = 'Division of City of Mati' 
  AND (name ILIKE '%NHS%' OR name ILIKE '%National High%' OR name ILIKE '%Arts%' OR name ILIKE '%Voc%' OR name ILIKE '%Science High%' OR name ILIKE '%Comprehensive%')
GROUP BY district
ORDER BY district;

-- Total school count (Elementary + Secondary + Integrated)
SELECT 
  CASE 
    WHEN name ILIKE '%NHS%' OR name ILIKE '%National High%' OR name ILIKE '%Arts%' OR name ILIKE '%Voc%' OR name ILIKE '%Science High%' OR name ILIKE '%Comprehensive%' THEN 'Secondary'
    WHEN name ILIKE '%Integrated%' OR name ILIKE '% IS' THEN 'Integrated'
    ELSE 'Elementary'
  END as school_type,
  COUNT(*) as count
FROM schools 
WHERE division = 'Division of City of Mati'
GROUP BY school_type
ORDER BY school_type;
