-- Seed Division-Level Access Data for Testing
-- Created: December 7, 2025
-- Purpose: Add sample divisions, districts, and division users for testing
-- Updated: Synced with demo school data

-- =====================================================
-- SEED DATA FOR DIVISION-LEVEL ACCESS
-- =====================================================

DO $$
DECLARE
  v_division_zamboanga_id UUID;
  v_division_manila_id UUID;
  v_district_west_id UUID;
  v_district_east_id UUID;
  v_district_central_id UUID;
  v_school_id UUID;
  v_school_name TEXT;
  v_school_id_number TEXT;
BEGIN
  RAISE NOTICE '🌱 Starting Division-Level Access seeding...';

  -- =====================================================
  -- STEP 1: Create Sample Divisions
  -- =====================================================
  
  RAISE NOTICE '📍 Creating divisions...';

  -- Division 1: Zamboanga City (Demo school's division)
  INSERT INTO divisions (
    id, code, name, region, region_code,
    address, city, province,
    contact_email, contact_phone,
    superintendent_name, asst_superintendent_name,
    settings, is_active
  ) VALUES (
    gen_random_uuid(),
    'DIV-ZAMBOANGA-CITY',
    'Division of Zamboanga City',
    'Region IX - Zamboanga Peninsula',
    'REG-IX',
    'DepEd Division Office, Gov. Camins Ave.',
    'Zamboanga City',
    'Zamboanga del Sur',
    'zamboanga.city@deped.gov.ph',
    '+63-62-991-0871',
    'Dr. Ramon A. Guillen Jr.',
    'Dr. Ma. Cristina S. Gonzales',
    '{
      "schoolYearStart": "June",
      "enabledModules": ["sf1_enrollment", "sf2_attendance", "sf7_personnel", "reports_consolidated"],
      "reportingDeadlines": {
        "sf1_monthly": 5,
        "sf2_monthly": 10
      }
    }'::jsonb,
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    updated_at = NOW()
  RETURNING id INTO v_division_zamboanga_id;
  
  RAISE NOTICE '✅ Created/Updated Division: Zamboanga City (ID: %)', v_division_zamboanga_id;

  -- Division 2: City of Manila
  INSERT INTO divisions (
    id, code, name, region, region_code,
    address, city, province,
    contact_email, contact_phone,
    superintendent_name, asst_superintendent_name,
    settings, is_active
  ) VALUES (
    gen_random_uuid(),
    'DIV-MANILA-CITY',
    'Division of City of Manila',
    'National Capital Region',
    'NCR',
    'Mehan Garden, Padre Burgos Ave.',
    'Manila',
    'Metro Manila',
    'manila.city@deped.gov.ph',
    '+63-2-8527-1836',
    'Dr. Romulo M. Natividad',
    'Dr. Sofia R. Dela Cruz',
    '{
      "schoolYearStart": "August",
      "enabledModules": ["sf1_enrollment", "sf2_attendance", "sf7_personnel", "reports_consolidated", "analytics_dashboard"],
      "reportingDeadlines": {
        "sf1_monthly": 7,
        "sf2_monthly": 12
      }
    }'::jsonb,
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    updated_at = NOW()
  RETURNING id INTO v_division_manila_id;
  
  RAISE NOTICE '✅ Created/Updated Division: City of Manila (ID: %)', v_division_manila_id;

  -- =====================================================
  -- STEP 2: Create Sample Districts
  -- =====================================================
  
  RAISE NOTICE '📍 Creating districts...';

  -- District 1: Zamboanga City West
  INSERT INTO districts (
    id, division_id, code, name,
    psds_name, psds_contact,
    barangays, is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_zamboanga_id,
    'DIST-ZC-WEST',
    'Zamboanga City West District',
    'Dr. Ana Marie L. Fernandez',
    '+63-917-555-0001',
    ARRAY['Sta. Maria', 'Sta. Barbara', 'San Jose Gusu', 'Canelar', 'Baliwasan'],
    true
  )
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO v_district_west_id;
  
  RAISE NOTICE '✅ Created/Updated District: Zamboanga City West (ID: %)', v_district_west_id;

  -- District 2: Zamboanga City East
  INSERT INTO districts (
    id, division_id, code, name,
    psds_name, psds_contact,
    barangays, is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_zamboanga_id,
    'DIST-ZC-EAST',
    'Zamboanga City East District',
    'Dr. Roberto C. Santos',
    '+63-917-555-0002',
    ARRAY['Tetuan', 'Pasonanca', 'San Roque', 'Tumaga', 'Culianan'],
    true
  )
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO v_district_east_id;
  
  RAISE NOTICE '✅ Created/Updated District: Zamboanga City East (ID: %)', v_district_east_id;

  -- District 3: Manila Central
  INSERT INTO districts (
    id, division_id, code, name,
    psds_name, psds_contact,
    barangays, is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_manila_id,
    'DIST-MNL-CENTRAL',
    'Manila Central District',
    'Dr. Elena G. Reyes',
    '+63-917-555-0003',
    ARRAY['Ermita', 'Intramuros', 'Paco', 'Pandacan', 'Port Area'],
    true
  )
  ON CONFLICT (division_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO v_district_central_id;
  
  RAISE NOTICE '✅ Created/Updated District: Manila Central (ID: %)', v_district_central_id;

  -- =====================================================
  -- STEP 3: Assign existing schools to divisions
  -- =====================================================
  
  RAISE NOTICE '📍 Assigning schools to divisions...';

  -- Get the first school (demo school) and assign to Zamboanga City West District
  SELECT id, name, school_id_number 
  INTO v_school_id, v_school_name, v_school_id_number 
  FROM schools 
  WHERE deleted_at IS NULL 
  LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Update the school with division and district assignment
    UPDATE schools 
    SET 
      division_id = v_division_zamboanga_id,
      district_id = v_district_west_id,
      -- Sync region/division fields if they exist
      region = 'Region IX - Zamboanga Peninsula',
      division = 'Division of Zamboanga City',
      updated_at = NOW()
    WHERE id = v_school_id;
    
    RAISE NOTICE '✅ Assigned school "%" (ID: %) to Division: Zamboanga City, District: West', v_school_name, v_school_id_number;
  ELSE
    RAISE NOTICE '⚠️ No schools found to assign to divisions';
  END IF;

  -- Assign additional schools if they exist (for multi-school demo)
  FOR v_school_id, v_school_name IN
    SELECT id, name FROM schools 
    WHERE deleted_at IS NULL 
    AND id NOT IN (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1)
    LIMIT 5
  LOOP
    UPDATE schools 
    SET 
      division_id = v_division_zamboanga_id,
      district_id = v_district_east_id,
      region = 'Region IX - Zamboanga Peninsula',
      division = 'Division of Zamboanga City',
      updated_at = NOW()
    WHERE id = v_school_id;
    
    RAISE NOTICE '✅ Assigned additional school "%" to East District', v_school_name;
  END LOOP;

  -- =====================================================
  -- STEP 4: Create Division Users
  -- =====================================================
  
  RAISE NOTICE '📍 Creating division users...';

  -- Division Admin for Zamboanga City
  INSERT INTO division_users (
    id, division_id, firebase_uid, email, name,
    role, permissions,
    contact_phone, position_title,
    is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_zamboanga_id,
    'div_admin_zamboanga_001',
    'div.admin@zamboanga.deped.gov.ph',
    'Juan Carlos M. Reyes',
    'division_admin',
    '{
      "schools": ["read", "write", "delete"],
      "personnel": ["read", "write", "export"],
      "enrollment": ["read", "write", "export"],
      "attendance": ["read", "export"],
      "grades": ["read", "export"],
      "reports": ["read", "generate", "export"],
      "settings": ["read", "write"],
      "users": ["read", "write", "delete"]
    }'::jsonb,
    '+63-917-555-1001',
    'Division ICT Coordinator',
    true
  )
  ON CONFLICT (division_id, email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Created/Updated Division Admin: Juan Carlos M. Reyes';

  -- Division Supervisor for Zamboanga City
  INSERT INTO division_users (
    id, division_id, firebase_uid, email, name,
    role, permissions,
    contact_phone, position_title,
    is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_zamboanga_id,
    'div_supervisor_zamboanga_001',
    'supervisor@zamboanga.deped.gov.ph',
    'Maria Elena D. Aquino',
    'division_supervisor',
    '{
      "schools": ["read"],
      "personnel": ["read"],
      "enrollment": ["read"],
      "attendance": ["read"],
      "grades": ["read"],
      "reports": ["read", "generate"],
      "settings": [],
      "users": []
    }'::jsonb,
    '+63-917-555-1002',
    'Division Education Supervisor',
    true
  )
  ON CONFLICT (division_id, email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Created/Updated Division Supervisor: Maria Elena D. Aquino';

  -- PSDS for Zamboanga City West
  INSERT INTO division_users (
    id, division_id, firebase_uid, email, name,
    role, permissions,
    assigned_district_id,
    contact_phone, position_title,
    is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_zamboanga_id,
    'psds_zamboanga_west_001',
    'psds.west@zamboanga.deped.gov.ph',
    'Roberto A. Garcia',
    'psds',
    '{
      "schools": ["read"],
      "personnel": ["read"],
      "enrollment": ["read"],
      "attendance": ["read"],
      "grades": ["read"],
      "reports": ["read"],
      "settings": [],
      "users": []
    }'::jsonb,
    v_district_west_id,
    '+63-917-555-1003',
    'Public Schools District Supervisor - West',
    true
  )
  ON CONFLICT (division_id, email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    assigned_district_id = EXCLUDED.assigned_district_id,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Created/Updated PSDS: Roberto A. Garcia (West District)';

  -- EPS for Zamboanga City
  INSERT INTO division_users (
    id, division_id, firebase_uid, email, name,
    role, permissions,
    contact_phone, position_title,
    is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_zamboanga_id,
    'eps_zamboanga_math_001',
    'eps.math@zamboanga.deped.gov.ph',
    'Ana Sofia B. Cruz',
    'eps',
    '{
      "schools": ["read"],
      "personnel": ["read"],
      "enrollment": ["read"],
      "attendance": ["read"],
      "grades": ["read"],
      "reports": ["read"],
      "settings": [],
      "users": []
    }'::jsonb,
    '+63-917-555-1004',
    'Education Program Supervisor - Mathematics',
    true
  )
  ON CONFLICT (division_id, email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Created/Updated EPS: Ana Sofia B. Cruz (Mathematics)';

  -- Data Manager for Zamboanga City
  INSERT INTO division_users (
    id, division_id, firebase_uid, email, name,
    role, permissions,
    contact_phone, position_title,
    is_active
  ) VALUES (
    gen_random_uuid(),
    v_division_zamboanga_id,
    'data_manager_zamboanga_001',
    'data.manager@zamboanga.deped.gov.ph',
    'Pedro J. Santos',
    'division_data_manager',
    '{
      "schools": ["read"],
      "personnel": ["read", "export"],
      "enrollment": ["read", "write", "export"],
      "attendance": ["read", "export"],
      "grades": ["read", "export"],
      "reports": ["read", "generate", "export"],
      "settings": [],
      "users": []
    }'::jsonb,
    '+63-917-555-1005',
    'Division Planning Officer',
    true
  )
  ON CONFLICT (division_id, email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Created/Updated Data Manager: Pedro J. Santos';

  -- =====================================================
  -- SUMMARY
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Division-Level Access seeding complete!';
  RAISE NOTICE '📊 Created:';
  RAISE NOTICE '   - 2 Divisions (Zamboanga City, City of Manila)';
  RAISE NOTICE '   - 3 Districts (ZC West, ZC East, Manila Central)';
  RAISE NOTICE '   - 5 Division Users (Admin, Supervisor, PSDS, EPS, Data Manager)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Test Credentials:';
  RAISE NOTICE '   Division Admin: div.admin@zamboanga.deped.gov.ph';
  RAISE NOTICE '   Supervisor: supervisor@zamboanga.deped.gov.ph';
  RAISE NOTICE '   PSDS: psds.west@zamboanga.deped.gov.ph';
  RAISE NOTICE '   EPS: eps.math@zamboanga.deped.gov.ph';
  RAISE NOTICE '   Data Manager: data.manager@zamboanga.deped.gov.ph';

END $$;
