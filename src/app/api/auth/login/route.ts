import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: "syncchat" },
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    return response;
  } catch (error) {
    console.error("[auth/login] unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
