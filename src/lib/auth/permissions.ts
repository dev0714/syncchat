import { createAdminClient } from "@/lib/supabase/admin";

export async function hasSuperAdminAccess(userId: string, userRole: string | null) {
  if (userRole === "super_admin") {
    return true;
  }

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();

  return !!member;
}
