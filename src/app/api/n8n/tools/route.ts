import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ultraMsg } from "@/lib/ultramsg";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

type ToolName =
  | "send_text"
  | "send_media"
  | "send_template"
  | "contact_crm"
  | "escalate_human";

type ToolBody = {
  tool?: ToolName;
  org_id?: string;
  instance_id?: string;
  conversation_id?: string;
  phone?: string;
  body?: string;
  media_url?: string;
  type?: string;
  caption?: string;
  template_name?: string;
  variables?: string | Record<string, string>;
  action?: string;
  fields?: string | Record<string, unknown>;
  reason?: string;
};

function verifySecret(req: NextRequest): boolean {
  const expected = process.env.SYNCCHAT_N8N_SHARED_SECRET?.trim();
  if (!expected) return true;
  return req.headers.get("x-syncchat-secret")?.trim() === expected;
}

function parseJsonish(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

async function getInstance(supabase: SupabaseAdmin, instanceId?: string) {
  if (!instanceId) return null;
  const { data } = await supabase
    .from("whatsapp_instances")
    .select("id, org_id, instance_id, token")
    .eq("id", instanceId)
    .maybeSingle();
  return data ?? null;
}

// Persist an outbound message and bump the conversation preview.
async function recordOutbound(
  supabase: SupabaseAdmin,
  params: {
    conversationId?: string | null;
    orgId: string;
    content: string;
    type?: string;
    mediaUrl?: string | null;
    ultramsgId?: string | null;
  }
) {
  if (!params.conversationId) return;
  await supabase.from("messages").insert({
    conversation_id: params.conversationId,
    org_id: params.orgId,
    direction: "outbound",
    source: "system",
    type: params.type ?? "text",
    content: params.content,
    media_url: params.mediaUrl ?? null,
    status: "sent",
    ultramsg_id: params.ultramsgId ?? null,
  });
  await supabase
    .from("conversations")
    .update({
      last_message: params.content,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.conversationId);
}

function renderTemplate(content: string, variables: Record<string, unknown>): string {
  return content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = (await req.json().catch(() => ({}))) as ToolBody;
  const tool = body.tool;

  if (!tool) {
    return NextResponse.json({ error: "Missing tool." }, { status: 400 });
  }

  try {
    if (tool === "escalate_human") {
      if (!body.conversation_id) {
        return NextResponse.json({ error: "conversation_id is required." }, { status: 400 });
      }
      const { error } = await supabase
        .from("conversations")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", body.conversation_id)
        .eq("org_id", body.org_id ?? "");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, status: "pending", message: "Conversation handed off to a human agent." });
    }

    if (tool === "contact_crm") {
      if (!body.org_id || !body.phone) {
        return NextResponse.json({ error: "org_id and phone are required." }, { status: 400 });
      }
      if ((body.action ?? "get") === "update") {
        const fields = parseJsonish(body.fields);
        const allowed: Record<string, unknown> = {};
        for (const key of ["name", "email", "tags", "metadata"]) {
          if (fields[key] !== undefined) allowed[key] = fields[key];
        }
        if (Object.keys(allowed).length === 0) {
          return NextResponse.json({ error: "No updatable fields provided." }, { status: 400 });
        }
        allowed.updated_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("contacts")
          .update(allowed)
          .eq("org_id", body.org_id)
          .eq("phone", body.phone)
          .select("id, phone, name, email, tags")
          .maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, contact: data });
      }
      const { data, error } = await supabase
        .from("contacts")
        .select("id, phone, name, email, tags, metadata, created_at")
        .eq("org_id", body.org_id)
        .eq("phone", body.phone)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, contact: data });
    }

    // Remaining tools send a WhatsApp message and need an instance.
    const instance = await getInstance(supabase, body.instance_id);
    if (!instance) {
      return NextResponse.json({ error: "Instance not found." }, { status: 404 });
    }
    const orgId = body.org_id ?? instance.org_id;
    const to = body.phone ?? "";
    if (!to) {
      return NextResponse.json({ error: "phone is required." }, { status: 400 });
    }

    if (tool === "send_text") {
      const text = (body.body ?? "").trim();
      if (!text) return NextResponse.json({ error: "body is required." }, { status: 400 });
      const result = await ultraMsg.sendText(instance.instance_id, { token: instance.token, to, body: text });
      await recordOutbound(supabase, { conversationId: body.conversation_id, orgId, content: text, ultramsgId: result?.id ?? null });
      return NextResponse.json({ success: true, sent: result });
    }

    if (tool === "send_template") {
      if (!body.template_name) {
        return NextResponse.json({ error: "template_name is required." }, { status: 400 });
      }
      const { data: template } = await supabase
        .from("message_templates")
        .select("id, content")
        .eq("org_id", orgId)
        .eq("name", body.template_name)
        .eq("is_active", true)
        .maybeSingle();
      if (!template) {
        return NextResponse.json({ error: "Template not found." }, { status: 404 });
      }
      const text = renderTemplate(template.content, parseJsonish(body.variables));
      const result = await ultraMsg.sendText(instance.instance_id, { token: instance.token, to, body: text });
      await recordOutbound(supabase, { conversationId: body.conversation_id, orgId, content: text, ultramsgId: result?.id ?? null });
      return NextResponse.json({ success: true, sent: result });
    }

    if (tool === "send_media") {
      const mediaUrl = body.media_url ?? "";
      if (!mediaUrl) return NextResponse.json({ error: "media_url is required." }, { status: 400 });
      const mediaType = (body.type ?? "image").toLowerCase();
      const caption = body.caption ?? "";
      let result;
      if (mediaType === "document") {
        result = await ultraMsg.sendDocument(instance.instance_id, { token: instance.token, to, document: mediaUrl, caption });
      } else if (mediaType === "audio" || mediaType === "voice") {
        result = await ultraMsg.sendVoice(instance.instance_id, { token: instance.token, to, audio: mediaUrl });
      } else {
        result = await ultraMsg.sendImage(instance.instance_id, { token: instance.token, to, image: mediaUrl, caption });
      }
      await recordOutbound(supabase, {
        conversationId: body.conversation_id,
        orgId,
        content: caption || mediaUrl,
        type: mediaType === "document" ? "document" : mediaType === "audio" || mediaType === "voice" ? "audio" : "image",
        mediaUrl,
        ultramsgId: result?.id ?? null,
      });
      return NextResponse.json({ success: true, sent: result });
    }

    return NextResponse.json({ error: `Unsupported tool: ${tool}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
