import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * Master AI switch for a single instance.
 * PATCH { enabled: boolean } -> stores ultramsg_settings.ai_enabled.
 * When false, the inbound n8n flow skips the AI reply for this instance's
 * conversations (it still logs inbound messages). Allowed for super admins and
 * org admins of the instance's organization.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: inst } = await supabase
    .from("whatsapp_instances")
    .select("id, org_id, ultramsg_settings")
    .eq("id", params.id)
    .single();
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: members } = await supabase
    .from("org_members")
    .select("org_id, role, is_active")
    .eq("user_id", currentUser.userId)
    .eq("is_active", true);
  const isOrgAdmin = (members ?? []).some(
    (m) => m.org_id === inst.org_id && (m.role === "org_admin" || m.role === "super_admin"),
  );
  const canManage = currentUser.role === "super_admin" || isOrgAdmin;
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = body.enabled !== false; // default to enabled

  const settings = (inst.ultramsg_settings as Record<string, unknown> | null) ?? {};
  const { error } = await supabase
    .from("whatsapp_instances")
    .update({ ultramsg_settings: { ...settings, ai_enabled: enabled }, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, ai_enabled: enabled });
}
