-- =====================================================
-- Migration: Fix Remaining RLS Gaps
-- Date: June 18, 2026
-- Project: edusync-sis-production (ojahhzdibhfrjazgwvfw)
--
-- Context:
--   Verified against production database on 2026-06-18 via:
--     SELECT t.tablename, t.rowsecurity, COUNT(p.policyname) AS policies
--     FROM pg_tables t
--     LEFT JOIN pg_policies p
--       ON p.schemaname=t.schemaname AND p.tablename=t.tablename
--     WHERE t.schemaname='public'
--     GROUP BY t.tablename, t.rowsecurity
--     HAVING t.rowsecurity=false OR COUNT(p.policyname)=0;
--
--   18 tables flagged:
--     1 with RLS OFF      -> division_users
--                            (triggers Supabase "rls_disabled_in_public" warning)
--     17 with RLS ON, 0 policies -> silent deny-all for anon role,
--                                   breaking frontend features.
--
-- Strategy (matches established repo pattern from
-- 20260318_enable_rls_all_tables.sql):
--   - Enable RLS where off.
--   - Add a permissive `USING(true) WITH CHECK(true)` policy for
--     anon + authenticated roles.
--   - Application-layer authorization (Firebase custom claims +
--     hooks) continues to enforce role/school isolation.
--   - service_role bypasses RLS entirely (backend scripts unaffected).
--
-- Safety notes:
--   - division_users: the historical 42P17 recursion was caused by
--     policies on `divisions` and `districts` that referenced
--     division_users. Those were dropped by 20260318_enable_rls_all_tables.sql
--     (lines 211 and 225). A flat USING(true) policy on division_users
--     itself is non-recursive and safe.
--   - All blocks use DROP POLICY IF EXISTS so the migration is
--     idempotent and re-runnable.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. division_users (RLS currently OFF — the warning trigger)
-- =====================================================
ALTER TABLE division_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "division_users_rls_policy" ON division_users;
CREATE POLICY "division_users_rls_policy" ON division_users
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =====================================================
-- 2. Tables with RLS ON but zero policies (silent deny-all)
--    Order: alphabetical for review clarity.
-- =====================================================

-- announcements
DROP POLICY IF EXISTS "announcements_rls_policy" ON announcements;
CREATE POLICY "announcements_rls_policy" ON announcements
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- class_schedules
DROP POLICY IF EXISTS "class_schedules_rls_policy" ON class_schedules;
CREATE POLICY "class_schedules_rls_policy" ON class_schedules
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ecr_component_grades
DROP POLICY IF EXISTS "ecr_component_grades_rls_policy" ON ecr_component_grades;
CREATE POLICY "ecr_component_grades_rls_policy" ON ecr_component_grades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ecr_weights
DROP POLICY IF EXISTS "ecr_weights_rls_policy" ON ecr_weights;
CREATE POLICY "ecr_weights_rls_policy" ON ecr_weights
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- elln_assessments
DROP POLICY IF EXISTS "elln_assessments_rls_policy" ON elln_assessments;
CREATE POLICY "elln_assessments_rls_policy" ON elln_assessments
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- enrollment_applications
DROP POLICY IF EXISTS "enrollment_applications_rls_policy" ON enrollment_applications;
CREATE POLICY "enrollment_applications_rls_policy" ON enrollment_applications
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- lesson_plans
DROP POLICY IF EXISTS "lesson_plans_rls_policy" ON lesson_plans;
CREATE POLICY "lesson_plans_rls_policy" ON lesson_plans
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- login_audit
DROP POLICY IF EXISTS "login_audit_rls_policy" ON login_audit;
CREATE POLICY "login_audit_rls_policy" ON login_audit
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- payment_history
DROP POLICY IF EXISTS "payment_history_rls_policy" ON payment_history;
CREATE POLICY "payment_history_rls_policy" ON payment_history
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- rate_limit_blocks
DROP POLICY IF EXISTS "rate_limit_blocks_rls_policy" ON rate_limit_blocks;
CREATE POLICY "rate_limit_blocks_rls_policy" ON rate_limit_blocks
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- referral_codes
DROP POLICY IF EXISTS "referral_codes_rls_policy" ON referral_codes;
CREATE POLICY "referral_codes_rls_policy" ON referral_codes
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- referral_credits_per_year (TABLE in prod, not a view —
-- verified via SELECT viewname FROM pg_views WHERE schemaname='public')
DROP POLICY IF EXISTS "referral_credits_per_year_rls_policy" ON referral_credits_per_year;
CREATE POLICY "referral_credits_per_year_rls_policy" ON referral_credits_per_year
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- referrals
DROP POLICY IF EXISTS "referrals_rls_policy" ON referrals;
CREATE POLICY "referrals_rls_policy" ON referrals
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- school_invitations
DROP POLICY IF EXISTS "school_invitations_rls_policy" ON school_invitations;
CREATE POLICY "school_invitations_rls_policy" ON school_invitations
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_rls_policy" ON subscriptions;
CREATE POLICY "subscriptions_rls_policy" ON subscriptions
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- usage_tracking
DROP POLICY IF EXISTS "usage_tracking_rls_policy" ON usage_tracking;
CREATE POLICY "usage_tracking_rls_policy" ON usage_tracking
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- workspace_migrations
DROP POLICY IF EXISTS "workspace_migrations_rls_policy" ON workspace_migrations;
CREATE POLICY "workspace_migrations_rls_policy" ON workspace_migrations
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMIT;

-- =====================================================
-- VERIFY (run after COMMIT — should return ZERO rows):
--
--   SELECT t.tablename, t.rowsecurity, COUNT(p.policyname) AS policies
--   FROM pg_tables t
--   LEFT JOIN pg_policies p
--     ON p.schemaname=t.schemaname AND p.tablename=t.tablename
--   WHERE t.schemaname='public'
--   GROUP BY t.tablename, t.rowsecurity
--   HAVING t.rowsecurity=false OR COUNT(p.policyname)=0
--   ORDER BY t.rowsecurity, t.tablename;
-- =====================================================
