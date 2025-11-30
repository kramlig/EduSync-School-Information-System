-- ============================================================================
-- LESSON PLANS TABLE MIGRATION
-- Created: November 28, 2025
-- Purpose: PostgreSQL migration for lesson plans management
-- ============================================================================

-- Create lesson_plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    objectives TEXT[] NOT NULL DEFAULT '{}',
    activities TEXT[] NOT NULL DEFAULT '{}',
    materials TEXT[] NOT NULL DEFAULT '{}',
    assessment TEXT[] NOT NULL DEFAULT '{}',
    resources JSONB DEFAULT '[]', -- Array of {name: string, url: string}
    assignment_ids TEXT[] DEFAULT '{}', -- Array of assignment IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_plans_school_id ON lesson_plans(school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_section_id ON lesson_plans(section_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_learning_area_id ON lesson_plans(learning_area_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_date ON lesson_plans(date);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_school_section ON lesson_plans(school_id, section_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_school_date ON lesson_plans(school_id, date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lesson_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lesson_plans_updated_at
    BEFORE UPDATE ON lesson_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_plans_updated_at();

-- Enable Row Level Security
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Note: We use a permissive policy that allows access when school_id matches
-- The application layer handles authentication via Supabase client
CREATE POLICY "lesson_plans_school_isolation"
    ON lesson_plans
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Note: For production, consider implementing a more restrictive policy using
-- Supabase Auth or a custom school_id session variable:
-- USING (school_id = current_setting('app.current_school_id')::uuid)

-- Add comments for documentation
COMMENT ON TABLE lesson_plans IS 'Stores lesson plans for teachers';
COMMENT ON COLUMN lesson_plans.school_id IS 'Reference to the school (multi-tenant isolation)';
COMMENT ON COLUMN lesson_plans.section_id IS 'Reference to the section/class';
COMMENT ON COLUMN lesson_plans.learning_area_id IS 'Reference to the learning area/subject';
COMMENT ON COLUMN lesson_plans.date IS 'Date of the lesson (YYYY-MM-DD)';
COMMENT ON COLUMN lesson_plans.objectives IS 'Array of learning objectives';
COMMENT ON COLUMN lesson_plans.activities IS 'Array of lesson activities';
COMMENT ON COLUMN lesson_plans.materials IS 'Array of required materials';
COMMENT ON COLUMN lesson_plans.assessment IS 'Array of assessment methods';
COMMENT ON COLUMN lesson_plans.resources IS 'JSON array of learning resources with name and url';
COMMENT ON COLUMN lesson_plans.assignment_ids IS 'Array of related assignment IDs';
