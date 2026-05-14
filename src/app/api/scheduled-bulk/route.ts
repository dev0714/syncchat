import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseJohannesburgDateTime } from "@/lib/scheduled-bulk";

async function resolveOrgId(userId: string, userOrgId: string | null) {
  if (userOrgId) return userOrgId;
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return member?.org_id ?? null;
}

export async function GET() {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(currentUser.userId, currentUser.orgId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const member = { org_id: orgId };

  const { data, error } = await supabase
    .from("scheduled_bulk_messages")
    .select(`
      *,
      template:message_templates(*),
      instance:whatsapp_instances(*)
    `)
    .eq("org_id", member.org_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedules: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(currentUser.userId, currentUser.orgId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const member = { org_id: orgId };

  const body = await req.json();
  const {
    name,
    templateId,
    instanceId,
    scheduleType,
    timezone = "Africa/Johannesburg",
    scheduledForLocal,
    recurrence,
    recipientIds,
    variableDefaults,
  } = body as {
    name?: string;
    templateId?: string;
    instanceId?: string;
    scheduleType?: "one_time" | "recurring";
    timezone?: string;
    scheduledForLocal?: string;
    recurrence?: Record<string, unknown>;
    recipientIds?: string[];
    variableDefaults?: Record<string, string>;
  };

  if (!name || !templateId || !instanceId || !scheduleType || !scheduledForLocal) {
    return NextResponse.json({ error: "Missing required schedule fields." }, { status: 400 });
  }

  if (!recipientIds || recipientIds.length === 0) {
    return NextResponse.json({ error: "Select at least one recipient." }, { status: 400 });
  }

  const scheduledFor = parseJohannesburgDateTime(scheduledForLocal);
  const { data: template } = await supabase
    .from("message_templates")
    .select("*")
    .eq("id", templateId)
    .eq("org_id", member.org_id)
    .single();

  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const { data: instance } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("id", instanceId)
    .eq("org_id", member.org_id)
    .single();

  if (!instance) {
    return NextResponse.json({ error: "Instance not found." }, { status: 404 });
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("org_id", member.org_id)
    .in("id", recipientIds);

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ error: "Selected recipients were not found." }, { status: 404 });
  }

  const { error } = await supabase.from("scheduled_bulk_messages").insert({
    org_id: member.org_id,
    template_id: template.id,
    instance_id: instance.id,
    name,
    schedule_type: scheduleType,
    status: "scheduled",
    timezone,
    scheduled_for: scheduledFor.toISOString(),
    next_run_at: scheduledFor.toISOString(),
    recurrence: scheduleType === "recurring" ? recurrence ?? {} : null,
    template_snapshot: {
      name: template.name,
      content: template.content,
      variables: template.variables ?? [],
    },
    recipient_snapshot: contacts.map((contact) => ({
      id: contact.id,
      phone: contact.phone,
      name: contact.name ?? undefined,
      email: contact.email ?? undefined,
      tags: contact.tags ?? [],
    })),
    variable_defaults: variableDefaults ?? {},
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(currentUser.userId, currentUser.orgId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const member = { org_id: orgId };

  const { id, action } = await req.json() as { id?: string; action?: "pause" | "resume" };
  if (!id || !action) return NextResponse.json({ error: "Missing schedule id or action." }, { status: 400 });

  const updatePayload: Record<string, unknown> = {
    status: action === "pause" ? "paused" : "scheduled",
    updated_at: new Date().toISOString(),
  };
  if (action === "resume") {
    updatePayload.next_run_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("scheduled_bulk_messages")
    .update(updatePayload)
    .eq("id", id)
    .eq("org_id", member.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(currentUser.userId, currentUser.orgId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const member = { org_id: orgId };

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing schedule id." }, { status: 400 });

  const { error } = await supabase.from("scheduled_bulk_messages").delete().eq("id", id).eq("org_id", member.org_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
