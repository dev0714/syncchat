"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Shield, Smartphone, Building2, Plus, Pencil, Trash2,
  X, Check, Wifi, WifiOff, ChevronDown, ChevronRight,
  RefreshCw, QrCode,
} from "lucide-react";
import { cn, STATUS_COLORS } from "@/lib/utils";
import type { Organization, WhatsAppInstance } from "@/types";
import PacmanLoader from "@/components/ui/PacmanLoader";

const defaultForm = { name: "", instance_id: "", token: "", phone_number: "" };

type OrgWithInstances = Organization & { instances: WhatsAppInstance[] };

interface InstanceDetails {
  accountStatus: string | null;
  substatus: string | null;
  qrImage: string | null;
  statusError?: string | null;
  qrError?: string | null;
}

export default function AdminInstancesPage() {
  const supabase = createClient();
  const [orgs, setOrgs] = useState<OrgWithInstances[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, InstanceDetails>>({});
  const [fetching, setFetching] = useState<Set<string>>(new Set());

  // Modal state
  const [modal, setModal] = useState<{ orgId: string; orgName: string; editing: WhatsAppInstance | null } | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!orgData) { setLoading(false); return; }

    const { data: instanceData } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .order("created_at");

    const withInstances: OrgWithInstances[] = (orgData as Organization[]).map((org) => ({
      ...org,
      instances: ((instanceData ?? []) as WhatsAppInstance[]).filter((i) => i.org_id === org.id),
    }));

    setOrgs(withInstances);
    setLoading(false);
  }

  async function fetchInstanceDetails(instId: string) {
    setFetching((prev) => new Set([...prev, instId]));
    try {
      const res = await fetch(`/api/admin/instances/${instId}/details`);
      const data = await res.json();
      setDetails((prev) => ({ ...prev, [instId]: data }));
      // Refresh instance list to get updated status
      loadData();
    } catch {}
    setFetching((prev) => { const next = new Set(prev); next.delete(instId); return next; });
  }

  function toggle(orgId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
        // Auto-fetch for any instances that need a QR scan
        const org = orgs.find((o) => o.id === orgId);
        org?.instances.forEach((inst) => {
          if (inst.status === "qr_required" && !details[inst.id]) {
            fetchInstanceDetails(inst.id);
          }
        });
      }
      return next;
    });
  }

  function openAdd(org: OrgWithInstances) {
    setForm({ ...defaultForm });
    setError("");
    setSaved(false);
    setModal({ orgId: org.id, orgName: org.name, editing: null });
  }

  function openEdit(org: OrgWithInstances, inst: WhatsAppInstance) {
    setForm({
      name: inst.name,
      instance_id: inst.instance_id,
      token: inst.token,
      phone_number: inst.phone_number ?? "",
    });
    setError("");
    setSaved(false);
    setModal({ orgId: org.id, orgName: org.name, editing: inst });
  }

  async function handleSave() {
    if (!form.name || !form.instance_id || !form.token) {
      setError("Name, Instance ID, and Token are required.");
      return;
    }
    setSaving(true);
    setError("");

    if (modal?.editing) {
      const { error } = await supabase.from("whatsapp_instances").update({
        name: form.name,
        instance_id: form.instance_id,
        token: form.token,
        phone_number: form.phone_number || null,
        updated_at: new Date().toISOString(),
      }).eq("id", modal.editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("whatsapp_instances").insert({
        org_id: modal!.orgId,
        name: form.name,
        instance_id: form.instance_id,
        token: form.token,
        phone_number: form.phone_number || null,
        status: "disconnected",
        is_active: true,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setModal(null);
      setSaved(false);
      loadData();
      setExpanded((prev) => new Set([...prev, modal!.orgId]));
    }, 800);
  }

  async function handleDelete(inst: WhatsAppInstance) {
    if (!confirm(`Delete instance "${inst.name}"? This cannot be undone.`)) return;
    await supabase.from("whatsapp_instances").delete().eq("id", inst.id);
    loadData();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
          <p className="text-slate-500 text-sm">Platform-wide overview and management</p>
        </div>
      </div>

      {/* Admin nav */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <Building2 className="w-4 h-4" /> Organizations
        </Link>
        <Link href="/admin/instances" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-900 shadow-sm">
          <Smartphone className="w-4 h-4" /> Assign Instances
        </Link>
      </div>

      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3">
        <Smartphone className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-purple-900">WhatsApp Instance Assignment</p>
          <p className="text-xs text-purple-700 mt-0.5">
            Assign WhatsApp instances to each organization. Org admins cannot add or modify instance credentials — only you can.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <PacmanLoader size={40} label="Loading admin instances" />
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => {
            const isOpen = expanded.has(org.id);
            return (
              <div key={org.id} className="card overflow-hidden">
                {/* Org row */}
                <button
                  onClick={() => toggle(org.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 bg-whatsapp-teal/10 rounded-lg flex items-center justify-center text-whatsapp-teal font-bold text-sm flex-shrink-0">
                    {org.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{org.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full",
                      org.instances.length > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {org.instances.length} instance{org.instances.length !== 1 ? "s" : ""}
                    </span>
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded instances */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {org.instances.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <Smartphone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No instances assigned to this organization yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {org.instances.map((inst) => {
                          const d = details[inst.id];
                          const isFetching = fetching.has(inst.id);
                          const isConnected = inst.status === "connected";
                          const liveStatus = d?.accountStatus ?? null;
                          const needsQR = inst.status === "qr_required" || liveStatus === "qr";

                          return (
                            <div key={inst.id} className="px-5 py-4 space-y-4">
                              {/* Instance header row */}
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                  isConnected ? "bg-green-50" : "bg-slate-100"
                                )}>
                                  {isConnected
                                    ? <Wifi className="w-4 h-4 text-green-600" />
                                    : <WifiOff className="w-4 h-4 text-slate-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800">{inst.name}</p>
                                  <p className="text-xs text-slate-400 font-mono">{inst.instance_id}</p>
                                </div>
                                <span className={cn("badge", STATUS_COLORS[inst.status])}>{inst.status}</span>
                                <button
                                  onClick={() => fetchInstanceDetails(inst.id)}
                                  disabled={isFetching}
                                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                  <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                                  {isFetching ? "Fetching..." : "Fetch Live Data"}
                                </button>
                                <button onClick={() => openEdit(org, inst)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(inst)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Live data panel */}
                              {isFetching && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl text-xs text-slate-400">
                                  <PacmanLoader size={14} className="mr-1.5" label="Fetching live data" /> Fetching live data from instance...
                                </div>
                              )}

                              {!isFetching && d && (
                                <div className={cn(
                                  "gap-3 pl-12",
                                  needsQR ? "flex flex-col sm:flex-row" : "grid grid-cols-1 sm:grid-cols-2"
                                )}>
                                  {/* Status details */}
                                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Instance Status</p>

                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        liveStatus === "authenticated" ? "bg-green-500" :
                                        liveStatus === "qr" ? "bg-yellow-500" : "bg-slate-300"
                                      )} />
                                      <span className="text-sm font-medium text-slate-800 capitalize">
                                        {liveStatus ?? "Unknown"}
                                      </span>
                                    </div>

                                    {d.substatus && (
                                      <p className="text-xs text-slate-500 capitalize">{d.substatus}</p>
                                    )}

                                    {!d.accountStatus && (
                                      <p className="text-xs text-red-500 font-mono break-all">
                                        {d.statusError ?? "Could not reach instance"}
                                      </p>
                                    )}
                                  </div>

                                  {/* QR code */}
                                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">QR Code</p>
                                    {d.qrImage ? (
                                      <div className="space-y-2">
                                        <p className="text-xs text-yellow-600 font-semibold flex items-center gap-1">
                                          <QrCode className="w-3.5 h-3.5" /> Scan with WhatsApp to connect
                                        </p>
                                        <img
                                          src={d.qrImage}
                                          alt="WhatsApp QR Code"
                                          className={cn(
                                            "rounded-lg border border-slate-200",
                                            needsQR ? "w-52 h-52" : "w-40 h-40"
                                          )}
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center h-24 text-slate-300 gap-2">
                                        <QrCode className="w-8 h-8" />
                                        <p className="text-xs text-slate-400 text-center break-all">
                                          {d.qrError ?? (isConnected ? "Already connected" : "No QR available")}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="px-5 py-3 border-t border-slate-100">
                      <button
                        onClick={() => openAdd(org)}
                        className="flex items-center gap-2 text-sm font-medium text-whatsapp-teal hover:text-whatsapp-dark transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Assign new instance to {org.name}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {modal.editing ? "Edit Instance" : "Assign WhatsApp Instance"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organization: <span className="font-medium text-slate-600">{modal.orgName}</span>
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Instance Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Sales WhatsApp"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Instance ID *</label>
                <input
                  className="input font-mono"
                  placeholder="instance12345"
                  value={form.instance_id}
                  onChange={(e) => setForm({ ...form, instance_id: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Token *</label>
                <input
                  className="input font-mono"
                  placeholder="API token"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                />
              </div>
              <div>
                <label className="label">WhatsApp Phone Number</label>
                <input
                  className="input"
                  placeholder="+27 82 000 0000"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saved
                    ? <><Check className="w-4 h-4" /> Saved!</>
                    : saving
                    ? <><PacmanLoader size={14} className="mr-1.5" label="Saving instance" /> Saving...</>
                    : modal.editing ? "Save Changes" : "Assign Instance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
