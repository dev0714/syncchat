import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import MobileShell from "@/components/layout/MobileShell";

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
  if (!isSuperAdmin) redirect("/dashboard");

  const sidebarMember =
    member ?? {
      id: currentUser.userId,
      org_id: currentUser.orgId ?? "",
      user_id: currentUser.userId,
      role: "super_admin",
      is_active: true,
      created_at: new Date().toISOString(),
      organization: null,
      profile: null,
      user: {
        name: currentUser.name ?? undefined,
        email: currentUser.email,
        role: "super_admin",
      },
    };

  return (
    <MobileShell
      member={{
        ...sidebarMember,
        role: isSuperAdmin ? "super_admin" : sidebarMember.role,
        user: {
          name: currentUser.name ?? undefined,
          email: currentUser.email,
          role: currentUser.role,
        },
      }}
      mainClassName="mt-14 h-[calc(100vh-3.5rem)] overflow-y-auto md:mt-0 md:ml-64 md:h-screen"
    >
      {children}
    </MobileShell>
  );
}
