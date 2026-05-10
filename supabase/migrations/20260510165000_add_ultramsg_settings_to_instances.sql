ALTER TABLE syncchat.whatsapp_instances
ADD COLUMN IF NOT EXISTS ultramsg_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE syncchat.whatsapp_instances
SET ultramsg_settings = COALESCE(ultramsg_settings, '{}'::jsonb)
WHERE ultramsg_settings IS NULL;
