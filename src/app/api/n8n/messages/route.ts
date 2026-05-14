import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Direction = "inbound" | "outbound";
type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

type SaveMessageBody = {
  direction?: Direction;
  instancePhone?: string;
  instanceId?: string;
  orgId?: string;
  phone?: string;
  name?: string;
  content?: string;
  messageType?: string;
  status?: string;
  ultramsgId?: string;
  mediaUrl?: string | null;
  conversationId?: string;
  payload?: unknown;
  raw?: unknown;
};

function normalizePhone(value?: string | null): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const withoutSuffix = trimmed.replace(/@c\.us$/i, "");
  const cleaned = withoutSuffix.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  return cleaned.startsWith("27") ? `+${cleaned}` : `+${cleaned}`;
}

function normalizeMessageType(value?: string | null): string {
  const raw = String(value ?? "text").trim().toLowerCase();
  if (!raw || raw === "chat") return "text";
  if (["text", "image", "video", "audio", "document", "location"].includes(raw)) {
    return raw;
  }
  return "text";
}

function normalizeDirection(value?: string | null): Direction {
  return String(value ?? "inbound").trim().toLowerCase() === "outbound" ? "outbound" : "inbound";
}

function normalizeMessageStatus(value?: string | null, direction: Direction = "inbound"): MessageStatus {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["sending", "sent", "delivered", "read", "failed"].includes(raw)) {
    return raw as MessageStatus;
  }
  return direction === "inbound" ? "delivered" : "sent";
}

async function readRequestBody(req: NextRequest): Promise<SaveMessageBody> {
  const text = await req.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as SaveMessageBody;
  } catch {
    const parsed = Object.fromEntries(new URLSearchParams(text));
    return parsed as unknown as SaveMessageBody;
  }
}

function extractPayload(body: SaveMessageBody) {
  const rawPayload = body.payload ?? body.raw;
  const payload = typeof rawPayload === "string" ? (() => {
    try {
      return JSON.parse(rawPayload);
    } catch {
      return rawPayload;
    }
  })() : rawPayload;

  const ultra = (payload as { body?: { data?: Record<string, unknown> } } | undefined)?.body?.data
    ?? (payload as { data?: Record<string, unknown> } | undefined)?.data
    ?? (payload as Record<string, unknown> | undefined)
    ?? {};

  return {
    payload,
    ultra,
  };
}

async function verifySecret(req: NextRequest) {
  const expected = process.env.SYNCCHAT_N8N_SHARED_SECRET?.trim();
  if (!expected) return true;
  const provided = req.headers.get("x-syncchat-secret")?.trim();
  return provided === expected;
}

export async function POST(req: NextRequest) {
  if (!(await verifySecret(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await readRequestBody(req);
  const direction = normalizeDirection(body.direction);
  const { payload, ultra } = extractPayload(body);

  const instancePhone = normalizePhone(
    body.instancePhone
      ?? (ultra as { to?: string } | undefined)?.to
      ?? (payload as { body?: { data?: { to?: string } } } | undefined)?.body?.data?.to
  );

  const fallbackPhone = normalizePhone(
    body.phone
      ?? (direction === "inbound"
        ? (ultra as { from?: string } | undefined)?.from
        : (ultra as { to?: string } | undefined)?.to)
      ?? (payload as { body?: { data?: { from?: string; to?: string } } } | undefined)?.body?.data?.from
      ?? (payload as { body?: { data?: { from?: string; to?: string } } } | undefined)?.body?.data?.to
  );

  const content = String(
    body.content
      ?? (ultra as { body?: string; message?: string } | undefined)?.body
      ?? (ultra as { body?: string; message?: string } | undefined)?.message
      ?? ""
  );

  const name = String(
    body.name
      ?? (ultra as { pushname?: string; notifyName?: string } | undefined)?.pushname
      ?? (ultra as { pushname?: string; notifyName?: string } | undefined)?.notifyName
      ?? ""
  ).trim();

  const messageType = normalizeMessageType(
    body.messageType
      ?? (ultra as { type?: string } | undefined)?.type
  );

  const ultramsgId = String(
    body.ultramsgId
      ?? (ultra as { id?: string } | undefined)?.id
      ?? ""
  ).trim() || null;

  const mediaUrl = body.mediaUrl ?? (typeof (ultra as { media?: string } | undefined)?.media === "string"
    ? String((ultra as { media?: string } | undefined)?.media)
    : null);

  let instanceQuery = supabase
    .from("whatsapp_instances")
    .select("id, org_id, name, instance_id, phone_number, status, is_active")
    .eq("is_active", true);

  if (instancePhone) {
    instanceQuery = instanceQuery.eq("phone_number", instancePhone);
  }

  let { data: instance } = await instanceQuery.maybeSingle();

  if (!instance && body.instanceId) {
    const normalizedInstanceId = String(body.instanceId).trim();
    const query = supabase
      .from("whatsapp_instances")
      .select("id, org_id, name, instance_id, phone_number, status, is_active")
      .eq("is_active", true);
    const { data } = await query
      .or(`id.eq.${normalizedInstanceId},instance_id.eq.${normalizedInstanceId}`)
      .maybeSingle();
    instance = data ?? null;
  }

  if (!instance && body.orgId) {
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("id, org_id, name, instance_id, phone_number, status, is_active")
      .eq("org_id", body.orgId)
      .eq("is_active", true)
      .maybeSingle();
    instance = data ?? null;
  }

  if (!instance) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  const orgId = String(body.orgId ?? instance.org_id);

  if (!fallbackPhone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .upsert(
      {
        org_id: orgId,
        phone: fallbackPhone,
        name: name || null,
        metadata: typeof payload === "object" && payload ? payload : null,
      },
      { onConflict: "org_id,phone" }
    )
    .select("id, org_id, phone, name")
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: contactError?.message ?? "Failed to save contact" }, { status: 400 });
  }

  let conversationId = body.conversationId?.trim() || null;

  if (!conversationId) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, unread_count")
      .eq("org_id", orgId)
      .eq("instance_id", instance.id)
      .eq("contact_id", contact.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (conversation) {
      conversationId = conversation.id;
      const unreadCount = direction === "inbound" ? (Number(conversation.unread_count ?? 0) + 1) : Number(conversation.unread_count ?? 0);
      await supabase
        .from("conversations")
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_count: unreadCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } else {
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          org_id: orgId,
          instance_id: instance.id,
          contact_id: contact.id,
          status: "open",
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_count: direction === "inbound" ? 1 : 0,
        })
        .select("id")
        .single();

      if (conversationError || !newConversation) {
        return NextResponse.json(
          { error: conversationError?.message ?? "Failed to create conversation" },
          { status: 400 }
        );
      }

      conversationId = newConversation.id;
    }
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      org_id: orgId,
      direction,
      type: messageType,
      content,
      media_url: mediaUrl ?? null,
      status: normalizeMessageStatus(body.status, direction),
      ultramsg_id: ultramsgId,
    })
    .select("id, conversation_id, org_id, direction, type, content, media_url, status, ultramsg_id, created_at")
    .single();

  if (messageError || !message) {
    return NextResponse.json({ error: messageError?.message ?? "Failed to save message" }, { status: 400 });
  }

  await supabase
    .from("conversations")
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return NextResponse.json({
    success: true,
    instance: {
      id: instance.id,
      org_id: instance.org_id,
      name: instance.name,
      instance_id: instance.instance_id,
      phone_number: instance.phone_number,
    },
    contact: {
      id: contact.id,
      org_id: contact.org_id,
      phone: contact.phone,
      name: contact.name,
    },
    conversation_id: conversationId,
    message,
  });
}
