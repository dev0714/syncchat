/**
 * WAHA (https://waha.devlike.pro) WhatsApp HTTP API client.
 *
 * Kept deliberately separate from src/lib/ultramsg.ts. Methods return the same
 * normalized shape as UltraMsg ({ sent, id, message }) so the send dispatcher in
 * src/lib/messaging.ts can treat both providers uniformly.
 *
 * Auth: header `X-Api-Key`. Identity: a base URL + a session name (e.g. "default")
 * + a chatId ("<digits>@c.us"). For a WAHA whatsapp_instances row we store
 * instance_id = session, token = api_key, base_url = server URL.
 */

export interface WahaResponse {
  sent: string; // "true" | "false"
  id?: string;
  message?: string;
}

/**
 * The n8n webhook that the WAHA inbound AI flow (SyncChat_WAHA) listens on.
 * Every WAHA session we create/recreate must point here so inbound messages
 * reach the AI flow. Kept as a single source of truth for create + self-heal.
 */
export const WAHA_INBOUND_WEBHOOK = "https://n8n.leadsync.co.za/webhook/waha-syncchat-inbound";

export type WahaSessionStatus = "connected" | "disconnected" | "qr_required" | "loading";

function trimBase(baseUrl: string): string {
  return (baseUrl || "").replace(/\/$/, "");
}

export function wahaChatId(to: string): string {
  const digits = String(to ?? "")
    .replace(/@c\.us$/i, "")
    .replace(/@g\.us$/i, "")
    .replace(/[^\d]/g, "");
  return `${digits}@c.us`;
}

/** Map a WAHA session status (STARTING/SCAN_QR_CODE/WORKING/...) to our 4 states. */
export function mapWahaStatus(status?: string | null): WahaSessionStatus {
  switch (String(status ?? "").toUpperCase()) {
    case "WORKING":
      return "connected";
    case "SCAN_QR_CODE":
      return "qr_required";
    case "STARTING":
      return "loading";
    default:
      return "disconnected";
  }
}

function extractId(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  if (typeof d.id === "string") return d.id;
  const idObj = d.id as Record<string, unknown> | undefined;
  if (idObj && typeof idObj._serialized === "string") return idObj._serialized;
  const key = d.key as Record<string, unknown> | undefined;
  if (key && typeof key.id === "string") return key.id;
  return undefined;
}

async function post(baseUrl: string, apiKey: string, path: string, body: Record<string, unknown>): Promise<WahaResponse> {
  try {
    const res = await fetch(`${trimBase(baseUrl)}${path}`, {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data as Record<string, unknown>)?.message;
      return { sent: "false", message: typeof msg === "string" ? msg : `HTTP ${res.status}` };
    }
    return { sent: "true", id: extractId(data) };
  } catch (err) {
    return { sent: "false", message: err instanceof Error ? err.message : String(err) };
  }
}

export const waha = {
  async sendText(baseUrl: string, apiKey: string, payload: { session: string; to: string; body: string }): Promise<WahaResponse> {
    return post(baseUrl, apiKey, "/api/sendText", {
      session: payload.session,
      chatId: wahaChatId(payload.to),
      text: payload.body,
    });
  },

  /** kind: image -> sendImage, voice -> sendVoice, anything else -> sendFile */
  async sendMedia(
    baseUrl: string,
    apiKey: string,
    payload: { session: string; to: string; url: string; mimetype?: string; filename?: string; caption?: string; kind?: "image" | "voice" | "file" },
  ): Promise<WahaResponse> {
    const endpoint = payload.kind === "image" ? "sendImage" : payload.kind === "voice" ? "sendVoice" : "sendFile";
    const body: Record<string, unknown> = {
      session: payload.session,
      chatId: wahaChatId(payload.to),
      file: { url: payload.url, mimetype: payload.mimetype, filename: payload.filename },
    };
    if (payload.caption && endpoint !== "sendVoice") body.caption = payload.caption;
    return post(baseUrl, apiKey, `/api/${endpoint}`, body);
  },

  /** Create + start a session (idempotent-ish: ignores "already exists"). */
  async startSession(baseUrl: string, apiKey: string, session: string, webhookUrl?: string): Promise<void> {
    const webhooks = webhookUrl ? [{ url: webhookUrl, events: ["message"] }] : [];
    // The NOWEB engine needs its store enabled for @lid → phone resolution and
    // contact/chat data; harmless on other engines. full_sync backfills history.
    const config = { webhooks, noweb: { store: { enabled: true, fullSync: true } } };
    try {
      const res = await fetch(`${trimBase(baseUrl)}/api/sessions`, {
        method: "POST",
        headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ name: session, start: true, config }),
      });
      // 201 created, or 4xx if it already exists — then just (re)start it.
      if (!res.ok) {
        await fetch(`${trimBase(baseUrl)}/api/sessions/${encodeURIComponent(session)}/start`, {
          method: "POST",
          headers: { "X-Api-Key": apiKey },
        }).catch(() => {});
      }
    } catch {
      // best-effort
    }
  },

  /** Force-restart a session (regenerates the pairing QR). Use when it's FAILED/STOPPED. */
  async restartSession(baseUrl: string, apiKey: string, session: string): Promise<void> {
    try {
      await fetch(`${trimBase(baseUrl)}/api/sessions/${encodeURIComponent(session)}/restart`, {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
      });
    } catch {
      // best-effort
    }
  },

  /**
   * Log the linked WhatsApp account out of a session (unlink the number) while
   * keeping the session itself, so it can be re-paired later by showing a new QR.
   * Returns true if WAHA accepted the logout.
   */
  async logoutSession(baseUrl: string, apiKey: string, session: string): Promise<boolean> {
    try {
      const res = await fetch(`${trimBase(baseUrl)}/api/sessions/${encodeURIComponent(session)}/logout`, {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Returns our normalized status, or null if unreachable. */
  async getSessionStatus(baseUrl: string, apiKey: string, session: string): Promise<WahaSessionStatus | null> {
    try {
      const res = await fetch(`${trimBase(baseUrl)}/api/sessions/${encodeURIComponent(session)}`, {
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return mapWahaStatus((data as Record<string, unknown>)?.status as string | undefined);
    } catch {
      return null;
    }
  },

  /** Fetch the pairing QR as a data URL (data:image/png;base64,...), or null. */
  async getQrDataUrl(baseUrl: string, apiKey: string, session: string): Promise<string | null> {
    try {
      const res = await fetch(`${trimBase(baseUrl)}/api/${encodeURIComponent(session)}/auth/qr?format=image`, {
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = res.headers.get("content-type") || "image/png";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  },
};
