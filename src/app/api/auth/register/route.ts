import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import type { RegistrationData } from "@/types";

function flattenRegistration(data: RegistrationData) {
  const addr = data.address;
  const base = {
    account_type:        data.account_type,
    phone:               data.phone,
    address_unit:        addr.unit ?? null,
    address_street:      addr.street,
    address_suburb:      addr.suburb,
    address_city:        addr.city,
    address_postal_code: addr.postal_code,
    address_province:    addr.province,
  };
  if (data.account_type === "company") {
    return {
      ...base,
      industry:     data.industry,
      company_size: data.company_size,
      website:      data.website ?? null,
      vat_number:   data.vat ?? null,
    };
  }
  return {
    ...base,
    id_number:  data.id_number,
    hear_about: data.hear_about,
    use_case:   data.use_case,
  };
}

type RegistrationResult = {
  userId: string;
  orgId: string;
  email: string;
};

async function registerWithAdminClient(args: {
  name: string;
  email: string;
  passwordHash: string;
  orgName: string;
  registrationData: RegistrationData;
}): Promise<RegistrationResult> {
  const { name, email, passwordHash, orgName, registrationData } = args;
  const supabase = createAdminClient();

  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(`Unable to verify account state. ${lookupError.message}`);
  if (existingUser) throw new Error("An account with this email already exists");

  const slugBase =
    orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "organization";
  const slug = `${slugBase}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName.trim(), slug, plan: "free", trial_ends_at: trialEndsAt })
    .select("id")
    .single();

  if (orgError || !organization?.id) throw new Error(orgError?.message ?? "Failed to create organization");

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({ email, name: name.trim(), password_hash: passwordHash, org_id: organization.id, role: "admin", is_active: true })
    .select("id")
    .single();

  if (userError || !user?.id) {
    await supabase.from("organizations").delete().eq("id", organization.id);
    throw new Error(userError?.message ?? "Failed to create account");
  }

  const { error: memberError } = await supabase.from("org_members").insert({
    org_id: organization.id, user_id: user.id, role: "org_admin", is_active: true,
  });

  if (memberError) {
    await supabase.from("users").delete().eq("id", user.id);
    await supabase.from("organizations").delete().eq("id", organization.id);
    throw new Error(memberError.message ?? "Failed to create team membership");
  }

  const { error: settingsError } = await supabase.from("org_settings").insert({
    org_id: organization.id,
    auto_reply_enabled: false,
    auto_reply_message: "",
    business_hours_enabled: false,
    ...flattenRegistration(registrationData),
  });

  if (settingsError) {
    await supabase.from("org_members").delete().eq("user_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);
    await supabase.from("organizations").delete().eq("id", organization.id);
    throw new Error(settingsError.message ?? "Failed to create organization settings");
  }

  return { userId: user.id, orgId: organization.id, email };
}

async function registerWithRpc(args: {
  name: string;
  email: string;
  passwordHash: string;
  orgName: string;
  registrationData: RegistrationData;
}): Promise<RegistrationResult> {
  const { name, email, passwordHash, orgName, registrationData } = args;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("register_account_and_organization", {
    p_name: name.trim(),
    p_email: email,
    p_password_hash: passwordHash,
    p_org_name: orgName.trim(),
  });

  if (error) {
    throw new Error(
      error.message.includes("register_account_and_organization")
        ? "Signup database function is missing. Apply the syncchat.register_account_and_organization migration in Supabase."
        : error.message
    );
  }

  const created = Array.isArray(data) ? data[0] : data;
  const userId = created?.user_id;
  const orgId  = created?.org_id;
  if (!userId || !orgId) throw new Error("Failed to create account");

  // Persist registration data (best-effort — org was already created by rpc)
  await createAdminClient()
    .from("org_settings")
    .update(flattenRegistration(registrationData))
    .eq("org_id", orgId);

  return { userId, orgId, email };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      password?: string;
      orgName?: string;
      accountType?: string;
      registrationData?: unknown;
      agreedToTerms?: unknown;
    };

    const { name, email, password, orgName, accountType, registrationData, agreedToTerms } = body;

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!accountType || (accountType !== "company" && accountType !== "personal")) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }
    if (!agreedToTerms) {
      return NextResponse.json({ error: "You must accept the Terms & Conditions" }, { status: 400 });
    }
    if (!registrationData || typeof registrationData !== "object") {
      return NextResponse.json({ error: "Registration details are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash    = await bcrypt.hash(password, 12);
    const regData = registrationData as RegistrationData;
    let account: RegistrationResult | null = null;

    try {
      account = await registerWithAdminClient({ name, email: normalizedEmail, passwordHash, orgName, registrationData: regData });
    } catch (err) {
      console.warn("[register] admin path failed, falling back to rpc:", err);
    }

    if (!account) {
      account = await registerWithRpc({ name, email: normalizedEmail, passwordHash, orgName, registrationData: regData });
    }

    const sessionToken = createSession(account.userId, normalizedEmail);
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
