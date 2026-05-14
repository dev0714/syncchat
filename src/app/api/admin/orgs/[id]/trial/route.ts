import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? ""
  let action: string
  if (contentType.includes("application/json")) {
    const body = await request.json()
    action = body.action
  } else {
    const form = await request.formData()
    action = form.get("action") as string
  }
  const supabase = createAdminClient();

  let trial_ends_at: string | null = null;

  if (action === "disable") {
    trial_ends_at = null; // null = no trial restriction
  } else if (action === "extend") {
    trial_ends_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  } else if (action === "expire") {
    trial_ends_at = new Date(Date.now() - 1000).toISOString(); // expire immediately
  }

  const { error } = await supabase
    .from("organizations")
    .update({ trial_ends_at })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin", request.url));
}
