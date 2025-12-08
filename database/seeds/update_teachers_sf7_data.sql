-- Update Teachers with SF7 Position and Employment Status Data
-- Created: December 8, 2025
-- Purpose: Populate position and employment_status for existing teachers in Division of City of Mati

-- =====================================================
-- STEP 1: Ensure SF7 columns exist
-- =====================================================

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS position VARCHAR(50);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employment_status VARCHAR(30);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS date_hired DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS highest_education VARCHAR(50);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS prc_license_number VARCHAR(50);

-- =====================================================
-- STEP 2: Update teachers with random but realistic positions
-- =====================================================

-- Create a function to assign positions based on teacher order within school
DO $$
DECLARE
  rec RECORD;
  position_value VARCHAR(50);
  status_value VARCHAR(30);
  education_value VARCHAR(50);
  counter INTEGER := 0;
  school_counter INTEGER := 0;
  current_school_id UUID := NULL;
BEGIN
  FOR rec IN 
    SELECT id, school_id, name 
    FROM teachers 
    WHERE (position IS NULL OR position = '' OR position = 'other')
    ORDER BY school_id, created_at
  LOOP
    -- Reset counter for each new school
    IF current_school_id IS NULL OR current_school_id != rec.school_id THEN
      current_school_id := rec.school_id;
      school_counter := 0;
    END IF;
    
    school_counter := school_counter + 1;
    counter := counter + 1;
    
    -- Assign position based on teacher order in school
    -- First 1-2 teachers per school: principals/head teachers
    -- Next few: master teachers
    -- Rest: regular teachers
    IF school_counter = 1 THEN
      -- School head
      position_value := CASE (counter % 4)
        WHEN 0 THEN 'principal_i'
        WHEN 1 THEN 'principal_ii'
        WHEN 2 THEN 'head_teacher_iii'
        ELSE 'head_teacher_ii'
      END;
    ELSIF school_counter = 2 THEN
      -- Assistant principal or head teacher
      position_value := CASE (counter % 3)
        WHEN 0 THEN 'head_teacher_i'
        WHEN 1 THEN 'head_teacher_ii'
        ELSE 'master_teacher_i'
      END;
    ELSIF school_counter <= 4 THEN
      -- Senior teachers
      position_value := CASE (counter % 4)
        WHEN 0 THEN 'master_teacher_i'
        WHEN 1 THEN 'master_teacher_ii'
        WHEN 2 THEN 'teacher_iii'
        ELSE 'teacher_iii'
      END;
    ELSIF school_counter <= 8 THEN
      -- Mid-level teachers
      position_value := CASE (counter % 3)
        WHEN 0 THEN 'teacher_iii'
        WHEN 1 THEN 'teacher_ii'
        ELSE 'teacher_ii'
      END;
    ELSE
      -- Junior teachers (majority)
      position_value := CASE (counter % 5)
        WHEN 0 THEN 'teacher_ii'
        WHEN 1 THEN 'teacher_ii'
        WHEN 2 THEN 'teacher_i'
        WHEN 3 THEN 'teacher_i'
        ELSE 'teacher_i'
      END;
    END IF;
    
    -- Assign employment status (majority permanent, some temporary, few contract)
    status_value := CASE (counter % 10)
      WHEN 0 THEN 'temporary'
      WHEN 1 THEN 'temporary'
      WHEN 2 THEN 'contract'
      WHEN 3 THEN 'substitute'
      ELSE 'permanent'
    END;
    
    -- Assign education level based on position
    IF position_value LIKE 'principal%' OR position_value LIKE 'head_teacher%' OR position_value LIKE 'master_teacher%' THEN
      education_value := CASE (counter % 3)
        WHEN 0 THEN 'doctorate'
        WHEN 1 THEN 'masters'
        ELSE 'masters'
      END;
    ELSIF position_value = 'teacher_iii' THEN
      education_value := CASE (counter % 2)
        WHEN 0 THEN 'masters'
        ELSE 'bachelors'
      END;
    ELSE
      education_value := CASE (counter % 5)
        WHEN 0 THEN 'masters'
        ELSE 'bachelors'
      END;
    END IF;
    
    -- Update the teacher
    UPDATE teachers
    SET 
      position = position_value,
      employment_status = status_value,
      highest_education = education_value,
      date_hired = DATE '2015-06-01' + (counter * 30 || ' days')::interval,
      prc_license_number = 'PRC-' || LPAD(counter::text, 7, '0')
    WHERE id = rec.id;
    
  END LOOP;
  
  RAISE NOTICE 'Updated % teachers with SF7 data', counter;
END $$;

-- =====================================================
-- STEP 3: Verify the updates
-- =====================================================

-- Show distribution by position
SELECT 
  position,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM teachers
WHERE deleted_at IS NULL
GROUP BY position
ORDER BY count DESC;

-- Show distribution by employment status
SELECT 
  employment_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM teachers
WHERE deleted_at IS NULL
GROUP BY employment_status
ORDER BY count DESC;

-- Summary
SELECT 
  COUNT(*) as total_teachers,
  COUNT(CASE WHEN position IS NOT NULL AND position != '' AND position != 'other' THEN 1 END) as with_position,
  COUNT(CASE WHEN employment_status IS NOT NULL AND employment_status != '' AND employment_status != 'unknown' THEN 1 END) as with_status
FROM teachers
WHERE deleted_at IS NULL;
