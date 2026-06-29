import { createAdminClient } from "@/lib/supabase/admin";

export interface PlatformSettings {
  ultramsg_instance_id: string | null;
  ultramsg_token: string | null;
  waha_base_url: string | null;
  waha_api_key: string | null;
  waha_session: string | null;
}

/** Reads the singleton platform_settings row (provider credentials). */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("ultramsg_instance_id, ultramsg_token, waha_base_url, waha_api_key, waha_session")
    .eq("id", 1)
    .maybeSingle();
  return {
    ultramsg_instance_id: data?.ultramsg_instance_id ?? null,
    ultramsg_token: data?.ultramsg_token ?? null,
    waha_base_url: data?.waha_base_url ?? null,
    waha_api_key: data?.waha_api_key ?? null,
    waha_session: data?.waha_session ?? null,
  };
}
