import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { instanceId: string } }) {
  const supabase = createAdminClient();
  const payload = await req.json();

  // Find instance
  const { data: inst } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("instance_id", params.instanceId)
    .single();

  if (!inst) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  const msg = payload?.data;
  if (!msg) return NextResponse.json({ ok: true });

  const phone = msg.from?.replace("@c.us", "") ?? "";
  const content = msg.body ?? "";
  const isInbound = !msg.fromMe;

  if (!isInbound || !phone || !content) return NextResponse.json({ ok: true });

  // Upsert contact
  let { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("org_id", inst.org_id)
    .eq("phone", phone)
    .single();

  if (!contact) {
    const { data: newContact } = await supabase.from("contacts").insert({
      org_id: inst.org_id,
      phone,
      name: msg.notifyName ?? null,
    }).select("id").single();
    contact = newContact;
  }

  if (!contact) return NextResponse.json({ ok: true });

  // Upsert conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("org_id", inst.org_id)
    .eq("instance_id", inst.id)
    .eq("contact_id", contact.id)
    .eq("status", "open")
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase.from("conversations").insert({
      org_id: inst.org_id,
      instance_id: inst.id,
      contact_id: contact.id,
      status: "open",
      last_message: content,
      last_message_at: new Date().toISOString(),
      unread_count: 1,
    }).select("id").single();
    conversation = newConv;
  } else {
    await supabase.from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      unread_count: supabase.rpc("increment_unread", { conv_id: conversation.id }),
      updated_at: new Date().toISOString(),
    }).eq("id", conversation.id);
  }

  // Save message
  if (conversation) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      org_id: inst.org_id,
      direction: "inbound",
      type: "text",
      content,
      status: "delivered",
      ultramsg_id: msg.id,
    });
  }

  // Forward to N8n flows
  const { data: flows } = await supabase
    .from("n8n_flows")
    .select("id, instance_id, trigger_type, trigger_keyword, prompt_role, prompt_guardrails, prompt_tone, prompt_context, webhook_url")
    .eq("org_id", inst.org_id)
    .eq("is_active", true)
    .eq("instance_id", inst.id)
    .in("trigger_type", ["inbound_message", "keyword"]);

  const { data: settings } = await supabase
    .from("org_settings")
    .select("n8n_base_url")
    .eq("org_id", inst.org_id)
    .maybeSingle();

  for (const flow of flows ?? []) {
    const legacyWebhook = flow.webhook_url || "";
    const baseUrl = settings?.n8n_base_url?.trim().replace(/\/$/, "") ?? "";
    const target = legacyWebhook || (!baseUrl ? "" : /\/webhook(-test)?\//i.test(baseUrl) ? baseUrl : `${baseUrl}/webhook/syncchat-whatsapp`);
    if (!target) continue;
    if (flow.trigger_type === "keyword" && flow.trigger_keyword) {
      const kw = String(flow.trigger_keyword).toLowerCase();
      if (!content.toLowerCase().includes(kw)) continue;
    }
    fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        content,
        instance_id: inst.id,
        org_id: inst.org_id,
        flow_id: flow.id,
        flow: {
          trigger_type: flow.trigger_type,
          trigger_keyword: flow.trigger_keyword,
          prompt_role: flow.prompt_role,
          prompt_guardrails: flow.prompt_guardrails,
          prompt_tone: flow.prompt_tone,
          prompt_context: flow.prompt_context,
        },
        payload,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
