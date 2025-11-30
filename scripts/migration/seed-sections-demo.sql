-- Seed Demo Sections for Testing
-- Date: November 30, 2025
-- Description: Create sample sections for all grade levels

-- Prerequisites: Requires teachers table to be populated
-- Run this AFTER running seed-teachers.sql

DO $$
DECLARE
    v_school_id UUID;
    v_teachers UUID[];
    v_teacher_count INT;
    v_current_teacher_idx INT := 0;
BEGIN
    -- Get the first school
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No schools found. Please create a school first.';
    END IF;

    -- Get teachers
    SELECT ARRAY_AGG(id) INTO v_teachers
    FROM (
        SELECT id FROM teachers 
        WHERE school_id = v_school_id 
          AND deleted_at IS NULL
        LIMIT 50
    ) t;
    
    v_teacher_count := COALESCE(array_length(v_teachers, 1), 0);
    
    IF v_teacher_count < 6 THEN
        RAISE EXCEPTION 'Need at least 6 teachers. Found: %. Run seed-teachers.sql first', v_teacher_count;
    END IF;

    RAISE NOTICE 'Found % teachers for section assignment', v_teacher_count;

    -- Clear existing demo sections (optional - uncomment if needed)
    -- DELETE FROM sections WHERE school_id = v_school_id;

    -- ===== ELEMENTARY (GRADES 1-6) =====
    
    -- Grade 1
    INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
    VALUES 
        (v_school_id, 'St. Peter', 1, v_teachers[1], 'Room 101', 35, '2024-2025'),
        (v_school_id, 'St. Paul', 1, v_teachers[2], 'Room 102', 35, '2024-2025');

    -- Grade 2
    INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
    VALUES 
        (v_school_id, 'St. James', 2, v_teachers[3], 'Room 201', 35, '2024-2025'),
        (v_school_id, 'St. John', 2, v_teachers[4], 'Room 202', 35, '2024-2025');

    -- Grade 3
    INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
    VALUES 
        (v_school_id, 'Sampaguita', 3, v_teachers[5], 'Room 301', 40, '2024-2025'),
        (v_school_id, 'Rosal', 3, v_teachers[6], 'Room 302', 40, '2024-2025');

    -- Grade 4
    IF v_teacher_count >= 8 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'Gumamela', 4, v_teachers[7], 'Room 401', 40, '2024-2025'),
            (v_school_id, 'Santan', 4, v_teachers[8], 'Room 402', 40, '2024-2025');
    END IF;

    -- Grade 5
    IF v_teacher_count >= 10 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'Orchid', 5, v_teachers[9], 'Room 501', 40, '2024-2025'),
            (v_school_id, 'Jasmine', 5, v_teachers[10], 'Room 502', 40, '2024-2025');
    END IF;

    -- Grade 6
    IF v_teacher_count >= 12 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'Acacia', 6, v_teachers[11], 'Room 601', 45, '2024-2025'),
            (v_school_id, 'Narra', 6, v_teachers[12], 'Room 602', 45, '2024-2025');
    END IF;

    -- ===== JUNIOR HIGH SCHOOL (GRADES 7-10) =====
    
    -- Grade 7
    IF v_teacher_count >= 15 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'Rizal', 7, v_teachers[13], 'Room 701', 45, '2024-2025'),
            (v_school_id, 'Bonifacio', 7, v_teachers[14], 'Room 702', 45, '2024-2025'),
            (v_school_id, 'Luna', 7, v_teachers[15], 'Room 703', 45, '2024-2025');
    END IF;

    -- Grade 8
    IF v_teacher_count >= 18 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'Mabini', 8, v_teachers[16], 'Room 801', 45, '2024-2025'),
            (v_school_id, 'Del Pilar', 8, v_teachers[17], 'Room 802', 45, '2024-2025'),
            (v_school_id, 'Aguinaldo', 8, v_teachers[18], 'Room 803', 45, '2024-2025');
    END IF;

    -- Grade 9
    IF v_teacher_count >= 21 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'Einstein', 9, v_teachers[19], 'Room 901', 45, '2024-2025'),
            (v_school_id, 'Newton', 9, v_teachers[20], 'Room 902', 45, '2024-2025'),
            (v_school_id, 'Darwin', 9, v_teachers[21], 'Room 903', 45, '2024-2025');
    END IF;

    -- Grade 10
    IF v_teacher_count >= 24 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'Tesla', 10, v_teachers[22], 'Room 1001', 45, '2024-2025'),
            (v_school_id, 'Curie', 10, v_teachers[23], 'Room 1002', 45, '2024-2025'),
            (v_school_id, 'Edison', 10, v_teachers[24], 'Room 1003', 45, '2024-2025');
    END IF;

    -- ===== SENIOR HIGH SCHOOL (GRADES 11-12) =====
    
    -- Grade 11 STEM
    IF v_teacher_count >= 26 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'STEM 11-A', 11, v_teachers[25], 'STEM Lab 1', 35, '2024-2025'),
            (v_school_id, 'STEM 11-B', 11, v_teachers[26], 'STEM Lab 2', 35, '2024-2025');
    END IF;

    -- Grade 11 HUMSS
    IF v_teacher_count >= 28 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'HUMSS 11-A', 11, v_teachers[27], 'Room 1101', 35, '2024-2025'),
            (v_school_id, 'HUMSS 11-B', 11, v_teachers[28], 'Room 1102', 35, '2024-2025');
    END IF;

    -- Grade 11 ABM
    IF v_teacher_count >= 29 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'ABM 11-A', 11, v_teachers[29], 'Room 1103', 35, '2024-2025');
    END IF;

    -- Grade 12 STEM
    IF v_teacher_count >= 31 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'STEM 12-A', 12, v_teachers[30], 'STEM Lab 3', 35, '2024-2025'),
            (v_school_id, 'STEM 12-B', 12, v_teachers[31], 'STEM Lab 4', 35, '2024-2025');
    END IF;

    -- Grade 12 HUMSS
    IF v_teacher_count >= 33 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'HUMSS 12-A', 12, v_teachers[32], 'Room 1201', 35, '2024-2025'),
            (v_school_id, 'HUMSS 12-B', 12, v_teachers[33], 'Room 1202', 35, '2024-2025');
    END IF;

    -- Grade 12 ABM
    IF v_teacher_count >= 34 THEN
        INSERT INTO sections (school_id, name, grade_level, adviser_id, room_number, capacity, school_year)
        VALUES 
            (v_school_id, 'ABM 12-A', 12, v_teachers[34], 'Room 1203', 35, '2024-2025');
    END IF;

    RAISE NOTICE 'Successfully inserted demo sections for school_id: %', v_school_id;
END $$;

-- Verify the data was inserted
SELECT 
    s.id,
    s.name,
    s.grade_level,
    s.room_number,
    s.capacity,
    t.name as adviser_name,
    COUNT(st.id) as student_count
FROM sections s
LEFT JOIN teachers t ON s.adviser_id = t.id
LEFT JOIN students st ON st.section_id = s.id AND st.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.name, s.grade_level, s.room_number, s.capacity, t.name
ORDER BY s.grade_level, s.name
LIMIT 50;
