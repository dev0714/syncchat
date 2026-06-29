import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText } from "@/lib/messaging";

/**
 * Sends a "please hold" message to customers waiting for a human agent.
 *
 * Runs on a schedule (external cron → POST with x-cron-secret). For every org
 * with holding enabled, it finds open conversations that are still awaiting a
 * human reply and, once the per-conversation interval has elapsed, sends one
 * holding message via UltraMsg. It self-throttles via last_holding_at and stops
 * once a human replies, the chat closes, or a hard cap is reached.
 */

const DEFAULT_INTERVAL_MIN = 5;
const DEFAULT_MESSAGE = "Thanks for your patience! 🐾 One of our team members will be with you shortly.";
const HOLDING_CAP = 12; // ~ interval * 12 max messages, to avoid endless pings

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get("x-cron-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = Date.now();

  // Orgs that have holding enabled (and their config).
  const { data: settingsRows } = await supabase
    .from("org_settings")
    .select("org_id, holding_enabled, holding_message, holding_interval_minutes");

  const enabledOrgs = (settingsRows ?? []).filter((s: Record<string, unknown>) => s.holding_enabled !== false);
  const processed: Array<{ conversation_id: string; sent: boolean }> = [];

  for (const cfg of enabledOrgs) {
    const orgId = cfg.org_id as string;
    const intervalMin = Number(cfg.holding_interval_minutes) || DEFAULT_INTERVAL_MIN;
    const intervalMs = intervalMin * 60 * 1000;
    const message = (cfg.holding_message as string)?.trim() || DEFAULT_MESSAGE;

    const { data: convs } = await supabase
      .from("conversations")
      .select("id, instance_id, contact_id, last_message_at, last_holding_at, holding_count, contact:contacts(phone), last_msg:messages(direction, sent_by, created_at)")
      .eq("org_id", orgId)
      .eq("status", "open")
      .order("created_at", { ascending: false, referencedTable: "last_msg" })
      .limit(1, { referencedTable: "last_msg" });

    for (const c of convs ?? []) {
      const conv = c as Record<string, unknown>;
      const lastMsg = Array.isArray(conv.last_msg) ? conv.last_msg[0] : conv.last_msg;

      // Stop once a human has replied (outbound with a sent_by) or cap reached.
      const repliedByAgent = !!(lastMsg && lastMsg.direction === "outbound" && lastMsg.sent_by);
      if (repliedByAgent) continue;
      if ((Number(conv.holding_count) || 0) >= HOLDING_CAP) continue;

      // Throttle: only send when the interval has elapsed since the last
      // holding message (or, if none yet, since the last inbound message).
      const lastHolding = conv.last_holding_at ? new Date(conv.last_holding_at as string).getTime() : 0;
      const lastActivity = conv.last_message_at ? new Date(conv.last_message_at as string).getTime() : 0;
      const since = Math.max(lastHolding, lastActivity);
      if (since && now - since < intervalMs) continue;

      const contact = conv.contact as { phone?: string } | null;
      const phone = contact?.phone;
      if (!phone || !conv.instance_id) continue;

      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_id, token, provider, base_url")
        .eq("id", conv.instance_id)
        .maybeSingle();
      if (!instance) continue;

      try {
        const result = await sendText(instance, { to: phone, body: message });
        const status = String(result.sent) === "true" ? "sent" : "failed";
        const nowIso = new Date().toISOString();

        await supabase.from("messages").insert({
          conversation_id: conv.id,
          org_id: orgId,
          direction: "outbound",
          source: "system",
          type: "text",
          content: message,
          status,
          sent_by: null,
          ultramsg_id: result.id ?? null,
        });

        await supabase
          .from("conversations")
          .update({
            last_holding_at: nowIso,
            holding_count: (Number(conv.holding_count) || 0) + 1,
            last_message: message,
            last_message_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", conv.id);

        processed.push({ conversation_id: conv.id as string, sent: status === "sent" });
      } catch {
        // best-effort; skip on send error
      }
    }
  }

  return NextResponse.json({ success: true, processed });
}
