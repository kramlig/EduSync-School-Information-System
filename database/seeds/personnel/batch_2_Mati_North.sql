-- ============================================================================
-- BATCH 2 - Mati North District
-- Personnel Count: 389
-- ============================================================================

DO $$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
BEGIN
  RAISE NOTICE 'Processing Mati North District (389 personnel)...';

  -- School: 129387 (10 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129387' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Mary Claire M. Aguilar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_aguilar_maryclaire', 'maryclaire.aguilar@mati.edu.ph', 'Mary Claire M. Aguilar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Claire M. Aguilar', 'Mary Claire', 'Manug', 'Aguilar', 'teacher_i', 'Bachelor Degree w/ M.A. unit', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Renalda C. Carbonilla
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_carbonilla_renalda', 'renalda.carbonilla@mati.edu.ph', 'Renalda C. Carbonilla', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Renalda C. Carbonilla', 'Renalda', 'Cawaling', 'Carbonilla', 'teacher_i', 'Bachelor Degree w/ M.A. unit', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bevelyn F. Longino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_longino_bevelyn', 'bevelyn.longino@mati.edu.ph', 'Bevelyn F. Longino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bevelyn F. Longino', 'Bevelyn', 'Francisco', 'Longino', 'teacher_i', 'BSED- BioSci w/ M.A. unit', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Harmon A. Ondoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_ondoy_harmon', 'harmon.ondoy@mati.edu.ph', 'Harmon A. Ondoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Harmon A. Ondoy', 'Harmon', 'Arendain', 'Ondoy', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Corazon A. Pagayawan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_pagayawan_corazon', 'corazon.pagayawan@mati.edu.ph', 'Corazon A. Pagayawan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Corazon A. Pagayawan', 'Corazon', 'Aguinaldo', 'Pagayawan', 'teacher_iii', 'Bachelor Degree w/ M.A. unit', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristine Joy O. Poderanan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_poderanan_cristinejoy', 'cristinejoy.poderanan@mati.edu.ph', 'Cristine Joy O. Poderanan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristine Joy O. Poderanan', 'Cristine Joy', 'Orias', 'Poderanan', 'master_teacher_ii', 'Bachelor Degree w/ M.A. unit', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ariane Grace P. Sababan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_sababan_arianegrace', 'arianegrace.sababan@mati.edu.ph', 'Ariane Grace P. Sababan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ariane Grace P. Sababan', 'Ariane Grace', 'Prado', 'Sababan', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonalyn S.. Aroyo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_aroyo_jonalyn', 'jonalyn.aroyo@mati.edu.ph', 'Jonalyn S.. Aroyo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonalyn S.. Aroyo', 'Jonalyn', '', 'Aroyo', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marissa C.. Toloy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_toloy_marissa', 'marissa.toloy@mati.edu.ph', 'Marissa C.. Toloy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marissa C.. Toloy', 'Marissa', 'Cajes', 'Toloy', 'principal_i', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Amira A. Amiang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129387_amiang_amira', 'amira.amiang@mati.edu.ph', 'Amira A. Amiang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Amira A. Amiang', 'Amira', 'Duallo', 'Amiang', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129388 (16 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129388' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Margie A. Monderondo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_monderondo_margie', 'margie.monderondo@mati.edu.ph', 'Margie A. Monderondo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Margie A. Monderondo', 'Margie', 'Aroso', 'Monderondo', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jan Adrian C. Boiser
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_boiser_janadrian', 'janadrian.boiser@mati.edu.ph', 'Jan Adrian C. Boiser', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jan Adrian C. Boiser', 'Jan Adrian', 'Cervantes', 'Boiser', 'teacher_iii', 'Master''s Degree with EdD. Completed Academic Requirements', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Princess Rica E. Paramio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_paramio_princessrica', 'princessrica.paramio@mati.edu.ph', 'Princess Rica E. Paramio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Princess Rica E. Paramio', 'Princess Rica', 'Erickson', 'Paramio', 'teacher_i', 'Master''s Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alma M. Esteban
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_esteban_alma', 'alma.esteban@mati.edu.ph', 'Alma M. Esteban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alma M. Esteban', 'Alma', 'Mamilic', 'Esteban', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- John Patrick . Iris
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_iris_johnpatrick', 'johnpatrick.iris@mati.edu.ph', 'John Patrick . Iris', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'John Patrick . Iris', 'John Patrick', '', 'Iris', 'teacher_i', 'Bachelor Degree with Masteral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maryfel T. Gadjali
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_gadjali_maryfel', 'maryfel.gadjali@mati.edu.ph', 'Maryfel T. Gadjali', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maryfel T. Gadjali', 'Maryfel', 'Tulba', 'Gadjali', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa F. Mabandos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_mabandos_jessa', 'jessa.mabandos@mati.edu.ph', 'Jessa F. Mabandos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa F. Mabandos', 'Jessa', 'Fuerzas', 'Mabandos', 'teacher_iii', 'Bachelor Degree with Masteral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryl M. Devinosa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_devinosa_sheryl', 'sheryl.devinosa@mati.edu.ph', 'Sheryl M. Devinosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryl M. Devinosa', 'Sheryl', 'Mamilic', 'Devinosa', 'teacher_ii', 'Bachelor Degree with Masteral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edelyn R. Manlabian
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_manlabian_edelyn', 'edelyn.manlabian@mati.edu.ph', 'Edelyn R. Manlabian', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edelyn R. Manlabian', 'Edelyn', 'Ramon', 'Manlabian', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Febedhels D. Gorgonio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_gorgonio_febedhels', 'febedhels.gorgonio@mati.edu.ph', 'Febedhels D. Gorgonio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Febedhels D. Gorgonio', 'Febedhels', 'Desamparado', 'Gorgonio', 'teacher_i', 'Masters Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nidura M. Sanchez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_sanchez_nidura', 'nidura.sanchez@mati.edu.ph', 'Nidura M. Sanchez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nidura M. Sanchez', 'Nidura', 'Mahinay', 'Sanchez', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lucibeth P. Tura
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_tura_lucibeth', 'lucibeth.tura@mati.edu.ph', 'Lucibeth P. Tura', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lucibeth P. Tura', 'Lucibeth', 'Panonce', 'Tura', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Effie M. Duazon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_duazon_effie', 'effie.duazon@mati.edu.ph', 'Effie M. Duazon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Effie M. Duazon', 'Effie', 'Matias', 'Duazon', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ranil B. Lawani
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_lawani_ranil', 'ranil.lawani@mati.edu.ph', 'Ranil B. Lawani', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ranil B. Lawani', 'Ranil', 'Bensig', 'Lawani', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryl A.. Porio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_porio_sheryl', 'sheryl.porio@mati.edu.ph', 'Sheryl A.. Porio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryl A.. Porio', 'Sheryl', 'Arnejo', 'Porio', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michelle A. Guibao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129388_guibao_michelle', 'michelle.guibao@mati.edu.ph', 'Michelle A. Guibao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michelle A. Guibao', 'Michelle', 'Almonte', 'Guibao', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129389 (28 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129389' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Loida B. Albiso
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_albiso_loida', 'loida.albiso@mati.edu.ph', 'Loida B. Albiso', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Loida B. Albiso', 'Loida', 'Bonsai', 'Albiso', 'teacher_i', 'BEED-GEN. SCI /MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovelyn M. Ayag
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_ayag_jovelyn', 'jovelyn.ayag@mati.edu.ph', 'Jovelyn M. Ayag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovelyn M. Ayag', 'Jovelyn', 'Mamanao', 'Ayag', 'teacher_iii', 'BEED- GEN. SCI./MAED-EM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristina M. Bermudez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_bermudez_cristina', 'cristina.bermudez@mati.edu.ph', 'Cristina M. Bermudez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristina M. Bermudez', 'Cristina', 'Monderondo', 'Bermudez', 'teacher_iii', 'BEED- GEN. SCI./MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Fernando C. Botilla
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_botilla_fernando', 'fernando.botilla@mati.edu.ph', '"Fernando C. Botilla', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Fernando C. Botilla', '"Fernando', 'Casilao', 'Botilla', 'teacher_i', 'T-II', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gritchel . Belandres
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_belandres_gritchel', 'gritchel.belandres@mati.edu.ph', 'Gritchel . Belandres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gritchel . Belandres', 'Gritchel', '', 'Belandres', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruel A.. Bonotan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_bonotan_ruel', 'ruel.bonotan@mati.edu.ph', 'Ruel A.. Bonotan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruel A.. Bonotan', 'Ruel', '', 'Bonotan', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kevin T. Camilo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_camilo_kevin', 'kevin.camilo@mati.edu.ph', 'Kevin T. Camilo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kevin T. Camilo', 'Kevin', 'Te', 'Camilo', 'teacher_ii', 'BEED GEN. SCI/ MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- July Aden P. Jucal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_jucal_julyaden', 'julyaden.jucal@mati.edu.ph', 'July Aden P. Jucal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'July Aden P. Jucal', 'July Aden', 'Pineda', 'Jucal', 'teacher_i', 'BEED GEN SCI.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arlene M. Damiles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_damiles_arlene', 'arlene.damiles@mati.edu.ph', 'Arlene M. Damiles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arlene M. Damiles', 'Arlene', 'Muring', 'Damiles', 'teacher_iii', 'BEED GEN SCI./MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Estela S. Espinosa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_espinosa_estela', 'estela.espinosa@mati.edu.ph', 'Estela S. Espinosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Estela S. Espinosa', 'Estela', 'Sayabo', 'Espinosa', 'teacher_ii', 'BEED GEN. SCI/MA UNITS MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analyn B. Inoco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_inoco_analyn', 'analyn.inoco@mati.edu.ph', 'Analyn B. Inoco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analyn B. Inoco', 'Analyn', 'Burlaza', 'Inoco', 'master_teacher_ii', 'BEED GEN. SCI/ MAED-EM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Teresita E. Isaias
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_isaias_teresita', 'teresita.isaias@mati.edu.ph', 'Teresita E. Isaias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Teresita E. Isaias', 'Teresita', 'Escasinas', 'Isaias', 'teacher_iii', 'BEED GEN. SCI/MAED - EM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine M. Lacang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_lacang_josephine', 'josephine.lacang@mati.edu.ph', 'Josephine M. Lacang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine M. Lacang', 'Josephine', 'Muring', 'Lacang', 'teacher_iii', 'BEED GEN. SCI/ MA UNITS MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analou M. Lumontad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_lumontad_analou', 'analou.lumontad@mati.edu.ph', 'Analou M. Lumontad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analou M. Lumontad', 'Analou', 'Morales', 'Lumontad', 'teacher_ii', 'BEED/21 MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jakielyn C. Lubang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_lubang_jakielyn', 'jakielyn.lubang@mati.edu.ph', 'Jakielyn C. Lubang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jakielyn C. Lubang', 'Jakielyn', 'Cotamora', 'Lubang', 'teacher_iii', 'BEED MATH/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fatima E.. Manuel
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_manuel_fatima', 'fatima.manuel@mati.edu.ph', 'Fatima E.. Manuel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fatima E.. Manuel', 'Fatima', 'Emia', 'Manuel', 'teacher_ii', 'BEED GEN. SCI/ MA UNITS MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arcilie L. Maranan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_maranan_arcilie', 'arcilie.maranan@mati.edu.ph', 'Arcilie L. Maranan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arcilie L. Maranan', 'Arcilie', 'Larrobis', 'Maranan', 'teacher_i', 'BEED GEN SCI./MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine M. Ocon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_ocon_josephine', 'josephine.ocon@mati.edu.ph', 'Josephine M. Ocon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine M. Ocon', 'Josephine', 'Macapanas', 'Ocon', 'teacher_ii', 'BEED GEN. SCI./MA UNITS MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ricky R.. Olita
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_olita_ricky', 'ricky.olita@mati.edu.ph', 'Ricky R.. Olita', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ricky R.. Olita', 'Ricky', 'Rojas', 'Olita', 'teacher_i', 'BEED GEN SCI./MA UNITS MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ernikka L.. Orias
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_orias_ernikka', 'ernikka.orias@mati.edu.ph', 'Ernikka L.. Orias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ernikka L.. Orias', 'Ernikka', 'Lilis', 'Orias', 'teacher_iii', 'BEED  GEN SCI./ MAEE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jasmin R. Torrefiel
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_torrefiel_jasmin', 'jasmin.torrefiel@mati.edu.ph', 'Jasmin R. Torrefiel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jasmin R. Torrefiel', 'Jasmin', 'Salva', 'Torrefiel', 'teacher_i', 'BEED GEN SCI./MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Merry Grace B. Villanueva
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_villanueva_merrygrace', 'merrygrace.villanueva@mati.edu.ph', 'Merry Grace B. Villanueva', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Merry Grace B. Villanueva', 'Merry Grace', 'Bonotan', 'Villanueva', 'teacher_ii', 'BEED GEN SCI./MA UNITS MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Deoven Roy F. Solana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_solana_deovenroy', 'deovenroy.solana@mati.edu.ph', 'Deoven Roy F. Solana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Deoven Roy F. Solana', 'Deoven Roy', 'Fernandez', 'Solana', 'teacher_iii', 'BEED GEN SCI./MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- LANI MAE T. PATASIC
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_patasic_lanimae', 'lanimae.patasic@mati.edu.ph', 'LANI MAE T. PATASIC', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'LANI MAE T. PATASIC', 'LANI MAE', 'TORILLO', 'PATASIC', 'teacher_ii', 'BEED GEN SCI./ MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michelle Charisse N. Magdoboy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_magdoboy_michellecharisse', 'michellecharisse.magdoboy@mati.edu.ph', 'Michelle Charisse N. Magdoboy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michelle Charisse N. Magdoboy', 'Michelle Charisse', 'Naduaran', 'Magdoboy', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edilyn P. Morales
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_morales_edilyn', 'edilyn.morales@mati.edu.ph', 'Edilyn P. Morales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edilyn P. Morales', 'Edilyn', 'Palma', 'Morales', 'teacher_iii', 'BEED  GEN SCI./ MA UNITS MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anifel L. Lemindog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_lemindog_anifel', 'anifel.lemindog@mati.edu.ph', 'Anifel L. Lemindog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anifel L. Lemindog', 'Anifel', 'Lingatong', 'Lemindog', 'teacher_i', 'BEED/MAED/EDD CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ricardo L. Rabuya
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129389_rabuya_ricardo', 'ricardo.rabuya@mati.edu.ph', 'Ricardo L. Rabuya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ricardo L. Rabuya', 'Ricardo', 'Labasano', 'Rabuya', 'principal_i', 'BSEED & MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129396 (20 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129396' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Brenda D. Silvosa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_silvosa_brenda', 'brenda.silvosa@mati.edu.ph', 'Brenda D. Silvosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Brenda D. Silvosa', 'Brenda', 'Detros', 'Silvosa', 'teacher_iii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shannah Kimberly C. Agapay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_agapay_shannahkimberly', 'shannahkimberly.agapay@mati.edu.ph', 'Shannah Kimberly C. Agapay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shannah Kimberly C. Agapay', 'Shannah Kimberly', 'Cabanganan', 'Agapay', 'teacher_iii', 'BEED/MAEM  42 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jorgie B. Mangcao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_mangcao_jorgie', 'jorgie.mangcao@mati.edu.ph', 'Jorgie B. Mangcao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jorgie B. Mangcao', 'Jorgie', 'Balante', 'Mangcao', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Matilde B. Balmores
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_balmores_matilde', 'matilde.balmores@mati.edu.ph', 'Matilde B. Balmores', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Matilde B. Balmores', 'Matilde', 'Bauyot', 'Balmores', 'master_teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Russel Libertine M. Evaristo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_evaristo_russellibertine', 'russellibertine.evaristo@mati.edu.ph', 'Russel Libertine M. Evaristo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Russel Libertine M. Evaristo', 'Russel Libertine', 'Mawalic', 'Evaristo', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julieta M. Mamanao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_mamanao_julieta', 'julieta.mamanao@mati.edu.ph', 'Julieta M. Mamanao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julieta M. Mamanao', 'Julieta', 'Mocoy', 'Mamanao', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryl Ivy L. Martin
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_martin_sherylivy', 'sherylivy.martin@mati.edu.ph', 'Sheryl Ivy L. Martin', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryl Ivy L. Martin', 'Sheryl Ivy', 'Llavado', 'Martin', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mylinda Rose M.. Diego
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_diego_mylindarose', 'mylindarose.diego@mati.edu.ph', 'Mylinda Rose M.. Diego', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mylinda Rose M.. Diego', 'Mylinda Rose', 'Miones', 'Diego', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nona Mae M. Miones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_miones_nonamae', 'nonamae.miones@mati.edu.ph', 'Nona Mae M. Miones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nona Mae M. Miones', 'Nona Mae', 'Magbutong', 'Miones', 'teacher_iii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lujarah Mae B. Miones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_miones_lujarahmae', 'lujarahmae.miones@mati.edu.ph', 'Lujarah Mae B. Miones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lujarah Mae B. Miones', 'Lujarah Mae', 'Bualan', 'Miones', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elona P.. Palmones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_palmones_elona', 'elona.palmones@mati.edu.ph', 'Elona P.. Palmones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elona P.. Palmones', 'Elona', 'Paspie', 'Palmones', 'teacher_i', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Independencia B. Riomalos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_riomalos_independencia', 'independencia.riomalos@mati.edu.ph', 'Independencia B. Riomalos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Independencia B. Riomalos', 'Independencia', 'Buac', 'Riomalos', 'teacher_ii', 'BEED Math/27 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gina S. Tabudlong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_tabudlong_gina', 'gina.tabudlong@mati.edu.ph', 'Gina S. Tabudlong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gina S. Tabudlong', 'Gina', 'Siman', 'Tabudlong', 'teacher_iii', 'BEED/MAEM  21 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joanna Marie G. Tanaid
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_tanaid_joannamarie', 'joannamarie.tanaid@mati.edu.ph', 'Joanna Marie G. Tanaid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joanna Marie G. Tanaid', 'Joanna Marie', 'Gil', 'Tanaid', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dahlia M. Lamoste
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_lamoste_dahlia', 'dahlia.lamoste@mati.edu.ph', 'Dahlia M. Lamoste', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dahlia M. Lamoste', 'Dahlia', 'Miones', 'Lamoste', 'teacher_iii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ana Mae M. Palmera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_palmera_anamae', 'anamae.palmera@mati.edu.ph', 'Ana Mae M. Palmera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ana Mae M. Palmera', 'Ana Mae', 'Masanguid', 'Palmera', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Meliza . Abunda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_abunda_meliza', 'meliza.abunda@mati.edu.ph', 'Meliza . Abunda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Meliza . Abunda', 'Meliza', '', 'Abunda', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dailene M. Entencia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_entencia_dailene', 'dailene.entencia@mati.edu.ph', 'Dailene M. Entencia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dailene M. Entencia', 'Dailene', 'Mamanao', 'Entencia', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noelle Marie S.. Galvez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_galvez_noellemarie', 'noellemarie.galvez@mati.edu.ph', 'Noelle Marie S.. Galvez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noelle Marie S.. Galvez', 'Noelle Marie', 'Silloriquez', 'Galvez', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marivic A. Diansay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129396_diansay_marivic', 'marivic.diansay@mati.edu.ph', 'Marivic A. Diansay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marivic A. Diansay', 'Marivic', 'Andan', 'Diansay', 'principal_i', 'BEED with MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129390 (26 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129390' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Melanie S. Ampo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_ampo_melanie', 'melanie.ampo@mati.edu.ph', 'Melanie S. Ampo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melanie S. Ampo', 'Melanie', 'Seňor', 'Ampo', 'teacher_i', 'BEED-Gen. Educ.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vilma C. Alojado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_alojado_vilma', 'vilma.alojado@mati.edu.ph', 'Vilma C. Alojado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vilma C. Alojado', 'Vilma', 'Campos', 'Alojado', 'teacher_iii', 'BEED-Gen. Educ.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jennelyn C. Antasoda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_antasoda_jennelyn', 'jennelyn.antasoda@mati.edu.ph', 'Jennelyn C. Antasoda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jennelyn C. Antasoda', 'Jennelyn', 'Cavanis', 'Antasoda', 'teacher_i', 'BEED-Gen. Sci.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Franco C. Busilaoco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_busilaoco_franco', 'franco.busilaoco@mati.edu.ph', 'Franco C. Busilaoco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Franco C. Busilaoco', 'Franco', 'Castellano', 'Busilaoco', 'teacher_iii', 'BEED / with M.A units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arnie M. Cabingatan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_cabingatan_arnie', 'arnie.cabingatan@mati.edu.ph', 'Arnie M. Cabingatan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arnie M. Cabingatan', 'Arnie', 'Mondejar', 'Cabingatan', 'teacher_ii', 'BEED-Gen. Sci. / with MAED-EM units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ronelo B.. Cabingatan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_cabingatan_ronelo', 'ronelo.cabingatan@mati.edu.ph', 'Ronelo B.. Cabingatan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ronelo B.. Cabingatan', 'Ronelo', 'Buglosa', 'Cabingatan', 'teacher_ii', 'BEED-Gen. Sci. / with MAED-EM units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janna Marie C. Caras
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_caras_jannamarie', 'jannamarie.caras@mati.edu.ph', 'Janna Marie C. Caras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janna Marie C. Caras', 'Janna Marie', 'Custodio', 'Caras', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nelly P. Cruz
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_cruz_nelly', 'nelly.cruz@mati.edu.ph', 'Nelly P. Cruz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nelly P. Cruz', 'Nelly', 'Pesinable', 'Cruz', 'teacher_i', 'BEED / Certificate in Teaching Preshool Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mateo D. Dedal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_dedal_mateo', 'mateo.dedal@mati.edu.ph', 'Mateo D. Dedal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mateo D. Dedal', 'Mateo', 'Dalaygon', 'Dedal', 'teacher_iii', 'BEED /MAED-EM graduated', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arlene S. Dela Cruz
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_delacruz_arlene', 'arlene.delacruz@mati.edu.ph', 'Arlene S. Dela Cruz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arlene S. Dela Cruz', 'Arlene', 'Sasam', 'Dela Cruz', 'teacher_i', 'BEED-Gen. Sci./ with MAED-EM units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Estrellita B. Galagar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_galagar_estrellita', 'estrellita.galagar@mati.edu.ph', 'Estrellita B. Galagar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Estrellita B. Galagar', 'Estrellita', 'Biton', 'Galagar', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jelly Mae D. Lascamana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_lascamana_jellymae', 'jellymae.lascamana@mati.edu.ph', 'Jelly Mae D. Lascamana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jelly Mae D. Lascamana', 'Jelly Mae', 'Donato', 'Lascamana', 'teacher_iii', 'BEED / with MAED-EM units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Liza P. Libron
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_libron_liza', 'liza.libron@mati.edu.ph', 'Liza P. Libron', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Liza P. Libron', 'Liza', 'Pusta', 'Libron', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Neshrin P. Isik-Pablo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_isikpablo_neshrin', 'neshrin.isikpablo@mati.edu.ph', 'Neshrin P. Isik-Pablo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Neshrin P. Isik-Pablo', 'Neshrin', 'Piang', 'Isik-Pablo', 'teacher_i', 'BEED Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marlon M. Matais
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_matais_marlon', 'marlon.matais@mati.edu.ph', 'Marlon M. Matais', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marlon M. Matais', 'Marlon', 'Magandam', 'Matais', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Magdalena M. Nalzaro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_nalzaro_mariamagdalena', 'mariamagdalena.nalzaro@mati.edu.ph', 'Maria Magdalena M. Nalzaro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Magdalena M. Nalzaro', 'Maria Magdalena', 'Mabini', 'Nalzaro', 'master_teacher_i', 'BEED/Pol. Sci. / with MAED units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mohammad Tayib 2. Omran
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_omran_mohammadtayib', 'mohammadtayib.omran@mati.edu.ph', 'Mohammad Tayib 2. Omran', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mohammad Tayib 2. Omran', 'Mohammad Tayib', 'Sabello', 'Omran', 'teacher_ii', 'BEED-Mathematics /with MAED-EM units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristine Mae P.. Camilo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_camilo_cristinemae', 'cristinemae.camilo@mati.edu.ph', 'Cristine Mae P.. Camilo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristine Mae P.. Camilo', 'Cristine Mae', 'Perez', 'Camilo', 'teacher_i', 'BEED GENERAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Estefanie P. Pepito
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_pepito_estefanie', 'estefanie.pepito@mati.edu.ph', 'Estefanie P. Pepito', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Estefanie P. Pepito', 'Estefanie', 'Pracullos', 'Pepito', 'teacher_i', 'BEED-GENERAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah Ve M. Plaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_plaza_leahve', 'leahve.plaza@mati.edu.ph', 'Leah Ve M. Plaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah Ve M. Plaza', 'Leah Ve', 'Marundan', 'Plaza', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovely Mae P. Ponte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_ponte_lovelymae', 'lovelymae.ponte@mati.edu.ph', 'Lovely Mae P. Ponte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovely Mae P. Ponte', 'Lovely Mae', 'Padeño', 'Ponte', 'teacher_i', 'BEED-Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa Marie H. Solana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_solana_jessamarie', 'jessamarie.solana@mati.edu.ph', 'Jessa Marie H. Solana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa Marie H. Solana', 'Jessa Marie', 'Hugue', 'Solana', 'master_teacher_i', 'BEED-GENERAL SCIENCE /MAED-EM GRADUATED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arlyn C. Taduman
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_taduman_arlyn', 'arlyn.taduman@mati.edu.ph', 'Arlyn C. Taduman', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arlyn C. Taduman', 'Arlyn', 'Cabison', 'Taduman', 'teacher_iii', 'BEED-Gen.Sci./MST-Gen.Sci.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emran D. Alim
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_alim_emran', 'emran.alim@mati.edu.ph', 'Emran D. Alim', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emran D. Alim', 'Emran', 'Dimatingcal', 'Alim', 'teacher_i', 'Bachelor in Elem. School-Major in Arabic Language and Islamic Values', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Silverio Jr. P.. Dapal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_dapal_silveriojr', 'silveriojr..dapal@mati.edu.ph', 'Silverio Jr. P.. Dapal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Silverio Jr. P.. Dapal', 'Silverio Jr.', 'Pedros', 'Dapal', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gerlie C.. Ballono
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129390_ballono_gerlie', 'gerlie.ballono@mati.edu.ph', 'Gerlie C.. Ballono', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gerlie C.. Ballono', 'Gerlie', 'Cebuan', 'Ballono', 'principal_i', 'Doctor of Education (27 Units)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 502726 (11 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '502726' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Charie-ann T.. Ugtonan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_ugtonan_charieann', 'charieann.ugtonan@mati.edu.ph', 'Charie-ann T.. Ugtonan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charie-ann T.. Ugtonan', 'Charie-ann', 'Tandalong', 'Ugtonan', 'teacher_iii', 'BEED Gen. Ed. / MAED Grad.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noranie E.. Tenerife
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_tenerife_noranie', 'noranie.tenerife@mati.edu.ph', 'Noranie E.. Tenerife', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noranie E.. Tenerife', 'Noranie', 'Elino', 'Tenerife', 'teacher_i', 'BEED Gen. Ed.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lilinette I.. Uyan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_uyan_lilinette', 'lilinette.uyan@mati.edu.ph', 'Lilinette I.. Uyan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lilinette I.. Uyan', 'Lilinette', 'Idio', 'Uyan', 'teacher_iii', 'BEED Gen. Ed.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arbaia F.. Ugtonan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_ugtonan_arbaia', 'arbaia.ugtonan@mati.edu.ph', 'Arbaia F.. Ugtonan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arbaia F.. Ugtonan', 'Arbaia', 'Francisco', 'Ugtonan', 'teacher_i', 'BEED Gen. Ed.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noraida B.. Amiang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_amiang_noraida', 'noraida.amiang@mati.edu.ph', 'Noraida B.. Amiang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noraida B.. Amiang', 'Noraida', 'Buenafe', 'Amiang', 'teacher_i', 'BEED Gen. Ed.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Doren Q.. Uyan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_uyan_doren', 'doren.uyan@mati.edu.ph', 'Doren Q.. Uyan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Doren Q.. Uyan', 'Doren', 'Quitab', 'Uyan', 'teacher_i', 'BEED Gen. Ed.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Karen Ivy T.. Bagayas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_bagayas_karenivy', 'karenivy.bagayas@mati.edu.ph', 'Karen Ivy T.. Bagayas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Karen Ivy T.. Bagayas', 'Karen Ivy', 'Teodoro', 'Bagayas', 'teacher_ii', 'BEED Gen. Ed.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daffodel D. Fano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_fano_daffodel', 'daffodel.fano@mati.edu.ph', 'Daffodel D. Fano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daffodel D. Fano', 'Daffodel', 'Deiparie', 'Fano', 'master_teacher_i', 'BEED Mathematics/MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noraine Ashreen F.. Elino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_elino_noraineashreen', 'noraineashreen.elino@mati.edu.ph', 'Noraine Ashreen F.. Elino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noraine Ashreen F.. Elino', 'Noraine Ashreen', 'Felipe', 'Elino', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roy C.. Andan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_andan_roy', 'roy.andan@mati.edu.ph', 'Roy C.. Andan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roy C.. Andan', 'Roy', 'Caña', 'Andan', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Harold C.. Canonio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502726_canonio_harold', 'harold.canonio@mati.edu.ph', 'Harold C.. Canonio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Harold C.. Canonio', 'Harold', 'Cabilar', 'Canonio', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129391 (13 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129391' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Daisy E. Bermudez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_bermudez_daisy', 'daisy.bermudez@mati.edu.ph', 'Daisy E. Bermudez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisy E. Bermudez', 'Daisy', 'Estolas', 'Bermudez', 'teacher_iii', 'BEED-Soc Sci/MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emerita L. Capungas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_capungas_emerita', 'emerita.capungas@mati.edu.ph', 'Emerita L. Capungas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emerita L. Capungas', 'Emerita', 'Lim', 'Capungas', 'teacher_i', 'BEED-Gen Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Genevieve D. Elias
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_elias_genevieve', 'genevieve.elias@mati.edu.ph', 'Genevieve D. Elias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Genevieve D. Elias', 'Genevieve', 'Despi', 'Elias', 'master_teacher_ii', 'BEED- Gen.Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Judy Ana R. Llanzana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_llanzana_judyana', 'judyana.llanzana@mati.edu.ph', 'Judy Ana R. Llanzana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Judy Ana R. Llanzana', 'Judy Ana', 'Ronolo', 'Llanzana', 'teacher_iii', 'BEED-Gen Sci/MaEd Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Diodita C. Majaras
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_majaras_diodita', 'diodita.majaras@mati.edu.ph', 'Diodita C. Majaras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Diodita C. Majaras', 'Diodita', 'Costelo', 'Majaras', 'teacher_ii', 'BEED-Gen Sci', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Archie P. Mantog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_mantog_archie', 'archie.mantog@mati.edu.ph', 'Archie P. Mantog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Archie P. Mantog', 'Archie', 'Panuayan', 'Mantog', 'teacher_i', 'BEED-Gen.Ed/MaEd', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emma Concepcion P. Mamilic
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_mamilic_emmaconcepcion', 'emmaconcepcion.mamilic@mati.edu.ph', 'Emma Concepcion P. Mamilic', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emma Concepcion P. Mamilic', 'Emma Concepcion', 'Palco', 'Mamilic', 'teacher_i', 'BEED-Gen Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace E. Mercadal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_mercadal_grace', 'grace.mercadal@mati.edu.ph', 'Grace E. Mercadal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace E. Mercadal', 'Grace', 'Embuscado', 'Mercadal', 'teacher_iii', 'BEED/MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- April Dream P. Pagayon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_pagayon_aprildream', 'aprildream.pagayon@mati.edu.ph', 'April Dream P. Pagayon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'April Dream P. Pagayon', 'April Dream', 'Ponce', 'Pagayon', 'teacher_i', 'BEED/MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sherene T. Pantullana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_pantullana_sherene', 'sherene.pantullana@mati.edu.ph', 'Sherene T. Pantullana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sherene T. Pantullana', 'Sherene', 'Tadlas', 'Pantullana', 'teacher_i', 'BEED-Generalist', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daisey D. Quiroga
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_quiroga_daisey', 'daisey.quiroga@mati.edu.ph', 'Daisey D. Quiroga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisey D. Quiroga', 'Daisey', 'Datuin', 'Quiroga', 'teacher_i', 'BEED-Gen.Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rohaina V.. Andan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_andan_rohaina', 'rohaina.andan@mati.edu.ph', 'Rohaina V.. Andan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rohaina V.. Andan', 'Rohaina', 'Valeriano', 'Andan', 'teacher_i', 'Master''s Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Girlie . Manalo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129391_manalo_girlie', 'girlie.manalo@mati.edu.ph', 'Girlie . Manalo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Girlie . Manalo', 'Girlie', 'Tulang', 'Manalo', 'principal_i', 'BEED with EdD units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129392 (14 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129392' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Lumelinda L. Balog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_balog_lumelinda', 'lumelinda.balog@mati.edu.ph', 'Lumelinda L. Balog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lumelinda L. Balog', 'Lumelinda', 'Lugatiman', 'Balog', 'teacher_ii', 'BEED with MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou A. Belbelone
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_belbelone_marilou', 'marilou.belbelone@mati.edu.ph', 'Marilou A. Belbelone', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou A. Belbelone', 'Marilou', 'Albutra', 'Belbelone', 'teacher_iii', 'BEED /MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Enelyn T. Cabahog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_cabahog_enelyn', 'enelyn.cabahog@mati.edu.ph', 'Enelyn T. Cabahog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Enelyn T. Cabahog', 'Enelyn', 'Tampos', 'Cabahog', 'teacher_ii', 'BEED/MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edwin A. Irog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_irog_edwin', 'edwin.irog@mati.edu.ph', 'Edwin A. Irog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edwin A. Irog', 'Edwin', 'Alcala', 'Irog', 'teacher_iii', 'BEED /MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Grace V. Irog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_irog_marygrace', 'marygrace.irog@mati.edu.ph', 'Mary Grace V. Irog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Grace V. Irog', 'Mary Grace', 'Valles', 'Irog', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maylene R. Martinez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_martinez_maylene', 'maylene.martinez@mati.edu.ph', 'Maylene R. Martinez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maylene R. Martinez', 'Maylene', 'Restor', 'Martinez', 'teacher_ii', 'BEED with MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shella Rose G. Olenio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_olenio_shellarose', 'shellarose.olenio@mati.edu.ph', 'Shella Rose G. Olenio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shella Rose G. Olenio', 'Shella Rose', 'Gana', 'Olenio', 'teacher_ii', 'BEED with MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine R. Paja
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_paja_christine', 'christine.paja@mati.edu.ph', 'Christine R. Paja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine R. Paja', 'Christine', 'Reguna', 'Paja', 'teacher_ii', 'BEED with MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jolhaida D. Belbelone
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_belbelone_jolhaida', 'jolhaida.belbelone@mati.edu.ph', 'Jolhaida D. Belbelone', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jolhaida D. Belbelone', 'Jolhaida', 'Dejos', 'Belbelone', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joanne A. Plaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_plaza_joanne', 'joanne.plaza@mati.edu.ph', 'Joanne A. Plaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joanne A. Plaza', 'Joanne', 'Alcala', 'Plaza', 'teacher_i', 'Master''s Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Micah Grace V. Sarmiento
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_sarmiento_micahgrace', 'micahgrace.sarmiento@mati.edu.ph', 'Micah Grace V. Sarmiento', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Micah Grace V. Sarmiento', 'Micah Grace', 'Ventura', 'Sarmiento', 'teacher_iii', 'BEED with MAED Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Delia B. Tolentino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_tolentino_delia', 'delia.tolentino@mati.edu.ph', 'Delia B. Tolentino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Delia B. Tolentino', 'Delia', 'Baldoz', 'Tolentino', 'teacher_iii', 'BEED /MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gene Icell T. Sacay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_sacay_geneicell', 'geneicell.sacay@mati.edu.ph', 'Gene Icell T. Sacay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gene Icell T. Sacay', 'Gene Icell', 'Talingting', 'Sacay', 'teacher_i', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Ann Abayhon. Juezan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129392_juezan_maryann', 'maryann.juezan@mati.edu.ph', 'Mary Ann Abayhon. Juezan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Ann Abayhon. Juezan', 'Mary Ann', '', 'Juezan', 'principal_i', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129393 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129393' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Jaypee E. Bucio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_bucio_jaypee', 'jaypee.bucio@mati.edu.ph', 'Jaypee E. Bucio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaypee E. Bucio', 'Jaypee', 'Elan', 'Bucio', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Radheya T. Godoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_godoy_radheya', 'radheya.godoy@mati.edu.ph', 'Radheya T. Godoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Radheya T. Godoy', 'Radheya', 'Tomarocon', 'Godoy', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christian M. Luayon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_luayon_christian', 'christian.luayon@mati.edu.ph', 'Christian M. Luayon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christian M. Luayon', 'Christian', 'Malaay', 'Luayon', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analyn F.. Mamusog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_mamusog_analyn', 'analyn.mamusog@mati.edu.ph', 'Analyn F.. Mamusog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analyn F.. Mamusog', 'Analyn', 'Felix', 'Mamusog', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ermin T. Tambol
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_tambol_ermin', 'ermin.tambol@mati.edu.ph', 'Ermin T. Tambol', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ermin T. Tambol', 'Ermin', 'Talingtingan', 'Tambol', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Guendolyn M. Pilapil
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_pilapil_guendolyn', 'guendolyn.pilapil@mati.edu.ph', 'Guendolyn M. Pilapil', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Guendolyn M. Pilapil', 'Guendolyn', 'Mercado', 'Pilapil', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jouie C. Igloria
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_igloria_jouie', 'jouie.igloria@mati.edu.ph', 'Jouie C. Igloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jouie C. Igloria', 'Jouie', 'Cursiga', 'Igloria', 'master_teacher_i', 'MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonathan M. Basog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_basog_jonathan', 'jonathan.basog@mati.edu.ph', 'Jonathan M. Basog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonathan M. Basog', 'Jonathan', 'Mahinay', 'Basog', 'teacher_i', 'BSED-TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Francisco . Teodoro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129393_teodoro_francisco', 'francisco.teodoro@mati.edu.ph', 'Francisco . Teodoro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Francisco . Teodoro', 'Francisco', '', 'Teodoro', 'principal_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129399 (20 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129399' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Artfel T.. Aspera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_aspera_artfel', 'artfel.aspera@mati.edu.ph', 'Artfel T.. Aspera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Artfel T.. Aspera', 'Artfel', 'Tidalgo', 'Aspera', 'master_teacher_ii', 'BS IN MATH- Mathematics with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Geraldine C. Besas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_besas_geraldine', 'geraldine.besas@mati.edu.ph', 'Geraldine C. Besas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Geraldine C. Besas', 'Geraldine', 'Cabating', 'Besas', 'teacher_iii', 'BEED -Gen. Science with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janhit A. Budta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_budta_janhit', 'janhit.budta@mati.edu.ph', 'Janhit A. Budta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janhit A. Budta', 'Janhit', 'Aharad', 'Budta', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovita S. Langgam
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_langgam_jovita', 'jovita.langgam@mati.edu.ph', 'Jovita S. Langgam', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovita S. Langgam', 'Jovita', 'Sapidan', 'Langgam', 'master_teacher_ii', 'BSEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joyce A. Laud
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_laud_joyce', 'joyce.laud@mati.edu.ph', 'Joyce A. Laud', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joyce A. Laud', 'Joyce', 'Alcoriza', 'Laud', 'teacher_iii', 'BEED- General Science/ MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Oliver A. Lupogan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_lupogan_oliver', 'oliver.lupogan@mati.edu.ph', 'Oliver A. Lupogan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Oliver A. Lupogan', 'Oliver', 'Acpac', 'Lupogan', 'teacher_ii', 'BEED- Gen. Scie with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Fe T. Masinadiong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_masinadiong_mariafe', 'mariafe.masinadiong@mati.edu.ph', 'Maria Fe T. Masinadiong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Fe T. Masinadiong', 'Maria Fe', 'Tumanda', 'Masinadiong', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah C. Matanog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_matanog_leah', 'leah.matanog@mati.edu.ph', 'Leah C. Matanog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah C. Matanog', 'Leah', 'Candar', 'Matanog', 'teacher_iii', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dante D.. Montebon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_montebon_dante', 'dante.montebon@mati.edu.ph', 'Dante D.. Montebon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dante D.. Montebon', 'Dante', 'Deligero', 'Montebon', 'teacher_iii', 'BEED-Generalist/ MAED/ PhD units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine M. Niez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_niez_josephine', 'josephine.niez@mati.edu.ph', 'Josephine M. Niez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine M. Niez', 'Josephine', 'Meloren', 'Niez', 'teacher_i', 'BEED -Gen. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocelyn L. Palmera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_palmera_jocelyn', 'jocelyn.palmera@mati.edu.ph', 'Jocelyn L. Palmera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocelyn L. Palmera', 'Jocelyn', 'Liwacat', 'Palmera', 'teacher_i', 'BEED -Gen. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Girlie R. Portillano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_portillano_girlie', 'girlie.portillano@mati.edu.ph', 'Girlie R. Portillano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Girlie R. Portillano', 'Girlie', 'Rabuya', 'Portillano', 'teacher_i', 'BEED-Gen. Science with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anna D.. Quilat
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_quilat_anna', 'anna.quilat@mati.edu.ph', 'Anna D.. Quilat', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anna D.. Quilat', 'Anna', 'Dionaldo', 'Quilat', 'teacher_ii', 'BEED-Gen. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Blandina B. Respecia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_respecia_blandina', 'blandina.respecia@mati.edu.ph', 'Blandina B. Respecia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Blandina B. Respecia', 'Blandina', 'Bueno', 'Respecia', 'teacher_iii', 'BEED-Gen. Science with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivy Ross . Surabia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_surabia_ivyross', 'ivyross.surabia@mati.edu.ph', 'Ivy Ross . Surabia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivy Ross . Surabia', 'Ivy Ross', '', 'Surabia', 'teacher_i', 'BEED-Generalistwith MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Norhayni S. Tambuco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_tambuco_norhayni', 'norhayni.tambuco@mati.edu.ph', 'Norhayni S. Tambuco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Norhayni S. Tambuco', 'Norhayni', 'Sabello', 'Tambuco', 'teacher_i', 'BEED-General Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julie Ann P. Camangyan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_camangyan_julieann', 'julieann.camangyan@mati.edu.ph', 'Julie Ann P. Camangyan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julie Ann P. Camangyan', 'Julie Ann', 'Pagkilatan', 'Camangyan', 'teacher_i', 'BEED-Generalist with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Teresita A. Ramirez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_ramirez_teresita', 'teresita.ramirez@mati.edu.ph', 'Teresita A. Ramirez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Teresita A. Ramirez', 'Teresita', 'Abrantes', 'Ramirez', 'teacher_ii', 'BEED-Mathematics with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Ann A. Hiyan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_hiyan_maryann', 'maryann.hiyan@mati.edu.ph', 'Mary Ann A. Hiyan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Ann A. Hiyan', 'Mary Ann', 'Arellano', 'Hiyan', 'teacher_i', 'BEED-Mathematics with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Irish T. Sayson
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129399_sayson_irish', 'irish.sayson@mati.edu.ph', 'Irish T. Sayson', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Irish T. Sayson', 'Irish', 'Tulang', 'Sayson', 'principal_i', 'BEED-EdD-ELM units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129395 (27 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129395' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Rosa G. Agbas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_agbas_rosa', 'rosa.agbas@mati.edu.ph', 'Rosa G. Agbas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosa G. Agbas', 'Rosa', 'Gutana', 'Agbas', 'teacher_i', 'Bachelor Degree/MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marivic B. Andolana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_andolana_marivic', 'marivic.andolana@mati.edu.ph', 'Marivic B. Andolana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marivic B. Andolana', 'Marivic', 'Bacareza', 'Andolana', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Judith A. Andrade
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_andrade_judith', 'judith.andrade@mati.edu.ph', 'Judith A. Andrade', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Judith A. Andrade', 'Judith', 'Ambi', 'Andrade', 'teacher_iii', 'Bachelor Degree/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Yvette V. Arapoc
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_arapoc_yvette', 'yvette.arapoc@mati.edu.ph', 'Yvette V. Arapoc', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Yvette V. Arapoc', 'Yvette', 'Villacarlos', 'Arapoc', 'teacher_iii', 'Bachelor Degree/MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Caroline A. Bautista
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_bautista_caroline', 'caroline.bautista@mati.edu.ph', 'Caroline A. Bautista', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Caroline A. Bautista', 'Caroline', 'Agujetas', 'Bautista', 'teacher_iii', 'Bachelor Degree/ MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arlene S. Busilaoco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_busilaoco_arlene', 'arlene.busilaoco@mati.edu.ph', 'Arlene S. Busilaoco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arlene S. Busilaoco', 'Arlene', 'Salomon', 'Busilaoco', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jennifer J. Cortez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_cortez_jennifer', 'jennifer.cortez@mati.edu.ph', 'Jennifer J. Cortez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jennifer J. Cortez', 'Jennifer', 'Juico', 'Cortez', 'teacher_iii', 'Bachelor Degree/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lamis A.. Dapitanon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_dapitanon_lamis', 'lamis.dapitanon@mati.edu.ph', 'Lamis A.. Dapitanon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lamis A.. Dapitanon', 'Lamis', 'Andoyo', 'Dapitanon', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Harris M. Flores
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_flores_harris', 'harris.flores@mati.edu.ph', 'Harris M. Flores', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Harris M. Flores', 'Harris', 'Morales', 'Flores', 'teacher_ii', 'Bachelor Degree/MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melba E. Galligao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_galligao_melba', 'melba.galligao@mati.edu.ph', 'Melba E. Galligao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melba E. Galligao', 'Melba', 'Emuy', 'Galligao', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emmalyn S. Gazmen
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_gazmen_emmalyn', 'emmalyn.gazmen@mati.edu.ph', 'Emmalyn S. Gazmen', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emmalyn S. Gazmen', 'Emmalyn', 'Salarda', 'Gazmen', 'teacher_iii', 'Bachelor Degree/MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sahirun I. Kabirun
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_kabirun_sahirun', 'sahirun.kabirun@mati.edu.ph', 'Sahirun I. Kabirun', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sahirun I. Kabirun', 'Sahirun', 'Imbik', 'Kabirun', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovely B. Labra
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_labra_lovely', 'lovely.labra@mati.edu.ph', 'Lovely B. Labra', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovely B. Labra', 'Lovely', 'Balano', 'Labra', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Iren C. Limit
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_limit_iren', 'iren.limit@mati.edu.ph', 'Iren C. Limit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Iren C. Limit', 'Iren', 'Cubillan', 'Limit', 'master_teacher_i', 'Bachelor Degree/ MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Archie L. Lucernas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_lucernas_archie', 'archie.lucernas@mati.edu.ph', 'Archie L. Lucernas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Archie L. Lucernas', 'Archie', 'Laroya', 'Lucernas', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gledy Louisebethe A.. Lutrago
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_lutrago_gledylouisebethe', 'gledylouisebethe.lutrago@mati.edu.ph', 'Gledy Louisebethe A.. Lutrago', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gledy Louisebethe A.. Lutrago', 'Gledy Louisebethe', 'Andoque', 'Lutrago', 'teacher_i', 'Bachelor Degree/MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Milagros M. Mahumot
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_mahumot_milagros', 'milagros.mahumot@mati.edu.ph', 'Milagros M. Mahumot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Milagros M. Mahumot', 'Milagros', 'Mahumoc', 'Mahumot', 'teacher_iii', 'Bachelor Degree/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine M. Micabalo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_micabalo_josephine', 'josephine.micabalo@mati.edu.ph', 'Josephine M. Micabalo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine M. Micabalo', 'Josephine', 'Mamac', 'Micabalo', 'master_teacher_ii', 'Bachelor Degree/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ofelia G. Obrial
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_obrial_ofelia', 'ofelia.obrial@mati.edu.ph', 'Ofelia G. Obrial', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ofelia G. Obrial', 'Ofelia', 'Garbin', 'Obrial', 'teacher_iii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sweet Melody P.. Pagandahan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_pagandahan_sweetmelody', 'sweetmelody.pagandahan@mati.edu.ph', 'Sweet Melody P.. Pagandahan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sweet Melody P.. Pagandahan', 'Sweet Melody', 'Paglinawan', 'Pagandahan', 'teacher_i', 'BSEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analou M. Pelagio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_pelagio_analou', 'analou.pelagio@mati.edu.ph', 'Analou M. Pelagio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analou M. Pelagio', 'Analou', 'Martonito', 'Pelagio', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonalene P.. Ramos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_ramos_jonalene', 'jonalene.ramos@mati.edu.ph', 'Jonalene P.. Ramos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonalene P.. Ramos', 'Jonalene', 'Polenio', 'Ramos', 'teacher_iii', 'Bachelor Degree/ MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Francisco L. Teodoro Jr.
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_teodorojr_francisco', 'francisco.teodorojr.@mati.edu.ph', 'Francisco L. Teodoro Jr.', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Francisco L. Teodoro Jr.', 'Francisco', 'Luciano', 'Teodoro Jr.', 'teacher_iii', 'Bachelor Degree/ MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jefferson A.. Torres
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_torres_jefferson', 'jefferson.torres@mati.edu.ph', 'Jefferson A.. Torres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jefferson A.. Torres', 'Jefferson', 'Arcillas', 'Torres', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michelle Donna M.. Gamayot
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_gamayot_michelledonna', 'michelledonna.gamayot@mati.edu.ph', 'Michelle Donna M.. Gamayot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michelle Donna M.. Gamayot', 'Michelle Donna', 'Masaudling', 'Gamayot', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosana M. Kabirun
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_kabirun_rosana', 'rosana.kabirun@mati.edu.ph', 'Rosana M. Kabirun', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosana M. Kabirun', 'Rosana', 'Mayo', 'Kabirun', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Realrose T.. Ferrando
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129395_ferrando_realrose', 'realrose.ferrando@mati.edu.ph', 'Realrose T.. Ferrando', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Realrose T.. Ferrando', 'Realrose', 'Tirro', 'Ferrando', 'principal_i', 'Master''s Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129408 (10 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129408' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Emee T. Basco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_basco_emee', 'emee.basco@mati.edu.ph', 'Emee T. Basco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emee T. Basco', 'Emee', 'Tangonan', 'Basco', 'teacher_ii', 'BEED/ MA Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melanie D. Bedeña
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_bedea_melanie', 'melanie.bedea@mati.edu.ph', 'Melanie D. Bedeña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melanie D. Bedeña', 'Melanie', 'Dona', 'Bedeña', 'teacher_i', 'BEED/MA  Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cheryl T. Cabrera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_cabrera_cheryl', 'cheryl.cabrera@mati.edu.ph', 'Cheryl T. Cabrera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cheryl T. Cabrera', 'Cheryl', 'Toroba', 'Cabrera', 'teacher_ii', 'BEED/ MA Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bernadette T. Carillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_carillo_bernadette', 'bernadette.carillo@mati.edu.ph', 'Bernadette T. Carillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bernadette T. Carillo', 'Bernadette', 'Teman', 'Carillo', 'teacher_i', 'BEED/ MA Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Theresa P. Tacder
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_tacder_matheresa', 'ma.theresa.tacder@mati.edu.ph', 'Ma. Theresa P. Tacder', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Theresa P. Tacder', 'Ma. Theresa', 'Palma', 'Tacder', 'master_teacher_i', 'BEED/ MAED/Doctoral CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Carnela M. Barles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_barles_carnela', 'carnela.barles@mati.edu.ph', 'Carnela M. Barles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Carnela M. Barles', 'Carnela', 'Mabanuag', 'Barles', 'teacher_i', 'BEED/MA Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Merianne A. Madanlo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_madanlo_merianne', 'merianne.madanlo@mati.edu.ph', 'Merianne A. Madanlo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Merianne A. Madanlo', 'Merianne', 'Archie', 'Madanlo', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jackelyn E.. Maglasang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_maglasang_jackelyn', 'jackelyn.maglasang@mati.edu.ph', 'Jackelyn E.. Maglasang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jackelyn E.. Maglasang', 'Jackelyn', 'Elesio', 'Maglasang', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace T. Llanto
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_llanto_grace', 'grace.llanto@mati.edu.ph', 'Grace T. Llanto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace T. Llanto', 'Grace', 'Tupas', 'Llanto', 'teacher_i', 'BSCrim', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marie Grace A. Busilaoco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129408_busilaoco_mariegrace', 'mariegrace.busilaoco@mati.edu.ph', 'Marie Grace A. Busilaoco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marie Grace A. Busilaoco', 'Marie Grace', 'Andres', 'Busilaoco', 'principal_i', 'BEED/MA Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129397 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129397' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Mary Flor L. Dao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_dao_maryflor', 'maryflor.dao@mati.edu.ph', 'Mary Flor L. Dao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Flor L. Dao', 'Mary Flor', 'Lumando', 'Dao', 'teacher_ii', 'MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristal Gene S. Escobido
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_escobido_kristalgene', 'kristalgene.escobido@mati.edu.ph', 'Kristal Gene S. Escobido', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristal Gene S. Escobido', 'Kristal Gene', 'Sagosoy', 'Escobido', 'teacher_i', 'BEED/ MAEd Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Yasmin B.. Linzag
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_linzag_yasmin', 'yasmin.linzag@mati.edu.ph', 'Yasmin B.. Linzag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Yasmin B.. Linzag', 'Yasmin', 'Bonotan', 'Linzag', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janeriel S. Maglente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_maglente_janeriel', 'janeriel.maglente@mati.edu.ph', 'Janeriel S. Maglente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janeriel S. Maglente', 'Janeriel', 'Susada', 'Maglente', 'teacher_i', 'BEED/ MAEd Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ednalyn B. Nacion
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_nacion_ednalyn', 'ednalyn.nacion@mati.edu.ph', 'Ednalyn B. Nacion', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ednalyn B. Nacion', 'Ednalyn', 'Balabagan', 'Nacion', 'teacher_ii', 'BEED/ MAEd Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Yza Jean M. Roena
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_roena_yzajean', 'yzajean.roena@mati.edu.ph', 'Yza Jean M. Roena', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Yza Jean M. Roena', 'Yza Jean', 'Mangubat', 'Roena', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wahida M. Malintad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_malintad_wahida', 'wahida.malintad@mati.edu.ph', 'Wahida M. Malintad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wahida M. Malintad', 'Wahida', 'Mailwas', 'Malintad', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- NAFIZA JORIELLE S.. Paterno
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_paterno_nafizajorielle', 'nafizajorielle.paterno@mati.edu.ph', 'NAFIZA JORIELLE S.. Paterno', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'NAFIZA JORIELLE S.. Paterno', 'NAFIZA JORIELLE', 'Sabandal', 'Paterno', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Eva D. Siblos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129397_siblos_maeva', 'ma.eva.siblos@mati.edu.ph', 'Ma. Eva D. Siblos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Eva D. Siblos', 'Ma. Eva', 'Dindin', 'Siblos', 'principal_i', 'BEED/MAEM/EDDLM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129398 (21 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129398' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Annalyn U. Agad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_agad_annalyn', 'annalyn.agad@mati.edu.ph', 'Annalyn U. Agad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annalyn U. Agad', 'Annalyn', 'Unabia', 'Agad', 'teacher_ii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Merlina B. Asube
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_asube_merlina', 'merlina.asube@mati.edu.ph', 'Merlina B. Asube', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Merlina B. Asube', 'Merlina', 'Botilla', 'Asube', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jingle M. Benaro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_benaro_jingle', 'jingle.benaro@mati.edu.ph', 'Jingle M. Benaro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jingle M. Benaro', 'Jingle', 'Morales', 'Benaro', 'teacher_iii', 'MPSDE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine D. Comar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_comar_josephine', 'josephine.comar@mati.edu.ph', 'Josephine D. Comar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine D. Comar', 'Josephine', 'Diansay', 'Comar', 'teacher_iii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Romeo A. Consigna
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_consigna_romeo', 'romeo.consigna@mati.edu.ph', 'Romeo A. Consigna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Romeo A. Consigna', 'Romeo', 'Ablon', 'Consigna', 'teacher_iii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Chona II N. Jabilles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_jabilles_mariachonaii', 'mariachonaii.jabilles@mati.edu.ph', 'Maria Chona II N. Jabilles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Chona II N. Jabilles', 'Maria Chona II', 'Naïve', 'Jabilles', 'teacher_iii', 'MAEd', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chona G. Magtuba
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_magtuba_chona', 'chona.magtuba@mati.edu.ph', 'Chona G. Magtuba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chona G. Magtuba', 'Chona', 'Guma', 'Magtuba', 'teacher_iii', 'EdD Complete Academic Req.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Luzvizaminda O. Legarda
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_legarda_luzvizaminda', 'luzvizaminda.legarda@mati.edu.ph', 'Luzvizaminda O. Legarda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Luzvizaminda O. Legarda', 'Luzvizaminda', 'Oro', 'Legarda', 'teacher_ii', 'MAEd', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou L. Mabini
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_mabini_marilou', 'marilou.mabini@mati.edu.ph', 'Marilou L. Mabini', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou L. Mabini', 'Marilou', 'Lemente', 'Mabini', 'master_teacher_i', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shella Mae P. Maybuena
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_maybuena_shellamae', 'shellamae.maybuena@mati.edu.ph', 'Shella Mae P. Maybuena', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shella Mae P. Maybuena', 'Shella Mae', 'Plenos', 'Maybuena', 'teacher_ii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Necitas O. Morales
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_morales_necitas', 'necitas.morales@mati.edu.ph', 'Necitas O. Morales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Necitas O. Morales', 'Necitas', 'Olay', 'Morales', 'teacher_iii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wilma D. Paganduman
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_paganduman_wilma', 'wilma.paganduman@mati.edu.ph', 'Wilma D. Paganduman', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wilma D. Paganduman', 'Wilma', 'Diansay', 'Paganduman', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mira P.. Patrolla
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_patrolla_mira', 'mira.patrolla@mati.edu.ph', 'Mira P.. Patrolla', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mira P.. Patrolla', 'Mira', 'Piscos', 'Patrolla', 'teacher_iii', 'MAEd/Doctoral Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Grace I. Ricaforte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_ricaforte_marygrace', 'marygrace.ricaforte@mati.edu.ph', 'Mary Grace I. Ricaforte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Grace I. Ricaforte', 'Mary Grace', 'Ilag-Ilag', 'Ricaforte', 'teacher_iii', 'MAEd', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alvin P. Tan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_tan_alvin', 'alvin.tan@mati.edu.ph', 'Alvin P. Tan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alvin P. Tan', 'Alvin', 'Paglinawan', 'Tan', 'teacher_ii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arvelyn L. Toloy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_toloy_arvelyn', 'arvelyn.toloy@mati.edu.ph', 'Arvelyn L. Toloy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arvelyn L. Toloy', 'Arvelyn', 'Larrobis', 'Toloy', 'teacher_iii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elma S. Torotoro
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_torotoro_elma', 'elma.torotoro@mati.edu.ph', 'Elma S. Torotoro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elma S. Torotoro', 'Elma', 'Sincero', 'Torotoro', 'teacher_ii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marichu C. Tumawis
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_tumawis_marichu', 'marichu.tumawis@mati.edu.ph', 'Marichu C. Tumawis', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marichu C. Tumawis', 'Marichu', 'Consigna', 'Tumawis', 'teacher_iii', 'BEED/MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Brian A.. Vicente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_vicente_brian', 'brian.vicente@mati.edu.ph', 'Brian A.. Vicente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Brian A.. Vicente', 'Brian', 'Alo', 'Vicente', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Regina A.. Liwagon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_liwagon_regina', 'regina.liwagon@mati.edu.ph', 'Regina A.. Liwagon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Regina A.. Liwagon', 'Regina', 'Asube', 'Liwagon', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Trinidad E. Colarte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129398_colarte_trinidad', 'trinidad.colarte@mati.edu.ph', 'Trinidad E. Colarte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Trinidad E. Colarte', 'Trinidad', 'Escorial', 'Colarte', 'principal_i', 'BSED/ Ed.D.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129400 (46 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129400' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Lucila A. Abarca
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_abarca_lucila', 'lucila.abarca@mati.edu.ph', 'Lucila A. Abarca', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lucila A. Abarca', 'Lucila', 'Alcantara', 'Abarca', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Acuña O. Acuña
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_acua_acua', 'acua.acua@mati.edu.ph', 'Acuña O. Acuña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Acuña O. Acuña', 'Acuña', 'Opriasa', 'Acuña', 'teacher_i', 'BEED- ECD', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mauricia S. Añana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_aana_mauricia', 'mauricia.aana@mati.edu.ph', 'Mauricia S. Añana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mauricia S. Añana', 'Mauricia', 'Sobrio', 'Añana', 'teacher_ii', 'BEED/MAED 27 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Geliza L. Aquino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_aquino_geliza', 'geliza.aquino@mati.edu.ph', 'Geliza L. Aquino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Geliza L. Aquino', 'Geliza', 'Lagunoy', 'Aquino', 'teacher_iii', 'BEED/MAED 27 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah Mae B.. Bauyot
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_bauyot_leahmae', 'leahmae.bauyot@mati.edu.ph', 'Leah Mae B.. Bauyot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah Mae B.. Bauyot', 'Leah Mae', 'Belsonda', 'Bauyot', 'teacher_iii', 'BEED/MAED 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rozel C. Bucio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_bucio_rozel', 'rozel.bucio@mati.edu.ph', 'Rozel C. Bucio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rozel C. Bucio', 'Rozel', 'Castellano', 'Bucio', 'teacher_iii', 'BEED/MAED 45 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Meredith Ann C. Cadungog
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_cadungog_meredithann', 'meredithann.cadungog@mati.edu.ph', 'Meredith Ann C. Cadungog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Meredith Ann C. Cadungog', 'Meredith Ann', 'Cabanes', 'Cadungog', 'teacher_iii', 'BEED/MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sharon Rose V. Colicot
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_colicot_sharonrose', 'sharonrose.colicot@mati.edu.ph', 'Sharon Rose V. Colicot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sharon Rose V. Colicot', 'Sharon Rose', 'Vicente', 'Colicot', 'teacher_i', 'BEED/MAED 30 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marieta D. Dapitanon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_dapitanon_marieta', 'marieta.dapitanon@mati.edu.ph', 'Marieta D. Dapitanon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marieta D. Dapitanon', 'Marieta', 'Deligero', 'Dapitanon', 'master_teacher_i', 'BEED/MEIL Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheila P.. Dapitanon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_dapitanon_sheila', 'sheila.dapitanon@mati.edu.ph', 'Sheila P.. Dapitanon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheila P.. Dapitanon', 'Sheila', 'Palmiano', 'Dapitanon', 'teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace Hannah M. David
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_david_gracehannah', 'gracehannah.david@mati.edu.ph', 'Grace Hannah M. David', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace Hannah M. David', 'Grace Hannah', 'Malintad', 'David', 'teacher_iii', 'BEED/MAED 30 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angelita M. Delagua
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_delagua_angelita', 'angelita.delagua@mati.edu.ph', 'Angelita M. Delagua', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angelita M. Delagua', 'Angelita', 'Malintad', 'Delagua', 'teacher_iii', 'BEED/MAED 27 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janice M. Dizon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_dizon_janice', 'janice.dizon@mati.edu.ph', 'Janice M. Dizon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janice M. Dizon', 'Janice', 'Macadagat', 'Dizon', 'teacher_ii', 'BEED/MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roche C. Durico
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_durico_roche', 'roche.durico@mati.edu.ph', 'Roche C. Durico', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roche C. Durico', 'Roche', 'Cabio', 'Durico', 'teacher_iii', 'BEED/MAED 33 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Helen S. Iremedio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_iremedio_helen', 'helen.iremedio@mati.edu.ph', 'Helen S. Iremedio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Helen S. Iremedio', 'Helen', 'Siarot', 'Iremedio', 'teacher_iii', 'BEED/MAED 21 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Loida A. Embalsado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_embalsado_maloida', 'ma.loida.embalsado@mati.edu.ph', 'Ma. Loida A. Embalsado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Loida A. Embalsado', 'Ma. Loida', 'Arabilla', 'Embalsado', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- James Roland V. Galvez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_galvez_jamesroland', 'jamesroland.galvez@mati.edu.ph', 'James Roland V. Galvez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'James Roland V. Galvez', 'James Roland', 'Vallejo', 'Galvez', 'teacher_iii', 'BEED/MAED 30 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Merry Gold C. Labang
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_labang_merrygold', 'merrygold.labang@mati.edu.ph', 'Merry Gold C. Labang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Merry Gold C. Labang', 'Merry Gold', 'Cuestas', 'Labang', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juliet M. Leyte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_leyte_juliet', 'juliet.leyte@mati.edu.ph', 'Juliet M. Leyte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juliet M. Leyte', 'Juliet', 'Mabini', 'Leyte', 'master_teacher_i', 'BEED/BSC/MAED 42 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jesselei P. Mamada
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_mamada_jesselei', 'jesselei.mamada@mati.edu.ph', 'Jesselei P. Mamada', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jesselei P. Mamada', 'Jesselei', 'Pamonag', 'Mamada', 'teacher_ii', 'BSED Mathematics/MAED 21 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lorelei L. Manlangit
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_manlangit_lorelei', 'lorelei.manlangit@mati.edu.ph', 'Lorelei L. Manlangit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lorelei L. Manlangit', 'Lorelei', 'Labarca', 'Manlangit', 'master_teacher_ii', 'BEED/SPEP 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Riza C. Marcellones
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_marcellones_riza', 'riza.marcellones@mati.edu.ph', 'Riza C. Marcellones', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Riza C. Marcellones', 'Riza', 'Casibua', 'Marcellones', 'teacher_iii', 'BEED/MAED 21 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Luzminda B. Melgar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_melgar_luzminda', 'luzminda.melgar@mati.edu.ph', 'Luzminda B. Melgar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Luzminda B. Melgar', 'Luzminda', 'Borja', 'Melgar', 'master_teacher_i', 'BEED/ECE/MAED 30 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruby Ann M. Ongcoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_ongcoy_rubyann', 'rubyann.ongcoy@mati.edu.ph', 'Ruby Ann M. Ongcoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruby Ann M. Ongcoy', 'Ruby Ann', 'Masungcad', 'Ongcoy', 'teacher_i', 'BEED/MAED 24 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joramae L. Ouano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_ouano_joramae', 'joramae.ouano@mati.edu.ph', 'Joramae L. Ouano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joramae L. Ouano', 'Joramae', 'Luardo', 'Ouano', 'teacher_i', 'BEED/MAED 23units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nicolan M. Pagcamaan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_pagcamaan_nicolan', 'nicolan.pagcamaan@mati.edu.ph', 'Nicolan M. Pagcamaan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nicolan M. Pagcamaan', 'Nicolan', 'Mali', 'Pagcamaan', 'teacher_ii', 'BEED/MAED 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maribel D. Pagcamaan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_pagcamaan_maribel', 'maribel.pagcamaan@mati.edu.ph', 'Maribel D. Pagcamaan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maribel D. Pagcamaan', 'Maribel', 'Dela Torre', 'Pagcamaan', 'teacher_iii', 'BEED/MAED 30 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chona J. Perez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_perez_chona', 'chona.perez@mati.edu.ph', 'Chona J. Perez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chona J. Perez', 'Chona', 'Janeo', 'Perez', 'teacher_iii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nimfa T. Plaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_plaza_nimfa', 'nimfa.plaza@mati.edu.ph', 'Nimfa T. Plaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nimfa T. Plaza', 'Nimfa', 'Tuano', 'Plaza', 'teacher_iii', 'BEED/MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lutherine C. Pracullos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_pracullos_lutherine', 'lutherine.pracullos@mati.edu.ph', 'Lutherine C. Pracullos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lutherine C. Pracullos', 'Lutherine', 'Corminal', 'Pracullos', 'teacher_iii', 'BEED/MAED Graduate/27 units Doctorate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rogelio L. Recto
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_recto_rogelio', 'rogelio.recto@mati.edu.ph', 'Rogelio L. Recto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rogelio L. Recto', 'Rogelio', 'Lasquite', 'Recto', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jacquiline G. Regodon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_regodon_jacquiline', 'jacquiline.regodon@mati.edu.ph', 'Jacquiline G. Regodon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jacquiline G. Regodon', 'Jacquiline', 'Gayta', 'Regodon', 'teacher_ii', 'BEED/24 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mirla G. Reyes
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_reyes_mirla', 'mirla.reyes@mati.edu.ph', 'Mirla G. Reyes', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mirla G. Reyes', 'Mirla', 'Ganto', 'Reyes', 'teacher_iii', 'BEED/MAED 30 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marigold N. Riogelon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_riogelon_marigold', 'marigold.riogelon@mati.edu.ph', 'Marigold N. Riogelon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marigold N. Riogelon', 'Marigold', 'Nugal', 'Riogelon', 'teacher_i', 'BEED/MA graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daisy Jane E. Suarez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_suarez_daisyjane', 'daisyjane.suarez@mati.edu.ph', 'Daisy Jane E. Suarez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisy Jane E. Suarez', 'Daisy Jane', 'Empleo', 'Suarez', 'teacher_ii', 'BEED/MAED 24 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mila Marie M. Suganan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_suganan_milamarie', 'milamarie.suganan@mati.edu.ph', 'Mila Marie M. Suganan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mila Marie M. Suganan', 'Mila Marie', 'Mahumot', 'Suganan', 'teacher_iii', 'BEED/MAED 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Ann C. Valdez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_valdez_maryann', 'maryann.valdez@mati.edu.ph', 'Mary Ann C. Valdez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Ann C. Valdez', 'Mary Ann', 'Conde', 'Valdez', 'teacher_iii', 'BEED/MAED 45 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Danica S. Valeriano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_valeriano_danica', 'danica.valeriano@mati.edu.ph', 'Danica S. Valeriano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Danica S. Valeriano', 'Danica', 'Salva', 'Valeriano', 'teacher_iii', 'BEED/MA graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dominic D. Vallejo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_vallejo_dominic', 'dominic.vallejo@mati.edu.ph', 'Dominic D. Vallejo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dominic D. Vallejo', 'Dominic', 'Delosa', 'Vallejo', 'teacher_iii', 'BEED/MAED 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovely Lyn M. Villafuerte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_villafuerte_lovelylyn', 'lovelylyn.villafuerte@mati.edu.ph', 'Lovely Lyn M. Villafuerte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovely Lyn M. Villafuerte', 'Lovely Lyn', 'Madanlo', 'Villafuerte', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gesnell S. Vistal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_vistal_gesnell', 'gesnell.vistal@mati.edu.ph', 'Gesnell S. Vistal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gesnell S. Vistal', 'Gesnell', 'Salang', 'Vistal', 'teacher_ii', 'BEED/MAED 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Serelina A. Vistal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_vistal_serelina', 'serelina.vistal@mati.edu.ph', 'Serelina A. Vistal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Serelina A. Vistal', 'Serelina', 'Bohol', 'Vistal', 'teacher_ii', 'BEED/MAED 36 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristina B. Caiña
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_caia_cristina', 'cristina.caia@mati.edu.ph', 'Cristina B. Caiña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristina B. Caiña', 'Cristina', 'Bohol', 'Caiña', 'teacher_i', 'BSE-Mathematics/MA 21 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bernadith C. Camañan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_camaan_bernadith', 'bernadith.camaan@mati.edu.ph', 'Bernadith C. Camañan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bernadith C. Camañan', 'Bernadith', 'Collado', 'Camañan', 'teacher_i', 'BSC-Economics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lea B. Obatonon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_obatonon_lea', 'lea.obatonon@mati.edu.ph', 'Lea B. Obatonon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lea B. Obatonon', 'Lea', 'Bentayao', 'Obatonon', 'teacher_i', 'BSBM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Francis C. Busilaoco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129400_busilaoco_francis', 'francis.busilaoco@mati.edu.ph', 'Francis C. Busilaoco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Francis C. Busilaoco', 'Francis', 'Castellano', 'Busilaoco', 'principal_i', 'Master''s Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129401 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129401' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Johnny A. Bongcas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_bongcas_johnny', 'johnny.bongcas@mati.edu.ph', 'Johnny A. Bongcas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Johnny A. Bongcas', 'Johnny', 'Andres', 'Bongcas', 'teacher_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Risa S. Bongcas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_bongcas_risa', 'risa.bongcas@mati.edu.ph', 'Risa S. Bongcas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Risa S. Bongcas', 'Risa', 'Sampiri', 'Bongcas', 'teacher_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rovie Anne A. Evaristo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_evaristo_rovieanne', 'rovieanne.evaristo@mati.edu.ph', 'Rovie Anne A. Evaristo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rovie Anne A. Evaristo', 'Rovie Anne', 'Agustin', 'Evaristo', 'teacher_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Pia Mae T. Esteban
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_esteban_piamae', 'piamae.esteban@mati.edu.ph', 'Pia Mae T. Esteban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Pia Mae T. Esteban', 'Pia Mae', 'Trinidad', 'Esteban', 'teacher_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Donalyn . Villar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_villar_donalyn', 'donalyn.villar@mati.edu.ph', 'Donalyn . Villar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Donalyn . Villar', 'Donalyn', 'Valiente', 'Villar', 'teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lucel B. Paring
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_paring_lucel', 'lucel.paring@mati.edu.ph', 'Lucel B. Paring', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lucel B. Paring', 'Lucel', 'Bontuyan', 'Paring', 'teacher_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Susan D. Zapanta
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_zapanta_susan', 'susan.zapanta@mati.edu.ph', 'Susan D. Zapanta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Susan D. Zapanta', 'Susan', 'Dionio', 'Zapanta', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jay Ann . Suplio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_suplio_jayann', 'jayann.suplio@mati.edu.ph', 'Jay Ann . Suplio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jay Ann . Suplio', 'Jay Ann', 'Lape', 'Suplio', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hazel L. Untong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129401_untong_hazel', 'hazel.untong@mati.edu.ph', 'Hazel L. Untong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hazel L. Untong', 'Hazel', 'Llanto', 'Untong', 'master_teacher_i', 'BEED/ MA Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129394 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129394' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Christine G. Aulistia
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_aulistia_christine', 'christine.aulistia@mati.edu.ph', 'Christine G. Aulistia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine G. Aulistia', 'Christine', 'Goma', 'Aulistia', 'teacher_i', 'BEED  with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emelyn J. Latiban
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_latiban_emelyn', 'emelyn.latiban@mati.edu.ph', 'Emelyn J. Latiban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emelyn J. Latiban', 'Emelyn', 'Jumawan', 'Latiban', 'teacher_ii', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Carlo Elias M. Lumontad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_lumontad_carloelias', 'carloelias.lumontad@mati.edu.ph', 'Carlo Elias M. Lumontad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Carlo Elias M. Lumontad', 'Carlo Elias', 'Mallo', 'Lumontad', 'teacher_ii', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shirley D. Lumagbas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_lumagbas_shirley', 'shirley.lumagbas@mati.edu.ph', 'Shirley D. Lumagbas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shirley D. Lumagbas', 'Shirley', 'Mocoy', 'Lumagbas', 'teacher_i', 'BEED with MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mila B. Basilisco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_basilisco_mila', 'mila.basilisco@mati.edu.ph', 'Mila B. Basilisco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mila B. Basilisco', 'Mila', 'Banlasan', 'Basilisco', 'teacher_i', 'BEED Preschool', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ainon Joy P. Gillegan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_gillegan_ainonjoy', 'ainonjoy.gillegan@mati.edu.ph', 'Ainon Joy P. Gillegan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ainon Joy P. Gillegan', 'Ainon Joy', 'Pagayon', 'Gillegan', 'teacher_i', 'BEED/GEN.ED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Reichel P.. Laplana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_laplana_mariareichel', 'mariareichel.laplana@mati.edu.ph', 'Maria Reichel P.. Laplana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Reichel P.. Laplana', 'Maria Reichel', 'Pondoc', 'Laplana', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Iris B.. Mocoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_mocoy_iris', 'iris.mocoy@mati.edu.ph', 'Iris B.. Mocoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Iris B.. Mocoy', 'Iris', 'Banlasan', 'Mocoy', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jomery M.. Masanguid
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129394_masanguid_jomery', 'jomery.masanguid@mati.edu.ph', 'Jomery M.. Masanguid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jomery M.. Masanguid', 'Jomery', 'Matapias', 'Masanguid', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129402 (8 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129402' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Rotchelle A.. AMPO
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_ampo_rotchelle', 'rotchelle.ampo@mati.edu.ph', 'Rotchelle A.. AMPO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rotchelle A.. AMPO', 'Rotchelle', 'Abunda', 'AMPO', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melvin T. MONTEJO
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_montejo_melvin', 'melvin.montejo@mati.edu.ph', 'Melvin T. MONTEJO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melvin T. MONTEJO', 'Melvin', 'Tayodong', 'MONTEJO', 'teacher_i', 'Bachelor Degree with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rubilyn B. BAUTISTA
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_bautista_rubilyn', 'rubilyn.bautista@mati.edu.ph', 'Rubilyn B. BAUTISTA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rubilyn B. BAUTISTA', 'Rubilyn', 'Binoya', 'BAUTISTA', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cres Myrla M. RAMAL
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_ramal_cresmyrla', 'cresmyrla.ramal@mati.edu.ph', 'Cres Myrla M. RAMAL', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cres Myrla M. RAMAL', 'Cres Myrla', 'Miones', 'RAMAL', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- NESTLE L. GEPIGA
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_gepiga_nestle', 'nestle.gepiga@mati.edu.ph', 'NESTLE L. GEPIGA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'NESTLE L. GEPIGA', 'NESTLE', 'Lugas', 'GEPIGA', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gaylord Sheen A.. PACALUNDO
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_pacalundo_gaylordsheen', 'gaylordsheen.pacalundo@mati.edu.ph', 'Gaylord Sheen A.. PACALUNDO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gaylord Sheen A.. PACALUNDO', 'Gaylord Sheen', 'Abarca', 'PACALUNDO', 'teacher_i', 'BEED/MAGC/Doctoral CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noren Angeli Mae B. PAGLANSON
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_paglanson_norenangelimae', 'norenangelimae.paglanson@mati.edu.ph', 'Noren Angeli Mae B. PAGLANSON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noren Angeli Mae B. PAGLANSON', 'Noren Angeli Mae', 'Bangita', 'PAGLANSON', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jerry P.. KATIPUNAN
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129402_katipunan_jerry', 'jerry.katipunan@mati.edu.ph', 'Jerry P.. KATIPUNAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jerry P.. KATIPUNAN', 'Jerry', 'Pilit', 'KATIPUNAN', 'teacher_i', 'MAED/Doctoral (CAR)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129403 (9 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129403' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Marlyn A. Apadan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_apadan_marlyn', 'marlyn.apadan@mati.edu.ph', 'Marlyn A. Apadan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marlyn A. Apadan', 'Marlyn', 'Anting', 'Apadan', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charmeline A. Anting
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_anting_charmeline', 'charmeline.anting@mati.edu.ph', 'Charmeline A. Anting', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charmeline A. Anting', 'Charmeline', 'Alo', 'Anting', 'teacher_iii', 'BEED/MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hadjuria C.. Gonzales
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_gonzales_hadjuria', 'hadjuria.gonzales@mati.edu.ph', 'Hadjuria C.. Gonzales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hadjuria C.. Gonzales', 'Hadjuria', 'Cornelio', 'Gonzales', 'master_teacher_ii', 'BEED/MAED Major in Guidance GRAD', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Johayna P. Manatad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_manatad_johayna', 'johayna.manatad@mati.edu.ph', 'Johayna P. Manatad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Johayna P. Manatad', 'Johayna', 'Paterno', 'Manatad', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Norbia M. Pacio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_pacio_norbia', 'norbia.pacio@mati.edu.ph', 'Norbia M. Pacio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Norbia M. Pacio', 'Norbia', 'Manuel', 'Pacio', 'teacher_i', 'BEED/MAEM GRAD', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Norbia M. Pacio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_pacio_norbia', 'norbia.pacio@mati.edu.ph', 'Norbia M. Pacio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Norbia M. Pacio', 'Norbia', 'Manuel', 'Pacio', 'teacher_i', 'BEED with MAEM grad', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Constantina A. Paterno
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_paterno_constantina', 'constantina.paterno@mati.edu.ph', 'Constantina A. Paterno', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Constantina A. Paterno', 'Constantina', 'Alterado', 'Paterno', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marie Cris B.. Plaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_plaza_mariecris', 'mariecris.plaza@mati.edu.ph', 'Marie Cris B.. Plaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marie Cris B.. Plaza', 'Marie Cris', 'Bastian', 'Plaza', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Remely Fe M. Ozaraga
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129403_ozaraga_remelyfe', 'remelyfe.ozaraga@mati.edu.ph', 'Remely Fe M. Ozaraga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Remely Fe M. Ozaraga', 'Remely Fe', 'Magtuba', 'Ozaraga', 'teacher_i', 'BS Physical Therapy with Doctorate Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129409 (22 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129409' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Farida S. Sabello
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_sabello_farida', 'farida.sabello@mati.edu.ph', 'Farida S. Sabello', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Farida S. Sabello', 'Farida', 'Silatan', 'Sabello', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nhel Ryan A. Alimpoos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_alimpoos_nhelryan', 'nhelryan.alimpoos@mati.edu.ph', 'Nhel Ryan A. Alimpoos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nhel Ryan A. Alimpoos', 'Nhel Ryan', 'Amper', 'Alimpoos', 'teacher_iii', 'Master''s Degree graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aubrey M. Javier
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_javier_aubrey', 'aubrey.javier@mati.edu.ph', 'Aubrey M. Javier', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aubrey M. Javier', 'Aubrey', 'Matias', 'Javier', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Redora M. Pareja
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_pareja_redora', 'redora.pareja@mati.edu.ph', 'Redora M. Pareja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Redora M. Pareja', 'Redora', 'Mantog', 'Pareja', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonah Grace C. Cabueñas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_cabueas_jonahgrace', 'jonahgrace.cabueas@mati.edu.ph', 'Jonah Grace C. Cabueñas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonah Grace C. Cabueñas', 'Jonah Grace', 'Cayetuna', 'Cabueñas', 'teacher_i', 'Master''s Degree graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosalinda M. Caiña
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_caia_rosalinda', 'rosalinda.caia@mati.edu.ph', 'Rosalinda M. Caiña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosalinda M. Caiña', 'Rosalinda', 'Hernandez', 'Caiña', 'master_teacher_ii', 'Bachelor Degree WITH MA UNITS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dina D. Calungsod
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_calungsod_dina', 'dina.calungsod@mati.edu.ph', 'Dina D. Calungsod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dina D. Calungsod', 'Dina', 'De Catalina', 'Calungsod', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nice M. Daig
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_daig_nice', 'nice.daig@mati.edu.ph', 'Nice M. Daig', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nice M. Daig', 'Nice', 'Malba', 'Daig', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovita M. Durante
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_durante_jovita', 'jovita.durante@mati.edu.ph', 'Jovita M. Durante', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovita M. Durante', 'Jovita', 'Mapinguez', 'Durante', 'teacher_ii', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Helen L. Embuscado
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_embuscado_helen', 'helen.embuscado@mati.edu.ph', 'Helen L. Embuscado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Helen L. Embuscado', 'Helen', 'Llavore', 'Embuscado', 'teacher_ii', 'Bachelor Degree w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ginalyn O. Gayas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_gayas_ginalyn', 'ginalyn.gayas@mati.edu.ph', 'Ginalyn O. Gayas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ginalyn O. Gayas', 'Ginalyn', 'Oppus', 'Gayas', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeniffer S. Guilaran
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_guilaran_jeniffer', 'jeniffer.guilaran@mati.edu.ph', 'Jeniffer S. Guilaran', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeniffer S. Guilaran', 'Jeniffer', 'Samijon', 'Guilaran', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa Mae M. Calungsod
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_calungsod_jessamae', 'jessamae.calungsod@mati.edu.ph', 'Jessa Mae M. Calungsod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa Mae M. Calungsod', 'Jessa Mae', 'Makig-angay', 'Calungsod', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jesiel L. Masangay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_masangay_jesiel', 'jesiel.masangay@mati.edu.ph', 'Jesiel L. Masangay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jesiel L. Masangay', 'Jesiel', 'Lluardo', 'Masangay', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nina S. Ocliasa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_ocliasa_nina', 'nina.ocliasa@mati.edu.ph', 'Nina S. Ocliasa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nina S. Ocliasa', 'Nina', 'Salac', 'Ocliasa', 'teacher_i', 'Bachelor Degree w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Toche M. Opsimar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_opsimar_toche', 'toche.opsimar@mati.edu.ph', 'Toche M. Opsimar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Toche M. Opsimar', 'Toche', 'Malintad', 'Opsimar', 'teacher_ii', 'Bachelor Degree w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jay Eireen M. Martino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_martino_jayeireen', 'jayeireen.martino@mati.edu.ph', 'Jay Eireen M. Martino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jay Eireen M. Martino', 'Jay Eireen', 'Morato', 'Martino', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeanne Ann D. Samar
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_samar_jeanneann', 'jeanneann.samar@mati.edu.ph', 'Jeanne Ann D. Samar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeanne Ann D. Samar', 'Jeanne Ann', 'Dizon', 'Samar', 'teacher_iii', 'Master''s Degree graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nicholo F. Torrefiel
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_torrefiel_nicholo', 'nicholo.torrefiel@mati.edu.ph', 'Nicholo F. Torrefiel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nicholo F. Torrefiel', 'Nicholo', 'Fuego', 'Torrefiel', 'teacher_iii', 'Master''s Degree graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shereyl C.. Samocino
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_samocino_shereyl', 'shereyl.samocino@mati.edu.ph', 'Shereyl C.. Samocino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shereyl C.. Samocino', 'Shereyl', 'Coto', 'Samocino', 'master_teacher_i', 'Master''s Degree graduate W/ Doctorate units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Trisha Diane C.. Acera
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_acera_trishadiane', 'trishadiane.acera@mati.edu.ph', 'Trisha Diane C.. Acera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Trisha Diane C.. Acera', 'Trisha Diane', 'Carbonel', 'Acera', 'teacher_i', 'Bachelor Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cedrick D. Toloy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129409_toloy_cedrick', 'cedrick.toloy@mati.edu.ph', 'Cedrick D. Toloy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cedrick D. Toloy', 'Cedrick', 'Dindin', 'Toloy', 'principal_i', 'Master Degree 42 Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 502727 (15 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '502727' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Anamie L. Abad
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_abad_anamie', 'anamie.abad@mati.edu.ph', 'Anamie L. Abad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anamie L. Abad', 'Anamie', 'Leopoldo', 'Abad', 'teacher_i', 'Bachelor Degree/ MA in Educational Management', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elaiza A. Banggala
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_banggala_elaiza', 'elaiza.banggala@mati.edu.ph', 'Elaiza A. Banggala', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elaiza A. Banggala', 'Elaiza', 'Albite', 'Banggala', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melma B. Buncal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_buncal_melma', 'melma.buncal@mati.edu.ph', 'Melma B. Buncal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melma B. Buncal', 'Melma', 'Bawang', 'Buncal', 'teacher_i', 'BEED/ Units in MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dorivic V. Buncal
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_buncal_dorivic', 'dorivic.buncal@mati.edu.ph', 'Dorivic V. Buncal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dorivic V. Buncal', 'Dorivic', 'Ventura', 'Buncal', 'teacher_iii', 'BEED/Units in MEIL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace R. Labor
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_labor_grace', 'grace.labor@mati.edu.ph', 'Grace R. Labor', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace R. Labor', 'Grace', 'Rufin', 'Labor', 'teacher_iii', 'BEED/ Units in MEIL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arien B. Plaza
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_plaza_arien', 'arien.plaza@mati.edu.ph', 'Arien B. Plaza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arien B. Plaza', 'Arien', 'Banggala', 'Plaza', 'teacher_iii', 'BEED/Master Units in MEIL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hearty Joy G. Mocoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_mocoy_heartyjoy', 'heartyjoy.mocoy@mati.edu.ph', 'Hearty Joy G. Mocoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hearty Joy G. Mocoy', 'Hearty Joy', 'G', 'Mocoy', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jemariah Lyn C. Baclig
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_baclig_jemariahlyn', 'jemariahlyn.baclig@mati.edu.ph', 'Jemariah Lyn C. Baclig', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jemariah Lyn C. Baclig', 'Jemariah Lyn', 'Cruz', 'Baclig', 'teacher_i', 'BSED-Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Jane B. Sungahid
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_sungahid_maryjane', 'maryjane.sungahid@mati.edu.ph', 'Mary Jane B. Sungahid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Jane B. Sungahid', 'Mary Jane', 'Bantayan', 'Sungahid', 'teacher_iii', 'BEED/Master Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anna Mezil M. Tinong
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_tinong_annamezil', 'annamezil.tinong@mati.edu.ph', 'Anna Mezil M. Tinong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anna Mezil M. Tinong', 'Anna Mezil', 'Martinez', 'Tinong', 'teacher_i', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nor-Inn B.. Basilisco
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_basilisco_norinn', 'norinn.basilisco@mati.edu.ph', 'Nor-Inn B.. Basilisco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nor-Inn B.. Basilisco', 'Nor-Inn', 'Banzawan', 'Basilisco', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julimar A.. Ponferrada
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_ponferrada_julimar', 'julimar.ponferrada@mati.edu.ph', 'Julimar A.. Ponferrada', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julimar A.. Ponferrada', 'Julimar', 'Avila', 'Ponferrada', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Andro Jim E.. Eliseo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_eliseo_androjim', 'androjim.eliseo@mati.edu.ph', 'Andro Jim E.. Eliseo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Andro Jim E.. Eliseo', 'Andro Jim', 'Estandarte', 'Eliseo', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Francis Troy G.. Suerte
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_suerte_francistroy', 'francistroy.suerte@mati.edu.ph', 'Francis Troy G.. Suerte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Francis Troy G.. Suerte', 'Francis Troy', 'Gumobao', 'Suerte', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jezza Mae B.. Dongallo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_502727_dongallo_jezzamae', 'jezzamae.dongallo@mati.edu.ph', 'Jezza Mae B.. Dongallo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jezza Mae B.. Dongallo', 'Jezza Mae', 'Bel', 'Dongallo', 'head_teacher_i', 'English/ MA in Educational Management/ PhD Units in Educational Leadership', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129405 (15 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129405' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Cheramie M. Ambayec
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_ambayec_cheramie', 'cheramie.ambayec@mati.edu.ph', 'Cheramie M. Ambayec', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cheramie M. Ambayec', 'Cheramie', 'Macabodbod', 'Ambayec', 'teacher_i', 'BSED-BioSci/MAED-EM on going', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juanita B. Berdida
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_berdida_juanita', 'juanita.berdida@mati.edu.ph', 'Juanita B. Berdida', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juanita B. Berdida', 'Juanita', 'Bantugan', 'Berdida', 'teacher_iii', 'BEED/MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Diana A. Cordova
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_cordova_diana', 'diana.cordova@mati.edu.ph', 'Diana A. Cordova', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Diana A. Cordova', 'Diana', 'Bongo', 'Cordova', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Magnolia V. Cose
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_cose_magnolia', 'magnolia.cose@mati.edu.ph', 'Magnolia V. Cose', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Magnolia V. Cose', 'Magnolia', 'Vistal', 'Cose', 'teacher_ii', 'BEED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gonalyn L. Dampiganon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_dampiganon_gonalyn', 'gonalyn.dampiganon@mati.edu.ph', 'Gonalyn L. Dampiganon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gonalyn L. Dampiganon', 'Gonalyn', 'Lamang', 'Dampiganon', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vanessa B. Lubiano
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_lubiano_vanessa', 'vanessa.lubiano@mati.edu.ph', 'Vanessa B. Lubiano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vanessa B. Lubiano', 'Vanessa', 'Bayang', 'Lubiano', 'teacher_i', 'BEED/w/ MA units - CAR', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenalyn L. Marcial
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_marcial_jenalyn', 'jenalyn.marcial@mati.edu.ph', 'Jenalyn L. Marcial', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenalyn L. Marcial', 'Jenalyn', 'Lasco', 'Marcial', 'teacher_i', 'BEED/MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ai-Ai G. Misoles
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_misoles_aiai', 'aiai.misoles@mati.edu.ph', 'Ai-Ai G. Misoles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ai-Ai G. Misoles', 'Ai-Ai', 'Gemida', 'Misoles', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bebelos D. Paul
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_paul_bebelos', 'bebelos.paul@mati.edu.ph', 'Bebelos D. Paul', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bebelos D. Paul', 'Bebelos', 'Dungog', 'Paul', 'teacher_iii', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eva Jean E. Perez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_perez_evajean', 'evajean.perez@mati.edu.ph', 'Eva Jean E. Perez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eva Jean E. Perez', 'Eva Jean', 'Egot', 'Perez', 'teacher_i', 'BEED/MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Miraluna A. Rama
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_rama_miraluna', 'miraluna.rama@mati.edu.ph', 'Miraluna A. Rama', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Miraluna A. Rama', 'Miraluna', 'Aguilar', 'Rama', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mae Jasmin L. Siblos
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_siblos_maejasmin', 'maejasmin.siblos@mati.edu.ph', 'Mae Jasmin L. Siblos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae Jasmin L. Siblos', 'Mae Jasmin', 'Lastima', 'Siblos', 'teacher_i', 'BEED/w/ MA units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Juvie B. Villegas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_villegas_juvie', 'juvie.villegas@mati.edu.ph', 'Juvie B. Villegas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Juvie B. Villegas', 'Juvie', 'Bolambot', 'Villegas', 'teacher_iii', 'BEED/MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elsa A. Solana
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_solana_elsa', 'elsa.solana@mati.edu.ph', 'Elsa A. Solana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elsa A. Solana', 'Elsa', 'Arias', 'Solana', 'teacher_iii', 'BEED/MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Srhoder E.. Elesio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129405_elesio_srhoder', 'srhoder.elesio@mati.edu.ph', 'Srhoder E.. Elesio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Srhoder E.. Elesio', 'Srhoder', 'Elaon', 'Elesio', 'principal_i', 'BEED Math/MAED 33 units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129406 (11 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129406' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Hephseba C. Hinayon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_hinayon_hephseba', 'hephseba.hinayon@mati.edu.ph', 'Hephseba C. Hinayon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hephseba C. Hinayon', 'Hephseba', 'Concon', 'Hinayon', 'teacher_ii', 'Master''s Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dalisay T. Magale
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_magale_dalisay', 'dalisay.magale@mati.edu.ph', 'Dalisay T. Magale', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dalisay T. Magale', 'Dalisay', 'Tejano', 'Magale', 'teacher_iii', 'Master''s Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Armando A.. Martinez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_martinez_armando', 'armando.martinez@mati.edu.ph', '"Armando A.. Martinez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Armando A.. Martinez', '"Armando', 'Ayag', 'Martinez', 'teacher_i', 'T-III', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Josephine O.. Zaragosa
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_zaragosa_maryjosephine', 'maryjosephine.zaragosa@mati.edu.ph', 'Mary Josephine O.. Zaragosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Josephine O.. Zaragosa', 'Mary Josephine', 'Ocon', 'Zaragosa', 'teacher_i', 'BEED/9 UNITS MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Agustina L. Pandan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_pandan_agustina', 'agustina.pandan@mati.edu.ph', 'Agustina L. Pandan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Agustina L. Pandan', 'Agustina', 'Laude', 'Pandan', 'teacher_iii', 'Master''s Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lucy G. Pansoy
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_pansoy_lucy', 'lucy.pansoy@mati.edu.ph', 'Lucy G. Pansoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lucy G. Pansoy', 'Lucy', 'Go', 'Pansoy', 'master_teacher_ii', 'Master''s Degree', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovelyn T.. Castillo
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_castillo_jovelyn', 'jovelyn.castillo@mati.edu.ph', 'Jovelyn T.. Castillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovelyn T.. Castillo', 'Jovelyn', 'Toronueva', 'Castillo', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- April Hazel . Ilajas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_ilajas_aprilhazel', 'aprilhazel.ilajas@mati.edu.ph', 'April Hazel . Ilajas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'April Hazel . Ilajas', 'April Hazel', 'Castil', 'Ilajas', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mitzi T. Villafañe
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_villafae_mitzi', 'mitzi.villafae@mati.edu.ph', 'Mitzi T. Villafañe', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mitzi T. Villafañe', 'Mitzi', 'Toong', 'Villafañe', 'teacher_iii', 'BEED /  MAED Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Verboy H. Tamay
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_tamay_verboy', 'verboy.tamay@mati.edu.ph', 'Verboy H. Tamay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Verboy H. Tamay', 'Verboy', 'Hapay', 'Tamay', 'teacher_ii', 'BEED with MA Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Darry B.. Prudente
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129406_prudente_darry', 'darry.prudente@mati.edu.ph', 'Darry B.. Prudente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Darry B.. Prudente', 'Darry', 'Balaba', 'Prudente', 'teacher_i', 'ED.D Complete Academic Req.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  -- School: 129407 (11 personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '129407' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Kasandra Claudine G. Bakiao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_bakiao_kasandraclaudine', 'kasandraclaudine.bakiao@mati.edu.ph', 'Kasandra Claudine G. Bakiao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kasandra Claudine G. Bakiao', 'Kasandra Claudine', 'Gito', 'Bakiao', 'teacher_i', 'Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dela Peña ". "Bakiao
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_bakiao_delapea', 'delapea.bakiao@mati.edu.ph', 'Dela Peña ". "Bakiao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dela Peña ". "Bakiao', 'Dela Peña', 'D', '"Bakiao', 'teacher_i', 'T-1', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ciera Patrice P. Basas
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_basas_cierapatrice', 'cierapatrice.basas@mati.edu.ph', 'Ciera Patrice P. Basas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ciera Patrice P. Basas', 'Ciera Patrice', 'Porio', 'Basas', 'teacher_iii', 'Master Degree Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonabell Grace M. Cartalla
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_cartalla_jonabellgrace', 'jonabellgrace.cartalla@mati.edu.ph', 'Jonabell Grace M. Cartalla', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonabell Grace M. Cartalla', 'Jonabell Grace', 'Malintad', 'Cartalla', 'teacher_i', 'Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Flora Mae L. Dominguez
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_dominguez_floramae', 'floramae.dominguez@mati.edu.ph', 'Flora Mae L. Dominguez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Flora Mae L. Dominguez', 'Flora Mae', 'Ladisla', 'Dominguez', 'teacher_i', 'Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Romualdo S. Dapitanon
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_dapitanon_romualdo', 'romualdo.dapitanon@mati.edu.ph', 'Romualdo S. Dapitanon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Romualdo S. Dapitanon', 'Romualdo', 'Suico', 'Dapitanon', 'teacher_iii', 'Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Miraflor D. Pan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_pan_miraflor', 'miraflor.pan@mati.edu.ph', 'Miraflor D. Pan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Miraflor D. Pan', 'Miraflor', 'Dapitanon', 'Pan', 'teacher_iii', 'Master Degree Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christy M. Pan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_pan_christy', 'christy.pan@mati.edu.ph', 'Christy M. Pan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christy M. Pan', 'Christy', 'Montes', 'Pan', 'teacher_iii', 'Master Degree Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherryl C. Porio
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_porio_cherryl', 'cherryl.porio@mati.edu.ph', 'Cherryl C. Porio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherryl C. Porio', 'Cherryl', 'Comodas', 'Porio', 'master_teacher_i', 'Master Degree Graduate', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jay E. Rafols
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_rafols_jay', 'jay.rafols@mati.edu.ph', 'Jay E. Rafols', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jay E. Rafols', 'Jay', 'Espinosa', 'Rafols', 'teacher_i', 'Master Degree Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruel A.. Bonotan
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_129407_bonotan_ruel', 'ruel.bonotan@mati.edu.ph', 'Ruel A.. Bonotan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruel A.. Bonotan', 'Ruel', '', 'Bonotan', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  END IF;

  RAISE NOTICE 'Mati North District complete!';
END $$;

-- Verify
SELECT COUNT(*) as "Mati North Personnel" FROM teachers t 
JOIN schools s ON t.school_id = s.id 
WHERE s.district ILIKE '%Mati North%';
