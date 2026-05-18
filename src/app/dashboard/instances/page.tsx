"use client";
import { useEffect, useState } from "react";
import {
  Smartphone,
  RefreshCw,
  Wifi,
  WifiOff,
  QrCode,
  Check,
} from "lucide-react";
import type { WhatsAppInstance } from "@/types";
import { cn, STATUS_COLORS, formatDateTime } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

export default function InstancesPage() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [fetchingQr, setFetchingQr] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/instances", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load instances.");
        setInstances([]);
        return;
      }

      setInstances((data.instances ?? []) as WhatsAppInstance[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load instances.");
      setInstances([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchQr(instId: string) {
    setFetchingQr(instId);
    try {
      const res = await fetch(`/api/instances/${instId}/qr`);
      const data = await res.json();
      if (data.qrImage) {
        setQrImages((prev) => ({ ...prev, [instId]: data.qrImage }));
      }
    } catch {
      // keep the UI resilient and allow a retry
    } finally {
      setFetchingQr(null);
    }
  }

  async function refreshStatus(inst: WhatsAppInstance) {
    setRefreshing(inst.id);
    try {
      const res = await fetch(`/api/instances/${inst.id}/status`);
      const data = await res.json();
      if (data.status) {
        await loadData();
        if (data.status === "qr_required") {
          await fetchQr(inst.id);
        }
      }
    } catch {
      // leave the current view intact
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">WhatsApp Instances</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your SyncChat WhatsApp connections</p>
      </div>

      {/* Explainer */}
      <div className="bg-whatsapp-teal/5 border border-whatsapp-teal/20 rounded-xl p-5 space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-whatsapp-teal/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 text-whatsapp-teal" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">What is a WhatsApp Instance?</p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              A <strong className="text-slate-700">WhatsApp Instance</strong> is a linked WhatsApp Business number that
              SyncChat uses to send and receive messages on your behalf. Think of it as the phone number your AI agent and
              team members communicate through — it&apos;s the live connection between SyncChat and WhatsApp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-11">
          {[
            { icon: '📱', title: 'Your number', desc: 'Uses your existing WhatsApp Business number — no porting required.' },
            { icon: '🤖', title: 'Powers your AI agent', desc: 'All automated replies and AI flows run through this instance.' },
            { icon: '👥', title: 'Shared with your team', desc: 'Every team member uses the same instance to chat with customers.' },
          ].map(item => (
            <div key={item.title} className="bg-white border border-whatsapp-teal/10 rounded-lg px-4 py-3 flex gap-3 items-start">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-700">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 pl-11">
          Your instance is managed by your super admin. Contact them if you need a new number connected or have trouble with the status below.
        </p>
      </div>

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <PacmanLoader size={40} label="Loading instances" />
        </div>
      ) : instances.length === 0 ? (
        <div className="card p-16 text-center">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No instances yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Your super admin will assign a WhatsApp instance to your organization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instances.map((inst) => {
            const isConnected = inst.status === "connected";
            const isQrRequired = inst.status === "qr_required";
            const qrImage = qrImages[inst.id];

            return (
              <div key={inst.id} className="card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isConnected ? "bg-green-50" : isQrRequired ? "bg-amber-50" : "bg-slate-100"
                      )}
                    >
                      {isConnected ? (
                        <Wifi className="w-5 h-5 text-green-600" />
                      ) : isQrRequired ? (
                        <QrCode className="w-5 h-5 text-amber-600" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{inst.name}</p>
                      <p className="text-xs text-slate-400">{inst.phone_number ?? "No phone linked"}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "badge",
                      inst.status === "connected"
                        ? "bg-green-100 text-green-700"
                        : inst.status === "qr_required"
                          ? "bg-amber-100 text-amber-700"
                          : STATUS_COLORS[inst.status] ?? "bg-slate-100 text-slate-600"
                    )}
                  >
                    {inst.status}
                  </span>
                </div>

                {isQrRequired ? (
                  <div className="border border-dashed border-yellow-300 rounded-xl p-3 bg-yellow-50/50 space-y-2">
                    <p className="text-xs font-medium text-yellow-700 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" /> Scan QR Code to connect WhatsApp
                    </p>
                    {qrImage ? (
                      <img
                        src={qrImage}
                        alt="WhatsApp QR"
                        className="w-44 h-44 rounded-lg border border-yellow-200"
                      />
                    ) : (
                      <button
                        onClick={() => fetchQr(inst.id)}
                        disabled={fetchingQr === inst.id}
                        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                      >
                        {fetchingQr === inst.id ? (
                          <><PacmanLoader size={12} className="mr-1" label="Loading QR" /> Loading QR...</>
                        ) : (
                          <><QrCode className="w-3.5 h-3.5" /> Show QR Code</>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm flex items-center gap-2",
                      isConnected
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    )}
                  >
                    {isConnected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>QR done. The instance is authenticated and ready.</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4" />
                        <span>{inst.status.replaceAll("_", " ")}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => refreshStatus(inst)}
                    disabled={refreshing === inst.id}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", refreshing === inst.id && "animate-spin")} />
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-slate-300 text-right -mt-1">Updated {formatDateTime(inst.updated_at)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
