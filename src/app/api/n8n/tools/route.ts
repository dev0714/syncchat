import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignNextAvailableAgent } from "@/lib/agents";
import { sendText, sendGeneric } from "@/lib/messaging";
import type { UltraMsgMessageFeature } from "@/lib/message-features";

/** Fill {{name}}/{{phone}}/{{email}} and custom vars in a template string. */
function fillTemplateVars(
  text: string,
  contact: { name?: string | null; phone?: string | null; email?: string | null },
  vars: Record<string, string>,
): string {
  return String(text ?? "").replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    if (key === "name") return contact.name ?? vars[key] ?? "";
    if (key === "phone") return contact.phone ?? vars[key] ?? "";
    if (key === "email") return contact.email ?? vars[key] ?? "";
    return vars[key] ?? "";
  });
}

/** Images may be a JSON array (fields.images) with fields.image as the first. */
function templateImages(fields: Record<string, string>): string[] {
  try {
    const arr = JSON.parse(fields.images || "[]");
    if (Array.isArray(arr) && arr.length) return arr.filter((s) => typeof s === "string" && s) as string[];
  } catch { /* ignore */ }
  return fields.image ? [fields.image] : [];
}

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

  if (tool === "save_contact_name") {
    const name = String(body.name ?? "").trim();
    if (!orgId || phones.length === 0) {
      return NextResponse.json({ ok: false, message: "Missing organization or phone number." });
    }
    if (!name) {
      return NextResponse.json({ ok: false, message: "No name provided." });
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

    const { error } = await supabase
      .from("contacts")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", contact.id);

    if (error) {
      return NextResponse.json({ ok: false, message: error.message });
    }

    return NextResponse.json({ ok: true, message: `Saved the customer's name as ${name}.` });
  }

  if (tool === "send_template") {
    const templateName = String(body.template_name ?? "").trim();
    const instanceId = String(body.instance_id ?? "").trim();
    if (!orgId || phones.length === 0) {
      return NextResponse.json({ ok: false, message: "Missing organization or phone number." });
    }
    if (!templateName) {
      return NextResponse.json({ ok: false, message: "No template name provided." });
    }

    // Parse the AI-supplied variables (may arrive as an object or JSON string).
    let vars: Record<string, string> = {};
    const rawVars = body.variables;
    if (rawVars && typeof rawVars === "object") vars = rawVars as Record<string, string>;
    else if (typeof rawVars === "string" && rawVars.trim()) {
      try { vars = JSON.parse(rawVars); } catch { /* ignore */ }
    }

    // Resolve the template by name (case-insensitive) within the org.
    const { data: templates } = await supabase
      .from("message_templates")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true);
    const tmpl = (templates ?? []).find(
      (t) => String(t.name).trim().toLowerCase() === templateName.toLowerCase(),
    );
    if (!tmpl) {
      const available = (templates ?? []).map((t) => t.name).join(", ") || "none";
      return NextResponse.json({ ok: false, message: `No active template named "${templateName}". Available: ${available}.` });
    }

    // Resolve the sending instance (by id, else the org's first instance).
    let inst = null as Record<string, unknown> | null;
    if (instanceId) {
      const { data } = await supabase.from("whatsapp_instances").select("*").eq("id", instanceId).maybeSingle();
      inst = data;
    }
    if (!inst) {
      const { data } = await supabase
        .from("whatsapp_instances").select("*").eq("org_id", orgId)
        .order("created_at", { ascending: true }).limit(1).maybeSingle();
      inst = data;
    }
    if (!inst) {
      return NextResponse.json({ ok: false, message: "No WhatsApp instance available to send from." });
    }

    // Contact (for {{name}}/{{email}} and message logging).
    const { data: contact } = await supabase
      .from("contacts").select("id, name, email").eq("org_id", orgId).in("phone", phones).maybeSingle();
    const to = phones[0];
    const contactVals = { name: contact?.name, phone: to, email: contact?.email };

    const sendable = {
      provider: inst.provider as string | null,
      instance_id: inst.instance_id as string,
      token: inst.token as string,
      base_url: (inst.base_url as string | null) ?? null,
    };

    let result: { sent: string | boolean; message?: string };
    const msgType = String(tmpl.msg_type ?? "text");

    if (msgType === "text") {
      result = await sendText(sendable, { to, body: fillTemplateVars(tmpl.content, contactVals, vars) });
    } else {
      let fields: Record<string, string> = {};
      try { fields = JSON.parse(tmpl.content); } catch { /* ignore */ }
      const values: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) values[k] = typeof v === "string" ? fillTemplateVars(v, contactVals, vars) : v;
      // UltraMsg's generic send reads the recipient from values.to (WAHA/Meta use
      // the separate `to` arg and ignore this), so always include it.
      values.to = to;

      if (msgType === "image") {
        // Send each image; caption on the first only.
        const images = templateImages(fields);
        let ok = images.length > 0;
        let lastMsg: string | undefined;
        for (let idx = 0; idx < images.length; idx++) {
          const r = await sendGeneric(sendable, { type: "image", values: { image: images[idx], caption: idx === 0 ? (values.caption ?? "") : "", to }, to });
          if (r.sent !== "true") { ok = false; lastMsg = r.message; }
        }
        result = { sent: ok ? "true" : "false", message: lastMsg };
      } else {
        result = await sendGeneric(sendable, { type: msgType as UltraMsgMessageFeature, values, to });
      }
    }

    if (!(result.sent === "true" || result.sent === true)) {
      return NextResponse.json({ ok: false, message: result.message ?? "Failed to send the template." });
    }

    // Log the outbound message against the contact's latest conversation.
    // conversation_id is NOT NULL, so only log when a conversation exists.
    if (contact) {
      const { data: conv } = await supabase
        .from("conversations").select("id").eq("org_id", orgId).eq("contact_id", contact.id)
        .order("last_message_at", { ascending: false }).limit(1).maybeSingle();
      if (conv?.id) {
        await supabase.from("messages").insert({
          org_id: orgId,
          conversation_id: conv.id,
          direction: "outbound",
          source: "system",
          type: msgType === "text" ? "text" : msgType,
          content: msgType === "text" ? fillTemplateVars(tmpl.content, contactVals, vars) : tmpl.content,
          status: "sent",
        });
      }
    }

    return NextResponse.json({ ok: true, message: `Sent the "${tmpl.name}" template to the customer.` });
  }

  // send_media and any other native tools are not wired to a backend yet —
  // respond gracefully (never 404) so the agent can recover.
  return NextResponse.json({
    ok: false,
    message: `The "${tool || "requested"}" action isn't available yet.`,
  });
}
