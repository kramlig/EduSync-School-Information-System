-- ============================================================================
-- BATCH 3 - Mati South District
-- Personnel Count: 170
-- ============================================================================

DO $$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
BEGIN
  RAISE NOTICE 'Processing Mati South District (170 personnel)...';

  -- School: 129412 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129412' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Chrislyn Jean T.. Baay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_baay_chrislynjean', 'chrislynjean.baay@mati.edu.ph', 'Chrislyn Jean T.. Baay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chrislyn Jean T.. Baay', 'Chrislyn Jean', 'Tamala', 'Baay', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine P.. Baraquil
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_baraquil_josephine', 'josephine.baraquil@mati.edu.ph', 'Josephine P.. Baraquil', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine P.. Baraquil', 'Josephine', 'Perez', 'Baraquil', 'teacher_iii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristina B.. Brua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_brua_cristina', 'cristina.brua@mati.edu.ph', 'Cristina B.. Brua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristina B.. Brua', 'Cristina', 'Baraquel', 'Brua', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Esterlita G.. Pantua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_pantua_esterlita', 'esterlita.pantua@mati.edu.ph', 'Esterlita G.. Pantua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Esterlita G.. Pantua', 'Esterlita', 'Gialon', 'Pantua', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosela G.. Emelio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_emelio_rosela', 'rosela.emelio@mati.edu.ph', 'Rosela G.. Emelio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosela G.. Emelio', 'Rosela', 'Gialon', 'Emelio', 'teacher_ii', 'BEED w/MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ian Jay O.. Palabras
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_palabras_ianjay', 'ianjay.palabras@mati.edu.ph', 'Ian Jay O.. Palabras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ian Jay O.. Palabras', 'Ian Jay', 'Obaob', 'Palabras', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leslie S.. Rosauro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_rosauro_leslie', 'leslie.rosauro@mati.edu.ph', 'Leslie S.. Rosauro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leslie S.. Rosauro', 'Leslie', 'Salva', 'Rosauro', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marie Ann E.. Solis
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_solis_marieann', 'marieann.solis@mati.edu.ph', 'Marie Ann E.. Solis', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marie Ann E.. Solis', 'Marie Ann', 'De Erio', 'Solis', 'master_teacher_i', 'Master Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Iris May . Laquinon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129412_laquinon_irismay', 'irismay.laquinon@mati.edu.ph', 'Iris May . Laquinon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Iris May . Laquinon', 'Iris May', 'Lagare', 'Laquinon', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129410 (11 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129410' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Corazon S. Fabroa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_fabroa_corazon', 'corazon.fabroa@mati.edu.ph', 'Corazon S. Fabroa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Corazon S. Fabroa', 'Corazon', 'Secoya', 'Fabroa', 'teacher_i', 'w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jennifer B.. Demellites
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_demellites_jennifer', 'jennifer.demellites@mati.edu.ph', 'Jennifer B.. Demellites', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jennifer B.. Demellites', 'Jennifer', 'Burrnea', 'Demellites', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Virginia T. Guias
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_guias_virginia', 'virginia.guias@mati.edu.ph', 'Virginia T. Guias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Virginia T. Guias', 'Virginia', 'Tabigui', 'Guias', 'teacher_i', 'w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rizi May S. Guisando
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_guisando_rizimay', 'rizimay.guisando@mati.edu.ph', 'Rizi May S. Guisando', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rizi May S. Guisando', 'Rizi May', 'Salumag', 'Guisando', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daisy Lou T. Taculod
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_taculod_daisylou', 'daisylou.taculod@mati.edu.ph', 'Daisy Lou T. Taculod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisy Lou T. Taculod', 'Daisy Lou', 'Taculod', 'Taculod', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Editha T. Padon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_padon_editha', 'editha.padon@mati.edu.ph', 'Editha T. Padon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Editha T. Padon', 'Editha', 'Tabigue', 'Padon', 'master_teacher_i', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Stefanne R.. Pecasales
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_pecasales_stefanne', 'stefanne.pecasales@mati.edu.ph', 'Stefanne R.. Pecasales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Stefanne R.. Pecasales', 'Stefanne', 'Rodriguez', 'Pecasales', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cieth Corrie L. Bacuac
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_bacuac_ciethcorrie', 'ciethcorrie.bacuac@mati.edu.ph', 'Cieth Corrie L. Bacuac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cieth Corrie L. Bacuac', 'Cieth Corrie', 'Libres', 'Bacuac', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessamine Ivy G. Elan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_elan_jessamineivy', 'jessamineivy.elan@mati.edu.ph', 'Jessamine Ivy G. Elan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessamine Ivy G. Elan', 'Jessamine Ivy', 'Garay', 'Elan', 'teacher_i', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- William B.. Lambating
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_lambating_william', 'william.lambating@mati.edu.ph', 'William B.. Lambating', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'William B.. Lambating', 'William', 'Beri', 'Lambating', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocelyn S.. Pareja
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129410_pareja_jocelyn', 'jocelyn.pareja@mati.edu.ph', 'Jocelyn S.. Pareja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocelyn S.. Pareja', 'Jocelyn', 'Supnet', 'Pareja', 'principal_i', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 501085 (15 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501085' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Marc D.. Bandera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_bandera_marc', 'marc.bandera@mati.edu.ph', 'Marc D.. Bandera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marc D.. Bandera', 'Marc', 'Delos Santos', 'Bandera', 'teacher_i', 'BSED Math Major w/ MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maricor D. Bandera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_bandera_maricor', 'maricor.bandera@mati.edu.ph', 'Maricor D. Bandera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maricor D. Bandera', 'Maricor', 'Delos Santos', 'Bandera', 'teacher_i', 'BEED and MAEM Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ariel T. Bonggo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_bonggo_ariel', 'ariel.bonggo@mati.edu.ph', 'Ariel T. Bonggo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ariel T. Bonggo', 'Ariel', 'Taotjo', 'Bonggo', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arnel T. Bonggo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_bonggo_arnel', 'arnel.bonggo@mati.edu.ph', 'Arnel T. Bonggo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arnel T. Bonggo', 'Arnel', 'Taotjo', 'Bonggo', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Honey Jean T.. Igloria
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_igloria_honeyjean', 'honeyjean.igloria@mati.edu.ph', 'Honey Jean T.. Igloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Honey Jean T.. Igloria', 'Honey Jean', 'Tipudan', 'Igloria', 'teacher_iii', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kareen Rose T. Igloria
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_igloria_kareenrose', 'kareenrose.igloria@mati.edu.ph', 'Kareen Rose T. Igloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kareen Rose T. Igloria', 'Kareen Rose', 'Tipudan', 'Igloria', 'teacher_i', 'BSED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michael Jay T. Igloria
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_igloria_michaeljay', 'michaeljay.igloria@mati.edu.ph', 'Michael Jay T. Igloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michael Jay T. Igloria', 'Michael Jay', 'Tipudan', 'Igloria', 'teacher_i', '"BSED Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Eddie D. Macalalag
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_macalalag_eddie', 'eddie.macalalag@mati.edu.ph', '"Eddie D. Macalalag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Eddie D. Macalalag', '"Eddie', 'Desales', 'Macalalag', 'teacher_i', 'T-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Loisa I. Macampao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_macampao_loisa', 'loisa.macampao@mati.edu.ph', 'Loisa I. Macampao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Loisa I. Macampao', 'Loisa', 'Igloria', 'Macampao', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rodelyn M.. Ponteras
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_ponteras_rodelyn', 'rodelyn.ponteras@mati.edu.ph', 'Rodelyn M.. Ponteras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rodelyn M.. Ponteras', 'Rodelyn', 'Malintad', 'Ponteras', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rachel L.. Unabia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_unabia_rachel', 'rachel.unabia@mati.edu.ph', 'Rachel L.. Unabia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rachel L.. Unabia', 'Rachel', 'Lemente', 'Unabia', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jepfrey G. Versonda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_versonda_jepfrey', 'jepfrey.versonda@mati.edu.ph', 'Jepfrey G. Versonda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jepfrey G. Versonda', 'Jepfrey', 'Gonzales', 'Versonda', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Princess Catherine N. Gumbason
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_gumbason_princesscatherine', 'princesscatherine.gumbason@mati.edu.ph', 'Princess Catherine N. Gumbason', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Princess Catherine N. Gumbason', 'Princess Catherine', 'Navarette', 'Gumbason', 'teacher_i', 'BSED Math Major w/ MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daisy H.. Cabaden
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_cabaden_daisy', 'daisy.cabaden@mati.edu.ph', 'Daisy H.. Cabaden', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisy H.. Cabaden', 'Daisy', 'Hinayon', 'Cabaden', 'teacher_i', '"BEED-General Science/MEd-ECE with 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Joy B.. Casuyac
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501085_casuyac_maryjoy', 'maryjoy.casuyac@mati.edu.ph', 'Mary Joy B.. Casuyac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Joy B.. Casuyac', 'Mary Joy', 'Bongo', 'Casuyac', 'principal_i', 'BEED and MAEM Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 102157 (10 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '102157' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Pearl Gen P. Silatan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_silatan_pearlgen', 'pearlgen.silatan@mati.edu.ph', 'Pearl Gen P. Silatan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Pearl Gen P. Silatan', 'Pearl Gen', 'Pudang', 'Silatan', 'teacher_i', 'BEED/Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jelvin C.. Cabras
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_cabras_jelvin', 'jelvin.cabras@mati.edu.ph', 'Jelvin C.. Cabras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jelvin C.. Cabras', 'Jelvin', 'Capili', 'Cabras', 'teacher_i', 'BEED/Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace C.. Padao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_padao_grace', 'grace.padao@mati.edu.ph', 'Grace C.. Padao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace C.. Padao', 'Grace', 'Conat', 'Padao', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joan A. Simbillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_simbillo_joan', 'joan.simbillo@mati.edu.ph', 'Joan A. Simbillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joan A. Simbillo', 'Joan', 'Alcoriza', 'Simbillo', 'teacher_i', 'BEED/Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocelyn C. Robles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_robles_jocelyn', 'jocelyn.robles@mati.edu.ph', 'Jocelyn C. Robles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocelyn C. Robles', 'Jocelyn', 'Caingles', 'Robles', 'teacher_i', 'BEED/MAED-EM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine Joy S. Saluta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_saluta_christinejoy', 'christinejoy.saluta@mati.edu.ph', 'Christine Joy S. Saluta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine Joy S. Saluta', 'Christine Joy', 'Samante', 'Saluta', 'teacher_i', 'BEED/Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Princess Ann C.. Cheng
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_cheng_princessann', 'princessann.cheng@mati.edu.ph', 'Princess Ann C.. Cheng', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Princess Ann C.. Cheng', 'Princess Ann', 'Clemente', 'Cheng', 'teacher_i', 'BEED/Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Loweila T.. Umpad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_umpad_loweila', 'loweila.umpad@mati.edu.ph', 'Loweila T.. Umpad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Loweila T.. Umpad', 'Loweila', 'Ticong', 'Umpad', 'teacher_i', 'Master degree units /BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Precious Mae S.. Lambo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_lambo_preciousmae', 'preciousmae.lambo@mati.edu.ph', 'Precious Mae S.. Lambo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Precious Mae S.. Lambo', 'Precious Mae', 'Suspiñe', 'Lambo', 'teacher_i', 'BSED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Modem 0. Demua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102157_demua_modem', 'modem.demua@mati.edu.ph', 'Modem 0. Demua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Modem 0. Demua', 'Modem', 'Ortiz', 'Demua', 'principal_i', 'BSED/Ed.D', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129413 (13 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129413' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Ednalyn T. Blas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_blas_ednalyn', 'ednalyn.blas@mati.edu.ph', 'Ednalyn T. Blas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ednalyn T. Blas', 'Ednalyn', 'Tonares', 'Blas', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nedelie M.. Boyose
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_boyose_nedelie', 'nedelie.boyose@mati.edu.ph', 'Nedelie M.. Boyose', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nedelie M.. Boyose', 'Nedelie', 'Mudjakate', 'Boyose', 'master_teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine B.. Bravo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_bravo_josephine', 'josephine.bravo@mati.edu.ph', 'Josephine B.. Bravo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine B.. Bravo', 'Josephine', 'Balanay', 'Bravo', 'teacher_i', 'A.B./BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jerah L.. Direposun
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_direposun_jerah', 'jerah.direposun@mati.edu.ph', 'Jerah L.. Direposun', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jerah L.. Direposun', 'Jerah', 'Lambating', 'Direposun', 'teacher_iii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Divina G.. Hitgano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_hitgano_divina', 'divina.hitgano@mati.edu.ph', 'Divina G.. Hitgano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Divina G.. Hitgano', 'Divina', 'Gallardo', 'Hitgano', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Junil L.. Navarro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_navarro_junil', 'junil.navarro@mati.edu.ph', 'Junil L.. Navarro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Junil L.. Navarro', 'Junil', 'Lumagbas', 'Navarro', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Carmensita B.. Tero
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_tero_carmensita', 'carmensita.tero@mati.edu.ph', 'Carmensita B.. Tero', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Carmensita B.. Tero', 'Carmensita', 'Bilagantol', 'Tero', 'teacher_iii', 'BSMATH/MAED- Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juvy L.. Madrid
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_madrid_juvy', 'juvy.madrid@mati.edu.ph', 'Juvy L.. Madrid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juvy L.. Madrid', 'Juvy', 'Gallardo', 'Madrid', 'teacher_ii', 'BEED- Gen. Sci./Master Degree Unit', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryll F.. Gloriane
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_gloriane_sheryll', 'sheryll.gloriane@mati.edu.ph', 'Sheryll F.. Gloriane', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryll F.. Gloriane', 'Sheryll', 'Fernandez', 'Gloriane', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosalie M.. Agujetas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_agujetas_rosalie', 'rosalie.agujetas@mati.edu.ph', 'Rosalie M.. Agujetas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosalie M.. Agujetas', 'Rosalie', 'Maglines', 'Agujetas', 'teacher_iii', 'BEED-GEN.SCI./MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aiba G.. Monte De Ramos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_montederamos_aiba', 'aiba.montederamos@mati.edu.ph', 'Aiba G.. Monte De Ramos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aiba G.. Monte De Ramos', 'Aiba', 'Ganoy', 'Monte De Ramos', 'teacher_i', 'BSED-Gen. Sci.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roy L. Bugsad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_bugsad_roy', 'roy.bugsad@mati.edu.ph', 'Roy L. Bugsad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roy L. Bugsad', 'Roy', 'Lugay', 'Bugsad', 'master_teacher_ii', 'with Doctoral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marieter P.. Boligor
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129413_boligor_marieter', 'marieter.boligor@mati.edu.ph', 'Marieter P.. Boligor', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marieter P.. Boligor', 'Marieter', 'Pareja', 'Boligor', 'principal_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129414 (17 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129414' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Lito B.. Amora
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_amora_lito', 'lito.amora@mati.edu.ph', 'Lito B.. Amora', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lito B.. Amora', 'Lito', 'Balladares', 'Amora', 'teacher_ii', 'BEED-Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Erika Jane G.. Arce
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_arce_erikajane', 'erikajane.arce@mati.edu.ph', 'Erika Jane G.. Arce', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Erika Jane G.. Arce', 'Erika Jane', 'Galvez', 'Arce', 'teacher_i', 'BEED/MAED-EM with 33 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mercidetha R.. Baco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_baco_mercidetha', 'mercidetha.baco@mati.edu.ph', 'Mercidetha R.. Baco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mercidetha R.. Baco', 'Mercidetha', 'Reyes', 'Baco', 'master_teacher_ii', 'BEED-Generalist/MAEM with 39 units/MEd-ECE with 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joeymae V.. Bentayao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_bentayao_joeymae', 'joeymae.bentayao@mati.edu.ph', 'Joeymae V.. Bentayao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joeymae V.. Bentayao', 'Joeymae', 'Vismanos', 'Bentayao', 'teacher_ii', 'BEED-Generalist/MEd-ECE with 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mae Amor Tennie C.. Donaire
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_donaire_maeamortennie', 'maeamortennie.donaire@mati.edu.ph', 'Mae Amor Tennie C.. Donaire', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae Amor Tennie C.. Donaire', 'Mae Amor Tennie', 'Cagalitan', 'Donaire', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Evelyn M.. Galvez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_galvez_evelyn', 'evelyn.galvez@mati.edu.ph', 'Evelyn M.. Galvez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Evelyn M.. Galvez', 'Evelyn', 'Morales', 'Galvez', 'teacher_iii', 'BEED/Med-ECE with 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Neriza B.. Layaog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_layaog_neriza', 'neriza.layaog@mati.edu.ph', 'Neriza B.. Layaog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Neriza B.. Layaog', 'Neriza', 'Bangahon', 'Layaog', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sweetzyle R.. Madanlo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_madanlo_sweetzyle', 'sweetzyle.madanlo@mati.edu.ph', 'Sweetzyle R.. Madanlo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sweetzyle R.. Madanlo', 'Sweetzyle', 'Raguro', 'Madanlo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jhayson W. Mandaguay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_mandaguay_jhayson', 'jhayson.mandaguay@mati.edu.ph', 'Jhayson W. Mandaguay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jhayson W. Mandaguay', 'Jhayson', 'Wenceslao', 'Mandaguay', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Amalia C.. Pan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_pan_amalia', 'amalia.pan@mati.edu.ph', 'Amalia C.. Pan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Amalia C.. Pan', 'Amalia', 'Cagalitan', 'Pan', 'teacher_iii', 'Master''s Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mildred E.. Peregrino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_peregrino_mildred', 'mildred.peregrino@mati.edu.ph', 'Mildred E.. Peregrino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mildred E.. Peregrino', 'Mildred', 'Elan', 'Peregrino', 'teacher_iii', 'BEED-Generalist with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Myrna M.. Rabanos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_rabanos_myrna', 'myrna.rabanos@mati.edu.ph', 'Myrna M.. Rabanos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Myrna M.. Rabanos', 'Myrna', 'Montera', 'Rabanos', 'teacher_iii', 'BEED-Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elsie U.. Idul
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_idul_elsie', 'elsie.idul@mati.edu.ph', 'Elsie U.. Idul', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elsie U.. Idul', 'Elsie', 'Umpad', 'Idul', 'teacher_ii', 'BEED-General Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lhea Rose R.. Margate
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_margate_lhearose', 'lhearose.margate@mati.edu.ph', 'Lhea Rose R.. Margate', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lhea Rose R.. Margate', 'Lhea Rose', 'Rivera', 'Margate', 'teacher_i', 'BEED-Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace Ann . Bangahon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_bangahon_graceann', 'graceann.bangahon@mati.edu.ph', 'Grace Ann . Bangahon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace Ann . Bangahon', 'Grace Ann', 'Ibanez', 'Bangahon', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa Mae . Maratas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_maratas_jessamae', 'jessamae.maratas@mati.edu.ph', 'Jessa Mae . Maratas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa Mae . Maratas', 'Jessa Mae', 'Bangahon', 'Maratas', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alicia A.. Peñaranda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129414_pearanda_alicia', 'alicia.pearanda@mati.edu.ph', 'Alicia A.. Peñaranda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alicia A.. Peñaranda', 'Alicia', 'Almeria', 'Peñaranda', 'principal_i', 'MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129419 (15 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129419' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Virginia N.. Cubillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_cubillo_virginia', 'virginia.cubillo@mati.edu.ph', 'Virginia N.. Cubillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Virginia N.. Cubillo', 'Virginia', 'Nalam', 'Cubillo', 'teacher_ii', 'BEED-Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emalyn C.. Lucob
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_lucob_emalyn', 'emalyn.lucob@mati.edu.ph', 'Emalyn C.. Lucob', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emalyn C.. Lucob', 'Emalyn', 'Cose', 'Lucob', 'master_teacher_i', 'BEED- Mathematics/MAED w/ Ed.D Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivy Jane P.. Teves
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_teves_ivyjane', 'ivyjane.teves@mati.edu.ph', 'Ivy Jane P.. Teves', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivy Jane P.. Teves', 'Ivy Jane', 'Parohinog', 'Teves', 'teacher_i', 'BEED-Generalist/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janelyn G.. Portrias
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_portrias_janelyn', 'janelyn.portrias@mati.edu.ph', 'Janelyn G.. Portrias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janelyn G.. Portrias', 'Janelyn', 'Gorgonio', 'Portrias', 'teacher_ii', 'BEED-General Science/Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Ann M.. Saliling
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_saliling_maryann', 'maryann.saliling@mati.edu.ph', 'Mary Ann M.. Saliling', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Ann M.. Saliling', 'Mary Ann', 'Merced', 'Saliling', 'teacher_i', 'BEED-General Science/Master Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annalyn P. Tabudlong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_tabudlong_annalyn', 'annalyn.tabudlong@mati.edu.ph', 'Annalyn P. Tabudlong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annalyn P. Tabudlong', 'Annalyn', 'Perez', 'Tabudlong', 'teacher_i', 'BEED-Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ernecita T.. Vidal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_vidal_ernecita', 'ernecita.vidal@mati.edu.ph', 'Ernecita T.. Vidal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ernecita T.. Vidal', 'Ernecita', 'Tacder', 'Vidal', 'teacher_ii', 'BEED-Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rencel Ina Q. Garay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_garay_rencelina', 'rencelina.garay@mati.edu.ph', 'Rencel Ina Q. Garay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rencel Ina Q. Garay', 'Rencel Ina', 'Quiño', 'Garay', 'teacher_i', 'BEED w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Niña Marie A. Baste
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_baste_niamarie', 'niamarie.baste@mati.edu.ph', 'Niña Marie A. Baste', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Niña Marie A. Baste', 'Niña Marie', 'Antiola', 'Baste', 'teacher_i', 'BEED-Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruby P. Ponteres
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_ponteres_ruby', 'ruby.ponteres@mati.edu.ph', 'Ruby P. Ponteres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruby P. Ponteres', 'Ruby', 'Puertos', 'Ponteres', 'teacher_iii', 'BEED-Generalist/w/Ed.D UNITS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- HENRY M.. ESTRERA
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_estrera_henry', 'henry.estrera@mati.edu.ph', 'HENRY M.. ESTRERA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'HENRY M.. ESTRERA', 'HENRY', 'MONTALBAN', 'ESTRERA', 'teacher_i', 'BEED-Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- CHYREL JEAN B.. SECUYA
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_secuya_chyreljean', 'chyreljean.secuya@mati.edu.ph', 'CHYREL JEAN B.. SECUYA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'CHYREL JEAN B.. SECUYA', 'CHYREL JEAN', 'BALIGYA', 'SECUYA', 'teacher_i', 'BEED-GENERALIST', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- ANIE LYN M.. EMBALSADO
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_embalsado_anielyn', 'anielyn.embalsado@mati.edu.ph', 'ANIE LYN M.. EMBALSADO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'ANIE LYN M.. EMBALSADO', 'ANIE LYN', 'MORALES', 'EMBALSADO', 'teacher_i', 'BEED-GENERALIST', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lily Ellane W.. Paja
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_paja_lilyellane', 'lilyellane.paja@mati.edu.ph', 'Lily Ellane W.. Paja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lily Ellane W.. Paja', 'Lily Ellane', 'Wenceslao', 'Paja', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Johnny M.. Talipagan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129419_talipagan_johnny', 'johnny.talipagan@mati.edu.ph', 'Johnny M.. Talipagan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Johnny M.. Talipagan', 'Johnny', 'Maguinsawan', 'Talipagan', 'teacher_i', 'Bachelors Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 501086 (10 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501086' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Chineelen Rose B.. Lazo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_lazo_chineelenrose', 'chineelenrose.lazo@mati.edu.ph', 'Chineelen Rose B.. Lazo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chineelen Rose B.. Lazo', 'Chineelen Rose', 'Baquido', 'Lazo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Paulin Marie M.. Dumadangon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_dumadangon_paulinmarie', 'paulinmarie.dumadangon@mati.edu.ph', 'Paulin Marie M.. Dumadangon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Paulin Marie M.. Dumadangon', 'Paulin Marie', 'Madanlo', 'Dumadangon', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chandra H.. Longgakit
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_longgakit_chandra', 'chandra.longgakit@mati.edu.ph', 'Chandra H.. Longgakit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chandra H.. Longgakit', 'Chandra', 'Hinayon', 'Longgakit', 'master_teacher_i', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Herlin A.. Lumactod
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_lumactod_mariaherlin', 'mariaherlin.lumactod@mati.edu.ph', 'Maria Herlin A.. Lumactod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Herlin A.. Lumactod', 'Maria Herlin', 'Amado', 'Lumactod', 'teacher_i', 'BEED-SPED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leonarda S.. Salomon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_salomon_leonarda', 'leonarda.salomon@mati.edu.ph', 'Leonarda S.. Salomon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leonarda S.. Salomon', 'Leonarda', 'Siega', 'Salomon', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherry Mae B.. Tamposo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_tamposo_cherrymae', 'cherrymae.tamposo@mati.edu.ph', 'Cherry Mae B.. Tamposo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherry Mae B.. Tamposo', 'Cherry Mae', 'Blas', 'Tamposo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nurhana B.. Feliciano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_feliciano_nurhana', 'nurhana.feliciano@mati.edu.ph', 'Nurhana B.. Feliciano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nurhana B.. Feliciano', 'Nurhana', 'Budta', 'Feliciano', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Judy Ann L.. Cordero
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_cordero_judyann', 'judyann.cordero@mati.edu.ph', 'Judy Ann L.. Cordero', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Judy Ann L.. Cordero', 'Judy Ann', 'Langga', 'Cordero', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daisy T. Ferrancullo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_ferrancullo_daisy', 'daisy.ferrancullo@mati.edu.ph', 'Daisy T. Ferrancullo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisy T. Ferrancullo', 'Daisy', 'Tubilla', 'Ferrancullo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ian T.. Dalimo-os
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501086_dalimoos_ian', 'ian.dalimoos@mati.edu.ph', 'Ian T.. Dalimo-os', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ian T.. Dalimo-os', 'Ian', 'Tadlongan', 'Dalimo-os', 'principal_i', 'MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 501087 (11 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501087' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Anafe T. Acabo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_acabo_anafe', 'anafe.acabo@mati.edu.ph', 'Anafe T. Acabo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anafe T. Acabo', 'Anafe', 'Telo', 'Acabo', 'teacher_i', 'BSED-FIL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elsie A. Galvez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_galvez_elsie', 'elsie.galvez@mati.edu.ph', 'Elsie A. Galvez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elsie A. Galvez', 'Elsie', 'Acolbe', 'Galvez', 'teacher_i', 'Bachelor''s Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Villa Q. Malingue
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_malingue_villa', 'villa.malingue@mati.edu.ph', 'Villa Q. Malingue', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Villa Q. Malingue', 'Villa', 'Quevedo', 'Malingue', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rema D. Nayao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_nayao_rema', 'rema.nayao@mati.edu.ph', 'Rema D. Nayao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rema D. Nayao', 'Rema', 'Damaso', 'Nayao', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruby Joy T. Ortiz
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_ortiz_rubyjoy', 'rubyjoy.ortiz@mati.edu.ph', 'Ruby Joy T. Ortiz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruby Joy T. Ortiz', 'Ruby Joy', 'Talbin', 'Ortiz', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rica Jane T. Roda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_roda_ricajane', 'ricajane.roda@mati.edu.ph', 'Rica Jane T. Roda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rica Jane T. Roda', 'Rica Jane', 'Pepito', 'Roda', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherry L.. Sumimba
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_sumimba_cherry', 'cherry.sumimba@mati.edu.ph', 'Cherry L.. Sumimba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherry L.. Sumimba', 'Cherry', 'Lemente', 'Sumimba', 'teacher_iii', 'Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gretchie T.. Lingo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_lingo_gretchie', 'gretchie.lingo@mati.edu.ph', 'Gretchie T.. Lingo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gretchie T.. Lingo', 'Gretchie', 'Timosa', 'Lingo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jairamie G. Canque
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_canque_jairamie', 'jairamie.canque@mati.edu.ph', 'Jairamie G. Canque', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jairamie G. Canque', 'Jairamie', 'Ganot', 'Canque', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ramjie . Bandera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_bandera_ramjie', 'ramjie.bandera@mati.edu.ph', 'Ramjie . Bandera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ramjie . Bandera', 'Ramjie', 'Delos Santos', 'Bandera', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rowena L.. Bantolinao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501087_bantolinao_rowena', 'rowena.bantolinao@mati.edu.ph', 'Rowena L.. Bantolinao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rowena L.. Bantolinao', 'Rowena', 'Lemente', 'Bantolinao', 'principal_i', 'Master Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129417 (20 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129417' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Estrella M.. Alicaway
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_alicaway_estrella', 'estrella.alicaway@mati.edu.ph', 'Estrella M.. Alicaway', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Estrella M.. Alicaway', 'Estrella', 'Macarayan', 'Alicaway', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Pamila C.. Alicaway
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_alicaway_pamila', 'pamila.alicaway@mati.edu.ph', 'Pamila C.. Alicaway', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Pamila C.. Alicaway', 'Pamila', 'Caasi', 'Alicaway', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocel Z.. Angcot
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_angcot_jocel', 'jocel.angcot@mati.edu.ph', 'Jocel Z.. Angcot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocel Z.. Angcot', 'Jocel', 'Zamora', 'Angcot', 'teacher_ii', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eva Loida H.. Blanco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_blanco_evaloida', 'evaloida.blanco@mati.edu.ph', 'Eva Loida H.. Blanco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eva Loida H.. Blanco', 'Eva Loida', 'Hinayon', 'Blanco', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Aya B.. Castro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_castro_maaya', 'ma.aya.castro@mati.edu.ph', 'Ma. Aya B.. Castro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Aya B.. Castro', 'Ma. Aya', 'Bondag', 'Castro', 'teacher_i', 'MAEM Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mae Ann M.. Libres
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_libres_maeann', 'maeann.libres@mati.edu.ph', 'Mae Ann M.. Libres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae Ann M.. Libres', 'Mae Ann', 'Mapinogos', 'Libres', 'principal_i', 'BEED Mathematics with M.A Units in SPED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Segundina C.. Lintuan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_lintuan_segundina', 'segundina.lintuan@mati.edu.ph', 'Segundina C.. Lintuan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Segundina C.. Lintuan', 'Segundina', 'Cero', 'Lintuan', 'teacher_ii', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charlito R.. Mapinogos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_mapinogos_charlito', 'charlito.mapinogos@mati.edu.ph', 'Charlito R.. Mapinogos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charlito R.. Mapinogos', 'Charlito', 'Rufino', 'Mapinogos', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Armie R.. Pacanza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_pacanza_armie', 'armie.pacanza@mati.edu.ph', 'Armie R.. Pacanza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Armie R.. Pacanza', 'Armie', 'Rodriguez', 'Pacanza', 'master_teacher_ii', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eva P.. Pareja
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_pareja_eva', 'eva.pareja@mati.edu.ph', 'Eva P.. Pareja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eva P.. Pareja', 'Eva', 'Palamos', 'Pareja', 'teacher_iii', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Paz C.. Portrias
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_portrias_paz', 'paz.portrias@mati.edu.ph', 'Paz C.. Portrias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Paz C.. Portrias', 'Paz', 'Caasi', 'Portrias', 'teacher_iii', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elenita P.. Raguro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_raguro_elenita', 'elenita.raguro@mati.edu.ph', 'Elenita P.. Raguro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elenita P.. Raguro', 'Elenita', 'Palamos', 'Raguro', 'teacher_ii', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hermosila A.. Rojas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_rojas_hermosila', 'hermosila.rojas@mati.edu.ph', 'Hermosila A.. Rojas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hermosila A.. Rojas', 'Hermosila', 'Amoncio', 'Rojas', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nelfa D.. Tacder
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_tacder_nelfa', 'nelfa.tacder@mati.edu.ph', 'Nelfa D.. Tacder', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nelfa D.. Tacder', 'Nelfa', 'Deloso', 'Tacder', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rogelio E.. Tacder
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_tacder_rogelio', 'rogelio.tacder@mati.edu.ph', 'Rogelio E.. Tacder', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rogelio E.. Tacder', 'Rogelio', 'Escobido', 'Tacder', 'master_teacher_i', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dearly L. Tumangday
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_tumangday_dearly', 'dearly.tumangday@mati.edu.ph', 'Dearly L. Tumangday', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dearly L. Tumangday', 'Dearly', 'Lima-lima', 'Tumangday', 'teacher_ii', 'BBED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine F.. Wong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_wong_josephine', 'josephine.wong@mati.edu.ph', 'Josephine F.. Wong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine F.. Wong', 'Josephine', 'Felizarta', 'Wong', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jennelyn D.. Orellanida
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_orellanida_jennelyn', 'jennelyn.orellanida@mati.edu.ph', 'Jennelyn D.. Orellanida', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jennelyn D.. Orellanida', 'Jennelyn', 'Deniega', 'Orellanida', 'teacher_iii', 'MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hazel M.. Visto
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_visto_hazel', 'hazel.visto@mati.edu.ph', 'Hazel M.. Visto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hazel M.. Visto', 'Hazel', 'Moreno', 'Visto', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- John Expe D.. Satinitigan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129417_satinitigan_johnexpe', 'johnexpe.satinitigan@mati.edu.ph', 'John Expe D.. Satinitigan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'John Expe D.. Satinitigan', 'John Expe', 'Dumaran', 'Satinitigan', 'principal_i', 'BEED Math/MST Math Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129418 (8 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129418' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Rodel A.. Bacuac
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_bacuac_rodel', 'rodel.bacuac@mati.edu.ph', 'Rodel A.. Bacuac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rodel A.. Bacuac', 'Rodel', 'Anajao', 'Bacuac', 'teacher_iii', 'with M.A. dEGREE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dan Raymond M.. Batuhan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_batuhan_danraymond', 'danraymond.batuhan@mati.edu.ph', 'Dan Raymond M.. Batuhan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dan Raymond M.. Batuhan', 'Dan Raymond', 'Macarayan', 'Batuhan', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rowena G.. Pańares
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_paares_rowena', 'rowena.paares@mati.edu.ph', 'Rowena G.. Pańares', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rowena G.. Pańares', 'Rowena', 'Galanza', 'Pańares', 'teacher_i', 'Bachelor Degree/Filipino w/ MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Precy B.. Labi
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_labi_precy', 'precy.labi@mati.edu.ph', 'Precy B.. Labi', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Precy B.. Labi', 'Precy', 'Basilisco', 'Labi', 'teacher_i', 'with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Geraldine C.. Pacampara
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_pacampara_geraldine', 'geraldine.pacampara@mati.edu.ph', 'Geraldine C.. Pacampara', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Geraldine C.. Pacampara', 'Geraldine', 'Camao', 'Pacampara', 'teacher_i', 'With MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace Marie C.. Peńaranda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_pearanda_gracemarie', 'gracemarie.pearanda@mati.edu.ph', 'Grace Marie C.. Peńaranda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace Marie C.. Peńaranda', 'Grace Marie', 'Colicot', 'Peńaranda', 'teacher_i', 'with M. A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Girlie C.. Emia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_emia_girlie', 'girlie.emia@mati.edu.ph', 'Girlie C.. Emia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Girlie C.. Emia', 'Girlie', 'Cerote', 'Emia', 'teacher_i', 'with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lea Nette T.. Lambo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129418_lambo_leanette', 'leanette.lambo@mati.edu.ph', 'Lea Nette T.. Lambo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lea Nette T.. Lambo', 'Lea Nette', '', 'Lambo', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129421 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129421' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Erlinda D.. Fernandez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_fernandez_erlinda', 'erlinda.fernandez@mati.edu.ph', 'Erlinda D.. Fernandez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Erlinda D.. Fernandez', 'Erlinda', 'Dicon', 'Fernandez', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Flordeliza S.. Garing
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_garing_flordeliza', 'flordeliza.garing@mati.edu.ph', 'Flordeliza S.. Garing', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Flordeliza S.. Garing', 'Flordeliza', 'Solmayor', 'Garing', 'teacher_i', 'Bachelor Degree with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janice H.. Ibañez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_ibaez_janice', 'janice.ibaez@mati.edu.ph', 'Janice H.. Ibañez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janice H.. Ibañez', 'Janice', 'Hinayon', 'Ibañez', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ismael M. Jandayan Jr.
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_jandayanjr_ismael', 'ismael.jandayanjr.@mati.edu.ph', 'Ismael M. Jandayan Jr.', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ismael M. Jandayan Jr.', 'Ismael', 'Magdoboy', 'Jandayan Jr.', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Saturnino B.. Maybuena Jr.
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_maybuenajr_saturnino', 'saturnino.maybuenajr.@mati.edu.ph', 'Saturnino B.. Maybuena Jr.', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Saturnino B.. Maybuena Jr.', 'Saturnino', 'Baquiano', 'Maybuena Jr.', 'teacher_i', 'Bachelor Degree/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Manolito D.. Ramos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_ramos_manolito', 'manolito.ramos@mati.edu.ph', 'Manolito D.. Ramos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Manolito D.. Ramos', 'Manolito', 'Detros', 'Ramos', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Susan C.. Tan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_tan_susan', 'susan.tan@mati.edu.ph', 'Susan C.. Tan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Susan C.. Tan', 'Susan', 'Cubelo', 'Tan', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou G.. Narvasa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_narvasa_marilou', 'marilou.narvasa@mati.edu.ph', 'Marilou G.. Narvasa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou G.. Narvasa', 'Marilou', 'Guanzon', 'Narvasa', 'teacher_i', 'Asso. in Secretarial Admin. Major in Computer Secretarial', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivy Pearl F.. Paeta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129421_paeta_ivypearl', 'ivypearl.paeta@mati.edu.ph', 'Ivy Pearl F.. Paeta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivy Pearl F.. Paeta', 'Ivy Pearl', 'Forones', 'Paeta', 'principal_i', 'with Doctoral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129420 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129420' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Necil C. Decena
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_decena_necil', 'necil.decena@mati.edu.ph', 'Necil C. Decena', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Necil C. Decena', 'Necil', 'Cahucom', 'Decena', 'teacher_i', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Luz T.. Gandeza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_gandeza_marialuz', 'marialuz.gandeza@mati.edu.ph', 'Maria Luz T.. Gandeza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Luz T.. Gandeza', 'Maria Luz', 'Tejome', 'Gandeza', 'teacher_iii', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mylyn A.. Marundan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_marundan_mylyn', 'mylyn.marundan@mati.edu.ph', 'Mylyn A.. Marundan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mylyn A.. Marundan', 'Mylyn', 'Amabao', 'Marundan', 'teacher_i', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rhezyl Grace D.. Rama
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_rama_rhezylgrace', 'rhezylgrace.rama@mati.edu.ph', 'Rhezyl Grace D.. Rama', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rhezyl Grace D.. Rama', 'Rhezyl Grace', 'Decena', 'Rama', 'teacher_ii', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marisol B.. Canta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_canta_marisol', 'marisol.canta@mati.edu.ph', 'Marisol B.. Canta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marisol B.. Canta', 'Marisol', 'Baco', 'Canta', 'master_teacher_i', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Honey Jane F.. Sarte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_sarte_honeyjane', 'honeyjane.sarte@mati.edu.ph', 'Honey Jane F.. Sarte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Honey Jane F.. Sarte', 'Honey Jane', 'Famoso', 'Sarte', 'teacher_i', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Margie P.. Mandaguay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_mandaguay_margie', 'margie.mandaguay@mati.edu.ph', 'Margie P.. Mandaguay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Margie P.. Mandaguay', 'Margie', 'Pahid', 'Mandaguay', 'teacher_i', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Krystle R. Mabuan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_mabuan_krystle', 'krystle.mabuan@mati.edu.ph', 'Krystle R. Mabuan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Krystle R. Mabuan', 'Krystle', 'Ronquillo', 'Mabuan', 'teacher_iii', 'BEED/MAED-EM/ Doctoral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aquilina A.. Lumactod
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129420_lumactod_aquilina', 'aquilina.lumactod@mati.edu.ph', 'Aquilina A.. Lumactod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aquilina A.. Lumactod', 'Aquilina', 'Amado', 'Lumactod', 'principal_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 102164 (5 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '102164' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Carmila D. Calles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102164_calles_carmila', 'carmila.calles@mati.edu.ph', 'Carmila D. Calles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Carmila D. Calles', 'Carmila', 'Delocanog', 'Calles', 'teacher_i', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaidee V.. Capungas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102164_capungas_jaidee', 'jaidee.capungas@mati.edu.ph', 'Jaidee V.. Capungas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaidee V.. Capungas', 'Jaidee', 'Valeriano', 'Capungas', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nelmalyn L.. Lumactod
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102164_lumactod_nelmalyn', 'nelmalyn.lumactod@mati.edu.ph', 'Nelmalyn L.. Lumactod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nelmalyn L.. Lumactod', 'Nelmalyn', 'Lumangyao', 'Lumactod', 'teacher_i', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessame L.. Landero
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102164_landero_jessame', 'jessame.landero@mati.edu.ph', 'Jessame L.. Landero', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessame L.. Landero', 'Jessame', 'Labajo', 'Landero', 'teacher_i', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Honey Joy P.. Silatan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_102164_silatan_honeyjoy', 'honeyjoy.silatan@mati.edu.ph', 'Honey Joy P.. Silatan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Honey Joy P.. Silatan', 'Honey Joy', 'Pudang', 'Silatan', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129422 (8 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129422' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Marife Jewel P. Angsinco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_angsinco_marifejewel', 'marifejewel.angsinco@mati.edu.ph', 'Marife Jewel P. Angsinco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marife Jewel P. Angsinco', 'Marife Jewel', 'Paul', 'Angsinco', 'master_teacher_i', 'BEED/MAEM/MAED ENG. 30 UNITS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dalia Amor B. Ang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_ang_daliaamor', 'daliaamor.ang@mati.edu.ph', 'Dalia Amor B. Ang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dalia Amor B. Ang', 'Dalia Amor', 'Bocatot', 'Ang', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jennifer E. Bautista
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_bautista_jennifer', 'jennifer.bautista@mati.edu.ph', 'Jennifer E. Bautista', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jennifer E. Bautista', 'Jennifer', 'Emia', 'Bautista', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa Jean D.. Cañon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_caon_jessajean', 'jessajean.caon@mati.edu.ph', 'Jessa Jean D.. Cañon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa Jean D.. Cañon', 'Jessa Jean', 'Dellosa', 'Cañon', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roland S. Dato
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_dato_roland', 'roland.dato@mati.edu.ph', 'Roland S. Dato', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roland S. Dato', 'Roland', 'Singson', 'Dato', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elvie Jane A. Malubay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_malubay_elviejane', 'elviejane.malubay@mati.edu.ph', 'Elvie Jane A. Malubay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elvie Jane A. Malubay', 'Elvie Jane', 'Asoque', 'Malubay', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ayne Jane S.. Buro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_buro_aynejane', 'aynejane.buro@mati.edu.ph', 'Ayne Jane S.. Buro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ayne Jane S.. Buro', 'Ayne Jane', 'Silveron', 'Buro', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ebenezer D.. Otabe
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129422_otabe_ebenezer', 'ebenezer.otabe@mati.edu.ph', 'Ebenezer D.. Otabe', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ebenezer D.. Otabe', 'Ebenezer', 'Delfin', 'Otabe', 'principal_i', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  RAISE NOTICE 'Mati South District complete!';
END $$;

-- Verify
SELECT COUNT(*) as "Mati South Personnel" FROM teachers t 
JOIN schools s ON t.school_id = s.id 
WHERE s.district ILIKE '%Mati South%';
