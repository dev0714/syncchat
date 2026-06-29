-- Second WhatsApp provider (WAHA) alongside UltraMsg, switchable per instance.
-- For WAHA rows: instance_id = session name, token = api_key, base_url = WAHA server URL.
-- UltraMsg rows are unchanged (base_url null → defaults to https://api.ultramsg.com).
ALTER TABLE syncchat.whatsapp_instances
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'ultramsg',
  ADD COLUMN IF NOT EXISTS base_url text;

ALTER TABLE syncchat.whatsapp_instances DROP CONSTRAINT IF EXISTS whatsapp_instances_provider_check;
ALTER TABLE syncchat.whatsapp_instances ADD CONSTRAINT whatsapp_instances_provider_check
  CHECK (provider IN ('ultramsg','waha'));
