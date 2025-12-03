-- Enable RLS for attendance_records table
-- This script adds open access RLS policy for development

-- Enable Row Level Security
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create all-access policy for development
-- TODO: Replace with proper school-based policies in production
CREATE POLICY attendance_all_access 
ON attendance_records 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Verify policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'attendance_records';
