-- Agents feature: human-agent availability + round-robin allocation state,
-- conversation assignment metadata, and holding-message settings.

-- Availability toggle + round-robin ordering on team members (agents).
ALTER TABLE syncchat.org_members
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_assigned_at timestamptz;

-- Assignment + holding-message bookkeeping on conversations.
-- (assigned_to already exists; we adopt it here.)
ALTER TABLE syncchat.conversations
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_holding_at timestamptz,
  ADD COLUMN IF NOT EXISTS holding_count integer NOT NULL DEFAULT 0;

-- Per-org holding-message configuration.
ALTER TABLE syncchat.org_settings
  ADD COLUMN IF NOT EXISTS holding_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS holding_message text,
  ADD COLUMN IF NOT EXISTS holding_interval_minutes integer NOT NULL DEFAULT 5;
