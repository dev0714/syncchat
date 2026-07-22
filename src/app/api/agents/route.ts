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

const AGENT_ROLES = ["agent", "org_admin", "super_admin"];

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ agents: [], queue: [], myRole: user.role ?? "", myUserId: user.userId, settings: {} });

  const supabase = createAdminClient();

  // Caller's role within this org (used by the UI to gate admin-only controls).
  const { data: me } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.userId)
    .maybeSingle();
  const myRole = user.role === "super_admin" ? "super_admin" : (me?.role ?? "");

  const [{ data: members }, { data: openConvs }, { data: settings }, { data: orgRowResult }] = await Promise.all([
    supabase
      .from("org_members")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .in("role", AGENT_ROLES)
      .order("created_at", { ascending: true }),
    supabase
      .from("conversations")
      .select("id, assigned_to, status, last_message, last_message_at, contact:contacts(id, name, phone), last_msg:messages(direction, sent_by, created_at)")
      .eq("org_id", orgId)
      .eq("status", "open")
      .order("last_message_at", { ascending: true })
      .order("created_at", { ascending: false, referencedTable: "last_msg" })
      .limit(1, { referencedTable: "last_msg" }),
    supabase.from("org_settings").select("holding_enabled, holding_message, holding_interval_minutes").eq("org_id", orgId).maybeSingle(),
    supabase.from("organizations").select("settings").eq("id", orgId).maybeSingle(),
  ]);
  // Auto-return-to-AI settings live on organizations.settings (JSONB, no schema change).
  const orgSettingsJson = (orgRowResult?.settings || {}) as Record<string, unknown>;

  // Resolve agent display names from the users table (org_members.user_id == users.id).
  const memberUserIds = (members ?? []).map((m: Record<string, unknown>) => m.user_id as string);
  const userInfo = new Map<string, { name?: string | null; email?: string | null }>();
  if (memberUserIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", memberUserIds);
    for (const u of users ?? []) {
      const uu = u as Record<string, unknown>;
      userInfo.set(uu.id as string, { name: (uu.name as string) ?? null, email: (uu.email as string) ?? null });
    }
  }

  // Count live open chats per assigned agent.
  const activeCounts = new Map<string, number>();
  for (const c of openConvs ?? []) {
    const a = (c as Record<string, unknown>).assigned_to as string | null;
    if (a) activeCounts.set(a, (activeCounts.get(a) ?? 0) + 1);
  }

  const agents = (members ?? []).map((m: Record<string, unknown>) => {
    const info = userInfo.get(m.user_id as string);
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      is_available: m.is_available ?? false,
      last_assigned_at: m.last_assigned_at ?? null,
      name: info?.name ?? info?.email ?? "Agent",
      email: info?.email ?? null,
      active_chats: activeCounts.get(m.user_id as string) ?? 0,
    };
  });

  // Build the "awaiting a human" queue with assignee names.
  const nameByUserId = new Map<string, string>();
  for (const a of agents) nameByUserId.set(a.user_id as string, a.name);

  const queue = (openConvs ?? [])
    .map((c: Record<string, unknown>) => {
      const lastMsg = Array.isArray(c.last_msg) ? c.last_msg[0] : c.last_msg;
      const repliedByAgent = !!(lastMsg && lastMsg.direction === "outbound" && lastMsg.sent_by);
      const contact = c.contact as { name?: string; phone?: string } | null;
      return {
        id: c.id,
        contact_name: contact?.name ?? contact?.phone ?? "Unknown",
        last_message: c.last_message ?? null,
        last_message_at: c.last_message_at ?? null,
        assigned_to: c.assigned_to ?? null,
        assigned_name: c.assigned_to ? (nameByUserId.get(c.assigned_to as string) ?? "Assigned") : null,
        awaiting: !repliedByAgent,
      };
    })
    .filter((c: { awaiting: boolean }) => c.awaiting);

  const mergedSettings = {
    ...(settings ?? {}),
    holding_return_minutes: Number(orgSettingsJson.holding_return_minutes) || 0,
    holding_return_message: typeof orgSettingsJson.holding_return_message === "string" ? orgSettingsJson.holding_return_message : "",
  };

  return NextResponse.json({ agents, queue, myRole, myUserId: user.userId, settings: mergedSettings, orgId });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId(user.userId, user.orgId);
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const memberId = String(body.memberId ?? "").trim();
  if (!memberId || typeof body.is_available !== "boolean") {
    return NextResponse.json({ error: "memberId and is_available are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Load the target member (scoped to this org).
  const { data: target } = await supabase
    .from("org_members")
    .select("id, user_id")
    .eq("id", memberId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Anyone may toggle their own availability; only admins may toggle others.
  const isSelf = target.user_id === user.userId;
  if (!isSelf) {
    const { data: me } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.userId)
      .maybeSingle();
    const role = user.role === "super_admin" ? "super_admin" : (me?.role ?? "");
    if (role !== "org_admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("org_members")
    .update({ is_available: body.is_available })
    .eq("id", memberId)
    .eq("org_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
