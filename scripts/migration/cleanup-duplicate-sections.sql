-- Cleanup Duplicate Sections
-- Date: November 30, 2025
-- Description: Remove duplicate sections, keeping only the ones with proper capacity data

DO $$
DECLARE
    v_school_id UUID;
BEGIN
    -- Get the first school
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No schools found.';
    END IF;

    -- Delete duplicate sections, keeping the ones with capacity set
    -- Keep only the first record (by created_at) that has capacity and adviser
    DELETE FROM sections s
    WHERE s.id NOT IN (
        SELECT DISTINCT ON (school_id, grade_level, name, school_year)
            id
        FROM sections
        WHERE deleted_at IS NULL
          AND capacity IS NOT NULL
          AND adviser_id IS NOT NULL
        ORDER BY school_id, grade_level, name, school_year, created_at ASC
    )
    AND s.deleted_at IS NULL;

    RAISE NOTICE 'Cleanup completed for school_id: %', v_school_id;
END $$;

-- Verify the cleanup
SELECT 
    s.grade_level,
    s.name as section_name,
    s.capacity,
    s.room_number,
    t.name as adviser_name,
    COUNT(st.id) as student_count
FROM sections s
LEFT JOIN teachers t ON s.adviser_id = t.id
LEFT JOIN students st ON st.section_id = s.id AND st.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.grade_level, s.name, s.capacity, s.room_number, t.name
ORDER BY s.grade_level, s.name;
