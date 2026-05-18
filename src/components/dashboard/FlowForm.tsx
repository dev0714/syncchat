"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bot, Shield, Palette, BookOpen, Wrench,
  MessageSquare, Hash, UserPlus, Play, Clock, ChevronRight,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import type { N8nFlow, FlowTool } from "@/types";
import { cn } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

/* ── Trigger types ── */
const TRIGGER_TYPES = [
  { value: "inbound_message", label: "Inbound Message", icon: MessageSquare, description: "Triggers on every incoming WhatsApp message" },
  { value: "keyword",         label: "Keyword Match",   icon: Hash,          description: "Triggers when message contains a keyword" },
  { value: "new_contact",     label: "New Contact",     icon: UserPlus,      description: "Triggers when a new contact is created" },
  { value: "manual",          label: "Manual Trigger",  icon: Play,          description: "Manually triggered from this dashboard" },
  { value: "schedule",        label: "Scheduled",       icon: Clock,         description: "Runs on a defined schedule" },
] as const;

/* ── Prompt tabs ── */
const PROMPT_TABS = [
  {
    id: "role" as const,
    label: "Role",
    icon: Bot,
    heading: "Agent Role *",
    hint: "Who is this AI? Define its purpose, persona, and primary function.",
    placeholder: `e.g. You are a helpful customer support agent for Acme Corp. Your primary job is to answer product questions, assist with orders, and escalate complex issues to human agents. You represent the brand professionally at all times.`,
  },
  {
    id: "guardrails" as const,
    label: "Guardrails",
    icon: Shield,
    heading: "Guardrails",
    hint: "What should the agent never do or say? Set firm limits.",
    placeholder: `e.g. Never share pricing without manager approval. Do not discuss competitors. Never promise delivery dates. If a customer is abusive, politely end the conversation. Do not make up information — if you don't know, say so and offer to escalate.`,
  },
  {
    id: "tone" as const,
    label: "Tone & Style",
    icon: Palette,
    heading: "Tone & Style",
    hint: "How should the agent communicate? Define language, formality, and personality.",
    placeholder: `e.g. Friendly and professional. Use simple, clear language. Avoid jargon. Keep responses concise — under 3 sentences where possible. Use the customer's name when known. Mirror the energy of the conversation.`,
  },
  {
    id: "context" as const,
    label: "Business Context",
    icon: BookOpen,
    heading: "Business Context",
    hint: "Background about your business, products, services, or key information the AI needs.",
    placeholder: `e.g. Acme Corp is a South African e-commerce retailer selling electronics and appliances. We operate Mon–Fri 8am–6pm SAST. Return policy: 30 days with receipt. Deliveries: 3–5 business days nationally. WhatsApp support is available 24/7 via this AI agent.`,
  },
  {
    id: "tools" as const,
    label: "Tools",
    icon: Wrench,
    heading: "AI Tools",
    hint: "Enable tools the agent can use to look things up or take actions during a conversation.",
    placeholder: "",
  },
];

/* ── Available tools catalogue ── */
interface ToolDef {
  id: string;
  label: string;
  description: string;
  emoji: string;
  configFields?: { key: string; label: string; placeholder: string }[];
}

const TOOL_CATALOGUE: ToolDef[] = [
  {
    id: "order_lookup",
    label: "Order Lookup",
    description: "Let the agent look up order status and details by order ID or customer phone number.",
    emoji: "📦",
  },
  {
    id: "contact_crm",
    label: "Contact CRM",
    description: "Read and update contact records — name, tags, email, and custom fields.",
    emoji: "👤",
  },
  {
    id: "inventory_check",
    label: "Inventory Check",
    description: "Check product stock levels and availability before confirming orders or holds.",
    emoji: "🏷️",
  },
  {
    id: "booking_calendar",
    label: "Booking & Calendar",
    description: "Check availability and create bookings or appointments on your calendar.",
    emoji: "📅",
  },
  {
    id: "escalate_human",
    label: "Escalate to Human",
    description: "Notify your team and hand the conversation off to a human agent when needed.",
    emoji: "🙋",
  },
  {
    id: "send_media",
    label: "Send Image / File",
    description: "Allow the agent to send images, PDFs, or other media files in response.",
    emoji: "🖼️",
  },
  {
    id: "custom_webhook",
    label: "Custom Webhook",
    description: "Call any external API or endpoint when the agent needs data or wants to trigger an action.",
    emoji: "🔗",
    configFields: [
      { key: "url",    label: "Endpoint URL",   placeholder: "https://your-api.com/webhook" },
      { key: "secret", label: "Secret / Token", placeholder: "Bearer sk-..." },
    ],
  },
  {
    id: "send_template",
    label: "Send Template Message",
    description: "Let the agent trigger a saved message template — e.g. a confirmation or follow-up.",
    emoji: "📋",
  },
];

interface WhatsAppInstance { id: string; name: string; instance_id: string; phone_number?: string | null; }

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

function initTools(existing?: FlowTool[]): FlowTool[] {
  return TOOL_CATALOGUE.map(def => {
    const found = existing?.find(t => t.id === def.id);
    return { id: def.id, enabled: found?.enabled ?? false, config: found?.config ?? {} };
  });
}

export default function FlowForm({ editing }: { editing?: N8nFlow | null }) {
  const router = useRouter();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<typeof PROMPT_TABS[number]["id"]>("role");

  const [form, setForm] = useState({
    name:             editing?.name ?? "",
    description:      editing?.description ?? "",
    trigger_type:     (editing?.trigger_type ?? "inbound_message") as N8nFlow["trigger_type"],
    trigger_keyword:  editing?.trigger_keyword ?? "",
    instance_id:      editing?.instance_id ?? "",
    prompt_role:      editing?.prompt_role ?? "",
    prompt_guardrails:editing?.prompt_guardrails ?? "",
    prompt_tone:      editing?.prompt_tone ?? "",
    prompt_context:   editing?.prompt_context ?? "",
  });

  const [tools, setTools] = useState<FlowTool[]>(() => initTools(editing?.prompt_tools));

  useEffect(() => {
    fetchJsonWithTimeout("/api/flows").then(({ response, body }) => {
      if (response.ok) {
        setOrgId(body.orgId ?? "");
        setInstances((body.instances ?? []) as WhatsAppInstance[]);
      }
    }).finally(() => setLoading(false));
  }, []);

  function toggleTool(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }

  function setToolConfig(id: string, key: string, value: string) {
    setTools(prev => prev.map(t =>
      t.id === id ? { ...t, config: { ...t.config, [key]: value } } : t
    ));
  }

  async function handleSave() {
    if (!form.name.trim())        { setError("Flow name is required."); return; }
    if (!form.instance_id)        { setError("Select a WhatsApp instance."); return; }
    if (!form.prompt_role.trim()) { setError("Agent role is required — fill in the Role tab."); return; }
    setSaving(true);
    setError("");
    try {
      const { response, body } = await fetchJsonWithTimeout("/api/flows", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          orgId,
          ...form,
          description: form.description || null,
          trigger_keyword: form.trigger_keyword || undefined,
          prompt_tools: tools,
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

  const promptFilled = (id: string) =>
    id === "tools"
      ? tools.some(t => t.enabled)
      : ((form as Record<string, string>)[`prompt_${id}`] ?? "").trim().length > 0;

  const enabledCount = tools.filter(t => t.enabled).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/flows")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Flows
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{editing ? "Edit Flow" : "New Flow"}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {editing ? `Editing "${editing.name}"` : "Set up a new AI-powered automation"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Setup ── */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">1</div>
            <h2 className="font-semibold text-slate-800">Setup</h2>
          </div>

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
            <label className="label">Trigger Type</label>
            <div className="grid grid-cols-1 gap-2 mt-1">
              {TRIGGER_TYPES.map(({ value, label, icon: Icon, description }) => (
                <label key={value} className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors",
                  form.trigger_type === value ? "border-whatsapp-teal bg-whatsapp-teal/5" : "border-slate-200 hover:border-slate-300"
                )}>
                  <input type="radio" name="trigger" value={value} checked={form.trigger_type === value}
                    onChange={() => setForm({ ...form, trigger_type: value as N8nFlow["trigger_type"] })} className="hidden" />
                  <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", form.trigger_type === value ? "text-whatsapp-teal" : "text-slate-400")} />
                  <div>
                    <p className={cn("text-sm font-medium", form.trigger_type === value ? "text-whatsapp-teal" : "text-slate-700")}>{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {form.trigger_type === "keyword" && (
            <div>
              <label className="label">Keyword to Match</label>
              <input className="input" placeholder="e.g. HELLO, ORDER, SUPPORT"
                value={form.trigger_keyword} onChange={e => setForm({ ...form, trigger_keyword: e.target.value })} />
            </div>
          )}
        </div>

        {/* ── RIGHT: AI Prompt ── */}
        <div className="card p-6 space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">2</div>
              <h2 className="font-semibold text-slate-800">AI Prompt</h2>
            </div>
            {enabledCount > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {enabledCount} tool{enabledCount > 1 ? "s" : ""} enabled
              </span>
            )}
          </div>

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
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                activeTab === id ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-700"
              )}>
                <Icon className="w-3.5 h-3.5" />
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
              <p className="text-xs text-slate-400 mb-2">{tab.hint}</p>
              <textarea
                className="input resize-y"
                style={{ minHeight: 200 }}
                placeholder={tab.placeholder}
                value={(form as Record<string, string>)[`prompt_${tab.id}`]}
                onChange={e => setForm({ ...form, [`prompt_${tab.id}`]: e.target.value })}
              />
            </div>
          ))}

          {/* Tools tab */}
          {activeTab === "tools" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Toggle the tools your agent is allowed to use. Enabled tools are sent to the AI as callable actions — it will decide when to invoke them based on the conversation.
              </p>
              {TOOL_CATALOGUE.map(def => {
                const tool = tools.find(t => t.id === def.id)!;
                return (
                  <div key={def.id} className={cn(
                    "rounded-xl border transition-colors",
                    tool.enabled ? "border-purple-200 bg-purple-50/50" : "border-slate-200 bg-white"
                  )}>
                    <div className="flex items-start gap-3 p-3">
                      <span className="text-xl leading-none mt-0.5">{def.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{def.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{def.description}</p>
                      </div>
                      <button onClick={() => toggleTool(def.id)} className="flex-shrink-0 mt-0.5">
                        {tool.enabled
                          ? <ToggleRight className="w-6 h-6 text-purple-600" />
                          : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                      </button>
                    </div>

                    {/* Config fields for tools that need them */}
                    {tool.enabled && def.configFields && def.configFields.length > 0 && (
                      <div className="px-3 pb-3 space-y-2 border-t border-purple-100 pt-3">
                        {def.configFields.map(field => (
                          <div key={field.key}>
                            <label className="text-xs font-medium text-slate-600 block mb-1">{field.label}</label>
                            <input
                              className="input text-sm"
                              placeholder={field.placeholder}
                              value={tool.config?.[field.key] ?? ""}
                              onChange={e => setToolConfig(def.id, field.key, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completion chips */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {PROMPT_TABS.map(tab => {
              const filled = tab.id === "tools" ? enabledCount > 0 : promptFilled(tab.id);
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                  "rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors",
                  filled ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-50 text-slate-400 border border-slate-200"
                )}>
                  {filled ? "✓ " : ""}{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3 pt-2 pb-8">
        <button onClick={() => router.push("/dashboard/flows")} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving && <PacmanLoader size={14} label="Saving" />}
          {saving ? "Saving…" : editing ? "Save Changes" : "Create Flow"}
          {!saving && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
