-- Seed Demo Data for Class Schedules
-- Date: November 30, 2025
-- Description: Create sample class schedules for testing the ScheduleView component

-- Prerequisites: Requires teachers, sections, and learning_areas tables to be populated
-- Run this AFTER running seed-teachers.sql and other basic seed scripts

DO $$
DECLARE
    v_school_id UUID;
    v_teachers UUID[];
    v_sections UUID[];
    v_learning_areas UUID[];
    v_teacher_count INT;
    v_section_count INT;
    v_la_count INT;
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
        LIMIT 10
    ) t;
    
    v_teacher_count := COALESCE(array_length(v_teachers, 1), 0);
    
    IF v_teacher_count < 3 THEN
        RAISE EXCEPTION 'Need at least 3 teachers. Found: %. Run seed-teachers.sql first', v_teacher_count;
    END IF;

    -- Get sections
    SELECT ARRAY_AGG(id) INTO v_sections
    FROM (
        SELECT id FROM sections 
        WHERE school_id = v_school_id 
          AND deleted_at IS NULL
        LIMIT 10
    ) s;
    
    v_section_count := COALESCE(array_length(v_sections, 1), 0);
    
    IF v_section_count < 2 THEN
        RAISE EXCEPTION 'Need at least 2 sections. Found: %. Create sections first', v_section_count;
    END IF;

    -- Get learning areas
    SELECT ARRAY_AGG(id) INTO v_learning_areas
    FROM (
        SELECT id FROM learning_areas 
        WHERE school_id = v_school_id 
          AND deleted_at IS NULL
        LIMIT 10
    ) la;
    
    v_la_count := COALESCE(array_length(v_learning_areas, 1), 0);
    
    IF v_la_count < 3 THEN
        RAISE EXCEPTION 'Need at least 3 learning areas. Found: %. Create learning areas first', v_la_count;
    END IF;

    RAISE NOTICE 'Found % teachers, % sections, % learning areas', v_teacher_count, v_section_count, v_la_count;

    -- ===== ACADEMIC SCHEDULES =====
    
    -- Section 1: Monday - Math
    IF v_section_count >= 1 AND v_teacher_count >= 1 AND v_la_count >= 1 THEN
        INSERT INTO class_schedules (
            school_id, section_id, learning_area_id, teacher_id,
            title, type, scope, day_of_week, start_time, end_time, room
        ) VALUES (
            v_school_id, v_sections[1], v_learning_areas[1], v_teachers[1],
            'Mathematics - Morning', 'academic', 'section', 
            'Monday', '08:00', '09:00', 'Room 101'
        );
    END IF;

    -- Section 1: Monday - Science
    IF v_section_count >= 1 AND v_teacher_count >= 2 AND v_la_count >= 2 THEN
        INSERT INTO class_schedules (
            school_id, section_id, learning_area_id, teacher_id,
            title, type, scope, day_of_week, start_time, end_time, room
        ) VALUES (
            v_school_id, v_sections[1], v_learning_areas[2], v_teachers[2],
            'Science - Mid Morning', 'academic', 'section', 
            'Monday', '09:00', '10:00', 'Room 101'
        );
    END IF;

    -- Section 1: Tuesday - English
    IF v_section_count >= 1 AND v_teacher_count >= 3 AND v_la_count >= 3 THEN
        INSERT INTO class_schedules (
            school_id, section_id, learning_area_id, teacher_id,
            title, type, scope, day_of_week, start_time, end_time, room
        ) VALUES (
            v_school_id, v_sections[1], v_learning_areas[3], v_teachers[3],
            'English - Tuesday Morning', 'academic', 'section', 
            'Tuesday', '08:00', '09:00', 'Room 101'
        );
    END IF;

    -- Section 2: Monday - Math (different teacher)
    IF v_section_count >= 2 AND v_teacher_count >= 2 AND v_la_count >= 1 THEN
        INSERT INTO class_schedules (
            school_id, section_id, learning_area_id, teacher_id,
            title, type, scope, day_of_week, start_time, end_time, room
        ) VALUES (
            v_school_id, v_sections[2], v_learning_areas[1], v_teachers[2],
            'Mathematics - Section 2', 'academic', 'section', 
            'Monday', '10:00', '11:00', 'Room 102'
        );
    END IF;

    -- Section 2: Wednesday - Science
    IF v_section_count >= 2 AND v_teacher_count >= 1 AND v_la_count >= 2 THEN
        INSERT INTO class_schedules (
            school_id, section_id, learning_area_id, teacher_id,
            title, type, scope, day_of_week, start_time, end_time, room
        ) VALUES (
            v_school_id, v_sections[2], v_learning_areas[2], v_teachers[1],
            'Science - Wednesday', 'academic', 'section', 
            'Wednesday', '08:00', '09:00', 'Room 102'
        );
    END IF;

    -- Thursday morning classes
    IF v_section_count >= 1 AND v_teacher_count >= 3 AND v_la_count >= 1 THEN
        INSERT INTO class_schedules (
            school_id, section_id, learning_area_id, teacher_id,
            title, type, scope, day_of_week, start_time, end_time, room
        ) VALUES (
            v_school_id, v_sections[1], v_learning_areas[1], v_teachers[3],
            'Mathematics Review', 'academic', 'section', 
            'Thursday', '08:00', '09:00', 'Room 101'
        );
    END IF;

    -- Friday classes
    IF v_section_count >= 2 AND v_teacher_count >= 2 AND v_la_count >= 3 THEN
        INSERT INTO class_schedules (
            school_id, section_id, learning_area_id, teacher_id,
            title, type, scope, day_of_week, start_time, end_time, room
        ) VALUES (
            v_school_id, v_sections[2], v_learning_areas[3], v_teachers[2],
            'English Literature', 'academic', 'section', 
            'Friday', '09:00', '10:00', 'Room 102'
        );
    END IF;

    -- ===== EXTRACURRICULAR ACTIVITIES =====
    
    -- School-wide assembly (all students)
    INSERT INTO class_schedules (
        school_id, title, type, scope, 
        day_of_week, start_time, end_time, room
    ) VALUES (
        v_school_id, 'Monday Flag Ceremony', 'extracurricular', 'all',
        'Monday', '07:00', '07:30', 'Quadrangle'
    );

    -- Grade-level activity (if we have grade_level data)
    INSERT INTO class_schedules (
        school_id, title, type, scope, grade_level,
        day_of_week, start_time, end_time, room
    ) VALUES (
        v_school_id, 'Grade 7 Sports Day', 'extracurricular', 'gradeLevel', 7,
        'Friday', '14:00', '16:00', 'Sports Field'
    );

    -- Another school-wide event
    INSERT INTO class_schedules (
        school_id, title, type, scope,
        day_of_week, start_time, end_time, room
    ) VALUES (
        v_school_id, 'Weekly Faculty Meeting', 'extracurricular', 'all',
        'Wednesday', '15:00', '16:00', 'Conference Room'
    );

    RAISE NOTICE 'Successfully inserted demo class schedules for school_id: %', v_school_id;
END $$;

-- Verify the data was inserted
SELECT 
    cs.id,
    cs.title,
    cs.type,
    cs.scope,
    cs.day_of_week,
    cs.start_time,
    cs.end_time,
    t.name as teacher_name,
    s.name as section_name,
    la.name as learning_area_name
FROM class_schedules cs
LEFT JOIN teachers t ON cs.teacher_id = t.id
LEFT JOIN sections s ON cs.section_id = s.id
LEFT JOIN learning_areas la ON cs.learning_area_id = la.id
WHERE cs.deleted_at IS NULL
ORDER BY cs.day_of_week, cs.start_time
LIMIT 20;
