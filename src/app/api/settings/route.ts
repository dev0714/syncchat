import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolveOrgId(userId: string, userOrgId: string | null) {
  if (userOrgId) return userOrgId;
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return member?.org_id ?? null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const { data: memberData } = await supabase
    .from("org_members")
    .select("*, organization:organizations(*)")
    .eq("user_id", user.userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!memberData) {
    return NextResponse.json({ org: null, settings: null, members: [], myRole: user.role ?? "", orgId: null });
  }

  const orgId = memberData.org_id;

  const [{ data: orgSettings }, { data: team }] = await Promise.all([
    supabase.from("org_settings").select("*").eq("org_id", orgId).maybeSingle(),
    supabase.from("org_members").select("*, profile:profiles(*)").eq("org_id", orgId).order("created_at"),
  ]);

  return NextResponse.json({
    org: memberData.organization,
    orgId,
    myRole: user.role === "super_admin" ? "super_admin" : memberData.role,
    settings: orgSettings ?? {},
    members: team ?? [],
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const body = await req.json();
  const { type, ...fields } = body;

  if (type === "org_name") {
    const { error } = await supabase.from("organizations").update({ name: fields.name }).eq("id", orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (type === "general") {
    await supabase.from("organizations").update({ name: fields.orgName }).eq("id", orgId);
    const { data: existing } = await supabase.from("org_settings").select("id").eq("org_id", orgId).maybeSingle();
    const settingsUpdate = {
      auto_reply_enabled: fields.auto_reply_enabled,
      auto_reply_message: fields.auto_reply_message,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      await supabase.from("org_settings").update(settingsUpdate).eq("org_id", orgId);
    } else {
      await supabase.from("org_settings").insert({ org_id: orgId, ...settingsUpdate });
    }
    return NextResponse.json({ success: true });
  }

  if (type === "integrations") {
    const { data: existing } = await supabase.from("org_settings").select("id").eq("org_id", orgId).maybeSingle();
    const update = { n8n_base_url: fields.n8n_base_url, n8n_api_key: fields.n8n_api_key, updated_at: new Date().toISOString() };
    if (existing) {
      await supabase.from("org_settings").update(update).eq("org_id", orgId);
    } else {
      await supabase.from("org_settings").insert({ org_id: orgId, ...update });
    }
    return NextResponse.json({ success: true });
  }

  if (type === "profile") {
    const update: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };
    delete update.type;
    if (fields.company_name) {
      await supabase.from("organizations").update({ name: fields.company_name }).eq("id", orgId);
    }
    const { data: existing } = await supabase.from("org_settings").select("id").eq("org_id", orgId).maybeSingle();
    if (existing) {
      await supabase.from("org_settings").update(update).eq("org_id", orgId);
    } else {
      await supabase.from("org_settings").insert({ org_id: orgId, ...update });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown update type" }, { status: 400 });
}
