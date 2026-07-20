import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMessageFeature } from "@/lib/message-features";
import type { UltraMsgMessageFeature } from "@/lib/message-features";
import { sendText, sendGeneric } from "@/lib/messaging";

const BASE = "https://api.ultramsg.com";

interface BulkContact { id?: string; phone: string; name?: string; email?: string }

interface BulkPayload {
  instanceId: string;
  contacts: BulkContact[];
  template: string;
  variableDefaults: Record<string, string>;
  msgType?: string;
}

function fillVars(text: string, contact: BulkContact, defaults: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    if (key === "name") return contact.name ?? defaults[key] ?? "";
    if (key === "phone") return contact.phone ?? defaults[key] ?? "";
    if (key === "email") return defaults[key] ?? "";
    return defaults[key] ?? `{{${key}}}`;
  });
}

/**
 * Image templates may carry multiple images (fields.images = JSON array), with
 * fields.image mirroring the first for backward-compatibility. Returns the full
 * ordered list of image URLs / data URIs (never empty if a single image exists).
 */
function parseImages(fields: Record<string, string>): string[] {
  try {
    const arr = JSON.parse(fields.images || "[]");
    if (Array.isArray(arr) && arr.length) return arr.filter((s) => typeof s === "string" && s) as string[];
  } catch { /* ignore */ }
  return fields.image ? [fields.image] : [];
}

function buildRequest(
  token: string,
  to: string,
  msgType: string,
  template: string,
  contact: BulkContact,
  defaults: Record<string, string>
): { endpoint: string; params: URLSearchParams } {
  if (msgType === "text") {
    const params = new URLSearchParams({ token, to, body: fillVars(template, contact, defaults) });
    return { endpoint: "messages/chat", params };
  }

  let fields: Record<string, string> = {};
  try { fields = JSON.parse(template); } catch { /* fall through with empty fields */ }

  const filled: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    filled[k] = typeof v === "string" ? fillVars(v, contact, defaults) : v;
  }

  try {
    const feature = getMessageFeature(msgType as UltraMsgMessageFeature);
    const params = new URLSearchParams({ token, to });
    for (const field of feature.fields) {
      if (field.key === "to") continue;
      const val = filled[field.key];
      if (val !== undefined && val !== "") params.set(field.key, val);
    }
    return { endpoint: feature.endpoint, params };
  } catch {
    // Fallback: send as text with raw content
    return { endpoint: "messages/chat", params: new URLSearchParams({ token, to, body: template }) };
  }
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload: BulkPayload = await req.json();
  const { instanceId, contacts, template, variableDefaults, msgType = "text" } = payload;

  const { data: inst } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("id", instanceId)
    .single();
  if (!inst) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", currentUser.userId)
    .maybeSingle();
  const orgId = member?.org_id ?? currentUser.orgId;

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const contact of contacts) {
    try {
      let data: { sent: string | boolean; message?: string };

      // Provider-aware path (WAHA + Meta) goes through the messaging layer.
      if (inst.provider === "waha" || inst.provider === "meta") {
        if (msgType === "text") {
          data = await sendText(inst, { to: contact.phone, body: fillVars(template, contact, variableDefaults) });
        } else {
          let fields: Record<string, string> = {};
          try { fields = JSON.parse(template); } catch { /* empty */ }
          const values: Record<string, string> = {};
          for (const [k, v] of Object.entries(fields)) values[k] = typeof v === "string" ? fillVars(v, contact, variableDefaults) : v;

          if (msgType === "image") {
            // Send each image as its own message; caption only on the first.
            const images = parseImages(fields);
            let ok = images.length > 0;
            let lastMsg: string | undefined;
            for (let idx = 0; idx < images.length; idx++) {
              const r = await sendGeneric(inst, {
                type: "image",
                values: { image: images[idx], caption: idx === 0 ? (values.caption ?? "") : "" },
                to: contact.phone,
              });
              if (!(r.sent === "true" || r.sent === true)) { ok = false; lastMsg = r.message; }
            }
            data = { sent: ok ? "true" : "false", message: lastMsg };
          } else {
            data = await sendGeneric(inst, { type: msgType as UltraMsgMessageFeature, values, to: contact.phone });
          }
        }
      } else if (msgType === "image") {
        // UltraMsg HTTP path — loop images, caption on the first only.
        let fields: Record<string, string> = {};
        try { fields = JSON.parse(template); } catch { /* empty */ }
        const images = parseImages(fields);
        const caption = fields.caption ? fillVars(fields.caption, contact, variableDefaults) : "";
        let ok = images.length > 0;
        let lastMsg: string | undefined;
        for (let idx = 0; idx < images.length; idx++) {
          const params = new URLSearchParams({ token: inst.token, to: contact.phone, image: images[idx] });
          if (idx === 0 && caption) params.set("caption", caption);
          const res = await fetch(`${BASE}/${inst.instance_id}/messages/image`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          });
          const r = await res.json().catch(() => ({}));
          if (!(r.sent === "true" || r.sent === true)) { ok = false; lastMsg = r.message ?? JSON.stringify(r); }
        }
        data = { sent: ok ? "true" : "false", message: lastMsg };
      } else {
        const { endpoint, params } = buildRequest(inst.token, contact.phone, msgType, template, contact, variableDefaults);
        const res = await fetch(`${BASE}/${inst.instance_id}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        data = await res.json();
      }

      if (data.sent === "true" || data.sent === true) {
        results.sent++;

        if (orgId) {
          let convId: string | undefined;
          if (contact.id) {
            const { data: conv } = await supabase
              .from("conversations")
              .select("id")
              .eq("org_id", orgId)
              .eq("contact_id", contact.id)
              .maybeSingle();
            convId = conv?.id;
          }

          await supabase.from("messages").insert({
            org_id: orgId,
            conversation_id: convId ?? undefined,
            direction: "outbound",
            source: "bulk",
            type: msgType === "text" ? "text" : msgType,
            content: msgType === "text" ? fillVars(template, contact, variableDefaults) : template,
            status: "sent",
            sent_by: currentUser.userId,
          });
        }
      } else {
        results.failed++;
        results.errors.push(`${contact.phone}: ${data.message ?? JSON.stringify(data)}`);
      }
    } catch (e) {
      results.failed++;
      results.errors.push(`${contact.phone}: ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}
