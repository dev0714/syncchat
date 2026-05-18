-- Add prompt_tools column to n8n_flows to store selected AI tool configurations
ALTER TABLE syncchat.n8n_flows
  ADD COLUMN IF NOT EXISTS prompt_tools JSONB NOT NULL DEFAULT '[]'::jsonb;
