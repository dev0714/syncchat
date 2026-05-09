import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
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
      <main className="relative z-0 min-h-screen min-w-0 overflow-x-hidden ml-64 w-[calc(100%-16rem)]">
        <DashboardTransition>
          {children}
        </DashboardTransition>
      </main>
    </div>
  );
}
