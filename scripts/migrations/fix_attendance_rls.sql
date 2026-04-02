-- =====================================================
-- FIX: RLS policies for personal workspace tables
-- Run this in Supabase SQL Editor (production)
-- Date: 2026-04-02
-- Issue: "new row violates row-level security policy"
-- Covers: attendance_records, homeroom_guidance_grades,
--          core_value_grades, grades
-- =====================================================

-- ── attendance_records ──
DROP POLICY IF EXISTS "attendance_all_access" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_rls_policy" ON attendance_records;
DROP POLICY IF EXISTS "Enable all access for attendance" ON attendance_records;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_records_rls_policy" ON attendance_records
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── homeroom_guidance_grades ──
DROP POLICY IF EXISTS "homeroom_guidance_grades_rls_policy" ON homeroom_guidance_grades;
DROP POLICY IF EXISTS "homeroom_guidance_all_access" ON homeroom_guidance_grades;
ALTER TABLE homeroom_guidance_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homeroom_guidance_grades_rls_policy" ON homeroom_guidance_grades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── core_value_grades ──
DROP POLICY IF EXISTS "core_value_grades_rls_policy" ON core_value_grades;
DROP POLICY IF EXISTS "core_value_grades_all_access" ON core_value_grades;
ALTER TABLE core_value_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "core_value_grades_rls_policy" ON core_value_grades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── grades ──
DROP POLICY IF EXISTS "grades_rls_policy" ON grades;
DROP POLICY IF EXISTS "grades_all_access" ON grades;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades_rls_policy" ON grades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Verify all policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('attendance_records', 'homeroom_guidance_grades', 'core_value_grades', 'grades')
ORDER BY tablename;
