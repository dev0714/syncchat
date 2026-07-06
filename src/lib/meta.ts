/**
 * Official Meta WhatsApp Business Cloud API client.
 *
 * Kept separate from ultramsg.ts / waha.ts. Methods return the same normalized
 * { sent, id, message } shape so the dispatcher in src/lib/messaging.ts can
 * treat all providers uniformly.
 *
 * For a meta whatsapp_instances row we store:
 *   instance_id = phone_number_id, token = permanent access token, base_url = null.
 * Credentials are per-instance — every client brings their own Meta app/WABA.
 *
 * Note: free-form messages only deliver inside the 24h customer-service window
 * (i.e. within 24h of the customer's last inbound message). Business-initiated
 * messages outside that window require pre-approved template messages.
 */

export const GRAPH_BASE = "https://graph.facebook.com/v22.0";

export interface MetaResponse {
  sent: string; // "true" | "false"
  id?: string;
  message?: string;
}

function toWaNumber(to: string): string {
  return String(to ?? "").replace(/@c\.us$/i, "").replace(/[^\d]/g, "");
}

async function post(phoneNumberId: string, token: string, payload: Record<string, unknown>): Promise<MetaResponse> {
  try {
    const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { sent: "false", message: data?.error?.message ?? `HTTP ${res.status}` };
    }
    return { sent: "true", id: data?.messages?.[0]?.id };
  } catch (err) {
    return { sent: "false", message: err instanceof Error ? err.message : String(err) };
  }
}

export const meta = {
  async sendText(phoneNumberId: string, token: string, payload: { to: string; body: string }): Promise<MetaResponse> {
    return post(phoneNumberId, token, {
      to: toWaNumber(payload.to),
      type: "text",
      text: { preview_url: true, body: payload.body },
    });
  },

  /** kind: image | document | audio | video — media by public URL. */
  async sendMedia(
    phoneNumberId: string,
    token: string,
    payload: { to: string; url: string; kind: "image" | "document" | "audio" | "video"; caption?: string; filename?: string },
  ): Promise<MetaResponse> {
    const media: Record<string, unknown> = { link: payload.url };
    if (payload.caption && payload.kind !== "audio") media.caption = payload.caption;
    if (payload.filename && payload.kind === "document") media.filename = payload.filename;
    return post(phoneNumberId, token, { to: toWaNumber(payload.to), type: payload.kind, [payload.kind]: media });
  },

  async sendLocation(
    phoneNumberId: string,
    token: string,
    payload: { to: string; latitude: number | string; longitude: number | string; name?: string },
  ): Promise<MetaResponse> {
    return post(phoneNumberId, token, {
      to: toWaNumber(payload.to),
      type: "location",
      location: { latitude: Number(payload.latitude), longitude: Number(payload.longitude), name: payload.name ?? "" },
    });
  },

  /**
   * Validate credentials by fetching the phone number object.
   * Returns the display number on success, or the Graph API error message.
   */
  async verifyNumber(
    phoneNumberId: string,
    token: string,
  ): Promise<{ ok: boolean; displayPhoneNumber?: string; error?: string }> {
    try {
      const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}?fields=display_phone_number,verified_name`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        display_phone_number?: string;
        error?: { message?: string };
      };
      if (!res.ok) return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
      return { ok: true, displayPhoneNumber: data.display_phone_number };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
