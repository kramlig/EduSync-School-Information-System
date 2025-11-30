-- Migration: Create learning_areas table
-- Purpose: PostgreSQL migration for Learning Areas Management
-- Follows multi-tenant architecture with school_id isolation

-- Create learning_areas table
CREATE TABLE IF NOT EXISTS learning_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    
    -- Basic Information
    name TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    
    -- Organization & Display
    category TEXT NOT NULL DEFAULT 'core' CHECK (category IN ('core', 'specialized', 'elective', 'tle', 'sports')),
    grade_levels INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
    is_active BOOLEAN NOT NULL DEFAULT true,
    department TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- DepEd K-12 Curriculum Compliance
    k_to_twelve_code TEXT,
    semester_based BOOLEAN DEFAULT false,
    semester INTEGER CHECK (semester IN (1, 2)),
    track_required TEXT[], -- ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL']
    
    -- Composite Subjects (e.g., MAPEH)
    is_composite BOOLEAN DEFAULT false,
    components TEXT[],
    
    -- Advanced Features
    prerequisite_id UUID,
    description TEXT,
    hours_per_week INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_prerequisite FOREIGN KEY (prerequisite_id) REFERENCES learning_areas(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_areas_school_id ON learning_areas(school_id);
CREATE INDEX IF NOT EXISTS idx_learning_areas_category ON learning_areas(category);
CREATE INDEX IF NOT EXISTS idx_learning_areas_grade_levels ON learning_areas USING GIN(grade_levels);
CREATE INDEX IF NOT EXISTS idx_learning_areas_is_active ON learning_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_areas_display_order ON learning_areas(display_order);
CREATE INDEX IF NOT EXISTS idx_learning_areas_k12_code ON learning_areas(k_to_twelve_code);
CREATE INDEX IF NOT EXISTS idx_learning_areas_track_required ON learning_areas USING GIN(track_required);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_areas_updated_at
    BEFORE UPDATE ON learning_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_areas_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE learning_areas ENABLE ROW LEVEL SECURITY;

-- Permissive policy for development (replace with proper auth later)
CREATE POLICY learning_areas_policy ON learning_areas
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON learning_areas TO authenticated;
GRANT ALL ON learning_areas TO anon;

COMMENT ON TABLE learning_areas IS 'Multi-tenant learning areas/subjects table with DepEd K-12 curriculum compliance';
COMMENT ON COLUMN learning_areas.school_id IS 'Multi-tenant isolation - references schools(id)';
COMMENT ON COLUMN learning_areas.category IS 'Subject category: core, specialized, elective, tle, sports';
COMMENT ON COLUMN learning_areas.grade_levels IS 'Applicable grade levels (e.g., [7,8,9,10] for JHS)';
COMMENT ON COLUMN learning_areas.k_to_twelve_code IS 'Official DepEd K-12 curriculum code (e.g., FIL7, GENMATH)';
COMMENT ON COLUMN learning_areas.semester_based IS 'True for SHS subjects with semester system';
COMMENT ON COLUMN learning_areas.track_required IS 'SHS tracks requiring this subject (STEM, ABM, HUMSS, GAS, TVL)';
COMMENT ON COLUMN learning_areas.is_composite IS 'True for composite subjects like MAPEH (Music, Arts, PE, Health)';
COMMENT ON COLUMN learning_areas.components IS 'Sub-subjects for composite learning areas';
