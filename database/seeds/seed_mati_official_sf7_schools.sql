-- ============================================================================
-- MATI CITY DIVISION OFFICIAL SF7 SCHOOLS - COMPREHENSIVE SEED
-- Source: DepEd Division of City of Mati SF7 Masterlist (elementary.csv)
-- Generated: December 9, 2025
-- 
-- This script:
--   1. Uses EXISTING division and districts from your database
--   2. Inserts schools with proper division_id and district_id foreign keys
-- ============================================================================

DO $$
DECLARE
  v_division_mati_id UUID;
  v_district_central_id UUID;
  v_district_north_id UUID;
  v_district_south_id UUID;
BEGIN
  RAISE NOTICE '🌱 Starting Division of City of Mati schools seeding...';

  -- =====================================================
  -- STEP 1: Get existing Division and Districts
  -- =====================================================
  RAISE NOTICE '🔍 Looking up existing division and districts...';

  -- Get Division of City of Mati
  SELECT id INTO v_division_mati_id 
  FROM divisions 
  WHERE name ILIKE '%Mati%' OR code ILIKE '%MATI%'
  LIMIT 1;

  IF v_division_mati_id IS NULL THEN
    RAISE EXCEPTION '❌ Division of City of Mati not found! Please create it first.';
  END IF;
  RAISE NOTICE '✅ Found Division: %', v_division_mati_id;

  -- Get Mati Central District
  SELECT id INTO v_district_central_id 
  FROM districts 
  WHERE (name ILIKE '%Mati Central%' OR code ILIKE '%CENTRAL%') 
    AND division_id = v_division_mati_id
  LIMIT 1;

  IF v_district_central_id IS NULL THEN
    RAISE EXCEPTION '❌ Mati Central district not found! Please create it first.';
  END IF;
  RAISE NOTICE '✅ Found District Mati Central: %', v_district_central_id;

  -- Get Mati North District
  SELECT id INTO v_district_north_id 
  FROM districts 
  WHERE (name ILIKE '%Mati North%' OR code ILIKE '%NORTH%')
    AND division_id = v_division_mati_id
  LIMIT 1;

  IF v_district_north_id IS NULL THEN
    RAISE EXCEPTION '❌ Mati North district not found! Please create it first.';
  END IF;
  RAISE NOTICE '✅ Found District Mati North: %', v_district_north_id;

  -- Get Mati South District
  SELECT id INTO v_district_south_id 
  FROM districts 
  WHERE (name ILIKE '%Mati South%' OR code ILIKE '%SOUTH%')
    AND division_id = v_division_mati_id
  LIMIT 1;

  IF v_district_south_id IS NULL THEN
    RAISE EXCEPTION '❌ Mati South district not found! Please create it first.';
  END IF;
  RAISE NOTICE '✅ Found District Mati South: %', v_district_south_id;

  -- =====================================================
  -- STEP 2: Clear existing Mati schools
  -- =====================================================
  RAISE NOTICE '🗑️ Clearing existing Mati schools...';
  
  DELETE FROM students WHERE school_id IN (SELECT id FROM schools WHERE division = 'Division of City of Mati');
  DELETE FROM sections WHERE school_id IN (SELECT id FROM schools WHERE division = 'Division of City of Mati');
  DELETE FROM schools WHERE division = 'Division of City of Mati';
  RAISE NOTICE '🏫 Inserting Mati Central schools...';

  INSERT INTO schools (id, school_id_number, name, address, district, division, region, current_school_year, division_id, district_id, created_at, updated_at)
  VALUES
    (gen_random_uuid(), '129374', 'Badas Elementary School', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129375', 'Baso Elementary School', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129376', 'Belsonda Elementary School', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129377', 'Bagong Lipunan Improvement Site and Services Elementary School', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129380', 'Rabat-Rocamora Mati Central ES I', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129381', 'Rabat-Rocamora Mati Central ES II', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129382', 'Mayor Luisito G. Rabat Memorial School', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129383', 'Mayor Santiago Garcia Memorial School', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129384', 'Sudlon ES', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129385', 'Tagawisan ES', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '129386', 'Onotan Daganio Tagbobolo ES', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '205504', 'Rabat-Rocamora Mati Central SPED Sch.', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '500454', 'Licop IS', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW()),
    (gen_random_uuid(), '501424', 'Culian IS', 'City of Mati, Davao Oriental', 'Mati Central', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_central_id, NOW(), NOW());

  RAISE NOTICE '✅ Inserted 14 Mati Central schools';

  -- =====================================================
  -- STEP 3: Insert Schools - MATI CENTRAL (14 schools)
  -- =====================================================
  RAISE NOTICE '🏫 Inserting Mati North schools...';

  INSERT INTO schools (id, school_id_number, name, address, district, division, region, current_school_year, division_id, district_id, created_at, updated_at)
  VALUES
    (gen_random_uuid(), '129387', 'Alberto V. Ravelo Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129388', 'Antonino Vicentino Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129389', 'Benito G. Rabat Executive Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129390', 'Bobon ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129391', 'Buso Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129392', 'Cabubuanan Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129393', 'Cangusan Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129394', 'Serafin Vizconde Sr. ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129395', 'Don Luis Rabat Sr. Memorial School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129396', 'Don Salvador Lopez ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129397', 'Gavino Dawang ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129398', 'Gov. Leopoldo Lopez Sr. MS', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129399', 'Don Enrique Lopez Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129400', 'Paterno Madanlo Matiao Central Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129401', 'Pedro Malintad ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129402', 'Sta. Cruz ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129403', 'Tagabakid ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129405', 'Taguibo Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129406', 'Tamia Elementary School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129407', 'Tamisan ES', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129408', 'Fausta Salazar Como Mem. School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '129409', 'Vicente Almario Sr. MS', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '502726', 'Bugakan Integrated School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW()),
    (gen_random_uuid(), '502727', 'Tagbinonga Integrated School', 'City of Mati, Davao Oriental', 'Mati North', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_north_id, NOW(), NOW());

  RAISE NOTICE '✅ Inserted 24 Mati North schools';

  -- =====================================================
  -- STEP 5: Insert Schools - MATI SOUTH (15 schools)
  -- =====================================================
  RAISE NOTICE '🏫 Inserting Mati South schools...';

  INSERT INTO schools (id, school_id_number, name, address, district, division, region, current_school_year, division_id, district_id, created_at, updated_at)
  VALUES
    (gen_random_uuid(), '102157', 'Catmonan ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '102164', 'Talucanga ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129410', 'Brigido Rodriguez Sr. ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129412', 'Asuncion Rondina Perez Memorial School', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129413', 'Dawan CES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129414', 'Francisco Hinayon ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129417', 'Macambol ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129418', 'Magum ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129419', 'Gelacio G. Ytac Elementary School', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129420', 'Sanghay ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129421', 'Paciano A. Genon Elementary Memorial School', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '129422', 'Wagon ES', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '501085', 'Cabuaya IS', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '501086', 'Lanca IS', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW()),
    (gen_random_uuid(), '501087', 'Luban IS', 'City of Mati, Davao Oriental', 'Mati South', 'Division of City of Mati', 'Region XI - Davao Region', '2024-2025', v_division_mati_id, v_district_south_id, NOW(), NOW());

  RAISE NOTICE '✅ Inserted 15 Mati South schools';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SEEDING COMPLETE!';
  RAISE NOTICE '📊 Division: Division of City of Mati';
  RAISE NOTICE '📊 Districts: 3 (Mati Central, Mati North, Mati South)';
  RAISE NOTICE '📊 Schools: 53 Elementary Schools';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify Buso Elementary School (should be ID 129391 in Mati North with proper FKs)
SELECT 
  s.school_id_number,
  s.name,
  s.district,
  d.name as district_name,
  div.name as division_name,
  s.district_id IS NOT NULL as has_district_id,
  s.division_id IS NOT NULL as has_division_id
FROM schools s
LEFT JOIN districts d ON s.district_id = d.id
LEFT JOIN divisions div ON s.division_id = div.id
WHERE s.name LIKE '%Buso%';

-- Verify all schools have proper foreign keys
SELECT 
  district,
  COUNT(*) as school_count,
  COUNT(district_id) as with_district_id,
  COUNT(division_id) as with_division_id
FROM schools 
WHERE division = 'Division of City of Mati'
GROUP BY district
ORDER BY district;

-- Verify total schools
SELECT COUNT(*) as total_schools 
FROM schools 
WHERE division = 'Division of City of Mati';

-- List all schools with FK verification
SELECT 
  school_id_number,
  name,
  district,
  CASE WHEN district_id IS NOT NULL THEN '✓' ELSE '✗' END as district_fk,
  CASE WHEN division_id IS NOT NULL THEN '✓' ELSE '✗' END as division_fk
FROM schools 
WHERE division = 'Division of City of Mati'
ORDER BY school_id_number::INTEGER;
