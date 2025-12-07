-- SF7 Personnel Assignment Tables Migration
-- Created: December 7, 2025
-- Purpose: Track teaching assignments and ancillary responsibilities for personnel

-- =====================================================
-- Table: teaching_assignments
-- Purpose: Track teacher subject assignments, teaching load, and advisory roles
-- =====================================================

CREATE TABLE IF NOT EXISTS teaching_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    school_year TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    section_name TEXT,
    subject TEXT NOT NULL,
    hours_per_week NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (hours_per_week >= 0),
    is_advisory BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: ancillary_responsibilities
-- Purpose: Track additional duties and responsibilities beyond teaching
-- =====================================================

CREATE TABLE IF NOT EXISTS ancillary_responsibilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    school_year TEXT NOT NULL,
    responsibility TEXT NOT NULL,
    description TEXT,
    hours_per_week NUMERIC(4,1) CHECK (hours_per_week >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- teaching_assignments indexes
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_teacher_id 
    ON teaching_assignments(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teaching_assignments_school_id 
    ON teaching_assignments(school_id);

CREATE INDEX IF NOT EXISTS idx_teaching_assignments_school_year 
    ON teaching_assignments(school_year);

CREATE INDEX IF NOT EXISTS idx_teaching_assignments_section_id 
    ON teaching_assignments(section_id);

CREATE INDEX IF NOT EXISTS idx_teaching_assignments_grade_level 
    ON teaching_assignments(grade_level);

CREATE INDEX IF NOT EXISTS idx_teaching_assignments_is_advisory 
    ON teaching_assignments(is_advisory) WHERE is_advisory = true;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_school_year_teacher 
    ON teaching_assignments(school_id, school_year, teacher_id);

-- Unique constraint: Only one advisory assignment per teacher per grade level per school year
CREATE UNIQUE INDEX IF NOT EXISTS idx_teaching_assignments_unique_advisory 
    ON teaching_assignments(teacher_id, school_year, grade_level, section_id) 
    WHERE is_advisory = true;

-- ancillary_responsibilities indexes
CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_teacher_id 
    ON ancillary_responsibilities(teacher_id);

CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_school_id 
    ON ancillary_responsibilities(school_id);

CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_school_year 
    ON ancillary_responsibilities(school_year);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_ancillary_responsibilities_school_year_teacher 
    ON ancillary_responsibilities(school_id, school_year, teacher_id);

-- =====================================================
-- Triggers for Auto-updating Timestamps
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to teaching_assignments
DROP TRIGGER IF EXISTS update_teaching_assignments_updated_at ON teaching_assignments;
CREATE TRIGGER update_teaching_assignments_updated_at
    BEFORE UPDATE ON teaching_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to ancillary_responsibilities
DROP TRIGGER IF EXISTS update_ancillary_responsibilities_updated_at ON ancillary_responsibilities;
CREATE TRIGGER update_ancillary_responsibilities_updated_at
    BEFORE UPDATE ON ancillary_responsibilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE teaching_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ancillary_responsibilities ENABLE ROW LEVEL SECURITY;

-- teaching_assignments policies
CREATE POLICY "Users can view teaching assignments from their school"
    ON teaching_assignments FOR SELECT
    USING (school_id::text = current_setting('app.current_school_id', true));

CREATE POLICY "Admins and principals can insert teaching assignments"
    ON teaching_assignments FOR INSERT
    WITH CHECK (school_id::text = current_setting('app.current_school_id', true));

CREATE POLICY "Admins and principals can update teaching assignments"
    ON teaching_assignments FOR UPDATE
    USING (school_id::text = current_setting('app.current_school_id', true));

CREATE POLICY "Admins and principals can delete teaching assignments"
    ON teaching_assignments FOR DELETE
    USING (school_id::text = current_setting('app.current_school_id', true));

-- ancillary_responsibilities policies
CREATE POLICY "Users can view ancillary responsibilities from their school"
    ON ancillary_responsibilities FOR SELECT
    USING (school_id::text = current_setting('app.current_school_id', true));

CREATE POLICY "Admins and principals can insert ancillary responsibilities"
    ON ancillary_responsibilities FOR INSERT
    WITH CHECK (school_id::text = current_setting('app.current_school_id', true));

CREATE POLICY "Admins and principals can update ancillary responsibilities"
    ON ancillary_responsibilities FOR UPDATE
    USING (school_id::text = current_setting('app.current_school_id', true));

CREATE POLICY "Admins and principals can delete ancillary responsibilities"
    ON ancillary_responsibilities FOR DELETE
    USING (school_id::text = current_setting('app.current_school_id', true));

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE teaching_assignments IS 'SF7: Tracks teaching assignments including subjects, grade levels, hours per week, and advisory roles';
COMMENT ON TABLE ancillary_responsibilities IS 'SF7: Tracks additional responsibilities beyond teaching assignments (coordinators, committee members, etc.)';

COMMENT ON COLUMN teaching_assignments.is_advisory IS 'Indicates if this teacher is the class adviser for this section';
COMMENT ON COLUMN teaching_assignments.hours_per_week IS 'Number of teaching hours per week for this assignment';
COMMENT ON COLUMN ancillary_responsibilities.responsibility IS 'Type of responsibility (e.g., "Literacy Coordinator", "Subject Area Coordinator")';
COMMENT ON COLUMN ancillary_responsibilities.hours_per_week IS 'Estimated hours per week for this responsibility (optional)';
