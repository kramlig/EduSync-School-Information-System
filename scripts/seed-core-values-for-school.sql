-- ==========================================
-- SEED CORE VALUES FOR A SPECIFIC SCHOOL
-- ==========================================
-- Run this in Supabase SQL Editor to add DepEd Core Values to a school

-- First, find your school ID
-- Replace 'Onotan Daganio Tagbobolo ES' with your school name
-- SELECT id, name FROM schools WHERE name LIKE '%Onotan%';

-- Insert the 4 DepEd Core Values with behavioral indicators
-- Make sure to replace the school_id with your actual school ID

INSERT INTO core_values (school_id, code, name, description, display_order, indicators)
SELECT 
  school.id,
  cv.code,
  cv.name,
  cv.description,
  cv.display_order,
  cv.indicators
FROM schools school
CROSS JOIN (VALUES 
  ('MAKA_DIYOS', 'MAKA-DIYOS', 'Demonstrates spirituality and faith', 1, 
   ARRAY['Expresses one''s spiritual beliefs while respecting the spiritual beliefs of others',
         'Shows adherence to ethical principles by upholding truth']),
  ('MAKATAO', 'MAKATAO', 'Shows respect and care for others', 2,
   ARRAY['Is sensitive to individual, social, and cultural differences',
         'Demonstrates contributions toward solidarity']),
  ('MAKAKALIKASAN', 'MAKAKALIKASAN', 'Cares for the environment', 3,
   ARRAY['Cares for the environment and utilizes resources wisely, judiciously, and economically']),
  ('MAKABANSA', 'MAKABANSA', 'Demonstrates patriotism and nationalism', 4,
   ARRAY['Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
         'Demonstrates appropriate civic engagement in activities in the school, community, and country'])
) AS cv(code, name, description, display_order, indicators)
WHERE school.name LIKE '%Onotan Daganio Tagbobolo%'
ON CONFLICT (school_id, code) DO NOTHING;

-- Verify the insertion
SELECT cv.id, cv.code, cv.name, cv.indicators, s.name as school_name
FROM core_values cv
JOIN schools s ON cv.school_id = s.id
WHERE s.name LIKE '%Onotan%'
ORDER BY cv.display_order;
