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
    const res = await fetch(`${BASE}/${inst.instance_id}/instance/qr?token=${inst.token}`, { cache: "no-store" });
    const contentType = res.headers.get("content-type") ?? "image/png";

    if (contentType.includes("image")) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return NextResponse.json({ qrImage: `data:${contentType};base64,${base64}` });
    }

    return NextResponse.json({ qrImage: null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
