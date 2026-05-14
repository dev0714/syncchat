import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

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

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ templates: [] });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [], orgId });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const body = await req.json();
  const { name, category, content, variables, msg_type } = body;
  if (!name || !content) return NextResponse.json({ error: "Name and content are required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("message_templates").insert({
    org_id: orgId, name, category: category ?? "custom", content, variables: variables ?? [],
    msg_type: msg_type ?? "text", is_active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, category, content, variables, is_active, msg_type } = body;
  if (!id) return NextResponse.json({ error: "Template ID required" }, { status: 400 });

  const supabase = createAdminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) update.name = name;
  if (category !== undefined) update.category = category;
  if (content !== undefined) { update.content = content; update.variables = variables ?? []; }
  if (msg_type !== undefined) update.msg_type = msg_type;
  if (is_active !== undefined) update.is_active = is_active;

  const { error } = await supabase.from("message_templates").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Template ID required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
