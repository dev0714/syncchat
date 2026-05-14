-- Add subscription tracking fields to billing_subscriptions
ALTER TABLE syncchat.billing_subscriptions
  ADD COLUMN IF NOT EXISTS subscription_code TEXT,
  ADD COLUMN IF NOT EXISTS plan_code         TEXT;

-- Cache Paystack plan codes so we don't recreate them on every checkout
CREATE TABLE IF NOT EXISTS syncchat.paystack_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_conversations  INTEGER NOT NULL,
  billing_period      TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  plan_code           TEXT NOT NULL,
  amount_cents        INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tier_conversations, billing_period)
);

ALTER TABLE syncchat.paystack_plans ENABLE ROW LEVEL SECURITY;
GRANT ALL ON syncchat.paystack_plans TO service_role;
