-- ==========================================
-- CREATE: Announcements Table
-- ==========================================
-- Run this in Supabase SQL Editor

-- Create ENUM type for announcement target
DO $$ BEGIN
    CREATE TYPE announcement_target AS ENUM ('all', 'staff', 'students', 'parents');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    target announcement_target NOT NULL DEFAULT 'all',
    
    author_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);

-- Enable RLS (optional - for security)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Verification
SELECT 'Announcements table created successfully!' as status;
SELECT COUNT(*) as existing_announcements FROM announcements;
