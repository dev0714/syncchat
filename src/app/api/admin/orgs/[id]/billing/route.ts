import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { hasSuperAdminAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Super-admin toggle for whether an organization sees the "Billing" section.
 * The flag lives in organizations.settings.billing_enabled (JSONB) so no schema
 * change is needed. Absent/true => Billing shown; false => hidden from the
 * dashboard sidebar for that org's users.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = await hasSuperAdminAccess(currentUser.userId, currentUser.role);
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  let action: string;
  if (contentType.includes("application/json")) {
    const body = await request.json();
    action = body.action;
  } else {
    const form = await request.formData();
    action = form.get("action") as string;
  }

  const supabase = createAdminClient();

  // Merge into existing settings so other keys are preserved.
  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", params.id)
    .maybeSingle();

  const settings = (org?.settings as Record<string, unknown> | null) ?? {};
  const billingEnabled = action !== "disable"; // "disable" hides it; anything else enables

  const { error } = await supabase
    .from("organizations")
    .update({ settings: { ...settings, billing_enabled: billingEnabled } })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin", request.url));
}
