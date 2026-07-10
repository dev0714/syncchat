import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import { waha, WAHA_INBOUND_WEBHOOK } from "@/lib/waha";
import { meta } from "@/lib/meta";
import { getPlatformSettings } from "@/lib/platform-settings";

type InstancePayload = {
  id?: string;
  orgId?: string;
  name?: string;
  provider?: "ultramsg" | "waha" | "meta";
  phone_number?: string | null;
  /** Optional WAHA session name. Blank → auto-derived from the instance name. */
  waha_session?: string | null;
  /** Meta Cloud API per-instance credentials. */
  meta_phone_number_id?: string | null;
  meta_access_token?: string | null;
};

function normalizeProvider(value?: string): "ultramsg" | "waha" | "meta" {
  return value === "waha" ? "waha" : value === "meta" ? "meta" : "ultramsg";
}

/**
 * Validate Meta Cloud API creds against the Graph API and return the instance-row
 * creds (instance_id = phone_number_id, token = access token). Errors are surfaced
 * to the admin so bad tokens are caught at save time.
 */
async function resolveMetaCreds(phoneNumberId?: string | null, accessToken?: string | null) {
  const id = String(phoneNumberId ?? "").trim();
  const token = String(accessToken ?? "").trim();
  if (!id || !token) {
    return { error: "Meta Cloud API needs both a Phone Number ID and an Access Token." };
  }
  const check = await meta.verifyNumber(id, token);
  if (!check.ok) {
    return { error: `Meta rejected the credentials: ${check.error}` };
  }
  return {
    creds: { instance_id: id, token, base_url: null as string | null },
    displayPhoneNumber: check.displayPhoneNumber ?? null,
  };
}

/** Turn arbitrary text into a valid WAHA session name (a-z, 0-9, dashes). */
function slugifySession(input: string): string {
  const base = String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "session";
}

/**
 * Each WAHA number is a separate WAHA session. Derive a unique session name from
 * the requested name (or instance name), appending -2, -3… if it collides with an
 * existing WAHA instance.
 */
async function uniqueWahaSession(
  supabase: ReturnType<typeof createAdminClient>,
  desired: string,
): Promise<string> {
  const base = slugifySession(desired);
  let candidate = base;
  let n = 1;
  // Bounded loop; in practice resolves in 1–2 iterations.
  while (n < 100) {
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("provider", "waha")
      .eq("instance_id", candidate)
      .maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Resolve provider credentials from the platform settings (super-admin "Provider
 * Settings"). The assign form only picks a provider; everything else is background.
 * Returns the instance-row creds (instance_id, token, base_url) for the provider.
 */
async function resolveProviderCreds(provider: "ultramsg" | "waha", sessionName?: string) {
  const s = await getPlatformSettings();
  if (provider === "waha") {
    if (!s.waha_base_url || !s.waha_api_key) {
      return { error: "WAHA is not configured. Set the WAHA server in Provider Settings first." };
    }
    // Per-instance session name (each WAHA number = its own session). Falls back
    // to the platform default only when no name is supplied (legacy single-number).
    const session = (sessionName && sessionName.trim()) || s.waha_session || "default";
    // Best-effort: make sure the session exists/started on the WAHA server,
    // wired to the inbound AI webhook so messages reach the flow.
    await waha.startSession(s.waha_base_url, s.waha_api_key, session, WAHA_INBOUND_WEBHOOK);
    return { creds: { instance_id: session, token: s.waha_api_key, base_url: s.waha_base_url } };
  }
  if (!s.ultramsg_instance_id || !s.ultramsg_token) {
    return { error: "UltraMsg is not configured. Set the UltraMsg account in Provider Settings first." };
  }
  return { creds: { instance_id: s.ultramsg_instance_id, token: s.ultramsg_token, base_url: null as string | null } };
}

async function requireSuperAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);
  if (!isSuperAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { currentUser };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const supabase = createAdminClient();
  const [orgRes, instanceRes] = await Promise.all([
    supabase.from("organizations").select("*").order("created_at", { ascending: false }),
    supabase.from("whatsapp_instances").select("*").order("created_at", { ascending: true }),
  ]);

  if (orgRes.error) {
    return NextResponse.json({ error: orgRes.error.message }, { status: 500 });
  }

  if (instanceRes.error) {
    return NextResponse.json({ error: instanceRes.error.message }, { status: 500 });
  }

  const orgs = (orgRes.data ?? []).map((org) => ({
    ...org,
    instances: (instanceRes.data ?? []).filter((inst) => inst.org_id === org.id),
  }));

  return NextResponse.json({ orgs });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as InstancePayload;
  if (!body.orgId || !body.name) {
    return NextResponse.json({ error: "Organization and name are required." }, { status: 400 });
  }

  const provider = normalizeProvider(body.provider);
  const supabase = createAdminClient();

  let creds: { instance_id: string; token: string; base_url: string | null };
  let phoneNumber = body.phone_number || null;
  let status = "disconnected";

  if (provider === "meta") {
    const resolved = await resolveMetaCreds(body.meta_phone_number_id, body.meta_access_token);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });
    creds = resolved.creds;
    phoneNumber = phoneNumber || (resolved.displayPhoneNumber ? `+${resolved.displayPhoneNumber.replace(/[^\d]/g, "")}` : null);
    status = "connected"; // Cloud API has no QR pairing; valid creds = live.
  } else {
    // For WAHA, give every new instance its own unique session name.
    let sessionName: string | undefined;
    if (provider === "waha") {
      sessionName = await uniqueWahaSession(supabase, body.waha_session || body.name);
    }
    const resolved = await resolveProviderCreds(provider, sessionName);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });
    creds = resolved.creds;
  }

  const { error } = await supabase.from("whatsapp_instances").insert({
    org_id: body.orgId,
    name: body.name,
    provider,
    base_url: creds.base_url,
    instance_id: creds.instance_id,
    token: creds.token,
    phone_number: phoneNumber,
    webhook_url: null,
    ultramsg_settings: {},
    status,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as InstancePayload;
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "A target record and name are required." }, { status: 400 });
  }

  const provider = normalizeProvider(body.provider);
  const supabase = createAdminClient();

  // Preserve the existing WAHA session on edit — re-resolving would reset it to
  // the shared default and orphan the linked number. Only mint a new session when
  // switching an instance INTO waha from another provider.
  const { data: existing } = await supabase
    .from("whatsapp_instances")
    .select("provider, instance_id, token")
    .eq("id", body.id)
    .maybeSingle();

  let creds: { instance_id: string; token: string; base_url: string | null };

  if (provider === "meta") {
    // Blank token on edit keeps the stored one (so admins can update other fields
    // without re-pasting the secret).
    const keepToken = existing?.provider === "meta" && !String(body.meta_access_token ?? "").trim();
    const resolved = await resolveMetaCreds(
      body.meta_phone_number_id || (existing?.provider === "meta" ? existing.instance_id : null),
      keepToken ? existing?.token : body.meta_access_token,
    );
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });
    creds = resolved.creds;
  } else {
    let sessionName: string | undefined;
    if (provider === "waha") {
      sessionName =
        existing?.provider === "waha" && existing.instance_id
          ? existing.instance_id
          : await uniqueWahaSession(supabase, body.waha_session || body.name);
    }
    const resolved = await resolveProviderCreds(provider, sessionName);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });
    creds = resolved.creds;
  }

  const { error } = await supabase.from("whatsapp_instances").update({
    name: body.name,
    provider,
    base_url: creds.base_url,
    instance_id: creds.instance_id,
    token: creds.token,
    phone_number: body.phone_number || null,
    updated_at: new Date().toISOString(),
  }).eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as InstancePayload;
  if (!body.id) {
    return NextResponse.json({ error: "Instance ID is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_instances").delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
