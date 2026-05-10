import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: org } = await supabase.from("organizations").select("is_active").eq("id", params.id).single();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("organizations").update({ is_active: !org.is_active }).eq("id", params.id);
  return NextResponse.redirect(new URL("/admin", _req.url));
}
