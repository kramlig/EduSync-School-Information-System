-- ==========================================
-- SHS Track & Strand Support Migration
-- Migration Date: January 13, 2026
-- ==========================================
-- This migration adds Senior High School (SHS) track and strand support
-- Required for SF1-SHS, SF5A-SHS, SF5B-SHS, and SF9-SHS forms
-- ==========================================

-- ==========================================
-- STEP 1: Add Track & Strand Columns to Students
-- ==========================================

-- Add SHS track column
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS shs_track VARCHAR(50);

-- Add SHS strand column
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS shs_strand VARCHAR(50);

-- Add specialization for TVL strand
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS shs_specialization VARCHAR(100);

-- Add semester tracking (SHS uses semesters instead of quarters for some subjects)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1 CHECK (current_semester IN (1, 2));

-- Add SHS completion tracking
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS shs_completion_status VARCHAR(30); -- 'in_progress', 'completed', 'incomplete'

-- Add graduation date for SHS completers
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS graduation_date DATE;

-- ==========================================
-- STEP 2: Create Track/Strand Lookup Tables
-- ==========================================

-- SHS Tracks Reference Table
CREATE TABLE IF NOT EXISTS shs_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard DepEd tracks
INSERT INTO shs_tracks (code, name, description, sort_order) VALUES
    ('ACADEMIC', 'Academic Track', 'For students who intend to pursue higher education', 1),
    ('TVL', 'Technical-Vocational-Livelihood Track', 'For students who wish to develop skills for employment or entrepreneurship', 2),
    ('SPORTS', 'Sports Track', 'For students with athletic talents and skills', 3),
    ('ARTS', 'Arts and Design Track', 'For students with creative and artistic talents', 4)
ON CONFLICT (code) DO NOTHING;

-- SHS Strands Reference Table
CREATE TABLE IF NOT EXISTS shs_strands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_code VARCHAR(20) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (track_code) REFERENCES shs_tracks(code)
);

-- Insert standard DepEd strands
INSERT INTO shs_strands (track_code, code, name, description, sort_order) VALUES
    -- Academic Track Strands
    ('ACADEMIC', 'STEM', 'Science, Technology, Engineering, and Mathematics', 'For students interested in science, mathematics, and engineering fields', 1),
    ('ACADEMIC', 'ABM', 'Accountancy, Business, and Management', 'For students interested in business, finance, and entrepreneurship', 2),
    ('ACADEMIC', 'HUMSS', 'Humanities and Social Sciences', 'For students interested in liberal arts, education, and social sciences', 3),
    ('ACADEMIC', 'GAS', 'General Academic Strand', 'For students who are still undecided on their career path', 4),
    
    -- TVL Track Strands
    ('TVL', 'TVL-HE', 'Home Economics', 'Food and beverage, tourism, caregiving', 5),
    ('TVL', 'TVL-ICT', 'Information and Communications Technology', 'Computer programming, animation, web development', 6),
    ('TVL', 'TVL-IA', 'Industrial Arts', 'Automotive, electrical, electronics, welding', 7),
    ('TVL', 'TVL-AF', 'Agri-Fishery Arts', 'Agriculture, fishery, food processing', 8),
    
    -- Sports Track
    ('SPORTS', 'SPORTS', 'Sports', 'Various sports specializations', 9),
    
    -- Arts and Design Track
    ('ARTS', 'ARTS', 'Arts and Design', 'Various arts and design specializations', 10)
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- STEP 3: Add Indexes for Performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_students_shs_track ON students(shs_track);
CREATE INDEX IF NOT EXISTS idx_students_shs_strand ON students(shs_strand);
CREATE INDEX IF NOT EXISTS idx_students_shs_completion ON students(shs_completion_status);
CREATE INDEX IF NOT EXISTS idx_students_grade_track ON students(grade_level, shs_track);

-- ==========================================
-- STEP 4: Create SHS Semester Grades Table
-- ==========================================
-- SHS uses semester-based grading for some subjects

CREATE TABLE IF NOT EXISTS shs_semester_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    school_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    grade_level INTEGER NOT NULL CHECK (grade_level IN (11, 12)),
    
    -- Midterm and Final grades
    midterm_grade DECIMAL(5,2),
    final_grade DECIMAL(5,2),
    semester_grade DECIMAL(5,2), -- Computed: (midterm + final) / 2
    
    remarks VARCHAR(20), -- 'Passed', 'Failed', 'INC', 'DRP'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, learning_area_id, school_year, semester)
);

CREATE INDEX IF NOT EXISTS idx_shs_grades_school_id ON shs_semester_grades(school_id);
CREATE INDEX IF NOT EXISTS idx_shs_grades_student_id ON shs_semester_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_shs_grades_school_year ON shs_semester_grades(school_year);

-- Disable RLS (Firebase Auth)
ALTER TABLE shs_semester_grades DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 5: Create SHS Completion Requirements Table
-- ==========================================

CREATE TABLE IF NOT EXISTS shs_completion_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_year VARCHAR(20) NOT NULL,
    
    -- Core Subjects
    core_subjects_completed BOOLEAN DEFAULT false,
    core_subjects_units INTEGER DEFAULT 0,
    
    -- Applied/Specialized Subjects
    applied_subjects_completed BOOLEAN DEFAULT false,
    applied_subjects_units INTEGER DEFAULT 0,
    
    -- Immersion/Work Experience
    work_immersion_completed BOOLEAN DEFAULT false,
    work_immersion_hours INTEGER DEFAULT 0,
    work_immersion_company VARCHAR(255),
    work_immersion_supervisor VARCHAR(255),
    
    -- Research/Capstone
    research_completed BOOLEAN DEFAULT false,
    research_title TEXT,
    
    -- Overall Status
    all_requirements_met BOOLEAN DEFAULT false,
    eligible_for_graduation BOOLEAN DEFAULT false,
    graduation_date DATE,
    
    -- Remarks
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, school_year)
);

CREATE INDEX IF NOT EXISTS idx_shs_completion_school_id ON shs_completion_requirements(school_id);
CREATE INDEX IF NOT EXISTS idx_shs_completion_student_id ON shs_completion_requirements(student_id);
CREATE INDEX IF NOT EXISTS idx_shs_completion_eligible ON shs_completion_requirements(eligible_for_graduation);

-- Disable RLS (Firebase Auth)
ALTER TABLE shs_completion_requirements DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 6: Helper Functions
-- ==========================================

-- Function to check if a student is SHS (Grade 11-12)
CREATE OR REPLACE FUNCTION is_shs_student(p_grade_level INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_grade_level IN (11, 12);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate semester grade
CREATE OR REPLACE FUNCTION calculate_semester_grade(midterm DECIMAL, final_grade DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF midterm IS NULL OR final_grade IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN ROUND((midterm + final_grade) / 2, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate semester grade
CREATE OR REPLACE FUNCTION update_shs_semester_grade()
RETURNS TRIGGER AS $$
BEGIN
    NEW.semester_grade := calculate_semester_grade(NEW.midterm_grade, NEW.final_grade);
    
    -- Auto-set remarks based on grade
    IF NEW.semester_grade IS NOT NULL THEN
        IF NEW.semester_grade >= 75 THEN
            NEW.remarks := 'Passed';
        ELSE
            NEW.remarks := 'Failed';
        END IF;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER shs_semester_grade_trigger
    BEFORE INSERT OR UPDATE ON shs_semester_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_shs_semester_grade();

-- ==========================================
-- STEP 7: Views for Reporting
-- ==========================================

-- View: SHS Students with Track/Strand
CREATE OR REPLACE VIEW v_shs_students AS
SELECT 
    s.id,
    s.school_id,
    s.lrn,
    s.name,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.gender,
    s.grade_level,
    s.section_id,
    sec.name AS section_name,
    s.shs_track,
    t.name AS track_name,
    s.shs_strand,
    st.name AS strand_name,
    s.shs_specialization,
    s.current_semester,
    s.shs_completion_status,
    s.enrollment_status
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN shs_tracks t ON s.shs_track = t.code
LEFT JOIN shs_strands st ON s.shs_strand = st.code
WHERE s.grade_level IN (11, 12)
AND s.deleted_at IS NULL;

-- ==========================================
-- STEP 8: Comments
-- ==========================================

COMMENT ON COLUMN students.shs_track IS 'SHS Track: ACADEMIC, TVL, SPORTS, ARTS (Grades 11-12 only)';
COMMENT ON COLUMN students.shs_strand IS 'SHS Strand: STEM, ABM, HUMSS, GAS, TVL-HE, TVL-ICT, TVL-IA, TVL-AF, SPORTS, ARTS';
COMMENT ON COLUMN students.shs_specialization IS 'TVL specialization or sports/arts focus area';
COMMENT ON COLUMN students.current_semester IS 'Current semester (1 or 2) for SHS students';
COMMENT ON TABLE shs_tracks IS 'Reference table for SHS tracks per DepEd K-12 curriculum';
COMMENT ON TABLE shs_strands IS 'Reference table for SHS strands under each track';
COMMENT ON TABLE shs_semester_grades IS 'Semester-based grades for SHS subjects';
COMMENT ON TABLE shs_completion_requirements IS 'Tracks SHS graduation requirements completion';
