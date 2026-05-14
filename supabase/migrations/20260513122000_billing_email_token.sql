-- Store email_token so we can programmatically cancel subscriptions
ALTER TABLE syncchat.billing_subscriptions
  ADD COLUMN IF NOT EXISTS email_token TEXT;
