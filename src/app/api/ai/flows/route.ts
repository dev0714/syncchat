import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type FlowActionBody = {
  action?: "list" | "toggle" | "trigger";
  orgId?: string;
  flowId?: string;
  isActive?: boolean;
};

function unauthorizedIfNeeded(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get("x-cron-secret");

  if (expectedSecret && providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  const unauthorized = unauthorizedIfNeeded(req);
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const body = (await req.json()) as FlowActionBody;
  const action = body.action ?? "list";

  if (action === "list") {
    let query = supabase.from("n8n_flows").select("*").order("created_at", { ascending: false });
    if (body.orgId) {
      query = query.eq("org_id", body.orgId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ flows: data ?? [] });
  }

  if (!body.flowId) {
    return NextResponse.json({ error: "Missing flowId." }, { status: 400 });
  }

  const flowQuery = supabase.from("n8n_flows").select("*").eq("id", body.flowId);
  const { data: flow, error: flowError } = body.orgId
    ? await flowQuery.eq("org_id", body.orgId).single()
    : await flowQuery.single();

  if (flowError || !flow) {
    return NextResponse.json({ error: flowError?.message ?? "Flow not found." }, { status: 404 });
  }

  if (action === "toggle") {
    const nextActive = typeof body.isActive === "boolean" ? body.isActive : !flow.is_active;
    const { error } = await supabase
      .from("n8n_flows")
      .update({ is_active: nextActive, updated_at: new Date().toISOString() })
      .eq("id", flow.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      flowId: flow.id,
      is_active: nextActive,
    });
  }

  if (action === "trigger") {
    if (!flow.webhook_url) {
      return NextResponse.json({ error: "This flow has no webhook URL configured." }, { status: 400 });
    }

    const triggeredAt = new Date().toISOString();
    const triggerResponse = await fetch(flow.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        triggered_by: "ai",
        flow_id: flow.id,
        org_id: flow.org_id,
        timestamp: triggeredAt,
      }),
    });

    const responseText = await triggerResponse.text();

    const { error } = await supabase
      .from("n8n_flows")
      .update({ last_triggered_at: triggeredAt, updated_at: triggeredAt })
      .eq("id", flow.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: triggerResponse.ok,
      flowId: flow.id,
      status: triggerResponse.status,
      response: responseText,
    });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
