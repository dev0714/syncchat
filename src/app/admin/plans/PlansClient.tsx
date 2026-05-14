"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { savePlan, deletePlan } from "./actions";
import type { PaystackPlan } from "./page";
import { Trash2, Plus, Bot, CheckCircle2 } from "lucide-react";

const TIERS = [5000, 10000, 15000, 20000];
const BILLING_PERIODS = ["monthly", "annual"] as const;

const TIER_PRICES: Record<number, number> = {
  5000:  250000,
  10000: 500000,
  15000: 750000,
  20000: 1000000,
};

export default function PlansClient({ plans }: { plans: PaystackPlan[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of plans) {
      map[`${p.tier_conversations}_${p.billing_period}`] = p.plan_code;
    }
    return map;
  });

  function planFor(conv: number, period: string) {
    return plans.find(p => p.tier_conversations === conv && p.billing_period === period);
  }

  async function handleSave(conv: number, period: string) {
    const key = `${conv}_${period}`;
    const planCode = inputs[key]?.trim();
    if (!planCode) return;

    const disc = period === "annual" ? 0.8 : 1;
    const baseMonthly = (1500 + (TIER_PRICES[conv] / 100)) * disc;
    const amountCents = Math.round(baseMonthly) * 100;

    setSaving(key);
    setError(null);
    setSaved(null);
    try {
      const fd = new FormData();
      fd.set("tier_conversations", String(conv));
      fd.set("billing_period", period);
      fd.set("plan_code", planCode);
      fd.set("amount_cents", String(amountCents));
      await savePlan(fd);
      setSaved(key);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(plan: PaystackPlan) {
    setDeleting(plan.id);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", plan.id);
      await deletePlan(fd);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="card p-5 space-y-2">
        <p className="text-sm font-semibold text-slate-900">How to set up plans</p>
        <ol className="text-sm text-slate-500 space-y-1 list-decimal list-inside">
          <li>Create recurring plans in your <strong>Paystack dashboard</strong> (Subscriptions → Plans)</li>
          <li>Set the correct amount and interval (monthly / annually) for each tier</li>
          <li>Copy the plan code (e.g. <code className="font-mono text-xs bg-slate-100 px-1 rounded">PLN_xxxxxxxxxxxx</code>) and paste it below</li>
          <li>Click <strong>Save</strong> — customers will subscribe to this plan on checkout</li>
        </ol>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-600" />
          <h2 className="font-semibold text-slate-900">AI Subscription Plans</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tier</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Billing</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Monthly charge</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Paystack plan code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {TIERS.flatMap(conv =>
              BILLING_PERIODS.map(period => {
                const key = `${conv}_${period}`;
                const existing = planFor(conv, period);
                const disc = period === "annual" ? 0.8 : 1;
                const aiMonthly = Math.round((TIER_PRICES[conv] / 100) * disc);
                const platformMonthly = Math.round(1500 * disc);
                const total = aiMonthly + platformMonthly;

                return (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {(conv / 1000).toFixed(0)}k conversations
                    </td>
                    <td className="px-5 py-3.5 capitalize text-slate-600">{period}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-semibold">
                      R{total.toLocaleString("en-ZA")} / mo
                      {period === "annual" && (
                        <span className="ml-1 text-xs text-green-600 font-normal">(20% off)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        placeholder="PLN_xxxxxxxxxxxx"
                        value={inputs[key] ?? ""}
                        onChange={e => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-56 px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-whatsapp-teal/30"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      {existing ? (
                        <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">Configured</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 flex items-center gap-2">
                      <button
                        onClick={() => handleSave(conv, period)}
                        disabled={saving === key || !inputs[key]?.trim()}
                        className={cn(
                          "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                          inputs[key]?.trim()
                            ? "bg-whatsapp-teal text-white hover:bg-whatsapp-teal/90"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {saved === key
                          ? <><CheckCircle2 className="w-3 h-3" /> Saved!</>
                          : saving === key
                            ? "Saving…"
                            : <><Plus className="w-3 h-3" /> {existing ? "Update" : "Save"}</>
                        }
                      </button>
                      {existing && (
                        <button
                          onClick={() => handleDelete(existing)}
                          disabled={deleting === existing.id}
                          className="text-xs px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
