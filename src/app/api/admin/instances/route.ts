import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";

type InstancePayload = {
  id?: string;
  orgId?: string;
  name?: string;
  instance_id?: string;
  token?: string;
  phone_number?: string | null;
};

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

  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_instances").insert({
    org_id: body.orgId,
    name: body.name,
    instance_id: body.instance_id,
    token: body.token,
    phone_number: body.phone_number || null,
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

  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_instances").update({
    name: body.name,
    instance_id: body.instance_id,
    token: body.token,
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
