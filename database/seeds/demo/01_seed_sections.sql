-- ============================================================================
-- SEED SECTIONS FOR ALL MATI DIVISION SCHOOLS
-- Creates sections for each grade level at each school
-- Run AFTER schools and teachers are seeded
-- ============================================================================

DO $$
DECLARE
  v_school RECORD;
  v_grade INTEGER;
  v_section_count INTEGER;
  v_section_names TEXT[] := ARRAY[
    'Sampaguita', 'Rosal', 'Dahlia', 'Orchid', 'Jasmine', 'Camia', 'Ilang-Ilang', 'Gumamela',
    'Rose', 'Sunflower', 'Tulip', 'Lily', 'Daisy', 'Carnation', 'Violet', 'Iris',
    'St. Peter', 'St. Paul', 'St. John', 'St. Mark', 'St. Luke', 'St. Matthew',
    'Diamond', 'Gold', 'Silver', 'Emerald', 'Ruby', 'Sapphire', 'Pearl', 'Amethyst',
    'Einstein', 'Newton', 'Galileo', 'Curie', 'Darwin', 'Tesla', 'Edison', 'Pasteur'
  ];
  v_section_name TEXT;
  v_adviser_id UUID;
  v_sections_created INTEGER := 0;
  v_is_elementary BOOLEAN;
  v_grade_min INTEGER;
  v_grade_max INTEGER;
BEGIN
  RAISE NOTICE 'Starting section seeding for Division of City of Mati...';
  
  -- Clear existing sections for Mati schools
  DELETE FROM sections WHERE school_id IN (
    SELECT id FROM schools WHERE division = 'Division of City of Mati'
  );
  RAISE NOTICE 'Cleared existing sections';
  
  -- Loop through each school
  FOR v_school IN 
    SELECT s.id, s.name, s.school_id_number,
           CASE 
             WHEN s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' OR s.name ILIKE '%Arts%' 
                  OR s.name ILIKE '%Voc%' OR s.name ILIKE '%Science High%' OR s.name ILIKE '%Comprehensive%'
             THEN 'Secondary'
             WHEN s.name ILIKE '%Integrated%' OR s.name ILIKE '% IS'
             THEN 'Integrated'
             ELSE 'Elementary'
           END as school_type
    FROM schools s
    WHERE s.division = 'Division of City of Mati'
      AND s.school_id_number IS NOT NULL
    ORDER BY s.school_id_number
  LOOP
    -- Determine grade range based on school type
    IF v_school.school_type = 'Secondary' THEN
      v_grade_min := 7;
      v_grade_max := 12;
    ELSIF v_school.school_type = 'Integrated' THEN
      v_grade_min := 1;
      v_grade_max := 10; -- K-10 for integrated schools
    ELSE
      v_grade_min := 1;
      v_grade_max := 6;
    END IF;
    
    -- Create sections for each grade
    FOR v_grade IN v_grade_min..v_grade_max LOOP
      -- Vary number of sections based on grade (2-4 sections per grade)
      v_section_count := 2 + floor(random() * 3)::INTEGER;
      
      FOR v_i IN 1..v_section_count LOOP
        -- Get section name (cycle through names)
        v_section_name := v_section_names[((v_grade - 1) * 4 + v_i - 1) % array_length(v_section_names, 1) + 1];
        
        -- Try to get a random adviser from this school
        SELECT id INTO v_adviser_id 
        FROM teachers 
        WHERE school_id = v_school.id 
        ORDER BY random() 
        LIMIT 1;
        
        -- Insert section
        INSERT INTO sections (
          id, school_id, name, grade_level, school_year, adviser_id, capacity, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          v_school.id,
          v_section_name,
          v_grade,
          '2024-2025',
          v_adviser_id,
          40 + floor(random() * 20)::INTEGER, -- capacity 40-60
          NOW(),
          NOW()
        );
        
        v_sections_created := v_sections_created + 1;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION SEEDING COMPLETE!';
  RAISE NOTICE 'Total Sections Created: %', v_sections_created;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Summary by school type
SELECT 
  CASE 
    WHEN s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' THEN 'Secondary'
    WHEN s.name ILIKE '%Integrated%' THEN 'Integrated'
    ELSE 'Elementary'
  END as school_type,
  COUNT(DISTINCT s.id) as schools,
  COUNT(sec.id) as total_sections
FROM schools s
LEFT JOIN sections sec ON sec.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY 1
ORDER BY 1;

-- Sections per grade
SELECT grade_level, COUNT(*) as sections
FROM sections sec
JOIN schools s ON sec.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY grade_level
ORDER BY grade_level;
