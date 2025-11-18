-- ==========================================
-- ADD BEHAVIORAL INDICATORS TO CORE VALUES
-- Run this in Supabase SQL Editor AFTER initial schema
-- ==========================================

-- Add indicators column to core_values table
ALTER TABLE core_values 
ADD COLUMN IF NOT EXISTS indicators TEXT[];

-- Add indicator_ratings column to core_value_grades table
ALTER TABLE core_value_grades 
ADD COLUMN IF NOT EXISTS indicator_ratings JSONB;

-- Update existing core values with behavioral indicators
UPDATE core_values SET indicators = ARRAY[
  'Expresses one''s spiritual beliefs while respecting the spiritual beliefs of others',
  'Shows adherence to ethical principles by upholding truth'
] WHERE code = 'MAKA_DIYOS';

UPDATE core_values SET indicators = ARRAY[
  'Is sensitive to individual, social, and cultural differences',
  'Demonstrates contributions toward solidarity'
] WHERE code = 'MAKATAO';

UPDATE core_values SET indicators = ARRAY[
  'Cares for the environment and utilizes resources wisely, judiciously, and economically'
] WHERE code = 'MAKAKALIKASAN';

UPDATE core_values SET indicators = ARRAY[
  'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
  'Demonstrates appropriate civic engagement out activities in the school, community, and country'
] WHERE code = 'MAKABANSA';

-- Update core_value_grades with indicator ratings for Q1
UPDATE core_value_grades cvg
SET indicator_ratings = (
  SELECT jsonb_build_object(
    'q1',
    (SELECT jsonb_object_agg(
      indicator,
      (ARRAY['AO', 'SO', 'RO', 'NO'])[1 + floor(random() * 4)]
    )
    FROM unnest(cv.indicators) AS indicator)
  )
  FROM core_values cv
  WHERE cv.id = cvg.core_value_id
  AND cv.indicators IS NOT NULL
  AND array_length(cv.indicators, 1) > 0
);

-- Verify update
SELECT code, name, indicators 
FROM core_values 
ORDER BY display_order;
