import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";
import { getTrialUsage } from "@/lib/trial";

/** Trial message usage for the signed-in user's org (drives the usage banner). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let orgId = user.orgId;
  if (!orgId) {
    const supabase = createAdminClient();
    const { data: member } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    orgId = member?.org_id ?? null;
  }
  if (!orgId) return NextResponse.json({ isTrial: false });

  const usage = await getTrialUsage(orgId);
  return NextResponse.json(usage);
}
