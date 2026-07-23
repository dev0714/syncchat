"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, X } from "lucide-react";
import SyncChatMark from "@/components/brand/SyncChatMark";
import PacmanLoader from "@/components/ui/PacmanLoader";

/**
 * First-login WhatsApp linking for trial orgs. On mount it asks the API whether
 * this org still needs to link a number (free plan, no instance, not dismissed).
 * If so it prompts for the number, auto-creates a WAHA instance, and sends the
 * user to the Instances page to scan the pairing QR.
 */
export default function TrialOnboarding() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/onboarding/whatsapp", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.needsOnboarding) setShow(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function link() {
    setError("");
    if (!phone.trim()) {
      setError("Please enter the WhatsApp number you want to link.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't set up WhatsApp. Please try again.");
        return;
      }
      setShow(false);
      router.push("/dashboard/instances");
      router.refresh();
    } catch {
      setError("Couldn't set up WhatsApp. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function skip() {
    setShow(false);
    fetch("/api/onboarding/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skip: true }),
    }).catch(() => {});
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            <SyncChatMark className="h-10 w-10" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Link your WhatsApp number</h2>
              <p className="text-xs text-slate-500">Get your AI assistant live in a minute</p>
            </div>
          </div>
          <button onClick={skip} aria-label="Skip" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Enter the WhatsApp number you want to connect. We&apos;ll set it up and show you a QR code to
            scan from WhatsApp on that phone.
          </p>

          <div>
            <label htmlFor="wa-number" className="mb-1 block text-xs font-semibold text-slate-700">
              WhatsApp number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="wa-number"
                className="input pl-9"
                placeholder="+27 82 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && link()}
                autoFocus
              />
            </div>
          </div>

          <div className="rounded-xl bg-whatsapp-teal/5 border border-whatsapp-teal/15 px-3 py-2.5 text-xs text-whatsapp-teal">
            Your free trial includes <b>100 messages</b>. Upgrade any time to keep going.
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</div>}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={skip} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Skip for now
            </button>
            <button
              onClick={link}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-whatsapp-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-whatsapp-dark transition-colors disabled:opacity-60"
            >
              {loading && <PacmanLoader size={14} label="Setting up" />}
              {loading ? "Setting up..." : "Link & continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
