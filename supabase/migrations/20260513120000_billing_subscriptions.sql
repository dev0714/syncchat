-- Billing subscriptions — tracks Paystack payment records per org
CREATE TABLE IF NOT EXISTS syncchat.billing_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL,
  paystack_reference  TEXT NOT NULL UNIQUE,
  amount_cents        INTEGER NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'ZAR',
  billing_period      TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  tier_conversations  INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  paystack_data       JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at             TIMESTAMPTZ
);

ALTER TABLE syncchat.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Grant service role full access (app uses admin client)
GRANT ALL ON syncchat.billing_subscriptions TO service_role;

-- Index for org lookups
CREATE INDEX IF NOT EXISTS billing_subscriptions_org_id_idx
  ON syncchat.billing_subscriptions (org_id, created_at DESC);
