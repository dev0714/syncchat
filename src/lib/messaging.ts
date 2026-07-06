/**
 * Provider-aware send layer. Dispatches to UltraMsg (src/lib/ultramsg.ts) or
 * WAHA (src/lib/waha.ts) based on the instance's `provider`, returning the same
 * { sent, id, message } shape either way. UltraMsg behaviour is unchanged — this
 * just routes; all UltraMsg logic stays in ultramsg.ts.
 */
import { ultraMsg } from "@/lib/ultramsg";
import { waha } from "@/lib/waha";
import { meta } from "@/lib/meta";
import type { UltraMsgMessageFeature } from "@/lib/message-features";

export interface SendableInstance {
  provider?: string | null;
  instance_id: string; // UltraMsg instance id, or WAHA session name
  token: string; // UltraMsg token, or WAHA api_key
  base_url?: string | null; // WAHA server URL (ignored by UltraMsg)
}

export interface SendResult {
  sent: string; // "true" | "false"
  id?: string;
  message?: string;
}

function isWaha(inst: SendableInstance): boolean {
  return inst.provider === "waha";
}

function isMeta(inst: SendableInstance): boolean {
  return inst.provider === "meta";
}

export async function sendText(inst: SendableInstance, payload: { to: string; body: string }): Promise<SendResult> {
  if (isWaha(inst)) {
    return waha.sendText(inst.base_url ?? "", inst.token, { session: inst.instance_id, to: payload.to, body: payload.body });
  }
  if (isMeta(inst)) {
    return meta.sendText(inst.instance_id, inst.token, { to: payload.to, body: payload.body });
  }
  return ultraMsg.sendText(inst.instance_id, { token: inst.token, to: payload.to, body: payload.body });
}

/**
 * Generic/feature message. For UltraMsg this passes straight through to
 * sendGenericMessage. For WAHA we map the common media features to WAHA's
 * send endpoints; unsupported features fall back to a text send of the caption.
 */
export async function sendGeneric(
  inst: SendableInstance,
  payload: { type: UltraMsgMessageFeature; values: Record<string, string>; to: string },
): Promise<SendResult> {
  if (isMeta(inst)) {
    const v = payload.values ?? {};
    const id = inst.instance_id;
    const tk = inst.token;
    const to = payload.to;
    if (payload.type === "text") return meta.sendText(id, tk, { to, body: v.body ?? "" });
    if (payload.type === "image") return meta.sendMedia(id, tk, { to, url: v.image ?? "", kind: "image", caption: v.caption });
    if (payload.type === "document") return meta.sendMedia(id, tk, { to, url: v.document ?? "", kind: "document", caption: v.caption, filename: v.filename });
    if (payload.type === "audio" || payload.type === "voice") return meta.sendMedia(id, tk, { to, url: v.audio ?? "", kind: "audio" });
    if (payload.type === "video") return meta.sendMedia(id, tk, { to, url: v.video ?? "", kind: "video", caption: v.caption });
    if (payload.type === "location") return meta.sendLocation(id, tk, { to, latitude: v.lat ?? "", longitude: v.lng ?? "", name: v.address });
    // vcard / contact / reaction — best-effort text fallback.
    const fallback = v.body ?? v.caption ?? v.vcard ?? v.contact ?? "";
    if (fallback) return meta.sendText(id, tk, { to, body: fallback });
    return { sent: "false", message: `Cloud API does not support sending "${payload.type}" here yet.` };
  }

  if (!isWaha(inst)) {
    return ultraMsg.sendGenericMessage(inst.instance_id, { token: inst.token, type: payload.type, values: payload.values });
  }

  const v = payload.values ?? {};
  const session = inst.instance_id;
  const base = inst.base_url ?? "";
  const to = payload.to;

  if (payload.type === "text") {
    return waha.sendText(base, inst.token, { session, to, body: v.body ?? "" });
  }
  if (payload.type === "image") {
    return waha.sendMedia(base, inst.token, { session, to, url: v.image ?? "", caption: v.caption, kind: "image" });
  }
  if (payload.type === "document") {
    return waha.sendMedia(base, inst.token, { session, to, url: v.document ?? "", filename: v.filename, caption: v.caption, kind: "file" });
  }
  if (payload.type === "audio" || payload.type === "voice") {
    return waha.sendMedia(base, inst.token, { session, to, url: v.audio ?? "", kind: "voice" });
  }
  if (payload.type === "video") {
    return waha.sendMedia(base, inst.token, { session, to, url: v.video ?? "", caption: v.caption, kind: "video" });
  }
  if (payload.type === "location") {
    return waha.sendLocation(base, inst.token, { session, to, latitude: v.lat ?? "", longitude: v.lng ?? "", title: v.address });
  }
  if (payload.type === "vcard") {
    return waha.sendContactVcard(base, inst.token, { session, to, vcards: [v.vcard ?? ""] });
  }
  if (payload.type === "contact") {
    // UltraMsg "contact" is comma-separated contact IDs (phones). Build a minimal
    // vCard per number so WAHA can send them as contact cards.
    const vcards = String(v.contact ?? "")
      .split(",")
      .map((id) => id.replace(/@c\.us$/i, "").replace(/[^\d]/g, ""))
      .filter(Boolean)
      .map((num) => `BEGIN:VCARD\nVERSION:3.0\nFN:${num}\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD`);
    if (vcards.length) return waha.sendContactVcard(base, inst.token, { session, to, vcards });
  }
  // reaction (needs a target message id) isn't meaningful for broadcast — best-effort text.
  const fallback = v.body ?? v.caption ?? v.address ?? "";
  if (fallback) return waha.sendText(base, inst.token, { session, to, body: fallback });
  return { sent: "false", message: `WAHA does not support sending "${payload.type}" yet.` };
}
