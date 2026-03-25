-- =====================================================
-- Migration 005: Payment History & Subscription Lifecycle
--
-- Creates a payment_history table to record every payment
-- event from PayMongo webhooks. Fixes billing history
-- (was previously just returning current subscription).
--
-- Also adds an index on subscriptions for lifecycle queries.
-- =====================================================

BEGIN;

-- 1. Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                          -- Firebase UID
  payment_provider TEXT NOT NULL DEFAULT 'paymongo',
  payment_provider_id TEXT,                       -- PayMongo payment/checkout ID
  checkout_session_id TEXT,                       -- PayMongo checkout session ID
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  status TEXT NOT NULL DEFAULT 'paid'
    CHECK (status IN ('paid', 'failed', 'refunded', 'pending')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  description TEXT,
  payment_method_type TEXT,                       -- 'gcash', 'card', 'paymaya', 'grab_pay'
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_date ON payment_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_provider_id ON payment_history(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- 2. RPC: Get billing history for a user (ordered by date descending)
CREATE OR REPLACE FUNCTION get_billing_history(
  p_firebase_uid TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(ph)::jsonb ORDER BY ph.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      id,
      payment_provider_id,
      amount_cents,
      currency,
      status,
      billing_cycle,
      description,
      payment_method_type,
      receipt_url,
      period_start,
      period_end,
      created_at
    FROM payment_history
    WHERE user_id = p_firebase_uid
    ORDER BY created_at DESC
    LIMIT p_limit
  ) ph;

  RETURN v_result;
END;
$$;

-- 3. Add index on subscriptions.user_id + status for faster lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status);

COMMIT;
