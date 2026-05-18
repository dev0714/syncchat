"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Plus, Trash2, Pencil, Play, ToggleLeft, ToggleRight,
  Clock, MessageSquare, UserPlus, Hash, Smartphone,
} from "lucide-react";
import type { N8nFlow } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

const TRIGGER_TYPES = [
  { value: "inbound_message", label: "Inbound Message", icon: MessageSquare },
  { value: "keyword",         label: "Keyword Match",   icon: Hash          },
  { value: "new_contact",     label: "New Contact",     icon: UserPlus      },
  { value: "manual",          label: "Manual Trigger",  icon: Play          },
  { value: "schedule",        label: "Scheduled",       icon: Clock         },
] as const;

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

export default function FlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<N8nFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [error, setError] = useState("");
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const { response, body } = await fetchJsonWithTimeout("/api/flows");
      if (!response.ok) throw new Error(body?.error ?? "Failed to load flows");
      setFlows((body.flows ?? []) as N8nFlow[]);
      setInstances((body.instances ?? []) as WhatsAppInstance[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flows.");
      setFlows([]);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this flow?")) return;
    const { response, body } = await fetchJsonWithTimeout("/api/flows", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) { setError(body?.error ?? "Failed to delete flow"); return; }
    setFlows(prev => prev.filter(f => f.id !== id));
  }

  async function toggleActive(f: N8nFlow) {
    const nextActive = !f.is_active;
    const { response, body } = await fetchJsonWithTimeout("/api/flows", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f.id, action: "toggle", is_active: nextActive }),
    });
    if (!response.ok) { setError(body?.error ?? "Failed to update flow"); return; }
    setFlows(prev => prev.map(fl => fl.id === f.id ? { ...fl, is_active: nextActive } : fl));
  }

  async function triggerManual(f: N8nFlow) {
    setTriggering(f.id);
    try {
      const { response, body } = await fetchJsonWithTimeout("/api/flows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: f.id, action: "trigger" }),
      });
      if (!response.ok) throw new Error(body?.error ?? "Failed to trigger flow");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger flow");
    }
    setTriggering(null);
  }

  const triggerInfo = (type: string) => TRIGGER_TYPES.find(t => t.value === type);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flows</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered automation flows for your WhatsApp</p>
        </div>
        <button onClick={() => router.push("/dashboard/flows/new")} className="btn-primary flex items-center gap-2">
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

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><PacmanLoader size={40} label="Loading flows" /></div>
      ) : flows.length === 0 ? (
        <div className="card p-16 text-center">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No flows yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Create your first AI-powered flow to automate WhatsApp responses</p>
          <button onClick={() => router.push("/dashboard/flows/new")} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Flow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flows.map(f => {
            const info = triggerInfo(f.trigger_type);
            const TriggerIcon = info?.icon ?? Zap;
            const legacyConfig = (f as N8nFlow & { trigger_config?: Record<string, unknown> }).trigger_config ?? {};
            const linkedInstance = instances.find(i => i.id === f.instance_id || i.id === (legacyConfig.instance_id as string));
            const triggerKeyword = f.trigger_keyword ?? (legacyConfig.keyword as string) ?? "";
            const promptRole = f.prompt_role ?? ((legacyConfig.prompt as Record<string, string> | undefined)?.role ?? "");

            return (
              <div key={f.id} className={cn("card p-5 space-y-4", !f.is_active && "opacity-60")}>
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
                  <button onClick={() => toggleActive(f)} className="flex-shrink-0" title={f.is_active ? "Disable flow" : "Enable flow"}>
                    {f.is_active
                      ? <ToggleRight className="w-5 h-5 text-whatsapp-teal" />
                      : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{info?.label ?? f.trigger_type}</span>
                    {triggerKeyword && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-mono">keyword: {triggerKeyword}</span>
                    )}
                    {linkedInstance && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />{linkedInstance.name} ({linkedInstance.instance_id})
                      </span>
                    )}
                  </div>

                  {promptRole && (
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 font-medium mb-0.5">AI Role</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{promptRole}</p>
                    </div>
                  )}
                  {f.last_triggered_at && (
                    <p className="text-xs text-slate-400">Last triggered: {formatDateTime(f.last_triggered_at)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {f.trigger_type === "manual" && (
                    <button
                      onClick={() => triggerManual(f)}
                      disabled={triggering === f.id || !f.is_active}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      {triggering === f.id ? <PacmanLoader size={12} label="Triggering" /> : <Play className="w-3.5 h-3.5" />}
                      Trigger Now
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/flows/${f.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
