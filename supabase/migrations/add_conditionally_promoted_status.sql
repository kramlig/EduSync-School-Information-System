-- ============================================================================
-- Migration: Add 'conditionally_promoted' to promotion_status CHECK constraint
-- Run this in Supabase SQL Editor BEFORE running seed_mati_city_students_sf5.sql
-- ============================================================================

-- Drop the existing CHECK constraint
ALTER TABLE promotion_records DROP CONSTRAINT IF EXISTS promotion_records_promotion_status_check;

-- Add the updated CHECK constraint with 'conditionally_promoted'
ALTER TABLE promotion_records ADD CONSTRAINT promotion_records_promotion_status_check 
CHECK (promotion_status IN (
  'promoted',
  'conditionally_promoted',
  'retained',
  'pending',
  'graduated',
  'transferred'
));

-- Verify the constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'promotion_records'::regclass
  AND contype = 'c';
