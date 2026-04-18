import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { instanceId: string } }) {
  const supabase = await createClient();
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
    .select("webhook_url, trigger_config")
    .eq("org_id", inst.org_id)
    .eq("is_active", true)
    .in("trigger_type", ["inbound_message", "keyword"]);

  for (const flow of flows ?? []) {
    if (!flow.webhook_url) continue;
    const config = flow.trigger_config as Record<string, unknown> | null;
    if (config?.keyword) {
      const kw = String(config.keyword).toLowerCase();
      if (!content.toLowerCase().includes(kw)) continue;
    }
    fetch(flow.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, content, instance_id: inst.id, org_id: inst.org_id, payload }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
