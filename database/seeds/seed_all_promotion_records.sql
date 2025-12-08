-- ============================================================================
-- Seed Promotion Records for ALL Students in Mati City Division
-- Creates realistic promotion data for SF5 dashboard
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Prerequisites:
--   1. Students must exist in the students table
--   2. promotion_records table must exist with updated CHECK constraint
-- ============================================================================

-- First, clear existing promotion records for Mati City schools to avoid duplicates
DELETE FROM promotion_records
WHERE school_id IN (
  SELECT id FROM schools 
  WHERE division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
);

-- Verify student count before seeding
SELECT 'Students to process:' as info, COUNT(*) as count
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
  AND s.deleted_at IS NULL
  AND s.enrollment_status = 'enrolled';

-- ============================================================================
-- SCHOOL YEAR 2024-2025 (Completed Year - 100% of students)
-- ============================================================================
-- This represents a completed school year where all students have final records

INSERT INTO promotion_records (
  school_id,
  student_id,
  section_id,
  school_year,
  grading_period,
  current_grade_level,
  general_average,
  promotion_status,
  next_grade_level,
  remarks,
  attendance_days_present,
  attendance_days_absent,
  created_at,
  updated_at
)
SELECT 
  s.school_id,
  s.id as student_id,
  s.section_id,
  '2024-2025' as school_year,
  'final' as grading_period,
  s.grade_level as current_grade_level,
  -- Generate realistic general averages (75-98)
  ROUND((75 + RANDOM() * 23)::numeric, 2) as general_average,
  -- Promotion status based on weighted random distribution
  CASE 
    -- 85% promoted
    WHEN RANDOM() < 0.85 THEN 'promoted'
    -- 8% conditionally promoted
    WHEN RANDOM() < 0.93 THEN 'conditionally_promoted'
    -- 5% retained
    WHEN RANDOM() < 0.98 THEN 'retained'
    -- 2% transferred
    ELSE 'transferred'
  END as promotion_status,
  -- Next grade level (if promoted or conditionally promoted)
  CASE 
    WHEN s.grade_level < 12 THEN s.grade_level + 1
    ELSE NULL  -- Grade 12 students graduate
  END as next_grade_level,
  -- Remarks based on status
  CASE 
    WHEN RANDOM() < 0.85 THEN 'Promoted to next grade level'
    WHEN RANDOM() < 0.93 THEN 'Conditionally promoted - remedial required'
    WHEN RANDOM() < 0.98 THEN 'Retained - did not meet minimum requirements'
    ELSE 'Transferred to another school'
  END as remarks,
  -- Attendance (realistic: 180-200 days present out of 200)
  FLOOR(180 + RANDOM() * 20)::integer as attendance_days_present,
  FLOOR(RANDOM() * 20)::integer as attendance_days_absent,
  NOW() - INTERVAL '6 months' as created_at,
  NOW() - INTERVAL '6 months' as updated_at
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
  AND s.deleted_at IS NULL
  AND s.enrollment_status = 'enrolled';

-- Verify 2024-2025 records
SELECT 'SY 2024-2025 records created:' as info, COUNT(*) as count
FROM promotion_records
WHERE school_year = '2024-2025';

-- ============================================================================
-- SCHOOL YEAR 2025-2026 (Current Year - ~35% of students have records)
-- ============================================================================
-- This represents a year in progress where only some students have been evaluated

INSERT INTO promotion_records (
  school_id,
  student_id,
  section_id,
  school_year,
  grading_period,
  current_grade_level,
  general_average,
  promotion_status,
  next_grade_level,
  remarks,
  attendance_days_present,
  attendance_days_absent,
  created_at,
  updated_at
)
SELECT 
  s.school_id,
  s.id as student_id,
  s.section_id,
  '2025-2026' as school_year,
  'final' as grading_period,
  s.grade_level as current_grade_level,
  -- Generate realistic general averages (75-98)
  ROUND((75 + RANDOM() * 23)::numeric, 2) as general_average,
  -- Promotion status - mostly pending for current year
  CASE 
    WHEN RANDOM() < 0.60 THEN 'pending'
    WHEN RANDOM() < 0.85 THEN 'promoted'
    WHEN RANDOM() < 0.93 THEN 'conditionally_promoted'
    WHEN RANDOM() < 0.98 THEN 'retained'
    ELSE 'transferred'
  END as promotion_status,
  -- Next grade level
  CASE 
    WHEN s.grade_level < 12 THEN s.grade_level + 1
    ELSE NULL
  END as next_grade_level,
  'In progress - preliminary assessment' as remarks,
  -- Attendance (partial year: 60-100 days)
  FLOOR(60 + RANDOM() * 40)::integer as attendance_days_present,
  FLOOR(RANDOM() * 10)::integer as attendance_days_absent,
  NOW() as created_at,
  NOW() as updated_at
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
  AND s.deleted_at IS NULL
  AND s.enrollment_status = 'enrolled'
  -- Only ~35% of students get records for current year
  AND RANDOM() < 0.35;

-- Verify 2025-2026 records
SELECT 'SY 2025-2026 records created:' as info, COUNT(*) as count
FROM promotion_records
WHERE school_year = '2025-2026';

-- ============================================================================
-- Fix promotion status distribution for 2024-2025 to be more accurate
-- ============================================================================
-- Update to ensure proper distribution: 85% promoted, 8% cond, 5% retained, 2% transferred

-- First, set all to promoted
UPDATE promotion_records
SET promotion_status = 'promoted',
    remarks = 'Promoted to next grade level'
WHERE school_year = '2024-2025';

-- Then update ~8% to conditionally_promoted
UPDATE promotion_records
SET promotion_status = 'conditionally_promoted',
    remarks = 'Conditionally promoted - remedial required',
    general_average = ROUND((75 + RANDOM() * 5)::numeric, 2)  -- Lower average (75-80)
WHERE school_year = '2024-2025'
  AND id IN (
    SELECT id FROM promotion_records 
    WHERE school_year = '2024-2025' 
    ORDER BY RANDOM() 
    LIMIT (SELECT COUNT(*) * 0.08 FROM promotion_records WHERE school_year = '2024-2025')::integer
  );

-- Update ~5% to retained
UPDATE promotion_records
SET promotion_status = 'retained',
    remarks = 'Retained - did not meet minimum requirements',
    next_grade_level = current_grade_level,
    general_average = ROUND((70 + RANDOM() * 5)::numeric, 2)  -- Below passing (70-75)
WHERE school_year = '2024-2025'
  AND promotion_status = 'promoted'
  AND id IN (
    SELECT id FROM promotion_records 
    WHERE school_year = '2024-2025' AND promotion_status = 'promoted'
    ORDER BY RANDOM() 
    LIMIT (SELECT COUNT(*) * 0.05 FROM promotion_records WHERE school_year = '2024-2025')::integer
  );

-- Update ~2% to transferred
UPDATE promotion_records
SET promotion_status = 'transferred',
    remarks = 'Transferred to another school',
    next_grade_level = NULL
WHERE school_year = '2024-2025'
  AND promotion_status = 'promoted'
  AND id IN (
    SELECT id FROM promotion_records 
    WHERE school_year = '2024-2025' AND promotion_status = 'promoted'
    ORDER BY RANDOM() 
    LIMIT (SELECT COUNT(*) * 0.02 FROM promotion_records WHERE school_year = '2024-2025')::integer
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Summary by school year
SELECT 
  school_year,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE promotion_status = 'promoted') as promoted,
  COUNT(*) FILTER (WHERE promotion_status = 'conditionally_promoted') as cond_promoted,
  COUNT(*) FILTER (WHERE promotion_status = 'retained') as retained,
  COUNT(*) FILTER (WHERE promotion_status = 'transferred') as transferred,
  COUNT(*) FILTER (WHERE promotion_status = 'pending') as pending,
  ROUND(AVG(general_average), 2) as avg_grade
FROM promotion_records
WHERE school_id IN (
  SELECT id FROM schools 
  WHERE division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
)
GROUP BY school_year
ORDER BY school_year;

-- Summary by grade level for 2024-2025
SELECT 
  current_grade_level as grade,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE promotion_status = 'promoted') as promoted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE promotion_status = 'promoted') / NULLIF(COUNT(*), 0), 1) as promotion_rate
FROM promotion_records
WHERE school_year = '2024-2025'
  AND school_id IN (
    SELECT id FROM schools 
    WHERE division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
  )
GROUP BY current_grade_level
ORDER BY current_grade_level;

-- Final summary
SELECT 
  'Seeding complete!' as status,
  (SELECT COUNT(*) FROM promotion_records WHERE school_year = '2024-2025') as sy_2024_2025,
  (SELECT COUNT(*) FROM promotion_records WHERE school_year = '2025-2026') as sy_2025_2026,
  (SELECT COUNT(*) FROM promotion_records) as total_records;
