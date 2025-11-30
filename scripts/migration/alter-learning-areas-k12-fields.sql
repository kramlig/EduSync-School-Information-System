-- Migration: Add K-12 Curriculum Compliance Fields to learning_areas
-- Purpose: Enhance existing learning_areas table with DepEd K-12 metadata
-- Date: November 29, 2025

-- Add new columns for K-12 compliance
ALTER TABLE learning_areas
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'core' CHECK (category IN ('core', 'specialized', 'elective', 'tle', 'sports')),
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS k_to_twelve_code TEXT,
  ADD COLUMN IF NOT EXISTS semester_based BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS semester INTEGER CHECK (semester IN (1, 2)),
  ADD COLUMN IF NOT EXISTS track_required TEXT[],
  ADD COLUMN IF NOT EXISTS prerequisite_id UUID,
  ADD COLUMN IF NOT EXISTS hours_per_week INTEGER;

-- Add foreign key constraint for prerequisite
ALTER TABLE learning_areas
  ADD CONSTRAINT fk_prerequisite FOREIGN KEY (prerequisite_id) 
  REFERENCES learning_areas(id) ON DELETE SET NULL;

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_learning_areas_category ON learning_areas(category);
CREATE INDEX IF NOT EXISTS idx_learning_areas_k12_code ON learning_areas(k_to_twelve_code);
CREATE INDEX IF NOT EXISTS idx_learning_areas_track_required ON learning_areas USING GIN(track_required);
CREATE INDEX IF NOT EXISTS idx_learning_areas_display_order ON learning_areas(display_order);

-- Update trigger for updated_at (if not already exists)
CREATE OR REPLACE FUNCTION update_learning_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_learning_areas_updated_at ON learning_areas;
CREATE TRIGGER trigger_update_learning_areas_updated_at
    BEFORE UPDATE ON learning_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_areas_updated_at();

-- Add comments for new columns
COMMENT ON COLUMN learning_areas.credits IS 'Number of credits/units for the subject';
COMMENT ON COLUMN learning_areas.category IS 'Subject category: core, specialized, elective, tle, sports';
COMMENT ON COLUMN learning_areas.department IS 'Academic department (Language, STEM, Humanities, etc.)';
COMMENT ON COLUMN learning_areas.k_to_twelve_code IS 'Official DepEd K-12 curriculum code (e.g., FIL7, GENMATH)';
COMMENT ON COLUMN learning_areas.semester_based IS 'True for SHS subjects with semester system';
COMMENT ON COLUMN learning_areas.semester IS 'Which semester (1 or 2) for SHS subjects';
COMMENT ON COLUMN learning_areas.track_required IS 'SHS tracks requiring this subject (STEM, ABM, HUMSS, GAS, TVL)';
COMMENT ON COLUMN learning_areas.prerequisite_id IS 'Required prerequisite subject';
COMMENT ON COLUMN learning_areas.hours_per_week IS 'Contact hours per week for scheduling';
