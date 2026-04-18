-- =====================================================
-- Custom Authentication Table (instead of Supabase Auth)
-- =====================================================

-- Add users table to syncchat schema
CREATE TABLE IF NOT EXISTS syncchat.users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  password_hash TEXT NOT NULL,
  org_id      UUID REFERENCES syncchat.organizations(id) ON DELETE CASCADE,
  role        TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON syncchat.users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON syncchat.users(org_id);

-- Enable RLS
ALTER TABLE syncchat.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own user data
CREATE POLICY "Users can read their own data"
ON syncchat.users FOR SELECT
USING (id = (current_setting('app.current_user_id', true)::uuid));

-- RLS Policy: Service role can insert
CREATE POLICY "Service role can insert users"
ON syncchat.users FOR INSERT
TO service_role
WITH CHECK (true);

-- RLS Policy: Service role can update
CREATE POLICY "Service role can update users"
ON syncchat.users FOR UPDATE
TO service_role
USING (true);

-- Create a function to safely check passwords (for API calls)
CREATE OR REPLACE FUNCTION syncchat.get_user_by_email(email_input TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  password_hash TEXT,
  org_id UUID,
  role TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.name, u.password_hash, u.org_id, u.role, u.is_active
  FROM syncchat.users u
  WHERE u.email = email_input AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update last login
CREATE OR REPLACE FUNCTION syncchat.update_last_login(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE syncchat.users
  SET last_login = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create test organization and user
INSERT INTO syncchat.organizations (name, slug, plan)
VALUES ('Test Company', 'test-company', 'free')
ON CONFLICT (slug) DO NOTHING;

-- This password hash is for 'password123' using bcrypt
-- You'll need to generate real hashes in your app
-- For now, this is a placeholder - run the setup script to create real users
INSERT INTO syncchat.users (email, name, password_hash, org_id, role, is_active)
SELECT 
  'admin@test.leadsync.co.za',
  'Test Admin',
  '$2b$10$YourBcryptHashHere', -- Replace with actual bcrypt hash
  o.id,
  'admin',
  true
FROM syncchat.organizations o
WHERE o.slug = 'test-company'
ON CONFLICT (email) DO NOTHING;

GRANT USAGE ON SCHEMA syncchat TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION syncchat.get_user_by_email TO service_role;
GRANT EXECUTE ON FUNCTION syncchat.update_last_login TO service_role;
