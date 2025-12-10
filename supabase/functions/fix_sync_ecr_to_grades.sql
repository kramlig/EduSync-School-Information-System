-- ============================================================================
-- FIX: sync_ecr_to_grades - Properly map learning_area_id to school-specific one
-- 
-- ISSUE: The original function used the learning_area_id directly without 
-- verifying it belongs to the target school. This caused the division 
-- proficiency report to miss grades because the JOIN required:
--   learning_areas.school_id = grades.school_id
--
-- FIX: Look up the correct school-specific learning_area by matching the 
-- subject code, ensuring the grade is inserted with a learning_area that 
-- belongs to the same school.
--
-- Run this in Supabase SQL Editor to update the function
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_ecr_to_grades(
    p_student_id UUID,
    p_learning_area_id UUID,
    p_school_year VARCHAR,
    p_quarter VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_quarterly_grade NUMERIC;
    v_school_id UUID;
    v_correct_learning_area_id UUID;
    v_la_code VARCHAR;
BEGIN
    -- Get the computed grade and school_id from ECR component grades
    SELECT quarterly_grade, school_id
    INTO v_quarterly_grade, v_school_id
    FROM ecr_component_grades
    WHERE student_id = p_student_id
      AND learning_area_id = p_learning_area_id
      AND school_year = p_school_year
      AND quarter = p_quarter;
    
    IF v_quarterly_grade IS NOT NULL AND v_quarterly_grade > 0 AND v_school_id IS NOT NULL THEN
        -- First, check if the passed learning_area_id already belongs to this school
        SELECT id INTO v_correct_learning_area_id
        FROM learning_areas
        WHERE id = p_learning_area_id
          AND school_id = v_school_id
          AND deleted_at IS NULL;
        
        -- If not found, look up by code
        IF v_correct_learning_area_id IS NULL THEN
            -- Get the code from the original learning area
            SELECT code INTO v_la_code
            FROM learning_areas
            WHERE id = p_learning_area_id;
            
            -- Find the matching learning area for the target school
            IF v_la_code IS NOT NULL THEN
                SELECT id INTO v_correct_learning_area_id
                FROM learning_areas
                WHERE code = v_la_code
                  AND school_id = v_school_id
                  AND deleted_at IS NULL
                LIMIT 1;
            END IF;
        END IF;
        
        -- If we still don't have a valid learning_area_id, use the original
        -- (this maintains backward compatibility)
        IF v_correct_learning_area_id IS NULL THEN
            v_correct_learning_area_id := p_learning_area_id;
        END IF;
        
        -- Insert or update the grades table with the correct learning_area_id
        INSERT INTO grades (school_id, student_id, learning_area_id, school_year)
        VALUES (v_school_id, p_student_id, v_correct_learning_area_id, p_school_year)
        ON CONFLICT (student_id, learning_area_id, school_year)
        DO NOTHING;
        
        -- Update the specific quarter column
        EXECUTE format(
            'UPDATE grades SET %I = $1, updated_at = NOW() 
             WHERE student_id = $2 AND learning_area_id = $3 AND school_year = $4',
            LOWER(p_quarter)
        ) USING v_quarterly_grade, p_student_id, v_correct_learning_area_id, p_school_year;
        
        -- Log for debugging (optional - can be removed in production)
        RAISE NOTICE 'Synced grade: student=%, la=%, school=%, quarter=%, grade=%', 
                     p_student_id, v_correct_learning_area_id, v_school_id, p_quarter, v_quarterly_grade;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_ecr_to_grades(UUID, UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_ecr_to_grades(UUID, UUID, VARCHAR, VARCHAR) TO service_role;

COMMENT ON FUNCTION sync_ecr_to_grades IS 'Syncs ECR computed quarterly grades to the main grades table, properly mapping learning_area_id to school-specific records';
