-- Seed Teachers for Default School in PostgreSQL
-- This script populates the teachers table with 8 teachers matching the Firestore seed data

-- First, get the school_id (assuming 'default' school exists)
DO $$
DECLARE
  school_uuid UUID;
BEGIN
  -- Get or create default school
  SELECT id INTO school_uuid FROM schools WHERE name = 'Default School' OR id::text = 'default' LIMIT 1;
  
  IF school_uuid IS NULL THEN
    INSERT INTO schools (name, region, division, district, school_year, created_at, updated_at)
    VALUES ('Default School', 'Region XI', 'Division of Mati', 'Governor Generoso North', '2024-2025', NOW(), NOW())
    RETURNING id INTO school_uuid;
  END IF;

  -- Insert teachers (matching Firestore seed data)
  INSERT INTO teachers (school_id, name, email, contact_number, phone, role, assignments, created_at, updated_at)
  VALUES
    (school_uuid, 'Ana Bautista', 'default-teacher1@test.com', '09171234567', '09171234567', 'teacher', '[]'::jsonb, NOW(), NOW()),
    (school_uuid, 'Maria Santos', 'default-teacher2@test.com', '09171234568', '09171234568', 'teacher', '[]'::jsonb, NOW(), NOW()),
    (school_uuid, 'Juan Dela Cruz', 'default-teacher3@test.com', '09171234569', '09171234569', 'teacher', '[]'::jsonb, NOW(), NOW()),
    (school_uuid, 'Pedro Garcia', 'default-teacher4@test.com', '09171234570', '09171234570', 'teacher', '[]'::jsonb, NOW(), NOW()),
    (school_uuid, 'Rosa Martinez', 'default-teacher5@test.com', '09171234571', '09171234571', 'teacher', '[]'::jsonb, NOW(), NOW()),
    (school_uuid, 'Carlos Lopez', 'default-teacher6@test.com', '09171234572', '09171234572', 'teacher', '[]'::jsonb, NOW(), NOW()),
    (school_uuid, 'Sofia Reyes', 'default-teacher7@test.com', '09171234573', '09171234573', 'teacher', '[]'::jsonb, NOW(), NOW()),
    (school_uuid, 'Miguel Torres', 'default-teacher8@test.com', '09171234574', '09171234574', 'teacher', '[]'::jsonb, NOW(), NOW())
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Seeded 8 teachers for school_id: %', school_uuid;
END $$;
