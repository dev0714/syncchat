import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members")
    .select("*, organization:organizations(*), profile:profiles(*)")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .single();

  if (!member) redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar member={member} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
