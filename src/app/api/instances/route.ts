import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

type InstancePayload = {
  id?: string;
  orgId?: string;
  name?: string;
  instance_id?: string;
  token?: string;
  phone_number?: string | null;
  webhook_url?: string | null;
};

async function resolveContext() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = createAdminClient();
  const { data: members, error } = await supabase
    .from("org_members")
    .select("org_id, role, is_active")
    .eq("user_id", currentUser.userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  const member = members?.[0] ?? null;
  const orgId = member?.org_id ?? currentUser.orgId ?? null;
  if (!orgId) {
    return { error: NextResponse.json({ error: "No organization membership found." }, { status: 404 }) };
  }

  return {
    currentUser,
    member,
    orgId,
    isSuperAdmin: currentUser.role === "super_admin" || member?.role === "super_admin",
    supabase,
  };
}

export async function GET() {
  const ctx = await resolveContext();
  if ("error" in ctx) return ctx.error;

  const { supabase, currentUser, member, orgId, isSuperAdmin } = ctx;
  const { data: instances, error } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user: currentUser,
    member,
    orgId,
    isSuperAdmin,
    instances: instances ?? [],
  });
}

export async function POST(request: NextRequest) {
  const ctx = await resolveContext();
  if ("error" in ctx) return ctx.error;
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as InstancePayload;
  if (!body.name || !body.instance_id || !body.token) {
    return NextResponse.json({ error: "Name, instance ID, and token are required." }, { status: 400 });
  }

  const { error } = await ctx.supabase.from("whatsapp_instances").insert({
    org_id: body.orgId ?? ctx.orgId,
    name: body.name,
    instance_id: body.instance_id,
    token: body.token,
    phone_number: body.phone_number || null,
    webhook_url: body.webhook_url || null,
    status: "disconnected",
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const ctx = await resolveContext();
  if ("error" in ctx) return ctx.error;
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as InstancePayload;
  if (!body.id || !body.name || !body.instance_id || !body.token) {
    return NextResponse.json({ error: "Instance ID, name, and token are required." }, { status: 400 });
  }

  const { error } = await ctx.supabase.from("whatsapp_instances").update({
    name: body.name,
    instance_id: body.instance_id,
    token: body.token,
    phone_number: body.phone_number || null,
    webhook_url: body.webhook_url || null,
    updated_at: new Date().toISOString(),
  }).eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const ctx = await resolveContext();
  if ("error" in ctx) return ctx.error;
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as InstancePayload;
  if (!body.id) {
    return NextResponse.json({ error: "Instance ID is required." }, { status: 400 });
  }

  const { error } = await ctx.supabase.from("whatsapp_instances").delete().eq("id", body.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
