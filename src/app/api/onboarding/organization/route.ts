import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("create_onboarding_organization", {
      org_name: trimmedName,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create organization" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, orgId: data });
  } catch (error) {
    console.error("[onboarding/organization] unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to create organization right now. Please try again." },
      { status: 500 }
    );
  }
}
