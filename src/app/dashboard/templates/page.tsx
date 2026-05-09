"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MESSAGE_FEATURES, getMessageFeature, type UltraMsgMessageFeature } from "@/lib/message-features";
import {
  FileText, Plus, Trash2, Pencil, X, Copy, Check,
  ToggleLeft, ToggleRight, Send, Users, Search, CheckSquare,
  Square, Smartphone, ChevronRight, AlertCircle, CheckCircle2,
} from "lucide-react";
import type { MessageTemplate, WhatsAppInstance } from "@/types";
import type { Contact } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

const CATEGORIES = ["custom", "marketing", "utility", "authentication"] as const;
const defaultForm = { name: "", category: "custom" as MessageTemplate["category"], content: "" };
const VARIABLE_PILLS = ["name", "phone", "email"];

function extractVars(content: string): string[] {
  return Array.from(new Set(Array.from(content.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1])));
}

function insertAtCursor(
  value: string,
  insert: string,
  selectionStart: number | null | undefined,
  selectionEnd: number | null | undefined
): string {
  const start = selectionStart ?? value.length;
  const end = selectionEnd ?? value.length;
  return `${value.slice(0, start)}${insert}${value.slice(end)}`;
}

function fillPreview(content: string, contact: Contact, defaults: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    if (key === "name") return contact.name ?? defaults[key] ?? `{{${key}}}`;
    if (key === "phone") return contact.phone ?? defaults[key] ?? `{{${key}}}`;
    if (key === "email") return contact.email ?? defaults[key] ?? `{{${key}}}`;
    return defaults[key] ?? `{{${key}}}`;
  });
}

type BulkStep = "contacts" | "variables" | "preview" | "sending" | "done";

function createFeatureDefaults(type: UltraMsgMessageFeature): Record<string, string> {
  return Object.fromEntries(getMessageFeature(type).fields.map((field) => [field.key, ""]));
}

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Bulk send state
  const [sendTemplate, setSendTemplate] = useState<MessageTemplate | null>(null);
  const [bulkStep, setBulkStep] = useState<BulkStep>("contacts");
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedInstance, setSelectedInstance] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState("");
  const [varDefaults, setVarDefaults] = useState<Record<string, string>>({});
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [bulkTemplateId, setBulkTemplateId] = useState("");

  const [featureType, setFeatureType] = useState<UltraMsgMessageFeature>("text");
  const [featureInstanceId, setFeatureInstanceId] = useState("");
  const [featureValues, setFeatureValues] = useState<Record<string, string>>(createFeatureDefaults("text"));
  const [featureSending, setFeatureSending] = useState(false);
  const [featureError, setFeatureError] = useState("");
  const [featureSuccess, setFeatureSuccess] = useState("");
  const [featureResponse, setFeatureResponse] = useState<string>("");
  const formContentRef = useRef<HTMLTextAreaElement | null>(null);
  const featureFieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!featureInstanceId && instances[0]) {
      setFeatureInstanceId(instances[0].id);
    }
  }, [instances, featureInstanceId]);

  useEffect(() => {
    setFeatureValues(createFeatureDefaults(featureType));
    setFeatureError("");
    setFeatureSuccess("");
    setFeatureResponse("");
  }, [featureType]);

  useEffect(() => {
    if (!bulkTemplateId && templates[0]) {
      setBulkTemplateId(templates[0].id);
    }
  }, [templates, bulkTemplateId]);

  async function loadData() {
    setLoading(true);
    const authRes = await fetch("/api/auth/me");
    if (!authRes.ok) { setLoading(false); return; }
    const { user } = await authRes.json();
    const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user!.id).single();
    if (!member) return;
    setOrgId(member.org_id);
    const [{ data: tmpl }, { data: inst }, { data: ctcts }] = await Promise.all([
      supabase.from("message_templates").select("*").eq("org_id", member.org_id).order("created_at", { ascending: false }),
      supabase.from("whatsapp_instances").select("*").eq("org_id", member.org_id).eq("status", "connected"),
      supabase.from("contacts").select("*").eq("org_id", member.org_id).order("name"),
    ]);
    setTemplates((tmpl as MessageTemplate[]) ?? []);
    setInstances((inst as WhatsAppInstance[]) ?? []);
    setContacts((ctcts as Contact[]) ?? []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm({ ...defaultForm }); setError(""); setShowModal(true); }
  function openEdit(t: MessageTemplate) {
    setEditing(t);
    setForm({ name: t.name, category: t.category, content: t.content });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.content) { setError("Name and content are required."); return; }
    setSaving(true);
    const variables = extractVars(form.content);
    if (editing) {
      const { error } = await supabase.from("message_templates").update({ name: form.name, category: form.category, content: form.content, variables, updated_at: new Date().toISOString() }).eq("id", editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("message_templates").insert({ org_id: orgId, name: form.name, category: form.category, content: form.content, variables, is_active: true });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await supabase.from("message_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function toggleActive(t: MessageTemplate) {
    await supabase.from("message_templates").update({ is_active: !t.is_active }).eq("id", t.id);
    setTemplates((prev) => prev.map((tp) => tp.id === t.id ? { ...tp, is_active: !tp.is_active } : tp));
  }

  function copy(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function dropVariableIntoForm(variable: string) {
    const token = `{{${variable}}}`;
    const el = formContentRef.current;
    if (!el) {
      setForm((prev) => ({ ...prev, content: `${prev.content}${token}` }));
      return;
    }

    const next = insertAtCursor(el.value, token, el.selectionStart, el.selectionEnd);
    setForm((prev) => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      const caret = (el.selectionStart ?? el.value.length) + token.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function handleDropIntoField(
    variable: string,
    key: string,
    currentValue: string,
    selectionStart?: number | null,
    selectionEnd?: number | null
  ) {
    const token = `{{${variable}}}`;
    const next = insertAtCursor(currentValue, token, selectionStart, selectionEnd);
    setFeatureValues((prev) => ({ ...prev, [key]: next }));
    requestAnimationFrame(() => {
      const el = featureFieldRefs.current[key];
      if (!el) return;
      const caret = (selectionStart ?? currentValue.length) + token.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function renderVariablePill(variable: string, className = "") {
    return (
      <button
        key={variable}
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", `{{${variable}}}`);
          event.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => {
          if (showModal) {
            dropVariableIntoForm(variable);
          }
        }}
        className={cn(
          "inline-flex items-center rounded-full border border-whatsapp-teal/20 bg-whatsapp-teal/10 px-3 py-1 text-xs font-mono text-whatsapp-teal transition-colors hover:bg-whatsapp-teal/20 cursor-grab active:cursor-grabbing",
          className
        )}
        title="Drag into a field or click to insert into the template editor"
      >
        {`{{${variable}}}`}
      </button>
    );
  }

  function openFeatureLab(type: UltraMsgMessageFeature) {
    setFeatureType(type);
    setFeatureError("");
    setFeatureSuccess("");
    setFeatureResponse("");
  }

  function openBulkSend(t: MessageTemplate) {
    setSendTemplate(t);
    setBulkStep("contacts");
    setSelectedInstance(instances[0]?.id ?? "");
    setSelectedContacts(new Set());
    setContactSearch("");
    const vars = extractVars(t.content).filter((v) => !["name", "phone", "email"].includes(v));
    setVarDefaults(Object.fromEntries(vars.map((v) => [v, ""])));
    setBulkResult(null);
    setSendProgress(0);
  }

  function toggleContact(id: string) {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const filtered = filteredContacts.map((c) => c.id);
    const allSelected = filtered.every((id) => selectedContacts.has(id));
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      filtered.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }

  const filteredContacts = contacts.filter((c) =>
    [c.name, c.phone, c.email].some((v) => v?.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const manualVars = sendTemplate ? extractVars(sendTemplate.content).filter((v) => !["name", "phone", "email"].includes(v)) : [];
  const selectedContactObjs = contacts.filter((c) => selectedContacts.has(c.id));

  async function handleBulkSend() {
    if (!sendTemplate || !selectedInstance || selectedContacts.size === 0) return;
    setSending(true);
    setBulkStep("sending");
    setSendProgress(0);

    const contactList = selectedContactObjs.map((c) => ({ id: c.id, phone: c.phone, name: c.name ?? undefined, email: c.email ?? undefined }));
    const total = contactList.length;
    let done = 0;

    // Send in batches of 5 with progress
    const batchSize = 5;
    let sent = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < contactList.length; i += batchSize) {
      const batch = contactList.slice(i, i + batchSize);
      const res = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: selectedInstance, contacts: batch, template: sendTemplate.content, variableDefaults: varDefaults }),
      });
      const data = await res.json();
      sent += data.sent ?? 0;
      failed += data.failed ?? 0;
      errors.push(...(data.errors ?? []));
      done += batch.length;
      setSendProgress(Math.round((done / total) * 100));
    }

    setBulkResult({ sent, failed, errors });
    setSending(false);
    setBulkStep("done");
  }

  function updateFeatureValue(key: string, value: string) {
    setFeatureValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFeatureSend() {
    const feature = getMessageFeature(featureType);
    if (!featureInstanceId) {
      setFeatureError("Select a WhatsApp instance first.");
      return;
    }

    const missing = feature.fields.filter((field) => field.required && !featureValues[field.key]?.trim());
    if (missing.length > 0) {
      setFeatureError(`Missing required fields: ${missing.map((field) => field.label).join(", ")}`);
      return;
    }

    setFeatureSending(true);
    setFeatureError("");
    setFeatureSuccess("");
    setFeatureResponse("");

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: featureInstanceId,
          type: featureType,
          values: featureValues,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send message");
      }

      setFeatureSuccess(`Sent ${feature.label.toLowerCase()} message successfully.`);
      setFeatureResponse(JSON.stringify(data.result ?? data, null, 2));
      setFeatureValues(createFeatureDefaults(featureType));
    } catch (err) {
      setFeatureError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setFeatureSending(false);
    }
  }

  const categoryColor: Record<string, string> = {
    custom: "bg-slate-100 text-slate-700",
    marketing: "bg-blue-100 text-blue-700",
    utility: "bg-green-100 text-green-700",
    authentication: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 page-reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Message Templates</h1>
          <p className="text-slate-500 text-sm mt-1">Create reusable templates and send bulk WhatsApp messages</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 reveal-card" style={{ animationDelay: "60ms" }}>
        Use <code className="bg-blue-100 px-1 rounded font-mono text-xs">{"{{variable}}"}</code> for dynamic values.
        Auto-filled:
        <span className="ml-2 flex flex-wrap gap-2 mt-2">
          {VARIABLE_PILLS.map((variable) => renderVariablePill(variable))}
        </span>
      </div>

      <div className="card p-6 space-y-6 reveal-card" style={{ animationDelay: "120ms" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Message Lab</h2>
            <p className="text-sm text-slate-500 mt-1">Test every UltraMsg message type directly from Templates.</p>
          </div>
          <div className="text-xs text-slate-400">Available types: {MESSAGE_FEATURES.length}</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {MESSAGE_FEATURES.map((feature) => (
            <button
              key={feature.type}
              onClick={() => openFeatureLab(feature.type)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors",
                featureType === feature.type
                  ? "border-whatsapp-teal bg-whatsapp-teal/5"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <p className={cn("text-sm font-semibold", featureType === feature.type ? "text-whatsapp-teal" : "text-slate-900")}>{feature.label}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{feature.description}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
          <div>
            <label className="label flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Send from</label>
            {instances.length === 0 ? (
              <p className="text-sm text-red-500">No connected WhatsApp instances. Connect one first.</p>
            ) : (
              <select className="input" value={featureInstanceId} onChange={(e) => setFeatureInstanceId(e.target.value)}>
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} {i.phone_number ? `(${i.phone_number})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getMessageFeature(featureType).fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="label">
                  {field.label}{field.required ? " *" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    ref={(el) => { featureFieldRefs.current[field.key] = el; }}
                    className="input min-h-[110px] resize-y"
                    placeholder={field.placeholder}
                    value={featureValues[field.key] ?? ""}
                    onChange={(e) => updateFeatureValue(field.key, e.target.value)}
                    onDrop={(event) => {
                      event.preventDefault();
                      const variable = event.dataTransfer.getData("text/plain").replace(/\{|\}/g, "");
                      if (!variable) return;
                      handleDropIntoField(
                        variable,
                        field.key,
                        featureValues[field.key] ?? "",
                        event.currentTarget.selectionStart,
                        event.currentTarget.selectionEnd
                      );
                    }}
                    onDragOver={(event) => event.preventDefault()}
                  />
                ) : (
                  <input
                    ref={(el) => { featureFieldRefs.current[field.key] = el; }}
                    className="input"
                    type={field.type === "number" ? "number" : "text"}
                    placeholder={field.placeholder}
                    value={featureValues[field.key] ?? ""}
                    onChange={(e) => updateFeatureValue(field.key, e.target.value)}
                    onDrop={(event) => {
                      event.preventDefault();
                      const variable = event.dataTransfer.getData("text/plain").replace(/\{|\}/g, "");
                      if (!variable) return;
                      handleDropIntoField(
                        variable,
                        field.key,
                        featureValues[field.key] ?? "",
                        event.currentTarget.selectionStart,
                        event.currentTarget.selectionEnd
                      );
                    }}
                    onDragOver={(event) => event.preventDefault()}
                  />
                )}
                {field.help && <p className="text-xs text-slate-400 mt-1">{field.help}</p>}
              </div>
            ))}
          </div>
        </div>

        {featureError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{featureError}</div>}
        {featureSuccess && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{featureSuccess}</div>}

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <button
            onClick={handleFeatureSend}
            disabled={featureSending || instances.length === 0}
            className="btn-primary inline-flex items-center justify-center gap-2 sm:min-w-40"
          >
            {featureSending && <PacmanLoader size={14} className="mr-1.5" label="Sending feature message" />}
            {featureSending ? "Sending..." : getMessageFeature(featureType).sendLabel}
          </button>
          <p className="text-xs text-slate-400">This uses `/api/messages/send` and the active UltraMsg instance token.</p>
        </div>

        {featureResponse && (
          <pre className="bg-slate-950 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto whitespace-pre-wrap">
            {featureResponse}
          </pre>
        )}
      </div>

      <div className="card p-6 space-y-4 reveal-card" style={{ animationDelay: "180ms" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Bulk Messaging</h2>
            <p className="text-sm text-slate-500 mt-1">Pick a template and launch the bulk sender from here.</p>
          </div>
          <div className="text-xs text-slate-400">{templates.length} template{templates.length === 1 ? "" : "s"} available</div>
        </div>

        {templates.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
            <div>
              <label className="label">Template</label>
              <select className="input" value={bulkTemplateId} onChange={(e) => setBulkTemplateId(e.target.value)}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.is_active ? "" : "(inactive)"}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                const selectedTemplate = templates.find((template) => template.id === bulkTemplateId);
                if (selectedTemplate) openBulkSend(selectedTemplate);
              }}
              disabled={!bulkTemplateId}
              className="btn-primary inline-flex items-center justify-center gap-2 lg:min-w-44"
            >
              <Send className="w-4 h-4" /> Open Bulk Sender
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Create a template first to use bulk messaging.</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><PacmanLoader size={40} label="Loading templates" /></div>
      ) : templates.length === 0 ? (
        <div className="card p-16 text-center reveal-card" style={{ animationDelay: "140ms" }}>
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No templates yet</p>
          <button onClick={openAdd} className="mt-4 btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Create Template</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t, index) => (
            <div key={t.id} className={cn("card p-5 space-y-3 reveal-card reveal-lift", !t.is_active && "opacity-60")} style={{ animationDelay: `${index * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <span className={cn("badge mt-1", categoryColor[t.category])}>{t.category}</span>
                </div>
                <button onClick={() => toggleActive(t)} className="text-slate-400 hover:text-slate-600">
                  {t.is_active ? <ToggleRight className="w-5 h-5 text-whatsapp-teal" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed min-h-[60px]">{t.content}</div>

              {(t.variables ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(t.variables ?? []).map((v) => (
                    <span key={v} className="px-2 py-0.5 bg-whatsapp-teal/10 text-whatsapp-teal rounded-full text-xs font-mono">{`{{${v}}}`}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => openBulkSend(t)}
                  disabled={!t.is_active || instances.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-whatsapp-teal hover:bg-whatsapp-teal/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" /> Send Bulk
                </button>
                <button onClick={() => copy(t.content, t.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  {copied === t.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === t.id ? "Copied!" : "Copy"}
                </button>
                <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(t.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
              <p className="text-xs text-slate-300">{formatDate(t.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg reveal-card" style={{ animationDelay: "40ms" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">{editing ? "Edit Template" : "New Template"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Template Name *</label>
                <input className="input" placeholder="e.g. Welcome Message" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MessageTemplate["category"] })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Message Content *</label>
                <textarea
                  ref={formContentRef}
                  className="input min-h-[120px] resize-y"
                  placeholder={"Hello {{name}}, welcome to our service!"}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  onDrop={(event) => {
                    event.preventDefault();
                    const variable = event.dataTransfer.getData("text/plain").replace(/\{|\}/g, "");
                    if (!variable) return;
                    const next = insertAtCursor(form.content, `{{${variable}}}`, event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
                    setForm({ ...form, content: next });
                  }}
                  onDragOver={(event) => event.preventDefault()}
                />
                {form.content && extractVars(form.content).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-slate-500">Variables:</span>
                    {extractVars(form.content).map((v) => (
                      <span key={v} className="px-2 py-0.5 bg-whatsapp-teal/10 text-whatsapp-teal rounded-full text-xs font-mono">{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <PacmanLoader size={14} className="mr-1.5" label="Saving template" />}
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Template"}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Drag variables into the template</p>
                <div className="flex flex-wrap gap-2">
                  {VARIABLE_PILLS.map((variable) => renderVariablePill(variable, "text-xs"))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Send Modal */}
      {sendTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col reveal-card" style={{ animationDelay: "40ms" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-slate-900">Bulk Send — {sendTemplate.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {(["contacts", "variables", "preview", "sending", "done"] as BulkStep[]).filter(s => s !== "sending" && s !== "done").map((s, i, arr) => (
                    <span key={s} className="flex items-center gap-1">
                      <span className={cn("text-xs font-medium capitalize", bulkStep === s ? "text-whatsapp-teal" : "text-slate-400")}>{s}</span>
                      {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                    </span>
                  ))}
                </div>
              </div>
              {bulkStep !== "sending" && (
                <button onClick={() => setSendTemplate(null)}><X className="w-5 h-5 text-slate-400" /></button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Step 1: Select contacts & instance */}
              {bulkStep === "contacts" && (
                <>
                  {/* Instance picker */}
                  <div>
                    <label className="label flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Send from</label>
                    {instances.length === 0 ? (
                      <p className="text-sm text-red-500">No connected WhatsApp instances. Connect one first.</p>
                    ) : (
                      <select className="input" value={selectedInstance} onChange={(e) => setSelectedInstance(e.target.value)}>
                        {instances.map((i) => <option key={i.id} value={i.id}>{i.name} {i.phone_number ? `(${i.phone_number})` : ""}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Contact picker */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label flex items-center gap-1.5 mb-0"><Users className="w-3.5 h-3.5" /> Select recipients</label>
                      <button onClick={toggleAll} className="text-xs text-whatsapp-teal hover:underline">
                        {filteredContacts.every((c) => selectedContacts.has(c.id)) ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input className="input pl-8 text-sm" placeholder="Search contacts..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      {filteredContacts.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">No contacts found</p>
                      ) : filteredContacts.map((c) => (
                        <button key={c.id} onClick={() => toggleContact(c.id)} className={cn("w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left", selectedContacts.has(c.id) && "bg-whatsapp-teal/5")}>
                          {selectedContacts.has(c.id)
                            ? <CheckSquare className="w-4 h-4 text-whatsapp-teal flex-shrink-0" />
                            : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{c.name ?? "—"}</p>
                            <p className="text-xs text-slate-400">{c.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedContacts.size > 0 && (
                      <p className="text-xs text-whatsapp-teal mt-1.5 font-medium">{selectedContacts.size} contact{selectedContacts.size !== 1 ? "s" : ""} selected</p>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Variable defaults */}
              {bulkStep === "variables" && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Template preview</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{sendTemplate.content}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Auto-filled variables</p>
                    <p className="text-xs text-slate-400 mb-3">These are filled automatically from each contact's data.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["name", "phone", "email"].filter((v) => extractVars(sendTemplate.content).includes(v)).map((v) => (
                        <span key={v} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-mono border border-green-200">{`{{${v}}}`} ✓ auto</span>
                      ))}
                    </div>
                    {manualVars.length > 0 && (
                      <>
                        <p className="text-sm font-medium text-slate-700 mb-1">Custom variables</p>
                        <p className="text-xs text-slate-400 mb-3">These will be the same for all recipients.</p>
                        <div className="space-y-3">
                          {manualVars.map((v) => (
                            <div key={v}>
                              <label className="label font-mono">{`{{${v}}}`}</label>
                              <input className="input" placeholder={`Value for ${v}`} value={varDefaults[v] ?? ""} onChange={(e) => setVarDefaults((prev) => ({ ...prev, [v]: e.target.value }))} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {manualVars.length === 0 && (
                      <p className="text-sm text-slate-500 bg-green-50 border border-green-200 rounded-xl p-3">All variables are auto-filled — nothing to configure.</p>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: Preview */}
              {bulkStep === "preview" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Preview — first 3 recipients</p>
                    <span className="text-xs text-slate-400">{selectedContacts.size} total recipients</span>
                  </div>
                  {selectedContactObjs.slice(0, 3).map((c) => (
                    <div key={c.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-500">{c.name ?? c.phone}</p>
                      <div className="bg-whatsapp-light/30 rounded-xl p-3 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {fillPreview(sendTemplate.content, c, varDefaults)}
                      </div>
                    </div>
                  ))}
                  {selectedContacts.size > 3 && (
                    <p className="text-xs text-slate-400 text-center">+ {selectedContacts.size - 3} more messages</p>
                  )}
                </div>
              )}

              {/* Step 4: Sending */}
              {bulkStep === "sending" && (
                <div className="py-8 text-center space-y-4">
                  <PacmanLoader size={54} className="mx-auto" label="Loading bulk sender" />
                  <p className="text-sm font-medium text-slate-700">Sending messages...</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-whatsapp-teal h-2 rounded-full transition-all duration-300" style={{ width: `${sendProgress}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">{sendProgress}% complete</p>
                </div>
              )}

              {/* Step 5: Done */}
              {bulkStep === "done" && bulkResult && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">{bulkResult.sent} messages sent successfully</p>
                      {bulkResult.failed > 0 && <p className="text-sm text-red-600 mt-0.5">{bulkResult.failed} failed</p>}
                    </div>
                  </div>
                  {bulkResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1 max-h-40 overflow-y-auto">
                      <p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Errors</p>
                      {bulkResult.errors.map((e, i) => <p key={i} className="text-xs text-red-600 font-mono">{e}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {bulkStep !== "sending" && (
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                {bulkStep === "done" ? (
                  <button onClick={() => setSendTemplate(null)} className="btn-primary flex-1">Done</button>
                ) : (
                  <>
                    {bulkStep !== "contacts" && (
                      <button onClick={() => setBulkStep(bulkStep === "preview" ? "variables" : "contacts")} className="btn-secondary flex-1">Back</button>
                    )}
                    {bulkStep === "contacts" && (
                      <button onClick={() => setSendTemplate(null)} className="btn-secondary flex-1">Cancel</button>
                    )}
                    {bulkStep === "contacts" && (
                      <button
                        onClick={() => setBulkStep("variables")}
                        disabled={selectedContacts.size === 0 || !selectedInstance}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {bulkStep === "variables" && (
                      <button onClick={() => setBulkStep("preview")} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        Preview <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {bulkStep === "preview" && (
                      <button onClick={handleBulkSend} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Send to {selectedContacts.size} contacts
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

