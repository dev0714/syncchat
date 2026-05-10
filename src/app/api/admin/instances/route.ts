import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import { ultraMsg } from "@/lib/ultramsg";

type InstancePayload = {
  id?: string;
  orgId?: string;
  name?: string;
  instance_id?: string;
  token?: string;
  phone_number?: string | null;
  webhook_url?: string | null;
  ultramsg_settings?: {
    sendDelay?: number | string;
    sendDelayMax?: number | string;
    webhook_url?: string;
    webhook_message_received?: boolean;
    webhook_message_create?: boolean;
    webhook_message_ack?: boolean;
    webhook_message_download_media?: boolean;
  };
};

function normalizeSettings(body: InstancePayload) {
  const settings = body.ultramsg_settings ?? {};
  const webhookUrl = settings.webhook_url ?? body.webhook_url ?? "";
  return {
    sendDelay: Number(settings.sendDelay ?? 1),
    sendDelayMax: Number(settings.sendDelayMax ?? 15),
    webhook_url: webhookUrl,
    webhook_message_received: Boolean(settings.webhook_message_received),
    webhook_message_create: Boolean(settings.webhook_message_create),
    webhook_message_ack: Boolean(settings.webhook_message_ack),
    webhook_message_download_media: Boolean(settings.webhook_message_download_media),
  };
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
  if (!body.orgId || !body.name || !body.instance_id || !body.token) {
    return NextResponse.json(
      { error: "Organization, name, instance ID, and token are required." },
      { status: 400 }
    );
  }

  const settings = normalizeSettings(body);
  try {
    await ultraMsg.updateInstanceSettings(body.instance_id, {
      token: body.token,
      ...settings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to apply UltraMsg instance settings." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_instances").insert({
    org_id: body.orgId,
    name: body.name,
    instance_id: body.instance_id,
    token: body.token,
    phone_number: body.phone_number || null,
    webhook_url: settings.webhook_url || null,
    ultramsg_settings: settings,
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
  if (!body.id || !body.name || !body.instance_id || !body.token) {
    return NextResponse.json(
      { error: "Instance ID, name, token, and a target record are required." },
      { status: 400 }
    );
  }

  const settings = normalizeSettings(body);
  try {
    await ultraMsg.updateInstanceSettings(body.instance_id, {
      token: body.token,
      ...settings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to apply UltraMsg instance settings." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_instances").update({
    name: body.name,
    instance_id: body.instance_id,
    token: body.token,
    phone_number: body.phone_number || null,
    webhook_url: settings.webhook_url || null,
    ultramsg_settings: settings,
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
