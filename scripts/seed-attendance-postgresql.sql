-- Seed Sample Attendance Data for PostgreSQL
-- Run this in Supabase SQL Editor or local PostgreSQL

-- This script generates attendance records for November 2025
-- for all students in the database

DO $$
DECLARE
    student_record RECORD;
    school_record RECORD;
    date_iter DATE;
    day_of_week INTEGER;
    random_status TEXT;
BEGIN
    -- Get the default school
    SELECT id INTO school_record FROM schools LIMIT 1;
    
    IF school_record.id IS NULL THEN
        RAISE NOTICE 'No school found. Please seed schools first.';
        RETURN;
    END IF;
    
    -- Loop through all students
    FOR student_record IN 
        SELECT id, section_id, school_id 
        FROM students 
        WHERE school_id = school_record.id
        LIMIT 100 -- Limit to first 100 students for performance
    LOOP
        -- Generate attendance for November 2025 (weekdays only)
        date_iter := '2025-11-01'::DATE;
        
        WHILE date_iter <= '2025-11-30'::DATE LOOP
            day_of_week := EXTRACT(DOW FROM date_iter);
            
            -- Skip weekends (0 = Sunday, 6 = Saturday)
            IF day_of_week != 0 AND day_of_week != 6 THEN
                -- Random attendance status (90% Present, 5% Absent, 3% Late, 2% Excused)
                random_status := CASE 
                    WHEN RANDOM() < 0.90 THEN 'Present'
                    WHEN RANDOM() < 0.95 THEN 'Absent'
                    WHEN RANDOM() < 0.98 THEN 'Late'
                    ELSE 'Excused'
                END;
                
                -- Insert attendance record
                INSERT INTO attendance_records (
                    school_id,
                    student_id,
                    section_id,
                    date,
                    status,
                    recorded_by,
                    created_at,
                    updated_at
                ) VALUES (
                    student_record.school_id,
                    student_record.id,
                    student_record.section_id,
                    date_iter,
                    random_status,
                    'system-seed',
                    NOW(),
                    NOW()
                )
                ON CONFLICT (student_id, date) DO NOTHING; -- Avoid duplicates
            END IF;
            
            date_iter := date_iter + INTERVAL '1 day';
        END WHILE;
    END LOOP;
    
    RAISE NOTICE 'Sample attendance data seeded successfully for November 2025';
END $$;

-- Verify the data
SELECT 
    COUNT(*) as total_records,
    status,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM attendance_records
WHERE date >= '2025-11-01' AND date <= '2025-11-30'
GROUP BY status
ORDER BY status;
