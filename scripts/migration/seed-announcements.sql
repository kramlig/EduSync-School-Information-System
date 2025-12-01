-- ==========================================
-- SEED: Announcements
-- ==========================================
-- Creates sample announcements for all user types
-- Run after: seed-demo-teachers.sql

BEGIN;

-- Delete existing demo announcements (idempotent)
DELETE FROM announcements 
WHERE school_id = '4d3758e8-cd6b-434b-8663-30a3f675ab80';

-- Get school_id and sample teacher IDs
DO $$
DECLARE
    v_school_id UUID := '4d3758e8-cd6b-434b-8663-30a3f675ab80';
    v_principal_id UUID;
    v_teacher1_id UUID;
    v_teacher2_id UUID;
BEGIN
    -- Using hardcoded school_id from your app
    -- No need to lookup, directly using: 4d3758e8-cd6b-434b-8663-30a3f675ab80
    
    -- Get principal and teachers for author attribution
    SELECT id INTO v_principal_id
    FROM teachers
    WHERE school_id = v_school_id AND role = 'principal'
    LIMIT 1;
    
    SELECT id INTO v_teacher1_id
    FROM teachers
    WHERE school_id = v_school_id AND role = 'teacher'
    ORDER BY created_at
    LIMIT 1;
    
    SELECT id INTO v_teacher2_id
    FROM teachers
    WHERE school_id = v_school_id AND role = 'teacher'
    ORDER BY created_at
    OFFSET 1
    LIMIT 1;
    
    -- Insert announcements
    INSERT INTO announcements (school_id, title, content, date, target, author_id, author_name)
    VALUES
        -- General announcements (all)
        (
            v_school_id,
            'Welcome to School Year 2024-2025',
            'We are excited to welcome all students, parents, and staff to the new school year. Classes will begin on June 5, 2024. Please ensure all enrollment requirements are completed.',
            CURRENT_DATE - INTERVAL '30 days',
            'all',
            v_principal_id,
            'Principal Maria Santos'
        ),
        (
            v_school_id,
            'School Calendar Released',
            'The official school calendar for SY 2024-2025 is now available. Please check the important dates for holidays, examination periods, and school activities.',
            CURRENT_DATE - INTERVAL '25 days',
            'all',
            v_principal_id,
            'Principal Maria Santos'
        ),
        (
            v_school_id,
            'Brigada Eskwela 2024',
            'Join us for Brigada Eskwela on May 27-31, 2024. Volunteers are welcome to help prepare our school for the opening of classes. Together, we can make our school beautiful!',
            CURRENT_DATE - INTERVAL '35 days',
            'all',
            v_principal_id,
            'Principal Maria Santos'
        ),
        
        -- Staff announcements
        (
            v_school_id,
            'Faculty Meeting - June 10',
            'All teaching and non-teaching staff are required to attend the faculty meeting on June 10, 2024 at 2:00 PM in the Library. Agenda includes curriculum planning and classroom setup.',
            CURRENT_DATE - INTERVAL '20 days',
            'staff',
            v_principal_id,
            'Principal Maria Santos'
        ),
        (
            v_school_id,
            'Professional Development Workshop',
            'DepEd is conducting a workshop on Inclusive Education on June 15-16, 2024. Interested teachers may register with the principal''s office by June 8.',
            CURRENT_DATE - INTERVAL '18 days',
            'staff',
            v_principal_id,
            'Principal Maria Santos'
        ),
        (
            v_school_id,
            'Deadline: Lesson Plans Submission',
            'All teachers must submit their lesson plans for Quarter 1 by June 14, 2024. Please coordinate with your grade level coordinators for format and templates.',
            CURRENT_DATE - INTERVAL '16 days',
            'staff',
            v_teacher1_id,
            'Teacher Juan Cruz'
        ),
        
        -- Student announcements
        (
            v_school_id,
            'First Day of Classes - June 5',
            'Welcome back, students! Classes start on June 5, 2024 at 7:30 AM. Please wear your complete school uniform and bring your school supplies. See you all!',
            CURRENT_DATE - INTERVAL '27 days',
            'students',
            v_teacher1_id,
            'Teacher Juan Cruz'
        ),
        (
            v_school_id,
            'Science Fair 2024 - Call for Participants',
            'Calling all young scientists! Join the Annual Science Fair on July 20, 2024. Registration forms are available at the Science Department. Deadline: June 30.',
            CURRENT_DATE - INTERVAL '15 days',
            'students',
            v_teacher2_id,
            'Teacher Maria Reyes'
        ),
        (
            v_school_id,
            'Library Opening Hours',
            'The school library is now open every Monday to Friday from 7:00 AM to 5:00 PM. Students are encouraged to borrow books and use the reading area. Maximum of 2 books per student.',
            CURRENT_DATE - INTERVAL '22 days',
            'students',
            v_teacher2_id,
            'Teacher Maria Reyes'
        ),
        (
            v_school_id,
            'Math Quiz Bee - June 28',
            'Attention Math enthusiasts! Join the Inter-Grade Math Quiz Bee on June 28, 2024 at 1:00 PM. Register with your Math teachers by June 21. Prizes await!',
            CURRENT_DATE - INTERVAL '12 days',
            'students',
            v_teacher1_id,
            'Teacher Juan Cruz'
        ),
        
        -- Parent announcements
        (
            v_school_id,
            'Parent-Teacher Conference - July 5',
            'Dear Parents, you are invited to the First Quarter Parent-Teacher Conference on July 5, 2024 from 8:00 AM to 12:00 NN. Please coordinate with your child''s adviser for schedule.',
            CURRENT_DATE - INTERVAL '10 days',
            'parents',
            v_principal_id,
            'Principal Maria Santos'
        ),
        (
            v_school_id,
            'PTA General Assembly',
            'All parents are invited to attend the PTA General Assembly on June 25, 2024 at 5:00 PM. Topics include school projects, budget planning, and parental involvement programs.',
            CURRENT_DATE - INTERVAL '14 days',
            'parents',
            v_principal_id,
            'Principal Maria Santos'
        ),
        (
            v_school_id,
            'Vaccination Program Schedule',
            'The Department of Health will conduct a vaccination program for Grade 1 and Grade 7 students on June 18, 2024. Please submit consent forms by June 15.',
            CURRENT_DATE - INTERVAL '17 days',
            'parents',
            v_teacher2_id,
            'Teacher Maria Reyes'
        ),
        (
            v_school_id,
            'Financial Assistance Program',
            'DepEd Educational Service Contracting (ESC) program is accepting applications. Qualified families may receive tuition subsidies. Inquire at the Registrar''s Office.',
            CURRENT_DATE - INTERVAL '24 days',
            'parents',
            v_principal_id,
            'Principal Maria Santos'
        ),
        
        -- Recent announcements (recent activity)
        (
            v_school_id,
            'Typhoon Alert - Classes Suspended',
            'Due to Typhoon Signal #2, classes are suspended today, December 1, 2024. Online learning modules will be provided. Stay safe everyone!',
            CURRENT_DATE,
            'all',
            v_principal_id,
            'Principal Maria Santos'
        ),
        (
            v_school_id,
            'Christmas Party Planning',
            'The class Christmas parties are scheduled for December 19, 2024. Parents and teachers, please coordinate for the preparation. Let''s make it memorable for our students!',
            CURRENT_DATE - INTERVAL '2 days',
            'all',
            v_teacher1_id,
            'Teacher Juan Cruz'
        );
    
    RAISE NOTICE 'Successfully seeded 16 announcements for school: %', v_school_id;
END $$;

COMMIT;

-- Verification query
SELECT 
    target,
    COUNT(*) as count
FROM announcements
WHERE school_id = '4d3758e8-cd6b-434b-8663-30a3f675ab80'
GROUP BY target
ORDER BY target;

SELECT 
    '✅ Announcements seeded:' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN target = 'all' THEN 1 END) as for_all,
    COUNT(CASE WHEN target = 'staff' THEN 1 END) as for_staff,
    COUNT(CASE WHEN target = 'students' THEN 1 END) as for_students,
    COUNT(CASE WHEN target = 'parents' THEN 1 END) as for_parents
FROM announcements
WHERE school_id = '4d3758e8-cd6b-434b-8663-30a3f675ab80';
