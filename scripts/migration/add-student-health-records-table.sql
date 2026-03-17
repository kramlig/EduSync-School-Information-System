-- ==========================================
-- Student Health Records Table for SF8
-- Migration Date: January 11, 2026
-- ==========================================
-- This table stores health and nutrition data for SF8 
-- (Learner's Basic Health and Nutrition Report)
-- ==========================================

-- Create student_health_records table
CREATE TABLE IF NOT EXISTS student_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_year VARCHAR(20) NOT NULL,
    assessment_period VARCHAR(20) NOT NULL DEFAULT 'beginning', -- 'beginning', 'end'
    assessment_date DATE NOT NULL,
    
    -- Physical Measurements
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    bmi_category VARCHAR(30), -- 'Severely Wasted', 'Wasted', 'Normal', 'Overweight', 'Obese'
    
    -- Nutritional Status (based on BMI-for-Age)
    nutritional_status VARCHAR(30), -- 'Severely Wasted', 'Wasted', 'Normal', 'Overweight', 'Obese'
    
    -- Health Screening
    vision_screening VARCHAR(50), -- 'Normal', 'With Defect', 'With Correction'
    hearing_screening VARCHAR(50), -- 'Normal', 'With Defect', 'With Correction'
    skin_screening VARCHAR(50), -- 'Normal', 'With Skin Disease'
    eyes_screening VARCHAR(50), -- 'Normal', 'With Eye Disease'
    oral_health_screening VARCHAR(50), -- 'No Cavities', 'With Cavities', 'Decayed', 'Missing', 'Filled'
    
    -- Menarche (for female students)
    menarche_status VARCHAR(20), -- 'Yes', 'No', 'N/A'
    menarche_age INTEGER,
    
    -- Deworming Program
    deworming_1st_dose DATE,
    deworming_2nd_dose DATE,
    deworming_status VARCHAR(30), -- 'Completed', 'Partial', 'Not Administered'
    
    -- Immunization Status
    immunization_complete BOOLEAN DEFAULT false,
    immunization_remarks TEXT,
    
    -- Feeding Program
    feeding_program_enrolled BOOLEAN DEFAULT false,
    feeding_program_type VARCHAR(50), -- 'SBFP' (School-Based Feeding Program), 'Milk Feeding', etc.
    
    -- Medical Conditions & Disabilities
    has_disability BOOLEAN DEFAULT false,
    disability_type TEXT[], -- Array: 'Visual', 'Hearing', 'Learning', 'Physical', etc.
    chronic_illness TEXT[], -- Array: 'Asthma', 'Diabetes', 'Heart Disease', etc.
    allergies TEXT[], -- Array of known allergies
    
    -- General Remarks
    remarks TEXT,
    
    -- Assessed by
    assessed_by_id UUID REFERENCES teachers(id),
    assessed_by_name VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each student can have one record per school year per assessment period
    UNIQUE(student_id, school_year, assessment_period)
);

-- Create indexes for better query performance
CREATE INDEX idx_health_records_school_id ON student_health_records(school_id);
CREATE INDEX idx_health_records_student_id ON student_health_records(student_id);
CREATE INDEX idx_health_records_school_year ON student_health_records(school_year);
CREATE INDEX idx_health_records_nutritional_status ON student_health_records(nutritional_status);
CREATE INDEX idx_health_records_assessment_period ON student_health_records(assessment_period);

-- ==========================================
-- Row Level Security (DISABLED)
-- ==========================================
-- RLS is disabled because EduSync uses Firebase Auth, not Supabase Auth.
-- The auth.uid() function returns NULL with Firebase Auth.
-- School-level access control is handled at the application layer.
-- ==========================================

-- Disable RLS (Firebase Auth is used instead of Supabase Auth)
ALTER TABLE student_health_records DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- Helper Functions
-- ==========================================

-- Function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi(height_cm DECIMAL, weight_kg DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height_cm IS NULL OR weight_kg IS NULL OR height_cm = 0 THEN
        RETURN NULL;
    END IF;
    -- BMI = weight(kg) / height(m)^2
    RETURN ROUND(weight_kg / POWER(height_cm / 100, 2), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to determine BMI category based on standard BMI ranges
-- Note: For children, BMI-for-Age percentiles should be used (requires age calculation)
CREATE OR REPLACE FUNCTION get_bmi_category(bmi DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
    IF bmi IS NULL THEN
        RETURN NULL;
    ELSIF bmi < 14.0 THEN
        RETURN 'Severely Wasted';
    ELSIF bmi < 18.5 THEN
        RETURN 'Wasted';
    ELSIF bmi < 25.0 THEN
        RETURN 'Normal';
    ELSIF bmi < 30.0 THEN
        RETURN 'Overweight';
    ELSE
        RETURN 'Obese';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate BMI and category on insert/update
CREATE OR REPLACE FUNCTION update_health_record_bmi()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate BMI if height and weight are provided
    IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL THEN
        NEW.bmi := calculate_bmi(NEW.height_cm, NEW.weight_kg);
        NEW.bmi_category := get_bmi_category(NEW.bmi);
        -- Default nutritional_status to bmi_category if not set
        IF NEW.nutritional_status IS NULL THEN
            NEW.nutritional_status := NEW.bmi_category;
        END IF;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_record_bmi_trigger
    BEFORE INSERT OR UPDATE ON student_health_records
    FOR EACH ROW
    EXECUTE FUNCTION update_health_record_bmi();

-- ==========================================
-- Sample Data for Testing (Optional)
-- ==========================================
-- Uncomment below to insert sample data

/*
INSERT INTO student_health_records (
    school_id, student_id, school_year, assessment_period, assessment_date,
    height_cm, weight_kg,
    vision_screening, hearing_screening, oral_health_screening,
    deworming_status, immunization_complete
)
SELECT 
    s.school_id,
    s.id,
    '2025-2026',
    'beginning',
    CURRENT_DATE,
    CASE 
        WHEN s.grade_level <= 3 THEN 100 + (s.grade_level * 10) + (random() * 15)
        WHEN s.grade_level <= 6 THEN 120 + ((s.grade_level - 3) * 8) + (random() * 15)
        ELSE 140 + ((s.grade_level - 6) * 5) + (random() * 15)
    END,
    CASE 
        WHEN s.grade_level <= 3 THEN 18 + (s.grade_level * 3) + (random() * 5)
        WHEN s.grade_level <= 6 THEN 25 + ((s.grade_level - 3) * 5) + (random() * 8)
        ELSE 40 + ((s.grade_level - 6) * 5) + (random() * 10)
    END,
    CASE WHEN random() > 0.1 THEN 'Normal' ELSE 'With Defect' END,
    CASE WHEN random() > 0.05 THEN 'Normal' ELSE 'With Defect' END,
    CASE WHEN random() > 0.3 THEN 'No Cavities' ELSE 'With Cavities' END,
    CASE WHEN random() > 0.2 THEN 'Completed' ELSE 'Partial' END,
    random() > 0.1
FROM students s
WHERE s.deleted_at IS NULL
LIMIT 50;
*/

-- ==========================================
-- Verification Queries
-- ==========================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'student_health_records';

-- Check for students with multiple records per year (should be prevented by unique constraint)
-- SELECT student_id, school_year, COUNT(*) 
-- FROM student_health_records 
-- GROUP BY student_id, school_year 
-- HAVING COUNT(*) > 1;

COMMENT ON TABLE student_health_records IS 'Stores health and nutrition data for SF8 (Learner''s Basic Health and Nutrition Report)';
COMMENT ON COLUMN student_health_records.assessment_period IS 'Beginning or End of school year assessment';
COMMENT ON COLUMN student_health_records.bmi_category IS 'Auto-calculated from BMI using standard ranges';
COMMENT ON COLUMN student_health_records.nutritional_status IS 'Final nutritional status classification';
