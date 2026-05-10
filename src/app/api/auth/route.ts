/**
 * Custom Authentication API
 * POST /api/auth/login - Login with email and password
 * POST /api/auth/logout - Logout
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { createSession } from "@/lib/auth/session";

// Password hashing functions using bcrypt
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function POST(request: NextRequest) {
  try {
    console.log("[CustomAuth API] Received POST request");
    console.log("[CustomAuth API] Content-Type:", request.headers.get("content-type"));
    
    let body;
    try {
      // Clone request to ensure we can read it
      const clonedRequest = request.clone();
      body = await clonedRequest.json();
      console.log("[CustomAuth API] Parsed body keys:", Object.keys(body));
    } catch (parseErr: any) {
      console.error("[CustomAuth API] JSON parse error:", parseErr.message);
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const email = body?.email;
    const password = body?.password;
    console.log("[CustomAuth API] Email:", email, "Password exists:", !!password);

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Query the syncchat.users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (userError || !user) {
      console.error("[CustomAuth] User lookup error:", userError);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("[CustomAuth] User found:", user.email);

    // Verify password (bcrypt comparison is async)
    const passwordMatches = await verifyPassword(password, user.password_hash);
    console.log("[CustomAuth] Password matches:", passwordMatches);
    
    if (!passwordMatches) {
      console.error("[CustomAuth] Password verification failed for:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = createSession(user.id, user.email);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("[CustomAuth API] Error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
