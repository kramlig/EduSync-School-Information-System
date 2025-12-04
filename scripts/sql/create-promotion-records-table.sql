-- ========================================
-- DepEd Forms: SF5 & SF5-K Database Schema
-- Promotion and Proficiency Records
-- Created: December 3, 2025
-- ========================================

-- Main promotion records table
CREATE TABLE IF NOT EXISTS promotion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  
  -- References with foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  
  -- Period
  school_year TEXT NOT NULL,
  grading_period TEXT CHECK (grading_period IN ('1st_quarter', '2nd_quarter', '3rd_quarter', '4th_quarter', 'final')),
  
  -- Grade Level
  current_grade_level INTEGER NOT NULL CHECK (current_grade_level >= 0 AND current_grade_level <= 12),
  
  -- Proficiency Levels (for Kindergarten - SF5-K)
  socio_emotional_dev TEXT CHECK (socio_emotional_dev IN ('developing', 'emerging', 'advancing')),
  physical_motor_dev TEXT CHECK (physical_motor_dev IN ('developing', 'emerging', 'advancing')),
  cognitive_dev TEXT CHECK (cognitive_dev IN ('developing', 'emerging', 'advancing')),
  language_literacy_dev TEXT CHECK (language_literacy_dev IN ('developing', 'emerging', 'advancing')),
  
  -- General Average (for ES/JHS/SHS - SF5)
  general_average DECIMAL(5,2) CHECK (general_average >= 0 AND general_average <= 100),
  
  -- Promotion Decision
  promotion_status TEXT NOT NULL CHECK (promotion_status IN (
    'promoted',
    'retained',
    'pending',
    'graduated',
    'transferred'
  )),
  
  -- Next Grade/Section (if promoted)
  next_grade_level INTEGER,
  next_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  
  -- Remarks
  remarks TEXT,
  attendance_days_present INTEGER,
  attendance_days_absent INTEGER,
  
  -- Recorded By
  recorded_by UUID,
  approved_by UUID,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one final record per student per school year
  UNIQUE(student_id, school_year, grading_period)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotion_records_school_id ON promotion_records(school_id);
CREATE INDEX IF NOT EXISTS idx_promotion_records_student_id ON promotion_records(student_id);
CREATE INDEX IF NOT EXISTS idx_promotion_records_school_year ON promotion_records(school_year);
CREATE INDEX IF NOT EXISTS idx_promotion_records_status ON promotion_records(promotion_status);
CREATE INDEX IF NOT EXISTS idx_promotion_records_grade_level ON promotion_records(current_grade_level);
CREATE INDEX IF NOT EXISTS idx_promotion_records_section_id ON promotion_records(section_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_promotion_records_school_year_grade 
ON promotion_records(school_id, school_year, current_grade_level);

-- Add comment to table
COMMENT ON TABLE promotion_records IS 'DepEd SF5 and SF5-K: Promotion and Proficiency Records for all grade levels';

-- Column comments
COMMENT ON COLUMN promotion_records.socio_emotional_dev IS 'SF5-K: Socio-Emotional Development level (Kinder only)';
COMMENT ON COLUMN promotion_records.physical_motor_dev IS 'SF5-K: Physical/Motor Development level (Kinder only)';
COMMENT ON COLUMN promotion_records.cognitive_dev IS 'SF5-K: Cognitive Development level (Kinder only)';
COMMENT ON COLUMN promotion_records.language_literacy_dev IS 'SF5-K: Language/Literacy Development level (Kinder only)';
COMMENT ON COLUMN promotion_records.general_average IS 'SF5: General Average for ES/JHS/SHS students';
COMMENT ON COLUMN promotion_records.promotion_status IS 'Final promotion decision: promoted, retained, pending, graduated, or transferred';

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================

-- Enable RLS on the table
ALTER TABLE promotion_records ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
-- (Since you're using Firebase Auth, RLS will be handled at application level)
-- These policies allow full access from the application
CREATE POLICY "Allow all for authenticated users"
ON promotion_records
FOR ALL
USING (true)
WITH CHECK (true);

-- Alternative: School-scoped policies (if you want database-level isolation)
-- Uncomment these and remove the policy above if you want stricter database-level RLS:

-- CREATE POLICY "Users can view records from their school"
-- ON promotion_records FOR SELECT
-- USING (
--   school_id = current_setting('app.current_school_id', true)::uuid
-- );

-- CREATE POLICY "Users can insert records for their school"
-- ON promotion_records FOR INSERT
-- WITH CHECK (
--   school_id = current_setting('app.current_school_id', true)::uuid
-- );

-- CREATE POLICY "Users can update records from their school"
-- ON promotion_records FOR UPDATE
-- USING (
--   school_id = current_setting('app.current_school_id', true)::uuid
-- )
-- WITH CHECK (
--   school_id = current_setting('app.current_school_id', true)::uuid
-- );

-- CREATE POLICY "Users can delete records from their school"
-- ON promotion_records FOR DELETE
-- USING (
--   school_id = current_setting('app.current_school_id', true)::uuid
-- );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Promotion records table created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  - Table: promotion_records';
  RAISE NOTICE '  - Indexes: 7 total (including composite index)';
  RAISE NOTICE '  - RLS: Enabled (allow all for authenticated users)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Verification Commands:';
  RAISE NOTICE '  SELECT * FROM promotion_records LIMIT 1;';
  RAISE NOTICE '  SELECT indexname FROM pg_indexes WHERE tablename = ''promotion_records'';';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: RLS is set to allow all operations.';
  RAISE NOTICE '   Security is handled by Firebase Auth at application level.';
  RAISE NOTICE '   If you need database-level isolation, uncomment the school-scoped policies.';
END $$;
