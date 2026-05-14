"use client";
import { useState } from "react";
import {
  CreditCard, CheckCircle2, Zap, Shield, Users, MessageSquare,
  RefreshCw, Bot, MessageCircle, ChevronRight, Receipt, ExternalLink,
  Clock, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { startPayment } from "@/app/actions/payment";
import type { Invoice, ActiveSubscription } from "./page";
import { getManageLink } from "@/app/actions/payment";

function ManageSubButton({ subscriptionCode }: { subscriptionCode: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    const link = await getManageLink(subscriptionCode);
    window.location.href = link;
  }
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 text-sm font-medium text-whatsapp-teal hover:underline disabled:opacity-50"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {loading ? "Loading…" : "Manage subscription — update card or cancel"}
    </button>
  );
}

const TIERS = [
  { conversations: 5000,  monthly: 2500 },
  { conversations: 10000, monthly: 5000 },
  { conversations: 15000, monthly: 7500 },
  { conversations: 20000, monthly: 10000 },
];

const PLATFORM_PRICE = 1500;

const FEATURES = [
  { icon: MessageSquare, text: "WhatsApp messaging platform" },
  { icon: Users,         text: "Up to 10 team members" },
  { icon: Zap,           text: "Automated flows" },
  { icon: Shield,        text: "Role-based access control" },
  { icon: RefreshCw,     text: "Real-time message sync" },
  { icon: Bot,           text: "AI-powered conversation flows" },
];

function n(v: number) { return v.toLocaleString('en-ZA') }

const PLAN_LABELS: Record<string, string> = {
  free:       "Free Plan",
  starter:    "Starter Plan",
  pro:        "Pro Plan",
  enterprise: "Enterprise Plan",
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free:       "Upgrade to unlock the full SyncChat experience",
  starter:    "5,000 AI conversations / month · Active",
  pro:        "Up to 15,000 AI conversations / month · Active",
  enterprise: "20,000 AI conversations / month · Active",
};

export default function BillingClient({
  currentPlan,
  invoices,
  activeSubscription,
  trialDaysLeft,
  trialExpired,
}: {
  currentPlan: string;
  invoices: Invoice[];
  activeSubscription: ActiveSubscription;
  trialDaysLeft: number | null;
  trialExpired: boolean;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [tierIdx, setTierIdx] = useState(0);

  const tier = TIERS[tierIdx];
  const platformMonthly = billing === "annual" ? Math.round(PLATFORM_PRICE * 0.8) : PLATFORM_PRICE;
  const aiMonthly       = billing === "annual" ? Math.round(tier.monthly * 0.8)    : tier.monthly;
  const totalMonthly    = platformMonthly + aiMonthly;

  const annualTotal  = totalMonthly * 12;
  const monthlyTotal = (PLATFORM_PRICE + tier.monthly) * 12;
  const annualSaving = monthlyTotal - annualTotal;

  const isPaid = currentPlan !== "free";

  const isCurrentPlan =
    activeSubscription !== null &&
    TIERS[tierIdx].conversations === activeSubscription.tier_conversations &&
    billing === activeSubscription.billing_period;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Trial banner */}
      {trialExpired && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Your free trial has ended</p>
            <p className="text-xs text-red-600 mt-0.5">Choose a plan below to restore full access to SyncChat.</p>
          </div>
        </div>
      )}
      {!trialExpired && trialDaysLeft !== null && currentPlan === "free" && (
        <div className={cn(
          "rounded-xl border p-4 flex items-start gap-3",
          trialDaysLeft <= 3
            ? "border-orange-200 bg-orange-50"
            : "border-blue-200 bg-blue-50"
        )}>
          <Clock className={cn("w-5 h-5 flex-shrink-0 mt-0.5", trialDaysLeft <= 3 ? "text-orange-500" : "text-blue-500")} />
          <div>
            <p className={cn("text-sm font-semibold", trialDaysLeft <= 3 ? "text-orange-800" : "text-blue-800")}>
              {trialDaysLeft === 0 ? "Trial expires today" : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial`}
            </p>
            <p className={cn("text-xs mt-0.5", trialDaysLeft <= 3 ? "text-orange-600" : "text-blue-600")}>
              Subscribe below to keep your account active after the trial ends.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your SyncChat subscription</p>
      </div>

      {/* Current plan */}
      <div className={cn(
        "card p-5 flex items-center gap-4",
        isPaid
          ? "bg-green-50 border-green-200"
          : "bg-whatsapp-teal/5 border-whatsapp-teal/30"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isPaid ? "bg-green-100" : "bg-whatsapp-teal/10"
        )}>
          <CreditCard className={cn("w-5 h-5", isPaid ? "text-green-600" : "text-whatsapp-teal")} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {PLAN_LABELS[currentPlan] ?? "Free Plan"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {PLAN_DESCRIPTIONS[currentPlan] ?? "Upgrade to unlock the full SyncChat experience"}
          </p>
        </div>
        <span className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full",
          isPaid
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600"
        )}>
          {isPaid ? "Active" : "Current plan"}
        </span>
      </div>

      {/* Active subscription management */}
      {activeSubscription && (
        <div className="card p-5 space-y-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Active subscription</p>
            <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">Recurring</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span>{activeSubscription.tier_conversations.toLocaleString('en-ZA')} AI conv. / month</span>
            <span className="capitalize">{activeSubscription.billing_period} billing</span>
          </div>
          <ManageSubButton subscriptionCode={activeSubscription.subscription_code} />
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", billing === "monthly" ? "text-slate-900" : "text-slate-400")}>Monthly</span>
        <button
          onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
          className={cn("w-12 h-6 rounded-full relative transition-colors", billing === "annual" ? "bg-whatsapp-teal" : "bg-slate-200")}
        >
          <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", billing === "annual" ? "translate-x-7" : "translate-x-1")} />
        </button>
        <span className={cn("text-sm font-medium flex items-center gap-1.5", billing === "annual" ? "text-slate-900" : "text-slate-400")}>
          Annual
          <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Save 20%</span>
        </span>
      </div>

      {/* Two-column pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Platform plan */}
        <div className="card p-6 space-y-4 border-2 border-whatsapp-teal/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-whatsapp-teal/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-whatsapp-teal" />
            </div>
            <p className="font-semibold text-slate-900">Platform</p>
          </div>
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-slate-900">R{platformMonthly.toLocaleString('en-ZA')}</span>
              <span className="text-slate-400 text-sm mb-1">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">WhatsApp messaging, team, flows & dashboard</p>
          </div>
          <div className="space-y-2">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-whatsapp-teal flex-shrink-0" />
                <span className="text-xs text-slate-600">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Bot plan */}
        <div className="card p-6 space-y-4 border-2 border-purple-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">AI Add-on</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <p className="font-semibold text-slate-900">AI Bot – WhatsApp</p>
          </div>
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-slate-900">R{aiMonthly.toLocaleString('en-ZA')}</span>
              <span className="text-slate-400 text-sm mb-1">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{tier.conversations.toLocaleString('en-ZA')} AI conversations / month</p>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Conversations / month</span>
              <span className="font-semibold text-purple-700">{tier.conversations.toLocaleString('en-ZA')}</span>
            </div>
            <input
              type="range"
              min={0} max={TIERS.length - 1}
              value={tierIdx}
              onChange={(e) => setTierIdx(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-1">
              {TIERS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTierIdx(i)}
                  className={cn(
                    "text-xs py-1.5 rounded-lg font-medium transition-colors",
                    tierIdx === i ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {(t.conversations / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Tier table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Conversations</th>
                  <th className="text-right px-3 py-2 text-slate-500 font-semibold">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {TIERS.map((t, i) => {
                  const isActiveTier =
                    activeSubscription !== null &&
                    t.conversations === activeSubscription.tier_conversations &&
                    billing === activeSubscription.billing_period;
                  return (
                    <tr
                      key={i}
                      onClick={() => setTierIdx(i)}
                      className={cn("cursor-pointer transition-colors", tierIdx === i ? "bg-purple-50" : "hover:bg-slate-50")}
                    >
                      <td className="px-3 py-2 flex items-center gap-1.5">
                        {tierIdx === i && <ChevronRight className="w-3 h-3 text-purple-600" />}
                        <MessageCircle className={cn("w-3 h-3", tierIdx === i ? "text-purple-600" : "text-slate-300")} />
                        <span className={cn("font-medium", tierIdx === i ? "text-purple-800" : "text-slate-600")}>
                          {t.conversations.toLocaleString('en-ZA')}
                        </span>
                        {isActiveTier && (
                          <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                        )}
                      </td>
                      <td className={cn("px-3 py-2 text-right font-semibold", tierIdx === i ? "text-purple-700" : "text-slate-600")}>
                        R{t.monthly.toLocaleString('en-ZA')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Total + CTA */}
      <div className="card p-6 border-2 border-whatsapp-teal/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">Platform</p>
            <p className="text-lg font-semibold text-slate-800">R{platformMonthly.toLocaleString('en-ZA')} / mo</p>
          </div>
          <span className="text-slate-300 text-xl font-light">+</span>
          <div>
            <p className="text-sm text-slate-500">AI Bot ({tier.conversations.toLocaleString('en-ZA')} conv.)</p>
            <p className="text-lg font-semibold text-purple-700">R{aiMonthly.toLocaleString('en-ZA')} / mo</p>
          </div>
          <span className="text-slate-300 text-xl font-light">=</span>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">R{totalMonthly.toLocaleString('en-ZA')} / mo</p>
          </div>
        </div>

        {billing === "annual" && (
          <p className="text-xs text-green-600 font-medium mb-4 text-center">
            You save R{annualSaving.toLocaleString('en-ZA')} per year on the annual plan
          </p>
        )}

        {isCurrentPlan ? (
          <div className="w-full py-3 text-base flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-200 text-green-700 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            This is your current plan
          </div>
        ) : (
          <form action={startPayment}>
            <input type="hidden" name="tierIdx" value={tierIdx} />
            <input type="hidden" name="billing" value={billing} />
            <button type="submit" className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              {activeSubscription ? "Switch plan" : isPaid ? "Change plan" : "Upgrade"} — R{totalMonthly.toLocaleString('en-ZA')} / month
            </button>
          </form>
        )}
        <p className="text-xs text-center text-slate-400 mt-3">
          {activeSubscription && !isCurrentPlan
            ? "Your current subscription will be cancelled and the new plan activated immediately."
            : "Secure payment · Cancel anytime · VAT may apply"}
        </p>
      </div>

      {/* Invoices */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Payment history</h2>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No payments yet.</p>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 font-semibold">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-right px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => {
                  const date = new Date(inv.paid_at ?? inv.created_at);
                  const label = `Platform + AI (${(inv.tier_conversations / 1000).toFixed(0)}k conv.) · ${inv.billing_period === "annual" ? "Annual" : "Monthly"}`;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{label}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs truncate max-w-[140px]">
                        {inv.paystack_reference}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                        R{n(inv.amount_cents / 100)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          inv.status === "success"  && "bg-green-100 text-green-700",
                          inv.status === "pending"  && "bg-yellow-100 text-yellow-700",
                          inv.status === "failed"   && "bg-red-100 text-red-600",
                        )}>
                          {inv.status === "success" ? "Paid" : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Frequently asked questions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-slate-800">What counts as a conversation?</p>
            <p className="text-slate-500 mt-1">A conversation is a single AI-handled WhatsApp thread within a 24-hour window. Human-agent replies do not count toward your AI usage.</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="font-medium text-slate-800">Can I change my conversation tier?</p>
            <p className="text-slate-500 mt-1">Yes. You can upgrade or downgrade your AI tier at any time. Changes take effect at the start of your next billing period.</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="font-medium text-slate-800">What happens if I exceed my conversation limit?</p>
            <p className="text-slate-500 mt-1">You'll receive a notification and the AI bot will pause until you upgrade your tier or the next billing period begins.</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="font-medium text-slate-800">What payment methods are accepted?</p>
            <p className="text-slate-500 mt-1">We accept all major credit and debit cards. EFT and invoicing available for annual plans on request.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
