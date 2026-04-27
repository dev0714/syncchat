import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Get member record with org + profile
  const { data: member } = await supabase
    .from("org_members")
    .select(`
      *,
      organization:organizations(*),
      profile:profiles(*)
    `)
    .eq("user_id", user.id)
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
    <div className="min-h-screen bg-slate-50 grid grid-cols-[16rem_1fr] isolate">
      <div className="sticky top-0 h-screen w-64 shrink-0 relative z-50">
        <Sidebar member={member} />
      </div>
      <main className="relative z-0 min-h-screen min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
