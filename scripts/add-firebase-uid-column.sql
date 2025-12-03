-- Add firebase_uid column to production PostgreSQL database
-- Run this in Supabase SQL Editor for production database

-- Add firebase_uid to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

-- Add firebase_uid to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

-- Add firebase_uid to parents table
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_firebase_uid ON teachers(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_students_firebase_uid ON students(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_parents_firebase_uid ON parents(firebase_uid);

-- Update the teacher account you just created in Firebase Auth
-- Replace 'teacher@example.com' with your actual teacher email
UPDATE teachers 
SET firebase_uid = 'WytgG7N2dyb570FkCtOOx81Yyj42' 
WHERE email = 'default-teacher3@test.com';

-- Verify the update
SELECT id, email, firebase_uid, role FROM teachers WHERE firebase_uid IS NOT NULL;
