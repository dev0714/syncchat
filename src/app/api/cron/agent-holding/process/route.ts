import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText } from "@/lib/messaging";
import { getCurrentUser } from "@/lib/auth/server";

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
const DEFAULT_RETURN_MESSAGE = "Thanks for waiting! 🐾 I'll pick this up again — how can I help?";
const HOLDING_CAP = 12; // ~ interval * 12 max messages, to avoid endless pings

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  // Resolve the caller's org if they're a signed-in admin (used for the
  // scoped "Run now" test). Returns "forbidden" for a non-admin signed-in user.
  async function adminOrgId(): Promise<string | "forbidden" | null> {
    const user = await getCurrentUser();
    if (!user) return null;
    const { data: member } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const orgId = member?.org_id ?? user.orgId ?? null;
    const isAdmin = user.role === "super_admin" || member?.role === "org_admin" || member?.role === "super_admin";
    if (!orgId || !isAdmin) return "forbidden";
    return orgId as string;
  }

  // Authorization. Three ways in:
  //  1. The scheduled cron with x-cron-secret === CRON_SECRET (all orgs).
  //  2. The n8n scheduler, authorized like /api/n8n/tools: x-syncchat-secret
  //     === SYNCCHAT_N8N_SHARED_SECRET, or open when that env var is unset.
  //  3. A signed-in org admin (the "Run now" button) — scoped to their org.
  const cronOk = !!process.env.CRON_SECRET && req.headers.get("x-cron-secret") === process.env.CRON_SECRET;
  const sharedExpected = process.env.SYNCCHAT_N8N_SHARED_SECRET?.trim();
  const sharedOk = !sharedExpected || req.headers.get("x-syncchat-secret")?.trim() === sharedExpected;

  let orgFilter: string | null = null;
  if (cronOk) {
    orgFilter = null; // scheduled cron → every org
  } else if (sharedExpected) {
    // A shared secret is configured — require it for the scheduler path.
    if (sharedOk) {
      orgFilter = null;
    } else {
      const a = await adminOrgId();
      if (a === null) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (a === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      orgFilter = a;
    }
  } else {
    // No shared secret configured: allow the (unauthenticated) scheduler as a
    // full run, or a signed-in admin as a scoped run.
    const a = await adminOrgId();
    if (a === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    orgFilter = a; // string (admin org) or null (scheduler → all orgs)
  }

  const now = Date.now();

  // Per-org holding config (org_settings) + auto-return config
  // (organizations.settings JSONB: holding_return_minutes, holding_return_message).
  let settingsQuery = supabase
    .from("org_settings")
    .select("org_id, holding_enabled, holding_message, holding_interval_minutes");
  if (orgFilter) settingsQuery = settingsQuery.eq("org_id", orgFilter);
  const { data: settingsRows } = await settingsQuery;

  const { data: orgRows } = await supabase.from("organizations").select("id, settings");
  const returnCfg = new Map<string, { minutes: number; message: string }>();
  for (const o of orgRows ?? []) {
    const row = o as Record<string, unknown>;
    const s = (row.settings || {}) as Record<string, unknown>;
    returnCfg.set(row.id as string, {
      minutes: Number(s.holding_return_minutes) || 0,
      message: typeof s.holding_return_message === "string" ? (s.holding_return_message as string) : "",
    });
  }

  const processed: Array<{ conversation_id: string; action: string }> = [];

  for (const cfg of settingsRows ?? []) {
    const orgId = cfg.org_id as string;
    const holdingEnabled = (cfg as Record<string, unknown>).holding_enabled !== false;
    const intervalMs = (Number(cfg.holding_interval_minutes) || DEFAULT_INTERVAL_MIN) * 60 * 1000;
    const holdMessage = (cfg.holding_message as string)?.trim() || DEFAULT_MESSAGE;
    const ret = returnCfg.get(orgId) ?? { minutes: 0, message: "" };
    const returnMs = ret.minutes > 0 ? ret.minutes * 60 * 1000 : 0;
    const returnMessage = ret.message.trim() || DEFAULT_RETURN_MESSAGE;

    // Nothing enabled for this org.
    if (!holdingEnabled && returnMs === 0) continue;

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

      // Stop once a human has replied (outbound with a sent_by).
      const repliedByAgent = !!(lastMsg && lastMsg.direction === "outbound" && lastMsg.sent_by);
      if (repliedByAgent) continue;

      const contact = conv.contact as { phone?: string } | null;
      const phone = contact?.phone;
      if (!phone || !conv.instance_id) continue;

      // Resolve the sending instance once (both paths need it).
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_id, token, provider, base_url")
        .eq("id", conv.instance_id)
        .maybeSingle();
      if (!instance) continue;

      // --- Auto-return to AI: if the customer has waited longer than the
      // configured window (measured from their last inbound message) without a
      // human reply, hand the chat back to the bot and send a takeover message. ---
      if (returnMs > 0) {
        const { data: lastInbound } = await supabase
          .from("messages")
          .select("created_at")
          .eq("conversation_id", conv.id as string)
          .eq("direction", "inbound")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastInboundMs = lastInbound?.created_at ? new Date(lastInbound.created_at as string).getTime() : 0;
        if (lastInboundMs && now - lastInboundMs >= returnMs) {
          const nowIso = new Date().toISOString();
          try {
            const r = await sendText(instance, { to: phone, body: returnMessage });
            const status = String(r.sent) === "true" ? "sent" : "failed";
            await supabase.from("messages").insert({
              conversation_id: conv.id, org_id: orgId, direction: "outbound", source: "system",
              type: "text", content: returnMessage, status, sent_by: null, ultramsg_id: r.id ?? null,
            });
          } catch { /* best-effort */ }
          // status 'bot' re-enables the n8n AI flow; release the agent + reset holding.
          await supabase.from("conversations").update({
            status: "bot", assigned_to: null, holding_count: 0, last_holding_at: null,
            last_message: returnMessage, last_message_at: nowIso, updated_at: nowIso,
          }).eq("id", conv.id);
          processed.push({ conversation_id: conv.id as string, action: "returned_to_ai" });
          continue;
        }
      }

      // --- Holding message (only if enabled and under the cap). ---
      if (!holdingEnabled) continue;
      if ((Number(conv.holding_count) || 0) >= HOLDING_CAP) continue;

      // Throttle: only send once the interval has elapsed since the last holding
      // message (or, if none yet, since the last activity).
      const lastHolding = conv.last_holding_at ? new Date(conv.last_holding_at as string).getTime() : 0;
      const lastActivity = conv.last_message_at ? new Date(conv.last_message_at as string).getTime() : 0;
      const since = Math.max(lastHolding, lastActivity);
      if (since && now - since < intervalMs) continue;

      try {
        const result = await sendText(instance, { to: phone, body: holdMessage });
        const status = String(result.sent) === "true" ? "sent" : "failed";
        const nowIso = new Date().toISOString();

        await supabase.from("messages").insert({
          conversation_id: conv.id, org_id: orgId, direction: "outbound", source: "system",
          type: "text", content: holdMessage, status, sent_by: null, ultramsg_id: result.id ?? null,
        });

        await supabase.from("conversations").update({
          last_holding_at: nowIso, holding_count: (Number(conv.holding_count) || 0) + 1,
          last_message: holdMessage, last_message_at: nowIso, updated_at: nowIso,
        }).eq("id", conv.id);

        processed.push({ conversation_id: conv.id as string, action: status === "sent" ? "held" : "hold_failed" });
      } catch {
        // best-effort; skip on send error
      }
    }
  }

  return NextResponse.json({ success: true, processed });
}
