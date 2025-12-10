-- ============================================================================
-- ECR Weight Presets for TLE/Skills-Based Subjects
-- Version: 1.1.0
-- Date: December 11, 2025
-- 
-- This migration sets up the proper weight configuration for TLE subjects
-- following DepEd Order No. 8, s. 2015 and K-12 Curriculum:
--
-- TLE Grading by Grade Level:
-- - Grade 7-8 (Exploratory TLE): WW 20%, PT 60%, QA 20% (has quarterly exam)
-- - Grade 9-10 (Specialized TLE): WW 30%, PT 70%, QA 0% (skills-based, no exam)
-- - Grade 11-12 (TVL Track SHS): WW 30%, PT 70%, QA 0% (TESDA competency-based)
--
-- Run in Supabase SQL Editor after 20241210_create_ecr_tables.sql
-- ============================================================================

-- ============================================
-- Step 1: Add subject_group column to learning_areas
-- This categorizes subjects for automatic weight assignment
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_areas' AND column_name = 'subject_group'
    ) THEN
        ALTER TABLE learning_areas ADD COLUMN subject_group VARCHAR(30);
    END IF;
END $$;

-- Add constraint for valid subject groups
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'learning_areas_subject_group_check'
    ) THEN
        ALTER TABLE learning_areas ADD CONSTRAINT learning_areas_subject_group_check 
            CHECK (subject_group IN (
                'core_academic',         -- Math, Science, English, Filipino, AP, ESP (30/50/20)
                'mapeh',                 -- Music, Arts, PE, Health (20/60/20)
                'epp_tle_exploratory',   -- Grade 7-8 Exploratory TLE (20/60/20) - has QA
                'tle_specialized',       -- Grade 9-10 Specialized TLE (30/70/0) - no QA
                'tvl_shs'                -- Grade 11-12 TVL Track (30/70/0) - no QA, TESDA-aligned
            ));
    END IF;
END $$;

-- ============================================
-- Step 2: Update existing TLE subjects based on grade level
-- ============================================

-- Grade 9-10 Specialized TLE (Skills-based, no QA)
UPDATE learning_areas 
SET subject_group = 'tle_specialized'
WHERE (
    LOWER(name) LIKE '%tle%'
    OR LOWER(name) LIKE '%technology%livelihood%'
    OR LOWER(name) LIKE '%icf%'
    OR LOWER(name) LIKE '%ictf%'
    OR LOWER(name) LIKE '%cookery%'
    OR LOWER(name) LIKE '%dressmaking%'
    OR LOWER(name) LIKE '%electrical%'
    OR LOWER(name) LIKE '%electronics%'
    OR LOWER(name) LIKE '%automotive%'
    OR LOWER(name) LIKE '%carpentry%'
    OR LOWER(name) LIKE '%welding%'
    OR LOWER(name) LIKE '%masonry%'
    OR LOWER(name) LIKE '%plumbing%'
    OR LOWER(name) LIKE '%beauty%care%'
    OR LOWER(name) LIKE '%hairdressing%'
    OR LOWER(name) LIKE '%housekeeping%'
    OR LOWER(name) LIKE '%front%office%'
    OR LOWER(name) LIKE '%food%beverage%'
    OR LOWER(name) LIKE '%bread%pastry%'
    OR LOWER(name) LIKE '%shielded%metal%'
    OR LOWER(name) LIKE '%computer%system%servicing%'
    OR LOWER(name) LIKE '%css%'
)
AND subject_group IS NULL
-- Check if assigned to Grade 9-10 sections
AND EXISTS (
    SELECT 1 FROM sections s 
    WHERE s.id IN (
        SELECT DISTINCT section_id FROM students WHERE deleted_at IS NULL
    )
    AND s.grade_level IN (9, 10)
);

-- Grade 11-12 TVL Track (SHS, TESDA-aligned, no QA)
UPDATE learning_areas 
SET subject_group = 'tvl_shs'
WHERE (
    LOWER(name) LIKE '%tle%'
    OR LOWER(name) LIKE '%technology%livelihood%'
    OR LOWER(name) LIKE '%cookery%'
    OR LOWER(name) LIKE '%dressmaking%'
    OR LOWER(name) LIKE '%electrical%'
    OR LOWER(name) LIKE '%electronics%'
    OR LOWER(name) LIKE '%automotive%'
    OR LOWER(name) LIKE '%carpentry%'
    OR LOWER(name) LIKE '%welding%'
    OR LOWER(name) LIKE '%masonry%'
    OR LOWER(name) LIKE '%plumbing%'
    OR LOWER(name) LIKE '%beauty%care%'
    OR LOWER(name) LIKE '%hairdressing%'
    OR LOWER(name) LIKE '%housekeeping%'
    OR LOWER(name) LIKE '%front%office%'
    OR LOWER(name) LIKE '%food%beverage%'
    OR LOWER(name) LIKE '%bread%pastry%'
    OR LOWER(name) LIKE '%shielded%metal%'
    OR LOWER(name) LIKE '%computer%system%servicing%'
    OR LOWER(name) LIKE '%css%'
    OR LOWER(name) LIKE '%nc ii%'
    OR LOWER(name) LIKE '%nc i%'
)
AND subject_group IS NULL
-- Check if assigned to Grade 11-12 sections
AND EXISTS (
    SELECT 1 FROM sections s 
    WHERE s.id IN (
        SELECT DISTINCT section_id FROM students WHERE deleted_at IS NULL
    )
    AND s.grade_level IN (11, 12)
);

-- Grade 7-8 Exploratory TLE (Has quarterly assessment)
UPDATE learning_areas 
SET subject_group = 'epp_tle_exploratory'
WHERE (
    LOWER(name) LIKE '%tle%'
    OR LOWER(name) LIKE '%technology%livelihood%'
    OR LOWER(name) LIKE '%epp%'
    OR LOWER(name) LIKE '%edukasyong pantahanan%'
)
AND subject_group IS NULL;

-- Update MAPEH subjects
UPDATE learning_areas 
SET subject_group = 'mapeh'
WHERE (
    LOWER(name) LIKE '%mapeh%'
    OR LOWER(name) LIKE '%music%'
    OR LOWER(name) LIKE '%arts%'
    OR LOWER(name) LIKE '%physical education%'
    OR LOWER(name) LIKE '%health%'
    OR LOWER(name) = 'pe'
)
AND subject_group IS NULL;

-- Update EPP subjects (elementary - Grade 4-6)
UPDATE learning_areas 
SET subject_group = 'epp_tle_exploratory'
WHERE (
    LOWER(name) LIKE '%epp%'
    OR LOWER(name) LIKE '%edukasyong pantahanan%'
)
AND subject_group IS NULL;

-- Update core academic subjects
UPDATE learning_areas 
SET subject_group = 'core_academic'
WHERE (
    LOWER(name) LIKE '%math%'
    OR LOWER(name) LIKE '%science%'
    OR LOWER(name) LIKE '%english%'
    OR LOWER(name) LIKE '%filipino%'
    OR LOWER(name) LIKE '%araling panlipunan%'
    OR LOWER(name) LIKE '%ap%'
    OR LOWER(name) LIKE '%esp%'
    OR LOWER(name) LIKE '%edukasyon sa pagpapakatao%'
    OR LOWER(name) LIKE '%mother tongue%'
    OR LOWER(name) LIKE '%mtb%'
)
AND subject_group IS NULL;

-- ============================================
-- Step 3: Create weight presets for each school
-- ============================================

-- Grade 9-10 Specialized TLE weights (No quarterly exam)
INSERT INTO ecr_weights (school_id, learning_area_id, ww_weight, pt_weight, qa_weight)
SELECT DISTINCT 
    la.school_id,
    la.id,
    30.00,  -- WW
    70.00,  -- PT
    0.00    -- QA (No quarterly exam - skills-based)
FROM learning_areas la
WHERE la.subject_group = 'tle_specialized'
  AND la.school_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ecr_weights ew 
      WHERE ew.school_id = la.school_id 
        AND ew.learning_area_id = la.id
  );

-- Grade 11-12 TVL Track weights (No quarterly exam - TESDA competency-based)
INSERT INTO ecr_weights (school_id, learning_area_id, ww_weight, pt_weight, qa_weight)
SELECT DISTINCT 
    la.school_id,
    la.id,
    30.00,  -- WW
    70.00,  -- PT
    0.00    -- QA (No quarterly exam - TESDA competency-based)
FROM learning_areas la
WHERE la.subject_group = 'tvl_shs'
  AND la.school_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ecr_weights ew 
      WHERE ew.school_id = la.school_id 
        AND ew.learning_area_id = la.id
  );

-- Grade 7-8 Exploratory TLE / EPP weights (Has quarterly exam)
INSERT INTO ecr_weights (school_id, learning_area_id, ww_weight, pt_weight, qa_weight)
SELECT DISTINCT 
    la.school_id,
    la.id,
    20.00,  -- WW
    60.00,  -- PT
    20.00   -- QA (Has quarterly exam)
FROM learning_areas la
WHERE la.subject_group = 'epp_tle_exploratory'
  AND la.school_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ecr_weights ew 
      WHERE ew.school_id = la.school_id 
        AND ew.learning_area_id = la.id
  );

-- MAPEH weights for all schools
INSERT INTO ecr_weights (school_id, learning_area_id, ww_weight, pt_weight, qa_weight)
SELECT DISTINCT 
    la.school_id,
    la.id,
    20.00,  -- WW
    60.00,  -- PT
    20.00   -- QA
FROM learning_areas la
WHERE la.subject_group = 'mapeh'
  AND la.school_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ecr_weights ew 
      WHERE ew.school_id = la.school_id 
        AND ew.learning_area_id = la.id
  );

-- ============================================
-- Step 4: Create a function to auto-assign weights for new subjects
-- ============================================
CREATE OR REPLACE FUNCTION auto_assign_ecr_weights()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_ww NUMERIC := 30.00;
    v_pt NUMERIC := 50.00;
    v_qa NUMERIC := 20.00;
BEGIN
    -- Determine weights based on subject group
    IF NEW.subject_group IN ('tle_specialized', 'tvl_shs') THEN
        -- Grade 9-12 TLE: Skills-based, no quarterly exam
        v_ww := 30.00;
        v_pt := 70.00;
        v_qa := 0.00;
    ELSIF NEW.subject_group IN ('mapeh', 'epp_tle_exploratory') THEN
        -- MAPEH and Grade 7-8 TLE: Has quarterly exam
        v_ww := 20.00;
        v_pt := 60.00;
        v_qa := 20.00;
    ELSE
        -- Core academic defaults
        v_ww := 30.00;
        v_pt := 50.00;
        v_qa := 20.00;
    END IF;
    
    -- Only insert if school_id is present and weights don't exist
    IF NEW.school_id IS NOT NULL THEN
        INSERT INTO ecr_weights (school_id, learning_area_id, ww_weight, pt_weight, qa_weight)
        VALUES (NEW.school_id, NEW.id, v_ww, v_pt, v_qa)
        ON CONFLICT (school_id, learning_area_id, grade_level_min, grade_level_max) 
        DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new learning areas
DROP TRIGGER IF EXISTS trg_auto_assign_ecr_weights ON learning_areas;
CREATE TRIGGER trg_auto_assign_ecr_weights
    AFTER INSERT ON learning_areas
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_ecr_weights();

-- ============================================
-- Summary of Weight Configurations by Grade Level
-- ============================================
-- 
-- Subject Group          | Grade  | WW    | PT    | QA    | Notes
-- ---------------------- | ------ | ----- | ----- | ----- | --------------------------
-- Core Academic          | All    | 30%   | 50%   | 20%   | Math, Science, English, etc.
-- MAPEH                  | All    | 20%   | 60%   | 20%   | Music, Arts, PE, Health
-- EPP/TLE Exploratory    | 4-8    | 20%   | 60%   | 20%   | Has quarterly exam
-- TLE Specialized        | 9-10   | 30%   | 70%   | 0%    | Skills-based, no exam
-- TVL Track (SHS)        | 11-12  | 30%   | 70%   | 0%    | TESDA NC competency-based
-- 
-- Key Insight: Grade 9-12 TLE subjects are skills-based and have NO quarterly exam
-- Assessment is through performance tasks (actual outputs, demonstrations, products)
-- 
-- The UI will automatically hide the QA section when qa_weight = 0
-- ============================================

-- Log the results
DO $$
DECLARE
    v_tle_specialized_count INTEGER;
    v_tvl_shs_count INTEGER;
    v_epp_tle_count INTEGER;
    v_mapeh_count INTEGER;
    v_total_weights INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tle_specialized_count FROM learning_areas WHERE subject_group = 'tle_specialized';
    SELECT COUNT(*) INTO v_tvl_shs_count FROM learning_areas WHERE subject_group = 'tvl_shs';
    SELECT COUNT(*) INTO v_epp_tle_count FROM learning_areas WHERE subject_group = 'epp_tle_exploratory';
    SELECT COUNT(*) INTO v_mapeh_count FROM learning_areas WHERE subject_group = 'mapeh';
    SELECT COUNT(*) INTO v_total_weights FROM ecr_weights;
    
    RAISE NOTICE 'ECR Weight Presets Migration Complete:';
    RAISE NOTICE '  - Grade 9-10 TLE Specialized (no QA): %', v_tle_specialized_count;
    RAISE NOTICE '  - Grade 11-12 TVL SHS (no QA): %', v_tvl_shs_count;
    RAISE NOTICE '  - EPP/TLE Exploratory (has QA): %', v_epp_tle_count;
    RAISE NOTICE '  - MAPEH subjects: %', v_mapeh_count;
    RAISE NOTICE '  - Total weight configurations: %', v_total_weights;
END $$;
