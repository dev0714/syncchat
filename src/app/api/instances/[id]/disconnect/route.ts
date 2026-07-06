import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { waha } from "@/lib/waha";
import { ultraMsg } from "@/lib/ultramsg";

/**
 * Disconnect (unlink) a WhatsApp instance: log the number out of the provider
 * while keeping the SyncChat instance row, so it can be re-paired by scanning a
 * fresh QR. WAHA -> session logout; UltraMsg -> instance/logout.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: inst } = await supabase.from("whatsapp_instances").select("*").eq("id", params.id).single();
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: members } = await supabase
    .from("org_members")
    .select("org_id, role, is_active")
    .eq("user_id", currentUser.userId)
    .eq("is_active", true);
  const canAccess = currentUser.role === "super_admin" || (members ?? []).some((member) => member.org_id === inst.org_id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    if (inst.provider === "waha") {
      await waha.logoutSession(inst.base_url ?? "", inst.token, inst.instance_id);
    } else if (inst.provider === "meta") {
      // Cloud API has no session to log out — just mark it disconnected here.
    } else {
      await ultraMsg.logout(inst.instance_id, inst.token);
    }

    await supabase
      .from("whatsapp_instances")
      .update({ status: "disconnected", updated_at: new Date().toISOString() })
      .eq("id", params.id);

    return NextResponse.json({ status: "disconnected" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
