-- Seed Demo Data for Substitute Assignments
-- Date: November 29, 2025
-- Description: Insert sample substitute assignments using ACTUAL teacher IDs from users table

-- First, clear existing demo data (optional)
-- DELETE FROM substitute_assignments;

-- Debug: Check what's in the users and schools tables
-- SELECT id, school_id, role, name FROM users WHERE role = 'teacher' LIMIT 5;
-- SELECT id, name FROM schools LIMIT 5;

-- Demo data using actual teacher IDs from TEACHERS table (not users table)
DO $$
DECLARE
    v_school_id UUID;
    v_teachers TEXT[];
    v_teacher_count INT;
BEGIN
    -- Get the first school_id from the schools table
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No schools found. Please create a school first.';
    END IF;

    -- Get actual teacher IDs from the TEACHERS table
    SELECT ARRAY_AGG(id::text) INTO v_teachers
    FROM (
        SELECT id FROM teachers 
        WHERE deleted_at IS NULL
        LIMIT 10
    ) t;
    
    v_teacher_count := COALESCE(array_length(v_teachers, 1), 0);
    
    RAISE NOTICE 'Found % teachers, using school_id %', v_teacher_count, v_school_id;
    
    IF v_teacher_count < 2 THEN
        RAISE EXCEPTION 'Need at least 2 teachers in TEACHERS table. Found: %. Run: SELECT id, name FROM teachers LIMIT 5;', v_teacher_count;
    END IF;

    RAISE NOTICE 'Found % teachers for school %', v_teacher_count, v_school_id;

    -- Insert demo substitute assignments using actual teacher IDs
    -- Active assignment (current date range)
    IF v_teacher_count >= 2 THEN
        INSERT INTO substitute_assignments (
            school_id, teacher_id, original_teacher_id, start_date, end_date, reason, notes, status
        ) VALUES (
            v_school_id,
            v_teachers[1],
            v_teachers[2],
            CURRENT_DATE - INTERVAL '2 days',
            CURRENT_DATE + INTERVAL '3 days',
            'sick_leave',
            'Covering for sick leave - flu recovery.',
            'pending'
        );
    END IF;
    
    -- Another active assignment
    IF v_teacher_count >= 4 THEN
        INSERT INTO substitute_assignments (
            school_id, teacher_id, original_teacher_id, start_date, end_date, reason, notes, status
        ) VALUES (
            v_school_id,
            v_teachers[3],
            v_teachers[4],
            CURRENT_DATE - INTERVAL '1 day',
            CURRENT_DATE + INTERVAL '5 days',
            'training',
            'Professional development workshop attendance.',
            'pending'
        );
    END IF;
    
    -- Scheduled (future) assignment
    IF v_teacher_count >= 6 THEN
        INSERT INTO substitute_assignments (
            school_id, teacher_id, original_teacher_id, start_date, end_date, reason, notes, status
        ) VALUES (
            v_school_id,
            v_teachers[5],
            v_teachers[6],
            CURRENT_DATE + INTERVAL '7 days',
            CURRENT_DATE + INTERVAL '14 days',
            'vacation',
            'Annual leave approved for holiday travel.',
            'pending'
        );
    END IF;
    
    -- Another scheduled assignment
    IF v_teacher_count >= 7 THEN
        INSERT INTO substitute_assignments (
            school_id, teacher_id, original_teacher_id, start_date, end_date, reason, notes, status
        ) VALUES (
            v_school_id,
            v_teachers[1],
            v_teachers[7],
            CURRENT_DATE + INTERVAL '10 days',
            CURRENT_DATE + INTERVAL '12 days',
            'personal',
            'Personal leave for family matters.',
            'pending'
        );
    END IF;
    
    -- Completed assignment (past)
    IF v_teacher_count >= 4 THEN
        INSERT INTO substitute_assignments (
            school_id, teacher_id, original_teacher_id, start_date, end_date, reason, notes, status
        ) VALUES (
            v_school_id,
            v_teachers[2],
            v_teachers[3],
            CURRENT_DATE - INTERVAL '14 days',
            CURRENT_DATE - INTERVAL '7 days',
            'sick_leave',
            'Successfully completed substitute assignment.',
            'completed'
        );
    END IF;
    
    -- Another completed assignment
    IF v_teacher_count >= 5 THEN
        INSERT INTO substitute_assignments (
            school_id, teacher_id, original_teacher_id, start_date, end_date, reason, notes, status
        ) VALUES (
            v_school_id,
            v_teachers[4],
            v_teachers[5],
            CURRENT_DATE - INTERVAL '21 days',
            CURRENT_DATE - INTERVAL '18 days',
            'emergency',
            'Emergency leave - substitute completed all classes.',
            'completed'
        );
    END IF;

    RAISE NOTICE 'Successfully inserted demo substitute assignments for school_id: %', v_school_id;
END $$;

-- Verify the data was inserted with teacher names
SELECT 
    sa.id,
    t1.name as substitute_teacher,
    t2.name as original_teacher,
    sa.start_date,
    sa.end_date,
    sa.reason,
    sa.status
FROM substitute_assignments sa
LEFT JOIN teachers t1 ON sa.teacher_id::uuid = t1.id
LEFT JOIN teachers t2 ON sa.original_teacher_id::uuid = t2.id
ORDER BY sa.created_at DESC
LIMIT 10;
