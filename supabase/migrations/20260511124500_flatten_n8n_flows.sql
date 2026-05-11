ALTER TABLE syncchat.n8n_flows
  ADD COLUMN IF NOT EXISTS instance_id UUID,
  ADD COLUMN IF NOT EXISTS trigger_keyword TEXT,
  ADD COLUMN IF NOT EXISTS prompt_role TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompt_guardrails TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompt_tone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompt_context TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  ALTER TABLE syncchat.n8n_flows
    ADD CONSTRAINT n8n_flows_instance_id_fkey
    FOREIGN KEY (instance_id) REFERENCES syncchat.whatsapp_instances(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE syncchat.n8n_flows
SET
  instance_id = COALESCE(
    instance_id,
    CASE
      WHEN trigger_config ? 'instance_id'
       AND (trigger_config->>'instance_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (trigger_config->>'instance_id')::uuid
      ELSE NULL
    END
  ),
  trigger_keyword = COALESCE(trigger_keyword, trigger_config->>'keyword'),
  prompt_role = COALESCE(NULLIF(prompt_role, ''), COALESCE(trigger_config->'prompt'->>'role', '')),
  prompt_guardrails = COALESCE(NULLIF(prompt_guardrails, ''), COALESCE(trigger_config->'prompt'->>'guardrails', '')),
  prompt_tone = COALESCE(NULLIF(prompt_tone, ''), COALESCE(trigger_config->'prompt'->>'tone', '')),
  prompt_context = COALESCE(NULLIF(prompt_context, ''), COALESCE(trigger_config->'prompt'->>'context', '')),
  updated_at = now()
WHERE trigger_config IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_flows_instance_id ON syncchat.n8n_flows(instance_id);
CREATE INDEX IF NOT EXISTS idx_flows_trigger_keyword ON syncchat.n8n_flows(trigger_keyword);
