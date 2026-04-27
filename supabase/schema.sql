-- =====================================================
-- SyncChat - Supabase Database Schema
-- Run this in Supabase SQL Editor to set up your DB
-- =====================================================

--=====================================================
-- SCHEMA
-- =====================================================
CREATE SCHEMA IF NOT EXISTS syncchat;

-- Grant usage to Supabase roles
GRANT USAGE ON SCHEMA syncchat TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA syncchat
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA syncchat
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA syncchat
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- =====================================================
-- ORGANIZATIONS (tenants)
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  settings    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PROFILES (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION syncchat.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO syncchat.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION syncchat.handle_new_user();

-- =====================================================
-- ORG MEMBERS (multi-tenant user-org relationships)
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES syncchat.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('super_admin', 'org_admin', 'agent', 'viewer')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- =====================================================
-- WHATSAPP INSTANCES
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.whatsapp_instances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  instance_id  TEXT NOT NULL,
  token        TEXT NOT NULL,
  phone_number TEXT,
  status       TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'qr_required', 'loading')),
  webhook_url  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CONTACTS
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  name        TEXT,
  email       TEXT,
  tags        TEXT[] DEFAULT '{}',
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, phone)
);

-- =====================================================
-- CONVERSATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  instance_id      UUID NOT NULL REFERENCES syncchat.whatsapp_instances(id) ON DELETE CASCADE,
  contact_id       UUID NOT NULL REFERENCES syncchat.contacts(id) ON DELETE CASCADE,
  assigned_to      UUID REFERENCES syncchat.profiles(id),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending', 'bot')),
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ,
  unread_count     INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES syncchat.conversations(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  direction        TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type             TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'vcard', 'contact', 'reaction')),
  content          TEXT NOT NULL,
  media_url        TEXT,
  status           TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  sent_by          UUID REFERENCES syncchat.profiles(id),
  ultramsg_id      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- MESSAGE TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.message_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('marketing', 'utility', 'authentication', 'custom')),
  content     TEXT NOT NULL,
  variables   TEXT[] DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SCHEDULED BULK MESSAGES
-- =====================================================
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

-- =====================================================
-- N8N FLOWS
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.n8n_flows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  n8n_workflow_id     TEXT NOT NULL DEFAULT '',
  webhook_url         TEXT,
  trigger_type        TEXT NOT NULL DEFAULT 'inbound_message'
                      CHECK (trigger_type IN ('inbound_message', 'keyword', 'new_contact', 'manual', 'schedule')),
  trigger_config      JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ORG SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS syncchat.org_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL UNIQUE REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  auto_reply_enabled      BOOLEAN NOT NULL DEFAULT false,
  auto_reply_message      TEXT,
  business_hours_enabled  BOOLEAN NOT NULL DEFAULT false,
  business_hours          JSONB,
  away_message            TEXT,
  n8n_base_url            TEXT,
  n8n_api_key             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user_id    ON syncchat.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id     ON syncchat.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_id   ON syncchat.conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact  ON syncchat.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status   ON syncchat.conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conv_id       ON syncchat.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id        ON syncchat.messages(org_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_bulk_org_status_next_run ON syncchat.scheduled_bulk_messages(org_id, status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_bulk_instance_id         ON syncchat.scheduled_bulk_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_bulk_template_id         ON syncchat.scheduled_bulk_messages(template_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id        ON syncchat.contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone         ON syncchat.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_instances_org_id       ON syncchat.whatsapp_instances(org_id);
CREATE INDEX IF NOT EXISTS idx_flows_org_id           ON syncchat.n8n_flows(org_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE syncchat.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.org_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.contacts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.message_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.scheduled_bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.n8n_flows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncchat.org_settings       ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's org_ids
CREATE OR REPLACE FUNCTION syncchat.auth_user_org_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(org_id)
  FROM syncchat.org_members
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is super admin
CREATE OR REPLACE FUNCTION syncchat.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM syncchat.org_members
      WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Public onboarding helper: create an organization, its first membership, and settings.
CREATE OR REPLACE FUNCTION public.create_onboarding_organization(org_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = syncchat, public, auth
AS $$
DECLARE
  new_org_id uuid;
  slug_base text;
  slug text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  slug_base := regexp_replace(lower(trim(org_name)), '[^a-z0-9]+', '-', 'g');
  slug_base := regexp_replace(slug_base, '(^-|-$)', '', 'g');
  IF slug_base IS NULL OR slug_base = '' THEN
    slug_base := 'organization';
  END IF;
  slug := slug_base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  INSERT INTO syncchat.organizations (name, slug, plan)
  VALUES (trim(org_name), slug, 'free')
  RETURNING id INTO new_org_id;

  INSERT INTO syncchat.org_members (org_id, user_id, role, is_active)
  VALUES (new_org_id, auth.uid(), 'org_admin', true);

  INSERT INTO syncchat.org_settings (
    org_id,
    auto_reply_enabled,
    auto_reply_message,
    business_hours_enabled
  )
  VALUES (new_org_id, false, '', false);

  RETURN new_org_id;
END;
$$;

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON syncchat.profiles;
DROP POLICY IF EXISTS "profiles_update" ON syncchat.profiles;
CREATE POLICY "profiles_select" ON syncchat.profiles FOR SELECT
  USING (id = auth.uid() OR syncchat.is_super_admin());
CREATE POLICY "profiles_update" ON syncchat.profiles FOR UPDATE
  USING (id = auth.uid());

-- Organizations
DROP POLICY IF EXISTS "orgs_select" ON syncchat.organizations;
DROP POLICY IF EXISTS "orgs_update" ON syncchat.organizations;
DROP POLICY IF EXISTS "orgs_insert" ON syncchat.organizations;
CREATE POLICY "orgs_select" ON syncchat.organizations FOR SELECT
  USING (id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "orgs_update" ON syncchat.organizations FOR UPDATE
  USING (id = ANY(syncchat.auth_user_org_ids()) AND EXISTS (
    SELECT 1 FROM syncchat.org_members
    WHERE user_id = auth.uid() AND org_id = syncchat.organizations.id
      AND role IN ('org_admin', 'super_admin')
  ));
CREATE POLICY "orgs_insert" ON syncchat.organizations FOR INSERT
  WITH CHECK (true);

-- Org members
DROP POLICY IF EXISTS "members_select" ON syncchat.org_members;
DROP POLICY IF EXISTS "members_insert" ON syncchat.org_members;
DROP POLICY IF EXISTS "members_update" ON syncchat.org_members;
DROP POLICY IF EXISTS "members_delete" ON syncchat.org_members;
CREATE POLICY "members_select" ON syncchat.org_members FOR SELECT
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "members_insert" ON syncchat.org_members FOR INSERT
  WITH CHECK (
    org_id = ANY(syncchat.auth_user_org_ids())
    OR syncchat.is_super_admin()
    OR (
      user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1
        FROM syncchat.org_members existing
        WHERE existing.org_id = syncchat.org_members.org_id
      )
    )
  );
CREATE POLICY "members_update" ON syncchat.org_members FOR UPDATE
  USING (org_id = ANY(syncchat.auth_user_org_ids()));
CREATE POLICY "members_delete" ON syncchat.org_members FOR DELETE
  USING (org_id = ANY(syncchat.auth_user_org_ids()));

-- Tenant-scoped tables
DROP POLICY IF EXISTS "instances_all" ON syncchat.whatsapp_instances;
DROP POLICY IF EXISTS "contacts_all" ON syncchat.contacts;
DROP POLICY IF EXISTS "conversations_all" ON syncchat.conversations;
DROP POLICY IF EXISTS "messages_all" ON syncchat.messages;
DROP POLICY IF EXISTS "templates_all" ON syncchat.message_templates;
DROP POLICY IF EXISTS "scheduled_bulk_all" ON syncchat.scheduled_bulk_messages;
DROP POLICY IF EXISTS "flows_all" ON syncchat.n8n_flows;
DROP POLICY IF EXISTS "settings_all" ON syncchat.org_settings;
CREATE POLICY "instances_all" ON syncchat.whatsapp_instances FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "contacts_all" ON syncchat.contacts FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "conversations_all" ON syncchat.conversations FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "messages_all" ON syncchat.messages FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "templates_all" ON syncchat.message_templates FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "scheduled_bulk_all" ON syncchat.scheduled_bulk_messages FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "flows_all" ON syncchat.n8n_flows FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());
CREATE POLICY "settings_all" ON syncchat.org_settings FOR ALL
  USING (org_id = ANY(syncchat.auth_user_org_ids()) OR syncchat.is_super_admin());

-- =====================================================
-- UTILITY FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION syncchat.increment_unread(conv_id UUID)
RETURNS INTEGER AS $$
  UPDATE syncchat.conversations
  SET unread_count = unread_count + 1
  WHERE id = conv_id
  RETURNING unread_count;
$$ LANGUAGE sql;

-- =====================================================
-- REALTIME
-- Enable in Supabase: Database → Replication
-- Tables: syncchat.conversations, syncchat.messages
-- =====================================================

-- =====================================================
-- AFTER FIRST SIGNUP — make yourself super admin:
-- UPDATE syncchat.org_members SET role = 'super_admin'
-- WHERE user_id = '<your-user-id>';
-- =====================================================
