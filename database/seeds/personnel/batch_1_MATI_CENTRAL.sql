-- ============================================================================
-- BATCH 1 - MATI CENTRAL District
-- Personnel Count: 374
-- ============================================================================

DO $$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
BEGIN
  RAISE NOTICE 'Processing MATI CENTRAL District (374 personnel)...';

  -- School: 129374 (19 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129374' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Vevencia B. Bañez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_baez_vevencia', 'vevencia.baez@mati.edu.ph', 'Vevencia B. Bañez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vevencia B. Bañez', 'Vevencia', 'Baclay', 'Bañez', 'teacher_ii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elicielia M. Baste
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_baste_elicielia', 'elicielia.baste@mati.edu.ph', 'Elicielia M. Baste', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elicielia M. Baste', 'Elicielia', 'Morales', 'Baste', 'teacher_iii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melody B. Caragao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_caragao_melody', 'melody.caragao@mati.edu.ph', 'Melody B. Caragao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melody B. Caragao', 'Melody', 'Bandigan', 'Caragao', 'teacher_ii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Andrian P. Caragao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_caragao_andrian', 'andrian.caragao@mati.edu.ph', 'Andrian P. Caragao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Andrian P. Caragao', 'Andrian', 'Plaza', 'Caragao', 'teacher_ii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annely Jane C. Casibua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_casibua_annelyjane', 'annelyjane.casibua@mati.edu.ph', 'Annely Jane C. Casibua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annely Jane C. Casibua', 'Annely Jane', 'Caro', 'Casibua', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah T.. Ceniza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_ceniza_leah', 'leah.ceniza@mati.edu.ph', 'Leah T.. Ceniza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah T.. Ceniza', 'Leah', 'Tiapson', 'Ceniza', 'teacher_iii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sally G. Cuaton
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_cuaton_sally', 'sally.cuaton@mati.edu.ph', 'Sally G. Cuaton', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sally G. Cuaton', 'Sally', 'Gatab', 'Cuaton', 'teacher_iii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lyndy G.. Mantog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_mantog_lyndy', 'lyndy.mantog@mati.edu.ph', 'Lyndy G.. Mantog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lyndy G.. Mantog', 'Lyndy', 'Gatab', 'Mantog', 'teacher_ii', 'BSED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Zhenielou A. Naval
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_naval_zhenielou', 'zhenielou.naval@mati.edu.ph', 'Zhenielou A. Naval', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Zhenielou A. Naval', 'Zhenielou', 'Asturias', 'Naval', 'teacher_iii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- April M. Quinal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_quinal_april', 'april.quinal@mati.edu.ph', 'April M. Quinal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'April M. Quinal', 'April', 'Masanguid', 'Quinal', 'teacher_iii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaycel S. Kinatagcan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_kinatagcan_jaycel', 'jaycel.kinatagcan@mati.edu.ph', 'Jaycel S. Kinatagcan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaycel S. Kinatagcan', 'Jaycel', 'Sambling', 'Kinatagcan', 'teacher_i', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Virginia S. Tia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_tia_virginia', 'virginia.tia@mati.edu.ph', 'Virginia S. Tia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Virginia S. Tia', 'Virginia', 'Segura', 'Tia', 'teacher_iii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juvelyn R. Visitacion
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_visitacion_juvelyn', 'juvelyn.visitacion@mati.edu.ph', 'Juvelyn R. Visitacion', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juvelyn R. Visitacion', 'Juvelyn', 'Rivas', 'Visitacion', 'teacher_ii', 'BEED/MAGC', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gina G. Bayate
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_bayate_gina', 'gina.bayate@mati.edu.ph', 'Gina G. Bayate', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gina G. Bayate', 'Gina', 'Garciano', 'Bayate', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jane Leizl B. Lozano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_lozano_janeleizl', 'janeleizl.lozano@mati.edu.ph', 'Jane Leizl B. Lozano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jane Leizl B. Lozano', 'Jane Leizl', 'Baquiano', 'Lozano', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Guilerma T.. Gutierrez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_gutierrez_guilerma', 'guilerma.gutierrez@mati.edu.ph', 'Guilerma T.. Gutierrez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Guilerma T.. Gutierrez', 'Guilerma', 'Torreon', 'Gutierrez', 'master_teacher_ii', 'MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Joy E.. Cabug-os
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_cabugos_maryjoy', 'maryjoy.cabugos@mati.edu.ph', 'Mary Joy E.. Cabug-os', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Joy E.. Cabug-os', 'Mary Joy', 'Escala', 'Cabug-os', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Franie M.. Ventura
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_ventura_franie', 'franie.ventura@mati.edu.ph', 'Franie M.. Ventura', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Franie M.. Ventura', 'Franie', 'Malasador', 'Ventura', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shirley C. Ibañez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129374_ibaez_shirley', 'shirley.ibaez@mati.edu.ph', 'Shirley C. Ibañez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shirley C. Ibañez', 'Shirley', 'Campion', 'Ibañez', 'principal_i', 'Ed.D', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129377 (17 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129377' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Charlyn C. Bongo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_bongo_charlyn', 'charlyn.bongo@mati.edu.ph', 'Charlyn C. Bongo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charlyn C. Bongo', 'Charlyn', 'Casanaan', 'Bongo', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Virginia F. Bustamante
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_bustamante_virginia', 'virginia.bustamante@mati.edu.ph', 'Virginia F. Bustamante', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Virginia F. Bustamante', 'Virginia', 'Francisco', 'Bustamante', 'teacher_iii', 'BEED w/ MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Glorifel Amor P. Calam
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_calam_glorifelamor', 'glorifelamor.calam@mati.edu.ph', 'Glorifel Amor P. Calam', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Glorifel Amor P. Calam', 'Glorifel Amor', 'Pederes', 'Calam', 'teacher_iii', 'BEED/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Proserfina I. Dacua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_dacua_proserfina', 'proserfina.dacua@mati.edu.ph', 'Proserfina I. Dacua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Proserfina I. Dacua', 'Proserfina', 'Indong', 'Dacua', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Christina R. Flores
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_flores_mariachristina', 'mariachristina.flores@mati.edu.ph', 'Maria Christina R. Flores', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Christina R. Flores', 'Maria Christina', 'Regis', 'Flores', 'teacher_ii', 'BEED w/ MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Patrick Giovanni R.. Flores
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_flores_patrickgiovanni', 'patrickgiovanni.flores@mati.edu.ph', 'Patrick Giovanni R.. Flores', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Patrick Giovanni R.. Flores', 'Patrick Giovanni', 'Regis', 'Flores', 'teacher_i', 'BEED w/ MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Luz O. Fullo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_fullo_maryluz', 'maryluz.fullo@mati.edu.ph', 'Mary Luz O. Fullo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Luz O. Fullo', 'Mary Luz', 'Ocon', 'Fullo', 'teacher_iii', 'BEED/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Karen Mae P. Mudjakate
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_mudjakate_karenmae', 'karenmae.mudjakate@mati.edu.ph', 'Karen Mae P. Mudjakate', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Karen Mae P. Mudjakate', 'Karen Mae', 'Pajo', 'Mudjakate', 'teacher_iii', 'BEED w/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gracesilda P. Treyes
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_treyes_gracesilda', 'gracesilda.treyes@mati.edu.ph', 'Gracesilda P. Treyes', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gracesilda P. Treyes', 'Gracesilda', 'Pederes', 'Treyes', 'teacher_iii', 'BEED/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rowena E. Alomia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_alomia_rowena', 'rowena.alomia@mati.edu.ph', 'Rowena E. Alomia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rowena E. Alomia', 'Rowena', 'Econg', 'Alomia', 'master_teacher_i', '"BEED/Master Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aprilita A. Tormis
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_tormis_aprilita', 'aprilita.tormis@mati.edu.ph', 'Aprilita A. Tormis', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aprilita A. Tormis', 'Aprilita', 'Aporbo', 'Tormis', 'teacher_iii', 'BEED w/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Warlo N. Venancio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_venancio_warlo', 'warlo.venancio@mati.edu.ph', 'Warlo N. Venancio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Warlo N. Venancio', 'Warlo', 'Nirza', 'Venancio', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joan T. Manatad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_manatad_joan', 'joan.manatad@mati.edu.ph', 'Joan T. Manatad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joan T. Manatad', 'Joan', 'Tamarion', 'Manatad', 'teacher_iii', 'BEED/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rebecca N. Tia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_tia_rebecca', 'rebecca.tia@mati.edu.ph', 'Rebecca N. Tia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rebecca N. Tia', 'Rebecca', 'Nistal', 'Tia', 'teacher_iii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jack B. Manatad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_manatad_jack', 'jack.manatad@mati.edu.ph', 'Jack B. Manatad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jack B. Manatad', 'Jack', 'Binancilan', 'Manatad', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Silvestre T. Tuba
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_tuba_silvestre', 'silvestre.tuba@mati.edu.ph', 'Silvestre T. Tuba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Silvestre T. Tuba', 'Silvestre', 'Tape', 'Tuba', 'principal_i', 'BEED / with MAED-EM units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edito B. Guinanas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129377_guinanas_edito', 'edito.guinanas@mati.edu.ph', 'Edito B. Guinanas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edito B. Guinanas', 'Edito', 'Bejoc', 'Guinanas', 'teacher_i', 'BEED/MA (GRAD.) EDUCATION (Ed.D) MAJOR IN EDUCATIONAL 9 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129375 (11 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129375' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Arjay R. Banzali
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_banzali_arjay', 'arjay.banzali@mati.edu.ph', 'Arjay R. Banzali', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arjay R. Banzali', 'Arjay', 'Romano', 'Banzali', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Claridel V. Bijis
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_bijis_claridel', 'claridel.bijis@mati.edu.ph', 'Claridel V. Bijis', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Claridel V. Bijis', 'Claridel', 'Valencia', 'Bijis', 'teacher_ii', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Deodito T.. Campion
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_campion_deodito', 'deodito.campion@mati.edu.ph', 'Deodito T.. Campion', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Deodito T.. Campion', 'Deodito', 'Tulang', 'Campion', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ria Vaniza L.. Detablan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_detablan_riavaniza', 'riavaniza.detablan@mati.edu.ph', 'Ria Vaniza L.. Detablan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ria Vaniza L.. Detablan', 'Ria Vaniza', 'Lawas', 'Detablan', 'teacher_i', 'BEED/ MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rowena G.. Escala
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_escala_rowena', 'rowena.escala@mati.edu.ph', 'Rowena G.. Escala', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rowena G.. Escala', 'Rowena', 'Guhao', 'Escala', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Blanchie Beryl N.. Gulane
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_gulane_blanchieberyl', 'blanchieberyl.gulane@mati.edu.ph', 'Blanchie Beryl N.. Gulane', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Blanchie Beryl N.. Gulane', 'Blanchie Beryl', 'Nasis', 'Gulane', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janneth M. Jabilles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_jabilles_janneth', 'janneth.jabilles@mati.edu.ph', 'Janneth M. Jabilles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janneth M. Jabilles', 'Janneth', 'Mandaguay', 'Jabilles', 'teacher_ii', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ava P. Trocio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_trocio_ava', 'ava.trocio@mati.edu.ph', 'Ava P. Trocio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ava P. Trocio', 'Ava', 'Parilla', 'Trocio', 'teacher_iii', 'BEED/ MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anacel L. Señagan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_seagan_anacel', 'anacel.seagan@mati.edu.ph', 'Anacel L. Señagan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anacel L. Señagan', 'Anacel', 'Lawas', 'Señagan', 'teacher_ii', 'BEED/w/MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nerlita A. Martije
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_martije_nerlita', 'nerlita.martije@mati.edu.ph', 'Nerlita A. Martije', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nerlita A. Martije', 'Nerlita', 'Amoncio', 'Martije', 'teacher_iii', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alexander . Flores
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129375_flores_alexander', 'alexander.flores@mati.edu.ph', 'Alexander . Flores', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alexander . Flores', 'Alexander', '', 'Flores', 'principal_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129376 (14 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129376' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Dennis A. Macaubos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_macaubos_dennis', 'dennis.macaubos@mati.edu.ph', 'Dennis A. Macaubos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dennis A. Macaubos', 'Dennis', 'Adesna', 'Macaubos', 'master_teacher_i', 'BeEd w/ MAED/MST Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marichu F. Ambasan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_ambasan_marichu', 'marichu.ambasan@mati.edu.ph', 'Marichu F. Ambasan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marichu F. Ambasan', 'Marichu', 'Ferrando', 'Ambasan', 'teacher_iii', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- John Lloyd S. Abarca
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_abarca_johnlloyd', 'johnlloyd.abarca@mati.edu.ph', 'John Lloyd S. Abarca', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'John Lloyd S. Abarca', 'John Lloyd', 'Sedon', 'Abarca', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Beverly P. Cabueñas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_cabueas_beverly', 'beverly.cabueas@mati.edu.ph', 'Beverly P. Cabueñas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Beverly P. Cabueñas', 'Beverly', 'Panugan', 'Cabueñas', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Genalynn A. Famular
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_famular_genalynn', 'genalynn.famular@mati.edu.ph', 'Genalynn A. Famular', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Genalynn A. Famular', 'Genalynn', 'Acebes', 'Famular', 'master_teacher_ii', 'BEED/w/MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gazel G. Jumamil
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_jumamil_gazel', 'gazel.jumamil@mati.edu.ph', 'Gazel G. Jumamil', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gazel G. Jumamil', 'Gazel', 'Gresos', 'Jumamil', 'teacher_iii', 'BEED/MA graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Teresita L. Insular
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_insular_teresita', 'teresita.insular@mati.edu.ph', 'Teresita L. Insular', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Teresita L. Insular', 'Teresita', 'Lorin', 'Insular', 'teacher_iii', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rogelyn D. Plaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_plaza_rogelyn', 'rogelyn.plaza@mati.edu.ph', 'Rogelyn D. Plaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rogelyn D. Plaza', 'Rogelyn', 'Dupa', 'Plaza', 'teacher_ii', 'BEED/w/ MA units/ Med Tech.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cleo H. Panugan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_panugan_cleo', 'cleo.panugan@mati.edu.ph', 'Cleo H. Panugan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cleo H. Panugan', 'Cleo', 'Habana', 'Panugan', 'teacher_i', 'BEED/ w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ed Russel M.. Garnez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_garnez_edrussel', 'edrussel.garnez@mati.edu.ph', 'Ed Russel M.. Garnez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ed Russel M.. Garnez', 'Ed Russel', 'Montero', 'Garnez', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janeth B. Torquia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_torquia_janeth', 'janeth.torquia@mati.edu.ph', 'Janeth B. Torquia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janeth B. Torquia', 'Janeth', 'Baja', 'Torquia', 'teacher_i', 'BEED/w/ MA graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Carlo S. Porticos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_porticos_carlo', 'carlo.porticos@mati.edu.ph', 'Carlo S. Porticos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Carlo S. Porticos', 'Carlo', 'Siblos', 'Porticos', 'teacher_i', 'BEED/w/MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elizabeth . Magkidong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_magkidong_elizabeth', 'elizabeth.magkidong@mati.edu.ph', 'Elizabeth . Magkidong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elizabeth . Magkidong', 'Elizabeth', 'Escamos', 'Magkidong', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- George C. Cagalitan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129376_cagalitan_george', 'george.cagalitan@mati.edu.ph', 'George C. Cagalitan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'George C. Cagalitan', 'George', 'Carreon', 'Cagalitan', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 501424 (15 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501424' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Richard N.. Atanacio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_atanacio_richard', 'richard.atanacio@mati.edu.ph', 'Richard N.. Atanacio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Richard N.. Atanacio', 'Richard', 'Nadonza', 'Atanacio', 'teacher_iii', 'BEED/MAEM 54 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristine May L. Dapal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_dapal_kristinemay', 'kristinemay.dapal@mati.edu.ph', 'Kristine May L. Dapal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristine May L. Dapal', 'Kristine May', 'Langtad', 'Dapal', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Carmina F.. Diano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_diano_carmina', 'carmina.diano@mati.edu.ph', 'Carmina F.. Diano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Carmina F.. Diano', 'Carmina', 'Felitro', 'Diano', 'teacher_ii', 'BEEDMAED 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melody Fair E. Duyog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_duyog_melodyfair', 'melodyfair.duyog@mati.edu.ph', 'Melody Fair E. Duyog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melody Fair E. Duyog', 'Melody Fair', 'Estillore', 'Duyog', 'teacher_iii', 'BEED/MST Math Grad', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juniel M. Felicilda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_felicilda_juniel', 'juniel.felicilda@mati.edu.ph', 'Juniel M. Felicilda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juniel M. Felicilda', 'Juniel', 'Majaras', 'Felicilda', 'teacher_i', 'BEED Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janeth C. Gayoso
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_gayoso_janeth', 'janeth.gayoso@mati.edu.ph', 'Janeth C. Gayoso', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janeth C. Gayoso', 'Janeth', 'Cantiveros', 'Gayoso', 'teacher_i', 'BEED Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sarah Ivy S.. Loquincio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_loquincio_sarahivy', 'sarahivy.loquincio@mati.edu.ph', 'Sarah Ivy S.. Loquincio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sarah Ivy S.. Loquincio', 'Sarah Ivy', 'Sabong', 'Loquincio', 'teacher_iii', 'BEED/MAED EM Grad', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janny Mae A. Mamontuan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_mamontuan_jannymae', 'jannymae.mamontuan@mati.edu.ph', 'Janny Mae A. Mamontuan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janny Mae A. Mamontuan', 'Janny Mae', 'Amarillo', 'Mamontuan', 'teacher_i', 'BEED Gen Sci ECD 27', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joana Mae R. Genardino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_genardino_joanamae', 'joanamae.genardino@mati.edu.ph', 'Joana Mae R. Genardino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joana Mae R. Genardino', 'Joana Mae', 'Romagos', 'Genardino', 'teacher_i', 'BPE-School PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Celeste Abigail B. Peras
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_peras_celesteabigail', 'celesteabigail.peras@mati.edu.ph', 'Celeste Abigail B. Peras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Celeste Abigail B. Peras', 'Celeste Abigail', 'Balite', 'Peras', 'teacher_i', 'BEED Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leonida C. Umacob
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_umacob_leonida', 'leonida.umacob@mati.edu.ph', 'Leonida C. Umacob', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leonida C. Umacob', 'Leonida', 'Cabrera', 'Umacob', 'master_teacher_i', 'BEED/ MAED 24 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa C. Solano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_solano_jessa', 'jessa.solano@mati.edu.ph', 'Jessa C. Solano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa C. Solano', 'Jessa', 'Campaner', 'Solano', 'teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Joy M. Caterbas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_caterbas_maryjoy', 'maryjoy.caterbas@mati.edu.ph', 'Mary Joy M. Caterbas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Joy M. Caterbas', 'Mary Joy', 'Muñoz', 'Caterbas', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jane Kris . Delpuerto
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_delpuerto_janekris', 'janekris.delpuerto@mati.edu.ph', 'Jane Kris . Delpuerto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jane Kris . Delpuerto', 'Jane Kris', '', 'Delpuerto', 'teacher_i', 'a', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cora L.. Balgos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_501424_balgos_cora', 'cora.balgos@mati.edu.ph', 'Cora L.. Balgos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cora L.. Balgos', 'Cora', 'Lumahang', 'Balgos', 'principal_i', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 500454 (14 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '500454' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Ginabeth D. Bauya
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_bauya_ginabeth', 'ginabeth.bauya@mati.edu.ph', 'Ginabeth D. Bauya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ginabeth D. Bauya', 'Ginabeth', 'Delima', 'Bauya', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eloisa C. Bitac
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_bitac_eloisa', 'eloisa.bitac@mati.edu.ph', 'Eloisa C. Bitac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eloisa C. Bitac', 'Eloisa', 'Cervantes', 'Bitac', 'teacher_ii', 'BSEd - Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaygiel B. Bulao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_bulao_jaygiel', 'jaygiel.bulao@mati.edu.ph', 'Jaygiel B. Bulao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaygiel B. Bulao', 'Jaygiel', 'Bihag', 'Bulao', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Imelda M. Candaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_candaza_imelda', 'imelda.candaza@mati.edu.ph', 'Imelda M. Candaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Imelda M. Candaza', 'Imelda', 'Manug', 'Candaza', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analuz R. Cornelio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_cornelio_analuz', 'analuz.cornelio@mati.edu.ph', 'Analuz R. Cornelio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analuz R. Cornelio', 'Analuz', 'Ramon', 'Cornelio', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Junard M. Dela Peña
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_delapea_junard', 'junard.delapea@mati.edu.ph', 'Junard M. Dela Peña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Junard M. Dela Peña', 'Junard', 'Mangoba', 'Dela Peña', 'teacher_i', 'BSEd - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aloma T. Jadaong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_jadaong_aloma', 'aloma.jadaong@mati.edu.ph', 'Aloma T. Jadaong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aloma T. Jadaong', 'Aloma', 'Tiapson', 'Jadaong', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janenn D. Lemente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_lemente_janenn', 'janenn.lemente@mati.edu.ph', 'Janenn D. Lemente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janenn D. Lemente', 'Janenn', 'Dellosa', 'Lemente', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shiela Mae L. Moaton
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_moaton_shielamae', 'shielamae.moaton@mati.edu.ph', 'Shiela Mae L. Moaton', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shiela Mae L. Moaton', 'Shiela Mae', 'Lemente', 'Moaton', 'teacher_i', 'BSED-English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Evie Jean P. Opo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_opo_eviejean', 'eviejean.opo@mati.edu.ph', 'Evie Jean P. Opo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Evie Jean P. Opo', 'Evie Jean', 'Pagdato', 'Opo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenelyn D. Parejo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_parejo_jenelyn', 'jenelyn.parejo@mati.edu.ph', 'Jenelyn D. Parejo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenelyn D. Parejo', 'Jenelyn', 'Dionaldo', 'Parejo', 'master_teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- April Mariz M. Raga
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_raga_aprilmariz', 'aprilmariz.raga@mati.edu.ph', 'April Mariz M. Raga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'April Mariz M. Raga', 'April Mariz', 'Mendador', 'Raga', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Erica A. Vicentino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_vicentino_erica', 'erica.vicentino@mati.edu.ph', 'Erica A. Vicentino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Erica A. Vicentino', 'Erica', 'Almakin', 'Vicentino', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Garfield R. Perez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_500454_perez_garfield', 'garfield.perez@mati.edu.ph', 'Garfield R. Perez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Garfield R. Perez', 'Garfield', 'Recopelacion', 'Perez', 'principal_i', 'Values Education and Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129382 (67 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129382' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Rosa P. Alago
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_alago_rosa', 'rosa.alago@mati.edu.ph', 'Rosa P. Alago', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosa P. Alago', 'Rosa', 'Peñaflor', 'Alago', 'teacher_iii', 'BEED- GEN ED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Mabel S. Alimpoos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_alimpoos_mamabel', 'ma.mabel.alimpoos@mati.edu.ph', 'Ma. Mabel S. Alimpoos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Mabel S. Alimpoos', 'Ma. Mabel', 'Siblos', 'Alimpoos', 'teacher_ii', 'BEED- Gen Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Erlinda A. Bahandi
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_bahandi_erlinda', 'erlinda.bahandi@mati.edu.ph', 'Erlinda A. Bahandi', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Erlinda A. Bahandi', 'Erlinda', 'Apostol', 'Bahandi', 'master_teacher_i', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Misheilah Rea Florence M. Balugo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_balugo_misheilahreaflorence', 'misheilahreaflorence.balugo@mati.edu.ph', 'Misheilah Rea Florence M. Balugo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Misheilah Rea Florence M. Balugo', 'Misheilah Rea Florence', 'Matanggan', 'Balugo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine C. Bio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_bio_josephine', 'josephine.bio@mati.edu.ph', 'Josephine C. Bio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine C. Bio', 'Josephine', 'Codilla', 'Bio', 'teacher_ii', 'BEED- Gen Sci', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Emah A. Bon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_bon_mariaemah', 'mariaemah.bon@mati.edu.ph', 'Maria Emah A. Bon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Emah A. Bon', 'Maria Emah', 'Auxtero', 'Bon', 'teacher_i', 'BEED- Preschool', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenecielle R. Butron
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_butron_jenecielle', 'jenecielle.butron@mati.edu.ph', 'Jenecielle R. Butron', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenecielle R. Butron', 'Jenecielle', 'Roquero', 'Butron', 'teacher_iii', 'BEED/ MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juvy M. Cabillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_cabillo_juvy', 'juvy.cabillo@mati.edu.ph', 'Juvy M. Cabillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juvy M. Cabillo', 'Juvy', 'Macalinao', 'Cabillo', 'teacher_iii', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aileen S. Camilo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_camilo_aileen', 'aileen.camilo@mati.edu.ph', 'Aileen S. Camilo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aileen S. Camilo', 'Aileen', 'Sentinales', 'Camilo', 'teacher_iii', 'BEED/ MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Teresa A. Candia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_candia_mariateresa', 'mariateresa.candia@mati.edu.ph', 'Maria Teresa A. Candia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Teresa A. Candia', 'Maria Teresa', 'Agad', 'Candia', 'teacher_ii', 'BEED-Gen Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aileen B.. Castillones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_castillones_aileen', 'aileen.castillones@mati.edu.ph', 'Aileen B.. Castillones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aileen B.. Castillones', 'Aileen', 'Bacanto', 'Castillones', 'teacher_i', 'CAR in Doctoral Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mila M. Cuevas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_cuevas_mila', 'mila.cuevas@mati.edu.ph', 'Mila M. Cuevas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mila M. Cuevas', 'Mila', 'Marianito', 'Cuevas', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Proceso C. Dacillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_dacillo_proceso', 'proceso.dacillo@mati.edu.ph', '"Proceso C. Dacillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Proceso C. Dacillo', '"Proceso', 'Cuaton', 'Dacillo', 'teacher_i', 'T-III', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gem O. Dacua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_dacua_gem', 'gem.dacua@mati.edu.ph', 'Gem O. Dacua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gem O. Dacua', 'Gem', 'Otadoy', 'Dacua', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Yancy Ace I. Dacua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_dacua_yancyace', 'yancyace.dacua@mati.edu.ph', 'Yancy Ace I. Dacua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Yancy Ace I. Dacua', 'Yancy Ace', 'Indong', 'Dacua', 'teacher_i', 'BEED-GEN ED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sharlyn C. David
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_david_sharlyn', 'sharlyn.david@mati.edu.ph', 'Sharlyn C. David', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sharlyn C. David', 'Sharlyn', 'Cordeta', 'David', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Imelda S. Dela Cerna
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_delacerna_imelda', 'imelda.delacerna@mati.edu.ph', 'Imelda S. Dela Cerna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Imelda S. Dela Cerna', 'Imelda', 'Solibio', 'Dela Cerna', 'master_teacher_ii', 'BSA/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gina U. Del Castillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_delcastillo_gina', 'gina.delcastillo@mati.edu.ph', 'Gina U. Del Castillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gina U. Del Castillo', 'Gina', 'Amistoso', 'Del Castillo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Faith Del B. De Pio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_depio_faithdel', 'faithdel.depio@mati.edu.ph', 'Faith Del B. De Pio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Faith Del B. De Pio', 'Faith Del', 'Bayani', 'De Pio', 'teacher_i', 'BEED-GEN.SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Zerah Mae D. Espinosa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_espinosa_zerahmae', 'zerahmae.espinosa@mati.edu.ph', 'Zerah Mae D. Espinosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Zerah Mae D. Espinosa', 'Zerah Mae', 'Dumangas', 'Espinosa', 'teacher_ii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marjorie D. Esver
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_esver_marjorie', 'marjorie.esver@mati.edu.ph', 'Marjorie D. Esver', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marjorie D. Esver', 'Marjorie', 'Dacillo', 'Esver', 'teacher_ii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Villa G. Fabiaña
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_fabiaa_mariavilla', 'mariavilla.fabiaa@mati.edu.ph', 'Maria Villa G. Fabiaña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Villa G. Fabiaña', 'Maria Villa', 'Guimalan', 'Fabiaña', 'teacher_iii', 'BSED-Biology/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Paula Beave B. Fariñas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_farias_paulabeave', 'paulabeave.farias@mati.edu.ph', 'Paula Beave B. Fariñas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Paula Beave B. Fariñas', 'Paula Beave', 'Linguaje', 'Fariñas', 'teacher_i', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analou B. Ferrer
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_ferrer_analou', 'analou.ferrer@mati.edu.ph', 'Analou B. Ferrer', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analou B. Ferrer', 'Analou', 'Bandigan', 'Ferrer', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessie L. Gabaisen
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_gabaisen_jessie', 'jessie.gabaisen@mati.edu.ph', 'Jessie L. Gabaisen', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessie L. Gabaisen', 'Jessie', 'Lasaca', 'Gabaisen', 'teacher_iii', 'BEED/GEN.SCI./ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elizabeth B. Gayo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_gayo_elizabeth', 'elizabeth.gayo@mati.edu.ph', 'Elizabeth B. Gayo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elizabeth B. Gayo', 'Elizabeth', 'Bantayan', 'Gayo', 'teacher_iii', 'BEED- GEN Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charmaigne Krim S. Gregana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_gregana_charmaignekrim', 'charmaignekrim.gregana@mati.edu.ph', 'Charmaigne Krim S. Gregana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charmaigne Krim S. Gregana', 'Charmaigne Krim', 'Siman', 'Gregana', 'teacher_i', 'BEED- GEN Ed/MAED EM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lorna T. General
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_general_lorna', 'lorna.general@mati.edu.ph', 'Lorna T. General', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lorna T. General', 'Lorna', 'Tangonan', 'General', 'teacher_i', 'BEED/ MAED / DOCTORAL DEGREE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Karenn B. Gumban
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_gumban_karenn', 'karenn.gumban@mati.edu.ph', 'Karenn B. Gumban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Karenn B. Gumban', 'Karenn', 'Gayo', 'Gumban', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gilda N. Hermosisima
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_hermosisima_gilda', 'gilda.hermosisima@mati.edu.ph', 'Gilda N. Hermosisima', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gilda N. Hermosisima', 'Gilda', 'Nalogon', 'Hermosisima', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gene Paulette A. Hontanosas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_hontanosas_genepaulette', 'genepaulette.hontanosas@mati.edu.ph', 'Gene Paulette A. Hontanosas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gene Paulette A. Hontanosas', 'Gene Paulette', 'Abayon', 'Hontanosas', 'teacher_i', 'BEED- PRESCHOOL /MAED EDM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mae T. Lagrada
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_lagrada_mae', 'mae.lagrada@mati.edu.ph', 'Mae T. Lagrada', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae T. Lagrada', 'Mae', 'Tagas', 'Lagrada', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jerameh Joi D. Laguna
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_laguna_jeramehjoi', 'jeramehjoi.laguna@mati.edu.ph', 'Jerameh Joi D. Laguna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jerameh Joi D. Laguna', 'Jerameh Joi', 'Dacillo', 'Laguna', 'teacher_iii', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria- Chona I. Leopardas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_leopardas_mariachona', 'mariachona.leopardas@mati.edu.ph', 'Maria- Chona I. Leopardas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria- Chona I. Leopardas', 'Maria- Chona', 'Iris', 'Leopardas', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sarah Jean D. Luciano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_luciano_sarahjean', 'sarahjean.luciano@mati.edu.ph', 'Sarah Jean D. Luciano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sarah Jean D. Luciano', 'Sarah Jean', 'Dacillo', 'Luciano', 'teacher_i', 'BEED- GEN Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marjorie F. Magbaleta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_magbaleta_marjorie', 'marjorie.magbaleta@mati.edu.ph', 'Marjorie F. Magbaleta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marjorie F. Magbaleta', 'Marjorie', 'Fernandez', 'Magbaleta', 'teacher_ii', 'BSC', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine Lourdes C. Maglente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_maglente_christinelourdes', 'christinelourdes.maglente@mati.edu.ph', 'Christine Lourdes C. Maglente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine Lourdes C. Maglente', 'Christine Lourdes', 'Campos', 'Maglente', 'teacher_iii', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Margarita T. Mario
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_mario_margarita', 'margarita.mario@mati.edu.ph', 'Margarita T. Mario', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Margarita T. Mario', 'Margarita', 'Televez', 'Mario', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noriza A. Melendres
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_melendres_noriza', 'noriza.melendres@mati.edu.ph', 'Noriza A. Melendres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noriza A. Melendres', 'Noriza', 'Angie', 'Melendres', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dante T. Nucos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_nucos_dante', 'dante.nucos@mati.edu.ph', 'Dante T. Nucos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dante T. Nucos', 'Dante', 'Trazo', 'Nucos', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rubina A. Oliveros
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_oliveros_rubina', 'rubina.oliveros@mati.edu.ph', 'Rubina A. Oliveros', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rubina A. Oliveros', 'Rubina', 'Arisco', 'Oliveros', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Katrina Isabel C. Palacio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_palacio_katrinaisabel', 'katrinaisabel.palacio@mati.edu.ph', 'Katrina Isabel C. Palacio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Katrina Isabel C. Palacio', 'Katrina Isabel', 'Campion', 'Palacio', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emalyn L. Palmera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_palmera_emalyn', 'emalyn.palmera@mati.edu.ph', 'Emalyn L. Palmera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emalyn L. Palmera', 'Emalyn', 'Lad', 'Palmera', 'teacher_ii', 'BEED- GeN ED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Esther A. Payao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_payao_esther', 'esther.payao@mati.edu.ph', 'Esther A. Payao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Esther A. Payao', 'Esther', 'Adlawan', 'Payao', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elsie M. Peñaflor
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_peaflor_elsie', 'elsie.peaflor@mati.edu.ph', 'Elsie M. Peñaflor', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elsie M. Peñaflor', 'Elsie', 'Mates', 'Peñaflor', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wilson P. Peñaranda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_pearanda_wilson', 'wilson.pearanda@mati.edu.ph', 'Wilson P. Peñaranda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wilson P. Peñaranda', 'Wilson', 'Pachico', 'Peñaranda', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Miriam B. Peras
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_peras_miriam', 'miriam.peras@mati.edu.ph', 'Miriam B. Peras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Miriam B. Peras', 'Miriam', 'Peras', 'Peras', 'teacher_i', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leonardo G.. Pinanday
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_pinanday_leonardo', 'leonardo.pinanday@mati.edu.ph', 'Leonardo G.. Pinanday', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leonardo G.. Pinanday', 'Leonardo', 'Gonzales', 'Pinanday', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Isabelita C. Polinar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_polinar_isabelita', 'isabelita.polinar@mati.edu.ph', 'Isabelita C. Polinar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Isabelita C. Polinar', 'Isabelita', 'Cesar', 'Polinar', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Ann O. Pracullos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_pracullos_maryann', 'maryann.pracullos@mati.edu.ph', 'Mary Ann O. Pracullos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Ann O. Pracullos', 'Mary Ann', 'Ortiz', 'Pracullos', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Florie Lyn M. Rafol
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_rafol_florielyn', 'florielyn.rafol@mati.edu.ph', 'Florie Lyn M. Rafol', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Florie Lyn M. Rafol', 'Florie Lyn', 'Mabuslang', 'Rafol', 'teacher_ii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou D. Raga
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_raga_marilou', 'marilou.raga@mati.edu.ph', 'Marilou D. Raga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou D. Raga', 'Marilou', 'Dosono', 'Raga', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Evelyn S. Ramal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_ramal_evelyn', 'evelyn.ramal@mati.edu.ph', 'Evelyn S. Ramal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Evelyn S. Ramal', 'Evelyn', 'Sayson', 'Ramal', 'teacher_ii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shielah Rose A. Ramo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_ramo_shielahrose', 'shielahrose.ramo@mati.edu.ph', 'Shielah Rose A. Ramo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shielah Rose A. Ramo', 'Shielah Rose', 'Acuña', 'Ramo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aniriza S. Respecia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_respecia_aniriza', 'aniriza.respecia@mati.edu.ph', 'Aniriza S. Respecia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aniriza S. Respecia', 'Aniriza', 'Sanchez', 'Respecia', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mariebeth S. Rocamora
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_rocamora_mariebeth', 'mariebeth.rocamora@mati.edu.ph', 'Mariebeth S. Rocamora', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mariebeth S. Rocamora', 'Mariebeth', 'Sangcad', 'Rocamora', 'teacher_i', 'BEED- Preschool', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rey Jim F. Salva
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_salva_reyjim', 'reyjim.salva@mati.edu.ph', 'Rey Jim F. Salva', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rey Jim F. Salva', 'Rey Jim', 'Francisco', 'Salva', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sarah Gay A. Salva
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_salva_sarahgay', 'sarahgay.salva@mati.edu.ph', 'Sarah Gay A. Salva', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sarah Gay A. Salva', 'Sarah Gay', 'Azarias', 'Salva', 'teacher_i', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Malou A. Sayabo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_sayabo_malou', 'malou.sayabo@mati.edu.ph', 'Malou A. Sayabo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Malou A. Sayabo', 'Malou', 'Aguado', 'Sayabo', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eliseo P. Sibay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_sibay_eliseo', 'eliseo.sibay@mati.edu.ph', 'Eliseo P. Sibay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eliseo P. Sibay', 'Eliseo', 'Plaza', 'Sibay', 'teacher_iii', 'BEED/MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ana Lee C. Tabudlong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_tabudlong_analee', 'analee.tabudlong@mati.edu.ph', 'Ana Lee C. Tabudlong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ana Lee C. Tabudlong', 'Ana Lee', 'Cebu', 'Tabudlong', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Lie S.. Tumulac
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_tumulac_marylie', 'marylie.tumulac@mati.edu.ph', 'Mary Lie S.. Tumulac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Lie S.. Tumulac', 'Mary Lie', 'Simbajon', 'Tumulac', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Armi A.. Dungan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_dungan_armi', 'armi.dungan@mati.edu.ph', 'Armi A.. Dungan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Armi A.. Dungan', 'Armi', 'Ayala', 'Dungan', 'master_teacher_i', 'MA full-fledge-MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juvelyn C.. Grape
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_grape_juvelyn', 'juvelyn.grape@mati.edu.ph', 'Juvelyn C.. Grape', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juvelyn C.. Grape', 'Juvelyn', 'Cero', 'Grape', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Luisa F. Siblos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_siblos_maluisa', 'ma.luisa.siblos@mati.edu.ph', 'Ma. Luisa F. Siblos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Luisa F. Siblos', 'Ma. Luisa', 'Forones', 'Siblos', 'teacher_i', 'Secretarial', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Florentino T.. Pahuwayan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_pahuwayan_florentino', 'florentino.pahuwayan@mati.edu.ph', 'Florentino T.. Pahuwayan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Florentino T.. Pahuwayan', 'Florentino', 'Toledo', 'Pahuwayan', 'head_teacher_ii', 'Master Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marijo Q. Pajela
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129382_pajela_marijo', 'marijo.pajela@mati.edu.ph', 'Marijo Q. Pajela', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marijo Q. Pajela', 'Marijo', 'Queza', 'Pajela', 'principal_i', 'BEED/MAED/Ed.D units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129383 (35 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129383' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Stella C. Adesna
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_adesna_stella', 'stella.adesna@mati.edu.ph', 'Stella C. Adesna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Stella C. Adesna', 'Stella', 'Castro', 'Adesna', 'master_teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Manuel C. Adesna
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_adesna_manuel', 'manuel.adesna@mati.edu.ph', 'Manuel C. Adesna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Manuel C. Adesna', 'Manuel', 'Cadlum', 'Adesna', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Willie M. Añabeza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_aabeza_willie', 'willie.aabeza@mati.edu.ph', 'Willie M. Añabeza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Willie M. Añabeza', 'Willie', 'Magpayo', 'Añabeza', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovelyn A. Baongbaong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_baongbaong_jovelyn', 'jovelyn.baongbaong@mati.edu.ph', 'Jovelyn A. Baongbaong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovelyn A. Baongbaong', 'Jovelyn', 'Arce', 'Baongbaong', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocelyn C. Cagasan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_cagasan_jocelyn', 'jocelyn.cagasan@mati.edu.ph', 'Jocelyn C. Cagasan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocelyn C. Cagasan', 'Jocelyn', 'Codilla', 'Cagasan', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristine Diane D.. Catalan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_catalan_kristinediane', 'kristinediane.catalan@mati.edu.ph', 'Kristine Diane D.. Catalan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristine Diane D.. Catalan', 'Kristine Diane', 'Dongalo', 'Catalan', 'teacher_i', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Corazon . Dionaldo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_dionaldo_corazon', 'corazon.dionaldo@mati.edu.ph', 'Corazon . Dionaldo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Corazon . Dionaldo', 'Corazon', 'Adesna', 'Dionaldo', 'teacher_ii', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruthsel C. Culanag
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_culanag_ruthsel', 'ruthsel.culanag@mati.edu.ph', 'Ruthsel C. Culanag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruthsel C. Culanag', 'Ruthsel', 'Cervantes', 'Culanag', 'teacher_i', 'BEED/MAED UNITS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Abdul Yasser H.. Jabbarani
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_jabbarani_abdulyasser', 'abdulyasser.jabbarani@mati.edu.ph', 'Abdul Yasser H.. Jabbarani', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Abdul Yasser H.. Jabbarani', 'Abdul Yasser', '', 'Jabbarani', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Evangeline B. Ferrando
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_ferrando_evangeline', 'evangeline.ferrando@mati.edu.ph', 'Evangeline B. Ferrando', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Evangeline B. Ferrando', 'Evangeline', 'Baongbaong', 'Ferrando', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Isnaira A.. Garcia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_garcia_isnaira', 'isnaira.garcia@mati.edu.ph', 'Isnaira A.. Garcia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Isnaira A.. Garcia', 'Isnaira', 'Awang', 'Garcia', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emily Joy O. Gomez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_gomez_emilyjoy', 'emilyjoy.gomez@mati.edu.ph', 'Emily Joy O. Gomez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emily Joy O. Gomez', 'Emily Joy', 'Olea', 'Gomez', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Irish R. Gurion
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_gurion_irish', 'irish.gurion@mati.edu.ph', 'Irish R. Gurion', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Irish R. Gurion', 'Irish', 'Rebuyon', 'Gurion', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Jane C. Macado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_macado_maryjane', 'maryjane.macado@mati.edu.ph', 'Mary Jane C. Macado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Jane C. Macado', 'Mary Jane', 'Capistrano', 'Macado', 'teacher_iii', 'BSEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenelyn P. Mamada
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_mamada_jenelyn', 'jenelyn.mamada@mati.edu.ph', 'Jenelyn P. Mamada', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenelyn P. Mamada', 'Jenelyn', 'Panagsagan', 'Mamada', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gene A. Mamian
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_mamian_gene', 'gene.mamian@mati.edu.ph', 'Gene A. Mamian', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gene A. Mamian', 'Gene', 'Añana', 'Mamian', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ana Lourdes M. Salino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_salino_analourdes', 'analourdes.salino@mati.edu.ph', 'Ana Lourdes M. Salino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ana Lourdes M. Salino', 'Ana Lourdes', 'Manulat', 'Salino', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Beverly D. Obre
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_obre_beverly', 'beverly.obre@mati.edu.ph', 'Beverly D. Obre', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Beverly D. Obre', 'Beverly', 'de Erio', 'Obre', 'master_teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Randy S. Orio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_orio_randy', 'randy.orio@mati.edu.ph', 'Randy S. Orio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Randy S. Orio', 'Randy', 'Sudario', 'Orio', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilyn T. Palma Gil
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_palmagil_marilyn', 'marilyn.palmagil@mati.edu.ph', 'Marilyn T. Palma Gil', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilyn T. Palma Gil', 'Marilyn', 'Torreon', 'Palma Gil', 'master_teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Amparo D. Pacampara
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_pacampara_amparo', 'amparo.pacampara@mati.edu.ph', 'Amparo D. Pacampara', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Amparo D. Pacampara', 'Amparo', 'Dindin', 'Pacampara', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wenna L. Plaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_plaza_wenna', 'wenna.plaza@mati.edu.ph', 'Wenna L. Plaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wenna L. Plaza', 'Wenna', 'Lugatiman', 'Plaza', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jegina F. Raagas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_raagas_jegina', 'jegina.raagas@mati.edu.ph', 'Jegina F. Raagas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jegina F. Raagas', 'Jegina', 'Fajanil', 'Raagas', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Paraluman B. Polido
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_polido_paraluman', 'paraluman.polido@mati.edu.ph', 'Paraluman B. Polido', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Paraluman B. Polido', 'Paraluman', 'Botilla', 'Polido', 'teacher_i', 'BEED-PRESCHOOL/ MAED UNITS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Miraluna D. Rabuya
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_rabuya_miraluna', 'miraluna.rabuya@mati.edu.ph', 'Miraluna D. Rabuya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Miraluna D. Rabuya', 'Miraluna', 'de Erio', 'Rabuya', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheila C. Cresencio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_cresencio_sheila', 'sheila.cresencio@mati.edu.ph', 'Sheila C. Cresencio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheila C. Cresencio', 'Sheila', 'Castro', 'Cresencio', 'master_teacher_ii', 'BEED/MATGC', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jelaila A. Ventura
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_ventura_jelaila', 'jelaila.ventura@mati.edu.ph', 'Jelaila A. Ventura', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jelaila A. Ventura', 'Jelaila', 'Abanid', 'Ventura', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Louelle Q.. Roble
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_roble_louelle', 'louelle.roble@mati.edu.ph', 'Louelle Q.. Roble', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Louelle Q.. Roble', 'Louelle', 'Quiamco', 'Roble', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Lourdes Aisselle P. Villarente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_villarente_marylourdesaisselle', 'marylourdesaisselle.villarente@mati.edu.ph', 'Mary Lourdes Aisselle P. Villarente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Lourdes Aisselle P. Villarente', 'Mary Lourdes Aisselle', 'Padua', 'Villarente', 'teacher_i', 'BEED/MAED UNITS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jevelyn T. Agbong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_agbong_jevelyn', 'jevelyn.agbong@mati.edu.ph', 'Jevelyn T. Agbong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jevelyn T. Agbong', 'Jevelyn', 'Tadigon', 'Agbong', 'teacher_i', 'BSBIO/BEED UNITS/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Asliah . Mamailo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_mamailo_asliah', 'asliah.mamailo@mati.edu.ph', 'Asliah . Mamailo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Asliah . Mamailo', 'Asliah', 'Natha', 'Mamailo', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Leah Jean . Poderanan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_poderanan_maleahjean', 'ma.leahjean.poderanan@mati.edu.ph', 'Ma. Leah Jean . Poderanan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Leah Jean . Poderanan', 'Ma. Leah Jean', '', 'Poderanan', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maricris . Duay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_duay_maricris', 'maricris.duay@mati.edu.ph', 'Maricris . Duay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maricris . Duay', 'Maricris', '', 'Duay', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nancy . Comendador
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_comendador_nancy', 'nancy.comendador@mati.edu.ph', 'Nancy . Comendador', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nancy . Comendador', 'Nancy', 'Acebedo', 'Comendador', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sevelina R. Magno
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129383_magno_sevelina', 'sevelina.magno@mati.edu.ph', 'Sevelina R. Magno', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sevelina R. Magno', 'Sevelina', 'Responte', 'Magno', 'principal_i', 'Doctors Degree Aca. Requirements 52 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129386 (10 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129386' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Susan L. Castro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_castro_susan', 'susan.castro@mati.edu.ph', 'Susan L. Castro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Susan L. Castro', 'Susan', 'Lumahang', 'Castro', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anamie A. Corteciano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_corteciano_anamie', 'anamie.corteciano@mati.edu.ph', 'Anamie A. Corteciano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anamie A. Corteciano', 'Anamie', 'Arligue', 'Corteciano', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivy Mae D. Dadong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_dadong_ivymae', 'ivymae.dadong@mati.edu.ph', 'Ivy Mae D. Dadong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivy Mae D. Dadong', 'Ivy Mae', 'Digas', 'Dadong', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Careen Joy M. Elesio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_elesio_careenjoy', 'careenjoy.elesio@mati.edu.ph', 'Careen Joy M. Elesio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Careen Joy M. Elesio', 'Careen Joy', 'Mapayo', 'Elesio', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vinagin L. Cadayona
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_cadayona_vinagin', 'vinagin.cadayona@mati.edu.ph', 'Vinagin L. Cadayona', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vinagin L. Cadayona', 'Vinagin', 'Liguez', 'Cadayona', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hanielyn A. Magdipig
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_magdipig_hanielyn', 'hanielyn.magdipig@mati.edu.ph', 'Hanielyn A. Magdipig', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hanielyn A. Magdipig', 'Hanielyn', 'Arabilla', 'Magdipig', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marichu Y. Pascua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_pascua_marichu', 'marichu.pascua@mati.edu.ph', 'Marichu Y. Pascua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marichu Y. Pascua', 'Marichu', 'Yap', 'Pascua', 'teacher_iii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shiella Jane L. Patosa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_patosa_shiellajane', 'shiellajane.patosa@mati.edu.ph', 'Shiella Jane L. Patosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shiella Jane L. Patosa', 'Shiella Jane', 'Loquincio', 'Patosa', 'master_teacher_ii', 'BEED/MA (GRAD.) EDUCATION (Ed.D) MAJOR IN EDUCATIONAL 21 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juanillia S. Pototan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_pototan_juanillia', 'juanillia.pototan@mati.edu.ph', 'Juanillia S. Pototan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juanillia S. Pototan', 'Juanillia', 'Samosino', 'Pototan', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janice F. Barba
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129386_barba_janice', 'janice.barba@mati.edu.ph', 'Janice F. Barba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janice F. Barba', 'Janice', '', 'Barba', 'principal_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 205504 (45 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '205504' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Juliet C. Adlawan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_adlawan_juliet', 'juliet.adlawan@mati.edu.ph', 'Juliet C. Adlawan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juliet C. Adlawan', 'Juliet', 'Cañete', 'Adlawan', 'master_teacher_ii', 'BEED W/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Benjamin C. Angeles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_angeles_benjamin', 'benjamin.angeles@mati.edu.ph', 'Benjamin C. Angeles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Benjamin C. Angeles', 'Benjamin', 'Baldoza', 'Angeles', 'teacher_iii', 'BEED W/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julie Mae C. Bayog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_bayog_juliemae', 'juliemae.bayog@mati.edu.ph', 'Julie Mae C. Bayog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julie Mae C. Bayog', 'Julie Mae', 'Cotamora', 'Bayog', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rowena M. Casama
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_casama_rowena', 'rowena.casama@mati.edu.ph', 'Rowena M. Casama', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rowena M. Casama', 'Rowena', 'Marcera', 'Casama', 'teacher_ii', 'BEED W/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vanessa Mae A. Del Monte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_delmonte_vanessamae', 'vanessamae.delmonte@mati.edu.ph', 'Vanessa Mae A. Del Monte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vanessa Mae A. Del Monte', 'Vanessa Mae', 'Amolata', 'Del Monte', 'master_teacher_ii', 'MA full-fledge', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma.Maita B. Dimpas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_dimpas_mamaita', 'ma.maita.dimpas@mati.edu.ph', 'Ma.Maita B. Dimpas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma.Maita B. Dimpas', 'Ma.Maita', 'Busilaoco', 'Dimpas', 'teacher_i', 'BEED W/ MAED SPED 15 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vilma L. Fracisquete
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_fracisquete_vilma', 'vilma.fracisquete@mati.edu.ph', 'Vilma L. Fracisquete', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vilma L. Fracisquete', 'Vilma', 'Landasan', 'Fracisquete', 'teacher_iii', '"MA full-fledge', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marichu R. Garcia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_garcia_marichu', 'marichu.garcia@mati.edu.ph', 'Marichu R. Garcia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marichu R. Garcia', 'Marichu', 'Rebarbosa', 'Garcia', 'teacher_i', 'BEED W/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Beverly R. Indelible
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_indelible_beverly', 'beverly.indelible@mati.edu.ph', 'Beverly R. Indelible', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Beverly R. Indelible', 'Beverly', 'Requina', 'Indelible', 'master_teacher_ii', 'MA full-fledge', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joann V.. Lubiano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_lubiano_joann', 'joann.lubiano@mati.edu.ph', 'Joann V.. Lubiano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joann V.. Lubiano', 'Joann', 'Valles', 'Lubiano', 'teacher_i', 'BEED w/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vanessa P. Maranguit
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_maranguit_vanessa', 'vanessa.maranguit@mati.edu.ph', 'Vanessa P. Maranguit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vanessa P. Maranguit', 'Vanessa', 'Purisima', 'Maranguit', 'teacher_i', 'BEED MA W/ units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ronald Y. Maranguit
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_maranguit_ronald', 'ronald.maranguit@mati.edu.ph', 'Ronald Y. Maranguit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ronald Y. Maranguit', 'Ronald', 'Yap', 'Maranguit', 'teacher_i', 'BEED Grad.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sylvia A. Morales
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_morales_sylvia', 'sylvia.morales@mati.edu.ph', 'Sylvia A. Morales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sylvia A. Morales', 'Sylvia', 'Avila', 'Morales', 'teacher_i', 'BEED Grad.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annabelle D. Najial
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_najial_annabelle', 'annabelle.najial@mati.edu.ph', 'Annabelle D. Najial', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annabelle D. Najial', 'Annabelle', 'Dusal', 'Najial', 'teacher_i', 'MA full-fledge', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janice C. Olay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_olay_janice', 'janice.olay@mati.edu.ph', 'Janice C. Olay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janice C. Olay', 'Janice', 'Cañete', 'Olay', 'teacher_iii', 'BEED w/ MAED full fledged', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Araceli A. Pabuaya
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_pabuaya_araceli', 'araceli.pabuaya@mati.edu.ph', 'Araceli A. Pabuaya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Araceli A. Pabuaya', 'Araceli', 'Amarille', 'Pabuaya', 'teacher_i', 'BEED W/ MAED SPED 24 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vicenta A. 44
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_44_vicenta', 'vicenta.44@mati.edu.ph', 'Vicenta A. 44', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vicenta A. 44', 'Vicenta', 'Alameda', '44', 'teacher_i', 'BEED W/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ariel H. Paga
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_paga_ariel', 'ariel.paga@mati.edu.ph', 'Ariel H. Paga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ariel H. Paga', 'Ariel', 'Hinay', 'Paga', 'teacher_i', 'BEED W/ MAED SPED 38 units W/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fe D. Rama
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_rama_fe', 'fe.rama@mati.edu.ph', 'Fe D. Rama', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fe D. Rama', 'Fe', 'Dahunog', 'Rama', 'teacher_ii', 'BEED W/ MAED SPED 33 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analyn P. Sadino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_sadino_analyn', 'analyn.sadino@mati.edu.ph', 'Analyn P. Sadino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analyn P. Sadino', 'Analyn', 'Paguyan', 'Sadino', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruth S. Samson
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_samson_ruth', 'ruth.samson@mati.edu.ph', 'Ruth S. Samson', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruth S. Samson', 'Ruth', 'Sayman', 'Samson', 'teacher_iii', 'BEED w/ MAED full-fledge', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Billaluza S. Sagpang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_sagpang_billaluza', 'billaluza.sagpang@mati.edu.ph', 'Billaluza S. Sagpang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Billaluza S. Sagpang', 'Billaluza', 'Samosino', 'Sagpang', 'teacher_i', 'BEED W/ MAED 36 UNITS W/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julie B. Sumimba
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_sumimba_julie', 'julie.sumimba@mati.edu.ph', 'Julie B. Sumimba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julie B. Sumimba', 'Julie', 'Bacalso', 'Sumimba', 'teacher_i', 'W/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cecilia B. Vidoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_vidoy_cecilia', 'cecilia.vidoy@mati.edu.ph', 'Cecilia B. Vidoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cecilia B. Vidoy', 'Cecilia', 'Baulos', 'Vidoy', 'principal_i', 'BS - Secondary W/ MED-SPED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Russell O. Villarente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_villarente_russell', 'russell.villarente@mati.edu.ph', 'Russell O. Villarente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Russell O. Villarente', 'Russell', 'Ombon', 'Villarente', 'teacher_iii', 'BEED W/ MA CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alyssa P. Escuadro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_escuadro_alyssa', 'alyssa.escuadro@mati.edu.ph', 'Alyssa P. Escuadro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alyssa P. Escuadro', 'Alyssa', 'Pateros', 'Escuadro', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Regine . Araneta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_araneta_regine', 'regine.araneta@mati.edu.ph', 'Regine . Araneta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Regine . Araneta', 'Regine', '', 'Araneta', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Berna Mae Grace L.. Taganas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_taganas_bernamaegrace', 'bernamaegrace.taganas@mati.edu.ph', 'Berna Mae Grace L.. Taganas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Berna Mae Grace L.. Taganas', 'Berna Mae Grace', '', 'Taganas', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lita Louiela T. Apiag
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_apiag_litalouiela', 'litalouiela.apiag@mati.edu.ph', 'Lita Louiela T. Apiag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lita Louiela T. Apiag', 'Lita Louiela', 'Toloy', 'Apiag', 'principal_i', 'BEED MA full fledged  & MAED SPED  33 units W/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah N. Carpio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_carpio_leah', 'leah.carpio@mati.edu.ph', 'Leah N. Carpio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah N. Carpio', 'Leah', 'Narciso', 'Carpio', 'principal_i', 'BEED MAED SPED 33 unit w/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mila Flor S. De Gracia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_degracia_milaflor', 'milaflor.degracia@mati.edu.ph', 'Mila Flor S. De Gracia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mila Flor S. De Gracia', 'Mila Flor', 'Sasam', 'De Gracia', 'principal_i', 'BEED MAED SPED 33 unit w/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeanilyn B. Ignacio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_ignacio_jeanilyn', 'jeanilyn.ignacio@mati.edu.ph', 'Jeanilyn B. Ignacio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeanilyn B. Ignacio', 'Jeanilyn', 'Bunos', 'Ignacio', 'principal_i', 'BEED MAED SPED 36 units w/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Genevieve P. Cagas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_cagas_genevieve', 'genevieve.cagas@mati.edu.ph', 'Genevieve P. Cagas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Genevieve P. Cagas', 'Genevieve', 'Pepito', 'Cagas', 'principal_i', 'BEED W/ MA CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Veryle M. Boyles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_boyles_veryle', 'veryle.boyles@mati.edu.ph', 'Veryle M. Boyles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Veryle M. Boyles', 'Veryle', 'Maypa', 'Boyles', 'principal_i', 'W/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gina C. Damban
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_damban_gina', 'gina.damban@mati.edu.ph', 'Gina C. Damban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gina C. Damban', 'Gina', 'Cereno', 'Damban', 'principal_i', 'BEED W/ MED-SPED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosemarie E. Maglimong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_maglimong_rosemarie', 'rosemarie.maglimong@mati.edu.ph', 'Rosemarie E. Maglimong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosemarie E. Maglimong', 'Rosemarie', 'Espinosa', 'Maglimong', 'principal_i', 'BEED W/ MAED-SPED 38 units W/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Amihan Ayesa T.. Mapansa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_mapansa_amihanayesa', 'amihanayesa.mapansa@mati.edu.ph', 'Amihan Ayesa T.. Mapansa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Amihan Ayesa T.. Mapansa', 'Amihan Ayesa', 'Turlao', 'Mapansa', 'principal_i', 'BEED Grad(SPED) with MAED-SPED units (33)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rica Andrea L. Rubillar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_rubillar_ricaandrea', 'ricaandrea.rubillar@mati.edu.ph', 'Rica Andrea L. Rubillar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rica Andrea L. Rubillar', 'Rica Andrea', 'Linzag', 'Rubillar', 'principal_i', 'BEED Grad(SPED) W/ MAED SPED W/CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bonifacio M. Sebastian
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_sebastian_bonifacio', 'bonifacio.sebastian@mati.edu.ph', 'Bonifacio M. Sebastian', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bonifacio M. Sebastian', 'Bonifacio', 'Mondejar', 'Sebastian', 'principal_i', 'BEED W/ MAED SPED 38 units W/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rachel O. Sebastian
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_sebastian_rachel', 'rachel.sebastian@mati.edu.ph', 'Rachel O. Sebastian', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rachel O. Sebastian', 'Rachel', 'Oliveros', 'Sebastian', 'principal_i', 'BEED W/ MAED SPED W/ CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou P. Velvestre
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_velvestre_marilou', 'marilou.velvestre@mati.edu.ph', 'Marilou P. Velvestre', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou P. Velvestre', 'Marilou', 'Pleños', 'Velvestre', 'principal_i', 'BEED W/ MED-SPED 38 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cecilia B. Vidoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_vidoy_cecilia', 'cecilia.vidoy@mati.edu.ph', 'Cecilia B. Vidoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cecilia B. Vidoy', 'Cecilia', 'Baulos', 'Vidoy', 'master_teacher_i', 'BS - Secondary W/ MED-SPED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Crestelle C. Vitanzos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_vitanzos_crestelle', 'crestelle.vitanzos@mati.edu.ph', 'Crestelle C. Vitanzos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Crestelle C. Vitanzos', 'Crestelle', 'Cena', 'Vitanzos', 'principal_i', 'BEED Grad(SPED)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noriebel F. Pahid
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_pahid_noriebel', 'noriebel.pahid@mati.edu.ph', 'Noriebel F. Pahid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noriebel F. Pahid', 'Noriebel', 'Francisco', 'Pahid', 'principal_i', 'BEED Grad(SPED)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ramil G.. Awa-ao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_205504_awaao_ramil', 'ramil.awaao@mati.edu.ph', 'Ramil G.. Awa-ao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ramil G.. Awa-ao', 'Ramil', 'Gagarin', 'Awa-ao', 'principal_i', '"BSMATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129380 (43 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129380' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Natalie A. Albao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_albao_natalie', 'natalie.albao@mati.edu.ph', 'Natalie A. Albao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Natalie A. Albao', 'Natalie', 'Adlawan', 'Albao', 'master_teacher_ii', 'BEED/MST Gen. Sci. with EdD units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hershey P. Alterado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_alterado_hershey', 'hershey.alterado@mati.edu.ph', 'Hershey P. Alterado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hershey P. Alterado', 'Hershey', 'Pawai', 'Alterado', 'teacher_iii', 'BEED GEN-SCI/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melinda B. Ancao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_ancao_melinda', 'melinda.ancao@mati.edu.ph', 'Melinda B. Ancao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melinda B. Ancao', 'Melinda', 'Bandigan', 'Ancao', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Orlando M. Andan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_andan_orlando', 'orlando.andan@mati.edu.ph', 'Orlando M. Andan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Orlando M. Andan', 'Orlando', 'Manuel', 'Andan', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Miralona B. Andan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_andan_miralona', 'miralona.andan@mati.edu.ph', 'Miralona B. Andan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Miralona B. Andan', 'Miralona', 'Bagsac', 'Andan', 'teacher_iii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angeline Joy P. Barrientos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_barrientos_angelinejoy', 'angelinejoy.barrientos@mati.edu.ph', 'Angeline Joy P. Barrientos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angeline Joy P. Barrientos', 'Angeline Joy', 'Pelonita', 'Barrientos', 'teacher_i', 'BSED Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josefina D. Beloria
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_beloria_josefina', 'josefina.beloria@mati.edu.ph', 'Josefina D. Beloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josefina D. Beloria', 'Josefina', 'Dizon', 'Beloria', 'teacher_iii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cenith Marthyn R.. Binocal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_binocal_cenithmarthyn', 'cenithmarthyn.binocal@mati.edu.ph', 'Cenith Marthyn R.. Binocal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cenith Marthyn R.. Binocal', 'Cenith Marthyn', 'Ranulo', 'Binocal', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Irma Edeliza M. Bustamante
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_bustamante_irmaedeliza', 'irmaedeliza.bustamante@mati.edu.ph', 'Irma Edeliza M. Bustamante', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Irma Edeliza M. Bustamante', 'Irma Edeliza', 'Mamilic', 'Bustamante', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nora B. Cagunda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_cagunda_nora', 'nora.cagunda@mati.edu.ph', 'Nora B. Cagunda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nora B. Cagunda', 'Nora', 'Bocateja', 'Cagunda', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Berminda M. Cartalla
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_cartalla_berminda', 'berminda.cartalla@mati.edu.ph', 'Berminda M. Cartalla', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Berminda M. Cartalla', 'Berminda', 'Malintad', 'Cartalla', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosenda N. Cobacha
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_cobacha_rosenda', 'rosenda.cobacha@mati.edu.ph', 'Rosenda N. Cobacha', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosenda N. Cobacha', 'Rosenda', 'Nishiguchi', 'Cobacha', 'teacher_iii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joycy O. Cole
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_cole_joycy', 'joycy.cole@mati.edu.ph', 'Joycy O. Cole', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joycy O. Cole', 'Joycy', 'Odiaman', 'Cole', 'teacher_ii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheila Jean D. Dacillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_dacillo_sheilajean', 'sheilajean.dacillo@mati.edu.ph', 'Sheila Jean D. Dacillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheila Jean D. Dacillo', 'Sheila Jean', 'Dumangas', 'Dacillo', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Brenda Joy F. Dela Cruz
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_delacruz_brendajoy', 'brendajoy.delacruz@mati.edu.ph', 'Brenda Joy F. Dela Cruz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Brenda Joy F. Dela Cruz', 'Brenda Joy', 'Fajanil', 'Dela Cruz', 'teacher_iii', 'BEED/MAEd', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daisy Lyn N. Delgado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_delgado_daisylyn', 'daisylyn.delgado@mati.edu.ph', 'Daisy Lyn N. Delgado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisy Lyn N. Delgado', 'Daisy Lyn', 'Neñeza', 'Delgado', 'teacher_ii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Genevieve A. Gabaisen
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_gabaisen_genevieve', 'genevieve.gabaisen@mati.edu.ph', 'Genevieve A. Gabaisen', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Genevieve A. Gabaisen', 'Genevieve', 'Angelitud', 'Gabaisen', 'teacher_iii', 'BEED/GEN.SCI with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leonie Rose D. Ligad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_ligad_leonierose', 'leonierose.ligad@mati.edu.ph', 'Leonie Rose D. Ligad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leonie Rose D. Ligad', 'Leonie Rose', 'Doping', 'Ligad', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charito A. Lindo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_lindo_charito', 'charito.lindo@mati.edu.ph', 'Charito A. Lindo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charito A. Lindo', 'Charito', 'Arles', 'Lindo', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Frenshey P. Llanita
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_llanita_frenshey', 'frenshey.llanita@mati.edu.ph', 'Frenshey P. Llanita', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Frenshey P. Llanita', 'Frenshey', 'Pawai', 'Llanita', 'master_teacher_i', 'BEED/MAED/EdD', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Glenda S. Loquincio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_loquincio_glenda', 'glenda.loquincio@mati.edu.ph', 'Glenda S. Loquincio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Glenda S. Loquincio', 'Glenda', 'Sabong', 'Loquincio', 'teacher_iii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Quirino II M. Lucas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_lucas_quirinoii', 'quirinoii.lucas@mati.edu.ph', 'Quirino II M. Lucas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Quirino II M. Lucas', 'Quirino II', 'Mendoza', 'Lucas', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Pia Mae B. Monta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_monta_piamae', 'piamae.monta@mati.edu.ph', 'Pia Mae B. Monta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Pia Mae B. Monta', 'Pia Mae', 'Belsonda', 'Monta', 'teacher_iii', 'BHE/MAED with EdD units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessette S. Nonong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_nonong_jessette', 'jessette.nonong@mati.edu.ph', 'Jessette S. Nonong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessette S. Nonong', 'Jessette', 'Sotomayor', 'Nonong', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rogen K. Padilla
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_padilla_rogen', 'rogen.padilla@mati.edu.ph', 'Rogen K. Padilla', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rogen K. Padilla', 'Rogen', 'Kaparas', 'Padilla', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosel A. Pandac
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_pandac_rosel', 'rosel.pandac@mati.edu.ph', 'Rosel A. Pandac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosel A. Pandac', 'Rosel', 'Alderite', 'Pandac', 'teacher_iii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shella S. Pucan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_pucan_shella', 'shella.pucan@mati.edu.ph', 'Shella S. Pucan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shella S. Pucan', 'Shella', 'Solibio', 'Pucan', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lilian V. Quiñal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_quial_lilian', 'lilian.quial@mati.edu.ph', 'Lilian V. Quiñal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lilian V. Quiñal', 'Lilian', 'Villapaña', 'Quiñal', 'teacher_iii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Glynda Fe B. Quiñones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_quiones_glyndafe', 'glyndafe.quiones@mati.edu.ph', 'Glynda Fe B. Quiñones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Glynda Fe B. Quiñones', 'Glynda Fe', 'Bautista', 'Quiñones', 'teacher_iii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dymna D. Ronolo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_ronolo_dymna', 'dymna.ronolo@mati.edu.ph', 'Dymna D. Ronolo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dymna D. Ronolo', 'Dymna', 'Diansay', 'Ronolo', 'master_teacher_ii', 'BEED/MEd/PhD', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lailanie L. Rubillar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_rubillar_lailanie', 'lailanie.rubillar@mati.edu.ph', 'Lailanie L. Rubillar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lailanie L. Rubillar', 'Lailanie', 'Linzag', 'Rubillar', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Myla B. Samson
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_samson_myla', 'myla.samson@mati.edu.ph', 'Myla B. Samson', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Myla B. Samson', 'Myla', 'Barrido', 'Samson', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Madelyn F. Sanchez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_sanchez_madelyn', 'madelyn.sanchez@mati.edu.ph', 'Madelyn F. Sanchez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Madelyn F. Sanchez', 'Madelyn', 'Figura', 'Sanchez', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rodelyn D. Selehencia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_selehencia_rodelyn', 'rodelyn.selehencia@mati.edu.ph', 'Rodelyn D. Selehencia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rodelyn D. Selehencia', 'Rodelyn', 'Del Campo', 'Selehencia', 'master_teacher_ii', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Willy B. Seprado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_seprado_willy', 'willy.seprado@mati.edu.ph', 'Willy B. Seprado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Willy B. Seprado', 'Willy', 'Bernaldez', 'Seprado', 'teacher_iii', 'BEED/MST with EdD units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aileen G. Seprado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_seprado_aileen', 'aileen.seprado@mati.edu.ph', 'Aileen G. Seprado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aileen G. Seprado', 'Aileen', 'Gonzaga', 'Seprado', 'teacher_iii', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Grace L. Sinon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_sinon_marygrace', 'marygrace.sinon@mati.edu.ph', 'Mary Grace L. Sinon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Grace L. Sinon', 'Mary Grace', 'Laydan', 'Sinon', 'teacher_i', 'BSED Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Ann P. Sucobos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_sucobos_maryann', 'maryann.sucobos@mati.edu.ph', 'Mary Ann P. Sucobos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Ann P. Sucobos', 'Mary Ann', 'Pardillo', 'Sucobos', 'teacher_iii', 'BEED/MEd', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jomelyn R. Sumondong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_sumondong_jomelyn', 'jomelyn.sumondong@mati.edu.ph', 'Jomelyn R. Sumondong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jomelyn R. Sumondong', 'Jomelyn', 'Rabanos', 'Sumondong', 'teacher_ii', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocelyn C. Tabanao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_tabanao_jocelyn', 'jocelyn.tabanao@mati.edu.ph', 'Jocelyn C. Tabanao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocelyn C. Tabanao', 'Jocelyn', 'Caldelero', 'Tabanao', 'master_teacher_ii', 'BEED/MST Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristina Q. Joe
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_joe_kristina', 'kristina.joe@mati.edu.ph', 'Kristina Q. Joe', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristina Q. Joe', 'Kristina', 'Quiñones', 'Joe', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juland A. Olay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_olay_juland', 'juland.olay@mati.edu.ph', 'Juland A. Olay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juland A. Olay', 'Juland', 'Asumbrado', 'Olay', 'teacher_i', 'BEED with M.A Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Alciel B. Garcia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129380_garcia_mariaalciel', 'mariaalciel.garcia@mati.edu.ph', 'Maria Alciel B. Garcia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Alciel B. Garcia', 'Maria Alciel', 'Bordas', 'Garcia', 'principal_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129381 (46 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129381' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Anabel C. Aguado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_aguado_anabel', 'anabel.aguado@mati.edu.ph', 'Anabel C. Aguado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anabel C. Aguado', 'Anabel', 'Costelo', 'Aguado', 'teacher_iii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eva Mae A. Alas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_alas_evamae', 'evamae.alas@mati.edu.ph', 'Eva Mae A. Alas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eva Mae A. Alas', 'Eva Mae', 'Angelitud', 'Alas', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shara Allysa S. Almonte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_almonte_sharaallysa', 'sharaallysa.almonte@mati.edu.ph', 'Shara Allysa S. Almonte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shara Allysa S. Almonte', 'Shara Allysa', 'Samante', 'Almonte', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mike A. Apostol
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_apostol_mike', 'mike.apostol@mati.edu.ph', 'Mike A. Apostol', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mike A. Apostol', 'Mike', 'Autentico', 'Apostol', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovey Marie S. Bandigan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_bandigan_loveymarie', 'loveymarie.bandigan@mati.edu.ph', 'Lovey Marie S. Bandigan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovey Marie S. Bandigan', 'Lovey Marie', 'Sibonga', 'Bandigan', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elvie T. Bentayao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_bentayao_elvie', 'elvie.bentayao@mati.edu.ph', 'Elvie T. Bentayao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elvie T. Bentayao', 'Elvie', 'Tambilawan', 'Bentayao', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jhulia Clarette T. Boybanting
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_boybanting_jhuliaclarette', 'jhuliaclarette.boybanting@mati.edu.ph', 'Jhulia Clarette T. Boybanting', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jhulia Clarette T. Boybanting', 'Jhulia Clarette', 'Trinidad', 'Boybanting', 'teacher_i', 'BEED (ECE)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nancy V. Bucio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_bucio_nancy', 'nancy.bucio@mati.edu.ph', 'Nancy V. Bucio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nancy V. Bucio', 'Nancy', 'Villanueva', 'Bucio', 'teacher_ii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosario T. Buñales
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_buales_rosario', 'rosario.buales@mati.edu.ph', 'Rosario T. Buñales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosario T. Buñales', 'Rosario', 'Tumambing', 'Buñales', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Redentor M. Calvez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_calvez_redentor', 'redentor.calvez@mati.edu.ph', 'Redentor M. Calvez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Redentor M. Calvez', 'Redentor', 'Malintad', 'Calvez', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine L. Cangayda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_cangayda_josephine', 'josephine.cangayda@mati.edu.ph', 'Josephine L. Cangayda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine L. Cangayda', 'Josephine', 'Lomonsod', 'Cangayda', 'teacher_ii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rachel M. Colaba
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_colaba_rachel', 'rachel.colaba@mati.edu.ph', 'Rachel M. Colaba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rachel M. Colaba', 'Rachel', 'Mongaya', 'Colaba', 'teacher_iii', 'MA full-fledge-MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fatima B. De Pio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_depio_fatima', 'fatima.depio@mati.edu.ph', 'Fatima B. De Pio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fatima B. De Pio', 'Fatima', 'Bayani', 'De Pio', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Milagros L. Dumadaug
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_dumadaug_milagros', 'milagros.dumadaug@mati.edu.ph', 'Milagros L. Dumadaug', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Milagros L. Dumadaug', 'Milagros', 'Laurel', 'Dumadaug', 'teacher_iii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- May Precious O.. Dupa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_dupa_mayprecious', 'mayprecious.dupa@mati.edu.ph', 'May Precious O.. Dupa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'May Precious O.. Dupa', 'May Precious', 'Orenio', 'Dupa', 'teacher_i', 'BEED (SPED)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marites M. Gudmalin
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_gudmalin_marites', 'marites.gudmalin@mati.edu.ph', 'Marites M. Gudmalin', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marites M. Gudmalin', 'Marites', 'Manila', 'Gudmalin', 'master_teacher_i', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jhosa Clanel M.. Halasan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_halasan_jhosaclanel', 'jhosaclanel.halasan@mati.edu.ph', 'Jhosa Clanel M.. Halasan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jhosa Clanel M.. Halasan', 'Jhosa Clanel', 'Mawalic', 'Halasan', 'teacher_iii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nenita A. Linsag
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_linsag_nenita', 'nenita.linsag@mati.edu.ph', 'Nenita A. Linsag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nenita A. Linsag', 'Nenita', 'Alo', 'Linsag', 'master_teacher_i', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alma N. Lituañas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_lituaas_alma', 'alma.lituaas@mati.edu.ph', 'Alma N. Lituañas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alma N. Lituañas', 'Alma', 'Nietes', 'Lituañas', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emelia C. Maglente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_maglente_emelia', 'emelia.maglente@mati.edu.ph', 'Emelia C. Maglente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emelia C. Maglente', 'Emelia', 'Campos', 'Maglente', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dante G. Manlupig
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_manlupig_dante', 'dante.manlupig@mati.edu.ph', 'Dante G. Manlupig', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dante G. Manlupig', 'Dante', 'Gonzalo', 'Manlupig', 'teacher_iii', 'MA full-fledge-MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anabelle T. Masanguid
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_masanguid_anabelle', 'anabelle.masanguid@mati.edu.ph', 'Anabelle T. Masanguid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anabelle T. Masanguid', 'Anabelle', 'Tanio', 'Masanguid', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lullete M. Matapid
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_matapid_lullete', 'lullete.matapid@mati.edu.ph', 'Lullete M. Matapid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lullete M. Matapid', 'Lullete', 'Matalang', 'Matapid', 'teacher_i', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovelyn S. Mayantang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_mayantang_jovelyn', 'jovelyn.mayantang@mati.edu.ph', 'Jovelyn S. Mayantang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovelyn S. Mayantang', 'Jovelyn', 'Saavedra', 'Mayantang', 'teacher_i', 'BSBM with Ed units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anna Villa T. Narciso
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_narciso_annavilla', 'annavilla.narciso@mati.edu.ph', 'Anna Villa T. Narciso', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anna Villa T. Narciso', 'Anna Villa', 'Torregosa', 'Narciso', 'teacher_ii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ira Joy A. Pacalioga
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_pacalioga_irajoy', 'irajoy.pacalioga@mati.edu.ph', 'Ira Joy A. Pacalioga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ira Joy A. Pacalioga', 'Ira Joy', 'Abarca', 'Pacalioga', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenefer T. Padada
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_padada_jenefer', 'jenefer.padada@mati.edu.ph', 'Jenefer T. Padada', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenefer T. Padada', 'Jenefer', 'Tampoog', 'Padada', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nanith G. Paga
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_paga_nanith', 'nanith.paga@mati.edu.ph', 'Nanith G. Paga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nanith G. Paga', 'Nanith', 'Gonzales', 'Paga', 'master_teacher_i', 'BEED MAED T.E', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lalaine S. Paterno
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_paterno_lalaine', 'lalaine.paterno@mati.edu.ph', 'Lalaine S. Paterno', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lalaine S. Paterno', 'Lalaine', 'Sabello', 'Paterno', 'teacher_iii', 'BSC w/ Ed units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mark Sean A. Quiñones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_quiones_marksean', 'marksean.quiones@mati.edu.ph', 'Mark Sean A. Quiñones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mark Sean A. Quiñones', 'Mark Sean', 'Agapay', 'Quiñones', 'master_teacher_i', 'MA full-fledge-Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lilibeth D. Rama
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_rama_lilibeth', 'lilibeth.rama@mati.edu.ph', 'Lilibeth D. Rama', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lilibeth D. Rama', 'Lilibeth', 'Dumadag', 'Rama', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Neri C. Responte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_responte_neri', 'neri.responte@mati.edu.ph', 'Neri C. Responte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Neri C. Responte', 'Neri', 'Cinco', 'Responte', 'teacher_i', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Aurelio C. Responte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_responte_aurelio', 'aurelio.responte@mati.edu.ph', '"Aurelio C. Responte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Aurelio C. Responte', '"Aurelio', 'Cinco', 'Responte', 'teacher_i', 'T-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Agnes O. Risonar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_risonar_agnes', 'agnes.risonar@mati.edu.ph', 'Agnes O. Risonar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Agnes O. Risonar', 'Agnes', 'Ordaneza', 'Risonar', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ronald A. Rodriguez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_rodriguez_ronald', 'ronald.rodriguez@mati.edu.ph', 'Ronald A. Rodriguez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ronald A. Rodriguez', 'Ronald', 'Arcanses', 'Rodriguez', 'teacher_i', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alvira P. Salazar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_salazar_alvira', 'alvira.salazar@mati.edu.ph', 'Alvira P. Salazar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alvira P. Salazar', 'Alvira', 'Pateros', 'Salazar', 'teacher_ii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charina R. Saucejo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_saucejo_charina', 'charina.saucejo@mati.edu.ph', 'Charina R. Saucejo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charina R. Saucejo', 'Charina', 'Rondina', 'Saucejo', 'teacher_iii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Judith A. Teodoro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_teodoro_judith', 'judith.teodoro@mati.edu.ph', 'Judith A. Teodoro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Judith A. Teodoro', 'Judith', 'Antonio', 'Teodoro', 'teacher_iii', 'BEED w/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mercy Rose M. Tulio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_tulio_mercyrose', 'mercyrose.tulio@mati.edu.ph', 'Mercy Rose M. Tulio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mercy Rose M. Tulio', 'Mercy Rose', 'Masucol', 'Tulio', 'teacher_i', 'BEED w/ 15 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Louie Raniel James R. Villamor
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_villamor_louieranieljames', 'louieranieljames.villamor@mati.edu.ph', 'Louie Raniel James R. Villamor', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Louie Raniel James R. Villamor', 'Louie Raniel James', 'Rasonable', 'Villamor', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janis Clotilde O. Ongcay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_ongcay_janisclotilde', 'janisclotilde.ongcay@mati.edu.ph', 'Janis Clotilde O. Ongcay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janis Clotilde O. Ongcay', 'Janis Clotilde', 'Olea', 'Ongcay', 'teacher_i', 'BEED with M.A Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa Mar R. Mariaca
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_mariaca_jessamar', 'jessamar.mariaca@mati.edu.ph', 'Jessa Mar R. Mariaca', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa Mar R. Mariaca', 'Jessa Mar', 'Revilla', 'Mariaca', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anna Rose V. Rosal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_rosal_annarose', 'annarose.rosal@mati.edu.ph', 'Anna Rose V. Rosal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anna Rose V. Rosal', 'Anna Rose', 'Venia', 'Rosal', 'teacher_i', 'BSA', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine Joy C. Mapando
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_mapando_christinejoy', 'christinejoy.mapando@mati.edu.ph', 'Christine Joy C. Mapando', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine Joy C. Mapando', 'Christine Joy', 'Calig-onan', 'Mapando', 'teacher_i', 'BSIT', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jecelle S. Costan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_costan_jecelle', 'jecelle.costan@mati.edu.ph', 'Jecelle S. Costan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jecelle S. Costan', 'Jecelle', 'Sardido', 'Costan', 'teacher_i', 'BSBA', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rommel J. Maglente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129381_maglente_rommel', 'rommel.maglente@mati.edu.ph', 'Rommel J. Maglente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rommel J. Maglente', 'Rommel', 'Jimenez', 'Maglente', 'principal_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129384 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129384' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Joylyn G.. Costelo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_costelo_joylyn', 'joylyn.costelo@mati.edu.ph', 'Joylyn G.. Costelo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joylyn G.. Costelo', 'Joylyn', 'Sambling', 'Costelo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Franklin B. Lucero
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_lucero_franklin', 'franklin.lucero@mati.edu.ph', 'Franklin B. Lucero', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Franklin B. Lucero', 'Franklin', 'Bolambot', 'Lucero', 'teacher_ii', 'BEED with M.A Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ginalynn P.. Pagnanawon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_pagnanawon_ginalynn', 'ginalynn.pagnanawon@mati.edu.ph', 'Ginalynn P.. Pagnanawon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ginalynn P.. Pagnanawon', 'Ginalynn', 'Pangasate', 'Pagnanawon', 'teacher_i', 'BEED Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christian Ian E. Maglimong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_maglimong_christianian', 'christianian.maglimong@mati.edu.ph', 'Christian Ian E. Maglimong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christian Ian E. Maglimong', 'Christian Ian', 'Espinosa', 'Maglimong', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analie C. Maglimong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_maglimong_analie', 'analie.maglimong@mati.edu.ph', 'Analie C. Maglimong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analie C. Maglimong', 'Analie', 'Catado', 'Maglimong', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eva Lynn G. Manongas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_manongas_evalynn', 'evalynn.manongas@mati.edu.ph', 'Eva Lynn G. Manongas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eva Lynn G. Manongas', 'Eva Lynn', 'Gonzales', 'Manongas', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jorah S. Sanchez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_sanchez_jorah', 'jorah.sanchez@mati.edu.ph', 'Jorah S. Sanchez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jorah S. Sanchez', 'Jorah', 'Minglana', 'Sanchez', 'teacher_i', 'Doctoral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Geneva S. Maglimong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_maglimong_geneva', 'geneva.maglimong@mati.edu.ph', 'Geneva S. Maglimong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Geneva S. Maglimong', 'Geneva', 'Sumaya', 'Maglimong', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sol C.. Marcial
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129384_marcial_sol', 'sol.marcial@mati.edu.ph', 'Sol C.. Marcial', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sol C.. Marcial', 'Sol', '', 'Marcial', 'teacher_i', 'Ed.D.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129385 (29 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129385' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Medita B. Baay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_baay_medita', 'medita.baay@mati.edu.ph', 'Medita B. Baay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Medita B. Baay', 'Medita', 'Bilbao', 'Baay', 'teacher_iii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Meldeliza C. Balili
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_balili_meldeliza', 'meldeliza.balili@mati.edu.ph', 'Meldeliza C. Balili', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Meldeliza C. Balili', 'Meldeliza', 'Cirera', 'Balili', 'teacher_ii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bryan Ernie S. Bordas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_bordas_bryanernie', 'bryanernie.bordas@mati.edu.ph', 'Bryan Ernie S. Bordas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bryan Ernie S. Bordas', 'Bryan Ernie', 'Soliven', 'Bordas', 'teacher_i', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joylyn B. Cagunda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_cagunda_joylyn', 'joylyn.cagunda@mati.edu.ph', 'Joylyn B. Cagunda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joylyn B. Cagunda', 'Joylyn', 'Bocateja', 'Cagunda', 'teacher_ii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angelina B. Corpuz
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_corpuz_angelina', 'angelina.corpuz@mati.edu.ph', 'Angelina B. Corpuz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angelina B. Corpuz', 'Angelina', 'Bilagantol', 'Corpuz', 'teacher_iii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sharon Hope B. De Parroco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_deparroco_sharonhope', 'sharonhope.deparroco@mati.edu.ph', 'Sharon Hope B. De Parroco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sharon Hope B. De Parroco', 'Sharon Hope', 'Barba', 'De Parroco', 'teacher_ii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rowena B. Decano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_decano_rowena', 'rowena.decano@mati.edu.ph', 'Rowena B. Decano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rowena B. Decano', 'Rowena', 'Bacolod', 'Decano', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janice E.. Peraman
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_peraman_janice', 'janice.peraman@mati.edu.ph', 'Janice E.. Peraman', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janice E.. Peraman', 'Janice', 'Enriquez', 'Peraman', 'teacher_iii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Precious Mae B. Enriquez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_enriquez_preciousmae', 'preciousmae.enriquez@mati.edu.ph', 'Precious Mae B. Enriquez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Precious Mae B. Enriquez', 'Precious Mae', 'Bagayas', 'Enriquez', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Andrew M. Enriquez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_enriquez_andrew', 'andrew.enriquez@mati.edu.ph', 'Andrew M. Enriquez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Andrew M. Enriquez', 'Andrew', 'Marianito', 'Enriquez', 'master_teacher_i', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maribel M. Esgana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_esgana_maribel', 'maribel.esgana@mati.edu.ph', 'Maribel M. Esgana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maribel M. Esgana', 'Maribel', 'Moreno', 'Esgana', 'master_teacher_ii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lori R. Galdones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_galdones_lori', 'lori.galdones@mati.edu.ph', 'Lori R. Galdones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lori R. Galdones', 'Lori', 'Redulla', 'Galdones', 'teacher_ii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arjay A. Gregana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_gregana_arjay', 'arjay.gregana@mati.edu.ph', 'Arjay A. Gregana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arjay A. Gregana', 'Arjay', 'Agbas', 'Gregana', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gina B. Lozano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_lozano_gina', 'gina.lozano@mati.edu.ph', 'Gina B. Lozano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gina B. Lozano', 'Gina', 'Baquiano', 'Lozano', 'teacher_iii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Meriam B. Mohamad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_mohamad_meriam', 'meriam.mohamad@mati.edu.ph', 'Meriam B. Mohamad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Meriam B. Mohamad', 'Meriam', 'Ballenas', 'Mohamad', 'teacher_iii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Addong H. Nasilin
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_nasilin_addong', 'addong.nasilin@mati.edu.ph', 'Addong H. Nasilin', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Addong H. Nasilin', 'Addong', 'Halipa', 'Nasilin', 'teacher_iii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Glady Lovie R. Pilapil
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_pilapil_gladylovie', 'gladylovie.pilapil@mati.edu.ph', 'Glady Lovie R. Pilapil', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Glady Lovie R. Pilapil', 'Glady Lovie', 'Reseroni', 'Pilapil', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonel Greg S. Quebral
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_quebral_jonelgreg', 'jonelgreg.quebral@mati.edu.ph', 'Jonel Greg S. Quebral', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonel Greg S. Quebral', 'Jonel Greg', 'Salarda', 'Quebral', 'teacher_iii', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruth P.. Rojas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_rojas_ruth', 'ruth.rojas@mati.edu.ph', 'Ruth P.. Rojas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruth P.. Rojas', 'Ruth', 'Payao', 'Rojas', 'teacher_i', 'BEED with M.A. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janeth C. Salva
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_salva_janeth', 'janeth.salva@mati.edu.ph', 'Janeth C. Salva', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janeth C. Salva', 'Janeth', 'Colegado', 'Salva', 'teacher_ii', 'BEED with ECE units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Louiecel P.. Satinitigan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_satinitigan_louiecel', 'louiecel.satinitigan@mati.edu.ph', 'Louiecel P.. Satinitigan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Louiecel P.. Satinitigan', 'Louiecel', 'Plaza', 'Satinitigan', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kim Harvey D.. Sohitado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_sohitado_kimharvey', 'kimharvey.sohitado@mati.edu.ph', 'Kim Harvey D.. Sohitado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kim Harvey D.. Sohitado', 'Kim Harvey', 'Dela Salde', 'Sohitado', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josilyn C. Usong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_usong_josilyn', 'josilyn.usong@mati.edu.ph', 'Josilyn C. Usong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josilyn C. Usong', 'Josilyn', 'Camilo', 'Usong', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Candelaria R. Uy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_uy_candelaria', 'candelaria.uy@mati.edu.ph', 'Candelaria R. Uy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Candelaria R. Uy', 'Candelaria', 'lo', 'Uy', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lee Amor B. Vallejo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_vallejo_leeamor', 'leeamor.vallejo@mati.edu.ph', 'Lee Amor B. Vallejo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lee Amor B. Vallejo', 'Lee Amor', 'Bucio', 'Vallejo', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alfiveguill M. Valenteros
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_valenteros_alfiveguill', 'alfiveguill.valenteros@mati.edu.ph', 'Alfiveguill M. Valenteros', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alfiveguill M. Valenteros', 'Alfiveguill', 'Masaling', 'Valenteros', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Adolfo A.. Tarranza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_tarranza_adolfo', 'adolfo.tarranza@mati.edu.ph', 'Adolfo A.. Tarranza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Adolfo A.. Tarranza', 'Adolfo', 'Amor', 'Tarranza', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mery Joy C.. Oliveros
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_oliveros_meryjoy', 'meryjoy.oliveros@mati.edu.ph', 'Mery Joy C.. Oliveros', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mery Joy C.. Oliveros', 'Mery Joy', 'Camilo', 'Oliveros', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nenito R. Bandigan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129385_bandigan_nenito', 'nenito.bandigan@mati.edu.ph', 'Nenito R. Bandigan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nenito R. Bandigan', 'Nenito', 'Rebelleza', 'Bandigan', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  RAISE NOTICE 'MATI CENTRAL District complete!';
END $$;

-- Verify
SELECT COUNT(*) as "Mati Central Personnel" FROM teachers t 
JOIN schools s ON t.school_id = s.id 
WHERE s.district ILIKE '%Mati Central%';
