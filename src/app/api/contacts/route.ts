import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/server";

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
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

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) {
    return NextResponse.json({ error: "No organization membership found." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: contacts ?? [], orgId });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) {
    return NextResponse.json({ error: "No organization membership found." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const body = await request.json().catch(() => ({}));
  const entries: Array<Record<string, unknown>> = Array.isArray(body?.contacts)
    ? body.contacts
    : [body];
  const contacts = entries
    .map((entry) => ({
      org_id: orgId,
      name: typeof entry.name === "string" ? entry.name.trim() || null : null,
      phone: typeof entry.phone === "string" ? entry.phone.trim() : undefined,
      email: typeof entry.email === "string" ? entry.email.trim() || null : null,
      tags: normalizeTags(entry?.tags),
      metadata: entry?.metadata ?? null,
    }))
    .filter((entry) => entry.phone);

  if (contacts.length === 0) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  if (contacts.length === 1) {
    const { data, error } = await supabase
      .from("contacts")
      .insert(contacts[0])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ contact: data }, { status: 201 });
  }

  let success = 0;
  let failed = 0;
  const created: unknown[] = [];

  for (const contact of contacts) {
    const { data, error } = await supabase
      .from("contacts")
      .insert(contact)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      failed += 1;
      continue;
    }

    created.push(data);
    success += 1;
  }

  return NextResponse.json({ success, failed, contacts: created });
}
