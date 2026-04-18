import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = request.cookies.get(name)?.value;
            if (!value) return undefined;
            try {
              return decodeURIComponent(value);
            } catch {
              return value;
            }
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            response.cookies.set(name, value, options);
          },
          remove(name: string) {
            response.cookies.delete(name);
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
