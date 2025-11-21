-- Add email column to students table
-- Run this in Supabase SQL Editor BEFORE running seed-production.sql

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comment
COMMENT ON COLUMN students.email IS 'Student email address for communication and login';

-- Optionally add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
