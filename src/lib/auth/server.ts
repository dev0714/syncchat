import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type CurrentUser = {
  userId: string;
  email: string;
  name: string | null;
  orgId: string | null;
  role: string | null;
  isActive: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, org_id, role, is_active")
    .eq("id", session.userId)
    .maybeSingle();

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? null,
    orgId: user.org_id ?? null,
    role: user.role ?? null,
    isActive: user.is_active !== false,
  };
}
