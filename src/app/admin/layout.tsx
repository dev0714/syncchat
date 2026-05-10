import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("org_members")
    .select("*, organization:organizations(*), profile:profiles(*)")
    .eq("user_id", currentUser.userId)
    .maybeSingle();

  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);
  if (!isSuperAdmin || !member) redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        member={{
          ...member,
          role: isSuperAdmin ? "super_admin" : member.role,
          user: {
            name: currentUser.name ?? undefined,
            email: currentUser.email,
            role: currentUser.role,
          },
        }}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
