import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ultraMsg } from "@/lib/ultramsg";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { instanceId, to, message, conversationId } = body;

  const { data: inst } = await supabase.from("whatsapp_instances").select("*").eq("id", instanceId).single();
  if (!inst) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  try {
    const result = await ultraMsg.sendText(inst.instance_id, {
      token: inst.token,
      to,
      body: message,
    });

    // Save message to DB
    if (conversationId) {
      const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        org_id: member?.org_id,
        direction: "outbound",
        type: "text",
        content: message,
        status: result.sent === "true" ? "sent" : "failed",
        sent_by: user.id,
        ultramsg_id: result.id,
      });

      await supabase.from("conversations").update({
        last_message: message,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", conversationId);
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
