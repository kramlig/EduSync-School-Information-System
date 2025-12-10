-- ============================================================================
-- Electronic Class Record (ECR) Tables Migration
-- Version: 1.0.0
-- Date: December 10, 2025
-- 
-- This migration creates the database structure for the Electronic Class Record
-- system following DepEd Order No. 8, s. 2015 grading guidelines.
--
-- Components:
-- - Written Work (WW): 30% default weight
-- - Performance Task (PT): 50% default weight  
-- - Quarterly Assessment (QA): 20% default weight
--
-- Run in Supabase SQL Editor
-- ============================================================================

-- ============================================
-- ECR: Component Weights Configuration
-- Allows schools to customize weights per subject/grade level
-- ============================================
CREATE TABLE IF NOT EXISTS ecr_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    learning_area_id UUID REFERENCES learning_areas(id) ON DELETE CASCADE,
    
    -- Grade level range (NULL means applies to all)
    grade_level_min INTEGER CHECK (grade_level_min >= 0 AND grade_level_min <= 12),
    grade_level_max INTEGER CHECK (grade_level_max >= 0 AND grade_level_max <= 12),
    
    -- Component weights (must sum to 100)
    ww_weight NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    pt_weight NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    qa_weight NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure weights sum to 100
    CONSTRAINT ecr_weights_sum CHECK (ww_weight + pt_weight + qa_weight = 100.00),
    
    -- One weight config per school/subject/grade combination
    UNIQUE NULLS NOT DISTINCT (school_id, learning_area_id, grade_level_min, grade_level_max)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ecr_weights_school ON ecr_weights(school_id);
CREATE INDEX IF NOT EXISTS idx_ecr_weights_learning_area ON ecr_weights(learning_area_id);

-- ============================================
-- ECR: Assessment Activities
-- Tracks individual WW, PT, QA activities per class
-- ============================================
CREATE TABLE IF NOT EXISTS ecr_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    
    -- Academic period
    school_year VARCHAR(10) NOT NULL,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    
    -- Activity details
    activity_type VARCHAR(2) NOT NULL CHECK (activity_type IN ('WW', 'PT', 'QA')),
    activity_number INTEGER NOT NULL CHECK (activity_number > 0),
    activity_name VARCHAR(255),
    description TEXT,
    
    -- Scoring
    max_score NUMERIC(6,2) NOT NULL CHECK (max_score > 0),
    
    -- Schedule
    activity_date DATE,
    due_date DATE,
    
    -- Status
    is_published BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false, -- Prevents further edits
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- One activity per type/number per class/quarter
    UNIQUE NULLS NOT DISTINCT (section_id, learning_area_id, school_year, quarter, activity_type, activity_number, deleted_at)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ecr_activities_school ON ecr_activities(school_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_teacher ON ecr_activities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_section ON ecr_activities(section_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_learning_area ON ecr_activities(learning_area_id);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_quarter ON ecr_activities(school_year, quarter);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_type ON ecr_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_ecr_activities_deleted ON ecr_activities(deleted_at);

-- ============================================
-- ECR: Student Activity Scores
-- Individual student scores per activity
-- ============================================
CREATE TABLE IF NOT EXISTS ecr_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES ecr_activities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Score (NULL if not yet graded or excused)
    raw_score NUMERIC(6,2) CHECK (raw_score IS NULL OR raw_score >= 0),
    
    -- Status/Remarks
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'graded', 'absent', 'excused', 'incomplete')),
    remarks TEXT,
    
    -- Grading metadata
    graded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One score per student per activity
    UNIQUE(activity_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ecr_scores_activity ON ecr_scores(activity_id);
CREATE INDEX IF NOT EXISTS idx_ecr_scores_student ON ecr_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_ecr_scores_status ON ecr_scores(status);

-- ============================================
-- ECR: Computed Component Grades (Cached)
-- Stores computed WW, PT, QA totals per student per quarter
-- Auto-updated via trigger when scores change
-- ============================================
CREATE TABLE IF NOT EXISTS ecr_component_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    school_year VARCHAR(10) NOT NULL,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    
    -- Raw totals (before weighting)
    ww_total_score NUMERIC(8,2) DEFAULT 0,
    ww_max_score NUMERIC(8,2) DEFAULT 0,
    ww_percentage NUMERIC(5,2) DEFAULT 0,
    ww_transmuted NUMERIC(5,2) DEFAULT 0,
    
    pt_total_score NUMERIC(8,2) DEFAULT 0,
    pt_max_score NUMERIC(8,2) DEFAULT 0,
    pt_percentage NUMERIC(5,2) DEFAULT 0,
    pt_transmuted NUMERIC(5,2) DEFAULT 0,
    
    qa_total_score NUMERIC(8,2) DEFAULT 0,
    qa_max_score NUMERIC(8,2) DEFAULT 0,
    qa_percentage NUMERIC(5,2) DEFAULT 0,
    qa_transmuted NUMERIC(5,2) DEFAULT 0,
    
    -- Weighted scores (after applying weight percentage)
    ww_weighted NUMERIC(5,2) DEFAULT 0,
    pt_weighted NUMERIC(5,2) DEFAULT 0,
    qa_weighted NUMERIC(5,2) DEFAULT 0,
    
    -- Final quarterly grade (sum of weighted scores)
    quarterly_grade NUMERIC(5,2) DEFAULT 0,
    
    -- Metadata
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, learning_area_id, school_year, quarter)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_school ON ecr_component_grades(school_id);
CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_student ON ecr_component_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_section ON ecr_component_grades(section_id);
CREATE INDEX IF NOT EXISTS idx_ecr_component_grades_quarter ON ecr_component_grades(school_year, quarter);

-- ============================================
-- FUNCTION: Get ECR Weights for a Subject/Grade
-- Returns the applicable weights (school-specific or defaults)
-- ============================================
CREATE OR REPLACE FUNCTION get_ecr_weights(
    p_school_id UUID,
    p_learning_area_id UUID,
    p_grade_level INTEGER
)
RETURNS TABLE (
    ww_weight NUMERIC,
    pt_weight NUMERIC,
    qa_weight NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Try to find school-specific weights for this subject and grade
    RETURN QUERY
    SELECT ew.ww_weight, ew.pt_weight, ew.qa_weight
    FROM ecr_weights ew
    WHERE ew.school_id = p_school_id
      AND (ew.learning_area_id = p_learning_area_id OR ew.learning_area_id IS NULL)
      AND (ew.grade_level_min IS NULL OR ew.grade_level_min <= p_grade_level)
      AND (ew.grade_level_max IS NULL OR ew.grade_level_max >= p_grade_level)
    ORDER BY 
        -- Prefer subject-specific over general
        CASE WHEN ew.learning_area_id IS NOT NULL THEN 0 ELSE 1 END,
        -- Prefer grade-specific over general
        CASE WHEN ew.grade_level_min IS NOT NULL THEN 0 ELSE 1 END
    LIMIT 1;
    
    -- If no custom weights found, return DepEd defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT 30.00::NUMERIC, 50.00::NUMERIC, 20.00::NUMERIC;
    END IF;
END;
$$;

-- ============================================
-- FUNCTION: Transmute Percentage to Grade
-- Converts percentage (0-100) to transmuted grade (60-100)
-- Based on DepEd Order No. 8, s. 2015
-- ============================================
CREATE OR REPLACE FUNCTION transmute_grade(
    p_percentage NUMERIC,
    p_grade_level INTEGER DEFAULT 7
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_transmuted NUMERIC;
BEGIN
    -- Handle edge cases
    IF p_percentage IS NULL OR p_percentage < 0 THEN
        RETURN 60;
    END IF;
    
    IF p_percentage > 100 THEN
        RETURN 100;
    END IF;
    
    -- DepEd transmutation: minimum grade is 60
    -- Grades 4-12 use linear mapping for simplicity
    -- Actual DepEd uses specific tables, but this approximation is commonly used
    IF p_percentage >= 100 THEN
        v_transmuted := 100;
    ELSIF p_percentage >= 0 THEN
        -- Linear interpolation: 0% = 60, 100% = 100
        v_transmuted := 60 + (p_percentage * 0.4);
    ELSE
        v_transmuted := 60;
    END IF;
    
    RETURN ROUND(v_transmuted, 2);
END;
$$;

-- ============================================
-- FUNCTION: Compute ECR Component Grades
-- Calculates all component grades for a student in a quarter
-- ============================================
CREATE OR REPLACE FUNCTION compute_ecr_grades(
    p_student_id UUID,
    p_section_id UUID,
    p_learning_area_id UUID,
    p_school_year VARCHAR,
    p_quarter VARCHAR
)
RETURNS TABLE (
    ww_weighted NUMERIC,
    pt_weighted NUMERIC,
    qa_weighted NUMERIC,
    quarterly_grade NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_school_id UUID;
    v_grade_level INTEGER;
    v_ww_weight NUMERIC;
    v_pt_weight NUMERIC;
    v_qa_weight NUMERIC;
    v_ww_total NUMERIC := 0;
    v_ww_max NUMERIC := 0;
    v_pt_total NUMERIC := 0;
    v_pt_max NUMERIC := 0;
    v_qa_total NUMERIC := 0;
    v_qa_max NUMERIC := 0;
    v_ww_pct NUMERIC;
    v_pt_pct NUMERIC;
    v_qa_pct NUMERIC;
    v_ww_trans NUMERIC;
    v_pt_trans NUMERIC;
    v_qa_trans NUMERIC;
    v_ww_wtd NUMERIC;
    v_pt_wtd NUMERIC;
    v_qa_wtd NUMERIC;
    v_final NUMERIC;
BEGIN
    -- Get school_id and grade_level
    SELECT sec.school_id, sec.grade_level 
    INTO v_school_id, v_grade_level
    FROM sections sec
    WHERE sec.id = p_section_id;
    
    -- Get applicable weights
    SELECT ew.ww_weight, ew.pt_weight, ew.qa_weight
    INTO v_ww_weight, v_pt_weight, v_qa_weight
    FROM get_ecr_weights(v_school_id, p_learning_area_id, v_grade_level) ew;
    
    -- Calculate WW totals
    SELECT COALESCE(SUM(s.raw_score), 0), COALESCE(SUM(a.max_score), 0)
    INTO v_ww_total, v_ww_max
    FROM ecr_activities a
    JOIN ecr_scores s ON s.activity_id = a.id AND s.student_id = p_student_id
    WHERE a.section_id = p_section_id
      AND a.learning_area_id = p_learning_area_id
      AND a.school_year = p_school_year
      AND a.quarter = p_quarter
      AND a.activity_type = 'WW'
      AND a.deleted_at IS NULL
      AND s.status = 'graded';
    
    -- Calculate PT totals
    SELECT COALESCE(SUM(s.raw_score), 0), COALESCE(SUM(a.max_score), 0)
    INTO v_pt_total, v_pt_max
    FROM ecr_activities a
    JOIN ecr_scores s ON s.activity_id = a.id AND s.student_id = p_student_id
    WHERE a.section_id = p_section_id
      AND a.learning_area_id = p_learning_area_id
      AND a.school_year = p_school_year
      AND a.quarter = p_quarter
      AND a.activity_type = 'PT'
      AND a.deleted_at IS NULL
      AND s.status = 'graded';
    
    -- Calculate QA totals
    SELECT COALESCE(SUM(s.raw_score), 0), COALESCE(SUM(a.max_score), 0)
    INTO v_qa_total, v_qa_max
    FROM ecr_activities a
    JOIN ecr_scores s ON s.activity_id = a.id AND s.student_id = p_student_id
    WHERE a.section_id = p_section_id
      AND a.learning_area_id = p_learning_area_id
      AND a.school_year = p_school_year
      AND a.quarter = p_quarter
      AND a.activity_type = 'QA'
      AND a.deleted_at IS NULL
      AND s.status = 'graded';
    
    -- Calculate percentages
    v_ww_pct := CASE WHEN v_ww_max > 0 THEN (v_ww_total / v_ww_max) * 100 ELSE 0 END;
    v_pt_pct := CASE WHEN v_pt_max > 0 THEN (v_pt_total / v_pt_max) * 100 ELSE 0 END;
    v_qa_pct := CASE WHEN v_qa_max > 0 THEN (v_qa_total / v_qa_max) * 100 ELSE 0 END;
    
    -- Transmute to 60-100 scale
    v_ww_trans := transmute_grade(v_ww_pct, v_grade_level);
    v_pt_trans := transmute_grade(v_pt_pct, v_grade_level);
    v_qa_trans := transmute_grade(v_qa_pct, v_grade_level);
    
    -- Apply weights
    v_ww_wtd := ROUND((v_ww_trans * v_ww_weight / 100), 2);
    v_pt_wtd := ROUND((v_pt_trans * v_pt_weight / 100), 2);
    v_qa_wtd := ROUND((v_qa_trans * v_qa_weight / 100), 2);
    
    -- Calculate final quarterly grade
    v_final := ROUND(v_ww_wtd + v_pt_wtd + v_qa_wtd, 0);
    
    -- Upsert component grades cache
    INSERT INTO ecr_component_grades (
        school_id, student_id, section_id, learning_area_id, school_year, quarter,
        ww_total_score, ww_max_score, ww_percentage, ww_transmuted,
        pt_total_score, pt_max_score, pt_percentage, pt_transmuted,
        qa_total_score, qa_max_score, qa_percentage, qa_transmuted,
        ww_weighted, pt_weighted, qa_weighted, quarterly_grade,
        last_computed_at, updated_at
    )
    VALUES (
        v_school_id, p_student_id, p_section_id, p_learning_area_id, p_school_year, p_quarter,
        v_ww_total, v_ww_max, v_ww_pct, v_ww_trans,
        v_pt_total, v_pt_max, v_pt_pct, v_pt_trans,
        v_qa_total, v_qa_max, v_qa_pct, v_qa_trans,
        v_ww_wtd, v_pt_wtd, v_qa_wtd, v_final,
        NOW(), NOW()
    )
    ON CONFLICT (student_id, learning_area_id, school_year, quarter)
    DO UPDATE SET
        ww_total_score = EXCLUDED.ww_total_score,
        ww_max_score = EXCLUDED.ww_max_score,
        ww_percentage = EXCLUDED.ww_percentage,
        ww_transmuted = EXCLUDED.ww_transmuted,
        pt_total_score = EXCLUDED.pt_total_score,
        pt_max_score = EXCLUDED.pt_max_score,
        pt_percentage = EXCLUDED.pt_percentage,
        pt_transmuted = EXCLUDED.pt_transmuted,
        qa_total_score = EXCLUDED.qa_total_score,
        qa_max_score = EXCLUDED.qa_max_score,
        qa_percentage = EXCLUDED.qa_percentage,
        qa_transmuted = EXCLUDED.qa_transmuted,
        ww_weighted = EXCLUDED.ww_weighted,
        pt_weighted = EXCLUDED.pt_weighted,
        qa_weighted = EXCLUDED.qa_weighted,
        quarterly_grade = EXCLUDED.quarterly_grade,
        last_computed_at = NOW(),
        updated_at = NOW();
    
    RETURN QUERY SELECT v_ww_wtd, v_pt_wtd, v_qa_wtd, v_final;
END;
$$;

-- ============================================
-- FUNCTION: Sync ECR to Grades Table
-- Updates the main grades table with computed quarterly grades
-- ============================================
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
    END IF;
END;
$$;

-- ============================================
-- TRIGGER: Auto-compute grades when scores change
-- ============================================
CREATE OR REPLACE FUNCTION trigger_compute_ecr_on_score_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_activity RECORD;
BEGIN
    -- Get activity details
    SELECT a.*, s.id as student_id
    INTO v_activity
    FROM ecr_activities a
    CROSS JOIN (SELECT COALESCE(NEW.student_id, OLD.student_id) as id) s
    WHERE a.id = COALESCE(NEW.activity_id, OLD.activity_id);
    
    IF v_activity IS NOT NULL THEN
        -- Recompute grades
        PERFORM compute_ecr_grades(
            COALESCE(NEW.student_id, OLD.student_id),
            v_activity.section_id,
            v_activity.learning_area_id,
            v_activity.school_year,
            v_activity.quarter
        );
        
        -- Sync to main grades table
        PERFORM sync_ecr_to_grades(
            COALESCE(NEW.student_id, OLD.student_id),
            v_activity.learning_area_id,
            v_activity.school_year,
            v_activity.quarter
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_compute_ecr_on_score ON ecr_scores;
CREATE TRIGGER trg_compute_ecr_on_score
    AFTER INSERT OR UPDATE OR DELETE ON ecr_scores
    FOR EACH ROW
    EXECUTE FUNCTION trigger_compute_ecr_on_score_change();

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE ecr_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecr_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecr_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecr_component_grades ENABLE ROW LEVEL SECURITY;

-- ECR Weights: School admins can manage, teachers can view
CREATE POLICY "School admins can manage weights" ON ecr_weights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.firebase_uid = auth.uid()::text 
            AND t.school_id = ecr_weights.school_id 
            AND t.role IN ('admin', 'principal')
        )
    );

CREATE POLICY "Teachers can view weights" ON ecr_weights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.firebase_uid = auth.uid()::text 
            AND t.school_id = ecr_weights.school_id
        )
    );

-- ECR Activities: Teachers can manage their own, view section-assigned
CREATE POLICY "Teachers can manage own activities" ON ecr_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.firebase_uid = auth.uid()::text 
            AND (t.id = ecr_activities.teacher_id OR t.role IN ('admin', 'principal'))
            AND t.school_id = ecr_activities.school_id
        )
    );

-- ECR Scores: Teachers can manage scores for their activities
CREATE POLICY "Teachers can manage scores" ON ecr_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ecr_activities a
            JOIN teachers t ON t.firebase_uid = auth.uid()::text
            WHERE a.id = ecr_scores.activity_id
            AND (a.teacher_id = t.id OR t.role IN ('admin', 'principal'))
            AND t.school_id = a.school_id
        )
    );

-- Component Grades: Teachers can view for their sections
CREATE POLICY "Teachers can view component grades" ON ecr_component_grades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.firebase_uid = auth.uid()::text 
            AND t.school_id = ecr_component_grades.school_id
        )
    );

-- ============================================
-- Grant Permissions
-- ============================================
GRANT ALL ON ecr_weights TO authenticated;
GRANT ALL ON ecr_activities TO authenticated;
GRANT ALL ON ecr_scores TO authenticated;
GRANT ALL ON ecr_component_grades TO authenticated;

GRANT EXECUTE ON FUNCTION get_ecr_weights TO authenticated;
GRANT EXECUTE ON FUNCTION transmute_grade TO authenticated;
GRANT EXECUTE ON FUNCTION compute_ecr_grades TO authenticated;
GRANT EXECUTE ON FUNCTION sync_ecr_to_grades TO authenticated;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE ecr_weights IS 'Component weight configuration per school/subject/grade level. DepEd default: WW=30%, PT=50%, QA=20%';
COMMENT ON TABLE ecr_activities IS 'Individual assessment activities (quizzes, projects, exams) for class record tracking';
COMMENT ON TABLE ecr_scores IS 'Student scores for each activity';
COMMENT ON TABLE ecr_component_grades IS 'Cached computed grades per student/subject/quarter for performance';

COMMENT ON FUNCTION get_ecr_weights IS 'Returns applicable component weights for a school/subject/grade combination';
COMMENT ON FUNCTION transmute_grade IS 'Converts percentage (0-100) to DepEd transmuted grade (60-100)';
COMMENT ON FUNCTION compute_ecr_grades IS 'Computes all component grades and quarterly grade for a student';
COMMENT ON FUNCTION sync_ecr_to_grades IS 'Syncs computed ECR quarterly grade to the main grades table';
