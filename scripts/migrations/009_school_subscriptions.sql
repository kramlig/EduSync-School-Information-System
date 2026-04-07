-- ============================================================================
-- Migration 009: Institutional School Subscriptions
-- Date: April 7, 2026
--
-- Adds subscription management for institutional schools (Tier 3).
-- Separate from personal `subscriptions` table because:
--   - Keyed by school_id (org-level), not user_id (individual)
--   - Different plan tiers: trial / starter / professional / enterprise
--   - Different limits: students, teachers, sections, feature flags
--
-- Also adds school_id column to payment_history for school billing history.
-- ============================================================================

-- =====================================================
-- 1. CREATE school_subscriptions TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS school_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Plan info
  plan TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial', 'starter', 'professional', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'past_due')),
  
  -- Limits per plan
  max_students INTEGER NOT NULL DEFAULT 100,
  max_teachers INTEGER NOT NULL DEFAULT 5,
  max_sections INTEGER NOT NULL DEFAULT 10,
  
  -- Feature flags
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  parent_portal_enabled BOOLEAN NOT NULL DEFAULT false,
  division_reporting BOOLEAN NOT NULL DEFAULT false,
  advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  
  -- PayMongo billing
  payment_provider TEXT DEFAULT 'paymongo',
  payment_provider_customer_id TEXT,
  payment_provider_subscription_id TEXT,
  billing_cycle TEXT CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'yearly')),
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'PHP',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Audit
  subscribed_by TEXT,  -- Firebase UID of admin who initiated the subscription
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One subscription per school
  CONSTRAINT school_subscriptions_school_id_key UNIQUE (school_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_school_subs_status ON school_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_school_subs_plan ON school_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_school_subs_trial_ends ON school_subscriptions(trial_ends_at)
  WHERE status = 'trial' AND trial_ends_at IS NOT NULL;

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================
ALTER TABLE school_subscriptions ENABLE ROW LEVEL SECURITY;

-- Superadmins and admins can view their school's subscription
CREATE POLICY school_sub_select ON school_subscriptions
  FOR SELECT USING (
    school_id IN (
      SELECT u.school_id FROM users u
      WHERE u.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
        AND u.role IN ('superadmin', 'admin')
        AND u.deleted_at IS NULL
    )
  );

-- Only superadmins can update subscription
CREATE POLICY school_sub_update ON school_subscriptions
  FOR UPDATE USING (
    school_id IN (
      SELECT u.school_id FROM users u
      WHERE u.firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
        AND u.role = 'superadmin'
        AND u.deleted_at IS NULL
    )
  );

-- Service role can do anything (for webhooks, cron jobs)
CREATE POLICY school_sub_service ON school_subscriptions
  FOR ALL USING (
    current_setting('role', true) = 'service_role'
  );

-- =====================================================
-- 3. AUTO-CREATE TRIAL ON NEW SCHOOL INSERT
-- =====================================================
CREATE OR REPLACE FUNCTION create_school_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for institutional schools (not personal workspaces)
  IF NEW.type = 'institutional' OR NEW.type IS NULL THEN
    INSERT INTO school_subscriptions (
      school_id, plan, status, 
      max_students, max_teachers, max_sections,
      trial_ends_at
    ) VALUES (
      NEW.id, 'trial', 'trial',
      100, 5, 10,
      NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (school_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_school_trial_subscription
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION create_school_trial_subscription();

-- =====================================================
-- 4. PLAN LIMITS FUNCTION (for reference/validation)
-- =====================================================
CREATE OR REPLACE FUNCTION get_school_plan_limits(p_plan TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN CASE p_plan
    WHEN 'trial' THEN jsonb_build_object(
      'max_students', 100, 'max_teachers', 5, 'max_sections', 10,
      'ai_enabled', false, 'parent_portal_enabled', false,
      'division_reporting', false, 'advanced_analytics', false, 'priority_support', false
    )
    WHEN 'starter' THEN jsonb_build_object(
      'max_students', 500, 'max_teachers', 99999, 'max_sections', 99999,
      'ai_enabled', false, 'parent_portal_enabled', true,
      'division_reporting', false, 'advanced_analytics', false, 'priority_support', false
    )
    WHEN 'professional' THEN jsonb_build_object(
      'max_students', 1500, 'max_teachers', 99999, 'max_sections', 99999,
      'ai_enabled', true, 'parent_portal_enabled', true,
      'division_reporting', true, 'advanced_analytics', true, 'priority_support', true
    )
    WHEN 'enterprise' THEN jsonb_build_object(
      'max_students', 99999, 'max_teachers', 99999, 'max_sections', 99999,
      'ai_enabled', true, 'parent_portal_enabled', true,
      'division_reporting', true, 'advanced_analytics', true, 'priority_support', true
    )
    ELSE get_school_plan_limits('trial')
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 5. ADD school_id TO payment_history
-- =====================================================
ALTER TABLE payment_history
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

CREATE INDEX IF NOT EXISTS idx_payment_history_school_id ON payment_history(school_id)
  WHERE school_id IS NOT NULL;

-- =====================================================
-- 6. BACKFILL: Create trial rows for existing schools
--    trial_ends_at = NULL → grandfathered (no forced upgrade)
-- =====================================================
INSERT INTO school_subscriptions (
  school_id, plan, status,
  max_students, max_teachers, max_sections,
  ai_enabled, parent_portal_enabled, division_reporting,
  advanced_analytics, priority_support,
  trial_ends_at
)
SELECT 
  s.id, 'trial', 'trial',
  100, 5, 10,
  false, false, false,
  false, false,
  NULL  -- No expiry for existing schools (grandfathered)
FROM schools s
WHERE (s.type IS NULL OR s.type = 'institutional')
  AND NOT EXISTS (
    SELECT 1 FROM school_subscriptions ss WHERE ss.school_id = s.id
  );

-- =====================================================
-- 7. HELPER RPC: Get school subscription (for client)
-- =====================================================
CREATE OR REPLACE FUNCTION get_school_subscription(p_school_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT * INTO v_sub
  FROM school_subscriptions
  WHERE school_id = p_school_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'id', v_sub.id,
    'school_id', v_sub.school_id,
    'plan', v_sub.plan,
    'status', v_sub.status,
    'max_students', v_sub.max_students,
    'max_teachers', v_sub.max_teachers,
    'max_sections', v_sub.max_sections,
    'ai_enabled', v_sub.ai_enabled,
    'parent_portal_enabled', v_sub.parent_portal_enabled,
    'division_reporting', v_sub.division_reporting,
    'advanced_analytics', v_sub.advanced_analytics,
    'priority_support', v_sub.priority_support,
    'billing_cycle', v_sub.billing_cycle,
    'amount_cents', v_sub.amount_cents,
    'current_period_start', v_sub.current_period_start,
    'current_period_end', v_sub.current_period_end,
    'trial_ends_at', v_sub.trial_ends_at,
    'created_at', v_sub.created_at,
    'updated_at', v_sub.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================
DO $$
DECLARE
  total_schools INTEGER;
  total_subs INTEGER;
  trial_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_schools 
  FROM schools WHERE type IS NULL OR type = 'institutional';
  
  SELECT COUNT(*) INTO total_subs FROM school_subscriptions;
  
  SELECT COUNT(*) INTO trial_count 
  FROM school_subscriptions WHERE plan = 'trial';
  
  RAISE NOTICE 'Institutional schools: %, Subscriptions created: %, Trial plans: %',
    total_schools, total_subs, trial_count;
END $$;
