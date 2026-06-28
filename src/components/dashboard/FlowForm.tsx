"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Bot, Shield, Palette, BookOpen, Wrench, Check,
  ToggleLeft, ToggleRight, Plus, Trash2,
} from "lucide-react";
import type { N8nFlow, FlowTool } from "@/types";
import { cn } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

/* ── Prompt tabs ── */
const PROMPT_TABS = [
  {
    id: "role" as const,
    label: "Role",
    icon: Bot,
    heading: "Agent Role *",
    hint: "Define who the AI is — its name, purpose, and primary job. This is the most important field. Think of it as the job description for your bot.",
    placeholder: `e.g. You are a helpful customer support agent for Acme Corp. Your primary job is to answer product questions, assist with orders, and escalate complex issues to human agents. You represent the brand professionally at all times.`,
  },
  {
    id: "guardrails" as const,
    label: "Guardrails",
    icon: Shield,
    heading: "Guardrails",
    hint: "Hard limits on what the AI must never do or say. Use this to keep the bot safe and on-brand — e.g. never discuss competitors, never share pricing without approval, always escalate billing disputes to a human.",
    placeholder: `e.g. Never share pricing without manager approval. Do not discuss competitors. Never promise delivery dates. If a customer is abusive, politely end the conversation. Do not make up information — if you don't know, say so and offer to escalate.`,
  },
  {
    id: "tone" as const,
    label: "Tone & Style",
    icon: Palette,
    heading: "Tone & Style",
    hint: "Define how the AI speaks. Formal or casual? Short or detailed? Should it use the customer's name? This shapes the personality of every response.",
    placeholder: `e.g. Friendly and professional. Use simple, clear language. Avoid jargon. Keep responses concise — under 3 sentences where possible. Use the customer's name when known. Mirror the energy of the conversation.`,
  },
  {
    id: "context" as const,
    label: "Business Context",
    icon: BookOpen,
    heading: "Business Context",
    hint: "Background facts the AI needs to answer questions accurately — your opening hours, return policy, product range, delivery times, locations, and anything else customers regularly ask about.",
    placeholder: `e.g. Acme Corp is a South African e-commerce retailer selling electronics and appliances. We operate Mon–Fri 8am–6pm SAST. Return policy: 30 days with receipt. Deliveries: 3–5 business days nationally. WhatsApp support available 24/7 via this AI agent.`,
  },
  {
    id: "tools" as const,
    label: "Tools",
    icon: Wrench,
    heading: "AI Tools",
    hint: "Extra capabilities the AI can use beyond replying with text — connect any API, database, MCP server, or website. The AI decides when to invoke them based on the conversation.",
    placeholder: "",
  },
];

/* ── Generic connection types ──
   Each type can have many instances per flow. Everything is config-driven —
   nothing about a specific provider is hardcoded. n8n reads these from
   prompt_tools and dispatches generically. */
type FieldDef = {
  key: string;
  label: string;
  placeholder: string;
  kind?: "text" | "select";
  options?: string[];
};
interface ConnectionTypeDef {
  type: string;
  label: string;
  emoji: string;
  blurb: string;
  fields: FieldDef[];
}

const CONNECTION_TYPES: ConnectionTypeDef[] = [
  {
    type: "api",
    label: "API",
    emoji: "🔌",
    blurb: "Call any REST API. The AI supplies query params (GET) or a JSON body (POST/PUT) at call time.",
    fields: [
      { key: "method", label: "Method", placeholder: "GET", kind: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      { key: "url", label: "URL", placeholder: "https://api.example.com/v1/resource" },
      { key: "auth_header", label: "Authorization header (optional)", placeholder: "Bearer sk-... (sent as Authorization)" },
    ],
  },
  {
    type: "database",
    label: "Database",
    emoji: "🗄️",
    blurb: "Query a Supabase / PostgREST database. The AI picks a table and filters (read-only, structured).",
    fields: [
      { key: "url", label: "Project URL", placeholder: "https://xxxx.supabase.co" },
      { key: "api_key", label: "Service / Anon key", placeholder: "eyJ... (sent as apikey + Bearer)" },
      { key: "allowed_tables", label: "Allowed tables (comma-separated, optional)", placeholder: "bookings, menu_items" },
    ],
  },
  {
    type: "mcp",
    label: "MCP Server",
    emoji: "🧩",
    blurb: "Connect to an MCP server so the AI can use its tools.",
    fields: [
      { key: "server_url", label: "Server URL (SSE / HTTP)", placeholder: "https://mcp.example.com/sse" },
      { key: "auth_header", label: "Authorization header (optional)", placeholder: "Bearer ..." },
    ],
  },
  {
    type: "website",
    label: "Website",
    emoji: "🌐",
    blurb: "Fetch and read a web page — live prices, menus, availability, any public content.",
    fields: [
      { key: "url", label: "Website URL", placeholder: "https://example.com/menu" },
    ],
  },
];

const GENERIC_TYPES = CONNECTION_TYPES.map(c => c.type);

/* ── Built-in SyncChat actions (act on SyncChat itself, no external setup) ── */
interface NativeDef { id: string; label: string; description: string; emoji: string; }
const NATIVE_TOOLS: NativeDef[] = [
  { id: "escalate_human", label: "Escalate to Human", description: "Notify your team and hand the conversation off to a human agent when needed.", emoji: "🙋" },
  { id: "send_template", label: "Send Template Message", description: "Let the agent trigger a saved message template — e.g. a confirmation or follow-up.", emoji: "📋" },
  { id: "send_media", label: "Send Image / File", description: "Allow the agent to send images, PDFs, or other media files in response.", emoji: "🖼️" },
];

interface WhatsAppInstance { id: string; name: string; instance_id: string; phone_number?: string | null; }

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "tool_" + Math.random().toString(36).slice(2, 10);
}

async function fetchJsonWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const body = await response.json().catch(() => null);
    return { response, body };
  } finally {
    clearTimeout(timeout);
  }
}

/* Map any legacy prompt_tools entry to the new generic shape so existing
   flows keep working after the redesign. Returns null for entries that are
   dropped (native ones are seeded separately by initNative). */
function migrateLegacy(t: FlowTool): FlowTool | null {
  if (t.type && GENERIC_TYPES.includes(t.type)) return { ...t, config: t.config ?? {} };
  switch (t.id) {
    case "custom_webhook":
      return { id: t.id, type: "api", name: t.config?.name || "Custom API", description: t.config?.description || "Call an external API.", enabled: t.enabled, config: { method: "POST", url: t.config?.url ?? "", auth_header: t.config?.secret ?? "" } };
    case "meankat_booking":
      return { id: t.id, type: "api", name: t.config?.name || "Booking API", description: t.config?.description || "Check availability and create bookings.", enabled: t.enabled, config: { method: "POST", url: t.config?.base_url ?? "", auth_header: t.config?.api_key ? "Bearer " + t.config.api_key : "" } };
    case "website_check":
      return { id: t.id, type: "website", name: t.config?.name || "Website", description: t.config?.description || t.config?.notes || "Read content from a website.", enabled: t.enabled, config: { url: t.config?.url ?? "" } };
    case "order_lookup":
    case "inventory_check":
    case "booking_calendar":
      return { id: t.id, type: "api", name: t.id, description: "", enabled: t.enabled, config: { method: "GET", url: t.config?.endpoint ?? "", auth_header: "" } };
    default:
      return null;
  }
}

function initConnections(existing?: FlowTool[]): FlowTool[] {
  if (!existing) return [];
  const out: FlowTool[] = [];
  for (const t of existing) {
    if (NATIVE_TOOLS.some(n => n.id === t.id)) continue;
    const migrated = migrateLegacy(t);
    if (migrated) out.push({ ...migrated, id: migrated.id || genId() });
  }
  return out;
}

function initNative(existing?: FlowTool[]): FlowTool[] {
  return NATIVE_TOOLS.map(def => {
    const found = existing?.find(t => t.id === def.id);
    return { id: def.id, type: def.id, name: def.label, description: def.description, enabled: found?.enabled ?? false, config: found?.config ?? {} };
  });
}

export default function FlowForm({ editing }: { editing?: N8nFlow | null }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<typeof PROMPT_TABS[number]["id"]>("role");

  const [form, setForm] = useState({
    name:              editing?.name ?? "",
    description:       editing?.description ?? "",
    trigger_type:      "inbound_message" as const,
    instance_id:       editing?.instance_id ?? "",
    prompt_role:       editing?.prompt_role ?? "",
    prompt_guardrails: editing?.prompt_guardrails ?? "",
    prompt_tone:       editing?.prompt_tone ?? "",
    prompt_context:    editing?.prompt_context ?? "",
    terms_conditions:  editing?.terms_conditions ?? "",
  });

  const [connections, setConnections] = useState<FlowTool[]>(() => initConnections(editing?.prompt_tools));
  const [nativeTools, setNativeTools] = useState<FlowTool[]>(() => initNative(editing?.prompt_tools));

  useEffect(() => {
    fetchJsonWithTimeout("/api/flows").then(({ response, body }) => {
      if (response.ok) {
        setOrgId(body.orgId ?? "");
        setInstances((body.instances ?? []) as WhatsAppInstance[]);
      }
    }).finally(() => setLoading(false));
  }, []);

  function goToStep2() {
    if (!form.name.trim())    { setError("Flow name is required."); return; }
    if (!form.instance_id)    { setError("Select a WhatsApp instance."); return; }
    setError("");
    setStep(2);
  }

  function addConnection(type: string) {
    const initialConfig: Record<string, string> = type === "api" ? { method: "GET" } : {};
    setConnections(prev => [...prev, { id: genId(), type, name: "", description: "", enabled: true, config: initialConfig }]);
  }
  function removeConnection(id: string) {
    setConnections(prev => prev.filter(c => c.id !== id));
  }
  function updateConnection(id: string, patch: Partial<FlowTool>) {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function updateConnectionConfig(id: string, key: string, value: string) {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, config: { ...c.config, [key]: value } } : c));
  }
  function toggleNative(id: string) {
    setNativeTools(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }

  async function handleSave() {
    if (!form.prompt_role.trim()) { setError("Agent role is required — fill in the Role tab."); return; }
    if (connections.some(c => !(c.name ?? "").trim())) {
      setError("Every connection needs a name — it's how the AI refers to it.");
      setActiveTab("tools");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // All tool instances are stored in n8n_flows.prompt_tools (Supabase) and
      // read by n8n at runtime, so the agent can call them when needed.
      const prompt_tools: FlowTool[] = [
        ...connections.map(c => ({
          id: c.id,
          type: c.type,
          name: (c.name ?? "").trim(),
          description: (c.description ?? "").trim(),
          enabled: c.enabled,
          config: c.config ?? {},
        })),
        ...nativeTools,
      ];
      const { response, body } = await fetchJsonWithTimeout("/api/flows", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          orgId,
          ...form,
          description:  form.description || null,
          prompt_tools,
        }),
      });
      if (!response.ok) throw new Error(body?.error ?? "Failed to save flow");
      router.push("/dashboard/flows");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flow");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><PacmanLoader size={40} label="Loading" /></div>;
  }

  const enabledCount = connections.filter(c => c.enabled).length + nativeTools.filter(t => t.enabled).length;

  const promptFilled = (id: string) =>
    id === "tools"
      ? enabledCount > 0
      : ((form as Record<string, string>)[`prompt_${id}`] ?? "").trim().length > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step === 2 ? setStep(1) : router.push("/dashboard/flows")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 2 ? "Back to Setup" : "Flows"}
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{editing ? "Edit Flow" : "New Flow"}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {editing ? `Editing "${editing.name}"` : "Set up a new AI-powered automation"}
          </p>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-3">
        {/* Step 1 */}
        <button
          onClick={() => setStep(1)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors",
            step === 1
              ? "bg-slate-900 text-white"
              : "bg-green-100 text-green-700"
          )}
        >
          {step === 2
            ? <Check className="w-3.5 h-3.5" />
            : <span className="w-4 h-4 text-center leading-none">1</span>
          }
          Setup
        </button>

        <div className="flex-1 h-px bg-slate-200 max-w-12" />

        {/* Step 2 */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
          step === 2
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-400"
        )}>
          <span className="w-4 h-4 text-center leading-none">2</span>
          AI Prompt
        </div>
      </div>

      {/* ── STEP 1: Setup ── */}
      {step === 1 && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Flow Name *</label>
            <input className="input" placeholder="e.g. Auto Reply Bot"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="What does this flow do? (optional)"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="label">WhatsApp Instance *</label>
            <select className="input" value={form.instance_id}
              onChange={e => setForm({ ...form, instance_id: e.target.value })}>
              <option value="">— Select an instance —</option>
              {instances.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.phone_number ?? i.instance_id})</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">The WhatsApp number this flow will run on</p>
          </div>

          <div>
            <label className="label">Terms &amp; Conditions</label>
            <textarea
              className="input resize-y"
              style={{ minHeight: 120 }}
              placeholder="Optional. If set, the agent shows this at the start of a new conversation and asks the customer to reply YES to accept before continuing. e.g. Visits are subject to our café rules and cat-welfare guidelines… Reply YES to accept."
              value={form.terms_conditions}
              onChange={e => setForm({ ...form, terms_conditions: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">Shown once at the start of each new conversation; the customer must accept before the agent helps.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push("/dashboard/flows")} className="btn-secondary">Cancel</button>
            <button onClick={goToStep2} className="btn-primary flex items-center gap-2">
              Next: AI Prompt <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: AI Prompt ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex gap-2">
              <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700">
                Build your AI agent&apos;s personality and behaviour. This prompt is passed to the AI every time the flow runs.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-100 overflow-x-auto">
              {PROMPT_TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                  activeTab === id ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-700"
                )}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === "tools"
                    ? enabledCount > 0 && <span className="ml-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full px-1.5 py-px">{enabledCount}</span>
                    : promptFilled(id) && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  }
                </button>
              ))}
            </div>

            {/* Prompt text tabs */}
            {PROMPT_TABS.filter(t => t.id !== "tools").map(tab => activeTab === tab.id && (
              <div key={tab.id} className="space-y-2">
                <label className="label">{tab.heading}</label>
                <p className="text-xs text-slate-500 leading-relaxed">{tab.hint}</p>
                <textarea
                  className="input resize-y"
                  style={{ minHeight: 220 }}
                  placeholder={tab.placeholder}
                  value={(form as Record<string, string>)[`prompt_${tab.id}`]}
                  onChange={e => setForm({ ...form, [`prompt_${tab.id}`]: e.target.value })}
                />
              </div>
            ))}

            {/* Tools tab */}
            {activeTab === "tools" && (
              <div className="space-y-5">
                <p className="text-xs text-slate-500">
                  Add connections your agent can use. You can add several of each type — every one is offered to the AI by its
                  name + description, and saved with the flow so n8n can call it when needed.
                </p>

                {CONNECTION_TYPES.map(ct => {
                  const items = connections.filter(c => c.type === ct.type);
                  return (
                    <div key={ct.type} className="rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg leading-none">{ct.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{ct.label}</p>
                            <p className="text-xs text-slate-500 leading-relaxed">{ct.blurb}</p>
                          </div>
                        </div>
                        <button onClick={() => addConnection(ct.type)}
                          className="btn-secondary flex items-center gap-1 text-xs px-3 py-1.5 flex-shrink-0">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>

                      {items.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400">None added yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {items.map(item => (
                            <div key={item.id} className="p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <input
                                  className="input text-sm font-medium"
                                  placeholder={`Name (e.g. ${ct.label === "API" ? "Bookings API" : ct.label + " 1"})`}
                                  value={item.name ?? ""}
                                  onChange={e => updateConnection(item.id, { name: e.target.value })}
                                />
                                <button onClick={() => updateConnection(item.id, { enabled: !item.enabled })}
                                  title={item.enabled ? "Enabled" : "Disabled"} className="flex-shrink-0">
                                  {item.enabled
                                    ? <ToggleRight className="w-6 h-6 text-purple-600" />
                                    : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                                </button>
                                <button onClick={() => removeConnection(item.id)}
                                  title="Remove" className="flex-shrink-0 text-slate-300 hover:text-red-500">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <textarea
                                className="input text-sm resize-y"
                                style={{ minHeight: 56 }}
                                placeholder="When should the AI use this? (this text is shown to the AI)"
                                value={item.description ?? ""}
                                onChange={e => updateConnection(item.id, { description: e.target.value })}
                              />
                              {ct.fields.map(field => (
                                <div key={field.key}>
                                  <label className="text-xs font-medium text-slate-600 block mb-1">{field.label}</label>
                                  {field.kind === "select" ? (
                                    <select
                                      className="input text-sm"
                                      value={item.config?.[field.key] ?? field.options?.[0] ?? ""}
                                      onChange={e => updateConnectionConfig(item.id, field.key, e.target.value)}
                                    >
                                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  ) : (
                                    <input
                                      className="input text-sm"
                                      placeholder={field.placeholder}
                                      value={item.config?.[field.key] ?? ""}
                                      onChange={e => updateConnectionConfig(item.id, field.key, e.target.value)}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Built-in actions */}
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="p-4 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">Built-in SyncChat actions</p>
                    <p className="text-xs text-slate-500">Actions on SyncChat itself — no setup needed, just toggle on.</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {NATIVE_TOOLS.map(def => {
                      const tool = nativeTools.find(t => t.id === def.id)!;
                      return (
                        <div key={def.id} className="flex items-start gap-3 p-4">
                          <span className="text-lg leading-none mt-0.5">{def.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{def.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{def.description}</p>
                          </div>
                          <button onClick={() => toggleNative(def.id)} className="flex-shrink-0 mt-0.5">
                            {tool.enabled
                              ? <ToggleRight className="w-6 h-6 text-purple-600" />
                              : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Completion status */}
            <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100">
              {PROMPT_TABS.map(tab => {
                const filled = promptFilled(tab.id);
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                    "rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors",
                    filled
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-slate-50 text-slate-400 border border-slate-200"
                  )}>
                    {filled ? "✓ " : ""}{tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pb-8">
            <button onClick={() => { setStep(1); setError(""); }} className="btn-secondary">Back</button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving && <PacmanLoader size={14} label="Saving" />}
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Flow"}
              {!saving && <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
