-- =====================================================
-- SF6 Demo Data Seeding Script
-- Generates realistic textbook distribution records
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- First, let's check what data we have to work with
DO $$
DECLARE
    v_school_id UUID;
    v_student_record RECORD;
    v_book_record RECORD;
    v_distribution_id UUID;
    v_distributed_date DATE;
    v_expected_return_date DATE;
    v_status TEXT;
    v_condition TEXT;
    v_book_count INT := 0;
    v_distribution_count INT := 0;
BEGIN
    -- Get the first school ID
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No school found in database';
    END IF;
    
    RAISE NOTICE 'Using school_id: %', v_school_id;
    
    -- For each student, distribute 3-5 textbooks
    FOR v_student_record IN (
        SELECT s.id, s.section_id, s.grade_level 
        FROM students s 
        WHERE s.school_id = v_school_id
        ORDER BY s.grade_level, s.last_name
        LIMIT 50  -- Limit to first 50 students for demo
    ) LOOP
        
        v_book_count := 0;
        
        -- Get textbooks appropriate for this student's grade level
        FOR v_book_record IN (
            SELECT b.id, b.book_number, b.title, b.subject
            FROM books b
            WHERE b.school_id = v_school_id
            AND b.category = 'Textbook'
            AND (
                -- Match grade level or general books
                b.grade_level = v_student_record.grade_level 
                OR b.grade_level IS NULL
            )
            ORDER BY RANDOM()
            LIMIT (3 + FLOOR(RANDOM() * 3)::INT)  -- 3-5 books per student
        ) LOOP
            
            v_book_count := v_book_count + 1;
            
            -- Generate realistic distribution date (August to November 2024)
            v_distributed_date := '2024-08-01'::DATE + (FLOOR(RANDOM() * 90)::INT || ' days')::INTERVAL;
            
            -- Expected return date is end of school year (April 2025)
            v_expected_return_date := '2025-04-30'::DATE;
            
            -- Determine status (80% issued, 10% returned, 5% lost, 5% damaged)
            v_status := CASE 
                WHEN RANDOM() < 0.80 THEN 'issued'
                WHEN RANDOM() < 0.90 THEN 'returned'
                WHEN RANDOM() < 0.95 THEN 'lost'
                ELSE 'damaged'
            END;
            
            -- Determine initial condition (70% good, 20% fair, 10% excellent)
            v_condition := CASE 
                WHEN RANDOM() < 0.70 THEN 'good'
                WHEN RANDOM() < 0.90 THEN 'fair'
                ELSE 'excellent'
            END;
            
            -- Insert distribution record
            INSERT INTO textbook_distributions (
                id,
                school_id,
                book_id,
                student_id,
                section_id,
                school_year,
                distributed_date,
                expected_return_date,
                actual_return_date,
                condition_issued,
                condition_returned,
                distribution_status,
                amount_charged,
                payment_status,
                remarks,
                distributed_by,
                received_by
            ) VALUES (
                gen_random_uuid(),
                v_school_id,
                v_book_record.id,
                v_student_record.id,
                v_student_record.section_id,
                '2024-2025',
                v_distributed_date,
                v_expected_return_date,
                -- Only returned books have actual_return_date
                CASE 
                    WHEN v_status = 'returned' 
                    THEN v_distributed_date + (FLOOR(RANDOM() * 180)::INT || ' days')::INTERVAL
                    ELSE NULL 
                END,
                v_condition,
                -- Only returned/damaged books have condition_returned
                CASE 
                    WHEN v_status IN ('returned', 'damaged')
                    THEN CASE 
                        WHEN RANDOM() < 0.60 THEN 'good'
                        WHEN RANDOM() < 0.85 THEN 'fair'
                        WHEN RANDOM() < 0.95 THEN 'poor'
                        ELSE 'damaged'
                    END
                    ELSE NULL 
                END,
                v_status,
                -- Lost/damaged books have charges
                CASE 
                    WHEN v_status IN ('lost', 'damaged')
                    THEN (200 + FLOOR(RANDOM() * 300))::DECIMAL
                    ELSE 0 
                END,
                -- Payment status for charged items
                CASE 
                    WHEN v_status IN ('lost', 'damaged')
                    THEN CASE 
                        WHEN RANDOM() < 0.30 THEN 'paid'
                        WHEN RANDOM() < 0.60 THEN 'pending'
                        WHEN RANDOM() < 0.80 THEN 'partial'
                        ELSE 'pending'
                    END
                    ELSE 'none'
                END,
                -- Add some remarks for lost/damaged items
                CASE 
                    WHEN v_status = 'lost' THEN 'Book reported lost by student'
                    WHEN v_status = 'damaged' THEN 'Book damaged - pages torn/water damage'
                    WHEN v_status = 'returned' AND RANDOM() < 0.3 THEN 'Returned in good condition'
                    ELSE NULL
                END,
                NULL, -- distributed_by (no user tracking for demo data)
                NULL  -- received_by (no user tracking for demo data)
            );
            
            v_distribution_count := v_distribution_count + 1;
            
        END LOOP;
        
        IF v_book_count > 0 THEN
            RAISE NOTICE 'Student % (Grade %): % books distributed', 
                v_student_record.id, 
                v_student_record.grade_level,
                v_book_count;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE '✅ Successfully created % textbook distributions!', v_distribution_count;
    RAISE NOTICE '📚 Run this query to verify: SELECT distribution_status, COUNT(*) FROM textbook_distributions GROUP BY distribution_status;';
    
END $$;

-- Verify the seeded data
SELECT 
    distribution_status,
    COUNT(*) as count,
    ROUND(AVG(amount_charged), 2) as avg_charge
FROM textbook_distributions
GROUP BY distribution_status
ORDER BY count DESC;

-- Show sample distributions
SELECT 
    td.distributed_date,
    s.first_name || ' ' || s.last_name as student_name,
    s.grade_level,
    b.title as book_title,
    td.distribution_status,
    td.condition_issued,
    td.amount_charged
FROM textbook_distributions td
JOIN students s ON s.id = td.student_id
JOIN books b ON b.id = td.book_id
ORDER BY td.distributed_date DESC
LIMIT 20;
