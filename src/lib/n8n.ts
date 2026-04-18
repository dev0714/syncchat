export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: unknown[];
  connections: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface N8nWebhookTrigger {
  workflowId: string;
  payload: Record<string, unknown>;
}

class N8nClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`N8n error: ${res.status} - ${err}`);
    }
    return res.json();
  }

  async getWorkflows(): Promise<{ data: N8nWorkflow[] }> {
    return this.request("GET", "/workflows");
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request("GET", `/workflows/${id}`);
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request("POST", `/workflows/${id}/activate`);
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request("POST", `/workflows/${id}/deactivate`);
  }

  async triggerWebhook(webhookUrl: string, payload: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}

export function createN8nClient(baseUrl: string, apiKey: string) {
  return new N8nClient(baseUrl, apiKey);
}
