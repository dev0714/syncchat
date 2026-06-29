-- Add the `source` column to messages so all outbound logging paths
-- (direct dashboard replies, bulk, scheduled bulk) persist correctly.
-- Without this column the inserts in those routes silently failed, so
-- human-agent replies sent from the dashboard never appeared in the thread.
ALTER TABLE syncchat.messages
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'direct';
