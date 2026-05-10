import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

function normalizeTags(tags: unknown): string[] | null {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return null;
}

async function resolveOrgId(userId: string, userOrgId: string | null) {
  if (userOrgId) return userOrgId;

  const supabase = createAdminClient();
  const { data: members, error } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return members?.[0]?.org_id ?? null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) {
    return NextResponse.json({ error: "No organization membership found." }, { status: 400 });
  }

  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  const updatePayload: Record<string, unknown> = {};
  if ("name" in body) updatePayload.name = body.name?.trim?.() || null;
  if ("phone" in body) updatePayload.phone = body.phone?.trim?.();
  if ("email" in body) updatePayload.email = body.email?.trim?.() || null;
  if ("tags" in body) updatePayload.tags = normalizeTags(body.tags);
  if ("metadata" in body) updatePayload.metadata = body.metadata ?? null;
  updatePayload.updated_at = new Date().toISOString();

  if (!updatePayload.phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updatePayload)
    .eq("id", id)
    .eq("org_id", orgId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ contact: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) {
    return NextResponse.json({ error: "No organization membership found." }, { status: 400 });
  }

  const { id } = params;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
