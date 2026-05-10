import {
  buildUltraMsgMessageRequest,
  type UltraMsgMessageFeature,
} from "@/lib/message-features";

const ULTRAMSG_BASE = "https://api.ultramsg.com";

export interface UltraMsgSendTextPayload {
  token: string;
  to: string;
  body: string;
  priority?: number;
  referenceId?: string;
}

export interface UltraMsgSendMediaPayload {
  token: string;
  to: string;
  image?: string;
  video?: string;
  audio?: string;
  document?: string;
  caption?: string;
}

export interface UltraMsgResponse {
  sent: string;
  id?: string;
  message?: string;
}

export interface UltraMsgGenericMessagePayload {
  token: string;
  type: UltraMsgMessageFeature;
  values: Record<string, string>;
}

export interface UltraMsgInstanceSettingsPayload {
  token: string;
  sendDelay: number | string;
  sendDelayMax: number | string;
  webhook_url?: string;
  webhook_message_received?: boolean | string;
  webhook_message_create?: boolean | string;
  webhook_message_ack?: boolean | string;
  webhook_message_download_media?: boolean | string;
}

export interface UltraMsgInstanceStatus {
  status: string;
  battery?: string;
  plugged?: boolean;
  phone?: {
    id: string;
    name: string;
    phone: string;
  };
}

class UltraMsgClient {
  private async request<T>(
    instanceId: string,
    token: string,
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${ULTRAMSG_BASE}/${instanceId}/${endpoint}`;
    const formData = new URLSearchParams();
    if (body) {
      Object.entries(body).forEach(([k, v]) => {
        if (v !== undefined) formData.set(k, String(v));
      });
    }
    formData.set("token", token);

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: method !== "GET" ? formData.toString() : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`UltraMsg error: ${res.status} - ${err}`);
    }
    return res.json();
  }

  async getInstanceStatus(instanceId: string, token: string): Promise<UltraMsgInstanceStatus> {
    return this.request(instanceId, token, "GET", "instance/status");
  }

  async sendText(instanceId: string, payload: UltraMsgSendTextPayload): Promise<UltraMsgResponse> {
    return this.request(instanceId, payload.token, "POST", "messages/chat", {
      to: payload.to,
      body: payload.body,
      priority: payload.priority ?? 10,
      referenceId: payload.referenceId,
    });
  }

  async sendImage(instanceId: string, payload: UltraMsgSendMediaPayload): Promise<UltraMsgResponse> {
    return this.request(instanceId, payload.token, "POST", "messages/image", {
      to: payload.to,
      image: payload.image,
      caption: payload.caption,
    });
  }

  async sendDocument(instanceId: string, payload: UltraMsgSendMediaPayload): Promise<UltraMsgResponse> {
    return this.request(instanceId, payload.token, "POST", "messages/document", {
      to: payload.to,
      document: payload.document,
      caption: payload.caption,
    });
  }

  async sendVoice(instanceId: string, payload: UltraMsgSendMediaPayload): Promise<UltraMsgResponse> {
    return this.request(instanceId, payload.token, "POST", "messages/voice", {
      to: payload.to,
      audio: payload.audio,
    });
  }

  async sendContact(instanceId: string, payload: { token: string; to: string; contact: string }): Promise<UltraMsgResponse> {
    return this.request(instanceId, payload.token, "POST", "messages/contact", {
      to: payload.to,
      contact: payload.contact,
    });
  }

  async sendReaction(instanceId: string, payload: { token: string; msgId: string; emoji?: string }): Promise<UltraMsgResponse> {
    return this.request(instanceId, payload.token, "POST", "messages/reaction", {
      msgId: payload.msgId,
      emoji: payload.emoji,
    });
  }

  async sendGenericMessage(instanceId: string, payload: UltraMsgGenericMessagePayload): Promise<UltraMsgResponse> {
    const request = buildUltraMsgMessageRequest(payload.type, payload.values);
    return this.request(instanceId, payload.token, "POST", request.endpoint, request.body);
  }

  async clearMessages(instanceId: string, token: string, status: "queue" | "sent" | "unsent" | "invalid"): Promise<UltraMsgResponse> {
    return this.request(instanceId, token, "POST", "messages/clear", { status });
  }

  async resendById(instanceId: string, token: string, id: string): Promise<UltraMsgResponse> {
    return this.request(instanceId, token, "POST", "messages/resendById", { id });
  }

  async resendByStatus(instanceId: string, token: string, status: "unsent" | "expired"): Promise<UltraMsgResponse> {
    return this.request(instanceId, token, "POST", "messages/resendByStatus", { status });
  }

  async getMessages(instanceId: string, token: string, chatId?: string): Promise<unknown[]> {
    const endpoint = chatId
      ? `messages?token=${token}&chatId=${chatId}`
      : `messages?token=${token}`;
    return this.request(instanceId, token, "GET", endpoint);
  }

  async getChats(instanceId: string, token: string): Promise<unknown[]> {
    return this.request(instanceId, token, "GET", `chats?token=${token}`);
  }

  async getContacts(instanceId: string, token: string): Promise<unknown[]> {
    return this.request(instanceId, token, "GET", `contacts?token=${token}`);
  }

  async updateInstanceSettings(instanceId: string, payload: UltraMsgInstanceSettingsPayload): Promise<unknown> {
    return this.request(instanceId, payload.token, "POST", "instance/settings", {
      sendDelay: payload.sendDelay,
      sendDelayMax: payload.sendDelayMax,
      webhook_url: payload.webhook_url ?? "",
      webhook_message_received: payload.webhook_message_received ?? false,
      webhook_message_create: payload.webhook_message_create ?? false,
      webhook_message_ack: payload.webhook_message_ack ?? false,
      webhook_message_download_media: payload.webhook_message_download_media ?? false,
    });
  }

  async setWebhook(instanceId: string, token: string, webhookUrl: string): Promise<unknown> {
    return this.updateInstanceSettings(instanceId, {
      token,
      sendDelay: 1,
      sendDelayMax: 15,
      webhook_url: webhookUrl,
    });
  }

  async getQRCode(instanceId: string, token: string): Promise<{ qrCode: string }> {
    return this.request(instanceId, token, "GET", `instance/qr?token=${token}`);
  }

  async logout(instanceId: string, token: string): Promise<unknown> {
    return this.request(instanceId, token, "POST", "instance/logout", { token });
  }
}

export const ultraMsg = new UltraMsgClient();
