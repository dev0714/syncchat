-- Add trial period tracking to organizations
ALTER TABLE syncchat.organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Existing free-plan orgs: backfill 14-day trial from creation date
UPDATE syncchat.organizations
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE plan = 'free' AND trial_ends_at IS NULL;
