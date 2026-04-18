"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Smartphone, Plus, Trash2, RefreshCw, Wifi, WifiOff,
  QrCode, Copy, Check, Pencil, X, Loader2, Link,
} from "lucide-react";
import type { WhatsAppInstance } from "@/types";
import { cn, STATUS_COLORS, formatDateTime } from "@/lib/utils";

const defaultForm = {
  name: "",
  instance_id: "",
  token: "",
  phone_number: "",
  webhook_url: "",
};

export default function InstancesPage() {
  const supabase = createClient();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WhatsAppInstance | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [fetchingQr, setFetchingQr] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: member } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single();
    if (!member) return;
    setOrgId(member.org_id);
    setIsSuperAdmin(member.role === "super_admin");
    const { data } = await supabase.from("whatsapp_instances").select("*").eq("org_id", member.org_id).order("created_at");
    setInstances(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...defaultForm });
    setError("");
    setShowModal(true);
  }

  function openEdit(inst: WhatsAppInstance) {
    setEditing(inst);
    setForm({
      name: inst.name,
      instance_id: inst.instance_id,
      token: inst.token,
      phone_number: inst.phone_number ?? "",
      webhook_url: inst.webhook_url ?? "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.instance_id || !form.token) {
      setError("Name, Instance ID, and Token are required.");
      return;
    }
    setSaving(true);
    setError("");
    if (editing) {
      const { error } = await supabase.from("whatsapp_instances").update({
        name: form.name,
        instance_id: form.instance_id,
        token: form.token,
        phone_number: form.phone_number || null,
        webhook_url: form.webhook_url || null,
        updated_at: new Date().toISOString(),
      }).eq("id", editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("whatsapp_instances").insert({
        org_id: orgId,
        name: form.name,
        instance_id: form.instance_id,
        token: form.token,
        phone_number: form.phone_number || null,
        webhook_url: form.webhook_url || null,
        status: "disconnected",
        is_active: true,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this instance? This cannot be undone.")) return;
    await supabase.from("whatsapp_instances").delete().eq("id", id);
    loadData();
  }

  async function fetchQr(instId: string) {
    setFetchingQr(instId);
    try {
      const res = await fetch(`/api/instances/${instId}/qr`);
      const data = await res.json();
      if (data.qrImage) setQrImages((prev) => ({ ...prev, [instId]: data.qrImage }));
    } catch {}
    setFetchingQr(null);
  }

  async function refreshStatus(inst: WhatsAppInstance) {
    setRefreshing(inst.id);
    try {
      const res = await fetch(`/api/instances/${inst.id}/status`);
      const data = await res.json();
      if (data.status) {
        await supabase.from("whatsapp_instances").update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", inst.id);
        await loadData();
        if (data.status === "qr_required") fetchQr(inst.id);
      }
    } catch {}
    setRefreshing(null);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp Instances</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your SyncChat WhatsApp connections</p>
        </div>
        {isSuperAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Instance
          </button>
        )}
      </div>

      {/* Help card */}
      <div className="bg-whatsapp-teal/5 border border-whatsapp-teal/20 rounded-xl p-4 flex gap-3">
        <div className="w-8 h-8 bg-whatsapp-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-4 h-4 text-whatsapp-teal" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Connect via SyncChat</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Your WhatsApp instance is managed by SyncChat. Contact your administrator if you need help connecting.
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : instances.length === 0 ? (
        <div className="card p-16 text-center">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No instances yet</p>
          {isSuperAdmin ? (
            <>
              <p className="text-slate-400 text-sm mt-1 mb-4">Add your first SyncChat WhatsApp instance</p>
              <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Instance
              </button>
            </>
          ) : (
            <p className="text-slate-400 text-sm mt-1">Your super admin will assign a WhatsApp instance to your organization.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instances.map((inst) => (
            <div key={inst.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                    inst.status === "connected" ? "bg-green-50" : "bg-slate-100")}>
                    {inst.status === "connected"
                      ? <Wifi className="w-5 h-5 text-green-600" />
                      : <WifiOff className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{inst.name}</p>
                    <p className="text-xs text-slate-400">{inst.phone_number ?? "No phone linked"}</p>
                  </div>
                </div>
                <span className={cn("badge", STATUS_COLORS[inst.status])}>{inst.status}</span>
              </div>

              {/* Instance details */}
              <div className="space-y-2">
                {inst.webhook_url && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <Link className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500 truncate">{inst.webhook_url}</p>
                  </div>
                )}
              </div>

              {inst.status === "qr_required" && (
                <div className="border border-dashed border-yellow-300 rounded-xl p-3 bg-yellow-50/50 space-y-2">
                  <p className="text-xs font-medium text-yellow-700 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" /> Scan QR Code to connect WhatsApp
                  </p>
                  {qrImages[inst.id] ? (
                    <img src={qrImages[inst.id]} alt="WhatsApp QR" className="w-44 h-44 rounded-lg border border-yellow-200" />
                  ) : (
                    <button
                      onClick={() => fetchQr(inst.id)}
                      disabled={fetchingQr === inst.id}
                      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                      {fetchingQr === inst.id
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading QR...</>
                        : <><QrCode className="w-3.5 h-3.5" /> Show QR Code</>}
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button onClick={() => refreshStatus(inst)} disabled={refreshing === inst.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                  <RefreshCw className={cn("w-3.5 h-3.5", refreshing === inst.id && "animate-spin")} />
                  Refresh
                </button>
                {isSuperAdmin && (
                  <>
                    <button onClick={() => openEdit(inst)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(inst.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300 text-right -mt-1">Updated {formatDateTime(inst.updated_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">{editing ? "Edit Instance" : "Add WhatsApp Instance"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Instance Name *</label>
                <input className="input" placeholder="e.g. Sales Team" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Instance ID *</label>
                <input className="input" placeholder="instance12345" value={form.instance_id}
                  onChange={(e) => setForm({ ...form, instance_id: e.target.value })} />
              </div>
              <div>
                <label className="label">Token *</label>
                <input className="input" placeholder="Your API token" value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" placeholder="+1234567890" value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
              </div>
              <div>
                <label className="label">Webhook URL</label>
                <input className="input" placeholder="https://your-n8n-url/webhook/..." value={form.webhook_url}
                  onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">N8n or custom webhook to receive messages</p>
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Instance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
