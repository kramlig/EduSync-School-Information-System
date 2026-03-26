-- ============================================
-- Migration: Fix ECR RLS Policies for Personal Workspaces
-- Date: March 26, 2026
--
-- Problem:
--   ecr_activities INSERT policy validates teacher_id exists in
--   teachers table via EXISTS subquery. This blocks personal
--   workspace users when the session teacher_id doesn't match
--   exactly (data inconsistency, auth path differences).
--
-- Fix:
--   Align ECR INSERT policies with the rest of the schema
--   (students, sections, grades, teaching_assignments) which
--   use permissive RLS and rely on application-layer school
--   isolation via Firebase Auth custom claims.
--
-- Tables affected:
--   ecr_activities  — INSERT policy simplified
--   ecr_scores      — INSERT policy simplified
-- ============================================

-- =====================================================
-- ecr_activities: Replace strict INSERT with permissive
-- =====================================================
DROP POLICY IF EXISTS "Teachers can create activities" ON ecr_activities;

CREATE POLICY "Teachers can create activities" ON ecr_activities
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

-- =====================================================
-- ecr_scores: Replace strict INSERT with permissive
-- =====================================================
DROP POLICY IF EXISTS "Teachers can manage scores" ON ecr_scores;

CREATE POLICY "Teachers can manage scores" ON ecr_scores
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);
