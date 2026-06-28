-- Per-flow Terms & Conditions text. When set, the agent presents it at the
-- start of a new conversation and requires the customer to accept before
-- continuing.
ALTER TABLE syncchat.n8n_flows
  ADD COLUMN IF NOT EXISTS terms_conditions text;
