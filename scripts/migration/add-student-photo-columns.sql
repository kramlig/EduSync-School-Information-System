-- ==========================================
-- ADD STUDENT PHOTO COLUMNS
-- ==========================================
-- Run this in Supabase SQL Editor to add photo support to students table

-- Add photo columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_path TEXT,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

-- Add nationality and mother_tongue if missing
ALTER TABLE students
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
ADD COLUMN IF NOT EXISTS mother_tongue VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_photo_url ON students(photo_url) WHERE photo_url IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('photo_url', 'photo_path', 'photo_uploaded_at', 'nationality', 'mother_tongue');
