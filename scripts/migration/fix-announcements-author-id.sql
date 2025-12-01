-- ==========================================
-- FIX: Announcements author_id column type
-- ==========================================
-- Change author_id from UUID to VARCHAR to support Firebase Auth UIDs

BEGIN;

-- Drop the foreign key constraint first
ALTER TABLE announcements 
    DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;

-- Change the column type from UUID to VARCHAR
ALTER TABLE announcements 
    ALTER COLUMN author_id TYPE VARCHAR(255) USING author_id::VARCHAR;

COMMIT;

-- Verification
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'announcements' AND column_name = 'author_id';

SELECT 'author_id column updated successfully!' as status;
