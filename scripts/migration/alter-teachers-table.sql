-- Add missing columns to teachers table to match Firestore structure
-- This allows the useTeachersPostgreSQL hook to work correctly

-- Add email column (unique)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Add contact_number/phone column
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);

-- Add role column
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'teacher';

-- Add assignments JSONB column for teaching assignments
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS assignments JSONB DEFAULT '[]'::jsonb;

-- Make user_id nullable (teachers can exist without user accounts for now)
ALTER TABLE teachers ALTER COLUMN user_id DROP NOT NULL;

-- Add created_at and updated_at if missing
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);
