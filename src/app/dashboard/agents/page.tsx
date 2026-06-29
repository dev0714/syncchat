"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headset, Users, Clock, Save } from "lucide-react";
import { cn, formatRelativeTime, ROLE_LABELS, ROLE_COLORS } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

interface AgentRow {
  id: string;
  user_id: string;
  role: string;
  is_available: boolean;
  last_assigned_at: string | null;
  name: string;
  email: string | null;
  active_chats: number;
}

interface QueueRow {
  id: string;
  contact_name: string;
  last_message: string | null;
  last_message_at: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  awaiting: boolean;
}

interface HoldingSettings {
  holding_enabled?: boolean;
  holding_message?: string;
  holding_interval_minutes?: number;
}

const DEFAULT_HOLDING = "Thanks for your patience! 🐾 One of our team members will be with you shortly.";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [myRole, setMyRole] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  // Holding settings form
  const [holdEnabled, setHoldEnabled] = useState(true);
  const [holdMessage, setHoldMessage] = useState("");
  const [holdInterval, setHoldInterval] = useState(5);
  const [savingHold, setSavingHold] = useState(false);
  const [holdSaved, setHoldSaved] = useState(false);

  const isAdmin = myRole === "org_admin" || myRole === "super_admin";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to load agents");
      }
      const body = await res.json();
      setAgents(body.agents ?? []);
      setQueue(body.queue ?? []);
      setMyRole(body.myRole ?? "");
      setMyUserId(body.myUserId ?? "");
      const s: HoldingSettings = body.settings ?? {};
      setHoldEnabled(s.holding_enabled !== false);
      setHoldMessage(s.holding_message ?? "");
      setHoldInterval(s.holding_interval_minutes ?? 5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability(agent: AgentRow) {
    setSavingId(agent.id);
    setError("");
    try {
      const res = await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: agent.id, is_available: !agent.is_available }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update availability");
      }
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, is_available: !a.is_available } : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update availability");
    } finally {
      setSavingId("");
    }
  }

  async function saveHolding() {
    setSavingHold(true);
    setHoldSaved(false);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "agents",
          holding_enabled: holdEnabled,
          holding_message: holdMessage.trim() || null,
          holding_interval_minutes: Math.max(1, Number(holdInterval) || 5),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save settings");
      }
      setHoldSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingHold(false);
    }
  }

  function canToggle(agent: AgentRow) {
    return isAdmin || agent.user_id === myUserId;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 page-reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-slate-500 text-sm mt-1">
            Onboard human agents, set who is available, and auto-assign chats that ask for a person.
          </p>
        </div>
        <Link href="/dashboard/settings" className="btn-secondary flex items-center gap-2">
          <Users className="w-4 h-4" /> Manage team
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Headset className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">How it works</p>
          <p className="text-blue-600 mt-0.5">
            Agents are your team members. When a customer asks to speak to a human, the chat is
            auto-assigned (round-robin) to an <strong>Online</strong> agent, and the customer gets a
            holding message every few minutes until someone replies. Add new agents from{" "}
            <Link href="/dashboard/settings" className="underline">Settings → Team</Link>.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <PacmanLoader size={32} label="Loading agents" />
        </div>
      ) : (
        <>
          {/* Agents table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-700">Team agents</h2>
            </div>
            {agents.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-500">No agents yet. Invite team members from Settings → Team.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Active chats</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Last assigned</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {agent.name}
                          {agent.user_id === myUserId && <span className="text-xs text-slate-400"> (you)</span>}
                        </p>
                        {agent.email && <p className="text-xs text-slate-400">{agent.email}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("badge", ROLE_COLORS[agent.role] ?? "bg-gray-100 text-gray-800")}>
                          {ROLE_LABELS[agent.role] ?? agent.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{agent.active_chats}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {agent.last_assigned_at ? formatRelativeTime(agent.last_assigned_at) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleAvailability(agent)}
                          disabled={!canToggle(agent) || savingId === agent.id}
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                            agent.is_available
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                            (!canToggle(agent) || savingId === agent.id) && "opacity-50 cursor-not-allowed",
                          )}
                          title={canToggle(agent) ? "Toggle availability" : "Only admins can change other agents"}
                        >
                          <span className={cn("w-2 h-2 rounded-full", agent.is_available ? "bg-green-500" : "bg-slate-400")} />
                          {agent.is_available ? "Online" : "Offline"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Queue */}
          <div className="card overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-700">Waiting for a human ({queue.length})</h2>
            </div>
            {queue.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No chats waiting for an agent right now.</div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Last message</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Waiting since</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Assigned to</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {queue.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{q.contact_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{q.last_message ?? "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {q.last_message_at ? formatRelativeTime(q.last_message_at) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {q.assigned_name ? (
                          <span className="badge bg-blue-100 text-blue-800">{q.assigned_name}</span>
                        ) : (
                          <span className="badge bg-amber-100 text-amber-800">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href="/dashboard/conversations" className="text-whatsapp-teal text-sm font-medium hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Holding settings (admin only) */}
          {isAdmin && (
            <div className="card p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Holding messages</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sent to a waiting customer on a repeating interval until an agent replies.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={holdEnabled} onChange={(e) => setHoldEnabled(e.target.checked)} />
                Enable holding messages
              </label>

              <div>
                <label className="label">Message text</label>
                <textarea
                  className="input min-h-[80px]"
                  value={holdMessage}
                  placeholder={DEFAULT_HOLDING}
                  onChange={(e) => setHoldMessage(e.target.value)}
                />
              </div>

              <div className="max-w-[200px]">
                <label className="label">Send every (minutes)</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={holdInterval}
                  onChange={(e) => setHoldInterval(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={saveHolding} disabled={savingHold} className="btn-primary flex items-center gap-2">
                  {savingHold ? <PacmanLoader size={14} label="Saving" /> : <><Save className="w-4 h-4" /> Save</>}
                </button>
                {holdSaved && <span className="text-sm text-green-600">Saved</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
