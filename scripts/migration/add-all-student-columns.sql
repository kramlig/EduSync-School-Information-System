-- ==========================================
-- ADD MISSING STUDENT COLUMNS (Updated Dec 15, 2025)
-- ==========================================
-- Run this in Supabase SQL Editor
-- 
-- EXISTING COLUMNS (already present):
-- id, school_id, user_id, lrn, name, first_name, middle_name, last_name, suffix,
-- gender, date_of_birth, place_of_birth, section_id, grade_level, enrollment_status,
-- address, contact_number, email, religion, indigenous_people, created_at, updated_at,
-- deleted_at, firebase_uid, photo_url, photo_path, photo_uploaded_at, nationality, mother_tongue

-- Address columns (MISSING)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS barangay VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS province VARCHAR(100),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- Guardian columns (MISSING)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(50),
ADD COLUMN IF NOT EXISTS guardian_contact_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS guardian_occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS guardian_address TEXT;

-- Academic history columns (MISSING)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS enrollment_date DATE,
ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255),
ADD COLUMN IF NOT EXISTS previous_school_address TEXT,
ADD COLUMN IF NOT EXISTS year_last_attended VARCHAR(20);

-- Health columns (MISSING)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10),
ADD COLUMN IF NOT EXISTS health_notes TEXT,
ADD COLUMN IF NOT EXISTS special_needs TEXT;

-- Other columns (MISSING)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS four_ps_beneficiary BOOLEAN DEFAULT false;

-- Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;
