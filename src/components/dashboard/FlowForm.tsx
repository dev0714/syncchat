"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bot, Shield, Palette, BookOpen,
  MessageSquare, Hash, UserPlus, Play, Clock, Smartphone, ChevronRight,
} from "lucide-react";
import type { N8nFlow } from "@/types";
import { cn } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

const TRIGGER_TYPES = [
  { value: "inbound_message", label: "Inbound Message", icon: MessageSquare, description: "Triggers on every incoming WhatsApp message" },
  { value: "keyword",         label: "Keyword Match",   icon: Hash,          description: "Triggers when message contains a keyword" },
  { value: "new_contact",     label: "New Contact",     icon: UserPlus,      description: "Triggers when a new contact is created" },
  { value: "manual",          label: "Manual Trigger",  icon: Play,          description: "Manually triggered from this dashboard" },
  { value: "schedule",        label: "Scheduled",       icon: Clock,         description: "Runs on a defined schedule" },
] as const;

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
    hint: "What should the agent never do or say? Set firm boundaries.",
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
    hint: "Provide background about your business, products, services, or any key information the AI needs to know.",
    placeholder: `e.g. Acme Corp is a South African e-commerce retailer selling electronics and appliances. We operate Mon–Fri 8am–6pm SAST. Our return policy allows 30 days with receipt. Deliveries take 3–5 business days nationally. WhatsApp support is available 24/7 via this AI agent.`,
  },
];

interface WhatsAppInstance { id: string; name: string; instance_id: string; phone_number?: string | null; }

interface FlowFormProps {
  editing?: N8nFlow | null;
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

export default function FlowForm({ editing }: FlowFormProps) {
  const router = useRouter();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<typeof PROMPT_TABS[number]["id"]>("role");

  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    trigger_type: (editing?.trigger_type ?? "inbound_message") as N8nFlow["trigger_type"],
    trigger_keyword: editing?.trigger_keyword ?? "",
    instance_id: editing?.instance_id ?? "",
    prompt_role: editing?.prompt_role ?? "",
    prompt_guardrails: editing?.prompt_guardrails ?? "",
    prompt_tone: editing?.prompt_tone ?? "",
    prompt_context: editing?.prompt_context ?? "",
  });

  useEffect(() => {
    async function loadMeta() {
      try {
        const { response, body } = await fetchJsonWithTimeout("/api/flows");
        if (response.ok) {
          setOrgId(body.orgId ?? "");
          setInstances((body.instances ?? []) as WhatsAppInstance[]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  async function handleSave() {
    if (!form.name.trim()) { setError("Flow name is required."); return; }
    if (!form.instance_id) { setError("Select a WhatsApp instance."); return; }
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
          name: form.name,
          description: form.description || null,
          trigger_type: form.trigger_type,
          trigger_keyword: form.trigger_keyword || undefined,
          instance_id: form.instance_id,
          prompt_role: form.prompt_role,
          prompt_guardrails: form.prompt_guardrails,
          prompt_tone: form.prompt_tone,
          prompt_context: form.prompt_context,
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
    return (
      <div className="flex items-center justify-center py-24">
        <PacmanLoader size={40} label="Loading" />
      </div>
    );
  }

  const promptFilled = (id: string) => ((form as Record<string, string>)[`prompt_${id}`] ?? "").trim().length > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/flows")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Flows
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{editing ? "Edit Flow" : "New Flow"}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {editing ? `Editing "${editing.name}"` : "Set up a new AI-powered automation"}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Setup ── */}
        <div className="space-y-5">
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">1</div>
              <h2 className="font-semibold text-slate-800">Setup</h2>
            </div>

            <div>
              <label className="label">Flow Name *</label>
              <input
                className="input"
                placeholder="e.g. Auto Reply Bot"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Description</label>
              <input
                className="input"
                placeholder="What does this flow do? (optional)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="label">WhatsApp Instance *</label>
              <select
                className="input"
                value={form.instance_id}
                onChange={e => setForm({ ...form, instance_id: e.target.value })}
              >
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
                    <input
                      type="radio" name="trigger" value={value}
                      checked={form.trigger_type === value}
                      onChange={() => setForm({ ...form, trigger_type: value as N8nFlow["trigger_type"] })}
                      className="hidden"
                    />
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
                <input
                  className="input"
                  placeholder="e.g. HELLO, ORDER, SUPPORT"
                  value={form.trigger_keyword}
                  onChange={e => setForm({ ...form, trigger_keyword: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: AI Prompt ── */}
        <div className="card p-6 space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">2</div>
            <h2 className="font-semibold text-slate-800">AI Prompt</h2>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex gap-2">
            <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-700">
              Build your AI agent&apos;s personality and behaviour. This prompt is passed to the AI agent every time the flow runs.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-100">
            {PROMPT_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                  activeTab === id
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {promptFilled(id) && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {PROMPT_TABS.map(tab => activeTab === tab.id && (
            <div key={tab.id} className="space-y-2">
              <div>
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
            </div>
          ))}

          {/* Completion indicators */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {PROMPT_TABS.map(tab => (
              <div key={tab.id} className={cn(
                "rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors",
                promptFilled(tab.id) ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-50 text-slate-400 border border-slate-200"
              )}>
                {promptFilled(tab.id) ? "✓ " : ""}{tab.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 pb-8">
        <button
          onClick={() => router.push("/dashboard/flows")}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <PacmanLoader size={14} label="Saving" />}
          {saving ? "Saving…" : editing ? "Save Changes" : "Create Flow"}
          {!saving && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
