-- ============================================================================
-- Migration 008: Create Enrollment Applications Table
-- Description: Online enrollment application system for parent/guardian submissions
-- Created: December 2, 2025
-- ============================================================================

-- Create enrollment_applications table
CREATE TABLE IF NOT EXISTS enrollment_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_number TEXT UNIQUE NOT NULL, -- Auto-generated: "APP-2025-001"
    
    -- Student Information (flexible JSONB structure)
    student_info JSONB NOT NULL, -- { firstName, middleName, lastName, dateOfBirth, sex, lrn, nationality, religion, motherTongue, placeOfBirth }
    
    -- Guardian Information
    guardian1 JSONB NOT NULL, -- { relationship, firstName, lastName, occupation, employer, contactNumber, email, educationLevel }
    guardian2 JSONB, -- Optional second guardian
    
    -- Address Information
    current_address JSONB NOT NULL, -- { street, barangay, city, province, zipCode, region }
    permanent_address JSONB, -- Optional if different from current
    same_as_current BOOLEAN DEFAULT true,
    
    -- Academic Information
    academic_info JSONB NOT NULL, -- { gradeLevel, track, strand, previousSchool, previousSchoolAddress, yearLastAttended, lastGradeCompleted }
    
    -- Health Information (optional)
    health_info JSONB, -- { bloodType, allergies, medicalConditions, medications, specialNeeds }
    
    -- Document Upload URLs (Firebase Storage paths)
    documents JSONB DEFAULT '{}'::jsonb, -- { birthCertificate, form137, goodMoral, reportCard, photoId, other[] }
    
    -- Application Status & Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'enrolled')),
    submitted_at TIMESTAMPTZ,
    submitted_by TEXT, -- Parent/Guardian email
    
    -- Review Information (filled by admin/registrar)
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Enrollment Information (filled after approval)
    enrolled_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    enrollment_date TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollment_school_id ON enrollment_applications(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON enrollment_applications(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_submitted_at ON enrollment_applications(submitted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_enrollment_application_number ON enrollment_applications(application_number);
CREATE INDEX IF NOT EXISTS idx_enrollment_reviewed_by ON enrollment_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_enrollment_enrolled_student ON enrollment_applications(enrolled_student_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_enrollment_school_status ON enrollment_applications(school_id, status, submitted_at DESC NULLS LAST);

-- Enable Row Level Security
ALTER TABLE enrollment_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Admins can view all applications for their school
CREATE POLICY enrollment_admin_view ON enrollment_applications
    FOR SELECT
    USING (
        school_id IN (
            SELECT school_id FROM users WHERE id = auth.uid()
        )
    );

-- 2. Admins can insert applications (manual entry)
CREATE POLICY enrollment_admin_insert ON enrollment_applications
    FOR INSERT
    WITH CHECK (
        school_id IN (
            SELECT school_id FROM users WHERE id = auth.uid()
        )
    );

-- 3. Admins can update applications (review, approve, reject)
CREATE POLICY enrollment_admin_update ON enrollment_applications
    FOR UPDATE
    USING (
        school_id IN (
            SELECT school_id FROM users WHERE id = auth.uid()
        )
    );

-- 4. Admins can delete applications (soft delete by status change preferred)
CREATE POLICY enrollment_admin_delete ON enrollment_applications
    FOR DELETE
    USING (
        school_id IN (
            SELECT school_id FROM users WHERE id = auth.uid()
        )
    );

-- 5. Public can insert (unauthenticated enrollment submissions)
-- NOTE: This may be handled via Firebase Functions or service role
-- Uncomment if direct public submission is needed:
-- CREATE POLICY enrollment_public_insert ON enrollment_applications
--     FOR INSERT
--     WITH CHECK (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enrollment_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_enrollment_applications_updated_at
    BEFORE UPDATE ON enrollment_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_applications_updated_at();

-- Function to generate next application number
CREATE OR REPLACE FUNCTION generate_application_number(p_school_id UUID, p_year TEXT)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_number TEXT;
BEGIN
    -- Count existing applications for this school and year
    SELECT COUNT(*) INTO v_count
    FROM enrollment_applications
    WHERE school_id = p_school_id
    AND application_number LIKE 'APP-' || p_year || '-%';
    
    -- Generate number: APP-2025-001
    v_number := 'APP-' || p_year || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
    
    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE enrollment_applications IS 'Online enrollment applications submitted by parents/guardians';
COMMENT ON COLUMN enrollment_applications.application_number IS 'Auto-generated unique application number (e.g., APP-2025-001)';
COMMENT ON COLUMN enrollment_applications.student_info IS 'Student personal information in JSONB format';
COMMENT ON COLUMN enrollment_applications.guardian1 IS 'Primary guardian information';
COMMENT ON COLUMN enrollment_applications.guardian2 IS 'Optional second guardian';
COMMENT ON COLUMN enrollment_applications.documents IS 'Document upload URLs from Firebase Storage';
COMMENT ON COLUMN enrollment_applications.status IS 'Application workflow status: draft, submitted, under_review, approved, rejected, enrolled';
COMMENT ON COLUMN enrollment_applications.enrolled_student_id IS 'References students table after approval and enrollment';

-- Grant necessary permissions
-- GRANT SELECT, INSERT, UPDATE ON enrollment_applications TO authenticated;
-- GRANT EXECUTE ON FUNCTION generate_application_number TO authenticated;
