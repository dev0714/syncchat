import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role, is_active")
    .eq("user_id", user.userId)
    .eq("is_active", true)
    .maybeSingle();

  return NextResponse.json({
    user,
    member: member ?? null,
  });
}
