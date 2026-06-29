import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";

async function requireSuperAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);
  if (!isSuperAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { currentUser };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("ultramsg_instance_id, ultramsg_token, waha_base_url, waha_api_key, waha_session")
    .eq("id", 1)
    .maybeSingle();

  return NextResponse.json({ settings: data ?? {} });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const update = {
    ultramsg_instance_id: body.ultramsg_instance_id ?? null,
    ultramsg_token: body.ultramsg_token ?? null,
    waha_base_url: body.waha_base_url ?? null,
    waha_api_key: body.waha_api_key ?? null,
    waha_session: body.waha_session?.trim() || "default",
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("platform_settings").select("id").eq("id", 1).maybeSingle();
  if (existing) {
    await supabase.from("platform_settings").update(update).eq("id", 1);
  } else {
    await supabase.from("platform_settings").insert({ id: 1, ...update });
  }

  return NextResponse.json({ success: true });
}
