"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractTemplateVariables, toJohannesburgLocalInput } from "@/lib/scheduled-bulk";
import { format } from "date-fns";
import {
  CalendarClock, Pause, Play, Plus, Search,
  Smartphone, Square, CheckSquare, Users, Trash2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contact, MessageTemplate, ScheduledBulkMessage, WhatsAppInstance } from "@/types";
import PacmanLoader from "@/components/ui/PacmanLoader";

const AUTO_VARS = ["name", "phone", "email"];

export default function ScheduledBulkPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [schedules, setSchedules] = useState<ScheduledBulkMessage[]>([]);

  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [scheduleType, setScheduleType] = useState<"one_time" | "recurring">("one_time");
  const [scheduledFor, setScheduledFor] = useState(toJohannesburgLocalInput(new Date(Date.now() + 15 * 60 * 1000)));
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState("");
  const [variableDefaults, setVariableDefaults] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scheduleActionError, setScheduleActionError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!templateId && templates[0]) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  useEffect(() => {
    if (!instanceId && instances[0]) {
      setInstanceId(instances[0].id);
    }
  }, [instances, instanceId]);

  const selectedTemplate = templates.find((template) => template.id === templateId) ?? null;
  const templateVariables = useMemo(
    () => (selectedTemplate ? extractTemplateVariables(selectedTemplate.content) : []),
    [selectedTemplate?.content]
  );
  const customVariables = useMemo(
    () => templateVariables.filter((variable) => !AUTO_VARS.includes(variable)),
    [templateVariables]
  );

  useEffect(() => {
    if (!selectedTemplate) return;
    setName((current) => current || `Schedule: ${selectedTemplate.name}`);
    setVariableDefaults((current) => {
      const next: Record<string, string> = {};
      customVariables.forEach((variable) => {
        next[variable] = current[variable] ?? "";
      });
      return next;
    });
  }, [selectedTemplate, customVariables]);

  const filteredContacts = useMemo(() => contacts.filter((contact) =>
    [contact.name, contact.phone, contact.email].some((value) => value?.toLowerCase().includes(contactSearch.toLowerCase()))
  ), [contacts, contactSearch]);

  const selectedContactObjects = useMemo(() => contacts.filter((contact) => selectedContacts.has(contact.id)), [contacts, selectedContacts]);

  async function loadData() {
    setLoading(true);
    setLoadingSchedules(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user!.id).single();
    if (!member) return;

    setOrgId(member.org_id);
    const [{ data: tmpl }, { data: inst }, { data: ctcts }, scheduleRes] = await Promise.all([
      supabase.from("message_templates").select("*").eq("org_id", member.org_id).order("created_at", { ascending: false }),
      supabase.from("whatsapp_instances").select("*").eq("org_id", member.org_id).eq("status", "connected"),
      supabase.from("contacts").select("*").eq("org_id", member.org_id).order("name"),
      fetch("/api/scheduled-bulk"),
    ]);

    setTemplates((tmpl as MessageTemplate[]) ?? []);
    setInstances((inst as WhatsAppInstance[]) ?? []);
    setContacts((ctcts as Contact[]) ?? []);

    if (scheduleRes.ok) {
      const data = await scheduleRes.json();
      setSchedules((data.schedules as ScheduledBulkMessage[]) ?? []);
    }

    setLoading(false);
    setLoadingSchedules(false);
  }

  function toggleContact(id: string) {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllContacts() {
    const filteredIds = filteredContacts.map((contact) => contact.id);
    const allSelected = filteredIds.every((id) => selectedContacts.has(id));
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function updateVariableDefaults(key: string, value: string) {
    setVariableDefaults((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateSchedule() {
    if (!name || !templateId || !instanceId || selectedContacts.size === 0) {
      setError("Fill in the schedule name, template, instance, and recipients.");
      return;
    }

    if (customVariables.some((variable) => !variableDefaults[variable]?.trim())) {
      setError("Fill in the custom template variables.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/scheduled-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          templateId,
          instanceId,
          scheduleType,
          timezone: "Africa/Johannesburg",
          scheduledForLocal: scheduledFor,
          recurrence: scheduleType === "recurring"
            ? { frequency, interval, daysOfWeek }
            : null,
          recipientIds: Array.from(selectedContacts),
          variableDefaults,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create schedule");
      }

      setSuccess("Scheduled bulk message saved.");
      setSelectedContacts(new Set());
      setVariableDefaults({});
      setName("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create schedule");
    } finally {
      setSaving(false);
    }
  }

  async function changeScheduleStatus(id: string, action: "pause" | "resume") {
    setScheduleActionError("");
    try {
      const res = await fetch("/api/scheduled-bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update schedule");
      await loadData();
    } catch (err) {
      setScheduleActionError(err instanceof Error ? err.message : "Failed to update schedule");
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm("Delete this scheduled bulk message?")) return;
    try {
      const res = await fetch("/api/scheduled-bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete schedule");
      await loadData();
    } catch (err) {
      setScheduleActionError(err instanceof Error ? err.message : "Failed to delete schedule");
    }
  }

  const dayLabels: Record<number, string> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 page-reveal">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scheduled Bulk</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule bulk template messages with Supabase cron support for South Africa time.</p>
        </div>
      </div>

      <div className="card p-6 space-y-6 reveal-card" style={{ animationDelay: "80ms" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create Schedule</h2>
            <p className="text-sm text-slate-500 mt-1">Choose a template, pick recipients, and decide when it should run.</p>
          </div>
          <div className="text-xs text-slate-400">
            Org: {orgId ? "loaded" : "pending"}
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center"><PacmanLoader size={40} label="Loading schedule editor" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label">Schedule name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly check-in campaign" />
              </div>

              <div>
                <label className="label">Template</label>
                <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Send from</label>
                <select className="input" value={instanceId} onChange={(e) => setInstanceId(e.target.value)}>
                  {instances.map((instance) => (
                    <option key={instance.id} value={instance.id}>
                      {instance.name} {instance.phone_number ? `(${instance.phone_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Schedule type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["one_time", "recurring"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setScheduleType(type)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left transition-colors",
                        scheduleType === type ? "border-whatsapp-teal bg-whatsapp-teal/5" : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <p className="font-semibold text-slate-900 capitalize">{type.replace("_", " ")}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {type === "one_time" ? "Send once at a specific date and time." : "Repeat on a schedule until paused."}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Send time (South Africa)</label>
                <input className="input" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
              </div>

              {scheduleType === "recurring" && (
                <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <label className="label">Repeat</label>
                    <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as "daily" | "weekly" | "monthly")}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Every</label>
                    <input className="input" type="number" min={1} value={interval} onChange={(e) => setInterval(Number(e.target.value) || 1)} />
                  </div>
                  {frequency === "weekly" && (
                    <div>
                      <label className="label">Days of week</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(dayLabels).map(([day, label]) => {
                          const dayNumber = Number(day);
                          const active = daysOfWeek.includes(dayNumber);
                          return (
                            <button
                              key={day}
                              onClick={() => setDaysOfWeek((prev) => prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber].sort())}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                                active ? "bg-whatsapp-teal text-white border-whatsapp-teal" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label flex items-center gap-1.5 mb-0"><Users className="w-3.5 h-3.5" /> Recipients</label>
                  <button onClick={toggleAllContacts} className="text-xs text-whatsapp-teal hover:underline">
                    {filteredContacts.every((contact) => selectedContacts.has(contact.id)) ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input className="input pl-8 text-sm" placeholder="Search contacts..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No contacts found</p>
                  ) : filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={cn("w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left", selectedContacts.has(contact.id) && "bg-whatsapp-teal/5")}
                    >
                      {selectedContacts.has(contact.id)
                        ? <CheckSquare className="w-4 h-4 text-whatsapp-teal flex-shrink-0" />
                        : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{contact.name ?? "—"}</p>
                        <p className="text-xs text-slate-400">{contact.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedContacts.size > 0 && (
                  <p className="text-xs text-whatsapp-teal mt-1.5 font-medium">{selectedContacts.size} recipient{selectedContacts.size !== 1 ? "s" : ""} selected</p>
                )}
              </div>

              {customVariables.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Custom template variables</p>
                    <p className="text-xs text-slate-500 mt-1">Auto-filled: name, phone, and email.</p>
                  </div>
                  <div className="space-y-3">
                    {customVariables.map((variable) => (
                      <div key={variable}>
                        <label className="label font-mono">{`{{${variable}}}`}</label>
                        <input
                          className="input"
                          placeholder={`Value for ${variable}`}
                          value={variableDefaults[variable] ?? ""}
                          onChange={(e) => updateVariableDefaults(variable, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{success}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleCreateSchedule} disabled={saving} className="btn-primary inline-flex items-center gap-2">
            {saving && <PacmanLoader size={14} className="mr-1.5" label="Creating schedule" />}
            {saving ? "Saving..." : <><Plus className="w-4 h-4" /> Create schedule</>}
          </button>
          <p className="text-xs text-slate-400">Runs in Africa/Johannesburg time. Recurring jobs are picked up by the Supabase cron dispatcher.</p>
        </div>
      </div>

      <div className="card p-6 space-y-4 reveal-card" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Scheduled Campaigns</h2>
            <p className="text-sm text-slate-500 mt-1">Pause, resume, or remove bulk jobs.</p>
          </div>
          <div className="text-xs text-slate-400">{schedules.length} scheduled</div>
        </div>

        {loadingSchedules ? (
          <div className="py-10 flex justify-center"><PacmanLoader size={40} label="Loading scheduled campaigns" /></div>
        ) : schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No scheduled campaigns yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first scheduled bulk send above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schedules.map((schedule, index) => (
              <div key={schedule.id} className={cn("rounded-2xl border p-4 space-y-3 reveal-card reveal-lift", schedule.status === "paused" ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-white")} style={{ animationDelay: `${index * 70}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{schedule.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {schedule.template?.name ?? schedule.template_snapshot?.name ?? "Template"} • {schedule.recipient_snapshot?.length ?? 0} recipients
                    </p>
                  </div>
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", schedule.status === "scheduled" ? "bg-green-100 text-green-700" : schedule.status === "paused" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>
                    {schedule.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    <p className="uppercase tracking-wide text-[10px] text-slate-400">Next run</p>
                    <p className="text-slate-700">{schedule.next_run_at ? format(new Date(schedule.next_run_at), "PP p") : "—"}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[10px] text-slate-400">Type</p>
                    <p className="text-slate-700 capitalize">{schedule.schedule_type.replace("_", " ")}</p>
                  </div>
                </div>

                {schedule.last_run_at && (
                  <div className="text-xs text-slate-500">
                    Last run: <span className="text-slate-700">{format(new Date(schedule.last_run_at), "PP p")}</span>
                  </div>
                )}

                {scheduleActionError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{scheduleActionError}</div>}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {schedule.status === "paused" ? (
                    <button onClick={() => changeScheduleStatus(schedule.id, "resume")} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-whatsapp-teal hover:bg-whatsapp-teal/10 rounded-lg transition-colors">
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  ) : (
                    <button onClick={() => changeScheduleStatus(schedule.id, "pause")} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 rounded-lg transition-colors">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  <button onClick={() => deleteSchedule(schedule.id)} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 reveal-card" style={{ animationDelay: "220ms" }}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Set up a Supabase cron job to `POST /api/cron/scheduled-bulk/process` with your `CRON_SECRET` in the `x-cron-secret` header. The app will do the rest.</p>
        </div>
      </div>
    </div>
  );
}
