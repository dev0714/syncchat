import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Wifi, WifiOff, Smartphone, MessageCircle, Users, Zap, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-green-100 text-green-700",
  disconnected: "bg-slate-100 text-slate-500",
  qr_required: "bg-yellow-100 text-yellow-700",
  loading: "bg-blue-100 text-blue-700",
};

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

  const [
    { data: instances },
    { count: contactCount },
    { count: conversationCount },
    { count: messageCount },
  ] = await Promise.all([
    supabase.from("whatsapp_instances").select("*").eq("org_id", orgId).order("created_at"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("org_id", orgId),
  ]);

  const connectedCount = (instances ?? []).filter((i) => i.status === "connected").length;
  const totalInstances = (instances ?? []).length;

  const stats = [
    { label: "Connected Instances", value: `${connectedCount} / ${totalInstances}`, icon: Smartphone, color: "text-whatsapp-teal", bg: "bg-whatsapp-teal/10" },
    { label: "Contacts", value: (contactCount ?? 0).toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Conversations", value: (conversationCount ?? 0).toLocaleString(), icon: MessageCircle, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Messages Sent", value: (messageCount ?? 0).toLocaleString(), icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your WhatsApp platform</p>
      </div>

      {/* Stats */}
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

      {/* WhatsApp Instances */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">WhatsApp Instances</h2>
          <span className="text-xs text-slate-400">{totalInstances} total</span>
        </div>

        {totalInstances === 0 ? (
          <div className="px-5 py-10 text-center">
            <Smartphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No instances assigned yet.</p>
            <p className="text-xs text-slate-400 mt-1">Contact your administrator to get a WhatsApp instance set up.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(instances ?? []).map((inst) => (
              <div key={inst.id} className="flex items-center gap-4 px-5 py-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  inst.status === "connected" ? "bg-green-50" : "bg-slate-100"
                )}>
                  {inst.status === "connected"
                    ? <Wifi className="w-5 h-5 text-green-600" />
                    : inst.status === "qr_required"
                    ? <QrCode className="w-5 h-5 text-yellow-500" />
                    : <WifiOff className="w-5 h-5 text-slate-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{inst.name}</p>
                  <p className="text-xs text-slate-400">{inst.phone_number ?? "No phone linked"}</p>
                </div>

                <div className="text-right">
                  <span className={cn("badge", STATUS_COLORS[inst.status] ?? "bg-slate-100 text-slate-500")}>
                    {inst.status === "qr_required" ? "Needs Scan" : inst.status}
                  </span>
                  {inst.status === "qr_required" && (
                    <p className="text-xs text-yellow-600 mt-1">Go to Instances → Refresh to scan QR</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
