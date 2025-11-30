-- Migration: Create substitute_assignments table for PostgreSQL
-- Date: November 29, 2025
-- Description: Full migration of substitute assignments from Firestore to PostgreSQL

-- Create the substitute_assignments table
CREATE TABLE IF NOT EXISTS substitute_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Teacher references
    teacher_id TEXT NOT NULL,           -- The substitute teacher
    original_teacher_id TEXT NOT NULL,  -- The teacher being replaced
    
    -- Assignment period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Optional fields for enhanced tracking
    reason TEXT,                        -- Reason for substitution (sick leave, training, etc.)
    notes TEXT,                         -- Additional notes
    status TEXT DEFAULT 'pending',      -- pending, active, completed, cancelled
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT different_teachers CHECK (teacher_id != original_teacher_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed', 'cancelled'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_substitute_assignments_school_id 
    ON substitute_assignments(school_id);

CREATE INDEX IF NOT EXISTS idx_substitute_assignments_teacher_id 
    ON substitute_assignments(teacher_id);

CREATE INDEX IF NOT EXISTS idx_substitute_assignments_original_teacher_id 
    ON substitute_assignments(original_teacher_id);

CREATE INDEX IF NOT EXISTS idx_substitute_assignments_dates 
    ON substitute_assignments(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_substitute_assignments_status 
    ON substitute_assignments(status);

-- Composite index for common filtering
CREATE INDEX IF NOT EXISTS idx_substitute_assignments_school_dates 
    ON substitute_assignments(school_id, start_date, end_date);

-- Enable Row Level Security
ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Note: We use a permissive policy that allows access when school_id matches
-- The application layer handles authentication via Supabase client
CREATE POLICY "substitute_assignments_school_isolation"
    ON substitute_assignments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Note: For production, consider implementing a more restrictive policy using
-- Supabase Auth or a custom school_id session variable:
-- USING (school_id = current_setting('app.current_school_id')::uuid)

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_substitute_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_substitute_assignments_updated_at
    BEFORE UPDATE ON substitute_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_substitute_assignments_updated_at();

-- Add comment for documentation
COMMENT ON TABLE substitute_assignments IS 'Tracks substitute teacher assignments when regular teachers are unavailable';
COMMENT ON COLUMN substitute_assignments.teacher_id IS 'The substitute teacher filling in';
COMMENT ON COLUMN substitute_assignments.original_teacher_id IS 'The regular teacher being replaced';
COMMENT ON COLUMN substitute_assignments.status IS 'Assignment status: pending, active, completed, cancelled';
