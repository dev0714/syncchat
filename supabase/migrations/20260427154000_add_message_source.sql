ALTER TABLE syncchat.messages
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct';

ALTER TABLE syncchat.messages
  DROP CONSTRAINT IF EXISTS messages_source_check;

ALTER TABLE syncchat.messages
  ADD CONSTRAINT messages_source_check
  CHECK (source IN ('direct', 'bulk', 'scheduled_bulk', 'system'));
