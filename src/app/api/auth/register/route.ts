import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { createSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, orgName } = await request.json();

    if (!name || !email || !password || !orgName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const supabase = createAdminClient();
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      console.error("[register] lookup error:", lookupError);
      return NextResponse.json(
        { error: "Unable to verify account state. Please try again." },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const slugBase = orgName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "organization";
    const slug = `${slugBase}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName.trim(), slug, plan: "free" })
      .select("id")
      .single();

    if (orgError || !organization?.id) {
      console.error("[register] organization insert error:", orgError);
      return NextResponse.json(
        { error: orgError?.message ?? "Failed to create organization" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        name: name.trim(),
        password_hash: passwordHash,
        org_id: organization.id,
        role: "admin",
        is_active: true,
      })
      .select("id")
      .single();

    if (userError || !user?.id) {
      console.error("[register] user insert error:", userError);
      await supabase.from("organizations").delete().eq("id", organization.id);
      return NextResponse.json(
        { error: userError?.message ?? "Failed to create account" },
        { status: 400 }
      );
    }

    const { error: memberError } = await supabase.from("org_members").insert({
      org_id: organization.id,
      user_id: user.id,
      role: "org_admin",
      is_active: true,
    });

    if (memberError) {
      console.error("[register] org_members insert error:", memberError);
      await supabase.from("users").delete().eq("id", user.id);
      await supabase.from("organizations").delete().eq("id", organization.id);
      return NextResponse.json(
        { error: memberError.message ?? "Failed to create team membership" },
        { status: 400 }
      );
    }

    const { error: settingsError } = await supabase.from("org_settings").insert({
      org_id: organization.id,
      auto_reply_enabled: false,
      auto_reply_message: "",
      business_hours_enabled: false,
    });

    if (settingsError) {
      console.error("[register] org_settings insert error:", settingsError);
      await supabase.from("org_members").delete().eq("user_id", user.id);
      await supabase.from("users").delete().eq("id", user.id);
      await supabase.from("organizations").delete().eq("id", organization.id);
      return NextResponse.json(
        { error: settingsError.message ?? "Failed to create organization settings" },
        { status: 400 }
      );
    }

    const sessionToken = createSession(user.id, normalizedEmail);
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
    const message = err instanceof Error ? err.message : "Unable to create account";
    console.error("[auth/register]", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
