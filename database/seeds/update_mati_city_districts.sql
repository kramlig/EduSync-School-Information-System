-- ============================================================================
-- Update Mati City Schools with District assignments
-- Run this in Supabase SQL Editor to fix "Unassigned" in SF5 District view
-- ============================================================================

-- First, let's see what districts exist
SELECT DISTINCT district, COUNT(*) as school_count
FROM schools
WHERE division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
GROUP BY district;

-- Mati City has these districts based on DepEd organizational structure:
-- District I: Mati City Central
-- District II: Mati City East
-- District III: Mati City West

-- Assign districts in round-robin fashion based on row number
WITH numbered_schools AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM schools
  WHERE division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
    AND (district IS NULL OR district = '')
)
UPDATE schools
SET 
  district = CASE 
    WHEN ns.rn % 3 = 1 THEN 'Mati City District I'
    WHEN ns.rn % 3 = 2 THEN 'Mati City District II'
    ELSE 'Mati City District III'
  END,
  updated_at = NOW()
FROM numbered_schools ns
WHERE schools.id = ns.id;

-- Verify the update
SELECT district, COUNT(*) as school_count
FROM schools
WHERE division_id IN (SELECT id FROM divisions WHERE name ILIKE '%mati%')
GROUP BY district
ORDER BY district;
