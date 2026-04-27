CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;

CREATE TABLE IF NOT EXISTS syncchat.scheduled_bulk_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  template_id         UUID REFERENCES syncchat.message_templates(id) ON DELETE SET NULL,
  instance_id         UUID NOT NULL REFERENCES syncchat.whatsapp_instances(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  schedule_type       TEXT NOT NULL CHECK (schedule_type IN ('one_time', 'recurring')),
  status              TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paused', 'processing', 'completed', 'failed', 'cancelled')),
  timezone            TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  scheduled_for       TIMESTAMPTZ,
  next_run_at         TIMESTAMPTZ NOT NULL,
  recurrence          JSONB,
  template_snapshot   JSONB NOT NULL,
  recipient_snapshot  JSONB NOT NULL DEFAULT '[]'::jsonb,
  variable_defaults   JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_run_at         TIMESTAMPTZ,
  last_result         JSONB,
  created_by          UUID REFERENCES syncchat.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_bulk_org_status_next_run
  ON syncchat.scheduled_bulk_messages(org_id, status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_bulk_instance_id
  ON syncchat.scheduled_bulk_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_bulk_template_id
  ON syncchat.scheduled_bulk_messages(template_id);

ALTER TABLE syncchat.scheduled_bulk_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scheduled_bulk_all" ON syncchat.scheduled_bulk_messages;
CREATE POLICY "scheduled_bulk_all" ON syncchat.scheduled_bulk_messages FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());

CREATE OR REPLACE FUNCTION public.trigger_scheduled_bulk_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dispatch_url text := current_setting('app.scheduler_url', true);
  dispatch_secret text := current_setting('app.scheduler_secret', true);
BEGIN
  IF dispatch_url IS NULL OR dispatch_secret IS NULL THEN
    RAISE EXCEPTION 'Scheduler URL and secret must be configured';
  END IF;

  PERFORM net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', dispatch_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_scheduled_bulk_dispatch() TO authenticated, service_role;

-- Example cron schedule:
-- select cron.schedule('scheduled-bulk-dispatch', '* * * * *', $$select public.trigger_scheduled_bulk_dispatch();$$);

SELECT cron.schedule(
  'scheduled-bulk-dispatch',
  '* * * * *',
  $$select public.trigger_scheduled_bulk_dispatch();$$
);
