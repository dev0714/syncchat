"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Sparkles, X } from "lucide-react";

interface Usage {
  isTrial: boolean;
  limit: number;
  used: number;
  remaining: number;
  reached: boolean;
}

/**
 * Slim, fixed usage pill for trial orgs. Shows messages used / limit, warns as
 * it fills, and turns into a blocking "limit reached — upgrade" bar at the cap.
 * Fixed-position so it never disturbs page layouts (e.g. the conversations
 * two-pane). Refreshes on navigation and every 60s.
 */
export default function TrialUsageBanner() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch("/api/trial/usage", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (active && d?.isTrial) setUsage(d as Usage);
          else if (active) setUsage(null);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [pathname]);

  if (!usage || !usage.isTrial) return null;

  const pct = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const near = pct >= 80 && !usage.reached;

  // At the cap: prominent blocking bar (not dismissible).
  if (usage.reached) {
    return (
      <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Trial limit reached</p>
            <p className="text-xs text-slate-500">You&apos;ve used all {usage.limit} trial messages. Upgrade to keep sending.</p>
          </div>
          <Link
            href="/dashboard/billing"
            className="flex-shrink-0 rounded-xl bg-whatsapp-teal px-3 py-2 text-xs font-bold text-white hover:bg-whatsapp-dark transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  if (dismissed && !near) return null;

  // Under the cap: slim progress pill (dismissible unless nearly full).
  return (
    <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
      <div className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-2.5 shadow-lg ${near ? "border-amber-300" : "border-slate-200"}`}>
        <Sparkles className={`h-4 w-4 flex-shrink-0 ${near ? "text-amber-500" : "text-whatsapp-teal"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Free trial</span>
            <span className="text-slate-500">
              {usage.used} / {usage.limit} messages
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${near ? "bg-amber-500" : "bg-whatsapp-green"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Link href="/dashboard/billing" className="flex-shrink-0 text-xs font-bold text-whatsapp-teal hover:underline">
          Upgrade
        </Link>
        {!near && (
          <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="flex-shrink-0 text-slate-300 hover:text-slate-500">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
