import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import { waha, WAHA_INBOUND_WEBHOOK } from "@/lib/waha";

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

  // Meta Cloud API: no QR — status is simply whether the credentials still work.
  if (inst.provider === "meta") {
    const { meta } = await import("@/lib/meta");
    const check = await meta.verifyNumber(inst.instance_id, inst.token);
    const normalized = check.ok ? "connected" : "disconnected";
    await supabase.from("whatsapp_instances").update({ status: normalized, updated_at: new Date().toISOString() }).eq("id", params.id);
    return NextResponse.json({
      accountStatus: normalized,
      normalizedStatus: normalized,
      substatus: null,
      qrImage: null,
      phoneInfo: check.displayPhoneNumber ? { display_phone_number: check.displayPhoneNumber } : null,
      statusError: check.ok ? null : (check.error ?? null),
      qrError: null,
    });
  }

  // WAHA provider: use the session status + QR endpoints instead of UltraMsg.
  if (inst.provider === "waha") {
    const sessionStatus = await waha.getSessionStatus(inst.base_url ?? "", inst.token, inst.instance_id);
    let normalized = sessionStatus ?? "disconnected";
    if (sessionStatus === null) {
      // Session missing on the server → (re)create it with the inbound webhook.
      await waha.startSession(inst.base_url ?? "", inst.token, inst.instance_id, WAHA_INBOUND_WEBHOOK);
      normalized = "loading";
    } else if (normalized === "disconnected") {
      // FAILED/STOPPED → restart so a fresh QR is generated; report loading.
      await waha.restartSession(inst.base_url ?? "", inst.token, inst.instance_id);
      normalized = "loading";
    }
    let qrImage: string | null = null;
    if (normalized === "qr_required") {
      qrImage = await waha.getQrDataUrl(inst.base_url ?? "", inst.token, inst.instance_id);
    }
    await supabase.from("whatsapp_instances").update({ status: normalized, updated_at: new Date().toISOString() }).eq("id", params.id);
    return NextResponse.json({
      accountStatus: normalized,
      normalizedStatus: normalized,
      substatus: null,
      qrImage,
      phoneInfo: null,
      statusError: null,
      qrError: null,
    });
  }

  const normalizeStatus = (value: string | null) => {
    switch (value) {
      case "authenticated":
      case "standby":
        return "connected";
      case "qr":
        return "qr_required";
      case "initialize":
      case "retrying":
      case "loading":
        return "loading";
      case "disconnected":
        return "disconnected";
      default:
        return value;
    }
  };

  // Fetch status (returns JSON)
  let statusData: { status?: { accountStatus?: { status: string; substatus?: string } } } | null = null;
  let statusError: string | null = null;
  try {
    const res = await fetch(`${BASE}/${inst.instance_id}/instance/status?token=${inst.token}`, { cache: "no-store" });
    statusData = await res.json();
  } catch (e) {
    statusError = String(e);
  }

  const accountStatusRaw = statusData?.status?.accountStatus?.status?.toLowerCase() ?? null;

  // Fetch the connected phone only once the instance is authenticated.
  let phoneInfo: Record<string, unknown> | null = null;
  if (accountStatusRaw === "authenticated" || accountStatusRaw === "standby") {
    try {
      const res = await fetch(`${BASE}/${inst.instance_id}/instance/me?token=${inst.token}`, {
        cache: "no-store",
      });
      if (res.ok) {
        phoneInfo = await res.json();
      }
    } catch {
      // Ignore here; the status card below still shows connection state.
    }
  }

  // Fetch QR only when the instance is actually in QR mode.
  let qrBase64: string | null = null;
  let qrError: string | null = null;
  if (accountStatusRaw === "qr") {
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
  }

  // Derive clean status string: response.status.accountStatus.status
  const accountStatus = accountStatusRaw;
  const normalizedStatus = normalizeStatus(accountStatus);

  // Update DB
  if (normalizedStatus) {
    const dbStatus = normalizedStatus === "connected" ? "connected"
      : normalizedStatus === "qr_required" ? "qr_required"
      : normalizedStatus === "loading" ? "loading"
      : "disconnected";

    await supabase.from("whatsapp_instances").update({
      status: dbStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", params.id);
  }

  return NextResponse.json({
    accountStatus,
    normalizedStatus,
    substatus: statusData?.status?.accountStatus?.substatus ?? null,
    qrImage: qrBase64,
    phoneInfo,
    statusError,
    qrError,
  });
}
