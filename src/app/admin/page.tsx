import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Building2, Users, Smartphone, MessageCircle, Shield, ToggleRight, ToggleLeft } from "lucide-react";
import { formatDate, ROLE_LABELS, ROLE_COLORS, cn } from "@/lib/utils";
import type { Organization } from "@/types";

export default async function SuperAdminPage() {
  const supabase = createAdminClient();

  const [
    { data: orgs, count: orgCount },
    { count: userCount },
    { count: instanceCount },
    { count: msgCount },
  ] = await Promise.all([
    supabase.from("organizations").select("*, org_members(count), whatsapp_instances(count)", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("whatsapp_instances").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Organizations", value: orgCount ?? 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Users", value: userCount ?? 0, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "WA Instances", value: instanceCount ?? 0, icon: Smartphone, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Total Messages", value: msgCount ?? 0, icon: MessageCircle, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const planColors: Record<string, string> = {
    free: "bg-slate-100 text-slate-700",
    starter: "bg-blue-100 text-blue-700",
    pro: "bg-green-100 text-green-700",
    enterprise: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-900 shadow-sm">
          <Building2 className="w-4 h-4" /> Organizations
        </Link>
        <Link href="/admin/instances" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <Smartphone className="w-4 h-4" /> Assign Instances
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`${bg} p-2.5 rounded-xl`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Organizations table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">All Organizations ({orgCount ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Organization</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Members</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Instances</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(orgs ?? []).map((org) => {
                const o = org as Organization & {
                  org_members: { count: number }[];
                  whatsapp_instances: { count: number }[];
                };
                const memberCount = Array.isArray(o.org_members) ? (o.org_members[0] as Record<string, number>)?.count ?? 0 : 0;
                const instCount = Array.isArray(o.whatsapp_instances) ? (o.whatsapp_instances[0] as Record<string, number>)?.count ?? 0 : 0;
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-whatsapp-teal/10 rounded-lg flex items-center justify-center text-whatsapp-teal font-bold text-sm">
                          {o.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{o.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{o.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("badge capitalize", planColors[o.plan])}>{o.plan}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{memberCount}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{instCount}</td>
                    <td className="px-5 py-3.5">
                      {o.is_active
                        ? <div className="flex items-center gap-1.5 text-green-600 text-xs"><ToggleRight className="w-4 h-4" /> Active</div>
                        : <div className="flex items-center gap-1.5 text-slate-400 text-xs"><ToggleLeft className="w-4 h-4" /> Inactive</div>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <AdminOrgActions orgId={o.id} isActive={o.is_active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminOrgActions({ orgId, isActive }: { orgId: string; isActive: boolean }) {
  return (
    <form action={`/api/admin/orgs/${orgId}/toggle`} method="POST">
      <button type="submit"
        className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
          isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100")}>
        {isActive ? "Deactivate" : "Activate"}
      </button>
    </form>
  );
}
