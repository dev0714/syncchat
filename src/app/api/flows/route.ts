import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

type FlowPayload = {
  id?: string;
  orgId?: string;
  name?: string;
  description?: string;
  n8n_workflow_id?: string;
  webhook_url?: string;
  trigger_type?: "inbound_message" | "keyword" | "new_contact" | "manual" | "schedule";
  keyword?: string;
  instance_id?: string;
  prompt?: Record<string, string>;
  tools?: string[];
  is_active?: boolean;
  action?: "toggle" | "trigger";
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

  return { supabase, currentUser, member, orgId };
}

export async function GET() {
  const ctx = await resolveContext();
  if ("error" in ctx) return ctx.error;

  const { supabase, orgId } = ctx;
  const [{ data: flows, error: flowsError }, { data: instances, error: instancesError }] = await Promise.all([
    supabase
      .from("n8n_flows")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("whatsapp_instances")
      .select("id, name, instance_id")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true }),
  ]);

  if (flowsError) return NextResponse.json({ error: flowsError.message }, { status: 500 });
  if (instancesError) return NextResponse.json({ error: instancesError.message }, { status: 500 });

  return NextResponse.json({
    orgId,
    flows: flows ?? [],
    instances: instances ?? [],
  });
}

export async function POST(request: NextRequest) {
  const ctx = await resolveContext();
  if ("error" in ctx) return ctx.error;

  const { supabase, orgId } = ctx;
  const body = (await request.json().catch(() => ({}))) as FlowPayload;

  if (!body.name || !body.n8n_workflow_id) {
    return NextResponse.json({ error: "Name and N8n workflow ID are required." }, { status: 400 });
  }

  const trigger_config: Record<string, unknown> = {};
  if (body.keyword) trigger_config.keyword = body.keyword;
  if (body.instance_id) trigger_config.instance_id = body.instance_id;
  if (body.prompt) trigger_config.prompt = body.prompt;
  if (body.tools) trigger_config.tools = body.tools;

  const { error } = await supabase.from("n8n_flows").insert({
    org_id: body.orgId ?? orgId,
    name: body.name,
    description: body.description || null,
    n8n_workflow_id: body.n8n_workflow_id,
    webhook_url: body.webhook_url || null,
    trigger_type: body.trigger_type ?? "inbound_message",
    trigger_config,
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

  const { supabase, orgId } = ctx;
  const body = (await request.json().catch(() => ({}))) as FlowPayload;

  if (!body.id) {
    return NextResponse.json({ error: "Flow ID is required." }, { status: 400 });
  }

  if (body.action === "toggle") {
    const { error } = await supabase
      .from("n8n_flows")
      .update({
        is_active: typeof body.is_active === "boolean" ? body.is_active : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("org_id", orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "trigger") {
    if (!body.id) {
      return NextResponse.json({ error: "Flow ID is required." }, { status: 400 });
    }

    const { data: flow, error: flowError } = await supabase
      .from("n8n_flows")
      .select("*")
      .eq("id", body.id)
      .eq("org_id", orgId)
      .single();

    if (flowError || !flow) {
      return NextResponse.json({ error: flowError?.message ?? "Flow not found." }, { status: 404 });
    }

    if (!flow.webhook_url) {
      return NextResponse.json({ error: "No webhook URL configured for this flow." }, { status: 400 });
    }

    const triggeredAt = new Date().toISOString();
    const triggerResponse = await fetch(flow.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        triggered_by: "manual",
        flow_id: flow.id,
        org_id: flow.org_id,
        timestamp: triggeredAt,
      }),
    });
    const responseText = await triggerResponse.text();

    const { error: updateError } = await supabase
      .from("n8n_flows")
      .update({
        last_triggered_at: triggeredAt,
        updated_at: triggeredAt,
      })
      .eq("id", flow.id)
      .eq("org_id", orgId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({
      success: triggerResponse.ok,
      status: triggerResponse.status,
      response: responseText,
    });
  }

  const trigger_config: Record<string, unknown> = {};
  if (body.keyword) trigger_config.keyword = body.keyword;
  if (body.instance_id) trigger_config.instance_id = body.instance_id;
  if (body.prompt) trigger_config.prompt = body.prompt;
  if (body.tools) trigger_config.tools = body.tools;

  const { error } = await supabase
    .from("n8n_flows")
    .update({
      name: body.name,
      description: body.description || null,
      n8n_workflow_id: body.n8n_workflow_id,
      webhook_url: body.webhook_url || null,
      trigger_type: body.trigger_type,
      trigger_config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .eq("org_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const ctx = await resolveContext();
  if ("error" in ctx) return ctx.error;

  const { supabase, orgId } = ctx;
  const body = (await request.json().catch(() => ({}))) as FlowPayload;

  if (!body.id) {
    return NextResponse.json({ error: "Flow ID is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("n8n_flows")
    .delete()
    .eq("id", body.id)
    .eq("org_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
