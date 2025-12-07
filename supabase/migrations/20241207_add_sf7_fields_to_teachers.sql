-- Add SF7 Personnel Fields to Teachers Table
-- Created: December 7, 2025
-- Purpose: Add DepEd SF7-compliant fields for personnel management

-- =====================================================
-- Add Name Fields (for proper SF7 reporting)
-- =====================================================

-- Split name into components for SF7 compliance
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- =====================================================
-- Add Employment Information
-- =====================================================

-- Position type (Teacher I, II, III, Master Teacher, etc.)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS position VARCHAR(50);

-- Employment status (permanent, temporary, substitute, contract, volunteer)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employment_status VARCHAR(30);

-- Date hired
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS date_hired DATE;

-- =====================================================
-- Add Qualifications
-- =====================================================

-- Highest educational attainment (bachelors, masters, doctorate)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS highest_education VARCHAR(50);

-- Major specialization
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS major_specialization VARCHAR(255);

-- PRC license information
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS prc_license_number VARCHAR(50);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS prc_license_expiry DATE;

-- =====================================================
-- Add Contact Information (if not exists)
-- =====================================================

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- =====================================================
-- Migrate Existing Data
-- =====================================================

-- For existing teachers, split 'name' into last_name (everything as-is for now)
-- Admins should manually update first_name, middle_name, last_name later
UPDATE teachers 
SET last_name = name
WHERE last_name IS NULL AND name IS NOT NULL;

-- Set default position for existing teachers
UPDATE teachers
SET position = 'teacher_i'
WHERE position IS NULL;

-- Set default employment status for existing teachers
UPDATE teachers
SET employment_status = 'permanent'
WHERE employment_status IS NULL;

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_teachers_last_name ON teachers(last_name);
CREATE INDEX IF NOT EXISTS idx_teachers_first_name ON teachers(first_name);
CREATE INDEX IF NOT EXISTS idx_teachers_position ON teachers(position);
CREATE INDEX IF NOT EXISTS idx_teachers_employment_status ON teachers(employment_status);

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON COLUMN teachers.first_name IS 'First name (given name) - Required for SF7';
COMMENT ON COLUMN teachers.middle_name IS 'Middle name - Optional for SF7';
COMMENT ON COLUMN teachers.last_name IS 'Last name (surname/family name) - Required for SF7';
COMMENT ON COLUMN teachers.position IS 'Position type: teacher_i, teacher_ii, teacher_iii, master_teacher_i, master_teacher_ii, head_teacher_i, head_teacher_ii, head_teacher_iii, principal_i, principal_ii, principal_iii, principal_iv, teacher_aide';
COMMENT ON COLUMN teachers.employment_status IS 'Employment status: permanent, temporary, substitute, contract, volunteer';
COMMENT ON COLUMN teachers.highest_education IS 'Highest educational attainment: bachelors, masters, doctorate';
COMMENT ON COLUMN teachers.prc_license_number IS 'Professional Regulation Commission (PRC) license number for licensed teachers';
