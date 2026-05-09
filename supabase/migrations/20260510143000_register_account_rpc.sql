CREATE OR REPLACE FUNCTION public.register_account_and_organization(
  p_name text,
  p_email text,
  p_password_hash text,
  p_org_name text
)
RETURNS TABLE (
  user_id uuid,
  org_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = syncchat, public, pg_temp
AS $$
DECLARE
  new_org_id uuid;
  new_user_id uuid;
  slug_base text;
  slug_suffix text;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF p_password_hash IS NULL OR btrim(p_password_hash) = '' THEN
    RAISE EXCEPTION 'Password hash is required';
  END IF;
  IF p_org_name IS NULL OR btrim(p_org_name) = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM syncchat.users u
    WHERE lower(u.email) = lower(btrim(p_email))
  ) THEN
    RAISE EXCEPTION 'An account with this email already exists';
  END IF;

  slug_base := lower(regexp_replace(btrim(p_org_name), '[^a-z0-9]+', '-', 'g'));
  slug_base := regexp_replace(slug_base, '^-+|-+$', '', 'g');
  IF slug_base = '' THEN
    slug_base := 'organization';
  END IF;
  slug_suffix := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  INSERT INTO syncchat.organizations (name, slug, plan)
  VALUES (btrim(p_org_name), slug_base || '-' || slug_suffix, 'free')
  RETURNING id INTO new_org_id;

  INSERT INTO syncchat.users (
    email,
    name,
    password_hash,
    org_id,
    role,
    is_active
  )
  VALUES (
    lower(btrim(p_email)),
    btrim(p_name),
    p_password_hash,
    new_org_id,
    'admin',
    true
  )
  RETURNING id INTO new_user_id;

  INSERT INTO syncchat.org_members (org_id, user_id, role, is_active)
  VALUES (new_org_id, new_user_id, 'org_admin', true);

  INSERT INTO syncchat.org_settings (org_id, auto_reply_enabled, auto_reply_message, business_hours_enabled)
  VALUES (new_org_id, false, '', false);

  user_id := new_user_id;
  org_id := new_org_id;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_account_and_organization(text, text, text, text) TO anon, authenticated, service_role;
