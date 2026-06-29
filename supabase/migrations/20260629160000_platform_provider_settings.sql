-- Platform-wide provider credentials (singleton). Super admin fills these once
-- (UltraMsg shared account + WAHA server); assigning an instance just picks a
-- provider and copies the matching creds in the background.
CREATE TABLE IF NOT EXISTS syncchat.platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  ultramsg_instance_id text,
  ultramsg_token text,
  waha_base_url text,
  waha_api_key text,
  waha_session text DEFAULT 'default',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id = 1)
);
INSERT INTO syncchat.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
