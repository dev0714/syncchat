import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

const BASE = "https://api.ultramsg.com";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
    const res = await fetch(`${BASE}/${inst.instance_id}/instance/status?token=${inst.token}`, { cache: "no-store" });
    const data = await res.json();

    // Response shape: { status: { accountStatus: { status: "qr"|"authenticated"|..., substatus: "..." } } }
    const rawStatus = data?.status?.accountStatus?.status ?? data?.accountStatus ?? data?.status;

    let status: string;
    if (rawStatus === "authenticated") status = "connected";
    else if (rawStatus === "qr") status = "qr_required";
    else if (rawStatus === "loading") status = "loading";
    else status = "disconnected";

    await supabase.from("whatsapp_instances").update({
      status,
      updated_at: new Date().toISOString(),
    }).eq("id", params.id);

    return NextResponse.json({ status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
