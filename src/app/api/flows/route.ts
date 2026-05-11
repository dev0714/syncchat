import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

type FlowPayload = {
  id?: string;
  orgId?: string;
  name?: string;
  description?: string;
  trigger_type?: "inbound_message" | "keyword" | "new_contact" | "manual" | "schedule";
  instance_id?: string;
  trigger_keyword?: string;
  prompt_role?: string;
  prompt_guardrails?: string;
  prompt_tone?: string;
  prompt_context?: string;
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

async function resolveTriggerTarget(supabase: ReturnType<typeof createAdminClient>, orgId: string, flow: Record<string, unknown>) {
  const legacyWebhook = typeof flow.webhook_url === "string" ? flow.webhook_url : "";
  if (legacyWebhook) return legacyWebhook;

  const { data: settings } = await supabase
    .from("org_settings")
    .select("n8n_base_url")
    .eq("org_id", orgId)
    .maybeSingle();

  const baseUrl = settings?.n8n_base_url ?? "";
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return /\/webhook(-test)?\//i.test(trimmed) ? trimmed : `${trimmed}/webhook/syncchat-whatsapp`;
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

  if (!body.name || !body.instance_id) {
    return NextResponse.json({ error: "Name and WhatsApp instance are required." }, { status: 400 });
  }
  if (body.trigger_type === "keyword" && !body.trigger_keyword?.trim()) {
    return NextResponse.json({ error: "Keyword is required for keyword trigger flows." }, { status: 400 });
  }

  const { data: instance, error: instanceError } = await supabase
    .from("whatsapp_instances")
    .select("id")
    .eq("id", body.instance_id)
    .eq("org_id", body.orgId ?? orgId)
    .single();

  if (instanceError || !instance) {
    return NextResponse.json({ error: "Selected WhatsApp instance was not found for this organization." }, { status: 400 });
  }

  const { error } = await supabase.from("n8n_flows").insert({
    org_id: body.orgId ?? orgId,
    instance_id: body.instance_id,
    name: body.name,
    description: body.description || null,
    trigger_type: body.trigger_type ?? "inbound_message",
    trigger_keyword: body.trigger_keyword || null,
    prompt_role: body.prompt_role || "",
    prompt_guardrails: body.prompt_guardrails || "",
    prompt_tone: body.prompt_tone || "",
    prompt_context: body.prompt_context || "",
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

    const triggeredAt = new Date().toISOString();
    const target = await resolveTriggerTarget(supabase, orgId, flow as Record<string, unknown>);

    let triggerResponse: Response | null = null;
    let responseText = "";
    if (target) {
      triggerResponse = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triggered_by: "manual",
          flow_id: flow.id,
          org_id: flow.org_id,
          instance_id: flow.instance_id,
          timestamp: triggeredAt,
          flow: {
            name: flow.name,
            description: flow.description,
            trigger_type: flow.trigger_type,
            trigger_keyword: flow.trigger_keyword,
            prompt_role: flow.prompt_role,
            prompt_guardrails: flow.prompt_guardrails,
            prompt_tone: flow.prompt_tone,
            prompt_context: flow.prompt_context,
          },
        }),
      });
      responseText = await triggerResponse.text();
    }

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
      success: triggerResponse ? triggerResponse.ok : true,
      status: triggerResponse ? triggerResponse.status : 200,
      response: responseText,
    });
  }

  if (!body.instance_id) {
    return NextResponse.json({ error: "WhatsApp instance is required." }, { status: 400 });
  }
  if (body.trigger_type === "keyword" && !body.trigger_keyword?.trim()) {
    return NextResponse.json({ error: "Keyword is required for keyword trigger flows." }, { status: 400 });
  }

  const { data: instance, error: instanceError } = await supabase
    .from("whatsapp_instances")
    .select("id")
    .eq("id", body.instance_id)
    .eq("org_id", orgId)
    .single();

  if (instanceError || !instance) {
    return NextResponse.json({ error: "Selected WhatsApp instance was not found for this organization." }, { status: 400 });
  }

  const { error } = await supabase
    .from("n8n_flows")
    .update({
      name: body.name,
      description: body.description || null,
      trigger_type: body.trigger_type,
      instance_id: body.instance_id,
      trigger_keyword: body.trigger_keyword || null,
      prompt_role: body.prompt_role || "",
      prompt_guardrails: body.prompt_guardrails || "",
      prompt_tone: body.prompt_tone || "",
      prompt_context: body.prompt_context || "",
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
