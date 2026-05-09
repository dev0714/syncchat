import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("id, email, name, password_hash, is_active")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionToken = createSession(user.id, user.email);
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "Unable to sign in. Please try again." },
      { status: 500 }
    );
  }
}
