-- Assign Students to Sections
-- Date: November 30, 2025
-- Description: Randomly distribute existing students across sections based on their grade level

DO $$
DECLARE
    v_school_id UUID;
    v_student RECORD;
    v_section_id UUID;
BEGIN
    -- Get the first school
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No schools found.';
    END IF;

    -- Loop through all students without a section
    FOR v_student IN 
        SELECT id, grade_level 
        FROM students 
        WHERE school_id = v_school_id 
          AND deleted_at IS NULL
          AND (section_id IS NULL OR section_id NOT IN (SELECT id FROM sections WHERE deleted_at IS NULL))
    LOOP
        -- Find a section for this student's grade level with available capacity
        SELECT s.id INTO v_section_id
        FROM sections s
        LEFT JOIN (
            SELECT section_id, COUNT(*) as student_count
            FROM students
            WHERE deleted_at IS NULL
            GROUP BY section_id
        ) sc ON s.id = sc.section_id
        WHERE s.school_id = v_school_id
          AND s.grade_level = v_student.grade_level
          AND s.deleted_at IS NULL
          AND s.school_year = '2024-2025'
          AND COALESCE(sc.student_count, 0) < s.capacity
        ORDER BY RANDOM()
        LIMIT 1;

        -- Assign student to section if one was found
        IF v_section_id IS NOT NULL THEN
            UPDATE students
            SET section_id = v_section_id
            WHERE id = v_student.id;
            
            RAISE NOTICE 'Assigned student % (Grade %) to section %', 
                v_student.id, v_student.grade_level, v_section_id;
        ELSE
            RAISE NOTICE 'No available section found for student % (Grade %)', 
                v_student.id, v_student.grade_level;
        END IF;
    END LOOP;

    RAISE NOTICE 'Student assignment completed';
END $$;

-- Verify the assignments
SELECT 
    s.grade_level,
    s.name as section_name,
    s.capacity,
    COUNT(st.id) as student_count,
    t.name as adviser_name
FROM sections s
LEFT JOIN teachers t ON s.adviser_id = t.id
LEFT JOIN students st ON st.section_id = s.id AND st.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.grade_level, s.name, s.capacity, t.name
ORDER BY s.grade_level, s.name;
