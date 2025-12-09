-- ============================================================================
-- BATCH 4 - SECONDARY SCHOOLS PERSONNEL
-- Source: DepEd Division of City of Mati SF7 Masterlist (Secondary.csv)
-- Personnel Count: 753
-- ============================================================================

DO $$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
BEGIN
  RAISE NOTICE 'Processing Secondary Schools Personnel (753 teachers)...';

  -- School: BADAS NHS (325104) - 37 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '325104' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Hidah A. Agbas (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_agbas_hidah', 'hidah.agbas@mati.edu.ph', 'Hidah A. Agbas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hidah A. Agbas', 'Hidah', 'Arles', 'Agbas', 'master_teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bobby Brain B. Angos (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_angos_bobbybrain', 'bobbybrain.angos@mati.edu.ph', 'Bobby Brain B. Angos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bobby Brain B. Angos', 'Bobby Brain', 'Baloro', 'Angos', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bryan M. Caoile (HT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_caoile_bryan', 'bryan.caoile@mati.edu.ph', 'Bryan M. Caoile', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bryan M. Caoile', 'Bryan', 'Mahilum', 'Caoile', 'head_teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryl S. Caoile (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_caoile_sheryl', 'sheryl.caoile@mati.edu.ph', 'Sheryl S. Caoile', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryl S. Caoile', 'Sheryl', 'Salcedo', 'Caoile', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christina B. Cosal (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_cosal_christina', 'christina.cosal@mati.edu.ph', 'Christina B. Cosal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christina B. Cosal', 'Christina', 'Bagay', 'Cosal', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryl Mae B. Cose (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_cose_sherylmae', 'sherylmae.cose@mati.edu.ph', 'Sheryl Mae B. Cose', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryl Mae B. Cose', 'Sheryl Mae', 'Basmillo', 'Cose', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine Joy C. Cubelo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_cubelo_christinejoy', 'christinejoy.cubelo@mati.edu.ph', 'Christine Joy C. Cubelo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine Joy C. Cubelo', 'Christine Joy', 'Calabria', 'Cubelo', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lea Mae M. Dacillo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_dacillo_leamae', 'leamae.dacillo@mati.edu.ph', 'Lea Mae M. Dacillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lea Mae M. Dacillo', 'Lea Mae', 'Malayas', 'Dacillo', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rodave Jay M. Durante (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_durante_rodavejay', 'rodavejay.durante@mati.edu.ph', 'Rodave Jay M. Durante', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rodave Jay M. Durante', 'Rodave Jay', 'Mapinguez', 'Durante', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Precious Mae B. Galon (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_galon_preciousmae', 'preciousmae.galon@mati.edu.ph', 'Precious Mae B. Galon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Precious Mae B. Galon', 'Precious Mae', 'Bualan', 'Galon', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Role Symon R. Gomez (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_gomez_rolesymon', 'rolesymon.gomez@mati.edu.ph', 'Role Symon R. Gomez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Role Symon R. Gomez', 'Role Symon', 'Rondina', 'Gomez', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charlou P. Grape (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_grape_charlou', 'charlou.grape@mati.edu.ph', 'Charlou P. Grape', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charlou P. Grape', 'Charlou', 'Pagay', 'Grape', 'teacher_i', 'Agriculture & Fishery Arts', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ellen T. Ipes (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_ipes_ellen', 'ellen.ipes@mati.edu.ph', 'Ellen T. Ipes', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ellen T. Ipes', 'Ellen', 'Tilos', 'Ipes', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kyrl M. Mamilic (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_mamilic_kyrl', 'kyrl.mamilic@mati.edu.ph', 'Kyrl M. Mamilic', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kyrl M. Mamilic', 'Kyrl', 'Masisay', 'Mamilic', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leo A. Masanguid (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_masanguid_leo', 'leo.masanguid@mati.edu.ph', 'Leo A. Masanguid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leo A. Masanguid', 'Leo', 'Arles', 'Masanguid', 'teacher_i', 'Automotive', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cecille M. Masapa (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_masapa_cecille', 'cecille.masapa@mati.edu.ph', 'Cecille M. Masapa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cecille M. Masapa', 'Cecille', 'Mamada', 'Masapa', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lyn M. Montebon (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_montebon_lyn', 'lyn.montebon@mati.edu.ph', 'Lyn M. Montebon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lyn M. Montebon', 'Lyn', 'Caculba', 'Montebon', 'teacher_i', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charlotte T. Nini (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_nini_charlotte', 'charlotte.nini@mati.edu.ph', 'Charlotte T. Nini', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charlotte T. Nini', 'Charlotte', 'Celocia', 'Nini', 'teacher_ii', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leandro C. Ompad (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_ompad_leandro', 'leandro.ompad@mati.edu.ph', 'Leandro C. Ompad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leandro C. Ompad', 'Leandro', 'Caliwan', 'Ompad', 'master_teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alma D. Painlo (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_painlo_alma', 'alma.painlo@mati.edu.ph', 'Alma D. Painlo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alma D. Painlo', 'Alma', 'Dizon', 'Painlo', 'master_teacher_i', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rhealou S. Palma (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_palma_rhealou', 'rhealou.palma@mati.edu.ph', 'Rhealou S. Palma', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rhealou S. Palma', 'Rhealou', 'Sabello', 'Palma', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Remy M. Senabe (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_senabe_remy', 'remy.senabe@mati.edu.ph', 'Remy M. Senabe', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Remy M. Senabe', 'Remy', 'Mirambel', 'Senabe', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maricar S. Silvestre (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_silvestre_maricar', 'maricar.silvestre@mati.edu.ph', 'Maricar S. Silvestre', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maricar S. Silvestre', 'Maricar', 'Serra', 'Silvestre', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gloria L. Talidasan (HT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_talidasan_gloria', 'gloria.talidasan@mati.edu.ph', 'Gloria L. Talidasan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gloria L. Talidasan', 'Gloria', 'Lutog', 'Talidasan', 'head_teacher_ii', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joanne D. Veroy (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_veroy_joanne', 'joanne.veroy@mati.edu.ph', 'Joanne D. Veroy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joanne D. Veroy', 'Joanne', 'Dianito', 'Veroy', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jackilyn P.. Awa-ao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_awaao_jackilyn', 'jackilyn.awaao@mati.edu.ph', 'Jackilyn P.. Awa-ao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jackilyn P.. Awa-ao', 'Jackilyn', 'Pleños', 'Awa-ao', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace P. Banzon (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_banzon_grace', 'grace.banzon@mati.edu.ph', 'Grace P. Banzon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace P. Banzon', 'Grace', 'Pal', 'Banzon', 'teacher_ii', '"Biology Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rubie Jane B. Bebero (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_bebero_rubiejane', 'rubiejane.bebero@mati.edu.ph', 'Rubie Jane B. Bebero', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rubie Jane B. Bebero', 'Rubie Jane', 'Baliwan', 'Bebero', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Louie G. Javilles (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_javilles_louie', 'louie.javilles@mati.edu.ph', 'Louie G. Javilles', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Louie G. Javilles', 'Louie', 'Gracia', 'Javilles', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Usamah D. Maraorao (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_maraorao_usamah', 'usamah.maraorao@mati.edu.ph', 'Usamah D. Maraorao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Usamah D. Maraorao', 'Usamah', 'Dondoyano', 'Maraorao', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rachel L. Martinez (MT-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_martinez_rachel', 'rachel.martinez@mati.edu.ph', 'Rachel L. Martinez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rachel L. Martinez', 'Rachel', 'Lingawlingaw', 'Martinez', 'master_teacher_i', '"Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruben L. Untong (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_untong_ruben', 'ruben.untong@mati.edu.ph', 'Ruben L. Untong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruben L. Untong', 'Ruben', 'Layupan', 'Untong', 'teacher_ii', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- May Ann M. Amba (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_amba_mayann', 'mayann.amba@mati.edu.ph', 'May Ann M. Amba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'May Ann M. Amba', 'May Ann', 'Martinez', 'Amba', 'teacher_i', 'Information Teachnology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leomar P. Ignacio (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_ignacio_leomar', 'leomar.ignacio@mati.edu.ph', 'Leomar P. Ignacio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leomar P. Ignacio', 'Leomar', 'Peralta', 'Ignacio', 'teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa Mae M. Serenio (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_serenio_jessamae', 'jessamae.serenio@mati.edu.ph', 'Jessa Mae M. Serenio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa Mae M. Serenio', 'Jessa Mae', 'Marson', 'Serenio', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rachel P. Bautista (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_bautista_rachel', 'rachel.bautista@mati.edu.ph', 'Rachel P. Bautista', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rachel P. Bautista', 'Rachel', 'Pacto', 'Bautista', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocel May G. Barde (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325104_barde_jocelmay', 'jocelmay.barde@mati.edu.ph', 'Jocel May G. Barde', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocel May G. Barde', 'Jocel May', 'Galvez', 'Barde', 'teacher_ii', 'Mathematics/MAED Educ Mgt.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 325104 not found';
  END IF;

  -- School: BOBON NHS (304303) - 29 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304303' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Mae Ann S. Ampo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_ampo_maeann', 'maeann.ampo@mati.edu.ph', 'Mae Ann S. Ampo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae Ann S. Ampo', 'Mae Ann', 'Señor', 'Ampo', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Camelle Kate A.. Barbas (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_barbas_camellekate', 'camellekate.barbas@mati.edu.ph', 'Camelle Kate A.. Barbas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Camelle Kate A.. Barbas', 'Camelle Kate', 'Alinsoot', 'Barbas', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aisa P. Biabe (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_biabe_aisa', 'aisa.biabe@mati.edu.ph', 'Aisa P. Biabe', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aisa P. Biabe', 'Aisa', 'Pulot', 'Biabe', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristhyl Mae M. Blas (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_blas_kristhylmae', 'kristhylmae.blas@mati.edu.ph', 'Kristhyl Mae M. Blas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristhyl Mae M. Blas', 'Kristhyl Mae', 'Malintad', 'Blas', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Riza B. Romena (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_romena_riza', 'riza.romena@mati.edu.ph', 'Riza B. Romena', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Riza B. Romena', 'Riza', 'Bucio', 'Romena', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marsend Jade C. Franza (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_franza_marsendjade', 'marsendjade.franza@mati.edu.ph', 'Marsend Jade C. Franza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marsend Jade C. Franza', 'Marsend Jade', 'Celerinos', 'Franza', 'master_teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jean C. Franza (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_franza_jean', 'jean.franza@mati.edu.ph', 'Jean C. Franza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jean C. Franza', 'Jean', 'Cabingatan', 'Franza', 'teacher_i', 'BS Nursing/ Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- RUBEN . Lague (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_lague_ruben', 'ruben.lague@mati.edu.ph', 'RUBEN . Lague', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'RUBEN . Lague', 'RUBEN', '', 'Lague', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cynthia A. Lasco (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_lasco_cynthia', 'cynthia.lasco@mati.edu.ph', 'Cynthia A. Lasco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cynthia A. Lasco', 'Cynthia', 'Almosura', 'Lasco', 'teacher_iii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sitti Mona F. Magtacpao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_magtacpao_sittimona', 'sittimona.magtacpao@mati.edu.ph', 'Sitti Mona F. Magtacpao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sitti Mona F. Magtacpao', 'Sitti Mona', 'Feliciano', 'Magtacpao', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Merlyn M. Malabar (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_malabar_merlyn', 'merlyn.malabar@mati.edu.ph', 'Merlyn M. Malabar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Merlyn M. Malabar', 'Merlyn', 'Moreno', 'Malabar', 'teacher_i', 'Values Ed', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roche N. Macatabog (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_macatabog_roche', 'roche.macatabog@mati.edu.ph', 'Roche N. Macatabog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roche N. Macatabog', 'Roche', 'Nicolas', 'Macatabog', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Constancio S. Rabaño (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_rabao_constancio', 'constancio.rabao@mati.edu.ph', 'Constancio S. Rabaño', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Constancio S. Rabaño', 'Constancio', 'Sab-a', 'Rabaño', 'teacher_ii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elizabeth L. Roena (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_roena_elizabeth', 'elizabeth.roena@mati.edu.ph', 'Elizabeth L. Roena', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elizabeth L. Roena', 'Elizabeth', 'Lazo', 'Roena', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonathan P. Rosa (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_rosa_jonathan', 'jonathan.rosa@mati.edu.ph', 'Jonathan P. Rosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonathan P. Rosa', 'Jonathan', 'Pardillo', 'Rosa', 'teacher_i', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edgar R. Ruelo (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_ruelo_edgar', 'edgar.ruelo@mati.edu.ph', 'Edgar R. Ruelo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edgar R. Ruelo', 'Edgar', 'Reseroni', 'Ruelo', 'master_teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aiza Rizelle T. Serapio (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_serapio_aizarizelle', 'aizarizelle.serapio@mati.edu.ph', 'Aiza Rizelle T. Serapio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aiza Rizelle T. Serapio', 'Aiza Rizelle', 'Tampuso', 'Serapio', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Tefany G. Serapio (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_serapio_tefany', 'tefany.serapio@mati.edu.ph', 'Tefany G. Serapio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Tefany G. Serapio', 'Tefany', 'Gayta', 'Serapio', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Louelene S. Solano (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_solano_louelene', 'louelene.solano@mati.edu.ph', 'Louelene S. Solano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Louelene S. Solano', 'Louelene', 'Seniel', 'Solano', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rialoche G. Suelto (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_suelto_rialoche', 'rialoche.suelto@mati.edu.ph', 'Rialoche G. Suelto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rialoche G. Suelto', 'Rialoche', 'Gelles', 'Suelto', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rhea Mae D. Wenceslao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_wenceslao_rheamae', 'rheamae.wenceslao@mati.edu.ph', 'Rhea Mae D. Wenceslao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rhea Mae D. Wenceslao', 'Rhea Mae', 'Dela Cruz', 'Wenceslao', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rhea C.. Villegas (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_villegas_rhea', 'rhea.villegas@mati.edu.ph', 'Rhea C.. Villegas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rhea C.. Villegas', 'Rhea', 'Caritativo', 'Villegas', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Claribel B.. Barte (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_barte_claribel', 'claribel.barte@mati.edu.ph', 'Claribel B.. Barte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Claribel B.. Barte', 'Claribel', 'Bancale', 'Barte', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alfie B.. Alojado (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_alojado_alfie', 'alfie.alojado@mati.edu.ph', 'Alfie B.. Alojado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alfie B.. Alojado', 'Alfie', 'Bondad', 'Alojado', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mila Mae M. Mahumot (MT-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_mahumot_milamae', 'milamae.mahumot@mati.edu.ph', 'Mila Mae M. Mahumot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mila Mae M. Mahumot', 'Mila Mae', 'Mahumoc', 'Mahumot', 'master_teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Meshal M. Manuel (SST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_manuel_meshal', 'meshal.manuel@mati.edu.ph', 'Meshal M. Manuel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Meshal M. Manuel', 'Meshal', 'Magtacpao', 'Manuel', 'teacher_ii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leonell John S.. Miranda (SST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_miranda_leonelljohn', 'leonelljohn.miranda@mati.edu.ph', 'Leonell John S.. Miranda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leonell John S.. Miranda', 'Leonell John', 'Santizas', 'Miranda', 'teacher_ii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rexoneil B.. Pepito (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_pepito_rexoneil', 'rexoneil.pepito@mati.edu.ph', 'Rexoneil B.. Pepito', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rexoneil B.. Pepito', 'Rexoneil', 'Bordaje', 'Pepito', 'teacher_i', 'Agri-Fishery Arts', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Felipe II J. Sucuano (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304303_sucuano_felipeii', 'felipeii.sucuano@mati.edu.ph', 'Felipe II J. Sucuano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Felipe II J. Sucuano', 'Felipe II', '', 'Sucuano', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304303 not found';
  END IF;

  -- School: BUSO NHS (304305) - 26 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304305' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Luther . Canonio (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_canonio_luther', 'luther.canonio@mati.edu.ph', 'Luther . Canonio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Luther . Canonio', 'Luther', '', 'Canonio', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nerissa P. Andan (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_andan_nerissa', 'nerissa.andan@mati.edu.ph', 'Nerissa P. Andan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nerissa P. Andan', 'Nerissa', 'Pada', 'Andan', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherry Eddine A.. Ardiente (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_ardiente_cherryeddine', 'cherryeddine.ardiente@mati.edu.ph', 'Cherry Eddine A.. Ardiente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherry Eddine A.. Ardiente', 'Cherry Eddine', '', 'Ardiente', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou M. Badolato (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_badolato_marilou', 'marilou.badolato@mati.edu.ph', 'Marilou M. Badolato', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou M. Badolato', 'Marilou', 'Matapias', 'Badolato', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaymar D. Batidor (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_batidor_jaymar', 'jaymar.batidor@mati.edu.ph', 'Jaymar D. Batidor', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaymar D. Batidor', 'Jaymar', 'Donato', 'Batidor', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chris Vincent C. Damayo (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_damayo_chrisvincent', 'chrisvincent.damayo@mati.edu.ph', 'Chris Vincent C. Damayo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chris Vincent C. Damayo', 'Chris Vincent', 'Claro', 'Damayo', 'teacher_iii', 'INFORMATION TECHNOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Khrisper Jane S. Del Mar (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_delmar_khrisperjane', 'khrisperjane.delmar@mati.edu.ph', 'Khrisper Jane S. Del Mar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Khrisper Jane S. Del Mar', 'Khrisper Jane', 'Sarmiento', 'Del Mar', 'teacher_i', 'BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chamibher M. Halipa (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_halipa_chamibher', 'chamibher.halipa@mati.edu.ph', 'Chamibher M. Halipa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chamibher M. Halipa', 'Chamibher', 'Magnaus', 'Halipa', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ismael B. Lintuan (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_lintuan_ismael', 'ismael.lintuan@mati.edu.ph', 'Ismael B. Lintuan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ismael B. Lintuan', 'Ismael', 'Bualan', 'Lintuan', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jerry B. Mocoy (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_mocoy_jerry', 'jerry.mocoy@mati.edu.ph', 'Jerry B. Mocoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jerry B. Mocoy', 'Jerry', 'Banlasan', 'Mocoy', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maridel J. Odoy (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_odoy_maridel', 'maridel.odoy@mati.edu.ph', 'Maridel J. Odoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maridel J. Odoy', 'Maridel', 'Jumamoy', 'Odoy', 'teacher_iii', 'PHYSICAL EDUCATION', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annielou O. Piamonte (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_piamonte_annielou', 'annielou.piamonte@mati.edu.ph', 'Annielou O. Piamonte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annielou O. Piamonte', 'Annielou', 'Obre', 'Piamonte', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Myra M. Plarisan (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_plarisan_myra', 'myra.plarisan@mati.edu.ph', 'Myra M. Plarisan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Myra M. Plarisan', 'Myra', 'Martinez', 'Plarisan', 'teacher_iii', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ked P. Porlares (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_porlares_ked', 'ked.porlares@mati.edu.ph', 'Ked P. Porlares', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ked P. Porlares', 'Ked', 'Patrocino', 'Porlares', 'teacher_ii', 'PHYSICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Francis Troy G. Suerte (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_suerte_francistroy', 'francistroy.suerte@mati.edu.ph', 'Francis Troy G. Suerte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Francis Troy G. Suerte', 'Francis Troy', '', 'Suerte', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anna Lovella C. Taculod (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_taculod_annalovella', 'annalovella.taculod@mati.edu.ph', 'Anna Lovella C. Taculod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anna Lovella C. Taculod', 'Anna Lovella', 'Cuanan', 'Taculod', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Archel M.. Wenceslao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_wenceslao_archel', 'archel.wenceslao@mati.edu.ph', 'Archel M.. Wenceslao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Archel M.. Wenceslao', 'Archel', 'Mendoza', 'Wenceslao', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vicky G. Miedes (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_miedes_vicky', 'vicky.miedes@mati.edu.ph', 'Vicky G. Miedes', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vicky G. Miedes', 'Vicky', 'Guardario', 'Miedes', 'teacher_i', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lady Lyn S. Lintuan (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_lintuan_ladylyn', 'ladylyn.lintuan@mati.edu.ph', 'Lady Lyn S. Lintuan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lady Lyn S. Lintuan', 'Lady Lyn', 'Saumat', 'Lintuan', 'teacher_iii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jerwin J. Vidal (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_vidal_jerwin', 'jerwin.vidal@mati.edu.ph', 'Jerwin J. Vidal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jerwin J. Vidal', 'Jerwin', 'Josolan', 'Vidal', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Jean B. Vidal (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_vidal_maryjean', 'maryjean.vidal@mati.edu.ph', 'Mary Jean B. Vidal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Jean B. Vidal', 'Mary Jean', 'Bernal', 'Vidal', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alie Grace S. Ibañez (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_ibaez_aliegrace', 'aliegrace.ibaez@mati.edu.ph', 'Alie Grace S. Ibañez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alie Grace S. Ibañez', 'Alie Grace', 'Soliven', 'Ibañez', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Demebel C. GIL (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_gil_demebel', 'demebel.gil@mati.edu.ph', 'Demebel C. GIL', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Demebel C. GIL', 'Demebel', 'Crispolo', 'GIL', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Richard M.. Acpac (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_acpac_richard', 'richard.acpac@mati.edu.ph', 'Richard M.. Acpac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Richard M.. Acpac', 'Richard', 'Macpao', 'Acpac', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gelma . Nonong (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_nonong_gelma', 'gelma.nonong@mati.edu.ph', 'Gelma . Nonong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gelma . Nonong', 'Gelma', '', 'Nonong', 'teacher_i', 'TVL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jayve James B.. Bautista (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304305_bautista_jayvejames', 'jayvejames.bautista@mati.edu.ph', 'Jayve James B.. Bautista', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jayve James B.. Bautista', 'Jayve James', 'Bantasan', 'Bautista', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304305 not found';
  END IF;

  -- School: CABUAYA IS (501085) - 4 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501085' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- MARJORIE M. Diano (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501085_diano_marjorie', 'marjorie.diano@mati.edu.ph', 'MARJORIE M. Diano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'MARJORIE M. Diano', 'MARJORIE', 'Manulat', 'Diano', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fernando Jr. M. Ompad (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501085_ompad_fernandojr', 'fernandojr..ompad@mati.edu.ph', 'Fernando Jr. M. Ompad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fernando Jr. M. Ompad', 'Fernando Jr.', 'Morales', 'Ompad', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Walter F.. Quer (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501085_quer_walter', 'walter.quer@mati.edu.ph', 'Walter F.. Quer', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Walter F.. Quer', 'Walter', 'Feliciados', 'Quer', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- JOVANNI P. Revalde (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501085_revalde_jovanni', 'jovanni.revalde@mati.edu.ph', 'JOVANNI P. Revalde', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'JOVANNI P. Revalde', 'JOVANNI', 'Prieto', 'Revalde', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 501085 not found';
  END IF;

  -- School: CITY OF MATI NATIONAL HIGH SCHOOL (305680) - 44 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '305680' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Jayson Q. Alas (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_alas_jayson', 'jayson.alas@mati.edu.ph', 'Jayson Q. Alas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jayson Q. Alas', 'Jayson', 'Quillope', 'Alas', 'teacher_i', 'BPE - SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Apple Mae D. Cabilogan (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_cabilogan_applemae', 'applemae.cabilogan@mati.edu.ph', 'Apple Mae D. Cabilogan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Apple Mae D. Cabilogan', 'Apple Mae', 'Dakila', 'Cabilogan', 'teacher_i', 'BSED - Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Loraine Marie L. Dayao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_dayao_lorainemarie', 'lorainemarie.dayao@mati.edu.ph', 'Loraine Marie L. Dayao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Loraine Marie L. Dayao', 'Loraine Marie', '', 'Dayao', 'teacher_i', 'BSED - TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Romualdo F. Castillo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_castillo_romualdo', 'romualdo.castillo@mati.edu.ph', 'Romualdo F. Castillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Romualdo F. Castillo', 'Romualdo', 'Francis', 'Castillo', 'teacher_i', 'BSBA/ Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jan Joyce D. Dela Cerna (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_delacerna_janjoyce', 'janjoyce.delacerna@mati.edu.ph', 'Jan Joyce D. Dela Cerna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jan Joyce D. Dela Cerna', 'Jan Joyce', 'Dapitanon', 'Dela Cerna', 'teacher_i', 'BPE - SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lyka May P. Larrobis (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_larrobis_lykamay', 'lykamay.larrobis@mati.edu.ph', 'Lyka May P. Larrobis', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lyka May P. Larrobis', 'Lyka May', 'Pontana', 'Larrobis', 'teacher_i', 'BSBA/ Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Philip C. Nuñez (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_nuez_philip', 'philip.nuez@mati.edu.ph', 'Philip C. Nuñez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Philip C. Nuñez', 'Philip', 'Corteciano', 'Nuñez', 'teacher_i', 'BSED - Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Xena Maryelle P. Pann (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_pann_xenamaryelle', 'xenamaryelle.pann@mati.edu.ph', 'Xena Maryelle P. Pann', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Xena Maryelle P. Pann', 'Xena Maryelle', 'Parot', 'Pann', 'teacher_i', 'BPE - SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Stepane H. Polvorosa (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_polvorosa_stepane', 'stepane.polvorosa@mati.edu.ph', 'Stepane H. Polvorosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Stepane H. Polvorosa', 'Stepane', 'Hira', 'Polvorosa', 'teacher_ii', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rheamie G. Santos (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_santos_rheamie', 'rheamie.santos@mati.edu.ph', 'Rheamie G. Santos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rheamie G. Santos', 'Rheamie', 'Gulane', 'Santos', 'teacher_i', 'BSED - Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Patricia Carla N. Undang (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_undang_patriciacarla', 'patriciacarla.undang@mati.edu.ph', 'Patricia Carla N. Undang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Patricia Carla N. Undang', 'Patricia Carla', 'Nadonza', 'Undang', 'teacher_i', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eduardo P. Ybañez (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_ybaez_eduardo', 'eduardo.ybaez@mati.edu.ph', 'Eduardo P. Ybañez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eduardo P. Ybañez', 'Eduardo', 'Pateres', 'Ybañez', 'master_teacher_i', 'BSED - Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christian Joel R. Alfuerto (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_alfuerto_christianjoel', 'christianjoel.alfuerto@mati.edu.ph', 'Christian Joel R. Alfuerto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christian Joel R. Alfuerto', 'Christian Joel', 'Rulona', 'Alfuerto', 'teacher_i', 'BSED - Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kenneth A. Babiera (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_babiera_kenneth', 'kenneth.babiera@mati.edu.ph', 'Kenneth A. Babiera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kenneth A. Babiera', 'Kenneth', 'Adlawon', 'Babiera', 'teacher_i', 'BA Music', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edsel Novem R. Monderondo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_monderondo_edselnovem', 'edselnovem.monderondo@mati.edu.ph', 'Edsel Novem R. Monderondo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edsel Novem R. Monderondo', 'Edsel Novem', 'Reyes', 'Monderondo', 'teacher_i', 'BPE - SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mark Wesly . Requirme (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_requirme_markwesly', 'markwesly.requirme@mati.edu.ph', 'Mark Wesly . Requirme', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mark Wesly . Requirme', 'Mark Wesly', '', 'Requirme', 'teacher_i', 'BSED - Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Norhaima M. Timosa (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_timosa_norhaima', 'norhaima.timosa@mati.edu.ph', 'Norhaima M. Timosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Norhaima M. Timosa', 'Norhaima', 'Mastura', 'Timosa', 'teacher_i', 'BSED - Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leanne Joy V. Bakiao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_bakiao_leannejoy', 'leannejoy.bakiao@mati.edu.ph', 'Leanne Joy V. Bakiao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leanne Joy V. Bakiao', 'Leanne Joy', 'Vicentino', 'Bakiao', 'teacher_i', 'BPE - SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Armando Jr. T. Dao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_dao_armandojr', 'armandojr..dao@mati.edu.ph', 'Armando Jr. T. Dao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Armando Jr. T. Dao', 'Armando Jr.', 'Tabuada', 'Dao', 'teacher_i', 'BSED - Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ana Roberta M. Diez (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_diez_anaroberta', 'anaroberta.diez@mati.edu.ph', 'Ana Roberta M. Diez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ana Roberta M. Diez', 'Ana Roberta', 'Mondonedo', 'Diez', 'teacher_i', 'BSED - Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mara Monica . Maglente (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_maglente_maramonica', 'maramonica.maglente@mati.edu.ph', 'Mara Monica . Maglente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mara Monica . Maglente', 'Mara Monica', '', 'Maglente', 'teacher_i', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherrie Mae C. Samot (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_samot_cherriemae', 'cherriemae.samot@mati.edu.ph', 'Cherrie Mae C. Samot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherrie Mae C. Samot', 'Cherrie Mae', 'Capute', 'Samot', 'teacher_i', 'BSED - TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roselle Joy P. Sajonia (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_sajonia_rosellejoy', 'rosellejoy.sajonia@mati.edu.ph', 'Roselle Joy P. Sajonia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roselle Joy P. Sajonia', 'Roselle Joy', 'Painlo', 'Sajonia', 'teacher_i', 'BSED - Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angela Rose D. Mangayon (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_mangayon_angelarose', 'angelarose.mangayon@mati.edu.ph', 'Angela Rose D. Mangayon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angela Rose D. Mangayon', 'Angela Rose', 'Dominguez', 'Mangayon', 'teacher_iii', 'BPE - SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nur-ain M. Tiago (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_tiago_nurain', 'nurain.tiago@mati.edu.ph', 'Nur-ain M. Tiago', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nur-ain M. Tiago', 'Nur-ain', 'Matias', 'Tiago', 'teacher_i', 'BSBA/ Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Twinkle Pearl M. Ardiente (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_ardiente_twinklepearl', 'twinklepearl.ardiente@mati.edu.ph', 'Twinkle Pearl M. Ardiente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Twinkle Pearl M. Ardiente', 'Twinkle Pearl', 'Mamanao', 'Ardiente', 'teacher_i', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Salome P. Alce (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_alce_salome', 'salome.alce@mati.edu.ph', 'Salome P. Alce', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Salome P. Alce', 'Salome', 'Pleños', 'Alce', 'teacher_i', 'BSIT/ Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Cristina J. Veniegas (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_veniegas_macristina', 'ma.cristina.veniegas@mati.edu.ph', 'Ma. Cristina J. Veniegas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Cristina J. Veniegas', 'Ma. Cristina', 'Javier', 'Veniegas', 'teacher_i', 'BSED - Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Reniel G. Veniegas (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_veniegas_reniel', 'reniel.veniegas@mati.edu.ph', 'Reniel G. Veniegas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Reniel G. Veniegas', 'Reniel', 'Golingay', 'Veniegas', 'teacher_i', 'BSED - Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hanani Lois M. Marianito (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_marianito_hananilois', 'hananilois.marianito@mati.edu.ph', 'Hanani Lois M. Marianito', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hanani Lois M. Marianito', 'Hanani Lois', 'Martije', 'Marianito', 'teacher_i', '"Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Georgie B.. Cabonita (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_cabonita_georgie', 'georgie.cabonita@mati.edu.ph', 'Georgie B.. Cabonita', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Georgie B.. Cabonita', 'Georgie', 'Burlas', 'Cabonita', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Giersh Carmathele Jan Prigene O.. Rosa (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_rosa_giershcarmathelejanprigene', 'giershcarmathelejanprigene.rosa@mati.edu.ph', 'Giersh Carmathele Jan Prigene O.. Rosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Giersh Carmathele Jan Prigene O.. Rosa', 'Giersh Carmathele Jan Prigene', '', 'Rosa', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alaima D.. Amiang (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_amiang_alaima', 'alaima.amiang@mati.edu.ph', 'Alaima D.. Amiang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alaima D.. Amiang', 'Alaima', 'Duallo', 'Amiang', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roderick M. Aligato (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_aligato_roderick', 'roderick.aligato@mati.edu.ph', 'Roderick M. Aligato', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roderick M. Aligato', 'Roderick', 'Malimbasao', 'Aligato', 'teacher_i', 'BPE - SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Richelle T. Casagda (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_casagda_richelle', 'richelle.casagda@mati.edu.ph', 'Richelle T. Casagda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Richelle T. Casagda', 'Richelle', 'Tabucanon', 'Casagda', 'teacher_ii', 'BS DevCom/ English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Giesthy Love Joice R. Donggon (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_donggon_giesthylovejoice', 'giesthylovejoice.donggon@mati.edu.ph', 'Giesthy Love Joice R. Donggon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Giesthy Love Joice R. Donggon', 'Giesthy Love Joice', 'Rosa', 'Donggon', 'teacher_ii', 'BS Nursing/ Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Rose D. Magandam (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_magandam_maryrose', 'maryrose.magandam@mati.edu.ph', 'Mary Rose D. Magandam', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Rose D. Magandam', 'Mary Rose', 'Donato', 'Magandam', 'teacher_i', 'BSED - Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michelle B. Ortiz (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_ortiz_michelle', 'michelle.ortiz@mati.edu.ph', 'Michelle B. Ortiz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michelle B. Ortiz', 'Michelle', 'Bordaje', 'Ortiz', 'teacher_i', 'BSIT/ Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenny M. Sarcia (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_sarcia_jenny', 'jenny.sarcia@mati.edu.ph', 'Jenny M. Sarcia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenny M. Sarcia', 'Jenny', 'Mahinay', 'Sarcia', 'teacher_i', 'BSIT/ Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine C. Tibug (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_tibug_christine', 'christine.tibug@mati.edu.ph', 'Christine C. Tibug', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine C. Tibug', 'Christine', 'Cabras', 'Tibug', 'teacher_i', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine R. Tulin (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_tulin_christine', 'christine.tulin@mati.edu.ph', 'Christine R. Tulin', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine R. Tulin', 'Christine', 'Recitas', 'Tulin', 'teacher_ii', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lyra Mae P. Villar (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_villar_lyramae', 'lyramae.villar@mati.edu.ph', 'Lyra Mae P. Villar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lyra Mae P. Villar', 'Lyra Mae', 'Poblete', 'Villar', 'teacher_i', 'BSED - English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dashiel Jeth T. Monton (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_monton_dashieljeth', 'dashieljeth.monton@mati.edu.ph', 'Dashiel Jeth T. Monton', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dashiel Jeth T. Monton', 'Dashiel Jeth', 'Tibug', 'Monton', 'teacher_i', 'BPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherre Mae I.. Pahamutang (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_305680_pahamutang_cherremae', 'cherremae.pahamutang@mati.edu.ph', 'Cherre Mae I.. Pahamutang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherre Mae I.. Pahamutang', 'Cherre Mae', 'Ignacio', 'Pahamutang', 'teacher_i', 'BSED- Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 305680 not found';
  END IF;

  -- School: CULIAN IS (501424) - 6 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501424' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Mae Jane A.. Camilo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501424_camilo_maejane', 'maejane.camilo@mati.edu.ph', 'Mae Jane A.. Camilo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae Jane A.. Camilo', 'Mae Jane', 'Avenido', 'Camilo', 'teacher_i', 'BS Biology w/ Educ Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noe S. Gayoso (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501424_gayoso_noe', 'noe.gayoso@mati.edu.ph', 'Noe S. Gayoso', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noe S. Gayoso', 'Noe', 'Sialonga', 'Gayoso', 'teacher_i', 'BSED Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaynea M. Bastida (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501424_bastida_jaynea', 'jaynea.bastida@mati.edu.ph', 'Jaynea M. Bastida', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaynea M. Bastida', 'Jaynea', 'Matapid', 'Bastida', 'teacher_i', 'BSED Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jurie S.. Fernandez (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501424_fernandez_jurie', 'jurie.fernandez@mati.edu.ph', 'Jurie S.. Fernandez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jurie S.. Fernandez', 'Jurie', 'Sumimba', 'Fernandez', 'teacher_i', 'BSED TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Glenn Mar B. Raguro (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501424_raguro_glennmar', 'glennmar.raguro@mati.edu.ph', 'Glenn Mar B. Raguro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Glenn Mar B. Raguro', 'Glenn Mar', 'Baco', 'Raguro', 'teacher_i', 'BS Biology w/ Educ units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dante M. Arellano (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501424_arellano_dante', 'dante.arellano@mati.edu.ph', 'Dante M. Arellano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dante M. Arellano', 'Dante', 'Minoza', 'Arellano', 'teacher_i', 'BSED Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 501424 not found';
  END IF;

  -- School: DAWAN NHS (304313) - 35 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304313' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Jodel Bryan A.. Aloba (SST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_aloba_jodelbryan', 'jodelbryan.aloba@mati.edu.ph', 'Jodel Bryan A.. Aloba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jodel Bryan A.. Aloba', 'Jodel Bryan', 'Alicaway', 'Aloba', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Gracia S. Arlalejo (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_arlalejo_mariagracia', 'mariagracia.arlalejo@mati.edu.ph', 'Maria Gracia S. Arlalejo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Gracia S. Arlalejo', 'Maria Gracia', 'Sabay', 'Arlalejo', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joemar . Baltonado (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_baltonado_joemar', 'joemar.baltonado@mati.edu.ph', 'Joemar . Baltonado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joemar . Baltonado', 'Joemar', '', 'Baltonado', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maricel P. Banguis (SST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_banguis_maricel', 'maricel.banguis@mati.edu.ph', 'Maricel P. Banguis', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maricel P. Banguis', 'Maricel', 'Pango', 'Banguis', 'teacher_ii', 'DEV.COM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emily O. Batisting (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_batisting_emily', 'emily.batisting@mati.edu.ph', 'Emily O. Batisting', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emily O. Batisting', 'Emily', 'Oponda', 'Batisting', 'teacher_i', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rey T. Campion (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_campion_rey', 'rey.campion@mati.edu.ph', 'Rey T. Campion', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rey T. Campion', 'Rey', 'Tulang', 'Campion', 'teacher_i', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Honey Jane C. Masugod (SST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_masugod_honeyjane', 'honeyjane.masugod@mati.edu.ph', 'Honey Jane C. Masugod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Honey Jane C. Masugod', 'Honey Jane', 'Cabilar', 'Masugod', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aldemar M. Cuaton (SST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_cuaton_aldemar', 'aldemar.cuaton@mati.edu.ph', 'Aldemar M. Cuaton', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aldemar M. Cuaton', 'Aldemar', 'Masambay', 'Cuaton', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marc Lenson L.. Etang (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_etang_marclenson', 'marclenson.etang@mati.edu.ph', 'Marc Lenson L.. Etang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marc Lenson L.. Etang', 'Marc Lenson', 'Lazaga', 'Etang', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eva B. Escala (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_escala_eva', 'eva.escala@mati.edu.ph', 'Eva B. Escala', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eva B. Escala', 'Eva', 'Baclay', 'Escala', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Avelino F. Gubalane (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_gubalane_avelino', 'avelino.gubalane@mati.edu.ph', '"Avelino F. Gubalane', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Avelino F. Gubalane', '"Avelino', 'Flores', 'Gubalane', 'teacher_i', 'SST-II', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nicanor M. Hugue (HT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_hugue_nicanor', 'nicanor.hugue@mati.edu.ph', 'Nicanor M. Hugue', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nicanor M. Hugue', 'Nicanor', 'Maliga', 'Hugue', 'head_teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jimboy . Huerto (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_huerto_jimboy', 'jimboy.huerto@mati.edu.ph', 'Jimboy . Huerto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jimboy . Huerto', 'Jimboy', '', 'Huerto', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lelibeth S. Libres (SST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_libres_lelibeth', 'lelibeth.libres@mati.edu.ph', 'Lelibeth S. Libres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lelibeth S. Libres', 'Lelibeth', 'Sinto', 'Libres', 'teacher_i', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leopoldo Jr. N. Malaay (SST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_malaay_leopoldojr', 'leopoldojr..malaay@mati.edu.ph', 'Leopoldo Jr. N. Malaay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leopoldo Jr. N. Malaay', 'Leopoldo Jr.', 'Napoles', 'Malaay', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janeth A. Mapa (SST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_mapa_janeth', 'janeth.mapa@mati.edu.ph', 'Janeth A. Mapa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janeth A. Mapa', 'Janeth', 'Arlalejo', 'Mapa', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kieth P. Nalam (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_nalam_kieth', 'kieth.nalam@mati.edu.ph', 'Kieth P. Nalam', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kieth P. Nalam', 'Kieth', 'Pareño', 'Nalam', 'teacher_i', 'PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arnel R. Pahid (SST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_pahid_arnel', 'arnel.pahid@mati.edu.ph', 'Arnel R. Pahid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arnel R. Pahid', 'Arnel', 'Rebamonte', 'Pahid', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elmar M. Pagayawan (MT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_pagayawan_elmar', 'elmar.pagayawan@mati.edu.ph', 'Elmar M. Pagayawan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elmar M. Pagayawan', 'Elmar', 'Monson', 'Pagayawan', 'master_teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Rose Belinda S.. Paleguin (SST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_paleguin_marosebelinda', 'ma.rosebelinda.paleguin@mati.edu.ph', 'Ma. Rose Belinda S.. Paleguin', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Rose Belinda S.. Paleguin', 'Ma. Rose Belinda', 'Suganob', 'Paleguin', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ralph James S. Sinday (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_sinday_ralphjames', 'ralphjames.sinday@mati.edu.ph', 'Ralph James S. Sinday', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ralph James S. Sinday', 'Ralph James', 'Sagun', 'Sinday', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Everlyn P. Reseroni (SST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_reseroni_everlyn', 'everlyn.reseroni@mati.edu.ph', 'Everlyn P. Reseroni', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Everlyn P. Reseroni', 'Everlyn', 'Pagayon', 'Reseroni', 'teacher_ii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daisy R. Yosores (SST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_yosores_daisy', 'daisy.yosores@mati.edu.ph', 'Daisy R. Yosores', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daisy R. Yosores', 'Daisy', 'Roble', 'Yosores', 'teacher_ii', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Monalyn T. Verano (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_verano_monalyn', 'monalyn.verano@mati.edu.ph', 'Monalyn T. Verano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Monalyn T. Verano', 'Monalyn', 'Tagolino', 'Verano', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- John Ford Kennedy P. Pandili (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_pandili_johnfordkennedy', 'johnfordkennedy.pandili@mati.edu.ph', 'John Ford Kennedy P. Pandili', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'John Ford Kennedy P. Pandili', 'John Ford Kennedy', 'Penaflor', 'Pandili', 'teacher_i', 'Mechanical Technology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Rudith S. Bacolod (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_bacolod_mariarudith', 'mariarudith.bacolod@mati.edu.ph', 'Maria Rudith S. Bacolod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Rudith S. Bacolod', 'Maria Rudith', 'Sapio', 'Bacolod', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Francois L. Guias (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_guias_francois', 'francois.guias@mati.edu.ph', 'Francois L. Guias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Francois L. Guias', 'Francois', 'Lemente', 'Guias', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arnold A. Mapa (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_mapa_arnold', 'arnold.mapa@mati.edu.ph', 'Arnold A. Mapa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arnold A. Mapa', 'Arnold', 'Apares', 'Mapa', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nelian M. Solibio (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_solibio_nelian', 'nelian.solibio@mati.edu.ph', 'Nelian M. Solibio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nelian M. Solibio', 'Nelian', 'Maguindanao', 'Solibio', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lin Mae R. Toñares (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_toares_linmae', 'linmae.toares@mati.edu.ph', 'Lin Mae R. Toñares', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lin Mae R. Toñares', 'Lin Mae', 'Roslinda', 'Toñares', 'teacher_ii', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaimelita V. Vero (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_vero_jaimelita', 'jaimelita.vero@mati.edu.ph', 'Jaimelita V. Vero', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaimelita V. Vero', 'Jaimelita', 'Verano', 'Vero', 'teacher_ii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marielle P. Petere (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_petere_marielle', 'marielle.petere@mati.edu.ph', 'Marielle P. Petere', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marielle P. Petere', 'Marielle', 'Parilla', 'Petere', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sunshine Grace A. Hermano (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_hermano_sunshinegrace', 'sunshinegrace.hermano@mati.edu.ph', 'Sunshine Grace A. Hermano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sunshine Grace A. Hermano', 'Sunshine Grace', 'Abueva', 'Hermano', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ryan R. Oppos (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_oppos_ryan', 'ryan.oppos@mati.edu.ph', 'Ryan R. Oppos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ryan R. Oppos', 'Ryan', 'Rebosura', 'Oppos', 'teacher_i', 'PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jecka Mae B.. Daligdig (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304313_daligdig_jeckamae', 'jeckamae.daligdig@mati.edu.ph', 'Jecka Mae B.. Daligdig', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jecka Mae B.. Daligdig', 'Jecka Mae', 'Bongco', 'Daligdig', 'teacher_i', 'Bachelor of Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304313 not found';
  END IF;

  -- School: DAVAO ORIENTAL REGIONAL SCIENCE HS (304328) - 35 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304328' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Lorie Mae A. Babiera (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_babiera_loriemae', 'loriemae.babiera@mati.edu.ph', 'Lorie Mae A. Babiera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lorie Mae A. Babiera', 'Lorie Mae', 'Abrea', 'Babiera', 'teacher_iii', 'Bio. Science/Gen. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lotus M. Burgos (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_burgos_lotus', 'lotus.burgos@mati.edu.ph', 'Lotus M. Burgos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lotus M. Burgos', 'Lotus', 'Mendoza', 'Burgos', 'teacher_iii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aida M. Cuevas (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_cuevas_aida', 'aida.cuevas@mati.edu.ph', 'Aida M. Cuevas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aida M. Cuevas', 'Aida', 'Mamac', 'Cuevas', 'teacher_iii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Reward H. Dizon (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_dizon_reward', 'reward.dizon@mati.edu.ph', 'Reward H. Dizon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Reward H. Dizon', 'Reward', 'Hersan', 'Dizon', 'teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Princess Farridah B. Duaran (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_duaran_princessfarridah', 'princessfarridah.duaran@mati.edu.ph', 'Princess Farridah B. Duaran', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Princess Farridah B. Duaran', 'Princess Farridah', 'Binuguas', 'Duaran', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaime S. Yu (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_yu_jaime', 'jaime.yu@mati.edu.ph', 'Jaime S. Yu', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaime S. Yu', 'Jaime', 'Saromines', 'Yu', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melbert I. Flores (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_flores_melbert', 'melbert.flores@mati.edu.ph', 'Melbert I. Flores', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melbert I. Flores', 'Melbert', 'Isaias', 'Flores', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Johannes T. Latras (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_latras_johannes', 'johannes.latras@mati.edu.ph', 'Johannes T. Latras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Johannes T. Latras', 'Johannes', 'Tagoon', 'Latras', 'teacher_i', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- John Mark R. Lopez (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_lopez_johnmark', 'johnmark.lopez@mati.edu.ph', 'John Mark R. Lopez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'John Mark R. Lopez', 'John Mark', 'Romanos', 'Lopez', 'teacher_iii', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roxan Lee L. Lumpay (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_lumpay_roxanlee', 'roxanlee.lumpay@mati.edu.ph', 'Roxan Lee L. Lumpay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roxan Lee L. Lumpay', 'Roxan Lee', 'Lubiano', 'Lumpay', 'teacher_iii', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gene Pearl A. Luna (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_luna_genepearl', 'genepearl.luna@mati.edu.ph', 'Gene Pearl A. Luna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gene Pearl A. Luna', 'Gene Pearl', 'Abayon', 'Luna', 'teacher_i', 'BSED-Physics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Romeo A. Mamac (HT I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_mamac_romeo', 'romeo.mamac@mati.edu.ph', 'Romeo A. Mamac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Romeo A. Mamac', 'Romeo', 'Alcano', 'Mamac', 'teacher_i', 'BSED-Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Analiza B. Mocoy (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_mocoy_analiza', 'analiza.mocoy@mati.edu.ph', 'Analiza B. Mocoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Analiza B. Mocoy', 'Analiza', 'Biton', 'Mocoy', 'teacher_iii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Louie F. Niez (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_niez_louie', 'louie.niez@mati.edu.ph', 'Louie F. Niez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Louie F. Niez', 'Louie', 'Flores', 'Niez', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emily G. Nonol (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_nonol_emily', 'emily.nonol@mati.edu.ph', 'Emily G. Nonol', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emily G. Nonol', 'Emily', 'Gumagay', 'Nonol', 'teacher_iii', 'BSED-English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilyn G. Pajaro (MT I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_pajaro_marilyn', 'marilyn.pajaro@mati.edu.ph', 'Marilyn G. Pajaro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilyn G. Pajaro', 'Marilyn', 'Geli', 'Pajaro', 'teacher_i', 'BSED-PEHM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michelle Q. Pareja (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_pareja_michelle', 'michelle.pareja@mati.edu.ph', 'Michelle Q. Pareja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michelle Q. Pareja', 'Michelle', 'Ellorimo', 'Pareja', 'teacher_i', 'Biogical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marife M. Sagpang (MT -I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_sagpang_marife', 'marife.sagpang@mati.edu.ph', 'Marife M. Sagpang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marife M. Sagpang', 'Marife', 'Monterey', 'Sagpang', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edgar O. Samson (MT - II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_samson_edgar', 'edgar.samson@mati.edu.ph', 'Edgar O. Samson', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edgar O. Samson', 'Edgar', 'Olofernes', 'Samson', 'teacher_i', 'BSED-Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Haidee M. Siason (MT II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_siason_haidee', 'haidee.siason@mati.edu.ph', 'Haidee M. Siason', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Haidee M. Siason', 'Haidee', 'Manayon', 'Siason', 'teacher_i', 'BSED-Gen Sci', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Stephanie Anne U. Sibay (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_sibay_stephanieanne', 'stephanieanne.sibay@mati.edu.ph', 'Stephanie Anne U. Sibay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Stephanie Anne U. Sibay', 'Stephanie Anne', 'Uy', 'Sibay', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elvira Q. Quibo (SST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_quibo_elvira', 'elvira.quibo@mati.edu.ph', 'Elvira Q. Quibo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elvira Q. Quibo', 'Elvira', 'Quicho', 'Quibo', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arsely B. Tee (SST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_tee_arsely', 'arsely.tee@mati.edu.ph', 'Arsely B. Tee', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arsely B. Tee', 'Arsely', 'Baay', 'Tee', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wilmar O. Adamos (SST-I(TIII)) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_adamos_wilmar', 'wilmar.adamos@mati.edu.ph', 'Wilmar O. Adamos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wilmar O. Adamos', 'Wilmar', 'Olivar', 'Adamos', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lloyd U. Andres (MT-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_andres_lloyd', 'lloyd.andres@mati.edu.ph', 'Lloyd U. Andres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lloyd U. Andres', 'Lloyd', 'Umbaligan', 'Andres', 'master_teacher_i', 'BS-Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ralaine-Feby S.. Booc (SST-I(TIII)) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_booc_ralainefeby', 'ralainefeby.booc@mati.edu.ph', 'Ralaine-Feby S.. Booc', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ralaine-Feby S.. Booc', 'Ralaine-Feby', 'Seguerra', 'Booc', 'teacher_i', 'BSED-Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah A. Dela Rosa (MT-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_delarosa_leah', 'leah.delarosa@mati.edu.ph', 'Leah A. Dela Rosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah A. Dela Rosa', 'Leah', 'Ampilanon', 'Dela Rosa', 'master_teacher_ii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Fe M. Dumaran (MT-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_dumaran_mariafe', 'mariafe.dumaran@mati.edu.ph', 'Maria Fe M. Dumaran', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Fe M. Dumaran', 'Maria Fe', 'Mozo', 'Dumaran', 'master_teacher_ii', 'BSED-Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristal G. Entrino (MT I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_entrino_kristal', 'kristal.entrino@mati.edu.ph', 'Kristal G. Entrino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristal G. Entrino', 'Kristal', 'Godoy', 'Entrino', 'teacher_i', 'BSED-English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeaneth D. Binanosa (SPST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_binanosa_jeaneth', 'jeaneth.binanosa@mati.edu.ph', 'Jeaneth D. Binanosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeaneth D. Binanosa', 'Jeaneth', 'Dela Cerna', 'Binanosa', 'teacher_i', 'Special Education T I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mercedes N. Matangcas (SST-I(T-III)) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_matangcas_mercedes', 'mercedes.matangcas@mati.edu.ph', 'Mercedes N. Matangcas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mercedes N. Matangcas', 'Mercedes', 'Nugas', 'Matangcas', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sharon M. Morales (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_morales_sharon', 'sharon.morales@mati.edu.ph', 'Sharon M. Morales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sharon M. Morales', 'Sharon', 'Masonag', 'Morales', 'teacher_iii', 'BSED-English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Norsalam A. Bascuña (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_bascua_norsalam', 'norsalam.bascua@mati.edu.ph', 'Norsalam A. Bascuña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Norsalam A. Bascuña', 'Norsalam', 'Alilian', 'Bascuña', 'teacher_ii', 'BSED-General Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Theodore D. Tee (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_tee_theodore', 'theodore.tee@mati.edu.ph', 'Theodore D. Tee', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Theodore D. Tee', 'Theodore', 'Daniel', 'Tee', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Femaruth U.. Orquillano (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304328_orquillano_femaruth', 'femaruth.orquillano@mati.edu.ph', 'Femaruth U.. Orquillano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Femaruth U.. Orquillano', 'Femaruth', 'Ulgasan', 'Orquillano', 'teacher_i', 'BSED Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304328 not found';
  END IF;

  -- School: DON ENRIQUE LOPEZ NHS (304314) - 20 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304314' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Preachel Ann R. Calambo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_calambo_preachelann', 'preachelann.calambo@mati.edu.ph', 'Preachel Ann R. Calambo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Preachel Ann R. Calambo', 'Preachel Ann', 'Rosete', 'Calambo', 'teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jamin L. Colicot (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_colicot_jamin', 'jamin.colicot@mati.edu.ph', 'Jamin L. Colicot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jamin L. Colicot', 'Jamin', 'Lementap', 'Colicot', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Derly D. Maynabay (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_maynabay_derly', 'derly.maynabay@mati.edu.ph', 'Derly D. Maynabay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Derly D. Maynabay', 'Derly', 'Datuin', 'Maynabay', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nikki Mae D. Quilab (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_quilab_nikkimae', 'nikkimae.quilab@mati.edu.ph', 'Nikki Mae D. Quilab', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nikki Mae D. Quilab', 'Nikki Mae', 'Didal', 'Quilab', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charissa J. Durango (MT - I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_durango_charissa', 'charissa.durango@mati.edu.ph', 'Charissa J. Durango', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charissa J. Durango', 'Charissa', 'Juanir', 'Durango', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edwina D. Ignacio (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_ignacio_edwina', 'edwina.ignacio@mati.edu.ph', 'Edwina D. Ignacio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edwina D. Ignacio', 'Edwina', 'Dapitanon', 'Ignacio', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- KRYSTYL KARA B. P. Magno (ST I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_magno_krystylkarab', 'krystylkarab..magno@mati.edu.ph', 'KRYSTYL KARA B. P. Magno', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'KRYSTYL KARA B. P. Magno', 'KRYSTYL KARA B.', 'Paradillo', 'Magno', 'teacher_i', 'PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Desideria V. Paquito (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_paquito_desideria', 'desideria.paquito@mati.edu.ph', 'Desideria V. Paquito', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Desideria V. Paquito', 'Desideria', 'Vitor', 'Paquito', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ardes Benjie Mae V. Paquito (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_paquito_ardesbenjiemae', 'ardesbenjiemae.paquito@mati.edu.ph', 'Ardes Benjie Mae V. Paquito', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ardes Benjie Mae V. Paquito', 'Ardes Benjie Mae', 'Vitor', 'Paquito', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edmon John P. Pedro (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_pedro_edmonjohn', 'edmonjohn.pedro@mati.edu.ph', 'Edmon John P. Pedro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edmon John P. Pedro', 'Edmon John', 'Portillano', 'Pedro', 'teacher_i', 'BSED-TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aisha A. Sobosobo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_sobosobo_aisha', 'aisha.sobosobo@mati.edu.ph', 'Aisha A. Sobosobo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aisha A. Sobosobo', 'Aisha', 'Alimeos', 'Sobosobo', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Liezl Jane L. Villarin (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_villarin_liezljane', 'liezljane.villarin@mati.edu.ph', 'Liezl Jane L. Villarin', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Liezl Jane L. Villarin', 'Liezl Jane', 'Lumapas', 'Villarin', 'teacher_i', 'PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Princess Mabel S. Manlangit (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_manlangit_princessmabel', 'princessmabel.manlangit@mati.edu.ph', 'Princess Mabel S. Manlangit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Princess Mabel S. Manlangit', 'Princess Mabel', 'Suico', 'Manlangit', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jesa O.. Hombre (AOII) - NT- JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_hombre_jesa', 'jesa.hombre@mati.edu.ph', 'Jesa O.. Hombre', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jesa O.. Hombre', 'Jesa', '', 'Hombre', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryl S. Baselides (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_baselides_sheryl', 'sheryl.baselides@mati.edu.ph', 'Sheryl S. Baselides', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryl S. Baselides', 'Sheryl', 'Saliling', 'Baselides', 'teacher_i', 'SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristy Lou S. Sadongdong (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_sadongdong_kristylou', 'kristylou.sadongdong@mati.edu.ph', 'Kristy Lou S. Sadongdong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristy Lou S. Sadongdong', 'Kristy Lou', 'Silvosa', 'Sadongdong', 'teacher_i', 'Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Junalyn C. Delima (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_delima_junalyn', 'junalyn.delima@mati.edu.ph', 'Junalyn C. Delima', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Junalyn C. Delima', 'Junalyn', 'Chamen', 'Delima', 'teacher_i', 'Food Processing', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- John Albert P. Sistoso (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_sistoso_johnalbert', 'johnalbert.sistoso@mati.edu.ph', 'John Albert P. Sistoso', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'John Albert P. Sistoso', 'John Albert', 'Pineda', 'Sistoso', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nenita V. Lambong (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_lambong_nenita', 'nenita.lambong@mati.edu.ph', 'Nenita V. Lambong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nenita V. Lambong', 'Nenita', 'Valeriano', 'Lambong', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- KAREEN MARI B.. SAMPARANG (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304314_samparang_kareenmari', 'kareenmari.samparang@mati.edu.ph', 'KAREEN MARI B.. SAMPARANG', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'KAREEN MARI B.. SAMPARANG', 'KAREEN MARI', '', 'SAMPARANG', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304314 not found';
  END IF;

  -- School: DON SALVADOR LOPEZ NHS (316104) - 42 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '316104' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Mc Reymel T. Arceño (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_arceo_mcreymel', 'mcreymel.arceo@mati.edu.ph', 'Mc Reymel T. Arceño', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mc Reymel T. Arceño', 'Mc Reymel', 'Traña', 'Arceño', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eliza L. Balusca (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_balusca_eliza', 'eliza.balusca@mati.edu.ph', 'Eliza L. Balusca', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eliza L. Balusca', 'Eliza', 'Latras', 'Balusca', 'teacher_iii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janessa Joy C. Gumimba (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_gumimba_janessajoy', 'janessajoy.gumimba@mati.edu.ph', 'Janessa Joy C. Gumimba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janessa Joy C. Gumimba', 'Janessa Joy', 'Caoc', 'Gumimba', 'teacher_iii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ellen Grace A. Lastima (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_lastima_ellengrace', 'ellengrace.lastima@mati.edu.ph', 'Ellen Grace A. Lastima', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ellen Grace A. Lastima', 'Ellen Grace', 'Aranquez', 'Lastima', 'teacher_iii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lilibeth N. Hamsilani (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_hamsilani_lilibeth', 'lilibeth.hamsilani@mati.edu.ph', 'Lilibeth N. Hamsilani', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lilibeth N. Hamsilani', 'Lilibeth', 'Navarro', 'Hamsilani', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charry Mae B. Magdula (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_magdula_charrymae', 'charrymae.magdula@mati.edu.ph', 'Charry Mae B. Magdula', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charry Mae B. Magdula', 'Charry Mae', 'Bauyot', 'Magdula', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Albert F. Mamusog (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_mamusog_albert', 'albert.mamusog@mati.edu.ph', 'Albert F. Mamusog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Albert F. Mamusog', 'Albert', 'Felix', 'Mamusog', 'teacher_iii', 'SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovelyn B. Manalop (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_manalop_jovelyn', 'jovelyn.manalop@mati.edu.ph', 'Jovelyn B. Manalop', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovelyn B. Manalop', 'Jovelyn', 'Belosberlas', 'Manalop', 'teacher_i', 'SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaive Roselyn R. Masanguid (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_masanguid_jaiveroselyn', 'jaiveroselyn.masanguid@mati.edu.ph', 'Jaive Roselyn R. Masanguid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaive Roselyn R. Masanguid', 'Jaive Roselyn', 'Ranes', 'Masanguid', 'teacher_iii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Irene C. Mier (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_mier_irene', 'irene.mier@mati.edu.ph', 'Irene C. Mier', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Irene C. Mier', 'Irene', 'Chavez', 'Mier', 'teacher_iii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rochelle C. Padullon (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_padullon_rochelle', 'rochelle.padullon@mati.edu.ph', 'Rochelle C. Padullon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rochelle C. Padullon', 'Rochelle', 'Cambalon', 'Padullon', 'teacher_iii', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaypee A. Reoja (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_reoja_jaypee', 'jaypee.reoja@mati.edu.ph', 'Jaypee A. Reoja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaypee A. Reoja', 'Jaypee', 'Africano', 'Reoja', 'master_teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wilbert Edgil R. Romena (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_romena_wilbertedgil', 'wilbertedgil.romena@mati.edu.ph', 'Wilbert Edgil R. Romena', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wilbert Edgil R. Romena', 'Wilbert Edgil', 'Rodriguez', 'Romena', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Genivive S. Sanchez (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_sanchez_genivive', 'genivive.sanchez@mati.edu.ph', 'Genivive S. Sanchez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Genivive S. Sanchez', 'Genivive', 'Siarot', 'Sanchez', 'teacher_iii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arjane D. Suazo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_suazo_arjane', 'arjane.suazo@mati.edu.ph', 'Arjane D. Suazo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arjane D. Suazo', 'Arjane', 'Dumangas', 'Suazo', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- May Sheil O. Te (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_te_maysheil', 'maysheil.te@mati.edu.ph', 'May Sheil O. Te', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'May Sheil O. Te', 'May Sheil', 'Owano', 'Te', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovelyn V. Baltonado (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_baltonado_lovelyn', 'lovelyn.baltonado@mati.edu.ph', 'Lovelyn V. Baltonado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovelyn V. Baltonado', 'Lovelyn', 'Vicente', 'Baltonado', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rey Mark T.. Apolinar (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_apolinar_reymark', 'reymark.apolinar@mati.edu.ph', 'Rey Mark T.. Apolinar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rey Mark T.. Apolinar', 'Rey Mark', 'Torino', 'Apolinar', 'teacher_i', 'TVL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristuto Jr. B. Empic (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_empic_cristutojr', 'cristutojr..empic@mati.edu.ph', 'Cristuto Jr. B. Empic', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristuto Jr. B. Empic', 'Cristuto Jr.', 'Bocog', 'Empic', 'teacher_ii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angel A. Singh (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_singh_angel', 'angel.singh@mati.edu.ph', 'Angel A. Singh', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angel A. Singh', 'Angel', 'Acuin', 'Singh', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosa Mia P. Matanggan (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_matanggan_rosamia', 'rosamia.matanggan@mati.edu.ph', 'Rosa Mia P. Matanggan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosa Mia P. Matanggan', 'Rosa Mia', 'Paglilingan', 'Matanggan', 'teacher_iii', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Katreena Colyn S. Masalon (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_masalon_katreenacolyn', 'katreenacolyn.masalon@mati.edu.ph', 'Katreena Colyn S. Masalon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Katreena Colyn S. Masalon', 'Katreena Colyn', 'Syting', 'Masalon', 'teacher_i', 'HRM-Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Teresa Y. Siblos (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_siblos_mariateresa', 'mariateresa.siblos@mati.edu.ph', 'Maria Teresa Y. Siblos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Teresa Y. Siblos', 'Maria Teresa', 'Yap', 'Siblos', 'teacher_ii', 'Industrial Technology-Food Tech', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sitti S. Bandigan (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_bandigan_sitti', 'sitti.bandigan@mati.edu.ph', 'Sitti S. Bandigan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sitti S. Bandigan', 'Sitti', 'Sawat', 'Bandigan', 'teacher_ii', 'PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nona Lee A. Daal (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_daal_nonalee', 'nonalee.daal@mati.edu.ph', 'Nona Lee A. Daal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nona Lee A. Daal', 'Nona Lee', 'Asumbrado', 'Daal', 'teacher_iii', 'PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Surmaly A. Labao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_labao_surmaly', 'surmaly.labao@mati.edu.ph', 'Surmaly A. Labao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Surmaly A. Labao', 'Surmaly', 'Avila', 'Labao', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eric T. Loremia (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_loremia_eric', 'eric.loremia@mati.edu.ph', 'Eric T. Loremia', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eric T. Loremia', 'Eric', 'Teodoro', 'Loremia', 'teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Teresa D. Losentes (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_losentes_mariateresa', 'mariateresa.losentes@mati.edu.ph', 'Maria Teresa D. Losentes', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Teresa D. Losentes', 'Maria Teresa', 'Dao', 'Losentes', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeannie Rose T. Maslog (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_maslog_jeannierose', 'jeannierose.maslog@mati.edu.ph', 'Jeannie Rose T. Maslog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeannie Rose T. Maslog', 'Jeannie Rose', 'Teodoro', 'Maslog', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Danilyn L. Morta (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_morta_danilyn', 'danilyn.morta@mati.edu.ph', 'Danilyn L. Morta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Danilyn L. Morta', 'Danilyn', 'Lumapas', 'Morta', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Georgielin R. Plecerda (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_plecerda_georgielin', 'georgielin.plecerda@mati.edu.ph', 'Georgielin R. Plecerda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Georgielin R. Plecerda', 'Georgielin', 'Bolledo', 'Plecerda', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anavic C. Renegado (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_renegado_anavic', 'anavic.renegado@mati.edu.ph', 'Anavic C. Renegado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anavic C. Renegado', 'Anavic', 'Canuog', 'Renegado', 'teacher_iii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anaville B. Samijon (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_samijon_anaville', 'anaville.samijon@mati.edu.ph', 'Anaville B. Samijon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anaville B. Samijon', 'Anaville', 'Bunayog', 'Samijon', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Margarita D. Sumilhig (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_sumilhig_margarita', 'margarita.sumilhig@mati.edu.ph', 'Margarita D. Sumilhig', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Margarita D. Sumilhig', 'Margarita', 'Decena', 'Sumilhig', 'master_teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janet D. Valdezco (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_valdezco_janet', 'janet.valdezco@mati.edu.ph', 'Janet D. Valdezco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janet D. Valdezco', 'Janet', 'Dominguez', 'Valdezco', 'teacher_ii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Tonette Jean T. Latras (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_latras_tonettejean', 'tonettejean.latras@mati.edu.ph', 'Tonette Jean T. Latras', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Tonette Jean T. Latras', 'Tonette Jean', 'Tagoon', 'Latras', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julieto C. Salimbajon (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_salimbajon_julieto', 'julieto.salimbajon@mati.edu.ph', 'Julieto C. Salimbajon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julieto C. Salimbajon', 'Julieto', 'Cagayao', 'Salimbajon', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheryl S. LOPEZ (T1) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_lopez_sheryl', 'sheryl.lopez@mati.edu.ph', 'Sheryl S. LOPEZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheryl S. LOPEZ', 'Sheryl', 'Sungcal', 'LOPEZ', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristina B. Caiña (ST-I) - ALS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_caia_cristina', 'cristina.caia@mati.edu.ph', 'Cristina B. Caiña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristina B. Caiña', 'Cristina', 'Bohol', 'Caiña', 'teacher_i', 'ALS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emilyn B. Maglinte (T1) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_maglinte_emilyn', 'emilyn.maglinte@mati.edu.ph', 'Emilyn B. Maglinte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emilyn B. Maglinte', 'Emilyn', 'Bancale', 'Maglinte', 'teacher_i', 'BSIT/TVL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jhanen R. Ancheta (T1) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_ancheta_jhanen', 'jhanen.ancheta@mati.edu.ph', 'Jhanen R. Ancheta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jhanen R. Ancheta', 'Jhanen', 'Roselin', 'Ancheta', 'teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace Y. Mirambel (T1) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_316104_mirambel_grace', 'grace.mirambel@mati.edu.ph', 'Grace Y. Mirambel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace Y. Mirambel', 'Grace', 'Yongco', 'Mirambel', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 316104 not found';
  END IF;

  -- School: LANCA IS (501086) - 6 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501086' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Lyjean M. Noya (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501086_noya_lyjean', 'lyjean.noya@mati.edu.ph', 'Lyjean M. Noya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lyjean M. Noya', 'Lyjean', 'Manigo', 'Noya', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- SHELLA DEE C. Teodoro (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501086_teodoro_shelladee', 'shelladee.teodoro@mati.edu.ph', 'SHELLA DEE C. Teodoro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'SHELLA DEE C. Teodoro', 'SHELLA DEE', 'Capungas', 'Teodoro', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaysar C. Malinao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501086_malinao_jaysar', 'jaysar.malinao@mati.edu.ph', 'Jaysar C. Malinao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaysar C. Malinao', 'Jaysar', 'Cutillar', 'Malinao', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mae Jean R.. Lemente (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501086_lemente_maejean', 'maejean.lemente@mati.edu.ph', 'Mae Jean R.. Lemente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae Jean R.. Lemente', 'Mae Jean', 'Recitas', 'Lemente', 'teacher_i', 'BSED Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Abegail L.. Noya (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501086_noya_abegail', 'abegail.noya@mati.edu.ph', 'Abegail L.. Noya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Abegail L.. Noya', 'Abegail', '', 'Noya', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jojie L. Noya (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501086_noya_jojie', 'jojie.noya@mati.edu.ph', 'Jojie L. Noya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jojie L. Noya', 'Jojie', 'Lingo', 'Noya', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 501086 not found';
  END IF;

  -- School: LAWIGAN NHS (325102) - 21 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '325102' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Mariel M. Bauya (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_bauya_mariel', 'mariel.bauya@mati.edu.ph', 'Mariel M. Bauya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mariel M. Bauya', 'Mariel', 'Mendoza', 'Bauya', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jules Ann M. Cablinda (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_cablinda_julesann', 'julesann.cablinda@mati.edu.ph', 'Jules Ann M. Cablinda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jules Ann M. Cablinda', 'Jules Ann', 'Mallada', 'Cablinda', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Bea D. Clarito (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_clarito_bea', 'bea.clarito@mati.edu.ph', 'Bea D. Clarito', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Bea D. Clarito', 'Bea', 'Diapana', 'Clarito', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Yvonnie T. Enrile (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_enrile_yvonnie', 'yvonnie.enrile@mati.edu.ph', 'Yvonnie T. Enrile', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Yvonnie T. Enrile', 'Yvonnie', 'Tibug', 'Enrile', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessa F. Mantog (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_mantog_jessa', 'jessa.mantog@mati.edu.ph', 'Jessa F. Mantog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessa F. Mantog', 'Jessa', 'Francisquete', 'Mantog', 'teacher_iii', 'Bio Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wildelyn A. Fuentes (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_fuentes_wildelyn', 'wildelyn.fuentes@mati.edu.ph', 'Wildelyn A. Fuentes', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wildelyn A. Fuentes', 'Wildelyn', 'Abonales', 'Fuentes', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Doren A. Gayta (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_gayta_doren', 'doren.gayta@mati.edu.ph', 'Doren A. Gayta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Doren A. Gayta', 'Doren', 'Abordaje', 'Gayta', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ethel Grace M. Lamang (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_lamang_ethelgrace', 'ethelgrace.lamang@mati.edu.ph', 'Ethel Grace M. Lamang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ethel Grace M. Lamang', 'Ethel Grace', 'Miones', 'Lamang', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah E. Lawani (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_lawani_leah', 'leah.lawani@mati.edu.ph', 'Leah E. Lawani', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah E. Lawani', 'Leah', 'Elayron', 'Lawani', 'teacher_i', 'Bio Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charita B. Pondang (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_pondang_charita', 'charita.pondang@mati.edu.ph', 'Charita B. Pondang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charita B. Pondang', 'Charita', 'Bungcahig', 'Pondang', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eleuterio B. Quibo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_quibo_eleuterio', 'eleuterio.quibo@mati.edu.ph', 'Eleuterio B. Quibo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eleuterio B. Quibo', 'Eleuterio', 'Buot', 'Quibo', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charmaine Doll M. Tejano (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_tejano_charmainedoll', 'charmainedoll.tejano@mati.edu.ph', 'Charmaine Doll M. Tejano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charmaine Doll M. Tejano', 'Charmaine Doll', 'Mecairan', 'Tejano', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christy F. Barro (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_barro_christy', 'christy.barro@mati.edu.ph', 'Christy F. Barro', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christy F. Barro', 'Christy', 'Facundo', 'Barro', 'teacher_i', 'Bio Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rubelyn B. Yangan (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_yangan_rubelyn', 'rubelyn.yangan@mati.edu.ph', 'Rubelyn B. Yangan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rubelyn B. Yangan', 'Rubelyn', 'Balili', 'Yangan', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wowie B. Gayta (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_gayta_wowie', 'wowie.gayta@mati.edu.ph', 'Wowie B. Gayta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wowie B. Gayta', 'Wowie', 'Borja', 'Gayta', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Magelou S. Arellano (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_arellano_magelou', 'magelou.arellano@mati.edu.ph', 'Magelou S. Arellano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Magelou S. Arellano', 'Magelou', 'Sumondong', 'Arellano', 'teacher_i', 'Animal Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fe Yvonne T. Fernandez (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_fernandez_feyvonne', 'feyvonne.fernandez@mati.edu.ph', 'Fe Yvonne T. Fernandez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fe Yvonne T. Fernandez', 'Fe Yvonne', 'Torres', 'Fernandez', 'teacher_iii', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessie R. Maquitar (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_maquitar_jessie', 'jessie.maquitar@mati.edu.ph', 'Jessie R. Maquitar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessie R. Maquitar', 'Jessie', 'Rellin', 'Maquitar', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shella L. Buog (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_buog_shella', 'shella.buog@mati.edu.ph', 'Shella L. Buog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shella L. Buog', 'Shella', 'Lopez', 'Buog', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Moneb M. Manuel (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_manuel_moneb', 'moneb.manuel@mati.edu.ph', 'Moneb M. Manuel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Moneb M. Manuel', 'Moneb', 'Magtacpao', 'Manuel', 'teacher_i', 'AFA/TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Waren P. Bauya (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325102_bauya_waren', 'waren.bauya@mati.edu.ph', 'Waren P. Bauya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Waren P. Bauya', 'Waren', 'Pilapil', 'Bauya', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 325102 not found';
  END IF;

  -- School: LIBUDON NHS (304318) - 24 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304318' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Jan Kimberly O. Abesta (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_abesta_jankimberly', 'jankimberly.abesta@mati.edu.ph', 'Jan Kimberly O. Abesta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jan Kimberly O. Abesta', 'Jan Kimberly', 'Orias', 'Abesta', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mae Q. Balaga (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_balaga_mae', 'mae.balaga@mati.edu.ph', 'Mae Q. Balaga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae Q. Balaga', 'Mae', 'Quizora', 'Balaga', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessica P. Bayubay (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_bayubay_jessica', 'jessica.bayubay@mati.edu.ph', 'Jessica P. Bayubay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessica P. Bayubay', 'Jessica', 'Pada', 'Bayubay', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nisa M. Dela Cruz (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_delacruz_nisa', 'nisa.delacruz@mati.edu.ph', 'Nisa M. Dela Cruz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nisa M. Dela Cruz', 'Nisa', 'Milayaw', 'Dela Cruz', 'teacher_ii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nelia L. Dematingcal (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_dematingcal_nelia', 'nelia.dematingcal@mati.edu.ph', 'Nelia L. Dematingcal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nelia L. Dematingcal', 'Nelia', 'Linsag', 'Dematingcal', 'teacher_iii', 'Political Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ethel Joy H. Dizon (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_dizon_etheljoy', 'etheljoy.dizon@mati.edu.ph', 'Ethel Joy H. Dizon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ethel Joy H. Dizon', 'Ethel Joy', 'Habana', 'Dizon', 'teacher_i', 'Bio. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Celine Grace C. Gubalane (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_gubalane_macelinegrace', 'ma.celinegrace.gubalane@mati.edu.ph', 'Ma. Celine Grace C. Gubalane', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Celine Grace C. Gubalane', 'Ma. Celine Grace', 'Cutamora', 'Gubalane', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elren Grace . Igloria (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_igloria_elrengrace', 'elrengrace.igloria@mati.edu.ph', 'Elren Grace . Igloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elren Grace . Igloria', 'Elren Grace', '', 'Igloria', 'teacher_i', 'Aral Pan', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cyril Jay N. Lituañas (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_lituaas_cyriljay', 'cyriljay.lituaas@mati.edu.ph', 'Cyril Jay N. Lituañas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cyril Jay N. Lituañas', 'Cyril Jay', 'Nietes', 'Lituañas', 'teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheila Lee B. Longino (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_longino_sheilalee', 'sheilalee.longino@mati.edu.ph', 'Sheila Lee B. Longino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheila Lee B. Longino', 'Sheila Lee', 'Barraca', 'Longino', 'teacher_ii', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Myrna B. Marundan (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_marundan_myrna', 'myrna.marundan@mati.edu.ph', 'Myrna B. Marundan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Myrna B. Marundan', 'Myrna', 'Balaga', 'Marundan', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rean Mart B. Padao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_padao_reanmart', 'reanmart.padao@mati.edu.ph', 'Rean Mart B. Padao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rean Mart B. Padao', 'Rean Mart', 'Bejerano', 'Padao', 'teacher_i', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma. Reinafe D. Panoy (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_panoy_mareinafe', 'ma.reinafe.panoy@mati.edu.ph', 'Ma. Reinafe D. Panoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Reinafe D. Panoy', 'Ma. Reinafe', 'Dominguez', 'Panoy', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Liezel B. Serondo (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_serondo_liezel', 'liezel.serondo@mati.edu.ph', 'Liezel B. Serondo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Liezel B. Serondo', 'Liezel', 'Bangahon', 'Serondo', 'teacher_ii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marlee Grace V. Ulay (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_ulay_marleegrace', 'marleegrace.ulay@mati.edu.ph', 'Marlee Grace V. Ulay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marlee Grace V. Ulay', 'Marlee Grace', 'Villa', 'Ulay', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Susy P. Ventorillo (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_ventorillo_susy', 'susy.ventorillo@mati.edu.ph', 'Susy P. Ventorillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Susy P. Ventorillo', 'Susy', 'Pesito', 'Ventorillo', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marisol F. Verzosa (Master Teacher I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_verzosa_marisol', 'marisol.verzosa@mati.edu.ph', 'Marisol F. Verzosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marisol F. Verzosa', 'Marisol', 'Fortuna', 'Verzosa', 'master_teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- KARLA LOUISE C. Morales (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_morales_karlalouise', 'karlalouise.morales@mati.edu.ph', 'KARLA LOUISE C. Morales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'KARLA LOUISE C. Morales', 'KARLA LOUISE', 'Cañete', 'Morales', 'teacher_i', 'Mapeh', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christian D. Consigna (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_consigna_christian', 'christian.consigna@mati.edu.ph', 'Christian D. Consigna', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christian D. Consigna', 'Christian', 'Dacillo', 'Consigna', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mark Ace A. Elan (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_elan_markace', 'markace.elan@mati.edu.ph', 'Mark Ace A. Elan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mark Ace A. Elan', 'Mark Ace', 'Amora', 'Elan', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nelia V. Masanegra (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_masanegra_nelia', 'nelia.masanegra@mati.edu.ph', 'Nelia V. Masanegra', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nelia V. Masanegra', 'Nelia', 'Ventorillo', 'Masanegra', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mamark B. Montizo (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_montizo_mamark', 'mamark.montizo@mati.edu.ph', 'Mamark B. Montizo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mamark B. Montizo', 'Mamark', 'Bumaya', 'Montizo', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rezza Mae C. Solano (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_solano_rezzamae', 'rezzamae.solano@mati.edu.ph', 'Rezza Mae C. Solano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rezza Mae C. Solano', 'Rezza Mae', 'Crispino', 'Solano', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rex Jr. T. Umpad (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304318_umpad_rexjr', 'rexjr..umpad@mati.edu.ph', 'Rex Jr. T. Umpad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rex Jr. T. Umpad', 'Rex Jr.', 'Ticong', 'Umpad', 'teacher_i', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304318 not found';
  END IF;

  -- School: SANGHAY NHS (306039) - 9 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '306039' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Julius Tyron S.. Logayao (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_logayao_juliustyron', 'juliustyron.logayao@mati.edu.ph', 'Julius Tyron S.. Logayao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julius Tyron S.. Logayao', 'Julius Tyron', 'Serra', 'Logayao', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Joy E.. Rama (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_rama_maryjoy', 'maryjoy.rama@mati.edu.ph', 'Mary Joy E.. Rama', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Joy E.. Rama', 'Mary Joy', 'Elsisura', 'Rama', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joel L. Bangahon (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_bangahon_joel', 'joel.bangahon@mati.edu.ph', 'Joel L. Bangahon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joel L. Bangahon', 'Joel', 'Lause', 'Bangahon', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gaudencio Jr. L. Melendres (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_melendres_gaudenciojr', 'gaudenciojr..melendres@mati.edu.ph', 'Gaudencio Jr. L. Melendres', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gaudencio Jr. L. Melendres', 'Gaudencio Jr.', 'Lage', 'Melendres', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edjean Brix N. Abueva (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_abueva_edjeanbrix', 'edjeanbrix.abueva@mati.edu.ph', 'Edjean Brix N. Abueva', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edjean Brix N. Abueva', 'Edjean Brix', 'Nacua', 'Abueva', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Milenne G.. Tagalog (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_tagalog_milenne', 'milenne.tagalog@mati.edu.ph', 'Milenne G.. Tagalog', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Milenne G.. Tagalog', 'Milenne', 'Gamale', 'Tagalog', 'teacher_i', 'BSED Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nazer M.. Lacabo (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_lacabo_nazer', 'nazer.lacabo@mati.edu.ph', 'Nazer M.. Lacabo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nazer M.. Lacabo', 'Nazer', 'Magdagasang', 'Lacabo', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nor Fatima L.. Morales (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_morales_norfatima', 'norfatima.morales@mati.edu.ph', 'Nor Fatima L.. Morales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nor Fatima L.. Morales', 'Nor Fatima', 'Luciano', 'Morales', 'teacher_i', 'BITM-Automotive', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marlyn R. Pahid (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_306039_pahid_marlyn', 'marlyn.pahid@mati.edu.ph', 'Marlyn R. Pahid', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marlyn R. Pahid', 'Marlyn', 'Rebamonte', 'Pahid', 'teacher_i', 'General Agriculture', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 306039 not found';
  END IF;

  -- School: LICOP IS (500454) - 9 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '500454' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Ma. Retchel S. Atok (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_atok_maretchel', 'ma.retchel.atok@mati.edu.ph', 'Ma. Retchel S. Atok', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma. Retchel S. Atok', 'Ma. Retchel', 'Soriano', 'Atok', 'teacher_iii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovely A. Miguel (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_miguel_lovely', 'lovely.miguel@mati.edu.ph', 'Lovely A. Miguel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovely A. Miguel', 'Lovely', 'Alonzo', 'Miguel', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ralf Rudy Niel D. Uy (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_uy_ralfrudyniel', 'ralfrudyniel.uy@mati.edu.ph', 'Ralf Rudy Niel D. Uy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ralf Rudy Niel D. Uy', 'Ralf Rudy Niel', 'Diez', 'Uy', 'teacher_iii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chissa Joy S. Viñas (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_vias_chissajoy', 'chissajoy.vias@mati.edu.ph', 'Chissa Joy S. Viñas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chissa Joy S. Viñas', 'Chissa Joy', 'Suan', 'Viñas', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rowena C. Tahanlangit (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_tahanlangit_rowena', 'rowena.tahanlangit@mati.edu.ph', 'Rowena C. Tahanlangit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rowena C. Tahanlangit', 'Rowena', 'Catian', 'Tahanlangit', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Agnes J. Garo (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_garo_agnes', 'agnes.garo@mati.edu.ph', 'Agnes J. Garo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Agnes J. Garo', 'Agnes', 'Jao', 'Garo', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenvyl C. Cumaya (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_cumaya_jenvyl', 'jenvyl.cumaya@mati.edu.ph', 'Jenvyl C. Cumaya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenvyl C. Cumaya', 'Jenvyl', 'Calamba', 'Cumaya', 'teacher_ii', 'BS Agribusiness', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roselyn A. Magbutong (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_magbutong_roselyn', 'roselyn.magbutong@mati.edu.ph', 'Roselyn A. Magbutong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roselyn A. Magbutong', 'Roselyn', 'Acpac', 'Magbutong', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Iza . Maglente (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_500454_maglente_iza', 'iza.maglente@mati.edu.ph', 'Iza . Maglente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Iza . Maglente', 'Iza', '', 'Maglente', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 500454 not found';
  END IF;

  -- School: LUBAN IS (501087) - 6 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '501087' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Robert Jhon S. Abesta (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501087_abesta_robertjhon', 'robertjhon.abesta@mati.edu.ph', 'Robert Jhon S. Abesta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Robert Jhon S. Abesta', 'Robert Jhon', 'Sanay', 'Abesta', 'teacher_i', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wilmark P. Borja (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501087_borja_wilmark', 'wilmark.borja@mati.edu.ph', 'Wilmark P. Borja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wilmark P. Borja', 'Wilmark', 'Padullon', 'Borja', 'teacher_i', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Neca S. Mique (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501087_mique_neca', 'neca.mique@mati.edu.ph', 'Neca S. Mique', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Neca S. Mique', 'Neca', 'Singcay', 'Mique', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jiddah M. Bandigan (ST-1) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501087_bandigan_jiddah', 'jiddah.bandigan@mati.edu.ph', 'Jiddah M. Bandigan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jiddah M. Bandigan', 'Jiddah', 'Magdoboy', 'Bandigan', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marfa Rica V. Igloria (ST-1) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501087_igloria_marfarica', 'marfarica.igloria@mati.edu.ph', 'Marfa Rica V. Igloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marfa Rica V. Igloria', 'Marfa Rica', 'Visitacion', 'Igloria', 'teacher_i', 'Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Antonia R. Janeo (ST-1) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_501087_janeo_antonia', 'antonia.janeo@mati.edu.ph', 'Antonia R. Janeo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Antonia R. Janeo', 'Antonia', 'Rojas', 'Janeo', 'teacher_i', 'ABM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 501087 not found';
  END IF;

  -- School: MACAMBOL NHS (325105) - 23 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '325105' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Jonathan B. Bulloc (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_bulloc_jonathan', 'jonathan.bulloc@mati.edu.ph', 'Jonathan B. Bulloc', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonathan B. Bulloc', 'Jonathan', 'Besandre', 'Bulloc', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mitzchegay . Cañas (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_caas_mitzchegay', 'mitzchegay.caas@mati.edu.ph', 'Mitzchegay . Cañas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mitzchegay . Cañas', 'Mitzchegay', '', 'Cañas', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shanel B. Clemente (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_clemente_shanel', 'shanel.clemente@mati.edu.ph', 'Shanel B. Clemente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shanel B. Clemente', 'Shanel', 'Brabante', 'Clemente', 'teacher_iii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jefrel T. De Loyola (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_deloyola_jefrel', 'jefrel.deloyola@mati.edu.ph', 'Jefrel T. De Loyola', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jefrel T. De Loyola', 'Jefrel', 'Tubio', 'De Loyola', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charly P. Guiao (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_guiao_charly', 'charly.guiao@mati.edu.ph', 'Charly P. Guiao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charly P. Guiao', 'Charly', 'Pleños', 'Guiao', 'teacher_i', 'Values Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Florentino C. Mabasa (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_mabasa_florentino', 'florentino.mabasa@mati.edu.ph', '"Florentino C. Mabasa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Florentino C. Mabasa', '"Florentino', 'Caro', 'Mabasa', 'teacher_i', 'T-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Karen A. Paraiso (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_paraiso_karen', 'karen.paraiso@mati.edu.ph', 'Karen A. Paraiso', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Karen A. Paraiso', 'Karen', 'Antiola', 'Paraiso', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michael G. Pareja (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_pareja_michael', 'michael.pareja@mati.edu.ph', 'Michael G. Pareja', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michael G. Pareja', 'Michael', 'Garay', 'Pareja', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elaine C. Rangel (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_rangel_elaine', 'elaine.rangel@mati.edu.ph', 'Elaine C. Rangel', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elaine C. Rangel', 'Elaine', 'Cheng', 'Rangel', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Riza V. Razonable (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_razonable_riza', 'riza.razonable@mati.edu.ph', 'Riza V. Razonable', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Riza V. Razonable', 'Riza', 'Vidal', 'Razonable', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nicolle Jay S. Roslinda (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_roslinda_nicollejay', 'nicollejay.roslinda@mati.edu.ph', 'Nicolle Jay S. Roslinda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nicolle Jay S. Roslinda', 'Nicolle Jay', 'Socubus', 'Roslinda', 'teacher_i', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alma M. Salazar (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_salazar_alma', 'alma.salazar@mati.edu.ph', 'Alma M. Salazar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alma M. Salazar', 'Alma', 'Matute', 'Salazar', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Helenita I. Sillote (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_sillote_helenita', 'helenita.sillote@mati.edu.ph', 'Helenita I. Sillote', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Helenita I. Sillote', 'Helenita', 'Intia', 'Sillote', 'teacher_iii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joseph Eric G. Bautista (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_bautista_josepheric', 'josepheric.bautista@mati.edu.ph', 'Joseph Eric G. Bautista', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joseph Eric G. Bautista', 'Joseph Eric', 'Gepitulan', 'Bautista', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jemmarie E. Dellosa (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_dellosa_jemmarie', 'jemmarie.dellosa@mati.edu.ph', 'Jemmarie E. Dellosa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jemmarie E. Dellosa', 'Jemmarie', 'Escalante', 'Dellosa', 'teacher_ii', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charlie N. Lituañas (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_lituaas_charlie', 'charlie.lituaas@mati.edu.ph', 'Charlie N. Lituañas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charlie N. Lituañas', 'Charlie', 'Nietes', 'Lituañas', 'teacher_i', 'Technology & Livelihood Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vergie P. Palen (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_palen_vergie', 'vergie.palen@mati.edu.ph', 'Vergie P. Palen', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vergie P. Palen', 'Vergie', 'Palma Gil', 'Palen', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sarah Jean P. Peteros (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_peteros_sarahjean', 'sarahjean.peteros@mati.edu.ph', 'Sarah Jean P. Peteros', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sarah Jean P. Peteros', 'Sarah Jean', 'Pacampara', 'Peteros', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gay B.. Calobag (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_calobag_gay', 'gay.calobag@mati.edu.ph', 'Gay B.. Calobag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gay B.. Calobag', 'Gay', 'Bagaman', 'Calobag', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angel Mae R. Lumactud (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_lumactud_angelmae', 'angelmae.lumactud@mati.edu.ph', 'Angel Mae R. Lumactud', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angel Mae R. Lumactud', 'Angel Mae', 'Responte', 'Lumactud', 'teacher_i', 'BSED Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovelyn P. Comodas (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_comodas_jovelyn', 'jovelyn.comodas@mati.edu.ph', 'Jovelyn P. Comodas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovelyn P. Comodas', 'Jovelyn', 'Padaya', 'Comodas', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Robert M.. Galon (T-I) - ALS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_galon_robert', 'robert.galon@mati.edu.ph', 'Robert M.. Galon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Robert M.. Galon', 'Robert', '', 'Galon', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivy B.. Limbadan (ADAS3) - NT- SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325105_limbadan_ivy', 'ivy.limbadan@mati.edu.ph', 'Ivy B.. Limbadan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivy B.. Limbadan', 'Ivy', 'Besabella', 'Limbadan', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 325105 not found';
  END IF;

  -- School: MATI NATIONAL COMP. HS (304325) - 200 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304325' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Gemma O. ABARQUEZ (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_abarquez_gemma', 'gemma.abarquez@mati.edu.ph', 'Gemma O. ABARQUEZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gemma O. ABARQUEZ', 'Gemma', 'Owano', 'ABARQUEZ', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mark Glenn M. ABATAYO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_abatayo_markglenn', 'markglenn.abatayo@mati.edu.ph', 'Mark Glenn M. ABATAYO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mark Glenn M. ABATAYO', 'Mark Glenn', 'Malintad', 'ABATAYO', 'teacher_ii', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Nonito P. ADALID (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_adalid_nonito', 'nonito.adalid@mati.edu.ph', '"Nonito P. ADALID', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Nonito P. ADALID', '"Nonito', 'Pancho', 'ADALID', 'teacher_i', 'T-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Donald S. AGSOY (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_agsoy_donald', 'donald.agsoy@mati.edu.ph', 'Donald S. AGSOY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Donald S. AGSOY', 'Donald', 'Sincero', 'AGSOY', 'teacher_i', 'Integ. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Al James D. AGUILON (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_aguilon_aljames', 'aljames.aguilon@mati.edu.ph', 'Al James D. AGUILON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Al James D. AGUILON', 'Al James', 'Durico', 'AGUILON', 'master_teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Junrey J. ALIGWAY (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_aligway_junrey', 'junrey.aligway@mati.edu.ph', 'Junrey J. ALIGWAY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Junrey J. ALIGWAY', 'Junrey', 'Jael', 'ALIGWAY', 'teacher_ii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nena M. ALIGWAY (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_aligway_nena', 'nena.aligway@mati.edu.ph', 'Nena M. ALIGWAY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nena M. ALIGWAY', 'Nena', 'Madrona', 'ALIGWAY', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Khristine Joie M. ALOBA (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_aloba_khristinejoie', 'khristinejoie.aloba@mati.edu.ph', 'Khristine Joie M. ALOBA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Khristine Joie M. ALOBA', 'Khristine Joie', 'Mabiscay', 'ALOBA', 'teacher_iii', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nathan M. ANDAN (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_andan_nathan', 'nathan.andan@mati.edu.ph', 'Nathan M. ANDAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nathan M. ANDAN', 'Nathan', 'Manuel', 'ANDAN', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eduardo C. ANDOQUE (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_andoque_eduardo', 'eduardo.andoque@mati.edu.ph', 'Eduardo C. ANDOQUE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eduardo C. ANDOQUE', 'Eduardo', 'Cubias', 'ANDOQUE', 'teacher_ii', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annabelle O. ANIÑON (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_anion_annabelle', 'annabelle.anion@mati.edu.ph', 'Annabelle O. ANIÑON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annabelle O. ANIÑON', 'Annabelle', 'Olagbang', 'ANIÑON', 'teacher_i', 'Araling Panlipunan', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ariel V. ANTASUDA (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_antasuda_ariel', 'ariel.antasuda@mati.edu.ph', 'Ariel V. ANTASUDA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ariel V. ANTASUDA', 'Ariel', 'Valles', 'ANTASUDA', 'teacher_iii', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Carvina L. ANTONIO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_antonio_carvina', 'carvina.antonio@mati.edu.ph', 'Carvina L. ANTONIO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Carvina L. ANTONIO', 'Carvina', 'Laroga', 'ANTONIO', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Erick John G. APARRA (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_aparra_erickjohn', 'erickjohn.aparra@mati.edu.ph', 'Erick John G. APARRA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Erick John G. APARRA', 'Erick John', 'Go', 'APARRA', 'teacher_iii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Junalyn B. BANDIGAN (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bandigan_junalyn', 'junalyn.bandigan@mati.edu.ph', 'Junalyn B. BANDIGAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Junalyn B. BANDIGAN', 'Junalyn', 'Beldeniza', 'BANDIGAN', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- GLORY JANE L. BASTES (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bastes_gloryjane', 'gloryjane.bastes@mati.edu.ph', 'GLORY JANE L. BASTES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'GLORY JANE L. BASTES', 'GLORY JANE', 'LUPA', 'BASTES', 'teacher_i', 'Values Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marivic S. BARING (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_baring_marivic', 'marivic.baring@mati.edu.ph', 'Marivic S. BARING', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marivic S. BARING', 'Marivic', 'Sumando', 'BARING', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maila O. BAUYOT (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bauyot_maila', 'maila.bauyot@mati.edu.ph', 'Maila O. BAUYOT', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maila O. BAUYOT', 'Maila', 'Ortiz', 'BAUYOT', 'teacher_iii', 'Integ. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Liza Mae . Biol (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_biol_lizamae', 'lizamae.biol@mati.edu.ph', 'Liza Mae . Biol', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Liza Mae . Biol', 'Liza Mae', '(None)', 'Biol', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Basilisa D. BITON (MT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_biton_basilisa', 'basilisa.biton@mati.edu.ph', 'Basilisa D. BITON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Basilisa D. BITON', 'Basilisa', 'Dayot', 'BITON', 'master_teacher_ii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chris Ryan Emmanuel C. BOISER (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_boiser_chrisryanemmanuel', 'chrisryanemmanuel.boiser@mati.edu.ph', 'Chris Ryan Emmanuel C. BOISER', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chris Ryan Emmanuel C. BOISER', 'Chris Ryan Emmanuel', 'Cervantes', 'BOISER', 'master_teacher_i', 'BSIT/BEED Educ/TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Grace S. BUGAS (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bugas_marygrace', 'marygrace.bugas@mati.edu.ph', 'Mary Grace S. BUGAS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Grace S. BUGAS', 'Mary Grace', 'Sumando', 'BUGAS', 'teacher_ii', 'General Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Honey Lynne B. BUNOD (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bunod_honeylynne', 'honeylynne.bunod@mati.edu.ph', 'Honey Lynne B. BUNOD', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Honey Lynne B. BUNOD', 'Honey Lynne', 'Bragas', 'BUNOD', 'teacher_i', 'Guidance & Counselling', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joselito F. CADOTDOT (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_cadotdot_joselito', 'joselito.cadotdot@mati.edu.ph', 'Joselito F. CADOTDOT', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joselito F. CADOTDOT', 'Joselito', 'Fuentes', 'CADOTDOT', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melenie A. CAGANG (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_cagang_melenie', 'melenie.cagang@mati.edu.ph', 'Melenie A. CAGANG', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melenie A. CAGANG', 'Melenie', 'Alderite', 'CAGANG', 'teacher_iii', 'Integ. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anna C. CALVEZ (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_calvez_anna', 'anna.calvez@mati.edu.ph', 'Anna C. CALVEZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anna C. CALVEZ', 'Anna', 'Cantiga', 'CALVEZ', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ariel B. CAOILE (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_caoile_ariel', 'ariel.caoile@mati.edu.ph', 'Ariel B. CAOILE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ariel B. CAOILE', 'Ariel', 'Baula', 'CAOILE', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Tina C. MALINTAD (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_malintad_tina', 'tina.malintad@mati.edu.ph', 'Tina C. MALINTAD', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Tina C. MALINTAD', 'Tina', 'Cariquitan', 'MALINTAD', 'teacher_i', 'School Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shawntel Kaye C. CASTILLO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_castillo_shawntelkaye', 'shawntelkaye.castillo@mati.edu.ph', 'Shawntel Kaye C. CASTILLO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shawntel Kaye C. CASTILLO', 'Shawntel Kaye', 'Capalit', 'CASTILLO', 'teacher_ii', 'SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine Faith M. CABANES (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_cabanes_christinefaith', 'christinefaith.cabanes@mati.edu.ph', 'Christine Faith M. CABANES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine Faith M. CABANES', 'Christine Faith', 'Marianito', 'CABANES', 'teacher_ii', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace I. CINCO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_cinco_grace', 'grace.cinco@mati.edu.ph', 'Grace I. CINCO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace I. CINCO', 'Grace', 'Intino', 'CINCO', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah L. CORILLA (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_corilla_leah', 'leah.corilla@mati.edu.ph', 'Leah L. CORILLA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah L. CORILLA', 'Leah', 'Labarejos', 'CORILLA', 'teacher_i', 'Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leonides C. COSTELO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_costelo_leonides', 'leonides.costelo@mati.edu.ph', 'Leonides C. COSTELO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leonides C. COSTELO', 'Leonides', 'Cañeso', 'COSTELO', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angelben P. DAMAOLAO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_damaolao_angelben', 'angelben.damaolao@mati.edu.ph', 'Angelben P. DAMAOLAO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angelben P. DAMAOLAO', 'Angelben', 'Panal', 'DAMAOLAO', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Deng Angelo M. DAMILES (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_damiles_dengangelo', 'dengangelo.damiles@mati.edu.ph', 'Deng Angelo M. DAMILES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Deng Angelo M. DAMILES', 'Deng Angelo', 'Manawatao', 'DAMILES', 'teacher_i', 'PEHM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma Jovelyn C. DAVID (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_david_majovelyn', 'majovelyn.david@mati.edu.ph', 'Ma Jovelyn C. DAVID', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma Jovelyn C. DAVID', 'Ma Jovelyn', 'Cubias', 'DAVID', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leny M. DE CHAVEZ (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_dechavez_leny', 'leny.dechavez@mati.edu.ph', 'Leny M. DE CHAVEZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leny M. DE CHAVEZ', 'Leny', 'Malaay', 'DE CHAVEZ', 'master_teacher_i', 'Integ. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nonah T. DECAYAN (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_decayan_nonah', 'nonah.decayan@mati.edu.ph', 'Nonah T. DECAYAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nonah T. DECAYAN', 'Nonah', 'Tampuso', 'DECAYAN', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Josephine J. DECIR (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_decir_josephine', 'josephine.decir@mati.edu.ph', 'Josephine J. DECIR', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Josephine J. DECIR', 'Josephine', 'Jorolan', 'DECIR', 'teacher_iii', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Quennie Jean T. DE LA CRUZ (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_delacruz_quenniejean', 'quenniejean.delacruz@mati.edu.ph', 'Quennie Jean T. DE LA CRUZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Quennie Jean T. DE LA CRUZ', 'Quennie Jean', 'Tumawis', 'DE LA CRUZ', 'teacher_iii', 'Mgt. Accounting', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hanna Joy A. DELA CRUZ (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_delacruz_hannajoy', 'hannajoy.delacruz@mati.edu.ph', 'Hanna Joy A. DELA CRUZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hanna Joy A. DELA CRUZ', 'Hanna Joy', 'Atay', 'DELA CRUZ', 'teacher_iii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fernando G. DISO (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_diso_fernando', 'fernando.diso@mati.edu.ph', 'Fernando G. DISO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fernando G. DISO', 'Fernando', 'Gamboa', 'DISO', 'master_teacher_i', 'With Educ. Units', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristhyl Jane N. DONATO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_donato_kristhyljane', 'kristhyljane.donato@mati.edu.ph', 'Kristhyl Jane N. DONATO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristhyl Jane N. DONATO', 'Kristhyl Jane', 'Naula', 'DONATO', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Karlie Jean A. DONATO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_donato_karliejean', 'karliejean.donato@mati.edu.ph', 'Karlie Jean A. DONATO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Karlie Jean A. DONATO', 'Karlie Jean', 'Alilongan', 'DONATO', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Gorgonio G. DONDOYANO (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_dondoyano_gorgonio', 'gorgonio.dondoyano@mati.edu.ph', '"Gorgonio G. DONDOYANO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Gorgonio G. DONDOYANO', '"Gorgonio', 'Gallemit', 'DONDOYANO', 'teacher_i', 'T-III', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Doguiles JR.". "DUMANDAN (Carlito) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_dumandan_doguiles', 'doguiles.dumandan@mati.edu.ph', 'Doguiles JR.". "DUMANDAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Doguiles JR.". "DUMANDAN', 'Doguiles', 'D', '"DUMANDAN', 'teacher_i', 'T-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Danielle D. ALISAN (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_alisan_danielle', 'danielle.alisan@mati.edu.ph', 'Danielle D. ALISAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Danielle D. ALISAN', 'Danielle', 'Dupa', 'ALISAN', 'teacher_i', 'School Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elenor P. DUPA (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_dupa_elenor', 'elenor.dupa@mati.edu.ph', 'Elenor P. DUPA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elenor P. DUPA', 'Elenor', 'Prudente', 'DUPA', 'master_teacher_i', 'PEHM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Geraldine F. DURA (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_dura_geraldine', 'geraldine.dura@mati.edu.ph', 'Geraldine F. DURA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Geraldine F. DURA', 'Geraldine', 'Fernandez', 'DURA', 'teacher_iii', 'Architecture Drafting', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- TROY ANGELO L. ELVINIA (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_elvinia_troyangelo', 'troyangelo.elvinia@mati.edu.ph', 'TROY ANGELO L. ELVINIA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'TROY ANGELO L. ELVINIA', 'TROY ANGELO', 'Lagahid', 'ELVINIA', 'teacher_i', 'Catechetics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Charity B. EMBALSADO (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_embalsado_marycharity', 'marycharity.embalsado@mati.edu.ph', 'Mary Charity B. EMBALSADO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Charity B. EMBALSADO', 'Mary Charity', 'Boliver', 'EMBALSADO', 'teacher_iii', 'HE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Rogelio M. ESGUERRA (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_esguerra_rogelio', 'rogelio.esguerra@mati.edu.ph', '"Rogelio M. ESGUERRA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Rogelio M. ESGUERRA', '"Rogelio', 'Mayot', 'ESGUERRA', 'teacher_i', 'T-II', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Brielou D. ESTREMOS (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_estremos_brielou', 'brielou.estremos@mati.edu.ph', 'Brielou D. ESTREMOS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Brielou D. ESTREMOS', 'Brielou', 'Dofelez', 'ESTREMOS', 'teacher_i', 'Business Administration', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Florigem M. FACUNDO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_facundo_florigem', 'florigem.facundo@mati.edu.ph', 'Florigem M. FACUNDO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Florigem M. FACUNDO', 'Florigem', 'Madenasale', 'FACUNDO', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruslyn Kate L. FERRANDO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_ferrando_ruslynkate', 'ruslynkate.ferrando@mati.edu.ph', 'Ruslyn Kate L. FERRANDO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruslyn Kate L. FERRANDO', 'Ruslyn Kate', 'Lazaro', 'FERRANDO', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nova G. GALIGAO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_galigao_nova', 'nova.galigao@mati.edu.ph', 'Nova G. GALIGAO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nova G. GALIGAO', 'Nova', 'Gorospe', 'GALIGAO', 'teacher_i', 'Technology & Livelihood Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rolia B. GANGIS (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_gangis_rolia', 'rolia.gangis@mati.edu.ph', 'Rolia B. GANGIS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rolia B. GANGIS', 'Rolia', 'Bugwasan', 'GANGIS', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shaika G. GREGORIO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_gregorio_shaika', 'shaika.gregorio@mati.edu.ph', 'Shaika G. GREGORIO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shaika G. GREGORIO', 'Shaika', 'Guisang', 'GREGORIO', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Diana Mae S. GUIDAVIN (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_guidavin_dianamae', 'dianamae.guidavin@mati.edu.ph', 'Diana Mae S. GUIDAVIN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Diana Mae S. GUIDAVIN', 'Diana Mae', 'Andoque', 'GUIDAVIN', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roxan O. GULIMAN (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_guliman_roxan', 'roxan.guliman@mati.edu.ph', 'Roxan O. GULIMAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roxan O. GULIMAN', 'Roxan', 'Ortiz', 'GULIMAN', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ronald M. HINAYON (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_hinayon_ronald', 'ronald.hinayon@mati.edu.ph', 'Ronald M. HINAYON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ronald M. HINAYON', 'Ronald', 'Mancao', 'HINAYON', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Amina A. JAIRE (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_jaire_amina', 'amina.jaire@mati.edu.ph', 'Amina A. JAIRE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Amina A. JAIRE', 'Amina', 'Andal', 'JAIRE', 'teacher_iii', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Achilles C. JIMENEZ (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_jimenez_achilles', 'achilles.jimenez@mati.edu.ph', 'Achilles C. JIMENEZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Achilles C. JIMENEZ', 'Achilles', 'Cenita', 'JIMENEZ', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- ALIMHAR R. JOROLAN (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_jorolan_alimhar', 'alimhar.jorolan@mati.edu.ph', 'ALIMHAR R. JOROLAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'ALIMHAR R. JOROLAN', 'ALIMHAR', 'RETES', 'JOROLAN', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jesebel O. KALI (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_kali_jesebel', 'jesebel.kali@mati.edu.ph', 'Jesebel O. KALI', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jesebel O. KALI', 'Jesebel', 'Onofre', 'KALI', 'master_teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivy Suzette A. LANCIAN (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_lancian_ivysuzette', 'ivysuzette.lancian@mati.edu.ph', 'Ivy Suzette A. LANCIAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivy Suzette A. LANCIAN', 'Ivy Suzette', 'Angos', 'LANCIAN', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marian Gay M. LUCIANO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_luciano_mariangay', 'mariangay.luciano@mati.edu.ph', 'Marian Gay M. LUCIANO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marian Gay M. LUCIANO', 'Marian Gay', 'Misajon', 'LUCIANO', 'teacher_ii', 'PEHM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aljariri T. LUCIANO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_luciano_aljariri', 'aljariri.luciano@mati.edu.ph', 'Aljariri T. LUCIANO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aljariri T. LUCIANO', 'Aljariri', 'Tumawis', 'LUCIANO', 'teacher_ii', 'PEHM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hiede S. LUMANDONG (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_lumandong_hiede', 'hiede.lumandong@mati.edu.ph', 'Hiede S. LUMANDONG', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hiede S. LUMANDONG', 'Hiede', 'Sedon', 'LUMANDONG', 'master_teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheena Loise A. LUTRAGO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_lutrago_sheenaloise', 'sheenaloise.lutrago@mati.edu.ph', 'Sheena Loise A. LUTRAGO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheena Loise A. LUTRAGO', 'Sheena Loise', 'Andoque', 'LUTRAGO', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou M. MAPA (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_mapa_marilou', 'marilou.mapa@mati.edu.ph', 'Marilou M. MAPA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou M. MAPA', 'Marilou', 'Macadaya', 'MAPA', 'master_teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vincent T. MASLOG (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_maslog_vincent', 'vincent.maslog@mati.edu.ph', 'Vincent T. MASLOG', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vincent T. MASLOG', 'Vincent', 'Teodoro', 'MASLOG', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cecilia V. MAYPA (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_maypa_cecilia', 'cecilia.maypa@mati.edu.ph', 'Cecilia V. MAYPA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cecilia V. MAYPA', 'Cecilia', 'Vicentino', 'MAYPA', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jose Kevin S. MENDOZA (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_mendoza_josekevin', 'josekevin.mendoza@mati.edu.ph', 'Jose Kevin S. MENDOZA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jose Kevin S. MENDOZA', 'Jose Kevin', 'Salem', 'MENDOZA', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chona C. MORALES (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_morales_chona', 'chona.morales@mati.edu.ph', 'Chona C. MORALES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chona C. MORALES', 'Chona', 'Cabili', 'MORALES', 'teacher_iii', 'Home Economics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Allan L. MORALES (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_morales_allan', 'allan.morales@mati.edu.ph', 'Allan L. MORALES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Allan L. MORALES', 'Allan', 'Labasano', 'MORALES', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aiza Coreena P. NAVARETTE (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_navarette_aizacoreena', 'aizacoreena.navarette@mati.edu.ph', 'Aiza Coreena P. NAVARETTE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aiza Coreena P. NAVARETTE', 'Aiza Coreena', 'Pacampara', 'NAVARETTE', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rogel D. NUGAL (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_nugal_rogel', 'rogel.nugal@mati.edu.ph', 'Rogel D. NUGAL', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rogel D. NUGAL', 'Rogel', 'Dela Silva', 'NUGAL', 'teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenny mae F. ODOY (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_odoy_jennymae', 'jennymae.odoy@mati.edu.ph', 'Jenny mae F. ODOY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenny mae F. ODOY', 'Jenny mae', 'Felix', 'ODOY', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jenely P. OLARTE (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_olarte_jenely', 'jenely.olarte@mati.edu.ph', 'Jenely P. OLARTE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jenely P. OLARTE', 'Jenely', 'Pateros', 'OLARTE', 'teacher_ii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cris Vincent M. OLVIDA (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_olvida_crisvincent', 'crisvincent.olvida@mati.edu.ph', 'Cris Vincent M. OLVIDA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cris Vincent M. OLVIDA', 'Cris Vincent', 'Mistula', 'OLVIDA', 'teacher_i', 'SPE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Tomie V. OLVIDA (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_olvida_tomie', 'tomie.olvida@mati.edu.ph', 'Tomie V. OLVIDA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Tomie V. OLVIDA', 'Tomie', 'Valentin', 'OLVIDA', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alyssa H. PACTO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_pacto_alyssa', 'alyssa.pacto@mati.edu.ph', 'Alyssa H. PACTO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alyssa H. PACTO', 'Alyssa', 'Hibaya', 'PACTO', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gerelyn M. PADAO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_padao_gerelyn', 'gerelyn.padao@mati.edu.ph', 'Gerelyn M. PADAO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gerelyn M. PADAO', 'Gerelyn', 'Macasaupan', 'PADAO', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosemelyn D. PAGCAMAAN (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_pagcamaan_rosemelyn', 'rosemelyn.pagcamaan@mati.edu.ph', 'Rosemelyn D. PAGCAMAAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosemelyn D. PAGCAMAAN', 'Rosemelyn', 'Davao', 'PAGCAMAAN', 'teacher_i', 'BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rhoda Janine . PALMERA (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_palmera_rhodajanine', 'rhodajanine.palmera@mati.edu.ph', 'Rhoda Janine . PALMERA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rhoda Janine . PALMERA', 'Rhoda Janine', 'None', 'PALMERA', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Felmer M. PANDAC (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_pandac_felmer', 'felmer.pandac@mati.edu.ph', 'Felmer M. PANDAC', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Felmer M. PANDAC', 'Felmer', 'Milo', 'PANDAC', 'teacher_iii', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annaliza A. PAPA (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_papa_annaliza', 'annaliza.papa@mati.edu.ph', 'Annaliza A. PAPA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annaliza A. PAPA', 'Annaliza', 'Almuete', 'PAPA', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charlene A. PAYBANO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_paybano_charlene', 'charlene.paybano@mati.edu.ph', 'Charlene A. PAYBANO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charlene A. PAYBANO', 'Charlene', 'Ampilanon', 'PAYBANO', 'teacher_i', 'Agronomy', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovely Joy C. PELIOTAS (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_peliotas_lovelyjoy', 'lovelyjoy.peliotas@mati.edu.ph', 'Lovely Joy C. PELIOTAS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovely Joy C. PELIOTAS', 'Lovely Joy', 'Canonio', 'PELIOTAS', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emjhon P. PELIOTES () - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_peliotes_emjhon', 'emjhon.peliotes@mati.edu.ph', 'Emjhon P. PELIOTES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emjhon P. PELIOTES', 'Emjhon', '', 'PELIOTES', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marian Gail M. PITO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_pito_mariangail', 'mariangail.pito@mati.edu.ph', 'Marian Gail M. PITO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marian Gail M. PITO', 'Marian Gail', 'Misajon', 'PITO', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dgyrrah Ann S. PRADO (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_prado_dgyrrahann', 'dgyrrahann.prado@mati.edu.ph', 'Dgyrrah Ann S. PRADO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dgyrrah Ann S. PRADO', 'Dgyrrah Ann', 'Suelto', 'PRADO', 'master_teacher_i', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Luna Lu P. PUNAY (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_punay_lunalu', 'lunalu.punay@mati.edu.ph', 'Luna Lu P. PUNAY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Luna Lu P. PUNAY', 'Luna Lu', 'Perez', 'PUNAY', 'teacher_iii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marjorie Ann M. QUILAB (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_quilab_marjorieann', 'marjorieann.quilab@mati.edu.ph', 'Marjorie Ann M. QUILAB', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marjorie Ann M. QUILAB', 'Marjorie Ann', 'Manguin', 'QUILAB', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jocelyn K. QUIMPAN (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_quimpan_jocelyn', 'jocelyn.quimpan@mati.edu.ph', 'Jocelyn K. QUIMPAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jocelyn K. QUIMPAN', 'Jocelyn', 'Kionisala', 'QUIMPAN', 'teacher_ii', 'Industrial Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Richelle Mae R. REBALDE (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_rebalde_richellemae', 'richellemae.rebalde@mati.edu.ph', 'Richelle Mae R. REBALDE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Richelle Mae R. REBALDE', 'Richelle Mae', 'Rabuya', 'REBALDE', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eras M. REAMBILLO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_reambillo_eras', 'eras.reambillo@mati.edu.ph', 'Eras M. REAMBILLO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eras M. REAMBILLO', 'Eras', 'Malintad', 'REAMBILLO', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rogelio S. RESPONTE (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_responte_rogelio', 'rogelio.responte@mati.edu.ph', 'Rogelio S. RESPONTE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rogelio S. RESPONTE', 'Rogelio', 'Sinco', 'RESPONTE', 'master_teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jean Christi B. RIVERA (MT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_rivera_jeanchristi', 'jeanchristi.rivera@mati.edu.ph', 'Jean Christi B. RIVERA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jean Christi B. RIVERA', 'Jean Christi', 'Bravo', 'RIVERA', 'master_teacher_ii', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anabel I. RIVERA (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_rivera_anabel', 'anabel.rivera@mati.edu.ph', 'Anabel I. RIVERA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anabel I. RIVERA', 'Anabel', 'Ingay', 'RIVERA', 'teacher_ii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Diana Rose A. RIVERA (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_rivera_dianarose', 'dianarose.rivera@mati.edu.ph', 'Diana Rose A. RIVERA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Diana Rose A. RIVERA', 'Diana Rose', 'Alberina', 'RIVERA', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- ABDUL MOHSEN D. Sabello (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sabello_abdulmohsen', 'abdulmohsen.sabello@mati.edu.ph', 'ABDUL MOHSEN D. Sabello', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'ABDUL MOHSEN D. Sabello', 'ABDUL MOHSEN', 'Dapitanon', 'Sabello', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nory Jean R. SABIJON (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sabijon_noryjean', 'noryjean.sabijon@mati.edu.ph', 'Nory Jean R. SABIJON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nory Jean R. SABIJON', 'Nory Jean', 'Rojas', 'SABIJON', 'teacher_i', 'Araling Panlipunan', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Macris P. SAGPANG (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sagpang_macris', 'macris.sagpang@mati.edu.ph', 'Macris P. SAGPANG', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Macris P. SAGPANG', 'Macris', 'Padang', 'SAGPANG', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Retieza S. SALGADO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_salgado_retieza', 'retieza.salgado@mati.edu.ph', 'Retieza S. SALGADO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Retieza S. SALGADO', 'Retieza', 'Santiago', 'SALGADO', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dorothy Mae S. SAJETARIOS (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sajetarios_dorothymae', 'dorothymae.sajetarios@mati.edu.ph', 'Dorothy Mae S. SAJETARIOS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dorothy Mae S. SAJETARIOS', 'Dorothy Mae', 'Samson', 'SAJETARIOS', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Asma S. Sameon (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sameon_asma', 'asma.sameon@mati.edu.ph', 'Asma S. Sameon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Asma S. Sameon', 'Asma', 'Sugaran', 'Sameon', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Donna Mae M. SANCHEZ (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sanchez_donnamae', 'donnamae.sanchez@mati.edu.ph', 'Donna Mae M. SANCHEZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Donna Mae M. SANCHEZ', 'Donna Mae', 'Magdula', 'SANCHEZ', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Laica B. SARAMOSING (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_saramosing_laica', 'laica.saramosing@mati.edu.ph', 'Laica B. SARAMOSING', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Laica B. SARAMOSING', 'Laica', 'Basog', 'SARAMOSING', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julie May G. SARMIENTO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sarmiento_juliemay', 'juliemay.sarmiento@mati.edu.ph', 'Julie May G. SARMIENTO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julie May G. SARMIENTO', 'Julie May', 'Gumimba', 'SARMIENTO', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kareen Joy N. SIANO (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_siano_kareenjoy', 'kareenjoy.siano@mati.edu.ph', 'Kareen Joy N. SIANO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kareen Joy N. SIANO', 'Kareen Joy', 'Naula', 'SIANO', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Victoria Nova D. SIMBAJON (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_simbajon_victorianova', 'victorianova.simbajon@mati.edu.ph', 'Victoria Nova D. SIMBAJON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Victoria Nova D. SIMBAJON', 'Victoria Nova', 'Dejaño', 'SIMBAJON', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Pedro R. SULATRE (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sulatre_pedro', 'pedro.sulatre@mati.edu.ph', '"Pedro R. SULATRE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Pedro R. SULATRE', '"Pedro', 'Roxas', 'SULATRE', 'teacher_i', 'MT-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Robeann B. SOLATORIO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_solatorio_robeann', 'robeann.solatorio@mati.edu.ph', 'Robeann B. SOLATORIO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Robeann B. SOLATORIO', 'Robeann', 'Baay', 'SOLATORIO', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elmer O. SURIGAO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_surigao_elmer', 'elmer.surigao@mati.edu.ph', 'Elmer O. SURIGAO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elmer O. SURIGAO', 'Elmer', 'Ordeniza', 'SURIGAO', 'teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dioliza C. TAC-AL (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_tacal_dioliza', 'dioliza.tacal@mati.edu.ph', 'Dioliza C. TAC-AL', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dioliza C. TAC-AL', 'Dioliza', 'Cabañas', 'TAC-AL', 'teacher_ii', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alyzza Rose V. TAMAY (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_tamay_alyzzarose', 'alyzzarose.tamay@mati.edu.ph', 'Alyzza Rose V. TAMAY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alyzza Rose V. TAMAY', 'Alyzza Rose', 'Vosotros', 'TAMAY', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marjorie C. TAN (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_tan_marjorie', 'marjorie.tan@mati.edu.ph', 'Marjorie C. TAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marjorie C. TAN', 'Marjorie', 'Castillo', 'TAN', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Heide Mae S. TERO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_tero_heidemae', 'heidemae.tero@mati.edu.ph', 'Heide Mae S. TERO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Heide Mae S. TERO', 'Heide Mae', 'Salamanca', 'TERO', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Karlo Paolo Leopolds C. UYAN (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_uyan_karlopaololeopolds', 'karlopaololeopolds.uyan@mati.edu.ph', 'Karlo Paolo Leopolds C. UYAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Karlo Paolo Leopolds C. UYAN', 'Karlo Paolo Leopolds', 'Camilo', 'UYAN', 'teacher_ii', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anabelle C. VALE (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_vale_anabelle', 'anabelle.vale@mati.edu.ph', 'Anabelle C. VALE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anabelle C. VALE', 'Anabelle', 'Carreon', 'VALE', 'teacher_iii', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeniffer C. VASAY (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_vasay_jeniffer', 'jeniffer.vasay@mati.edu.ph', 'Jeniffer C. VASAY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeniffer C. VASAY', 'Jeniffer', 'Casil', 'VASAY', 'master_teacher_i', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eugene C. VASAY (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_vasay_eugene', 'eugene.vasay@mati.edu.ph', 'Eugene C. VASAY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eugene C. VASAY', 'Eugene', 'Casil', 'VASAY', 'teacher_iii', 'Industrial Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Resalyn T. VERANO (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_verano_resalyn', 'resalyn.verano@mati.edu.ph', 'Resalyn T. VERANO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Resalyn T. VERANO', 'Resalyn', 'Talaid', 'VERANO', 'teacher_i', 'BS in Development Comm.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nissan Mae M. VILLASORDA (T-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_villasorda_nissanmae', 'nissanmae.villasorda@mati.edu.ph', 'Nissan Mae M. VILLASORDA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nissan Mae M. VILLASORDA', 'Nissan Mae', 'Masaling', 'VILLASORDA', 'teacher_ii', 'BS in Agribusiness', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivy G. VOSOTROS (T-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_vosotros_ivy', 'ivy.vosotros@mati.edu.ph', 'Ivy G. VOSOTROS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivy G. VOSOTROS', 'Ivy', 'Gonzales', 'VOSOTROS', 'teacher_iii', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jahzeel Love M. ZAMORA (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_zamora_jahzeellove', 'jahzeellove.zamora@mati.edu.ph', 'Jahzeel Love M. ZAMORA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jahzeel Love M. ZAMORA', 'Jahzeel Love', 'Manang', 'ZAMORA', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Evalyn C. AUSTRIA (HT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_austria_evalyn', 'evalyn.austria@mati.edu.ph', 'Evalyn C. AUSTRIA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Evalyn C. AUSTRIA', 'Evalyn', 'Campos', 'AUSTRIA', 'head_teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma Jessie M. AFABLE (HT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_afable_majessie', 'majessie.afable@mati.edu.ph', 'Ma Jessie M. AFABLE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma Jessie M. AFABLE', 'Ma Jessie', 'Magbanua', 'AFABLE', 'head_teacher_ii', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joel S. CANONIO (HT-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_canonio_joel', 'joel.canonio@mati.edu.ph', 'Joel S. CANONIO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joel S. CANONIO', 'Joel', 'Sulusod', 'CANONIO', 'head_teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marybeth J. ESTOQUE (SSHT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_estoque_marybeth', 'marybeth.estoque@mati.edu.ph', 'Marybeth J. ESTOQUE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marybeth J. ESTOQUE', 'Marybeth', 'Janeo', 'ESTOQUE', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ginalyn B. MISAJON (SSHT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_misajon_ginalyn', 'ginalyn.misajon@mati.edu.ph', 'Ginalyn B. MISAJON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ginalyn B. MISAJON', 'Ginalyn', 'Bongan', 'MISAJON', 'teacher_i', 'General Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonie C. GUBALANI (SSHT-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_gubalani_jonie', 'jonie.gubalani@mati.edu.ph', 'Jonie C. GUBALANI', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonie C. GUBALANI', 'Jonie', 'Calixtro', 'GUBALANI', 'teacher_i', 'Technology & HE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fe G. TALBIN (SSHT-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_talbin_fe', 'fe.talbin@mati.edu.ph', 'Fe G. TALBIN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fe G. TALBIN', 'Fe', 'Galola', 'TALBIN', 'teacher_i', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- SUNSHINE T. UDTOHAN (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_udtohan_sunshine', 'sunshine.udtohan@mati.edu.ph', 'SUNSHINE T. UDTOHAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'SUNSHINE T. UDTOHAN', 'SUNSHINE', 'Tagulaylay', 'UDTOHAN', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Myca Jane L.. Quindao (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_quindao_mycajane', 'mycajane.quindao@mati.edu.ph', 'Myca Jane L.. Quindao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Myca Jane L.. Quindao', 'Myca Jane', 'Ladero', 'Quindao', 'teacher_i', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eulogio M.. Manluyang (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_manluyang_eulogio', 'eulogio.manluyang@mati.edu.ph', 'Eulogio M.. Manluyang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eulogio M.. Manluyang', 'Eulogio', 'M', 'Manluyang', 'teacher_i', 'BSED Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vicmar L.. Trinidad (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_trinidad_vicmar', 'vicmar.trinidad@mati.edu.ph', 'Vicmar L.. Trinidad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vicmar L.. Trinidad', 'Vicmar', 'Limondo', 'Trinidad', 'teacher_i', 'BSED Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Perla C.. Aguilar (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_aguilar_perla', 'perla.aguilar@mati.edu.ph', 'Perla C.. Aguilar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Perla C.. Aguilar', 'Perla', 'Cahilog', 'Aguilar', 'teacher_i', 'ARALPAN', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emjhon P.. Peliotas (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_peliotas_emjhon', 'emjhon.peliotas@mati.edu.ph', 'Emjhon P.. Peliotas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emjhon P.. Peliotas', 'Emjhon', 'Paran', 'Peliotas', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arnold D. Ba-ay (MT - I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_baay_arnold', 'arnold.baay@mati.edu.ph', 'Arnold D. Ba-ay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arnold D. Ba-ay', 'Arnold', 'Dangcalan', 'Ba-ay', 'teacher_i', 'BS COMMERCE - ACCOUNTING', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Niña Jeanne N. Balase (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_balase_niajeanne', 'niajeanne.balase@mati.edu.ph', 'Niña Jeanne N. Balase', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Niña Jeanne N. Balase', 'Niña Jeanne', 'Nadonza', 'Balase', 'teacher_ii', 'BS BUSINESS MANAGEMENT', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annabelle J. Baldoz (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_baldoz_annabelle', 'annabelle.baldoz@mati.edu.ph', 'Annabelle J. Baldoz', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annabelle J. Baldoz', 'Annabelle', 'Jorolan', 'Baldoz', 'teacher_iii', 'BSED ENGLISH / MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Reinna Anne Cecilia L.. Bastida (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bastida_reinnaannececilia', 'reinnaannececilia.bastida@mati.edu.ph', 'Reinna Anne Cecilia L.. Bastida', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Reinna Anne Cecilia L.. Bastida', 'Reinna Anne Cecilia', 'Limbago', 'Bastida', 'teacher_iii', 'BS NURSING / BSED - BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonalyn Joy B. Blanco (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_blanco_jonalynjoy', 'jonalynjoy.blanco@mati.edu.ph', 'Jonalyn Joy B. Blanco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonalyn Joy B. Blanco', 'Jonalyn Joy', 'Babiera', 'Blanco', 'teacher_i', 'BSED - BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elizabeth B. Bucani (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bucani_elizabeth', 'elizabeth.bucani@mati.edu.ph', 'Elizabeth B. Bucani', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elizabeth B. Bucani', 'Elizabeth', 'Bangahon', 'Bucani', 'teacher_ii', 'BSED - ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherry May P.. Bucio (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bucio_cherrymay', 'cherrymay.bucio@mati.edu.ph', 'Cherry May P.. Bucio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherry May P.. Bucio', 'Cherry May', 'Perpetua', 'Bucio', 'teacher_ii', 'BSED - ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edeson John M. Cabanes (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_cabanes_edesonjohn', 'edesonjohn.cabanes@mati.edu.ph', 'Edeson John M. Cabanes', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edeson John M. Cabanes', 'Edeson John', 'Marianito', 'Cabanes', 'teacher_i', 'BS INFORMATION TECHNOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ramon B. Calungsod (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_calungsod_ramon', 'ramon.calungsod@mati.edu.ph', 'Ramon B. Calungsod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ramon B. Calungsod', 'Ramon', 'Bocong', 'Calungsod', 'teacher_ii', 'BSTE - MECHANICAL TECHNOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Illyn July M.. Cole (MT-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_cole_illynjuly', 'illynjuly.cole@mati.edu.ph', 'Illyn July M.. Cole', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Illyn July M.. Cole', 'Illyn July', 'Mangayon', 'Cole', 'master_teacher_i', 'BSED MATHEMATICS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah C. Cortez (MT -I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_cortez_leah', 'leah.cortez@mati.edu.ph', 'Leah C. Cortez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah C. Cortez', 'Leah', 'Cagabhion', 'Cortez', 'teacher_i', 'BSED - PEHM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julia Ann G. Danda (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_danda_juliaann', 'juliaann.danda@mati.edu.ph', 'Julia Ann G. Danda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julia Ann G. Danda', 'Julia Ann', 'Garay', 'Danda', 'teacher_ii', 'BSED - INTEGRATED SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeaniffer B. Daosin (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_daosin_jeaniffer', 'jeaniffer.daosin@mati.edu.ph', 'Jeaniffer B. Daosin', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeaniffer B. Daosin', 'Jeaniffer', 'Buscagan', 'Daosin', 'teacher_ii', 'BS BUSINESS ADMINISTRATION', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roy L.. Decena (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_decena_roy', 'roy.decena@mati.edu.ph', 'Roy L.. Decena', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roy L.. Decena', 'Roy', 'Laude', 'Decena', 'teacher_iii', 'BSED MATHEMATICS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charlyn A. Didal (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_didal_charlyn', 'charlyn.didal@mati.edu.ph', 'Charlyn A. Didal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charlyn A. Didal', 'Charlyn', 'Amoro', 'Didal', 'teacher_ii', 'BS DEV COM - BPED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lovely Joy C. Duay (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_duay_lovelyjoy', 'lovelyjoy.duay@mati.edu.ph', 'Lovely Joy C. Duay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lovely Joy C. Duay', 'Lovely Joy', 'Caiña', 'Duay', 'teacher_ii', 'BS HRM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Princes Febie M. Durano (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_durano_princesfebie', 'princesfebie.durano@mati.edu.ph', 'Princes Febie M. Durano', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Princes Febie M. Durano', 'Princes Febie', 'Maguimpa', 'Durano', 'teacher_i', 'BSED - ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rommel M. Esteban (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_esteban_rommel', 'rommel.esteban@mati.edu.ph', 'Rommel M. Esteban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rommel M. Esteban', 'Rommel', 'Masinading', 'Esteban', 'teacher_iii', 'BSED MATHEMATICS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Charles Martin G. Goc-ong (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_gocong_charlesmartin', 'charlesmartin.gocong@mati.edu.ph', 'Charles Martin G. Goc-ong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Charles Martin G. Goc-ong', 'Charles Martin', 'Garcia', 'Goc-ong', 'teacher_ii', 'BSED - ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Krisha Ann Marie L.. Goc-ong (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_gocong_krishaannmarie', 'krishaannmarie.gocong@mati.edu.ph', 'Krisha Ann Marie L.. Goc-ong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Krisha Ann Marie L.. Goc-ong', 'Krisha Ann Marie', 'Ludia', 'Goc-ong', 'teacher_i', 'BSED - ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lanie A.. Gustino (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_gustino_lanie', 'lanie.gustino@mati.edu.ph', 'Lanie A.. Gustino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lanie A.. Gustino', 'Lanie', 'Ajos', 'Gustino', 'teacher_ii', 'BSED MATHEMATICS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kiarah Reyshelle C. Ibanez (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_ibanez_kiarahreyshelle', 'kiarahreyshelle.ibanez@mati.edu.ph', 'Kiarah Reyshelle C. Ibanez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kiarah Reyshelle C. Ibanez', 'Kiarah Reyshelle', 'Campion', 'Ibanez', 'teacher_i', 'BSED ENGLISH / MAEL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Archen Mae M. Indong (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_indong_archenmae', 'archenmae.indong@mati.edu.ph', 'Archen Mae M. Indong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Archen Mae M. Indong', 'Archen Mae', 'Marayan', 'Indong', 'teacher_i', 'BSED- BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nolly O.. Inoco (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_inoco_nolly', 'nolly.inoco@mati.edu.ph', 'Nolly O.. Inoco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nolly O.. Inoco', 'Nolly', 'Ong', 'Inoco', 'teacher_ii', 'BSBM - AGRI / INTERGRATED SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rhodora D. Jimenez (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_jimenez_rhodora', 'rhodora.jimenez@mati.edu.ph', 'Rhodora D. Jimenez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rhodora D. Jimenez', 'Rhodora', 'Dacillo', 'Jimenez', 'teacher_ii', 'BS HOME ECONOMICS - FOOD BUSINESS MANAGEMENT', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ervy R.. Lagare (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_lagare_ervy', 'ervy.lagare@mati.edu.ph', 'Ervy R.. Lagare', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ervy R.. Lagare', 'Ervy', 'Reloba', 'Lagare', 'teacher_ii', 'BSED ENVIRONMENTAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosshare L. Lee (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_lee_rosshare', 'rosshare.lee@mati.edu.ph', 'Rosshare L. Lee', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosshare L. Lee', 'Rosshare', 'Laroga', 'Lee', 'teacher_ii', 'BS BUSINESS MANAGEMENT', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Resheen A.. Lim (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_lim_resheen', 'resheen.lim@mati.edu.ph', 'Resheen A.. Lim', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Resheen A.. Lim', 'Resheen', 'Arnado', 'Lim', 'teacher_ii', 'BS INFORMATION TECHNOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mercy A.. Maliga (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_maliga_mercy', 'mercy.maliga@mati.edu.ph', 'Mercy A.. Maliga', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mercy A.. Maliga', 'Mercy', 'Anong', 'Maliga', 'teacher_i', 'BS BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Leonardo S. Mangubat (Jr.") - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_mangubat_leonardo', 'leonardo.mangubat@mati.edu.ph', '"Leonardo S. Mangubat', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Leonardo S. Mangubat', '"Leonardo', 'Sungahid', 'Mangubat', 'teacher_i', 'T-II', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rovelyn D. Maraorao (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_maraorao_rovelyn', 'rovelyn.maraorao@mati.edu.ph', 'Rovelyn D. Maraorao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rovelyn D. Maraorao', 'Rovelyn', 'Damas', 'Maraorao', 'teacher_ii', 'BSBA - BUSINESS ECONOMICS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mae M. Mariñas (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_marias_mae', 'mae.marias@mati.edu.ph', 'Mae M. Mariñas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mae M. Mariñas', 'Mae', 'Montojo', 'Mariñas', 'teacher_i', 'BS HRM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Ruby D. Mariquit (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_mariquit_mariaruby', 'mariaruby.mariquit@mati.edu.ph', 'Maria Ruby D. Mariquit', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Ruby D. Mariquit', 'Maria Ruby', 'Dollete', 'Mariquit', 'teacher_ii', 'BSED FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jerry S. Martinez (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_martinez_jerry', 'jerry.martinez@mati.edu.ph', 'Jerry S. Martinez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jerry S. Martinez', 'Jerry', 'Sebuguero', 'Martinez', 'teacher_ii', 'BSED FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Winny M. Moanag (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_moanag_winny', 'winny.moanag@mati.edu.ph', 'Winny M. Moanag', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Winny M. Moanag', 'Winny', 'Magbutong', 'Moanag', 'teacher_ii', 'BS INDUSTRIAL TECHNOLOGY MANAGEMENT', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noel P. Montalban (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_montalban_noel', 'noel.montalban@mati.edu.ph', 'Noel P. Montalban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noel P. Montalban', 'Noel', 'Plaza', 'Montalban', 'teacher_i', 'BS HRM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Kristelle P.. Muana (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_muana_mariakristelle', 'mariakristelle.muana@mati.edu.ph', 'Maria Kristelle P.. Muana', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Kristelle P.. Muana', 'Maria Kristelle', 'Pongol', 'Muana', 'teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherry Ann P.. Nugal (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_nugal_cherryann', 'cherryann.nugal@mati.edu.ph', 'Cherry Ann P.. Nugal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherry Ann P.. Nugal', 'Cherry Ann', 'Pangalaya', 'Nugal', 'teacher_ii', 'BSED FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Rica M. Olarte (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_olarte_mariarica', 'mariarica.olarte@mati.edu.ph', 'Maria Rica M. Olarte', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Rica M. Olarte', 'Maria Rica', 'Maboot', 'Olarte', 'teacher_i', 'BSED - TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sydney B. Paica (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_paica_sydney', 'sydney.paica@mati.edu.ph', 'Sydney B. Paica', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sydney B. Paica', 'Sydney', 'Brabante', 'Paica', 'teacher_i', 'BSED - ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Honey Lyn M.. Palmera (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_palmera_honeylyn', 'honeylyn.palmera@mati.edu.ph', 'Honey Lyn M.. Palmera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Honey Lyn M.. Palmera', 'Honey Lyn', 'Macagubang', 'Palmera', 'teacher_ii', 'BS INFORMATION TECHNOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nina Gloria Z. Pendang (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_pendang_ninagloria', 'ninagloria.pendang@mati.edu.ph', 'Nina Gloria Z. Pendang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nina Gloria Z. Pendang', 'Nina Gloria', 'Zaspa', 'Pendang', 'teacher_ii', 'BS ACCOUNTANCY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jennifer G. Pulleda (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_pulleda_jennifer', 'jennifer.pulleda@mati.edu.ph', 'Jennifer G. Pulleda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jennifer G. Pulleda', 'Jennifer', 'Ganoza', 'Pulleda', 'teacher_ii', 'BS BUSINESS ADMINISTRATION - FINANCIAL MANAGEMENT', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristy Ann Marie G.. Quiamco (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_quiamco_cristyannmarie', 'cristyannmarie.quiamco@mati.edu.ph', 'Cristy Ann Marie G.. Quiamco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristy Ann Marie G.. Quiamco', 'Cristy Ann Marie', 'Gonzaga', 'Quiamco', 'teacher_iii', 'BSED ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Alnest G. Ramal (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_ramal_alnest', 'alnest.ramal@mati.edu.ph', 'Alnest G. Ramal', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Alnest G. Ramal', 'Alnest', 'Ga', 'Ramal', 'teacher_ii', 'BSED MATHEMATICS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Pinky S. Rivera (MT-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_rivera_pinky', 'pinky.rivera@mati.edu.ph', 'Pinky S. Rivera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Pinky S. Rivera', 'Pinky', 'Sumaliling', 'Rivera', 'master_teacher_i', 'BSED - ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheela P.. Sadongdong (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sadongdong_sheela', 'sheela.sadongdong@mati.edu.ph', 'Sheela P.. Sadongdong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheela P.. Sadongdong', 'Sheela', 'Pigura', 'Sadongdong', 'teacher_i', 'BSED MATHEMATICS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janrey B. Sagpang (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sagpang_janrey', 'janrey.sagpang@mati.edu.ph', 'Janrey B. Sagpang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janrey B. Sagpang', 'Janrey', 'Bucong', 'Sagpang', 'teacher_ii', 'BS BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rojaine P.. Sanchez (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sanchez_rojaine', 'rojaine.sanchez@mati.edu.ph', 'Rojaine P.. Sanchez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rojaine P.. Sanchez', 'Rojaine', 'Paña', 'Sanchez', 'teacher_iii', 'BSTE- HOTEL AND RESTAURANT SERVICE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lawrence . Sanchez (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sanchez_lawrence', 'lawrence.sanchez@mati.edu.ph', 'Lawrence . Sanchez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lawrence . Sanchez', 'Lawrence', '(None)', 'Sanchez', 'teacher_ii', 'BS INDUSTRIAL TECHNOLOGY MANAGEMENT', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Raymunda C. Saropdas (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_saropdas_raymunda', 'raymunda.saropdas@mati.edu.ph', 'Raymunda C. Saropdas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Raymunda C. Saropdas', 'Raymunda', 'Castillon', 'Saropdas', 'teacher_ii', 'BSED - BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Norhifa A. Sibayan (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sibayan_norhifa', 'norhifa.sibayan@mati.edu.ph', 'Norhifa A. Sibayan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Norhifa A. Sibayan', 'Norhifa', 'Alisan', 'Sibayan', 'teacher_ii', 'BSED FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheena Gabriele F. Sy (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_sy_sheenagabriele', 'sheenagabriele.sy@mati.edu.ph', 'Sheena Gabriele F. Sy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheena Gabriele F. Sy', 'Sheena Gabriele', 'Fariolen', 'Sy', 'teacher_i', 'BPED - PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Richard L. Tonzo (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_tonzo_richard', 'richard.tonzo@mati.edu.ph', 'Richard L. Tonzo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Richard L. Tonzo', 'Richard', 'Lim', 'Tonzo', 'teacher_i', 'BSED -TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jewel L. Villegas (MT - II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_villegas_jewel', 'jewel.villegas@mati.edu.ph', 'Jewel L. Villegas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jewel L. Villegas', 'Jewel', 'Ligod', 'Villegas', 'teacher_i', 'BSED - GENERAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chariz Angel A. Ybañez (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_ybaez_charizangel', 'charizangel.ybaez@mati.edu.ph', 'Chariz Angel A. Ybañez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chariz Angel A. Ybañez', 'Chariz Angel', 'Arbol', 'Ybañez', 'teacher_ii', 'BSED- ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Naire P.. Omriso (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_omriso_naire', 'naire.omriso@mati.edu.ph', 'Naire P.. Omriso', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Naire P.. Omriso', 'Naire', 'Pasion', 'Omriso', 'teacher_i', '', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rennan John C. Bangcailan (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_bangcailan_rennanjohn', 'rennanjohn.bangcailan@mati.edu.ph', 'Rennan John C. Bangcailan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rennan John C. Bangcailan', 'Rennan John', '', 'Bangcailan', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Trishia Grace D. Empuerto () - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304325_empuerto_trishiagrace', 'trishiagrace.empuerto@mati.edu.ph', 'Trishia Grace D. Empuerto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Trishia Grace D. Empuerto', 'Trishia Grace', '', 'Empuerto', 'teacher_i', 'TVL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304325 not found';
  END IF;

  -- School: MATI SCHOOL OF ARTS & TRADES (304326) - 64 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304326' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Sharon Rose M. AGBAS (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_agbas_sharonrose', 'sharonrose.agbas@mati.edu.ph', 'Sharon Rose M. AGBAS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sharon Rose M. AGBAS', 'Sharon Rose', 'Masinadiong', 'AGBAS', 'teacher_iii', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aisa B. AMIANG (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_amiang_aisa', 'aisa.amiang@mati.edu.ph', 'Aisa B. AMIANG', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aisa B. AMIANG', 'Aisa', 'Buenafe', 'AMIANG', 'teacher_i', 'Filipino- MAED', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marilou E. ANDOYO (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_andoyo_marilou', 'marilou.andoyo@mati.edu.ph', 'Marilou E. ANDOYO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marilou E. ANDOYO', 'Marilou', 'Estropia', 'ANDOYO', 'teacher_iii', 'Industrial Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeramie S. AWA-AO (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_awaao_jeramie', 'jeramie.awaao@mati.edu.ph', 'Jeramie S. AWA-AO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeramie S. AWA-AO', 'Jeramie', 'Saldaña', 'AWA-AO', 'teacher_ii', 'BSE English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Ann D. BANDIGAN (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_bandigan_maryann', 'maryann.bandigan@mati.edu.ph', 'Mary Ann D. BANDIGAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Ann D. BANDIGAN', 'Mary Ann', 'Desierto', 'BANDIGAN', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jamayma F. BASTIAN (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_bastian_jamayma', 'jamayma.bastian@mati.edu.ph', 'Jamayma F. BASTIAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jamayma F. BASTIAN', 'Jamayma', 'Fernando', 'BASTIAN', 'teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Evelyn L. BAUDON (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_baudon_evelyn', 'evelyn.baudon@mati.edu.ph', 'Evelyn L. BAUDON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Evelyn L. BAUDON', 'Evelyn', 'Linsag', 'BAUDON', 'master_teacher_i', 'Home Economics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma Lynly B. MUTIA (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_mutia_malynly', 'malynly.mutia@mati.edu.ph', 'Ma Lynly B. MUTIA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma Lynly B. MUTIA', 'Ma Lynly', 'Bolo', 'MUTIA', 'teacher_i', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma Lalaine D. CALVEZ (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_calvez_malalaine', 'malalaine.calvez@mati.edu.ph', 'Ma Lalaine D. CALVEZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma Lalaine D. CALVEZ', 'Ma Lalaine', 'Dumadaug', 'CALVEZ', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Felinda C. CAÑETE (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_caete_felinda', 'felinda.caete@mati.edu.ph', 'Felinda C. CAÑETE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Felinda C. CAÑETE', 'Felinda', 'Calungsod', 'CAÑETE', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Romero M. CAÑETE (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_caete_romero', 'romero.caete@mati.edu.ph', '"Romero M. CAÑETE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Romero M. CAÑETE', '"Romero', 'Matiga', 'CAÑETE', 'teacher_i', 'ST-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Haydee B. CASTILLONES (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_castillones_haydee', 'haydee.castillones@mati.edu.ph', 'Haydee B. CASTILLONES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Haydee B. CASTILLONES', 'Haydee', 'Bacanto', 'CASTILLONES', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mary Jane M. COSTELO (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_costelo_maryjane', 'maryjane.costelo@mati.edu.ph', 'Mary Jane M. COSTELO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mary Jane M. COSTELO', 'Mary Jane', 'Mirambel', 'COSTELO', 'teacher_i', 'Agriculture', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Modem O. DEMUA (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_demua_modem', 'modem.demua@mati.edu.ph', 'Modem O. DEMUA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Modem O. DEMUA', 'Modem', 'Ortiz', 'DEMUA', 'master_teacher_i', 'Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Francisca D. FLORES (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_flores_francisca', 'francisca.flores@mati.edu.ph', 'Francisca D. FLORES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Francisca D. FLORES', 'Francisca', 'Dualin', 'FLORES', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jovelyn J. FONTEJON (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_fontejon_jovelyn', 'jovelyn.fontejon@mati.edu.ph', 'Jovelyn J. FONTEJON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jovelyn J. FONTEJON', 'Jovelyn', 'Jangao', 'FONTEJON', 'teacher_iii', 'Food and Nutrition', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janice S. BARBA (HT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_barba_janice', 'janice.barba@mati.edu.ph', 'Janice S. BARBA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janice S. BARBA', 'Janice', 'Francisco', 'BARBA', 'head_teacher_i', 'Physical Science-MAEM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherry Dhel B. GAGAMA (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_gagama_cherrydhel', 'cherrydhel.gagama@mati.edu.ph', 'Cherry Dhel B. GAGAMA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherry Dhel B. GAGAMA', 'Cherry Dhel', 'Banoy', 'GAGAMA', 'teacher_ii', 'Gen. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Leah L. GREGANA (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_gregana_leah', 'leah.gregana@mati.edu.ph', 'Leah L. GREGANA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Leah L. GREGANA', 'Leah', 'Legion', 'GREGANA', 'teacher_ii', 'Information Technology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- DAISY G.. MENDOZA (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_mendoza_daisy', 'daisy.mendoza@mati.edu.ph', 'DAISY G.. MENDOZA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'DAISY G.. MENDOZA', 'DAISY', '', 'MENDOZA', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marme S. MORALES (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_morales_marme', 'marme.morales@mati.edu.ph', 'Marme S. MORALES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marme S. MORALES', 'Marme', 'Sausa', 'MORALES', 'teacher_iii', 'History', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Julius J. NUÑALA (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_nuala_julius', 'julius.nuala@mati.edu.ph', 'Julius J. NUÑALA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Julius J. NUÑALA', 'Julius', 'Jabines', 'NUÑALA', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fernanda M. PAJARES (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_pajares_fernanda', 'fernanda.pajares@mati.edu.ph', 'Fernanda M. PAJARES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fernanda M. PAJARES', 'Fernanda', 'Madjos', 'PAJARES', 'teacher_ii', 'H.E', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rolly C. PANGALDIN (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_pangaldin_rolly', 'rolly.pangaldin@mati.edu.ph', 'Rolly C. PANGALDIN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rolly C. PANGALDIN', 'Rolly', 'Casanaan', 'PANGALDIN', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shiella Mae M. PANGALDIN (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_pangaldin_shiellamae', 'shiellamae.pangaldin@mati.edu.ph', 'Shiella Mae M. PANGALDIN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shiella Mae M. PANGALDIN', 'Shiella Mae', 'Morales', 'PANGALDIN', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kristiane B. PARING (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_paring_kristiane', 'kristiane.paring@mati.edu.ph', 'Kristiane B. PARING', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kristiane B. PARING', 'Kristiane', 'Bacaron', 'PARING', 'teacher_iii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janneca Kea M. QUEBRAL (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_quebral_jannecakea', 'jannecakea.quebral@mati.edu.ph', 'Janneca Kea M. QUEBRAL', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janneca Kea M. QUEBRAL', 'Janneca Kea', 'Monilla', 'QUEBRAL', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Shyrene R. TOONG (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_toong_shyrene', 'shyrene.toong@mati.edu.ph', 'Shyrene R. TOONG', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Shyrene R. TOONG', 'Shyrene', 'Racsa', 'TOONG', 'teacher_iii', 'Food Technology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cristine C. QUINTANO (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_quintano_cristine', 'cristine.quintano@mati.edu.ph', 'Cristine C. QUINTANO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cristine C. QUINTANO', 'Cristine', 'Cabel', 'QUINTANO', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Manuel L. RAMIREZ (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_ramirez_manuel', 'manuel.ramirez@mati.edu.ph', 'Manuel L. RAMIREZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Manuel L. RAMIREZ', 'Manuel', 'Lagarto', 'RAMIREZ', 'teacher_i', 'BIT in Automotive Mechanics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- May G. RAMIREZ (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_ramirez_may', 'may.ramirez@mati.edu.ph', 'May G. RAMIREZ', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'May G. RAMIREZ', 'May', 'Gamao', 'RAMIREZ', 'teacher_ii', 'BS Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ellen Joy M. ROJAS (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_rojas_ellenjoy', 'ellenjoy.rojas@mati.edu.ph', 'Ellen Joy M. ROJAS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ellen Joy M. ROJAS', 'Ellen Joy', 'Morales', 'ROJAS', 'master_teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Roland A. SELEHENCIA (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_selehencia_roland', 'roland.selehencia@mati.edu.ph', 'Roland A. SELEHENCIA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Roland A. SELEHENCIA', 'Roland', 'Amper', 'SELEHENCIA', 'teacher_iii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Riza Mae S. TOROBA (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_toroba_rizamae', 'rizamae.toroba@mati.edu.ph', 'Riza Mae S. TOROBA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Riza Mae S. TOROBA', 'Riza Mae', 'Sunggay', 'TOROBA', 'teacher_iii', 'BS in Agribusiness', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gloryfel M. VILLARENTE (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_villarente_gloryfel', 'gloryfel.villarente@mati.edu.ph', 'Gloryfel M. VILLARENTE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gloryfel M. VILLARENTE', 'Gloryfel', 'Mineses', 'VILLARENTE', 'teacher_i', 'Scienc/PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Lalaine B. OTABE (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_otabe_marialalaine', 'marialalaine.otabe@mati.edu.ph', 'Maria Lalaine B. OTABE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Lalaine B. OTABE', 'Maria Lalaine', 'Bentayao', 'OTABE', 'teacher_i', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jes Brian R. OGAHAYON (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_ogahayon_jesbrian', 'jesbrian.ogahayon@mati.edu.ph', 'Jes Brian R. OGAHAYON', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jes Brian R. OGAHAYON', 'Jes Brian', 'Romano', 'OGAHAYON', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nicanor C. CANDIA (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_candia_nicanor', 'nicanor.candia@mati.edu.ph', 'Nicanor C. CANDIA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nicanor C. CANDIA', 'Nicanor', 'Cabigas', 'CANDIA', 'teacher_i', 'Carpentry/TVL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- DAISY JANE B.. TAPIA (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_tapia_daisyjane', 'daisyjane.tapia@mati.edu.ph', 'DAISY JANE B.. TAPIA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'DAISY JANE B.. TAPIA', 'DAISY JANE', 'Bongo', 'TAPIA', 'teacher_i', 'BSBA/Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Robelin R. Barcelo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_barcelo_robelin', 'robelin.barcelo@mati.edu.ph', 'Robelin R. Barcelo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Robelin R. Barcelo', 'Robelin', 'Ruiz', 'Barcelo', 'teacher_i', 'Bachelor of Technology and Livelihood Education - Industrial Arts', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nicole Jay L.. Labor (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_labor_nicolejay', 'nicolejay.labor@mati.edu.ph', 'Nicole Jay L.. Labor', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nicole Jay L.. Labor', 'Nicole Jay', 'Lisao', 'Labor', 'teacher_i', 'Bachelor of Technology and Livelihood Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jessabelle M.. ACOSTA (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_acosta_jessabelle', 'jessabelle.acosta@mati.edu.ph', 'Jessabelle M.. ACOSTA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jessabelle M.. ACOSTA', 'Jessabelle', '', 'ACOSTA', 'teacher_ii', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Krystelle Marie B. ANTERO (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_antero_krystellemarie', 'krystellemarie.antero@mati.edu.ph', 'Krystelle Marie B. ANTERO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Krystelle Marie B. ANTERO', 'Krystelle Marie', 'Baang', 'ANTERO', 'teacher_ii', 'HRM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rose G. BOHOL (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_bohol_rose', 'rose.bohol@mati.edu.ph', 'Rose G. BOHOL', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rose G. BOHOL', 'Rose', 'Guillano', 'BOHOL', 'teacher_iii', 'BSED Catechetics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jonilee D.. CALUNGSOD (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_calungsod_jonilee', 'jonilee.calungsod@mati.edu.ph', 'Jonilee D.. CALUNGSOD', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jonilee D.. CALUNGSOD', 'Jonilee', 'de Catalina', 'CALUNGSOD', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Geraldina A. CARPIO (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_carpio_geraldina', 'geraldina.carpio@mati.edu.ph', 'Geraldina A. CARPIO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Geraldina A. CARPIO', 'Geraldina', 'Arce', 'CARPIO', 'teacher_ii', 'BSE - Int. Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Keneth Ashley A. COSE (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_cose_kenethashley', 'kenethashley.cose@mati.edu.ph', 'Keneth Ashley A. COSE', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Keneth Ashley A. COSE', 'Keneth Ashley', 'Arnado', 'COSE', 'teacher_ii', 'Automotive', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jaynud Deen M. DESALES (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_desales_jaynuddeen', 'jaynuddeen.desales@mati.edu.ph', 'Jaynud Deen M. DESALES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jaynud Deen M. DESALES', 'Jaynud Deen', 'Matapid', 'DESALES', 'teacher_ii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cheston S. GORION (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_gorion_cheston', 'cheston.gorion@mati.edu.ph', 'Cheston S. GORION', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cheston S. GORION', 'Cheston', 'Selehencia', 'GORION', 'teacher_ii', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vergel R. FETIZA (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_fetiza_vergel', 'vergel.fetiza@mati.edu.ph', 'Vergel R. FETIZA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vergel R. FETIZA', 'Vergel', 'Regenio', 'FETIZA', 'teacher_iii', 'PEHM', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arwen A. LIM (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_lim_arwen', 'arwen.lim@mati.edu.ph', 'Arwen A. LIM', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arwen A. LIM', 'Arwen', 'Arnado', 'LIM', 'teacher_i', 'Automotive', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Orlan A. LUPOGAN (MT-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_lupogan_orlan', 'orlan.lupogan@mati.edu.ph', 'Orlan A. LUPOGAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Orlan A. LUPOGAN', 'Orlan', 'Acpac', 'LUPOGAN', 'master_teacher_i', 'Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Moana Guiane P. LUPOGAN (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_lupogan_moanaguiane', 'moanaguiane.lupogan@mati.edu.ph', 'Moana Guiane P. LUPOGAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Moana Guiane P. LUPOGAN', 'Moana Guiane', 'Pasiola', 'LUPOGAN', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jennifer B. MABANDOS (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_mabandos_jennifer', 'jennifer.mabandos@mati.edu.ph', 'Jennifer B. MABANDOS', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jennifer B. MABANDOS', 'Jennifer', 'Baldoz', 'MABANDOS', 'teacher_ii', 'Integrated Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Alberto A. NGOHO (Jr") - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_ngoho_alberto', 'alberto.ngoho@mati.edu.ph', '"Alberto A. NGOHO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Alberto A. NGOHO', '"Alberto', 'Aying', 'NGOHO', 'teacher_i', 'T-I', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cindy Mae G.. NAPULI (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_napuli_cindymae', 'cindymae.napuli@mati.edu.ph', 'Cindy Mae G.. NAPULI', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cindy Mae G.. NAPULI', 'Cindy Mae', 'Gavino', 'NAPULI', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mechelle J. PAGUYAN (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_paguyan_mechelle', 'mechelle.paguyan@mati.edu.ph', 'Mechelle J. PAGUYAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mechelle J. PAGUYAN', 'Mechelle', 'Javier', 'PAGUYAN', 'teacher_ii', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gonzalo N. BALUSCA (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_balusca_gonzalo', 'gonzalo.balusca@mati.edu.ph', 'Gonzalo N. BALUSCA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gonzalo N. BALUSCA', 'Gonzalo', 'Nogalisa', 'BALUSCA', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cyrille O. BOMBOC (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_bomboc_cyrille', 'cyrille.bomboc@mati.edu.ph', 'Cyrille O. BOMBOC', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cyrille O. BOMBOC', 'Cyrille', 'Olitres', 'BOMBOC', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Samuel L. ROENA (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_roena_samuel', 'samuel.roena@mati.edu.ph', 'Samuel L. ROENA', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Samuel L. ROENA', 'Samuel', '', 'ROENA', 'teacher_i', 'TVL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Princess Jane T. VILLASES (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_villases_princessjane', 'princessjane.villases@mati.edu.ph', 'Princess Jane T. VILLASES', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Princess Jane T. VILLASES', 'Princess Jane', '', 'VILLASES', 'teacher_i', 'TVL', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hanney Vall A. Dizon (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_dizon_hanneyvall', 'hanneyvall.dizon@mati.edu.ph', 'Hanney Vall A. Dizon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hanney Vall A. Dizon', 'Hanney Vall', 'Alameda', 'Dizon', 'teacher_i', 'Bachelor of Technology and Livelihood Education - Home Economics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Celma M.. Onofre (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_onofre_celma', 'celma.onofre@mati.edu.ph', 'Celma M.. Onofre', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Celma M.. Onofre', 'Celma', 'Manapos', 'Onofre', 'teacher_i', 'BSED Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christopher D. MASANGUID (T-I) - ALS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304326_masanguid_christopher', 'christopher.masanguid@mati.edu.ph', 'Christopher D. MASANGUID', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christopher D. MASANGUID', 'Christopher', '', 'MASANGUID', 'teacher_i', 'ALS', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304326 not found';
  END IF;

  -- School: MATIAO NHS (304327) - 74 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304327' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Jemar C. Ampilanon (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_ampilanon_jemar', 'jemar.ampilanon@mati.edu.ph', 'Jemar C. Ampilanon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jemar C. Ampilanon', 'Jemar', 'Cablinda', 'Ampilanon', 'teacher_ii', 'SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ivan Louie B. Angos (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_angos_ivanlouie', 'ivanlouie.angos@mati.edu.ph', 'Ivan Louie B. Angos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ivan Louie B. Angos', 'Ivan Louie', 'Baloro', 'Angos', 'teacher_i', 'BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anthony Daryll Vincent D. Baay (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_baay_anthonydaryllvincent', 'anthonydaryllvincent.baay@mati.edu.ph', 'Anthony Daryll Vincent D. Baay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anthony Daryll Vincent D. Baay', 'Anthony Daryll Vincent', 'Dangcalan', 'Baay', 'teacher_ii', 'PHYSICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angel Zarah . Badilla (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_badilla_angelzarah', 'angelzarah.badilla@mati.edu.ph', 'Angel Zarah . Badilla', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angel Zarah . Badilla', 'Angel Zarah', '', 'Badilla', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gloria R. Balug (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_balug_gloria', 'gloria.balug@mati.edu.ph', 'Gloria R. Balug', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gloria R. Balug', 'Gloria', 'Rulona', 'Balug', 'teacher_iii', 'BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gina Mary R. Bandigan (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_bandigan_ginamary', 'ginamary.bandigan@mati.edu.ph', 'Gina Mary R. Bandigan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gina Mary R. Bandigan', 'Gina Mary', 'Requiron', 'Bandigan', 'teacher_ii', 'SOCIAL STUDIES', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Flordeliza D. Bangoy (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_bangoy_flordeliza', 'flordeliza.bangoy@mati.edu.ph', 'Flordeliza D. Bangoy', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Flordeliza D. Bangoy', 'Flordeliza', 'Debutiaco', 'Bangoy', 'teacher_ii', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marinel D. Bastida (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_bastida_marinel', 'marinel.bastida@mati.edu.ph', 'Marinel D. Bastida', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marinel D. Bastida', 'Marinel', 'Diabakid', 'Bastida', 'teacher_i', 'FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emerald O. Boiser (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_boiser_emerald', 'emerald.boiser@mati.edu.ph', 'Emerald O. Boiser', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emerald O. Boiser', 'Emerald', 'Ocon', 'Boiser', 'master_teacher_i', 'BIOLOGICAL SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Edgar L. Cabueñas (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_cabueas_edgar', 'edgar.cabueas@mati.edu.ph', 'Edgar L. Cabueñas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Edgar L. Cabueñas', 'Edgar', 'Labonzo', 'Cabueñas', 'master_teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mona Grace B. Caddawen (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_caddawen_monagrace', 'monagrace.caddawen@mati.edu.ph', 'Mona Grace B. Caddawen', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mona Grace B. Caddawen', 'Mona Grace', 'Betican', 'Caddawen', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Novie Pearl C. Cahimtang (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_cahimtang_noviepearl', 'noviepearl.cahimtang@mati.edu.ph', 'Novie Pearl C. Cahimtang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Novie Pearl C. Cahimtang', 'Novie Pearl', 'Cuestas', 'Cahimtang', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rosario G. Calunsod (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_calunsod_rosario', 'rosario.calunsod@mati.edu.ph', 'Rosario G. Calunsod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rosario G. Calunsod', 'Rosario', 'Galvez', 'Calunsod', 'teacher_iii', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mark Lorenze J. Caminero (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_caminero_marklorenze', 'marklorenze.caminero@mati.edu.ph', 'Mark Lorenze J. Caminero', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mark Lorenze J. Caminero', 'Mark Lorenze', 'Judilla', 'Caminero', 'teacher_iii', 'FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Geniva D. Canda (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_canda_geniva', 'geniva.canda@mati.edu.ph', 'Geniva D. Canda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Geniva D. Canda', 'Geniva', 'Deliman', 'Canda', 'teacher_iii', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Noel Miguel M. Careña (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_carea_noelmiguel', 'noelmiguel.carea@mati.edu.ph', 'Noel Miguel M. Careña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Noel Miguel M. Careña', 'Noel Miguel', 'Magdoboy', 'Careña', 'master_teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Grace B. Cavalida (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_cavalida_grace', 'grace.cavalida@mati.edu.ph', 'Grace B. Cavalida', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Grace B. Cavalida', 'Grace', 'Billanes', 'Cavalida', 'teacher_i', 'BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elton D. Davao (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_davao_elton', 'elton.davao@mati.edu.ph', 'Elton D. Davao', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elton D. Davao', 'Elton', 'Desecoro', 'Davao', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rose May Ann M. Daligdig (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_daligdig_rosemayann', 'rosemayann.daligdig@mati.edu.ph', 'Rose May Ann M. Daligdig', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rose May Ann M. Daligdig', 'Rose May Ann', 'Morales', 'Daligdig', 'teacher_i', 'SOCIAL STUDIES', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rafaelito B. De Veyra (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_deveyra_rafaelito', 'rafaelito.deveyra@mati.edu.ph', 'Rafaelito B. De Veyra', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rafaelito B. De Veyra', 'Rafaelito', 'Baay', 'De Veyra', 'teacher_i', 'ESP', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Fred Ryan C. Deaño (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_deao_fredryan', 'fredryan.deao@mati.edu.ph', 'Fred Ryan C. Deaño', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Fred Ryan C. Deaño', 'Fred Ryan', 'Canoy', 'Deaño', 'teacher_ii', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Regine B. Diuyan (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_diuyan_regine', 'regine.diuyan@mati.edu.ph', 'Regine B. Diuyan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Regine B. Diuyan', 'Regine', 'Bendulo', 'Diuyan', 'teacher_i', 'BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ranger D. Duay (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_duay_ranger', 'ranger.duay@mati.edu.ph', 'Ranger D. Duay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ranger D. Duay', 'Ranger', 'Donato', 'Duay', 'teacher_i', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ruselo R. Dupa (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_dupa_ruselo', 'ruselo.dupa@mati.edu.ph', 'Ruselo R. Dupa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ruselo R. Dupa', 'Ruselo', 'Rondon', 'Dupa', 'teacher_i', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Eugenia Q. Ellorimo (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_ellorimo_eugenia', 'eugenia.ellorimo@mati.edu.ph', 'Eugenia Q. Ellorimo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Eugenia Q. Ellorimo', 'Eugenia', 'Quibol', 'Ellorimo', 'teacher_iii', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Susana G. Enriquez (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_enriquez_susana', 'susana.enriquez@mati.edu.ph', 'Susana G. Enriquez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Susana G. Enriquez', 'Susana', 'Guillemer', 'Enriquez', 'teacher_ii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vilma R. Gomez (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_gomez_vilma', 'vilma.gomez@mati.edu.ph', 'Vilma R. Gomez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vilma R. Gomez', 'Vilma', 'Rondina', 'Gomez', 'teacher_iii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michessa O. Guinanas (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_guinanas_michessa', 'michessa.guinanas@mati.edu.ph', 'Michessa O. Guinanas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michessa O. Guinanas', 'Michessa', 'Ortega', 'Guinanas', 'teacher_iii', 'ENGLISH/ESP', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Vanessa Santa Joy L. Inojales (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_inojales_vanessasantajoy', 'vanessasantajoy.inojales@mati.edu.ph', 'Vanessa Santa Joy L. Inojales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Vanessa Santa Joy L. Inojales', 'Vanessa Santa Joy', 'Lee', 'Inojales', 'master_teacher_i', 'FoodTech', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marichelle Hayde M. Jorolan (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_jorolan_marichellehayde', 'marichellehayde.jorolan@mati.edu.ph', 'Marichelle Hayde M. Jorolan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marichelle Hayde M. Jorolan', 'Marichelle Hayde', 'Maglinte', 'Jorolan', 'teacher_i', 'AP/TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lyngel James A. Lape (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_lape_lyngeljames', 'lyngeljames.lape@mati.edu.ph', 'Lyngel James A. Lape', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lyngel James A. Lape', 'Lyngel James', 'Añora', 'Lape', 'teacher_iii', 'FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Gerson B. Lasmarias (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_lasmarias_gerson', 'gerson.lasmarias@mati.edu.ph', 'Gerson B. Lasmarias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Gerson B. Lasmarias', 'Gerson', 'Boiser', 'Lasmarias', 'teacher_iii', 'INTEG. SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Michelle Grace J. Lasmarias (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_lasmarias_michellegrace', 'michellegrace.lasmarias@mati.edu.ph', 'Michelle Grace J. Lasmarias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Michelle Grace J. Lasmarias', 'Michelle Grace', 'Jawa', 'Lasmarias', 'teacher_ii', 'BIO. SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Constancio E. Libre Jr. (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_librejr_constancio', 'constancio.librejr.@mati.edu.ph', 'Constancio E. Libre Jr.', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Constancio E. Libre Jr.', 'Constancio', 'Ebale', 'Libre Jr.', 'teacher_i', 'BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jeneva L. Magandam () - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_magandam_jeneva', 'jeneva.magandam@mati.edu.ph', 'Jeneva L. Magandam', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jeneva L. Magandam', 'Jeneva', '', 'Magandam', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Arlyn B.. Maimad (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_maimad_arlyn', 'arlyn.maimad@mati.edu.ph', 'Arlyn B.. Maimad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Arlyn B.. Maimad', 'Arlyn', 'Bahandi', 'Maimad', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Mericharm Cloie S.. Malintad (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_malintad_mericharmcloie', 'mericharmcloie.malintad@mati.edu.ph', 'Mericharm Cloie S.. Malintad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Mericharm Cloie S.. Malintad', 'Mericharm Cloie', 'Selehencia', 'Malintad', 'teacher_i', 'AP', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marina P. Manapos (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_manapos_marina', 'marina.manapos@mati.edu.ph', 'Marina P. Manapos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marina P. Manapos', 'Marina', 'Porazo', 'Manapos', 'teacher_i', 'VALUES EDUC.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Emelyn M. Mangmang (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_mangmang_emelyn', 'emelyn.mangmang@mati.edu.ph', 'Emelyn M. Mangmang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Emelyn M. Mangmang', 'Emelyn', 'Minoza', 'Mangmang', 'teacher_iii', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Angelika B. Matapias (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_matapias_angelika', 'angelika.matapias@mati.edu.ph', 'Angelika B. Matapias', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Angelika B. Matapias', 'Angelika', 'Bonggo', 'Matapias', 'teacher_i', 'SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Victor Emmanuel S. Miranda (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_miranda_victoremmanuel', 'victoremmanuel.miranda@mati.edu.ph', 'Victor Emmanuel S. Miranda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Victor Emmanuel S. Miranda', 'Victor Emmanuel', 'Saloma', 'Miranda', 'master_teacher_i', 'MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Marichu R. Nombrado (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_nombrado_marichu', 'marichu.nombrado@mati.edu.ph', 'Marichu R. Nombrado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Marichu R. Nombrado', 'Marichu', 'Rulona', 'Nombrado', 'teacher_iii', 'INTEG. SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sheena Marie M. Munda (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_munda_sheenamarie', 'sheenamarie.munda@mati.edu.ph', 'Sheena Marie M. Munda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheena Marie M. Munda', 'Sheena Marie', 'Martino', 'Munda', 'teacher_i', 'FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Phili-am I. Ocliasa (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_ocliasa_philiam', 'philiam.ocliasa@mati.edu.ph', 'Phili-am I. Ocliasa', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Phili-am I. Ocliasa', 'Phili-am', 'Isaga', 'Ocliasa', 'teacher_ii', 'INDUSTRIAL TECH.', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Melody H. Panopio (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_panopio_melody', 'melody.panopio@mati.edu.ph', 'Melody H. Panopio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Melody H. Panopio', 'Melody', 'Hapinat', 'Panopio', 'teacher_i', 'BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ana C. Peliña (MT-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_pelia_ana', 'ana.pelia@mati.edu.ph', 'Ana C. Peliña', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ana C. Peliña', 'Ana', 'Celoso', 'Peliña', 'master_teacher_ii', 'ENGLISH/ESP', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Baldomero B. Quilaton (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_quilaton_baldomero', 'baldomero.quilaton@mati.edu.ph', 'Baldomero B. Quilaton', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Baldomero B. Quilaton', 'Baldomero', 'Bayate', 'Quilaton', 'teacher_ii', 'MATH/TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aiza A.. Rabaño (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_rabao_aiza', 'aiza.rabao@mati.edu.ph', 'Aiza A.. Rabaño', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aiza A.. Rabaño', 'Aiza', 'Alisan', 'Rabaño', 'teacher_i', 'MAPEH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Modelo A. Seprado (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_seprado_modelo', 'modelo.seprado@mati.edu.ph', 'Modelo A. Seprado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Modelo A. Seprado', 'Modelo', 'Acero', 'Seprado', 'teacher_i', 'AP', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lea T. Reston (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_reston_lea', 'lea.reston@mati.edu.ph', 'Lea T. Reston', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lea T. Reston', 'Lea', 'Tinapay', 'Reston', 'teacher_i', 'FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Annabelle D. Serra (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_serra_annabelle', 'annabelle.serra@mati.edu.ph', 'Annabelle D. Serra', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Annabelle D. Serra', 'Annabelle', 'Debutiaco', 'Serra', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jhelfe Queen C. Sumambot (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_sumambot_jhelfequeen', 'jhelfequeen.sumambot@mati.edu.ph', 'Jhelfe Queen C. Sumambot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jhelfe Queen C. Sumambot', 'Jhelfe Queen', 'Carlom', 'Sumambot', 'teacher_i', 'SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Joirey B. Sumimba (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_sumimba_joirey', 'joirey.sumimba@mati.edu.ph', 'Joirey B. Sumimba', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Joirey B. Sumimba', 'Joirey', 'Bacalso', 'Sumimba', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elvira S. Tampos (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_tampos_elvira', 'elvira.tampos@mati.edu.ph', 'Elvira S. Tampos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elvira S. Tampos', 'Elvira', 'Silot', 'Tampos', 'master_teacher_i', 'AP', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Keren Anne M. Valera (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_valera_kerenanne', 'kerenanne.valera@mati.edu.ph', 'Keren Anne M. Valera', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Keren Anne M. Valera', 'Keren Anne', 'Mendoza', 'Valera', 'teacher_i', 'ENGLISH/FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Myrna S. Zamora (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_zamora_myrna', 'myrna.zamora@mati.edu.ph', 'Myrna S. Zamora', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Myrna S. Zamora', 'Myrna', 'Santos', 'Zamora', 'master_teacher_i', 'FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- ROSELLE E.. SOMOG-OY (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_somogoy_roselle', 'roselle.somogoy@mati.edu.ph', 'ROSELLE E.. SOMOG-OY', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'ROSELLE E.. SOMOG-OY', 'ROSELLE', 'ELGA', 'SOMOG-OY', 'teacher_i', 'FILIPINO', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- JOWEE ANNE A.. DAMAOLAO (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_damaolao_joweeanne', 'joweeanne.damaolao@mati.edu.ph', 'JOWEE ANNE A.. DAMAOLAO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'JOWEE ANNE A.. DAMAOLAO', 'JOWEE ANNE', '', 'DAMAOLAO', 'teacher_i', 'ENGLISH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- "Mario V. DIUYAN (Jr.") - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_diuyan_mario', 'mario.diuyan@mati.edu.ph', '"Mario V. DIUYAN', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '"Mario V. DIUYAN', '"Mario', 'Valderrama', 'DIUYAN', 'teacher_i', 'T-II', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Rhynz Aldrus . Bacus (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_bacus_rhynzaldrus', 'rhynzaldrus.bacus@mati.edu.ph', 'Rhynz Aldrus . Bacus', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Rhynz Aldrus . Bacus', 'Rhynz Aldrus', '', 'Bacus', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Scarlett O. Lugatiman (SST-III) - JHS*
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_lugatiman_scarlett', 'scarlett.lugatiman@mati.edu.ph', 'Scarlett O. Lugatiman', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Scarlett O. Lugatiman', 'Scarlett', 'Oñez', 'Lugatiman', 'teacher_i', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Christine Joy T. Mabandos (ST-I) - JHS*
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_mabandos_christinejoy', 'christinejoy.mabandos@mati.edu.ph', 'Christine Joy T. Mabandos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Christine Joy T. Mabandos', 'Christine Joy', 'Tag at', 'Mabandos', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Krystelle R. Bornales (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_bornales_krystelle', 'krystelle.bornales@mati.edu.ph', 'Krystelle R. Bornales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Krystelle R. Bornales', 'Krystelle', 'Romulo', 'Bornales', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ryan D. Calungsod (MT-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_calungsod_ryan', 'ryan.calungsod@mati.edu.ph', 'Ryan D. Calungsod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ryan D. Calungsod', 'Ryan', 'De Catalina', 'Calungsod', 'master_teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Hazel P. Desierto (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_desierto_hazel', 'hazel.desierto@mati.edu.ph', 'Hazel P. Desierto', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Hazel P. Desierto', 'Hazel', 'Piscos', 'Desierto', 'teacher_ii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dayanara M. Enriquez (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_enriquez_dayanara', 'dayanara.enriquez@mati.edu.ph', 'Dayanara M. Enriquez', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dayanara M. Enriquez', 'Dayanara', 'Marianito', 'Enriquez', 'teacher_i', 'BSBA-FM/ Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janetel Jill Y. Gayta (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_gayta_janeteljill', 'janeteljill.gayta@mati.edu.ph', 'Janetel Jill Y. Gayta', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janetel Jill Y. Gayta', 'Janetel Jill', 'Yara', 'Gayta', 'teacher_ii', 'Music', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Abella B. Gil (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_gil_abella', 'abella.gil@mati.edu.ph', 'Abella B. Gil', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Abella B. Gil', 'Abella', 'Bantilan', 'Gil', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Divine Grace C. Lanaban (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_lanaban_divinegrace', 'divinegrace.lanaban@mati.edu.ph', 'Divine Grace C. Lanaban', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Divine Grace C. Lanaban', 'Divine Grace', 'Camacho', 'Lanaban', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Quimberly B. Lanos (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_lanos_quimberly', 'quimberly.lanos@mati.edu.ph', 'Quimberly B. Lanos', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Quimberly B. Lanos', 'Quimberly', 'Bentayao', 'Lanos', 'teacher_ii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jimric M. Magandam (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_magandam_jimric', 'jimric.magandam@mati.edu.ph', 'Jimric M. Magandam', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jimric M. Magandam', 'Jimric', 'Mariano', 'Magandam', 'teacher_ii', 'AB Peace Educ./ Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Landelino B. Rufin Jr. (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_rufinjr_landelino', 'landelino.rufinjr.@mati.edu.ph', 'Landelino B. Rufin Jr.', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Landelino B. Rufin Jr.', 'Landelino', 'Bragas', 'Rufin Jr.', 'teacher_ii', 'BSIT/ Social Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Genevieve Ann G. Taraya (ST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_taraya_genevieveann', 'genevieveann.taraya@mati.edu.ph', 'Genevieve Ann G. Taraya', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Genevieve Ann G. Taraya', 'Genevieve Ann', 'Grecia', 'Taraya', 'teacher_ii', 'BS in Commerce/ Social Studies', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kathlene Anne B.. Mamac (ST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304327_mamac_kathleneanne', 'kathleneanne.mamac@mati.edu.ph', 'Kathlene Anne B.. Mamac', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kathlene Anne B.. Mamac', 'Kathlene Anne', 'Bustamante', 'Mamac', 'teacher_i', 'Bachelor of Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304327 not found';
  END IF;

  -- School: MAYO NHS (325106) - 21 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '325106' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Diana Rose L. Abella (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_abella_dianarose', 'dianarose.abella@mati.edu.ph', 'Diana Rose L. Abella', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Diana Rose L. Abella', 'Diana Rose', 'Llenado', 'Abella', 'teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Aledon D.. Amiang (SST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_amiang_aledon', 'aledon.amiang@mati.edu.ph', 'Aledon D.. Amiang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Aledon D.. Amiang', 'Aledon', 'Duallo', 'Amiang', 'teacher_i', 'BSED MATH', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Kiarra Marie N. Bagay (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_bagay_kiarramarie', 'kiarramarie.bagay@mati.edu.ph', 'Kiarra Marie N. Bagay', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Kiarra Marie N. Bagay', 'Kiarra Marie', 'Niez', 'Bagay', 'teacher_i', 'BSED PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Amanda C. Billona (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_billona_amanda', 'amanda.billona@mati.edu.ph', 'Amanda C. Billona', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Amanda C. Billona', 'Amanda', 'Carajay', 'Billona', 'teacher_i', 'BSED Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Nińa Joy H. Calungsod (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_calungsod_niajoy', 'niajoy.calungsod@mati.edu.ph', 'Nińa Joy H. Calungsod', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Nińa Joy H. Calungsod', 'Nińa Joy', 'Hugue', 'Calungsod', 'teacher_ii', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Chedelyn C. Guilabtan (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_guilabtan_chedelyn', 'chedelyn.guilabtan@mati.edu.ph', 'Chedelyn C. Guilabtan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Chedelyn C. Guilabtan', 'Chedelyn', 'Cabugnason', 'Guilabtan', 'teacher_i', 'BSED PE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cherylyn C. Maynagcot (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_maynagcot_cherylyn', 'cherylyn.maynagcot@mati.edu.ph', 'Cherylyn C. Maynagcot', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cherylyn C. Maynagcot', 'Cherylyn', 'Caballero', 'Maynagcot', 'teacher_iii', 'BSED Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sitti Ayessa M. Tiago (MT-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_tiago_sittiayessa', 'sittiayessa.tiago@mati.edu.ph', 'Sitti Ayessa M. Tiago', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sitti Ayessa M. Tiago', 'Sitti Ayessa', 'Gangis', 'Tiago', 'master_teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Benidecto M. Gatila (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_gatila_benidecto', 'benidecto.gatila@mati.edu.ph', 'Benidecto M. Gatila', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Benidecto M. Gatila', 'Benidecto', 'Monter', 'Gatila', 'teacher_i', 'BSED Mathematics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ofelyn A. Magbutong (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_magbutong_ofelyn', 'ofelyn.magbutong@mati.edu.ph', 'Ofelyn A. Magbutong', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ofelyn A. Magbutong', 'Ofelyn', 'Acpac', 'Magbutong', 'teacher_iii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Merian A. Mandabon (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_mandabon_merian', 'merian.mandabon@mati.edu.ph', 'Merian A. Mandabon', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Merian A. Mandabon', 'Merian', 'Andan', 'Mandabon', 'teacher_iii', 'BSED Social Studies/Araling Panlipunan', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sarah B. Mendoza (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_mendoza_sarah', 'sarah.mendoza@mati.edu.ph', 'Sarah B. Mendoza', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sarah B. Mendoza', 'Sarah', 'Bediña', 'Mendoza', 'teacher_i', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Sonie M. Pagcamaan (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_pagcamaan_sonie', 'sonie.pagcamaan@mati.edu.ph', 'Sonie M. Pagcamaan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sonie M. Pagcamaan', 'Sonie', 'Macagubang', 'Pagcamaan', 'teacher_ii', 'BSED SCIENCE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Modessa M. Moninio (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_moninio_modessa', 'modessa.moninio@mati.edu.ph', 'Modessa M. Moninio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Modessa M. Moninio', 'Modessa', 'Marcellones', 'Moninio', 'teacher_i', 'BSED Filipino', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Maria Noe-Mae Fe N. Yap (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_yap_marianoemaefe', 'marianoemaefe.yap@mati.edu.ph', 'Maria Noe-Mae Fe N. Yap', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Maria Noe-Mae Fe N. Yap', 'Maria Noe-Mae Fe', 'Noventa', 'Yap', 'teacher_i', 'Biological Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ansar D. Amiang (MT-1) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_amiang_ansar', 'ansar.amiang@mati.edu.ph', 'Ansar D. Amiang', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ansar D. Amiang', 'Ansar', 'Duallo', 'Amiang', 'teacher_i', 'BSED English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ma.Luisa A. Angsinco (SST-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_angsinco_maluisa', 'ma.luisa.angsinco@mati.edu.ph', 'Ma.Luisa A. Angsinco', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ma.Luisa A. Angsinco', 'Ma.Luisa', 'Ancog', 'Angsinco', 'teacher_ii', 'TLE', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- May One M. Malintad (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_malintad_mayone', 'mayone.malintad@mati.edu.ph', 'May One M. Malintad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'May One M. Malintad', 'May One', 'Masunag', 'Malintad', 'teacher_i', 'AB Anthropology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Abbie Hazel A. Suganan (SPECIAL SCIENCE T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_suganan_abbiehazel', 'abbiehazel.suganan@mati.edu.ph', 'Abbie Hazel A. Suganan', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Abbie Hazel A. Suganan', 'Abbie Hazel', 'Apolona', 'Suganan', 'teacher_i', 'Special Science Teacher', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- SHAINA JOY M. NUDALO (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_nudalo_shainajoy', 'shainajoy.nudalo@mati.edu.ph', 'SHAINA JOY M. NUDALO', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'SHAINA JOY M. NUDALO', 'SHAINA JOY', 'Martinez', 'NUDALO', 'teacher_i', 'Home Economics', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Daryll jane `. Cañas (SST-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_325106_caas_darylljane', 'darylljane.caas@mati.edu.ph', 'Daryll jane `. Cañas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Daryll jane `. Cañas', 'Daryll jane', '', 'Cañas', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 325106 not found';
  END IF;

  -- School: TAGUIBO AGRI. VOC. HS (304338) - 18 personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '304338' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Sheila Mae I. Amarille (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_amarille_sheilamae', 'sheilamae.amarille@mati.edu.ph', 'Sheila Mae I. Amarille', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Sheila Mae I. Amarille', 'Sheila Mae', 'Inting', 'Amarille', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Teodoro M. Destajo (ST-II) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_destajo_teodoro', 'teodoro.destajo@mati.edu.ph', 'Teodoro M. Destajo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Teodoro M. Destajo', 'Teodoro', 'Mangana', 'Destajo', 'teacher_ii', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Margie M. Destajo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_destajo_margie', 'margie.destajo@mati.edu.ph', 'Margie M. Destajo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Margie M. Destajo', 'Margie', 'Manuay', 'Destajo', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Cheryl M. Embalsado (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_embalsado_cheryl', 'cheryl.embalsado@mati.edu.ph', 'Cheryl M. Embalsado', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Cheryl M. Embalsado', 'Cheryl', 'Morales', 'Embalsado', 'teacher_i', 'Physical Education', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Anna Lyn A. Gloria (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_gloria_annalyn', 'annalyn.gloria@mati.edu.ph', 'Anna Lyn A. Gloria', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Anna Lyn A. Gloria', 'Anna Lyn', 'Aviles', 'Gloria', 'teacher_i', 'Crop Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wandy C. Golosino (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_golosino_wandy', 'wandy.golosino@mati.edu.ph', 'Wandy C. Golosino', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wandy C. Golosino', 'Wandy', 'Castillones', 'Golosino', 'teacher_iii', 'Biology', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Lunalyn C. Jabillo (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_jabillo_lunalyn', 'lunalyn.jabillo@mati.edu.ph', 'Lunalyn C. Jabillo', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Lunalyn C. Jabillo', 'Lunalyn', 'Capungas', 'Jabillo', 'teacher_i', 'Agriculture', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Naneth G. Ligad (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_ligad_naneth', 'naneth.ligad@mati.edu.ph', 'Naneth G. Ligad', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Naneth G. Ligad', 'Naneth', 'Gasta', 'Ligad', 'teacher_i', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jayson S. Maglente (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_maglente_jayson', 'jayson.maglente@mati.edu.ph', 'Jayson S. Maglente', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jayson S. Maglente', 'Jayson', 'Susada', 'Maglente', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Dean B. Morales (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_morales_dean', 'dean.morales@mati.edu.ph', 'Dean B. Morales', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Dean B. Morales', 'Dean', 'Besas', 'Morales', 'teacher_i', 'Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Jasmen D. Rosario (ST-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_rosario_jasmen', 'jasmen.rosario@mati.edu.ph', 'Jasmen D. Rosario', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Jasmen D. Rosario', 'Jasmen', 'De Loyola', 'Rosario', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Allan B. Silverio (ST-III) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_silverio_allan', 'allan.silverio@mati.edu.ph', 'Allan B. Silverio', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Allan B. Silverio', 'Allan', 'Besnar', 'Silverio', 'teacher_iii', 'English/Computer', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Ceslyne B.. Berdida (T-I) - JHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_berdida_ceslyne', 'ceslyne.berdida@mati.edu.ph', 'Ceslyne B.. Berdida', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Ceslyne B.. Berdida', 'Ceslyne', 'Bantugan', 'Berdida', 'teacher_i', 'Math', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Wency Mae Q. Algallar (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_algallar_wencymae', 'wencymae.algallar@mati.edu.ph', 'Wency Mae Q. Algallar', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Wency Mae Q. Algallar', 'Wency Mae', 'Quilaton', 'Algallar', 'teacher_ii', 'BIOLOGY', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Denise Kaye M. De Jesus (T-II) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_dejesus_denisekaye', 'denisekaye.dejesus@mati.edu.ph', 'Denise Kaye M. De Jesus', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Denise Kaye M. De Jesus', 'Denise Kaye', 'Mallari', 'De Jesus', 'teacher_ii', 'English', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Niño Jun M. Dimpas (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_dimpas_niojun', 'niojun.dimpas@mati.edu.ph', 'Niño Jun M. Dimpas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Niño Jun M. Dimpas', 'Niño Jun', 'Mamat', 'Dimpas', 'teacher_i', 'Crop Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Janelie L. Rojas (T-III) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_rojas_janelie', 'janelie.rojas@mati.edu.ph', 'Janelie L. Rojas', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Janelie L. Rojas', 'Janelie', 'Legaspi', 'Rojas', 'teacher_iii', 'Physical Science', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
    -- Elizabeth A. Felicilda (T-I) - SHS
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, 'mati_sec_304338_felicilda_elizabeth', 'elizabeth.felicilda@mati.edu.ph', 'Elizabeth A. Felicilda', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, 'Elizabeth A. Felicilda', 'Elizabeth', 'Agad', 'Felicilda', 'teacher_i', 'AFA', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();
  ELSE
    RAISE NOTICE 'School 304338 not found';
  END IF;

  RAISE NOTICE 'Secondary Personnel seeding complete!';
END $$;

-- Verify
SELECT 
  s.school_id_number,
  s.name,
  COUNT(t.id) as teachers
FROM schools s
LEFT JOIN teachers t ON t.school_id = s.id
WHERE s.division = 'Division of City of Mati'
  AND (s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' OR s.name ILIKE '%Integrated%')
GROUP BY s.id, s.school_id_number, s.name
ORDER BY s.school_id_number;
