import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { MessageCircle, Users, Zap, CalendarClock } from "lucide-react";
import TrendChart, { type DashboardTrendPoint } from "@/components/dashboard/TrendChart";
import { cn } from "@/lib/utils";

function buildSeries(
  days: number,
  conversations: { created_at: string }[],
  bulkMessages: { created_at: string }[]
): DashboardTrendPoint[] {
  const points: DashboardTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = subDays(new Date(), i);
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
  }

  return points;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) redirect("/dashboard/settings");

  const orgId = member.org_id;
  const startDate = subDays(new Date(), 13);
  const startISO = startDate.toISOString();

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
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("org_id", orgId).in("source", ["bulk", "scheduled_bulk"]),
    supabase.from("conversations").select("created_at").eq("org_id", orgId).gte("created_at", startISO),
    supabase
      .from("messages")
      .select("created_at")
      .eq("org_id", orgId)
      .eq("direction", "outbound")
      .in("source", ["bulk", "scheduled_bulk"])
      .gte("created_at", startISO)
      .order("created_at", { ascending: true }),
  ]);

  const contactCount = contactsRes.count ?? 0;
  const conversationCount = conversationsRes.count ?? 0;
  const messageCount = messagesRes.count ?? 0;
  const bulkMessageCount = bulkMessagesRes.count ?? 0;
  const recentConversations = recentConversationsRes.data ?? [];
  const recentBulkMessages = recentBulkRes.data ?? [];

  const trendData = buildSeries(14, recentConversations, recentBulkMessages);

  const stats = [
    { label: "Contacts", value: contactCount.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Conversations", value: conversationCount.toLocaleString(), icon: MessageCircle, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Messages Sent", value: messageCount.toLocaleString(), icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Bulk Messages", value: bulkMessageCount.toLocaleString(), icon: CalendarClock, color: "text-whatsapp-teal", bg: "bg-whatsapp-teal/10" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your WhatsApp platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] gap-6">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">Activity Trend</h2>
              <p className="text-sm text-slate-500 mt-1">Conversations started vs bulk messages sent over the last 14 days.</p>
            </div>
            <div className="text-xs text-slate-400">South Africa time</div>
          </div>
          <TrendChart data={trendData} />
        </div>

        <div className="card p-6 space-y-4">
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
      </div>
    </div>
  );
}
