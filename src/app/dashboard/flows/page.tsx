"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Zap, Plus, Trash2, Pencil, X, Loader2, Play, ToggleLeft, ToggleRight,
  Globe, Clock, MessageSquare, UserPlus, Hash, Bot, Shield, Palette,
  BookOpen, Wrench, ChevronRight, Smartphone,
} from "lucide-react";
import type { N8nFlow } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TRIGGER_TYPES = [
  { value: "inbound_message", label: "Inbound Message", icon: MessageSquare, description: "Triggers on every incoming WhatsApp message" },
  { value: "keyword",         label: "Keyword Match",   icon: Hash,          description: "Triggers when message contains a keyword" },
  { value: "new_contact",     label: "New Contact",     icon: UserPlus,      description: "Triggers when a new contact is created" },
  { value: "manual",          label: "Manual Trigger",  icon: Play,          description: "Manually triggered from this dashboard" },
  { value: "schedule",        label: "Scheduled",       icon: Clock,         description: "Runs on a defined schedule" },
] as const;

const PLACEHOLDER_TOOLS = [
  { id: "web_search",    label: "Web Search",         description: "Search the web for live information" },
  { id: "crm_lookup",    label: "CRM Lookup",         description: "Look up contact records" },
  { id: "send_email",    label: "Send Email",         description: "Send an email notification" },
  { id: "create_ticket", label: "Create Ticket",      description: "Create a support or sales ticket" },
  { id: "calendar",      label: "Book Appointment",   description: "Schedule a calendar event" },
  { id: "webhook",       label: "Custom Webhook",     description: "Call an external API endpoint" },
];

const PROMPT_TABS = [
  { id: "role",       label: "Role",        icon: Bot },
  { id: "guardrails", label: "Guardrails",  icon: Shield },
  { id: "tone",       label: "Tone & Style",icon: Palette },
  { id: "context",    label: "Context",     icon: BookOpen },
  { id: "tools",      label: "Tools",       icon: Wrench },
] as const;

type PromptTab = typeof PROMPT_TABS[number]["id"];

interface WhatsAppInstance { id: string; name: string; instance_id: string; }

const defaultPrompt = { role: "", guardrails: "", tone: "", context: "" };
const defaultForm = {
  name: "",
  description: "",
  n8n_workflow_id: "",
  webhook_url: "",
  trigger_type: "inbound_message" as N8nFlow["trigger_type"],
  keyword: "",
  instance_id: "",
  prompt: { ...defaultPrompt },
  tools: [] as string[],
};

export default function FlowsPage() {
  const supabase = createClient();
  const [flows, setFlows] = useState<N8nFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<N8nFlow | null>(null);
  const [form, setForm] = useState({ ...defaultForm, prompt: { ...defaultPrompt } });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [triggering, setTriggering] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PromptTab>("role");
  const [modalStep, setModalStep] = useState<"basics" | "prompt">("basics");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user!.id).single();
    if (!member) return;
    setOrgId(member.org_id);
    const [{ data: flowData }, { data: instData }] = await Promise.all([
      supabase.from("n8n_flows").select("*").eq("org_id", member.org_id).order("created_at", { ascending: false }),
      supabase.from("whatsapp_instances").select("id, name, instance_id").eq("org_id", member.org_id),
    ]);
    setFlows((flowData as N8nFlow[]) ?? []);
    setInstances((instData as WhatsAppInstance[]) ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...defaultForm, prompt: { ...defaultPrompt } });
    setError("");
    setActiveTab("role");
    setModalStep("basics");
    setShowModal(true);
  }

  function openEdit(f: N8nFlow) {
    setEditing(f);
    const config = f.trigger_config as Record<string, unknown> | null;
    const savedPrompt = (config?.prompt as Record<string, string>) ?? {};
    setForm({
      name: f.name,
      description: f.description ?? "",
      n8n_workflow_id: f.n8n_workflow_id,
      webhook_url: f.webhook_url ?? "",
      trigger_type: f.trigger_type,
      keyword: (config?.keyword as string) ?? "",
      instance_id: (config?.instance_id as string) ?? "",
      prompt: {
        role:       savedPrompt.role       ?? "",
        guardrails: savedPrompt.guardrails ?? "",
        tone:       savedPrompt.tone       ?? "",
        context:    savedPrompt.context    ?? "",
      },
      tools: (config?.tools as string[]) ?? [],
    });
    setError("");
    setActiveTab("role");
    setModalStep("basics");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name) { setError("Name is required."); return; }
    setSaving(true);
    const trigger_config: Record<string, unknown> = {};
    if (form.keyword)     trigger_config.keyword     = form.keyword;
    if (form.instance_id) trigger_config.instance_id = form.instance_id;
    // Always save prompt block so n8n can always read it
    trigger_config.prompt = form.prompt;
    trigger_config.tools  = form.tools;

    if (editing) {
      const { error: err } = await supabase.from("n8n_flows").update({
        name: form.name,
        description: form.description || null,
        n8n_workflow_id: form.n8n_workflow_id,
        webhook_url: form.webhook_url || null,
        trigger_type: form.trigger_type,
        trigger_config,
        updated_at: new Date().toISOString(),
      }).eq("id", editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("n8n_flows").insert({
        org_id: orgId,
        name: form.name,
        description: form.description || null,
        n8n_workflow_id: form.n8n_workflow_id,
        webhook_url: form.webhook_url || null,
        trigger_type: form.trigger_type,
        trigger_config,
        is_active: true,
      });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this flow?")) return;
    await supabase.from("n8n_flows").delete().eq("id", id);
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }

  async function toggleActive(f: N8nFlow) {
    await supabase.from("n8n_flows").update({ is_active: !f.is_active }).eq("id", f.id);
    setFlows((prev) => prev.map((fl) => fl.id === f.id ? { ...fl, is_active: !fl.is_active } : fl));
  }

  async function triggerManual(f: N8nFlow) {
    if (!f.webhook_url) { alert("No webhook URL configured for this flow."); return; }
    setTriggering(f.id);
    try {
      await fetch(f.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggered_by: "manual", org_id: orgId, flow_id: f.id, timestamp: new Date().toISOString() }),
      });
      await supabase.from("n8n_flows").update({ last_triggered_at: new Date().toISOString() }).eq("id", f.id);
      loadData();
    } catch {}
    setTriggering(null);
  }

  const triggerInfo = (type: string) => TRIGGER_TYPES.find((t) => t.value === type);

  const promptComplete = form.prompt.role.trim().length > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flows</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered automation flows for your WhatsApp</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Flow
        </button>
      </div>

      {/* Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3">
        <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-purple-700">
          <p className="font-medium">How it works</p>
          <p className="text-purple-600 mt-0.5">
            Flows define how your WhatsApp runs on autopilot. Each flow is powered by an AI prompt you create — set a trigger, build your agent&apos;s role and guardrails, and SyncChat will automatically respond to incoming messages, keywords, or events in real-time.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : flows.length === 0 ? (
        <div className="card p-16 text-center">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No flows yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Create your first AI-powered flow to automate WhatsApp responses</p>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Flow</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flows.map((f) => {
            const info = triggerInfo(f.trigger_type);
            const TriggerIcon = info?.icon ?? Zap;
            const config = f.trigger_config as Record<string, unknown> | null;
            const prompt = config?.prompt as Record<string, string> | null;
            const tools = (config?.tools as string[]) ?? [];
            const linkedInstance = instances.find((i) => i.id === config?.instance_id);
            return (
              <div key={f.id} className={`card p-5 space-y-4 ${!f.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <TriggerIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{f.name}</p>
                      {f.description && <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>}
                    </div>
                  </div>
                  <button onClick={() => toggleActive(f)} className="flex-shrink-0">
                    {f.is_active
                      ? <ToggleRight className="w-5 h-5 text-whatsapp-teal" />
                      : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{info?.label ?? f.trigger_type}</span>
                    {config?.keyword && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-mono">keyword: {String(config.keyword)}</span>
                    )}
                    {linkedInstance && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />{linkedInstance.name}
                      </span>
                    )}
                    {tools.length > 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">{tools.length} tool{tools.length > 1 ? "s" : ""}</span>
                    )}
                  </div>

                  {prompt?.role && (
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 font-medium mb-0.5">AI Role</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{prompt.role}</p>
                    </div>
                  )}

                  {f.webhook_url && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-slate-500 truncate font-mono">{f.webhook_url}</p>
                    </div>
                  )}
                  {f.last_triggered_at && (
                    <p className="text-xs text-slate-400">Last triggered: {formatDateTime(f.last_triggered_at)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {f.trigger_type === "manual" && (
                    <button onClick={() => triggerManual(f)} disabled={triggering === f.id || !f.is_active}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      {triggering === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Trigger Now
                    </button>
                  )}
                  <button onClick={() => openEdit(f)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-900">{editing ? "Edit Flow" : "Add Flow"}</h2>
                {/* Step pills */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setModalStep("basics")}
                    className={cn("px-2.5 py-1 rounded-full font-medium transition-colors",
                      modalStep === "basics" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                  >
                    1 · Setup
                  </button>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <button
                    onClick={() => setModalStep("prompt")}
                    className={cn("px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1",
                      modalStep === "prompt" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                  >
                    2 · AI Prompt
                    {promptComplete && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ── STEP 1: BASICS ── */}
              {modalStep === "basics" && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Flow Name *</label>
                    <input className="input" placeholder="e.g. Auto Reply Bot" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input className="input" placeholder="What does this flow do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div>
                    <label className="label">WhatsApp Instance</label>
                    <select
                      className="input"
                      value={form.instance_id}
                      onChange={(e) => setForm({ ...form, instance_id: e.target.value })}
                    >
                      <option value="">— Select an instance (optional) —</option>
                      {instances.map((i) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.instance_id})</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">The WhatsApp number this flow will run on</p>
                  </div>

                  <div>
                    <label className="label">Trigger Type</label>
                    <div className="grid grid-cols-1 gap-2">
                      {TRIGGER_TYPES.map(({ value, label, icon: Icon, description }) => (
                        <label key={value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          form.trigger_type === value ? "border-whatsapp-teal bg-whatsapp-teal/5" : "border-slate-200 hover:border-slate-300"
                        }`}>
                          <input type="radio" name="trigger" value={value} checked={form.trigger_type === value}
                            onChange={() => setForm({ ...form, trigger_type: value as N8nFlow["trigger_type"] })} className="hidden" />
                          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${form.trigger_type === value ? "text-whatsapp-teal" : "text-slate-400"}`} />
                          <div>
                            <p className={`text-sm font-medium ${form.trigger_type === value ? "text-whatsapp-teal" : "text-slate-700"}`}>{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {form.trigger_type === "keyword" && (
                    <div>
                      <label className="label">Keyword to Match</label>
                      <input className="input" placeholder="e.g. HELLO, ORDER, SUPPORT" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
                    </div>
                  )}

                  <div>
                    <label className="label">Webhook URL</label>
                    <input className="input" placeholder="https://your-domain.com/webhook/xxx" value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} />
                    <p className="text-xs text-slate-400 mt-1">The URL SyncChat will POST to when this flow triggers</p>
                  </div>
                  <div>
                    <label className="label">Workflow ID (optional)</label>
                    <input className="input" placeholder="Workflow ID" value={form.n8n_workflow_id} onChange={(e) => setForm({ ...form, n8n_workflow_id: e.target.value })} />
                  </div>
                </div>
              )}

              {/* ── STEP 2: AI PROMPT ── */}
              {modalStep === "prompt" && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex gap-2">
                    <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-700">
                      Build your AI agent&apos;s personality and behaviour here. This prompt is saved with the flow and passed to the AI agent when it runs via the automation.
                    </p>
                  </div>

                  {/* Prompt tabs */}
                  <div className="flex gap-1 border-b border-slate-100 overflow-x-auto pb-0">
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
                        {id !== "tools" && form.prompt[id as keyof typeof form.prompt]?.trim() && (
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        )}
                        {id === "tools" && form.tools.length > 0 && (
                          <span className="bg-orange-100 text-orange-700 px-1 rounded-full text-xs">{form.tools.length}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Role */}
                  {activeTab === "role" && (
                    <div className="space-y-2">
                      <div>
                        <label className="label">Agent Role *</label>
                        <p className="text-xs text-slate-400 mb-2">Who is this AI? Define its purpose, persona, and primary function.</p>
                        <textarea
                          className="input min-h-[140px] resize-none"
                          placeholder={`e.g. You are a helpful customer support agent for Acme Corp. Your primary job is to answer product questions, assist with orders, and escalate complex issues to human agents. You represent the brand professionally at all times.`}
                          value={form.prompt.role}
                          onChange={(e) => setForm({ ...form, prompt: { ...form.prompt, role: e.target.value } })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Guardrails */}
                  {activeTab === "guardrails" && (
                    <div className="space-y-2">
                      <label className="label">Guardrails</label>
                      <p className="text-xs text-slate-400 mb-2">What should the agent never do or say? Set firm boundaries.</p>
                      <textarea
                        className="input min-h-[140px] resize-none"
                        placeholder={`e.g. Never share pricing without manager approval. Do not discuss competitors. Never promise delivery dates. If a customer is abusive, politely end the conversation. Do not make up information — if you don't know, say so and offer to escalate.`}
                        value={form.prompt.guardrails}
                        onChange={(e) => setForm({ ...form, prompt: { ...form.prompt, guardrails: e.target.value } })}
                      />
                    </div>
                  )}

                  {/* Tone */}
                  {activeTab === "tone" && (
                    <div className="space-y-2">
                      <label className="label">Tone &amp; Style</label>
                      <p className="text-xs text-slate-400 mb-2">How should the agent communicate? Define language, formality, and personality.</p>
                      <textarea
                        className="input min-h-[140px] resize-none"
                        placeholder={`e.g. Friendly and professional. Use simple, clear language. Avoid jargon. Keep responses concise — under 3 sentences where possible. Use the customer's name when known. Mirror the energy of the conversation.`}
                        value={form.prompt.tone}
                        onChange={(e) => setForm({ ...form, prompt: { ...form.prompt, tone: e.target.value } })}
                      />
                    </div>
                  )}

                  {/* Context */}
                  {activeTab === "context" && (
                    <div className="space-y-2">
                      <label className="label">Business Context</label>
                      <p className="text-xs text-slate-400 mb-2">Provide background your business, products, services, or key information the AI needs to know.</p>
                      <textarea
                        className="input min-h-[140px] resize-none"
                        placeholder={`e.g. Acme Corp is a South African e-commerce retailer selling electronics and appliances. We operate Mon–Fri 8am–6pm SAST. Our return policy allows 30 days with receipt. Deliveries take 3–5 business days nationally. WhatsApp support is available 24/7 via this AI agent.`}
                        value={form.prompt.context}
                        onChange={(e) => setForm({ ...form, prompt: { ...form.prompt, context: e.target.value } })}
                      />
                    </div>
                  )}

                  {/* Tools */}
                  {activeTab === "tools" && (
                    <div className="space-y-3">
                      <div>
                        <label className="label">Agent Tools</label>
                        <p className="text-xs text-slate-400 mb-3">Select the tools your AI agent can use. More tools will be added over time.</p>
                      </div>
                      <div className="space-y-2">
                        {PLACEHOLDER_TOOLS.map((tool) => (
                          <label
                            key={tool.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors",
                              form.tools.includes(tool.id)
                                ? "border-purple-300 bg-purple-50"
                                : "border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 accent-purple-600"
                              checked={form.tools.includes(tool.id)}
                              onChange={(e) => {
                                setForm({
                                  ...form,
                                  tools: e.target.checked
                                    ? [...form.tools, tool.id]
                                    : form.tools.filter((t) => t !== tool.id),
                                });
                              }}
                            />
                            <div>
                              <p className={cn("text-sm font-medium", form.tools.includes(tool.id) ? "text-purple-700" : "text-slate-700")}>
                                {tool.label}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{tool.description}</p>
                            </div>
                            {form.tools.includes(tool.id) && (
                              <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium self-start">Enabled</span>
                            )}
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 pt-1">More tools coming soon. Selected tools are passed to the AI agent at runtime.</p>
                    </div>
                  )}
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mt-4">{error}</div>}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
              {modalStep === "basics" ? (
                <>
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button
                    onClick={() => { if (!form.name) { setError("Name is required."); return; } setError(""); setModalStep("prompt"); }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    Next: AI Prompt <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setModalStep("basics")} className="btn-secondary flex-1">Back</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Saving..." : editing ? "Save Changes" : "Create Flow"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
