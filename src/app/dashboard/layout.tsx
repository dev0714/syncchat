import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import Sidebar from "@/components/layout/Sidebar";
import DashboardTransition from "@/components/layout/DashboardTransition";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("org_members")
    .select(`
      *,
      organization:organizations(*),
      user:users(id, name, email)
    `)
    .eq("user_id", currentUser.userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  // Trial gate — skip for super admins
  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);

  if (!isSuperAdmin && member?.organization) {
    const org = member.organization as { plan: string; trial_ends_at: string | null }
    const pathname = (await headers()).get("x-pathname") ?? ""
    const isOnBilling = pathname === "/dashboard/billing"

    const trialExpired =
      org.plan === "free" &&
      org.trial_ends_at !== null &&
      new Date(org.trial_ends_at) < new Date()

    if (trialExpired && !isOnBilling) {
      redirect("/dashboard/billing")
    }
  }

  if (!member) {
    return (
      <main className="min-h-screen bg-slate-50">
        {children}
      </main>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 z-50 w-64">
        <Sidebar member={member} />
      </div>
      <main className="relative z-0 h-screen min-w-0 ml-64 w-[calc(100%-16rem)] flex flex-col">
        <DashboardTransition>
          {children}
        </DashboardTransition>
      </main>
    </div>
  );
}
