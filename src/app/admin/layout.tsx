import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("org_members")
    .select("*, organization:organizations(*), profile:profiles(*)")
    .eq("user_id", currentUser.userId)
    .eq("role", "super_admin")
    .single();

  if (!member) redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar member={{ ...member, user: { name: currentUser.name ?? undefined, email: currentUser.email } }} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
