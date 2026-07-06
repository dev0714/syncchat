-- Third WhatsApp provider: the official Meta WhatsApp Business Cloud API.
-- For meta rows: instance_id = phone_number_id, token = permanent access token,
-- base_url unused (Graph API base is fixed). Credentials are per-instance since
-- every client brings their own Meta app/WABA.
ALTER TABLE syncchat.whatsapp_instances DROP CONSTRAINT IF EXISTS whatsapp_instances_provider_check;
ALTER TABLE syncchat.whatsapp_instances ADD CONSTRAINT whatsapp_instances_provider_check
  CHECK (provider IN ('ultramsg','waha','meta'));
