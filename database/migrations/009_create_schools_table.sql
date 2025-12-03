-- ============================================================================
-- Migration 009: Create Schools Table (Required for Enrollment)
-- Description: Multi-tenant schools table for enrollment school selection
-- Created: December 2, 2025
-- ============================================================================

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    school_code TEXT UNIQUE, -- Optional unique code like "SCH-001"
    
    -- Address Information
    address TEXT,
    barangay TEXT,
    city TEXT,
    province TEXT,
    region TEXT,
    zip_code TEXT,
    
    -- Contact Information
    contact_email TEXT,
    contact_phone TEXT,
    principal_name TEXT,
    
    -- School Details
    school_type TEXT CHECK (school_type IN ('elementary', 'high_school', 'senior_high', 'integrated')),
    is_active BOOLEAN DEFAULT true,
    
    -- Settings (JSONB for flexibility)
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schools_active ON schools(is_active);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(school_name);
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(school_code) WHERE school_code IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view active schools (for enrollment)
CREATE POLICY schools_public_view ON schools
    FOR SELECT
    USING (is_active = true);

-- RLS Policy: Only superadmins can modify schools
-- (We'll add proper user roles later)
CREATE POLICY schools_admin_all ON schools
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_schools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_schools_updated_at();

-- Insert seed data (matching Firestore emulator data)
INSERT INTO schools (id, school_name, school_code, address, principal_name, school_type, is_active) VALUES
    ('default'::uuid, 'Default School', 'DEFAULT', '789 Legacy Rd, Makati, Metro Manila', 'Principal Administrator', 'elementary', true),
    ('school-001'::uuid, 'Sampaguita Elementary School', 'SCH-001', '123 Education Ave, Manila, Metro Manila', 'Dr. Antonio Santos', 'elementary', true),
    ('school-002'::uuid, 'Mabuhay High School', 'SCH-002', '456 Learning St, Quezon City, Metro Manila', 'Dr. Maria Reyes', 'high_school', true)
ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE schools IS 'Schools available for enrollment - multi-tenant base table';
COMMENT ON COLUMN schools.school_code IS 'Unique code for the school (e.g., SCH-001)';
COMMENT ON COLUMN schools.is_active IS 'Whether school accepts enrollments';
COMMENT ON COLUMN schools.settings IS 'School-specific settings and configurations';
