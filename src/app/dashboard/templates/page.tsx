"use client";
import { useEffect, useRef, useState } from "react";
import { MESSAGE_FEATURES, getMessageFeature, type UltraMsgMessageFeature } from "@/lib/message-features";
import {
  FileText, Trash2, Pencil, X, Copy, Check,
  ToggleLeft, ToggleRight, Send, Users, Search, CheckSquare,
  Square, Smartphone, ChevronRight, AlertCircle, CheckCircle2,
} from "lucide-react";
import type { MessageTemplate, WhatsAppInstance } from "@/types";
import type { Contact } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

const CATEGORIES = ["custom", "marketing", "utility", "authentication"] as const;
const VARIABLE_PILLS = ["name", "phone", "email"];

function extractVars(text: string): string[] {
  return Array.from(new Set(Array.from(text.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1])));
}

function extractAllVars(values: Record<string, string>): string[] {
  const all = Object.values(values).flatMap((v) => extractVars(v));
  return Array.from(new Set(all));
}

function insertAtCursor(value: string, insert: string, start: number | null | undefined, end: number | null | undefined): string {
  const s = start ?? value.length;
  const e = end ?? value.length;
  return `${value.slice(0, s)}${insert}${value.slice(e)}`;
}

function fillPreview(content: string, msgType: string, contact: Contact, defaults: Record<string, string>): string {
  const fill = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    if (key === "name") return contact.name ?? defaults[key] ?? `{{${key}}}`;
    if (key === "phone") return contact.phone ?? defaults[key] ?? `{{${key}}}`;
    if (key === "email") return contact.email ?? defaults[key] ?? `{{${key}}}`;
    return defaults[key] ?? `{{${key}}}`;
  });
  if (msgType === "text") return fill(content);
  try {
    const fields = JSON.parse(content) as Record<string, string>;
    return Object.entries(fields).map(([k, v]) => `${k}: ${fill(v)}`).join("\n");
  } catch { return content; }
}

function getPreviewLabel(template: MessageTemplate): string {
  if (template.msg_type === "text") return template.content;
  try {
    const fields = JSON.parse(template.content) as Record<string, string>;
    return fields.caption || fields.body || Object.values(fields)[0] || "";
  } catch { return template.content; }
}

type BulkStep = "contacts" | "variables" | "preview" | "sending" | "done";

const typeIcon: Record<string, string> = {
  text: "💬", image: "🖼️", audio: "🎵", voice: "🎙️", video: "🎬",
  document: "📄", location: "📍", vcard: "👤", contact: "📇", reaction: "👍",
};

function fillText(text: string, contact: { phone: string; name?: string; email?: string }, defaults: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    if (key === "name") return contact.name ?? defaults[key] ?? `{{${key}}}`;
    if (key === "phone") return contact.phone ?? defaults[key] ?? `{{${key}}}`;
    if (key === "email") return (contact as { email?: string }).email ?? defaults[key] ?? `{{${key}}}`;
    return defaults[key] ?? `{{${key}}}`;
  });
}

function MessagePreview({ template, contact, defaults }: {
  template: MessageTemplate;
  contact: { phone: string; name?: string; email?: string };
  defaults: Record<string, string>;
}) {
  const type = template.msg_type ?? "text";

  if (type === "text") {
    return (
      <div className="bg-whatsapp-light/30 rounded-xl p-3 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
        {fillText(template.content, contact, defaults)}
      </div>
    );
  }

  let fields: Record<string, string> = {};
  try { fields = JSON.parse(template.content); } catch { /* ignore */ }

  const caption = fields.caption ? fillText(fields.caption, contact, defaults) : null;

  if (type === "image") {
    const src = fields.image ?? "";
    return (
      <div className="bg-whatsapp-light/30 rounded-xl overflow-hidden">
        {src ? (
          src.startsWith("data:") || src.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="preview" className="w-full max-h-48 object-cover" />
          ) : (
            <div className="flex items-center justify-center h-24 bg-slate-100 text-slate-400 text-sm">🖼️ Image URL set</div>
          )
        ) : (
          <div className="flex items-center justify-center h-24 bg-slate-100 text-slate-400 text-sm">No image</div>
        )}
        {caption && <p className="px-3 py-2 text-sm text-slate-700">{caption}</p>}
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="bg-whatsapp-light/30 rounded-xl p-3 flex items-center gap-3">
        <span className="text-2xl">🎬</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700">Video</p>
          {caption && <p className="text-xs text-slate-500 truncate">{caption}</p>}
        </div>
      </div>
    );
  }

  if (type === "audio" || type === "voice") {
    return (
      <div className="bg-whatsapp-light/30 rounded-xl p-3 flex items-center gap-3">
        <span className="text-2xl">{type === "voice" ? "🎙️" : "🎵"}</span>
        <p className="text-sm font-medium text-slate-700">{type === "voice" ? "Voice note" : "Audio"}</p>
      </div>
    );
  }

  if (type === "document") {
    return (
      <div className="bg-whatsapp-light/30 rounded-xl p-3 flex items-center gap-3">
        <span className="text-2xl">📄</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700">{fields.filename || "Document"}</p>
          {caption && <p className="text-xs text-slate-500 truncate">{caption}</p>}
        </div>
      </div>
    );
  }

  if (type === "location") {
    return (
      <div className="bg-whatsapp-light/30 rounded-xl p-3 flex items-center gap-3">
        <span className="text-2xl">📍</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{fields.address || "Location"}</p>
          {fields.lat && fields.lng && <p className="text-xs text-slate-500">{fields.lat}, {fields.lng}</p>}
        </div>
      </div>
    );
  }

  // vcard, contact, reaction — show type label
  return (
    <div className="bg-whatsapp-light/30 rounded-xl p-3 text-sm text-slate-600">
      {typeIcon[type] ?? "💬"} {type} message
    </div>
  );
}

function createFieldDefaults(type: UltraMsgMessageFeature): Record<string, string> {
  return Object.fromEntries(
    getMessageFeature(type).fields.filter((f) => f.key !== "to").map((f) => [f.key, ""])
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [msgType, setMsgType] = useState<UltraMsgMessageFeature>("text");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(createFieldDefaults("text"));
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState<MessageTemplate["category"]>("custom");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Bulk send state
  const [sendTemplate, setSendTemplate] = useState<MessageTemplate | null>(null);
  const [bulkStep, setBulkStep] = useState<BulkStep>("contacts");
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedInstance, setSelectedInstance] = useState("");
  const [recipientMode, setRecipientMode] = useState<"contacts" | "test">("contacts");
  const [testPhone, setTestPhone] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState("");
  const [varDefaults, setVarDefaults] = useState<Record<string, string>>({});
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const labRef = useRef<HTMLDivElement | null>(null);

  const MEDIA_FIELD_ACCEPT: Record<string, string> = {
    image: "image/*",
    audio: "audio/*",
    video: "video/*",
    document: "*/*",
  };

  function handleFileSelect(fieldKey: string, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      updateField(fieldKey, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => { loadData(); }, []);

  // Reset fields when type changes (unless editing)
  useEffect(() => {
    if (!editing) setFieldValues(createFieldDefaults(msgType));
  }, [msgType]);

  async function loadData() {
    setLoading(true);
    const [tmplRes, instRes, ctctRes] = await Promise.all([
      fetch("/api/templates"),
      fetch("/api/instances"),
      fetch("/api/contacts"),
    ]);
    if (tmplRes.ok) {
      const { templates: tmpl, orgId: oid } = await tmplRes.json();
      setTemplates((tmpl as MessageTemplate[]) ?? []);
      if (oid) setOrgId(oid);
    }
    if (instRes.ok) {
      const { instances: inst } = await instRes.json();
      setInstances((inst as WhatsAppInstance[]).filter((i) => i.status === "connected"));
    }
    if (ctctRes.ok) {
      const { contacts: ctcts } = await ctctRes.json();
      setContacts((ctcts as Contact[]) ?? []);
    }
    setLoading(false);
  }

  function clearLab() {
    setEditing(null);
    setMsgType("text");
    setFieldValues(createFieldDefaults("text"));
    setTemplateName("");
    setTemplateCategory("custom");
    setError("");
    setSaveSuccess(false);
  }

  function editInLab(t: MessageTemplate) {
    setEditing(t);
    const type = (t.msg_type ?? "text") as UltraMsgMessageFeature;
    setMsgType(type);
    setTemplateName(t.name);
    setTemplateCategory(t.category);
    setError("");
    setSaveSuccess(false);
    if (type === "text") {
      setFieldValues({ body: t.content });
    } else {
      try { setFieldValues(JSON.parse(t.content)); } catch { setFieldValues(createFieldDefaults(type)); }
    }
    labRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function insertVariable(variable: string) {
    // Find a focused textarea/input to insert into, fallback to first text field
    const token = `{{${variable}}}`;
    const feature = getMessageFeature(msgType);
    const textFields = feature.fields.filter((f) => f.key !== "to" && (f.type === "textarea" || !f.type));
    const targetKey = textFields[0]?.key;
    if (!targetKey) return;
    const el = fieldRefs.current[targetKey];
    const next = insertAtCursor(
      fieldValues[targetKey] ?? "",
      token,
      el?.selectionStart,
      el?.selectionEnd
    );
    updateField(targetKey, next);
    requestAnimationFrame(() => {
      if (!el) return;
      const caret = (el.selectionStart ?? (fieldValues[targetKey] ?? "").length) + token.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  async function handleSave() {
    if (!templateName.trim()) { setError("Template name is required."); return; }
    const feature = getMessageFeature(msgType);
    const required = feature.fields.filter((f) => f.key !== "to" && f.required);
    const missing = required.filter((f) => !fieldValues[f.key]?.trim());
    if (missing.length > 0) { setError(`Missing required fields: ${missing.map((f) => f.label).join(", ")}`); return; }

    setSaving(true);
    setError("");

    const content = msgType === "text" ? (fieldValues.body ?? "") : JSON.stringify(fieldValues);
    const variables = extractAllVars(fieldValues);

    const method = editing ? "PATCH" : "POST";
    const body = editing
      ? { id: editing.id, name: templateName, category: templateCategory, content, variables, msg_type: msgType }
      : { name: templateName, category: templateCategory, content, variables, msg_type: msgType };

    const res = await fetch("/api/templates", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save template");
      setSaving(false);
      return;
    }

    setSaving(false);
    clearLab();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (editing?.id === id) clearLab();
  }

  async function toggleActive(t: MessageTemplate) {
    await fetch("/api/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
    });
    setTemplates((prev) => prev.map((tp) => tp.id === t.id ? { ...tp, is_active: !tp.is_active } : tp));
  }

  function copy(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function openBulkSend(t: MessageTemplate) {
    setSendTemplate(t);
    setBulkStep("contacts");
    setSelectedInstance(instances[0]?.id ?? "");
    setRecipientMode("contacts");
    setTestPhone("");
    setSelectedContacts(new Set());
    setContactSearch("");
    const allVars = t.msg_type === "text"
      ? extractVars(t.content)
      : extractAllVars((() => { try { return JSON.parse(t.content); } catch { return {}; } })());
    const manualVars = allVars.filter((v) => !["name", "phone", "email"].includes(v));
    setVarDefaults(Object.fromEntries(manualVars.map((v) => [v, ""])));
    setBulkResult(null);
    setSendProgress(0);
  }

  function toggleContact(id: string) {
    setSelectedContacts((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleAll() {
    const ids = filteredContacts.map((c) => c.id);
    const allSelected = ids.every((id) => selectedContacts.has(id));
    setSelectedContacts((prev) => { const next = new Set(prev); ids.forEach((id) => allSelected ? next.delete(id) : next.add(id)); return next; });
  }

  const filteredContacts = contacts.filter((c) =>
    [c.name, c.phone, c.email].some((v) => v?.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const manualVars = sendTemplate
    ? (() => {
        const all = sendTemplate.msg_type === "text"
          ? extractVars(sendTemplate.content)
          : extractAllVars((() => { try { return JSON.parse(sendTemplate.content); } catch { return {}; } })());
        return all.filter((v) => !["name", "phone", "email"].includes(v));
      })()
    : [];

  const selectedContactObjs = contacts.filter((c) => selectedContacts.has(c.id));

  async function handleBulkSend() {
    if (!sendTemplate || !selectedInstance) return;
    if (recipientMode === "test" && !testPhone.trim()) return;
    if (recipientMode === "contacts" && selectedContacts.size === 0) return;
    setSending(true);
    setBulkStep("sending");
    setSendProgress(0);

    const contactList = recipientMode === "test"
      ? [{ phone: testPhone.trim() }]
      : selectedContactObjs.map((c) => ({ id: c.id, phone: c.phone, name: c.name ?? undefined, email: c.email ?? undefined }));
    const total = contactList.length;
    let done = 0, sent = 0, failed = 0;
    const errors: string[] = [];
    const batchSize = 5;

    for (let i = 0; i < contactList.length; i += batchSize) {
      const batch = contactList.slice(i, i + batchSize);
      const res = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: selectedInstance,
          contacts: batch,
          template: sendTemplate.content,
          variableDefaults: varDefaults,
          msgType: sendTemplate.msg_type ?? "text",
        }),
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

  const categoryColor: Record<string, string> = {
    custom: "bg-slate-100 text-slate-700",
    marketing: "bg-blue-100 text-blue-700",
    utility: "bg-green-100 text-green-700",
    authentication: "bg-purple-100 text-purple-700",
  };

  const currentFeature = getMessageFeature(msgType);
  const labFields = currentFeature.fields.filter((f) => f.key !== "to");
  const allLabVars = extractAllVars(fieldValues);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 page-reveal">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Message Templates</h1>
        <p className="text-slate-500 text-sm mt-1">Build templates in the lab, then bulk send to your contacts</p>
      </div>

      {/* Message Lab */}
      <div ref={labRef} className="card p-6 space-y-5 reveal-card" style={{ animationDelay: "60ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Message Lab</h2>
            <p className="text-sm text-slate-500 mt-1">
              {editing ? `Editing "${editing.name}"` : "Pick a message type, compose, and save as a template"}
            </p>
          </div>
          {editing && (
            <button onClick={clearLab} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancel edit
            </button>
          )}
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {MESSAGE_FEATURES.map((feature) => (
            <button
              key={feature.type}
              onClick={() => setMsgType(feature.type)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors",
                msgType === feature.type
                  ? "border-whatsapp-teal bg-whatsapp-teal/5"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <p className={cn("text-sm font-semibold", msgType === feature.type ? "text-whatsapp-teal" : "text-slate-900")}>
                {typeIcon[feature.type]} {feature.label}
              </p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{feature.description}</p>
            </button>
          ))}
        </div>

        {/* Template name + category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Template Name *</label>
            <input
              className="input"
              placeholder="e.g. Welcome Message"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value as MessageTemplate["category"])}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic fields based on type */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Content</label>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Variables:</span>
              {VARIABLE_PILLS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="inline-flex items-center rounded-full border border-whatsapp-teal/20 bg-whatsapp-teal/10 px-2.5 py-0.5 text-xs font-mono text-whatsapp-teal hover:bg-whatsapp-teal/20"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {labFields.map((field) => {
              const isMediaField = field.key in MEDIA_FIELD_ACCEPT;
              const accept = MEDIA_FIELD_ACCEPT[field.key];
              return (
                <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="label">{field.label}{field.required ? " *" : ""}</label>
                  {isMediaField ? (
                    <input
                      type="file"
                      accept={accept}
                      className="input text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-whatsapp-teal/10 file:text-whatsapp-teal hover:file:bg-whatsapp-teal/20 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(field.key, file);
                      }}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      ref={(el) => { fieldRefs.current[field.key] = el; }}
                      className="input min-h-[110px] resize-y"
                      placeholder={field.placeholder}
                      value={fieldValues[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      onDrop={(ev) => {
                        ev.preventDefault();
                        const v = ev.dataTransfer.getData("text/plain").replace(/\{|\}/g, "");
                        if (v) updateField(field.key, insertAtCursor(fieldValues[field.key] ?? "", `{{${v}}}`, ev.currentTarget.selectionStart, ev.currentTarget.selectionEnd));
                      }}
                      onDragOver={(ev) => ev.preventDefault()}
                    />
                  ) : (
                    <input
                      ref={(el) => { fieldRefs.current[field.key] = el; }}
                      className="input"
                      type={field.type === "number" ? "number" : "text"}
                      placeholder={field.placeholder}
                      value={fieldValues[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                    />
                  )}
                  {field.help && <p className="text-xs text-slate-400 mt-1">{field.help}</p>}
                </div>
              );
            })}
          </div>

          {allLabVars.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-slate-400">Detected:</span>
              {allLabVars.map((v) => (
                <span key={v} className="px-2 py-0.5 bg-whatsapp-teal/10 text-whatsapp-teal rounded-full text-xs font-mono">{`{{${v}}}`}</span>
              ))}
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
        {saveSuccess && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">Template saved successfully.</div>}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2">
            {saving && <PacmanLoader size={14} className="mr-1.5" label="Saving template" />}
            {saving ? "Saving..." : editing ? "Update Template" : "Save as Template"}
          </button>
          {(templateName || Object.values(fieldValues).some(Boolean)) && !editing && (
            <button onClick={clearLab} className="btn-secondary">Clear</button>
          )}
        </div>
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><PacmanLoader size={40} label="Loading templates" /></div>
      ) : templates.length === 0 ? (
        <div className="card p-16 text-center reveal-card" style={{ animationDelay: "120ms" }}>
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No templates yet</p>
          <p className="text-sm text-slate-400 mt-1">Use the Message Lab above to create your first template</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-700">{templates.length} Template{templates.length !== 1 ? "s" : ""}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((t, index) => (
              <div key={t.id} className={cn("card p-5 space-y-3 reveal-card reveal-lift", !t.is_active && "opacity-60")} style={{ animationDelay: `${index * 60}ms` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{typeIcon[t.msg_type] ?? "💬"}</span>
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    </div>
                    <span className={cn("badge mt-1", categoryColor[t.category])}>{t.category}</span>
                  </div>
                  <button onClick={() => toggleActive(t)} className="text-slate-400 hover:text-slate-600">
                    {t.is_active ? <ToggleRight className="w-5 h-5 text-whatsapp-teal" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed min-h-[60px] line-clamp-4">
                  {getPreviewLabel(t)}
                </div>

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
                  <button onClick={() => editInLab(t)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
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
        </>
      )}

      {/* Bulk Send Modal */}
      {sendTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col reveal-card" style={{ animationDelay: "40ms" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Bulk Send — {typeIcon[sendTemplate.msg_type] ?? "💬"} {sendTemplate.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {(["contacts", "variables", "preview"] as BulkStep[]).map((s, i, arr) => (
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {bulkStep === "contacts" && (
                <>
                  {/* Instance */}
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

                  {/* Recipient mode toggle */}
                  <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                      onClick={() => setRecipientMode("contacts")}
                      className={cn("px-4 py-1.5 text-xs font-medium rounded-lg transition-colors", recipientMode === "contacts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                      <Users className="w-3.5 h-3.5 inline mr-1.5" />Contacts
                    </button>
                    <button
                      onClick={() => setRecipientMode("test")}
                      className={cn("px-4 py-1.5 text-xs font-medium rounded-lg transition-colors", recipientMode === "test" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                      🧪 Test
                    </button>
                  </div>

                  {recipientMode === "test" ? (
                    <div>
                      <label className="label">Test phone number</label>
                      <input
                        className="input"
                        placeholder="+27721234567"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                      />
                      <p className="text-xs text-slate-400 mt-1">Sends the template to this single number only. Variables will use their default values.</p>
                    </div>
                  ) : (
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
                            {selectedContacts.has(c.id) ? <CheckSquare className="w-4 h-4 text-whatsapp-teal flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
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
                  )}
                </>
              )}

              {bulkStep === "variables" && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Template</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{getPreviewLabel(sendTemplate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Auto-filled variables</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["name", "phone", "email"].filter((v) => {
                        const all = sendTemplate.msg_type === "text" ? extractVars(sendTemplate.content) : extractAllVars((() => { try { return JSON.parse(sendTemplate.content); } catch { return {}; } })());
                        return all.includes(v);
                      }).map((v) => (
                        <span key={v} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-mono border border-green-200">{`{{${v}}}`} ✓ auto</span>
                      ))}
                    </div>
                    {manualVars.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">Custom variables — same for all recipients</p>
                        {manualVars.map((v) => (
                          <div key={v}>
                            <label className="label font-mono">{`{{${v}}}`}</label>
                            <input className="input" placeholder={`Value for ${v}`} value={varDefaults[v] ?? ""} onChange={(e) => setVarDefaults((prev) => ({ ...prev, [v]: e.target.value }))} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 bg-green-50 border border-green-200 rounded-xl p-3">All variables are auto-filled — nothing to configure.</p>
                    )}
                  </div>
                </>
              )}

              {bulkStep === "preview" && (
                <div className="space-y-3">
                  {recipientMode === "test" ? (
                    <>
                      <p className="text-sm font-medium text-slate-700">Test preview → {testPhone}</p>
                      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-amber-600">🧪 Test send — variables use defaults</p>
                        <MessagePreview template={sendTemplate} contact={{ phone: testPhone }} defaults={varDefaults} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">Preview — first 3 recipients</p>
                        <span className="text-xs text-slate-400">{selectedContacts.size} total</span>
                      </div>
                      {selectedContactObjs.slice(0, 3).map((c) => (
                        <div key={c.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-semibold text-slate-500">{c.name ?? c.phone}</p>
                          <MessagePreview template={sendTemplate} contact={c} defaults={varDefaults} />
                        </div>
                      ))}
                      {selectedContacts.size > 3 && <p className="text-xs text-slate-400 text-center">+ {selectedContacts.size - 3} more</p>}
                    </>
                  )}
                </div>
              )}

              {bulkStep === "sending" && (
                <div className="py-8 text-center space-y-4">
                  <PacmanLoader size={54} className="mx-auto" label="Sending bulk messages" />
                  <p className="text-sm font-medium text-slate-700">Sending messages...</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-whatsapp-teal h-2 rounded-full transition-all duration-300" style={{ width: `${sendProgress}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">{sendProgress}% complete</p>
                </div>
              )}

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

            {bulkStep !== "sending" && (
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                {bulkStep === "done" ? (
                  <button onClick={() => setSendTemplate(null)} className="btn-primary flex-1">Done</button>
                ) : (
                  <>
                    {bulkStep !== "contacts" && (
                      <button onClick={() => setBulkStep(bulkStep === "preview" ? "variables" : "contacts")} className="btn-secondary flex-1">Back</button>
                    )}
                    {bulkStep === "contacts" && <button onClick={() => setSendTemplate(null)} className="btn-secondary flex-1">Cancel</button>}
                    {bulkStep === "contacts" && (
                      <button
                        onClick={() => setBulkStep("variables")}
                        disabled={!selectedInstance || (recipientMode === "contacts" ? selectedContacts.size === 0 : !testPhone.trim())}
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
                        <Send className="w-4 h-4" />
                        {recipientMode === "test" ? `Send test to ${testPhone}` : `Send to ${selectedContacts.size} contacts`}
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
