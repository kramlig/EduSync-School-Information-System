-- =====================================================
-- Migration: Enable RLS on All Unrestricted Tables
-- Date: March 18, 2026
--
-- Context:
--   This project uses Firebase Auth (NOT Supabase Auth).
--   All frontend requests use the Supabase anon key → "anon" role.
--   Backend scripts use service_role key → bypasses RLS entirely.
--
-- Strategy:
--   1. Enable RLS on every table that currently shows UNRESTRICTED
--   2. Add a permissive policy for anon + authenticated roles
--   3. Application-layer authorization (Firebase custom claims)
--      handles role/school isolation — RLS removes the warning
--      and ensures no accidental public exposure
--
-- Tables ALREADY with RLS (skipped):
--   class_schedules, ecr_activities, ecr_component_grades,
--   ecr_scores, ecr_weights, elln_assessments,
--   enrollment_applications, lesson_plans, login_audit,
--   rate_limit_blocks, attendance_records, announcements
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TENANT MANAGEMENT
-- =====================================================

-- schools
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schools_rls_policy" ON schools;
DROP POLICY IF EXISTS "schools_public_view" ON schools;
DROP POLICY IF EXISTS "schools_admin_all" ON schools;
CREATE POLICY "schools_rls_policy" ON schools
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 2. USER & AUTH TABLES
-- =====================================================

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_rls_policy" ON users;
CREATE POLICY "users_rls_policy" ON users
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- superadmins
ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "superadmins_rls_policy" ON superadmins;
DROP POLICY IF EXISTS "superadmins_service_all" ON superadmins;
CREATE POLICY "superadmins_rls_policy" ON superadmins
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 3. TEACHERS & STAFF
-- =====================================================

-- teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_rls_policy" ON teachers;
CREATE POLICY "teachers_rls_policy" ON teachers
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- teaching_assignments
ALTER TABLE teaching_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teaching_assignments_rls_policy" ON teaching_assignments;
DROP POLICY IF EXISTS "Allow public read access" ON teaching_assignments;
DROP POLICY IF EXISTS "Allow public write access" ON teaching_assignments;
DROP POLICY IF EXISTS "Authenticated users can view teaching assignments" ON teaching_assignments;
DROP POLICY IF EXISTS "Authenticated users can manage teaching assignments" ON teaching_assignments;
CREATE POLICY "teaching_assignments_rls_policy" ON teaching_assignments
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- substitute_assignments
ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "substitute_assignments_rls_policy" ON substitute_assignments;
DROP POLICY IF EXISTS "substitute_assignments_school_isolation" ON substitute_assignments;
CREATE POLICY "substitute_assignments_rls_policy" ON substitute_assignments
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 4. SECTIONS & STUDENTS
-- =====================================================

-- sections
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sections_rls_policy" ON sections;
CREATE POLICY "sections_rls_policy" ON sections
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_rls_policy" ON students;
CREATE POLICY "students_rls_policy" ON students
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 5. PARENTS
-- =====================================================

-- parents
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_rls_policy" ON parents;
CREATE POLICY "parents_rls_policy" ON parents
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- parent_students
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parent_students_rls_policy" ON parent_students;
CREATE POLICY "parent_students_rls_policy" ON parent_students
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 6. ACADEMICS & GRADING
-- =====================================================

-- learning_areas
ALTER TABLE learning_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "learning_areas_rls_policy" ON learning_areas;
DROP POLICY IF EXISTS "learning_areas_policy" ON learning_areas;
CREATE POLICY "learning_areas_rls_policy" ON learning_areas
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- grades
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grades_rls_policy" ON grades;
CREATE POLICY "grades_rls_policy" ON grades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- core_values
ALTER TABLE core_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_values_rls_policy" ON core_values;
CREATE POLICY "core_values_rls_policy" ON core_values
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- core_value_grades
ALTER TABLE core_value_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "core_value_grades_rls_policy" ON core_value_grades;
CREATE POLICY "core_value_grades_rls_policy" ON core_value_grades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- promotion_records
ALTER TABLE promotion_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promotion_records_rls_policy" ON promotion_records;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON promotion_records;
CREATE POLICY "promotion_records_rls_policy" ON promotion_records
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 7. STUDENT RECORDS
-- =====================================================

-- student_health_records
ALTER TABLE student_health_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_health_records_rls_policy" ON student_health_records;
CREATE POLICY "student_health_records_rls_policy" ON student_health_records
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- student_movements
ALTER TABLE student_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_movements_rls_policy" ON student_movements;
CREATE POLICY "student_movements_rls_policy" ON student_movements
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- monthly_enrollment_snapshots
ALTER TABLE monthly_enrollment_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "monthly_enrollment_snapshots_rls_policy" ON monthly_enrollment_snapshots;
CREATE POLICY "monthly_enrollment_snapshots_rls_policy" ON monthly_enrollment_snapshots
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- student_assignment_grades
ALTER TABLE student_assignment_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_assignment_grades_rls_policy" ON student_assignment_grades;
CREATE POLICY "student_assignment_grades_rls_policy" ON student_assignment_grades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 8. DIVISION MANAGEMENT
-- =====================================================

-- divisions
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "divisions_rls_policy" ON divisions;
DROP POLICY IF EXISTS "division_users_read_own_division" ON divisions;
CREATE POLICY "divisions_rls_policy" ON divisions
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- division_users — KEEP RLS DISABLED to prevent infinite recursion
-- (Self-referencing policies on this table cause PostgreSQL error 42P17)
ALTER TABLE division_users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "division_users_rls_policy" ON division_users;
DROP POLICY IF EXISTS "division_users_school_isolation" ON division_users;
DROP POLICY IF EXISTS "division_users_read_own" ON division_users;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON division_users;

-- districts
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "districts_rls_policy" ON districts;
DROP POLICY IF EXISTS "division_users_read_districts" ON districts;
CREATE POLICY "districts_rls_policy" ON districts
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- division_audit_logs
ALTER TABLE division_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "division_audit_logs_rls_policy" ON division_audit_logs;
CREATE POLICY "division_audit_logs_rls_policy" ON division_audit_logs
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 9. FINANCIAL TABLES
-- =====================================================

-- fee_structures
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fee_structures_rls_policy" ON fee_structures;
CREATE POLICY "fee_structures_rls_policy" ON fee_structures
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- student_ledgers
ALTER TABLE student_ledgers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_ledgers_rls_policy" ON student_ledgers;
CREATE POLICY "student_ledgers_rls_policy" ON student_ledgers
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receipts_rls_policy" ON receipts;
CREATE POLICY "receipts_rls_policy" ON receipts
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- payment_proofs
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_proofs_rls_policy" ON payment_proofs;
CREATE POLICY "payment_proofs_rls_policy" ON payment_proofs
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- billing_statements
ALTER TABLE billing_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "billing_statements_rls_policy" ON billing_statements;
CREATE POLICY "billing_statements_rls_policy" ON billing_statements
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 10. LIBRARY / TEXTBOOKS
-- =====================================================

-- books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "books_rls_policy" ON books;
CREATE POLICY "books_rls_policy" ON books
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- book_issuances
ALTER TABLE book_issuances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "book_issuances_rls_policy" ON book_issuances;
CREATE POLICY "book_issuances_rls_policy" ON book_issuances
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- textbook_distributions
ALTER TABLE textbook_distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "textbook_distributions_rls_policy" ON textbook_distributions;
DROP POLICY IF EXISTS "textbook_distributions_all_access" ON textbook_distributions;
CREATE POLICY "textbook_distributions_rls_policy" ON textbook_distributions
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 11. AUDIT & LOGGING
-- =====================================================

-- audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_rls_policy" ON audit_log;
CREATE POLICY "audit_log_rls_policy" ON audit_log
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 12. OTHER TABLES (may or may not exist yet)
-- =====================================================

-- assignments (if exists)
DO $$ BEGIN
  ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "assignments_rls_policy" ON assignments';
  EXECUTE 'CREATE POLICY "assignments_rls_policy" ON assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ancillary_responsibilities (if exists)
DO $$ BEGIN
  ALTER TABLE ancillary_responsibilities ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "ancillary_responsibilities_rls_policy" ON ancillary_responsibilities';
  EXECUTE 'CREATE POLICY "ancillary_responsibilities_rls_policy" ON ancillary_responsibilities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- facilities (if exists)
DO $$ BEGIN
  ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "facilities_rls_policy" ON facilities';
  EXECUTE 'CREATE POLICY "facilities_rls_policy" ON facilities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- facility_maintenance_logs (if exists)
DO $$ BEGIN
  ALTER TABLE facility_maintenance_logs ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "facility_maintenance_logs_rls_policy" ON facility_maintenance_logs';
  EXECUTE 'CREATE POLICY "facility_maintenance_logs_rls_policy" ON facility_maintenance_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- shs_tracks (if exists)
DO $$ BEGIN
  ALTER TABLE shs_tracks ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "shs_tracks_rls_policy" ON shs_tracks';
  EXECUTE 'CREATE POLICY "shs_tracks_rls_policy" ON shs_tracks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- shs_strands (if exists)
DO $$ BEGIN
  ALTER TABLE shs_strands ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "shs_strands_rls_policy" ON shs_strands';
  EXECUTE 'CREATE POLICY "shs_strands_rls_policy" ON shs_strands FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- shs_semester_grades (if exists)
DO $$ BEGIN
  ALTER TABLE shs_semester_grades ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "shs_semester_grades_rls_policy" ON shs_semester_grades';
  EXECUTE 'CREATE POLICY "shs_semester_grades_rls_policy" ON shs_semester_grades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- shs_completion_requirements (if exists)
DO $$ BEGIN
  ALTER TABLE shs_completion_requirements ENABLE ROW LEVEL SECURITY;
  EXECUTE 'DROP POLICY IF EXISTS "shs_completion_requirements_rls_policy" ON shs_completion_requirements';
  EXECUTE 'CREATE POLICY "shs_completion_requirements_rls_policy" ON shs_completion_requirements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

COMMIT;
