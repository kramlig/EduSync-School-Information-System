-- Verify announcements data in Supabase
-- Run this in Supabase SQL Editor to check the data

-- 1. Check if announcements table exists and has data
SELECT 
    'Total announcements' as check_type,
    COUNT(*) as count
FROM announcements;

-- 2. Check announcements by school
SELECT 
    s.name as school_name,
    COUNT(a.id) as announcement_count
FROM schools s
LEFT JOIN announcements a ON a.school_id = s.id
GROUP BY s.id, s.name
ORDER BY announcement_count DESC;

-- 3. Show all announcements with school name
SELECT 
    a.id,
    s.name as school_name,
    a.school_id,
    a.title,
    a.target,
    a.date,
    a.author_name,
    a.created_at
FROM announcements a
JOIN schools s ON s.id = a.school_id
ORDER BY a.date DESC
LIMIT 20;

-- 4. Check the exact school_id for Demo School
SELECT 
    id as school_id,
    name as school_name
FROM schools
WHERE name ILIKE '%demo%'
LIMIT 5;
