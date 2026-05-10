import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";

const BASE = "https://api.ultramsg.com";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: inst } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch status (returns JSON)
  let statusData: { status?: { accountStatus?: { status: string; substatus?: string } } } | null = null;
  let statusError: string | null = null;
  try {
    const res = await fetch(`${BASE}/${inst.instance_id}/instance/status?token=${inst.token}`, { cache: "no-store" });
    statusData = await res.json();
  } catch (e) {
    statusError = String(e);
  }

  // Fetch QR (returns raw PNG — convert to base64)
  let qrBase64: string | null = null;
  let qrError: string | null = null;
  try {
    const res = await fetch(`${BASE}/${inst.instance_id}/instance/qr?token=${inst.token}`, { cache: "no-store" });
    const contentType = res.headers.get("content-type") ?? "image/png";
    if (contentType.includes("image")) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      qrBase64 = `data:${contentType};base64,${base64}`;
    } else {
      // Might be JSON error
      const text = await res.text();
      qrError = text;
    }
  } catch (e) {
    qrError = String(e);
  }

  // Derive clean status string: response.status.accountStatus.status
  const accountStatus = statusData?.status?.accountStatus?.status ?? null;

  // Update DB
  if (accountStatus) {
    let dbStatus: string;
    if (accountStatus === "authenticated") dbStatus = "connected";
    else if (accountStatus === "qr") dbStatus = "qr_required";
    else if (accountStatus === "loading") dbStatus = "loading";
    else dbStatus = "disconnected";

    await supabase.from("whatsapp_instances").update({
      status: dbStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", params.id);
  }

  return NextResponse.json({
    accountStatus,
    substatus: statusData?.status?.accountStatus?.substatus ?? null,
    qrImage: qrBase64,
    statusError,
    qrError,
  });
}
