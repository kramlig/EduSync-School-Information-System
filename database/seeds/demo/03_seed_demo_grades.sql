-- ============================================================================
-- SEED DEMO GRADES (Q1 & Q2) FOR MATI DIVISION SCHOOLS
-- Creates realistic grade distribution for Division Q2 Proficiency Report
-- 
-- Proficiency Level Distribution (realistic):
--   Outstanding (90-100): 15%
--   Very Satisfactory (85-89): 25%
--   Satisfactory (80-84): 35%
--   Fairly Satisfactory (75-79): 20%
--   Did Not Meet Expectations (<75): 5%
--
-- Run AFTER: schools, students, sections, learning_areas are seeded
-- ============================================================================

-- First, let's assign students to sections
DO $$
DECLARE
  v_school RECORD;
  v_section RECORD;
  v_students CURSOR FOR SELECT * FROM students WHERE section_id IS NULL ORDER BY school_id, grade_level, last_name;
  v_student students%ROWTYPE;
  v_current_school_id UUID;
  v_current_grade INTEGER;
  v_section_cursor REFCURSOR;
  v_section_record RECORD;
  v_student_count INTEGER;
  v_students_assigned INTEGER := 0;
BEGIN
  RAISE NOTICE 'Assigning students to sections...';
  
  -- Loop through each school and grade combination
  FOR v_school IN 
    SELECT DISTINCT s.id as school_id, st.grade_level
    FROM schools s
    JOIN students st ON st.school_id = s.id
    WHERE s.division = 'Division of City of Mati'
      AND st.section_id IS NULL
    ORDER BY s.id, st.grade_level
  LOOP
    -- Get sections for this school and grade
    v_student_count := 0;
    FOR v_section_record IN 
      SELECT id, name, capacity 
      FROM sections 
      WHERE school_id = v_school.school_id 
        AND grade_level = v_school.grade_level
        AND school_year = '2024-2025'
      ORDER BY name
    LOOP
      -- Assign students to this section (up to capacity, default ~50)
      UPDATE students 
      SET section_id = v_section_record.id, updated_at = NOW()
      WHERE id IN (
        SELECT id FROM students 
        WHERE school_id = v_school.school_id 
          AND grade_level = v_school.grade_level
          AND section_id IS NULL
        LIMIT COALESCE(v_section_record.capacity, 50)
      );
      
      GET DIAGNOSTICS v_student_count = ROW_COUNT;
      v_students_assigned := v_students_assigned + v_student_count;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Students assigned to sections: %', v_students_assigned;
END $$;

-- ============================================================================
-- CREATE GRADES WITH REALISTIC DISTRIBUTION
-- ============================================================================

DO $$
DECLARE
  v_school RECORD;
  v_student RECORD;
  v_learning_area RECORD;
  v_grades_created INTEGER := 0;
  v_q1_grade NUMERIC(5,2);
  v_q2_grade NUMERIC(5,2);
  v_rand_bucket NUMERIC;
  v_batch_count INTEGER := 0;
  v_school_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting Q1 & Q2 grade generation for Division of City of Mati...';
  RAISE NOTICE 'This may take a while for 38k+ students...';
  
  -- Clear existing grades for Mati schools
  DELETE FROM grades WHERE school_id IN (
    SELECT id FROM schools WHERE division = 'Division of City of Mati'
  );
  RAISE NOTICE 'Cleared existing grades';
  
  -- Process each school
  FOR v_school IN 
    SELECT s.id, s.name, s.school_id_number
    FROM schools s
    WHERE s.division = 'Division of City of Mati'
      AND s.school_id_number IS NOT NULL
    ORDER BY s.school_id_number
  LOOP
    v_school_count := v_school_count + 1;
    IF v_school_count % 10 = 0 THEN
      RAISE NOTICE 'Processing school %: %', v_school_count, v_school.name;
    END IF;
    
    -- For each student in this school
    FOR v_student IN 
      SELECT st.id, st.grade_level
      FROM students st
      WHERE st.school_id = v_school.id
    LOOP
      -- For each applicable learning area
      FOR v_learning_area IN 
        SELECT la.id, la.code, la.grade_levels
        FROM learning_areas la
        WHERE la.school_id = v_school.id
          AND v_student.grade_level = ANY(la.grade_levels)
      LOOP
        -- Generate random bucket for grade distribution
        v_rand_bucket := random();
        
        -- Generate Q1 grade based on distribution
        IF v_rand_bucket < 0.05 THEN
          -- Did Not Meet Expectations (<75): 5%
          v_q1_grade := 60 + (random() * 14); -- 60-74
        ELSIF v_rand_bucket < 0.25 THEN
          -- Fairly Satisfactory (75-79): 20%
          v_q1_grade := 75 + (random() * 4); -- 75-79
        ELSIF v_rand_bucket < 0.60 THEN
          -- Satisfactory (80-84): 35%
          v_q1_grade := 80 + (random() * 4); -- 80-84
        ELSIF v_rand_bucket < 0.85 THEN
          -- Very Satisfactory (85-89): 25%
          v_q1_grade := 85 + (random() * 4); -- 85-89
        ELSE
          -- Outstanding (90-100): 15%
          v_q1_grade := 90 + (random() * 10); -- 90-100
        END IF;
        
        -- Q2 grade: slight variation from Q1 (±5 points, realistic progression)
        v_q2_grade := v_q1_grade + (random() * 6 - 2); -- Q2 tends to be slightly higher
        v_q2_grade := GREATEST(60, LEAST(100, v_q2_grade)); -- Clamp to 60-100
        
        -- Round to 2 decimal places
        v_q1_grade := ROUND(v_q1_grade, 2);
        v_q2_grade := ROUND(v_q2_grade, 2);
        
        -- Insert grade record
        INSERT INTO grades (
          id, school_id, student_id, learning_area_id, 
          school_year, q1, q2,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), v_school.id, v_student.id, v_learning_area.id,
          '2024-2025', v_q1_grade, v_q2_grade,
          NOW(), NOW()
        );
        
        v_grades_created := v_grades_created + 1;
        v_batch_count := v_batch_count + 1;
        
        -- Commit in batches to avoid memory issues
        IF v_batch_count >= 10000 THEN
          RAISE NOTICE 'Created % grade records so far...', v_grades_created;
          v_batch_count := 0;
        END IF;
        
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GRADE SEEDING COMPLETE!';
  RAISE NOTICE 'Total Grade Records Created: %', v_grades_created;
  RAISE NOTICE 'Schools Processed: %', v_school_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Grade distribution by proficiency level (Q2)
SELECT 
  CASE 
    WHEN q2 >= 90 THEN 'Outstanding (90-100)'
    WHEN q2 >= 85 THEN 'Very Satisfactory (85-89)'
    WHEN q2 >= 80 THEN 'Satisfactory (80-84)'
    WHEN q2 >= 75 THEN 'Fairly Satisfactory (75-79)'
    ELSE 'Did Not Meet Expectations (<75)'
  END as proficiency_level,
  COUNT(*) as count,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY 1
ORDER BY 
  CASE 
    WHEN q2 >= 90 THEN 1
    WHEN q2 >= 85 THEN 2
    WHEN q2 >= 80 THEN 3
    WHEN q2 >= 75 THEN 4
    ELSE 5
  END;

-- Proficiency by school (for Division report)
SELECT 
  s.name as school_name,
  COUNT(*) as total_grades,
  ROUND(AVG(g.q1), 2) as avg_q1,
  ROUND(AVG(g.q2), 2) as avg_q2,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as q2_passing_rate
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY s.id, s.name
ORDER BY s.name
LIMIT 20;

-- Proficiency by district
SELECT 
  s.district,
  COUNT(DISTINCT s.id) as schools,
  COUNT(DISTINCT g.student_id) as students,
  COUNT(*) as total_grades,
  ROUND(AVG(g.q2), 2) as avg_q2_grade,
  ROUND(COUNT(CASE WHEN g.q2 >= 90 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as outstanding_pct,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as passing_rate
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- Summary stats
SELECT 
  'Division of City of Mati' as division,
  COUNT(DISTINCT s.id) as total_schools,
  COUNT(DISTINCT g.student_id) as students_with_grades,
  COUNT(*) as total_grade_records,
  ROUND(AVG(g.q1), 2) as division_avg_q1,
  ROUND(AVG(g.q2), 2) as division_avg_q2
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati';
