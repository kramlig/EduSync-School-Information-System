-- =====================================================
-- Referral System Migration
-- =====================================================
-- Adds referral tracking tables for the teacher referral program.
-- Business rules:
--   - Each user gets a unique referral code (FIRSTNAME-XXXX)
--   - When referred user upgrades to Pro, referrer gets 1 month free
--   - Referred user gets first month at ₱29 (discount code applied at checkout)
--   - Max 6 credited months per calendar year (anti-abuse)
-- =====================================================

-- Referral codes table — one per user
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,             -- Firebase UID of the referrer
  code TEXT NOT NULL UNIQUE,                -- e.g. "MARIA-A7X2"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);

-- Referral tracking — one row per referral attempt
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id TEXT NOT NULL,           -- Firebase UID of who shared the code
  referred_user_id TEXT,                    -- Firebase UID of who used it (NULL until signup)
  referred_email TEXT,                      -- Email of referred person (for tracking before signup)
  referral_code TEXT NOT NULL,              -- The code used
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed_up', 'converted', 'expired')),
  -- pending: code shared, no action yet
  -- signed_up: referred user created account
  -- converted: referred user upgraded to Pro → reward triggered
  -- expired: referral expired (30 days with no conversion)
  credited BOOLEAN NOT NULL DEFAULT FALSE,  -- Whether referrer received free month
  credit_month_start TIMESTAMPTZ,           -- When the free month starts
  credit_month_end TIMESTAMPTZ,             -- When the free month ends
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- View: credits used per user per year (for the 6/year cap)
CREATE OR REPLACE VIEW referral_credits_per_year AS
SELECT
  referrer_user_id,
  EXTRACT(YEAR FROM credit_month_start) AS credit_year,
  COUNT(*) AS credits_used
FROM referrals
WHERE credited = TRUE
GROUP BY referrer_user_id, EXTRACT(YEAR FROM credit_month_start);
