import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ultraMsg } from "@/lib/ultramsg";
import type { UltraMsgMessageFeature } from "@/lib/message-features";

function getMessageContent(type: UltraMsgMessageFeature, values: Record<string, string>): string {
  if (type === "text") return values.body ?? "";
  if (type === "reaction") return `Reacted with ${values.emoji ?? ""} to ${values.msgId ?? ""}`.trim();
  if (type === "vcard") return values.vcard ?? "";
  if (type === "location") {
    const address = values.address ?? "";
    const coords = [values.lat, values.lng].filter(Boolean).join(", ");
    return [address, coords].filter(Boolean).join(" ");
  }

  return values.caption ?? values.body ?? values.filename ?? values.document ?? values.image ?? values.audio ?? values.video ?? values.contact ?? "";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { instanceId, to, message, conversationId, type, values } = body as {
    instanceId?: string;
    to?: string;
    message?: string;
    conversationId?: string;
    type?: UltraMsgMessageFeature;
    values?: Record<string, string>;
  };

  const { data: inst } = await supabase.from("whatsapp_instances").select("*").eq("id", instanceId).single();
  if (!inst) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  try {
    const isGeneric = Boolean(type && values);
    const result = isGeneric && type && values
      ? await ultraMsg.sendGenericMessage(inst.instance_id, {
          token: inst.token,
          type,
          values,
        })
      : await ultraMsg.sendText(inst.instance_id, {
          token: inst.token,
          to: to ?? "",
          body: message ?? "",
        });

    // Save message to DB
    if (conversationId) {
      const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
      const content = isGeneric && type ? getMessageContent(type, values ?? {}) : (message ?? "");
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        org_id: member?.org_id,
        direction: "outbound",
        source: "direct",
        type: type ?? "text",
        content,
        status: result.sent === "true" ? "sent" : "failed",
        sent_by: user.id,
        ultramsg_id: result.id,
      });

      await supabase.from("conversations").update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", conversationId);
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
