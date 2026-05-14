import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { format, subDays, startOfMonth } from "date-fns";
import { MessageCircle, Users, Zap, CalendarClock, CreditCard } from "lucide-react";
import TrendChart, { type DashboardTrendPoint } from "@/components/dashboard/TrendChart";
import { cn } from "@/lib/utils";

interface DashboardPageProps {
  searchParams?: {
    start?: string;
    end?: string;
  };
}

function parseDateInput(value?: string, fallback?: Date): Date {
  if (!value) {
    if (!fallback) throw new Error("Missing date input.");
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    if (!fallback) throw new Error("Invalid date input.");
    return fallback;
  }

  return parsed;
}

function buildSeries(
  startDate: Date,
  endDate: Date,
  conversations: { created_at: string }[],
  bulkMessages: { created_at: string }[]
): DashboardTrendPoint[] {
  const points: DashboardTrendPoint[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const finalDay = new Date(endDate);
  finalDay.setHours(23, 59, 59, 999);

  while (cursor.getTime() <= finalDay.getTime()) {
    const day = new Date(cursor);
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    const startMs = start.getTime();
    const endMs = end.getTime();

    points.push({
      label: format(day, "MMM d"),
      conversations: conversations.filter((item) => {
        const created = new Date(item.created_at).getTime();
        return created >= startMs && created <= endMs;
      }).length,
      bulkMessages: bulkMessages.filter((item) => {
        const created = new Date(item.created_at).getTime();
        return created >= startMs && created <= endMs;
      }).length,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", currentUser.userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) redirect("/dashboard/settings");

  const orgId = member.org_id;

  // Billing plan usage
  const { data: org } = await supabase.from("organizations").select("plan").eq("id", orgId).single();
  const { data: activeSub } = await supabase
    .from("billing_subscriptions")
    .select("tier_conversations, billing_period, paid_at, created_at")
    .eq("org_id", orgId)
    .eq("status", "success")
    .not("subscription_code", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tierLimit = activeSub?.tier_conversations ?? null;
  const billingPeriodStart = activeSub
    ? (() => {
        const base = new Date(activeSub.paid_at ?? activeSub.created_at);
        if (activeSub.billing_period === "annual") {
          return new Date(base.getFullYear(), base.getMonth(), base.getDate());
        }
        return startOfMonth(new Date());
      })()
    : startOfMonth(new Date());

  const { count: periodConversations } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", billingPeriodStart.toISOString());

  const usedConversations = periodConversations ?? 0;

  const endDate = parseDateInput(searchParams?.end, new Date());
  const startDate = parseDateInput(searchParams?.start, subDays(endDate, 13));
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);
  const startISO = normalizedStart.toISOString();
  const endISO = normalizedEnd.toISOString();

  const [
    contactsRes,
    conversationsRes,
    messagesRes,
    bulkMessagesRes,
    recentConversationsRes,
    recentBulkRes,
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("direction", "outbound"),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("direction", "outbound").in("source", ["bulk", "scheduled_bulk"]),
    supabase.from("conversations").select("created_at").eq("org_id", orgId).gte("created_at", startISO).lte("created_at", endISO),
    supabase
      .from("messages")
      .select("created_at")
      .eq("org_id", orgId)
      .eq("direction", "outbound")
      .in("source", ["bulk", "scheduled_bulk"])
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: true }),
  ]);

  const contactCount = contactsRes.count ?? 0;
  const conversationCount = conversationsRes.count ?? 0;
  const messageCount = messagesRes.count ?? 0;
  const bulkMessageCount = bulkMessagesRes.count ?? 0;
  const recentConversations = recentConversationsRes.data ?? [];
  const recentBulkMessages = recentBulkRes.data ?? [];

  const trendData = buildSeries(startDate, endDate, recentConversations, recentBulkMessages);

  const stats = [
    { label: "Contacts", value: contactCount.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Conversations", value: conversationCount.toLocaleString(), icon: MessageCircle, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Messages Sent", value: messageCount.toLocaleString(), icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Bulk Messages", value: bulkMessageCount.toLocaleString(), icon: CalendarClock, color: "text-whatsapp-teal", bg: "bg-whatsapp-teal/10" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto page-reveal">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your WhatsApp platform</p>
      </div>

      <form className="card p-4 flex flex-col md:flex-row md:items-end gap-4 reveal-card" style={{ animationDelay: "40ms" }} action="/dashboard" method="get">
        <div className="flex-1">
          <label className="label">Start date</label>
          <input
            className="input"
            type="date"
            name="start"
            defaultValue={normalizedStart.toISOString().slice(0, 10)}
          />
        </div>
        <div className="flex-1">
          <label className="label">End date</label>
          <input
            className="input"
            type="date"
            name="end"
            defaultValue={normalizedEnd.toISOString().slice(0, 10)}
          />
        </div>
        <button type="submit" className="btn-primary inline-flex items-center justify-center gap-2 md:min-w-40">
          Apply Filter
        </button>
      </form>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="card p-5 reveal-card"
            style={{ animationDelay: `${80 + stats.findIndex((item) => item.label === label) * 70}ms` }}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] gap-6">
        <div className="card p-6 reveal-card" style={{ animationDelay: "360ms" }}>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">Activity Trend</h2>
              <p className="text-sm text-slate-500 mt-1">
                Conversations started vs bulk messages sent from {format(normalizedStart, "PP")} to {format(normalizedEnd, "PP")}.
              </p>
            </div>
            <div className="text-xs text-slate-400">South Africa time</div>
          </div>
          <TrendChart data={trendData} />
        </div>

        <div className="space-y-4">
          <div className="card p-6 space-y-4 reveal-card" style={{ animationDelay: "440ms" }}>
            <div>
              <h2 className="font-semibold text-slate-900">Quick Notes</h2>
              <p className="text-sm text-slate-500 mt-1">Your live operational summary.</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Active contacts</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">{contactCount.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Conversation count</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">{conversationCount.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Bulk volume</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">{bulkMessageCount.toLocaleString()} messages</p>
              </div>
            </div>
          </div>

          {/* Plan usage */}
          <div className="card p-6 space-y-4 reveal-card" style={{ animationDelay: "500ms" }}>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Plan Usage</h2>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500 capitalize">{org?.plan ?? "free"} plan · this month</span>
                <span className="text-xs font-semibold text-slate-700">
                  {usedConversations.toLocaleString()}
                  {tierLimit ? ` / ${tierLimit.toLocaleString()}` : ""}
                </span>
              </div>
              {tierLimit ? (
                <>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        usedConversations / tierLimit >= 0.9 ? "bg-red-500" :
                        usedConversations / tierLimit >= 0.7 ? "bg-amber-400" :
                        "bg-whatsapp-teal"
                      )}
                      style={{ width: `${Math.min(100, (usedConversations / tierLimit) * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {Math.max(0, tierLimit - usedConversations).toLocaleString()} conversations remaining
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  No active subscription — <a href="/dashboard/billing" className="text-whatsapp-teal hover:underline">upgrade to set a limit</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
