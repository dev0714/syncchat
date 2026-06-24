-- Enforce one flow per WhatsApp instance.
-- Duplicate flow rows for the same instance caused the n8n workflow's
-- "Get a row2" lookup to return multiple rows, which ran the AI Agent
-- (and the WhatsApp send) once per row — producing duplicate replies.
ALTER TABLE syncchat.n8n_flows
  ADD CONSTRAINT n8n_flows_instance_id_key UNIQUE (instance_id);
