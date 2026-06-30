import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import { waha, WAHA_INBOUND_WEBHOOK } from "@/lib/waha";
import { getPlatformSettings } from "@/lib/platform-settings";

type InstancePayload = {
  id?: string;
  orgId?: string;
  name?: string;
  provider?: "ultramsg" | "waha";
  phone_number?: string | null;
};

/**
 * Resolve provider credentials from the platform settings (super-admin "Provider
 * Settings"). The assign form only picks a provider; everything else is background.
 * Returns the instance-row creds (instance_id, token, base_url) for the provider.
 */
async function resolveProviderCreds(provider: "ultramsg" | "waha") {
  const s = await getPlatformSettings();
  if (provider === "waha") {
    if (!s.waha_base_url || !s.waha_api_key) {
      return { error: "WAHA is not configured. Set the WAHA server in Provider Settings first." };
    }
    const session = s.waha_session || "default";
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

  const provider = body.provider === "waha" ? "waha" : "ultramsg";
  const resolved = await resolveProviderCreds(provider);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_instances").insert({
    org_id: body.orgId,
    name: body.name,
    provider,
    base_url: resolved.creds.base_url,
    instance_id: resolved.creds.instance_id,
    token: resolved.creds.token,
    phone_number: body.phone_number || null,
    webhook_url: null,
    ultramsg_settings: {},
    status: "disconnected",
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

  const provider = body.provider === "waha" ? "waha" : "ultramsg";
  const resolved = await resolveProviderCreds(provider);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_instances").update({
    name: body.name,
    provider,
    base_url: resolved.creds.base_url,
    instance_id: resolved.creds.instance_id,
    token: resolved.creds.token,
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
