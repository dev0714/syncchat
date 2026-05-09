import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check super_admin
  const { data: member } = await supabase.from("org_members").select("role").eq("user_id", currentUser.userId).eq("role", "super_admin").single();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: org } = await supabase.from("organizations").select("is_active").eq("id", params.id).single();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("organizations").update({ is_active: !org.is_active }).eq("id", params.id);
  return NextResponse.redirect(new URL("/admin", _req.url));
}
