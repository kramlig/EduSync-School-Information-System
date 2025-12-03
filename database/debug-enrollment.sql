-- Check enrollment_applications table structure and data
SELECT 
    id,
    application_number,
    school_id,
    status,
    student_info->>'firstName' as first_name,
    submitted_at,
    created_at
FROM enrollment_applications
ORDER BY created_at DESC
LIMIT 5;
