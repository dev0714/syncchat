import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignNextAvailableAgent } from "@/lib/agents";

/**
 * Backend for the n8n agent's native action tools (escalate_human, etc.).
 * Called by the AI Agent's httpRequestTool nodes. Returns 200 with an
 * { ok, message } shape so a tool failure never hard-errors the agent run.
 */

function phoneVariants(value?: string | null): string[] {
  const digits = String(value ?? "").replace(/@c\.us$/i, "").replace(/[^\d]/g, "");
  if (!digits) return [];
  return [digits, `+${digits}`];
}

async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return Object.fromEntries(new URLSearchParams(text)) as Record<string, unknown>;
  }
}

function verifySecret(req: NextRequest): boolean {
  const expected = process.env.SYNCCHAT_N8N_SHARED_SECRET?.trim();
  if (!expected) return true;
  return req.headers.get("x-syncchat-secret")?.trim() === expected;
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await readBody(req);
  const tool = String(body.tool ?? "").trim();
  const orgId = String(body.org_id ?? "").trim();
  const phones = phoneVariants(body.phone as string | undefined);

  if (tool === "escalate_human") {
    if (!orgId || phones.length === 0) {
      return NextResponse.json({ ok: false, message: "Missing organization or phone number." });
    }

    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", orgId)
      .in("phone", phones)
      .maybeSingle();

    if (!contact) {
      return NextResponse.json({ ok: false, message: "No matching contact was found." });
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("org_id", orgId)
      .eq("contact_id", contact.id)
      .neq("status", "closed")
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      return NextResponse.json({ ok: false, message: "No active conversation to hand over." });
    }

    // status 'open' = human handling. The n8n flow's "AI enabled?" gate treats
    // this as AI-off, so the bot stops and a human takes over from here.
    const { error } = await supabase
      .from("conversations")
      .update({ status: "open", updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    if (error) {
      return NextResponse.json({ ok: false, message: error.message });
    }

    // Round-robin assign to an available agent (best-effort; null if none free).
    const assignedTo = await assignNextAvailableAgent(orgId, conversation.id);

    return NextResponse.json({
      ok: true,
      message: "A human agent has been notified and will take over this conversation shortly.",
      conversation_id: conversation.id,
      assigned: Boolean(assignedTo),
      reason: typeof body.reason === "string" ? body.reason : null,
    });
  }

  // send_template / send_media and any other native tools are not wired to a
  // backend yet — respond gracefully (never 404) so the agent can recover.
  return NextResponse.json({
    ok: false,
    message: `The "${tool || "requested"}" action isn't available yet.`,
  });
}
