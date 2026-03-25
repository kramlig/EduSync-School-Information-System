-- ============================================================================
-- EduSync Personal Mode — Phase 2 Database Migration
-- 
-- Creates tables and modifies existing ones to support personal workspaces.
-- Run against: Supabase PostgreSQL (edusync-sis project)
--
-- IMPORTANT: Run this migration in a transaction. If any statement fails,
-- roll back the entire migration.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. SUBSCRIPTIONS TABLE (tracks user tier & billing)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                    -- Firebase UID
  tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro', 'school')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),

  -- Limits based on tier
  max_students INT NOT NULL DEFAULT 50,
  max_teaching_sections INT NOT NULL DEFAULT 1,
  max_advisory_sections INT NOT NULL DEFAULT 1,
  max_downloads_per_day INT NOT NULL DEFAULT 10,

  -- Billing (Phase 3 — PayMongo)
  payment_provider TEXT,
  payment_provider_customer_id TEXT,
  payment_provider_subscription_id TEXT,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_cents INT,
  currency TEXT DEFAULT 'PHP',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- 2. USAGE TRACKING TABLE (rate limits & analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,                             -- NULL for Tier 0 (anonymous)
  session_id TEXT,                          -- Browser session for anon users
  action TEXT NOT NULL,                     -- 'form_download', 'form_preview', 'grade_entry'
  form_type TEXT,                           -- 'sf5', 'sf9', 'sf2', etc.
  metadata JSONB DEFAULT '{}',
  ip_hash TEXT,                             -- Hashed IP for anon rate limiting
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_tracking(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_session_date ON usage_tracking(session_id, created_at);

-- =====================================================
-- 3. MODIFY SCHOOLS TABLE
--    Add type, owner_uid, tier columns for personal workspaces
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'type'
  ) THEN
    ALTER TABLE schools ADD COLUMN type TEXT NOT NULL DEFAULT 'institutional';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'owner_uid'
  ) THEN
    ALTER TABLE schools ADD COLUMN owner_uid TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'tier'
  ) THEN
    ALTER TABLE schools ADD COLUMN tier TEXT DEFAULT 'school';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'school_type'
  ) THEN
    ALTER TABLE schools ADD COLUMN school_type TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(type);
CREATE INDEX IF NOT EXISTS idx_schools_owner ON schools(owner_uid);

-- =====================================================
-- 4. MODIFY TEACHERS TABLE
--    Add workspace_type and tier columns
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teachers' AND column_name = 'workspace_type'
  ) THEN
    ALTER TABLE teachers ADD COLUMN workspace_type TEXT NOT NULL DEFAULT 'institutional';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teachers' AND column_name = 'tier'
  ) THEN
    ALTER TABLE teachers ADD COLUMN tier TEXT NOT NULL DEFAULT 'school';
  END IF;
END $$;

-- =====================================================
-- 5. RPC: Create personal workspace (atomic operation)
-- =====================================================
-- Drop old signature (without p_school_type) to avoid overload ambiguity
DROP FUNCTION IF EXISTS create_personal_workspace(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION create_personal_workspace(
  p_firebase_uid TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_school_name TEXT,
  p_school_id_number TEXT,
  p_division TEXT,
  p_region TEXT,
  p_district TEXT DEFAULT NULL,
  p_grade_level INT DEFAULT 6,
  p_school_type TEXT DEFAULT 'elementary',
  p_section_name TEXT DEFAULT 'My Class',
  p_school_year TEXT DEFAULT '2025-2026'
) RETURNS JSONB AS $$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
  v_teacher_id UUID;
  v_section_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Check if user already has a personal workspace
  IF EXISTS (SELECT 1 FROM schools WHERE owner_uid = p_firebase_uid AND type = 'personal') THEN
    RAISE EXCEPTION 'User already has a personal workspace';
  END IF;

  -- 1. Create virtual school
  INSERT INTO schools (name, school_id_number, division, region, district, type, owner_uid, tier, current_school_year, school_type)
  VALUES (p_school_name, NULLIF(p_school_id_number, ''), p_division, p_region, p_district, 'personal', p_firebase_uid, 'free', p_school_year, p_school_type)
  RETURNING id INTO v_school_id;

  -- 2. Create user record (required FK for teachers)
  INSERT INTO users (school_id, firebase_uid, email, role, name)
  VALUES (v_school_id, p_firebase_uid, p_email, 'admin', p_full_name)
  RETURNING id INTO v_user_id;

  -- 3. Create teacher record
  INSERT INTO teachers (school_id, user_id, firebase_uid, email, name, role, workspace_type, tier)
  VALUES (v_school_id, v_user_id, p_firebase_uid, p_email, p_full_name, 'admin', 'personal', 'free')
  RETURNING id INTO v_teacher_id;

  -- 4. Create default section
  INSERT INTO sections (school_id, name, grade_level, school_year, adviser_id)
  VALUES (v_school_id, p_section_name, p_grade_level, p_school_year, v_teacher_id)
  RETURNING id INTO v_section_id;

  -- 5. Create free subscription
  INSERT INTO subscriptions (user_id, tier, status, max_students, max_teaching_sections, max_advisory_sections, max_downloads_per_day)
  VALUES (p_firebase_uid, 'free', 'active', 50, 1, 1, 10)
  RETURNING id INTO v_subscription_id;

  -- Return all created IDs
  RETURN jsonb_build_object(
    'school_id', v_school_id,
    'teacher_id', v_teacher_id,
    'section_id', v_section_id,
    'subscription_id', v_subscription_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RPC: Get subscription for a user
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_subscription(p_firebase_uid TEXT)
RETURNS JSONB AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT * INTO v_sub FROM subscriptions
  WHERE user_id = p_firebase_uid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_sub.id,
    'tier', v_sub.tier,
    'status', v_sub.status,
    'max_students', v_sub.max_students,
    'max_teaching_sections', v_sub.max_teaching_sections,
    'max_advisory_sections', v_sub.max_advisory_sections,
    'max_downloads_per_day', v_sub.max_downloads_per_day,
    'current_period_end', v_sub.current_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. RPC: Get user's personal workspace school_id
-- =====================================================
CREATE OR REPLACE FUNCTION get_personal_workspace(p_firebase_uid TEXT)
RETURNS JSONB AS $$
DECLARE
  v_school RECORD;
  v_teacher RECORD;
BEGIN
  SELECT * INTO v_school FROM schools
  WHERE owner_uid = p_firebase_uid AND type = 'personal'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_teacher FROM teachers
  WHERE school_id = v_school.id AND firebase_uid = p_firebase_uid
  LIMIT 1;

  RETURN jsonb_build_object(
    'school_id', v_school.id,
    'school_name', v_school.name,
    'teacher_id', v_teacher.id,
    'teacher_name', v_teacher.name,
    'tier', v_school.tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
