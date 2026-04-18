-- Allow a signed-in user to create their first organization during onboarding.
-- Apply this migration to the Supabase project that powers SyncChat.

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
  slug := slug_base || '-' || substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8);

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

GRANT EXECUTE ON FUNCTION public.create_onboarding_organization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_onboarding_organization(text) TO service_role;
